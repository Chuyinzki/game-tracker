import mercurius from "mercurius";
import type { FastifyInstance } from "fastify";
import type { GatewayEnv } from "../env.js";
import { buildGraphQLContext } from "./context.js";
import { resolvers } from "./resolvers.js";
import { schema } from "./schema.js";

declare module "fastify" {
  interface FastifyInstance {
    gatewayEnv: GatewayEnv;
  }
}

export async function registerGraphQL(app: FastifyInstance, env: GatewayEnv) {
  app.decorate("gatewayEnv", env);

  await app.register(mercurius, {
    schema,
    resolvers,
    context: buildGraphQLContext,
    graphiql: env.NODE_ENV !== "production"
  });
}
