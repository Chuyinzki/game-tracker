import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import type { BacklogStatus, GameSummary } from "../types";

const STATUS_OPTIONS: BacklogStatus[] = ["want_to_play", "playing", "completed", "abandoned"];

type SearchPageProps = {
  token: string;
};

export function SearchPage({ token }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [statusByGame, setStatusByGame] = useState<Record<number, BacklogStatus>>({});
  const [results, setResults] = useState<GameSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      setResults(await api.searchGames(query));
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
                <h2 className="text-xl font-semibold">{game.name}</h2>
                <p className="text-sm text-slate-600">{game.releaseYear ?? "TBA"}</p>
              </div>
              <div className="flex gap-3">
                <select
                  value={statusByGame[game.id] ?? "want_to_play"}
                  onChange={(event) => setStatusByGame((current) => ({
                    ...current,
                    [game.id]: event.target.value as BacklogStatus
                  }))}
                  className="flex-1 rounded-2xl border border-slate-300 px-3 py-2"
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
