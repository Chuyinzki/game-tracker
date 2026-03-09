import type { FastifyInstance } from "fastify";
import { requestJson, UpstreamError } from "../lib/http.js";

export async function registerGameRoutes(app: FastifyInstance, gamesServiceUrl: string) {
  app.get("/api/games/search", {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    const searchParams = new URLSearchParams(request.query as Record<string, string>);

    try {
      const result = await requestJson<unknown>(`${gamesServiceUrl}/games/search?${searchParams.toString()}`);
      return reply.send(result);
    } catch (error) {
      if (error instanceof UpstreamError) {
        return reply.code(error.statusCode).send(error.body);
      }

      throw error;
    }
  });

  app.get("/api/games/:id", {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const result = await requestJson<unknown>(`${gamesServiceUrl}/games/${id}`);
      return reply.send(result);
    } catch (error) {
      if (error instanceof UpstreamError) {
        return reply.code(error.statusCode).send(error.body);
      }

      throw error;
    }
  });
}
