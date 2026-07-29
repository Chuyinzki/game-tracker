import type { FastifyReply, FastifyRequest } from "fastify";
import { GraphQLError } from "graphql";
import type { MercuriusContext } from "mercurius";

export type GraphQLUser = {
  userId: string;
  email: string;
};

export type GraphQLContext = {
  request: FastifyRequest;
  reply: FastifyReply;
  user: GraphQLUser | null;
};

declare module "mercurius" {
  interface MercuriusContext {
    request: FastifyRequest;
    user: GraphQLUser | null;
  }
}

export async function buildGraphQLContext(request: FastifyRequest, reply: FastifyReply): Promise<Pick<GraphQLContext, "request" | "user">> {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return {
      request,
      user: null
    };
  }

  try {
    await request.jwtVerify();
  } catch {
    throw new GraphQLError("Unauthorized.", {
      extensions: {
        code: "UNAUTHENTICATED"
      }
    });
  }

  return {
    request,
    user: request.user
  };
}
