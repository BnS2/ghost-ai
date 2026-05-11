import { z } from "zod";

export const aiStatusFeedPayloadSchema = z.object({
  text: z.string().optional(),
});

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>;

export const chatMessageSchema = z.object({
  sender: z.string().min(1).max(256),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
  timestamp: z.number().int().nonnegative(),
});

export type ChatMessagePayload = z.infer<typeof chatMessageSchema>;
