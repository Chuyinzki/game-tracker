import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { BacklogEntry, DashboardInsights, NotificationDigest, Stats } from "../types";

type StatsPageProps = {
  token: string;
};

const cards = [
  { key: "want_to_play", label: "Want to play" },
  { key: "playing", label: "Playing" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" }
] as const;

export function StatsPage({ token }: StatsPageProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [notificationDigest, setNotificationDigest] = useState<NotificationDigest | null>(null);
  const [topRated, setTopRated] = useState<BacklogEntry[]>([]);
  const [showRecentEvents, setShowRecentEvents] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.fetchStats(token)
      .then(setStats)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load stats."));
  }, [token]);

  useEffect(() => {
    void api.fetchDashboardInsights(token)
      .then(setInsights)
      .catch(() => {
        setInsights(null);
      });
  }, [token]);

  useEffect(() => {
    void api.fetchNotificationDigest(token)
      .then(setNotificationDigest)
      .catch(() => {
        setNotificationDigest(null);
      });
  }, [token]);

  useEffect(() => {
    void api.fetchBacklog(token)
      .then((entries) => {
        const picks = entries
          .filter((entry) => entry.status === "completed" && entry.rating !== null)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 4);
        setTopRated(picks);
      })
      .catch(() => {
        setTopRated([]);
      });
  }, [token]);

  if (error) {
    return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-slate-600">Loading stats...</p>;
  }

  return (
    <section className="space-y-4">
      {insights ? (
        <section className="rounded-[2rem] border border-sky-100 bg-sky-50/70 p-5 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Go service</p>
              <h3 className="mt-1 font-display text-2xl text-sky-900">Concurrent dashboard insights</h3>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {insights.recentEventCount} recent events
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total entries</p>
              <p className="mt-2 font-display text-4xl text-ink">{insights.totalEntries}</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Completed</p>
              <p className="mt-2 font-display text-4xl text-ink">{insights.completedEntries}</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Average rating</p>
              <p className="mt-2 font-display text-4xl text-ink">{insights.averageRating ?? "N/A"}</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest event</p>
              <p className="mt-2 text-lg font-semibold text-ink">{insights.latestEventType ?? "No recent events"}</p>
              <p className="mt-1 text-sm text-slate-500">{insights.latestEventGame ?? "Nothing yet"}</p>
            </article>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setShowRecentEvents((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recent activity</p>
                <p className="mt-1 text-sm text-slate-700">Expand to inspect the most recent events from the Go service.</p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                {showRecentEvents ? "Hide" : "Show"}
              </span>
            </button>
            {showRecentEvents ? (
              <div className="mt-4 space-y-3">
                {insights.recentEvents.length > 0 ? insights.recentEvents.map((event) => (
                  <article key={`${event.eventType}-${event.occurredAt}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{event.gameName}</p>
                        <p className="text-sm text-slate-500">{event.eventType}</p>
                      </div>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
                        {event.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(event.occurredAt).toLocaleString()}
                    </p>
                  </article>
                )) : (
                  <p className="text-sm text-slate-500">No recent events yet.</p>
                )}
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-sky-900/70">
            Generated at {new Date(insights.generatedAt).toLocaleString()}
          </p>
        </section>
      ) : null}
      {notificationDigest ? (
        <section className="rounded-[2rem] border border-amber-100 bg-amber-50/70 p-5 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Java service</p>
              <h3 className="mt-1 font-display text-2xl text-amber-950">Notification digest</h3>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {notificationDigest.notificationCount} notifications
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest title</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {notificationDigest.latestNotificationTitle ?? "No notifications yet"}
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest game</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {notificationDigest.latestNotificationGame ?? "Nothing yet"}
              </p>
            </article>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recent notifications</p>
                <p className="mt-1 text-sm text-slate-700">Expand to inspect the Java service digest.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                {showNotifications ? "Hide" : "Show"}
              </span>
            </button>
            {showNotifications ? (
              <div className="mt-4 space-y-3">
                {notificationDigest.recentNotifications.length > 0 ? notificationDigest.recentNotifications.map((notification) => (
                  <article key={`${notification.eventType}-${notification.occurredAt}`} className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{notification.title}</p>
                        <p className="text-sm text-slate-600">{notification.message}</p>
                      </div>
                      <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                        {notification.severity}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{notification.gameName}</span>
                      <span>{notification.status.replaceAll("_", " ")}</span>
                      <span>{new Date(notification.occurredAt).toLocaleString()}</span>
                    </div>
                  </article>
                )) : (
                  <p className="text-sm text-slate-500">No notifications yet.</p>
                )}
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-amber-950/70">
            Generated at {new Date(notificationDigest.generatedAt).toLocaleString()}
          </p>
        </section>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.key} className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
            <p className="mt-4 font-display text-5xl">{stats[card.key]}</p>
          </article>
        ))}
        <article className="rounded-[2rem] bg-pine p-6 text-white shadow-[0_24px_80px_rgba(16,24,40,0.12)] md:col-span-2 xl:col-span-4">
          <p className="text-sm uppercase tracking-[0.18em] text-white/60">Average rating</p>
          <p className="mt-4 font-display text-6xl">{stats.avgRating ?? "N/A"}</p>
        </article>
      </div>
      {topRated.length > 0 ? (
        <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-5 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Top rated</p>
              <h3 className="mt-1 font-display text-2xl text-emerald-900">Completed highlights</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {topRated.length} picks
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {topRated.map((entry) => (
              <article key={entry.id} className="overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-[0_18px_40px_rgba(16,24,40,0.12)]">
                <div className="h-36 bg-slate-200">
                  {entry.coverUrl ? (
                    <img src={entry.coverUrl} alt={entry.gameName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No cover</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h4 className="text-base font-semibold text-ink">{entry.gameName}</h4>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Rating {entry.rating}
                    </span>
                    <span className="text-xs text-slate-500">{entry.releaseYear ?? "TBA"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
