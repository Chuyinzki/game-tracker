package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type config struct {
	port              string
	backlogServiceURL string
	eventsServiceURL   string
}

type trustedUser struct {
	userID string
	email  string
}

type backlogEntry struct {
	ID          string   `json:"id"`
	GameID      int      `json:"gameId"`
	GameName    string   `json:"gameName"`
	CoverURL    *string  `json:"coverUrl"`
	ReleaseYear *int     `json:"releaseYear"`
	Status      string   `json:"status"`
	Rating      *int     `json:"rating"`
	CreatedAt   string   `json:"createdAt"`
	UpdatedAt   string   `json:"updatedAt"`
}

type backlogStats struct {
	WantToPlay int      `json:"want_to_play"`
	Playing    int      `json:"playing"`
	Completed  int      `json:"completed"`
	Abandoned  int      `json:"abandoned"`
	AvgRating  *float64 `json:"avgRating"`
}

type recentEvent struct {
	EventID     string      `json:"eventId"`
	Type        string      `json:"type"`
	OccurredAt  time.Time   `json:"occurredAt"`
	UserID      string      `json:"userId"`
	BacklogItem backlogEntry `json:"backlogEntry"`
}

type dashboardInsights struct {
	TotalEntries     int      `json:"totalEntries"`
	CompletedEntries int      `json:"completedEntries"`
	AverageRating    *float64 `json:"averageRating"`
	RecentEventCount int      `json:"recentEventCount"`
	LatestEventType  *string  `json:"latestEventType"`
	LatestEventGame  *string  `json:"latestEventGame"`
	TopRatedGame     *string  `json:"topRatedGame"`
	RecentEvents     []recentEventSummary `json:"recentEvents"`
	GeneratedAt      string   `json:"generatedAt"`
}

type recentEventSummary struct {
	EventType string `json:"eventType"`
	GameName  string `json:"gameName"`
	Status    string `json:"status"`
	OccurredAt string `json:"occurredAt"`
}

type fetchResult[T any] struct {
	value T
	err   error
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func loadConfig() config {
	return config{
		port:              getEnv("GO_SERVICE_PORT", "3004"),
		backlogServiceURL: getEnv("BACKLOG_SERVICE_URL", "http://backlog-service:3002"),
		eventsServiceURL:  getEnv("EVENTS_SERVICE_URL", "http://events-service:3003"),
	}
}

func trustedUserFromRequest(r *http.Request) (trustedUser, error) {
	userID := r.Header.Get("x-user-id")
	email := r.Header.Get("x-user-email")
	if strings.TrimSpace(userID) == "" || strings.TrimSpace(email) == "" {
		return trustedUser{}, errors.New("missing trusted user context")
	}
	return trustedUser{userID: userID, email: email}, nil
}

func requestJSON[T any](ctx context.Context, client *http.Client, method, url string, headers map[string]string) (T, error) {
	var zero T

	req, err := http.NewRequestWithContext(ctx, method, url, nil)
	if err != nil {
		return zero, err
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		return zero, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return zero, fmt.Errorf("upstream %s returned status %d", url, resp.StatusCode)
	}

	var body T
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return zero, err
	}

	return body, nil
}

func fetchBacklog(ctx context.Context, client *http.Client, cfg config, user trustedUser) fetchResult[[]backlogEntry] {
	entries, err := requestJSON[[]backlogEntry](ctx, client, http.MethodGet, cfg.backlogServiceURL+"/backlog", map[string]string{
		"x-user-id":    user.userID,
		"x-user-email": user.email,
	})
	return fetchResult[[]backlogEntry]{value: entries, err: err}
}

func fetchStats(ctx context.Context, client *http.Client, cfg config, user trustedUser) fetchResult[backlogStats] {
	stats, err := requestJSON[backlogStats](ctx, client, http.MethodGet, cfg.backlogServiceURL+"/backlog/stats", map[string]string{
		"x-user-id":    user.userID,
		"x-user-email": user.email,
	})
	return fetchResult[backlogStats]{value: stats, err: err}
}

func fetchEvents(ctx context.Context, client *http.Client, cfg config) fetchResult[[]recentEvent] {
	events, err := requestJSON[[]recentEvent](ctx, client, http.MethodGet, cfg.eventsServiceURL+"/events", nil)
	return fetchResult[[]recentEvent]{value: events, err: err}
}

func selectTopRatedGame(entries []backlogEntry) *string {
	var best *backlogEntry
	for i := range entries {
		entry := entries[i]
		if entry.Status != "completed" || entry.Rating == nil {
			continue
		}

		if best == nil || (entry.Rating != nil && *entry.Rating > *best.Rating) {
			best = &entry
		}
	}

	if best == nil {
		return nil
	}

	name := best.GameName
	return &name
}

func buildInsights(userID string, backlog []backlogEntry, stats backlogStats, events []recentEvent) dashboardInsights {
	var latestEventType *string
	var latestEventGame *string
	recentEventCount := 0
	recentEvents := make([]recentEventSummary, 0, 5)

	for _, event := range events {
		if event.UserID != userID {
			continue
		}

		recentEventCount++
		if len(recentEvents) < 5 {
			recentEvents = append(recentEvents, recentEventSummary{
				EventType: event.Type,
				GameName:  event.BacklogItem.GameName,
				Status:    event.BacklogItem.Status,
				OccurredAt: event.OccurredAt.UTC().Format(time.RFC3339),
			})
		}

		if latestEventType == nil && event.Type != "" {
			eventType := event.Type
			latestEventType = &eventType
			gameName := event.BacklogItem.GameName
			latestEventGame = &gameName
		}
	}

	return dashboardInsights{
		TotalEntries:     len(backlog),
		CompletedEntries: stats.Completed,
		AverageRating:    stats.AvgRating,
		RecentEventCount:  recentEventCount,
		LatestEventType:   latestEventType,
		LatestEventGame:   latestEventGame,
		TopRatedGame:     selectTopRatedGame(backlog),
		RecentEvents:     recentEvents,
		GeneratedAt:      time.Now().UTC().Format(time.RFC3339),
	}
}

func handleDashboard(cfg config, client *http.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := trustedUserFromRequest(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
		defer cancel()

		backlogCh := make(chan fetchResult[[]backlogEntry], 1)
		statsCh := make(chan fetchResult[backlogStats], 1)
		eventsCh := make(chan fetchResult[[]recentEvent], 1)

		go func() { backlogCh <- fetchBacklog(ctx, client, cfg, user) }()
		go func() { statsCh <- fetchStats(ctx, client, cfg, user) }()
		go func() { eventsCh <- fetchEvents(ctx, client, cfg) }()

		var backlog []backlogEntry
		var stats backlogStats
		var events []recentEvent
		received := 0

		for received < 3 {
			select {
			case result := <-backlogCh:
				if result.err != nil {
					http.Error(w, result.err.Error(), http.StatusBadGateway)
					return
				}
				backlog = result.value
				received++
			case result := <-statsCh:
				if result.err != nil {
					http.Error(w, result.err.Error(), http.StatusBadGateway)
					return
				}
				stats = result.value
				received++
			case result := <-eventsCh:
				if result.err != nil {
					http.Error(w, result.err.Error(), http.StatusBadGateway)
					return
				}
				events = result.value
				received++
			case <-ctx.Done():
				http.Error(w, ctx.Err().Error(), http.StatusGatewayTimeout)
				return
			}
		}

		w.Header().Set("content-type", "application/json")
		_ = json.NewEncoder(w).Encode(buildInsights(user.userID, backlog, stats, events))
	}
}

func main() {
	cfg := loadConfig()
	client := &http.Client{}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("content-type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})
	mux.HandleFunc("/insights/dashboard", handleDashboard(cfg, client))

	server := &http.Server{
		Addr:              ":" + cfg.port,
		Handler:           loggingMiddleware(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("go-service listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}
