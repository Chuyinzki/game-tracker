import type { AuthResponse, BacklogEntry, BacklogStatus, GameSummary, Stats } from "../types";

const API_BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(typeof body === "string" ? body : body.message ?? "Request failed.");
  }

  return body as T;
}

export const api = {
  register(email: string, password: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  searchGames(query: string) {
    return request<GameSummary[]>(`/api/games/search?q=${encodeURIComponent(query)}`);
  },
  fetchBacklog(token: string) {
    return request<BacklogEntry[]>("/api/backlog", undefined, token);
  },
  fetchStats(token: string) {
    return request<Stats>("/api/backlog/stats", undefined, token);
  },
  addToBacklog(game: GameSummary, status: BacklogStatus, token: string) {
    return request<BacklogEntry>("/api/backlog", {
      method: "POST",
      body: JSON.stringify({
        gameId: game.id,
        name: game.name,
        coverUrl: game.coverUrl,
        releaseYear: game.releaseYear,
        status
      })
    }, token);
  },
  updateBacklog(id: string, status: BacklogStatus, rating: number | null | undefined, token: string) {
    return request<BacklogEntry>(`/api/backlog/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        rating
      })
    }, token);
  }
};
