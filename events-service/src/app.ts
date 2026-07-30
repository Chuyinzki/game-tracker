import Fastify from "fastify";
import { ZodError } from "zod";
import type { StoredEvent } from "./lib/events.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.decorate("recentEvents", [] as StoredEvent[]);

  app.get("/health", async () => ({ ok: true }));

  app.get("/events", async () => {
    return app.recentEvents;
  });

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
