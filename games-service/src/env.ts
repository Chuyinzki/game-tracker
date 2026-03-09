import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GAMES_SERVICE_PORT: z.coerce.number().default(3001),
  RAWG_API_KEY: z.string().min(1),
  RAWG_BASE_URL: z.string().url().default("https://api.rawg.io/api")
});

export type GamesServiceEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): GamesServiceEnv {
  return envSchema.parse(source);
}
