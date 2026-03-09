import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKLOG_SERVICE_PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string().min(1)
});

export type BacklogServiceEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): BacklogServiceEnv {
  return envSchema.parse(source);
}
