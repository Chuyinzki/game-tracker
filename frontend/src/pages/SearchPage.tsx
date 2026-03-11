import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { BacklogStatus, GameSummary } from "../types";

const STATUS_OPTIONS: BacklogStatus[] = ["want_to_play", "playing", "completed", "abandoned"];
const STATUS_STYLES: Record<BacklogStatus, string> = {
  want_to_play: "border-amber-200 bg-amber-50 text-amber-900",
  playing: "border-sky-200 bg-sky-50 text-sky-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  abandoned: "border-rose-200 bg-rose-50 text-rose-900"
};
const STATUS_LABELS: Record<BacklogStatus, string> = {
  want_to_play: "want to play",
  playing: "playing",
  completed: "completed",
  abandoned: "abandoned"
};

type SearchPageProps = {
  token: string;
};

export function SearchPage({ token }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [statusByGame, setStatusByGame] = useState<Record<number, BacklogStatus>>({});
  const [backlogStatusByGame, setBacklogStatusByGame] = useState<Record<number, BacklogStatus>>({});
  const [results, setResults] = useState<GameSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(true);

  useEffect(() => {
    void api.fetchBacklog(token)
      .then((entries) => {
        const nextMap: Record<number, BacklogStatus> = {};
        for (const entry of entries) {
          nextMap[entry.gameId] = entry.status;
        }
        setBacklogStatusByGame(nextMap);
      })
      .catch(() => {
        setBacklogStatusByGame({});
      })
      .finally(() => {
        setIsLoadingBacklog(false);
      });
  }, [token]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.searchGames(query);
      setResults(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function addGame(game: GameSummary) {
    const status = statusByGame[game.id] ?? "want_to_play";

    try {
      await api.addToBacklog(game, status, token);
      setBacklogStatusByGame((current) => ({
        ...current,
        [game.id]: status
      }));
      setMessage(`${game.name} added to backlog.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add game.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for Elden Ring, Control, Hollow Knight..."
            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3"
          />
          <button disabled={isLoading || query.trim().length === 0} className="rounded-2xl bg-ink px-6 py-3 text-white">
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((game) => (
          <article key={game.id} className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
            <div className="h-48 bg-slate-200">
              {game.coverUrl ? (
                <img src={game.coverUrl} alt={game.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{game.name}</h2>
                  {backlogStatusByGame[game.id] ? (
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[backlogStatusByGame[game.id]]}`}>
                      {STATUS_LABELS[backlogStatusByGame[game.id]]}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-600">{game.releaseYear ?? "TBA"}</p>
                {isLoadingBacklog ? (
                  <p className="text-xs text-slate-500">Checking backlog status...</p>
                ) : null}
              </div>
              {backlogStatusByGame[game.id] ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">Already in backlog.</p>
                  <Link to="/backlog" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                    View in backlog
                  </Link>
                </div>
              ) : (
                <div className="flex gap-3">
                  <select
                    value={statusByGame[game.id] ?? "want_to_play"}
                    onChange={(event) => setStatusByGame((current) => ({
                      ...current,
                      [game.id]: event.target.value as BacklogStatus
                    }))}
                    className={`flex-1 rounded-2xl border px-3 py-2 ${STATUS_STYLES[statusByGame[game.id] ?? "want_to_play"]}`}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => void addGame(game)} className="rounded-2xl bg-accent px-4 py-2 font-semibold text-white">
                    Add
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
