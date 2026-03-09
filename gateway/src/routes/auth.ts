import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requestJson, UpstreamError } from "../lib/http.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

type AuthResponse = {
  id: string;
  email: string;
};

export async function registerAuthRoutes(app: FastifyInstance, backlogServiceUrl: string) {
  app.post("/auth/register", async (request, reply) => {
    const payload = credentialsSchema.parse(request.body);

    try {
      const user = await requestJson<AuthResponse>(`${backlogServiceUrl}/internal/users/register`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const token = await reply.jwtSign({
        userId: user.id,
        email: user.email
      });

      return reply.code(201).send({
        token,
        user
      });
    } catch (error) {
      if (error instanceof UpstreamError) {
        return reply.code(error.statusCode).send(error.body);
      }

      throw error;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const payload = credentialsSchema.parse(request.body);

    try {
      const user = await requestJson<AuthResponse>(`${backlogServiceUrl}/internal/users/login`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const token = await reply.jwtSign({
        userId: user.id,
        email: user.email
      });

      return reply.send({
        token,
        user
      });
    } catch (error) {
      if (error instanceof UpstreamError) {
        return reply.code(error.statusCode).send(error.body);
      }

      throw error;
    }
  });
}
