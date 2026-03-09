import type { BacklogStatus } from "@prisma/client";

type StatusCounts = Record<BacklogStatus, number>;

const INITIAL_COUNTS: StatusCounts = {
  want_to_play: 0,
  playing: 0,
  completed: 0,
  abandoned: 0
};

export function buildStats(
  counts: Array<{ status: BacklogStatus; _count: { status: number } }>,
  avgRating: number | null
) {
  const statusCounts = { ...INITIAL_COUNTS };

  for (const entry of counts) {
    statusCounts[entry.status] = entry._count.status;
  }

  return {
    ...statusCounts,
    avgRating: avgRating === null ? null : Number(avgRating.toFixed(1))
  };
}
