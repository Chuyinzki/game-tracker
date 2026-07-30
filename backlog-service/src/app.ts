import Fastify from "fastify";
import { ZodError } from "zod";
import { rabbitmqPlugin } from "./plugins/rabbitmq.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBacklogRoutes } from "./routes/backlog.js";
import { AppError } from "./lib/errors.js";
import type { BacklogServiceEnv } from "./env.js";

export function buildApp(env: BacklogServiceEnv) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.register(prismaPlugin);
  app.register(rabbitmqPlugin, { url: env.RABBITMQ_URL });
  app.register(registerAuthRoutes);
  app.register(registerBacklogRoutes);

  app.get("/health", async () => ({ ok: true }));

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: "Invalid request payload.",
        issues: error.issues
      });
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        message: error.message
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      message: "Internal server error."
    });
  });

  return app;
}
