import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { authPlugin } from "./plugins/auth.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBacklogRoutes } from "./routes/backlog.js";
import { registerGameRoutes } from "./routes/games.js";
import type { GatewayEnv } from "./env.js";

export function buildApp(env: GatewayEnv) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    },
    requestIdHeader: "x-request-id"
  });

  app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  app.register(authPlugin, {
    secret: env.JWT_SECRET
  });

  app.addHook("onRequest", async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      requestId: request.id
    }, "incoming request");
  });

  app.addHook("preHandler", async (request, reply) => {
    const origin = request.headers.origin ?? "*";

    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Vary", "Origin, Access-Control-Request-Headers");
    reply.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  });

  app.options("/*", async (_request, reply) => {
    return reply.code(204).send();
  });

  app.register(async (instance) => {
    await registerAuthRoutes(instance, env.BACKLOG_SERVICE_URL);
  });
  app.register(async (instance) => {
    await registerGameRoutes(instance, env.GAMES_SERVICE_URL);
  });
  app.register(async (instance) => {
    await registerBacklogRoutes(instance, env.BACKLOG_SERVICE_URL);
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
