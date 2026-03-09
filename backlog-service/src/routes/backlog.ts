import type { BacklogStatus, Prisma } from "@prisma/client";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../lib/errors.js";
import { buildStats } from "../lib/stats.js";
import { createBacklogSchema, updateBacklogSchema } from "../lib/validation.js";

const USER_ID_HEADER = "x-user-id";
const USER_EMAIL_HEADER = "x-user-email";

type AuthenticatedRequest = FastifyRequest & {
  userContext: {
    userId: string;
    email: string;
  };
};

function getUserContext(request: FastifyRequest) {
  const userId = request.headers[USER_ID_HEADER];
  const email = request.headers[USER_EMAIL_HEADER];

  if (typeof userId !== "string" || typeof email !== "string") {
    throw new AppError(401, "Missing trusted user context.");
  }

  return { userId, email };
}

function serializeEntry(entry: Prisma.BacklogEntryGetPayload<{ include: { game: true } }>) {
  return {
    id: entry.id,
    gameId: entry.game.externalId,
    gameName: entry.game.name,
    coverUrl: entry.game.coverUrl,
    releaseYear: entry.game.releaseYear,
    status: entry.status,
    rating: entry.rating,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

export async function registerBacklogRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    if (!request.url.startsWith("/backlog")) {
      return;
    }

    (request as AuthenticatedRequest).userContext = getUserContext(request);
  });

  app.post("/backlog", async (request, reply) => {
    const payload = createBacklogSchema.parse(request.body);
    const { userId } = (request as AuthenticatedRequest).userContext;

    const game = await app.prisma.game.upsert({
      where: { externalId: payload.gameId },
      update: {
        name: payload.name,
        coverUrl: payload.coverUrl ?? null,
        releaseYear: payload.releaseYear ?? null
      },
      create: {
        externalId: payload.gameId,
        name: payload.name,
        coverUrl: payload.coverUrl ?? null,
        releaseYear: payload.releaseYear ?? null
      }
    });

    try {
      const entry = await app.prisma.backlogEntry.create({
        data: {
          userId,
          gameId: game.id,
          status: payload.status
        },
        include: {
          game: true
        }
      });

      return reply.code(201).send(serializeEntry(entry));
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw new AppError(409, "Game is already in the backlog.");
      }

      throw error;
    }
  });

  app.get("/backlog", async (request) => {
    const { userId } = (request as AuthenticatedRequest).userContext;

    const entries = await app.prisma.backlogEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { game: true }
    });

    return entries.map(serializeEntry);
  });

  app.patch("/backlog/:id", async (request) => {
    const { userId } = (request as AuthenticatedRequest).userContext;
    const params = request.params as { id: string };
    const payload = updateBacklogSchema.parse(request.body);

    const existingEntry = await app.prisma.backlogEntry.findFirst({
      where: {
        id: params.id,
        userId
      }
    });

    if (!existingEntry) {
      throw new AppError(404, "Backlog entry not found.");
    }

    const nextStatus = payload.status ?? existingEntry.status;
    if (nextStatus !== "completed" && payload.rating !== undefined && payload.rating !== null) {
      throw new AppError(400, "Ratings can only be set for completed games.");
    }

    const entry = await app.prisma.backlogEntry.update({
      where: { id: existingEntry.id },
      data: {
        status: payload.status,
        rating: nextStatus === "completed"
          ? payload.rating === undefined
            ? existingEntry.rating
            : payload.rating
          : null
      },
      include: {
        game: true
      }
    });

    return serializeEntry(entry);
  });

  app.get("/backlog/stats", async (request) => {
    const { userId } = (request as AuthenticatedRequest).userContext;

    const [counts, averages] = await Promise.all([
      app.prisma.backlogEntry.groupBy({
        by: ["status"],
        where: { userId },
        _count: {
          status: true
        }
      }),
      app.prisma.backlogEntry.aggregate({
        where: {
          userId,
          rating: {
            not: null
          }
        },
        _avg: {
          rating: true
        }
      })
    ]);

    return buildStats(counts as Array<{ status: BacklogStatus; _count: { status: number } }>, averages._avg.rating);
  });
}
