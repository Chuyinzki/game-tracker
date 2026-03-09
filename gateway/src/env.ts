import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GATEWAY_PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16),
  GAMES_SERVICE_URL: z.string().url(),
  BACKLOG_SERVICE_URL: z.string().url(),
  FRONTEND_API_BASE_URL: z.string().url().optional()
});

export type GatewayEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): GatewayEnv {
  return envSchema.parse(source);
}
