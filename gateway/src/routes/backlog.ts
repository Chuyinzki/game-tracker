import type { FastifyInstance } from "fastify";
import { requestJson, UpstreamError } from "../lib/http.js";

function buildUserHeaders(user: { userId: string; email: string }) {
  return {
    "x-user-id": user.userId,
    "x-user-email": user.email
  };
}

export async function registerBacklogRoutes(app: FastifyInstance, backlogServiceUrl: string) {
  app.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);

    instance.post("/api/backlog", async (request, reply) => {
      try {
        const result = await requestJson<unknown>(`${backlogServiceUrl}/backlog`, {
          method: "POST",
          headers: buildUserHeaders(request.user),
          body: JSON.stringify(request.body)
        });

        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof UpstreamError) {
          return reply.code(error.statusCode).send(error.body);
        }

        throw error;
      }
    });

    instance.get("/api/backlog", async (request, reply) => {
      try {
        const result = await requestJson<unknown>(`${backlogServiceUrl}/backlog`, {
          headers: buildUserHeaders(request.user)
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamError) {
          return reply.code(error.statusCode).send(error.body);
        }

        throw error;
      }
    });

    instance.patch("/api/backlog/:id", async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const result = await requestJson<unknown>(`${backlogServiceUrl}/backlog/${id}`, {
          method: "PATCH",
          headers: buildUserHeaders(request.user),
          body: JSON.stringify(request.body)
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamError) {
          return reply.code(error.statusCode).send(error.body);
        }

        throw error;
      }
    });

    instance.get("/api/backlog/stats", async (request, reply) => {
      try {
        const result = await requestJson<unknown>(`${backlogServiceUrl}/backlog/stats`, {
          headers: buildUserHeaders(request.user)
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamError) {
          return reply.code(error.statusCode).send(error.body);
        }

        throw error;
      }
    });
  });
}
