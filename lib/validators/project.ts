import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(2, "Title is required"),
  goal: z.string().min(2, "Goal is required"),
  audience: z.string().min(2, "Audience is required"),
  durationSec: z.coerce.number().int().min(30, "Duration must be at least 30s"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
