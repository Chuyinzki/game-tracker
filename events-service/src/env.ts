import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  EVENTS_SERVICE_PORT: z.coerce.number().default(3003),
  RABBITMQ_URL: z.string().url().default("amqp://app:app@rabbitmq:5672")
});

export type EventsServiceEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): EventsServiceEnv {
  return envSchema.parse(source);
}
