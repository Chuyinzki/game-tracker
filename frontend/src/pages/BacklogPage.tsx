import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { BacklogEntry, BacklogStatus } from "../types";

const STATUS_OPTIONS: BacklogStatus[] = ["want_to_play", "playing", "completed", "abandoned"];

type BacklogPageProps = {
  token: string;
};

export function BacklogPage({ token }: BacklogPageProps) {
  const [entries, setEntries] = useState<BacklogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="space-y-4">
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {entries.map((entry) => (
        <article key={entry.id} className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(16,24,40,0.08)] md:grid-cols-[1fr_auto_auto] md:items-center">
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
        </article>
      ))}
    </section>
  );
}
