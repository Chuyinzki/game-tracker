import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RawgApiError, RawgClient } from "../lib/rawgClient.js";

const searchSchema = z.object({
  q: z.string().min(1)
});

const idSchema = z.object({
  id: z.coerce.number().int().positive()
});

export async function registerGameRoutes(app: FastifyInstance, rawgClient: RawgClient) {
  app.get("/games/search", async (request, reply) => {
    const query = searchSchema.parse(request.query);

    try {
      const results = await rawgClient.searchGames(query.q);
      return reply.send(results);
    } catch (error) {
      if (error instanceof RawgApiError) {
        return reply.code(error.statusCode).send({
          message: error.message
        });
      }

      throw error;
    }
  });

  app.get("/games/:id", async (request, reply) => {
    const params = idSchema.parse(request.params);

    try {
      const game = await rawgClient.getGame(params.id);
      return reply.send(game);
    } catch (error) {
      if (error instanceof RawgApiError) {
        return reply.code(error.statusCode).send({
          message: error.message
        });
      }

      throw error;
    }
  });
}
