import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { BacklogEntry, BacklogStatus } from "../types";

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
    if (status !== "completed" && rating !== null) {
      setError("Ratings can only be set for completed games.");
      return;
    }
    if (rating !== null && (rating < 1 || rating > 10)) {
      setError("Rating must be between 1 and 10.");
      return;
    }
    if (error) {
      setError(null);
    }
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
  const topRatedCompleted = entries
    .filter((entry) => entry.status === "completed" && entry.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 4);

  return (
    <section className="space-y-4">
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
        <span className="text-sm font-semibold text-slate-700">Filter status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as BacklogStatus | "all")}
          className={`rounded-2xl border px-3 py-2 text-sm ${statusFilter === "all" ? "border-slate-300 bg-white text-slate-700" : STATUS_STYLES[statusFilter]}`}
        >
          {FILTER_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "all games" : status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{filteredEntries.length} results</span>
      </div>
      {statusFilter === "completed" && topRatedCompleted.length > 0 ? (
        <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-5 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Top rated</p>
              <h3 className="mt-1 font-display text-2xl text-emerald-900">Completed highlights</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {topRatedCompleted.length} picks
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {topRatedCompleted.map((entry) => (
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
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{entry.gameName}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[entry.status]}`}>
                  {STATUS_LABELS[entry.status]}
                </span>
              </div>
              <p className="text-sm text-slate-600">{entry.releaseYear ?? "TBA"}</p>
            </div>
            <select
              value={entry.status}
              onChange={(event) => void updateEntry(entry, event.target.value as BacklogStatus, entry.rating)}
              className={`rounded-2xl border px-3 py-2 ${STATUS_STYLES[entry.status]}`}
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
                if (nextValue !== null && (Number.isNaN(nextValue) || nextValue < 1 || nextValue > 10)) {
                  setError("Rating must be between 1 and 10.");
                  return;
                }
                if (error) {
                  setError(null);
                }
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
