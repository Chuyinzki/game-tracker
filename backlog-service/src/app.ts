import Fastify from "fastify";
import { ZodError } from "zod";
import { prismaPlugin } from "./plugins/prisma.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBacklogRoutes } from "./routes/backlog.js";
import { AppError } from "./lib/errors.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.register(prismaPlugin);
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
