import { z } from "zod";

export const statusSchema = z.enum(["want_to_play", "playing", "completed", "abandoned"]);

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const createBacklogSchema = z.object({
  gameId: z.number().int().positive(),
  name: z.string().min(1),
  coverUrl: z.string().url().nullable().optional(),
  releaseYear: z.number().int().min(1950).max(2100).nullable().optional(),
  status: statusSchema
});

export const updateBacklogSchema = z.object({
  status: statusSchema.optional(),
  rating: z.number().int().min(1).max(10).nullable().optional()
}).refine((value) => value.status !== undefined || value.rating !== undefined, {
  message: "At least one field must be provided."
});
