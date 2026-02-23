import { z } from "zod";

export const actionSchema = z.object({
  text: z.string().min(2, "Action text is required"),
});

export type ActionInput = z.infer<typeof actionSchema>;
