import type { FastifyInstance } from "fastify";
import { credentialsSchema } from "../lib/validation.js";
import { AppError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/internal/users/register", async (request, reply) => {
    const payload = credentialsSchema.parse(request.body);
    const email = payload.email.toLowerCase();

    const existingUser = await app.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError(409, "Email is already registered.");
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    return reply.code(201).send({
      id: user.id,
      email: user.email
    });
  });

  app.post("/internal/users/login", async (request) => {
    const payload = credentialsSchema.parse(request.body);
    const email = payload.email.toLowerCase();

    const user = await app.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError(401, "Invalid email or password.");
    }

    const passwordMatches = await verifyPassword(payload.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, "Invalid email or password.");
    }

    return {
      id: user.id,
      email: user.email
    };
  });
}
