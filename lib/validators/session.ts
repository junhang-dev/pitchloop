import { z } from "zod";

export const sessionSchema = z.object({
  title: z.string().min(2, "Session title is required"),
});

export type SessionInput = z.infer<typeof sessionSchema>;
