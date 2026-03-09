import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Stats } from "../types";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.fetchStats(token)
      .then(setStats)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load stats."));
  }, [token]);

  if (error) {
    return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-slate-600">Loading stats...</p>;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
    </section>
  );
}
