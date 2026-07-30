export type BacklogStatus = "want_to_play" | "playing" | "completed" | "abandoned";

export type User = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type GameSummary = {
  id: number;
  name: string;
  coverUrl: string | null;
  releaseYear: number | null;
};

export type BacklogEntry = {
  id: string;
  gameId: number;
  gameName: string;
  coverUrl: string | null;
  releaseYear: number | null;
  status: BacklogStatus;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Stats = {
  want_to_play: number;
  playing: number;
  completed: number;
  abandoned: number;
  avgRating: number | null;
};

export type DashboardInsights = {
  totalEntries: number;
  completedEntries: number;
  averageRating: number | null;
  recentEventCount: number;
  latestEventType: string | null;
  latestEventGame: string | null;
  topRatedGame: string | null;
  recentEvents: Array<{
    eventType: string;
    gameName: string;
    status: string;
    occurredAt: string;
  }>;
  generatedAt: string;
};

export type NotificationDigest = {
  notificationCount: number;
  latestNotificationTitle: string | null;
  latestNotificationGame: string | null;
  recentNotifications: Array<{
    eventType: string;
    title: string;
    message: string;
    severity: string;
    gameName: string;
    status: string;
    occurredAt: string;
  }>;
  generatedAt: string;
};
