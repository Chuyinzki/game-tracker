import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { BacklogEntry, BacklogStatus } from "../types";

const STATUS_OPTIONS: BacklogStatus[] = ["want_to_play", "playing", "completed", "abandoned"];

type BacklogPageProps = {
  token: string;
};

const FILTER_OPTIONS: Array<BacklogStatus | "all"> = ["all", ...STATUS_OPTIONS];

export function BacklogPage({ token }: BacklogPageProps) {
  const [entries, setEntries] = useState<BacklogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BacklogStatus | "all">("all");

  useEffect(() => {
    void api.fetchBacklog(token)
      .then(setEntries)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load backlog."));
  }, [token]);

  async function updateEntry(entry: BacklogEntry, status: BacklogStatus, rating: number | null) {
    try {
      const updated = await api.updateBacklog(entry.id, status, rating, token);
      setEntries((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update entry.");
    }
  }

  const filteredEntries = statusFilter === "all"
    ? entries
    : entries.filter((entry) => entry.status === statusFilter);

  return (
    <section className="space-y-4">
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
        <span className="text-sm font-semibold text-slate-700">Filter status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as BacklogStatus | "all")}
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
        >
          {FILTER_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "all games" : status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{filteredEntries.length} results</span>
      </div>
      {filteredEntries.map((entry) => (
        <article key={entry.id} className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <div className="grid gap-4 p-5 md:grid-cols-[140px_1fr_auto_auto] md:items-center">
            <div className="h-24 w-full overflow-hidden rounded-[1.5rem] bg-slate-200 md:h-20 md:w-32">
              {entry.coverUrl ? (
                <img src={entry.coverUrl} alt={entry.gameName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No cover</div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{entry.gameName}</h2>
              <p className="text-sm text-slate-600">{entry.releaseYear ?? "TBA"}</p>
            </div>
            <select
              value={entry.status}
              onChange={(event) => void updateEntry(entry, event.target.value as BacklogStatus, entry.rating)}
              className="rounded-2xl border border-slate-300 px-3 py-2"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={entry.rating ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value === "" ? null : Number(event.target.value);
                void updateEntry(entry, entry.status, nextValue);
              }}
              disabled={entry.status !== "completed"}
              placeholder="Rating"
              className="w-28 rounded-2xl border border-slate-300 px-3 py-2"
            />
          </div>
        </article>
      ))}
    </section>
  );
}
