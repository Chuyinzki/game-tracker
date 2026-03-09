import Fastify from "fastify";
import { ZodError } from "zod";
import { RawgClient } from "./lib/rawgClient.js";
import { registerGameRoutes } from "./routes/games.js";

export function buildApp(rawgClient: RawgClient) {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.register(async (instance) => {
    await registerGameRoutes(instance, rawgClient);
  });

  app.get("/health", async () => ({ ok: true }));

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: "Invalid request payload.",
        issues: error.issues
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      message: "Internal server error."
    });
  });

  return app;
}
