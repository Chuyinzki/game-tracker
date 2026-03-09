export type RawgGame = {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  description_raw?: string;
};

export type GameSummary = {
  id: number;
  name: string;
  coverUrl: string | null;
  releaseYear: number | null;
};

export type GameDetail = GameSummary & {
  description: string | null;
};

export function extractReleaseYear(dateString: string | null): number | null {
  if (!dateString) {
    return null;
  }

  const year = Number(dateString.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

export function normalizeGameSummary(game: RawgGame): GameSummary {
  return {
    id: game.id,
    name: game.name,
    coverUrl: game.background_image,
    releaseYear: extractReleaseYear(game.released)
  };
}

export function normalizeGameDetail(game: RawgGame): GameDetail {
  return {
    ...normalizeGameSummary(game),
    description: game.description_raw ?? null
  };
}
