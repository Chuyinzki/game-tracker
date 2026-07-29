import { GraphQLError } from "graphql";
import type { MercuriusContext } from "mercurius";
import { requestJson, UpstreamError } from "../lib/http.js";

type AuthResponse = {
  id: string;
  email: string;
};

type GameSummary = {
  id: number;
  name: string;
  coverUrl: string | null;
  releaseYear: number | null;
};

type BacklogEntry = {
  id: string;
  gameId: number;
  gameName: string;
  coverUrl: string | null;
  releaseYear: number | null;
  status: "want_to_play" | "playing" | "completed" | "abandoned";
  rating: number | null;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  want_to_play: number;
  playing: number;
  completed: number;
  abandoned: number;
  avgRating: number | null;
};

const STATUS_TO_GRAPHQL = {
  want_to_play: "WANT_TO_PLAY",
  playing: "PLAYING",
  completed: "COMPLETED",
  abandoned: "ABANDONED"
} as const;

const STATUS_TO_API = {
  WANT_TO_PLAY: "want_to_play",
  PLAYING: "playing",
  COMPLETED: "completed",
  ABANDONED: "abandoned"
} as const;

type GraphQLStatus = keyof typeof STATUS_TO_API;

function toGraphQLStatus(status: BacklogEntry["status"] | GraphQLStatus): GraphQLStatus {
  if (status in STATUS_TO_API) {
    return status as GraphQLStatus;
  }

  return STATUS_TO_GRAPHQL[status as BacklogEntry["status"]] as GraphQLStatus;
}

function toApiStatus(status: GraphQLStatus) {
  return STATUS_TO_API[status];
}

function userHeaders(user: { userId: string; email: string }) {
  return {
    "x-user-id": user.userId,
    "x-user-email": user.email
  };
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof UpstreamError) {
    if (typeof error.body === "object" && error.body !== null && "message" in error.body) {
      const message = (error.body as { message?: unknown }).message;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }

    if (typeof error.body === "string" && error.body.length > 0) {
      return error.body;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

function toGraphQLBacklogEntry(entry: BacklogEntry) {
  return {
    ...entry,
    status: toGraphQLStatus(entry.status)
  };
}

function requireUser(context: MercuriusContext) {
  if (!context.user) {
    throw new GraphQLError("Unauthorized.", {
      extensions: {
        code: "UNAUTHENTICATED"
      }
    });
  }

  return context.user;
}

export const resolvers = {
  Query: {
    me: (_parent: unknown, _args: unknown, context: MercuriusContext) => {
      if (!context.user) {
        return null;
      }

      return {
        id: context.user.userId,
        email: context.user.email
      };
    },
    searchGames: async (_parent: unknown, args: { query: string }, context: MercuriusContext) => {
      const { GAMES_SERVICE_URL } = context.app.gatewayEnv;

      try {
        return await requestJson<GameSummary[]>(`${GAMES_SERVICE_URL}/games/search?q=${encodeURIComponent(args.query)}`);
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to search games."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    },
    game: async (_parent: unknown, args: { id: number }, context: MercuriusContext) => {
      const { GAMES_SERVICE_URL } = context.app.gatewayEnv;

      try {
        return await requestJson<GameSummary>(`${GAMES_SERVICE_URL}/games/${args.id}`);
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to load game."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    },
    backlog: async (_parent: unknown, _args: unknown, context: MercuriusContext) => {
      const user = requireUser(context);
      const { BACKLOG_SERVICE_URL } = context.app.gatewayEnv;

      try {
        const entries = await requestJson<BacklogEntry[]>(`${BACKLOG_SERVICE_URL}/backlog`, {
          headers: userHeaders(user)
        });

        return entries.map(toGraphQLBacklogEntry);
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to load backlog."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    },
    backlogStats: async (_parent: unknown, _args: unknown, context: MercuriusContext) => {
      const user = requireUser(context);
      const { BACKLOG_SERVICE_URL } = context.app.gatewayEnv;

      try {
        return await requestJson<Stats>(`${BACKLOG_SERVICE_URL}/backlog/stats`, {
          headers: userHeaders(user)
        });
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to load stats."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    }
  },
  Mutation: {
    register: async (_parent: unknown, args: { input: { email: string; password: string } }, context: MercuriusContext) => {
      const { BACKLOG_SERVICE_URL } = context.app.gatewayEnv;

      try {
        const user = await requestJson<AuthResponse>(`${BACKLOG_SERVICE_URL}/internal/users/register`, {
          method: "POST",
          body: JSON.stringify(args.input)
        });

        const token = await context.reply.jwtSign({
          userId: user.id,
          email: user.email
        });

        return {
          token,
          user: {
            id: user.id,
            email: user.email
          }
        };
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to register."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    },
    login: async (_parent: unknown, args: { input: { email: string; password: string } }, context: MercuriusContext) => {
      const { BACKLOG_SERVICE_URL } = context.app.gatewayEnv;

      try {
        const user = await requestJson<AuthResponse>(`${BACKLOG_SERVICE_URL}/internal/users/login`, {
          method: "POST",
          body: JSON.stringify(args.input)
        });

        const token = await context.reply.jwtSign({
          userId: user.id,
          email: user.email
        });

        return {
          token,
          user: {
            id: user.id,
            email: user.email
          }
        };
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to log in."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    },
    addToBacklog: async (_parent: unknown, args: { input: { gameId: number; name: string; coverUrl: string | null; releaseYear: number | null; status: GraphQLStatus } }, context: MercuriusContext) => {
      const user = requireUser(context);
      const { BACKLOG_SERVICE_URL } = context.app.gatewayEnv;

      try {
        const entry = await requestJson<BacklogEntry>(`${BACKLOG_SERVICE_URL}/backlog`, {
          method: "POST",
          headers: userHeaders(user),
          body: JSON.stringify({
            gameId: args.input.gameId,
            name: args.input.name,
            coverUrl: args.input.coverUrl,
            releaseYear: args.input.releaseYear,
            status: toApiStatus(args.input.status)
          })
        });

        return toGraphQLBacklogEntry(entry);
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to add game to backlog."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    },
    updateBacklog: async (_parent: unknown, args: { id: string; input: { status?: GraphQLStatus | null; rating?: number | null } }, context: MercuriusContext) => {
      const user = requireUser(context);
      const { BACKLOG_SERVICE_URL } = context.app.gatewayEnv;

      try {
        const entry = await requestJson<BacklogEntry>(`${BACKLOG_SERVICE_URL}/backlog/${args.id}`, {
          method: "PATCH",
          headers: userHeaders(user),
          body: JSON.stringify({
            status: args.input.status ? toApiStatus(args.input.status) : undefined,
            rating: args.input.rating
          })
        });

        return toGraphQLBacklogEntry(entry);
      } catch (error) {
        throw new GraphQLError(errorMessage(error, "Unable to update backlog entry."), {
          extensions: {
            code: "UPSTREAM_ERROR"
          }
        });
      }
    }
  }
  ,
  BacklogEntry: {
    status: (entry: BacklogEntry) => toGraphQLStatus(entry.status)
  }
};
