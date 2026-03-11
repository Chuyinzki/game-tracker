import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { BacklogEntry, Stats } from "../types";

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
  const [topRated, setTopRated] = useState<BacklogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.fetchStats(token)
      .then(setStats)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load stats."));
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
