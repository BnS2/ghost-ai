import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, task } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import {
  buildPrompt,
  canvasActionsResponseSchema,
  SYSTEM_PROMPT_TEXT,
} from "@/lib/ai-canvas-actions";
import { liveblocks } from "@/lib/liveblocks";
import type { canvasEdge, canvasNode } from "@/types/canvas";

const google = createGoogleGenerativeAI();

export const designAgentTask = task({
  id: "design-agent",
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: {
    prompt: string;
    roomId: string;
    currentCanvas?: {
      nodes: unknown[];
      edges: unknown[];
    };
  }) => {
    const { prompt, roomId, currentCanvas } = payload;

    logger.info("Design agent task started", { prompt, roomId });

    await liveblocks.broadcastEvent(roomId, {
      type: "AI_STATUS",
      message: "Interpreting your prompt...",
      status: "started",
    });

    try {
      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        message: "Generating architecture design...",
        status: "processing",
      });

      const canvasContext =
        currentCanvas && currentCanvas.nodes.length > 0
          ? ({
              nodes: currentCanvas.nodes as canvasNode[],
              edges: currentCanvas.edges as canvasEdge[],
            } as const)
          : undefined;

      const userPrompt = buildPrompt(prompt, canvasContext);

      logger.info("Calling Gemini with prompt", { userPrompt: userPrompt.slice(0, 200) });

      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: canvasActionsResponseSchema,
        system: SYSTEM_PROMPT_TEXT,
        prompt: userPrompt,
        temperature: 0.7,
        maxOutputTokens: 4096,
      });

      const actionCount = object.actions.length;

      logger.info("Gemini returned actions", {
        actionCount,
        types: object.actions.map((a) => a.type).join(", "),
      });

      if (actionCount > 0) {
        await liveblocks.broadcastEvent(roomId, {
          type: "AI_ACTIONS",
          actions: object.actions,
        });

        await liveblocks.broadcastEvent(roomId, {
          type: "AI_STATUS",
          message: `Design complete — ${actionCount} action${actionCount === 1 ? "" : "s"} applied.`,
          status: "completed",
        });
      } else {
        await liveblocks.broadcastEvent(roomId, {
          type: "AI_STATUS",
          message: "No design actions were generated. Try refining your prompt.",
          status: "error",
        });
      }

      return {
        actionCount,
        actions: object.actions.map((a) => ({ type: a.type })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";

      logger.error("Design agent task failed", { error: message });

      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        message: `Generation failed: ${message}`,
        status: "error",
      });

      throw error;
    }
  },
});
