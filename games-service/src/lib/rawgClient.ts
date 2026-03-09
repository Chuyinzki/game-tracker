import { TtlCache } from "./cache.js";
import { normalizeGameDetail, normalizeGameSummary, type GameDetail, type GameSummary, type RawgGame } from "./rawg.js";

type RawgSearchResponse = {
  results: RawgGame[];
};

type FetchFn = typeof fetch;

export class RawgApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

export class RawgClient {
  private readonly searchCache = new TtlCache<GameSummary[]>(60_000);
  private readonly detailCache = new TtlCache<GameDetail>(5 * 60_000);

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly fetchFn: FetchFn = fetch
  ) {}

  async searchGames(query: string): Promise<GameSummary[]> {
    const cacheKey = query.trim().toLowerCase();
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = new URL(`${this.baseUrl}/games`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("search", query);
    url.searchParams.set("page_size", "10");

    const response = await this.fetchWithTimeout(url);
    const body = (await response.json()) as RawgSearchResponse;
    const games = body.results.map(normalizeGameSummary);
    this.searchCache.set(cacheKey, games);
    return games;
  }

  async getGame(id: number): Promise<GameDetail> {
    const cacheKey = String(id);
    const cached = this.detailCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = new URL(`${this.baseUrl}/games/${id}`);
    url.searchParams.set("key", this.apiKey);

    const response = await this.fetchWithTimeout(url);
    const body = (await response.json()) as RawgGame;
    const game = normalizeGameDetail(body);
    this.detailCache.set(cacheKey, game);
    return game;
  }

  private async fetchWithTimeout(url: URL): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await this.fetchFn(url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new RawgApiError("RAWG request failed.", response.status);
      }

      return response;
    } catch (error) {
      if (error instanceof RawgApiError) {
        throw error;
      }

      throw new RawgApiError("RAWG request unavailable.", 502);
    } finally {
      clearTimeout(timeout);
    }
  }
}
