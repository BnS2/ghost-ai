import { z } from "zod";

export interface AiStatusFeedPayload {
  text?: string;
}

export const chatMessageSchema = z.object({
  sender: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
  timestamp: z.number(),
});

export type ChatMessagePayload = z.infer<typeof chatMessageSchema>;
