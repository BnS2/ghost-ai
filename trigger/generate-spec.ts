import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI();

const payloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(z.unknown()),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

function formatCanvasForPrompt(nodes: unknown[], edges: unknown[]): string {
  const nodeLines = nodes.map((n) => {
    const rn = n as Record<string, unknown>;
    const data = (rn.data as Record<string, unknown> | undefined) ?? {};
    const position = (rn.position as Record<string, unknown> | undefined) ?? {};
    const style = (rn.style as Record<string, unknown> | undefined) ?? {};
    const label = (data.label as string) || (rn.id as string) || "(unnamed)";
    const shape = (data.shape as string) || "rectangle";
    const w = (style.width as number) || (rn.width as number) || 180;
    const h = (style.height as number) || (rn.height as number) || 72;
    const x = Math.round((position.x as number) ?? 0);
    const y = Math.round((position.y as number) ?? 0);
    return `- ${label} [${shape}] at (${x}, ${y}) size ${Math.round(Number(w))}x${Math.round(Number(h))}`;
  });

  const edgeLines = edges.map((e) => {
    const re = e as Record<string, unknown>;
    const edata = (re.data as Record<string, unknown> | undefined) ?? {};
    const label = (edata.label as string) || (re.label as string) || "";
    const sourceObj =
      typeof re.source === "string" ? null : (re.source as Record<string, unknown> | undefined);
    const targetObj =
      typeof re.target === "string" ? null : (re.target as Record<string, unknown> | undefined);
    const source =
      (typeof re.source === "string" ? re.source : (sourceObj?.id as string)) ?? "(unknown)";
    const target =
      (typeof re.target === "string" ? re.target : (targetObj?.id as string)) ?? "(unknown)";
    return `- ${source} -> ${target}${label ? ` (${label})` : ""}`;
  });

  const parts: string[] = [];

  if (nodeLines.length > 0) {
    parts.push(`Nodes:\n${nodeLines.join("\n")}`);
  }

  if (edgeLines.length > 0) {
    parts.push(`Edges:\n${edgeLines.join("\n")}`);
  }

  if (parts.length === 0) {
    return "The canvas is empty.";
  }

  return parts.join("\n\n");
}

function formatChatForPrompt(chatHistory: unknown[]): string {
  if (chatHistory.length === 0) return "";

  const lines = chatHistory
    .map((msg) => {
      const m = msg as Record<string, unknown>;
      const role = (m.role as string) || (m.sender as string) || "unknown";
      const content = (m.content as string) || "";
      return `**${role}**: ${String(content).slice(0, 1000)}`;
    })
    .join("\n\n");

  return `\n\n### Conversation History\n\n${lines}`;
}

const SYSTEM_PROMPT = `You are a senior system architect and technical writer. Your job is to produce a comprehensive technical specification (Markdown) from a system architecture diagram and conversation context.

## Output Format

Generate a single Markdown document with the following sections:

1. **# Overview** — 2–3 sentences describing the system's purpose and high-level architecture.
2. **## Architecture** — Describe the overall architectural style (monolithic, microservices, event-driven, etc.) and how the components relate.
3. **## Components** — For each node in the diagram, describe:
   - What it does
   - Its responsibilities
   - Key technologies or platforms it might use
4. **## Data Flow** — Describe the main data paths and communication patterns between components, referencing the edges.
5. **## Technical Considerations** — Note important non-functional aspects: scalability, security, fault tolerance, data consistency, or trade-offs visible in the design.
6. **## Summary** — A short closing paragraph.

## Guidelines

- Write in clear, professional technical English.
- Reference components by their labels as shown in the diagram.
- If the canvas is empty or nearly empty, note that the architecture is not yet defined and suggest next steps.
- Do not invent components or flows not present in the diagram or conversation.
- Keep each section concise but complete.
- Use bullet points where they improve readability.`;

export const generateSpec = task({
  id: "generate-spec",
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: {
    projectId: string;
    roomId: string;
    chatHistory?: unknown[];
    nodes?: unknown[];
    edges?: unknown[];
  }) => {
    const parsed = payloadSchema.parse(payload);
    const { projectId, roomId, chatHistory, nodes, edges } = parsed;

    logger.info("Spec generation task started", { projectId, roomId });

    metadata.set("status", "generating").set("progress", 0).set("projectId", projectId);

    try {
      metadata
        .set("status", "analyzing")
        .set("progress", 25)
        .set("message", "Analyzing canvas structure...");

      const canvasSection = formatCanvasForPrompt(nodes, edges);
      const chatSection = formatChatForPrompt(chatHistory);

      const userPrompt = `Generate a technical specification from the following system design.

${canvasSection}${chatSection}

Return only the Markdown specification document.`;

      logger.info("Calling Gemini for spec generation", {
        canvasNodeCount: nodes.length,
        canvasEdgeCount: edges.length,
        chatMessageCount: chatHistory.length,
      });

      metadata
        .set("status", "generating")
        .set("progress", 50)
        .set("message", "Generating specification with AI...");

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.7,
        maxOutputTokens: 8192,
      });

      metadata
        .set("status", "completed")
        .set("progress", 100)
        .set("message", "Specification generated successfully.");

      logger.info("Spec generation completed", {
        projectId,
        outputLength: text.length,
      });

      return { spec: text };
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";

      logger.error("Spec generation task failed", { error: message });

      metadata.set("status", "error").set("message", `Generation failed: ${message}`);

      throw error;
    }
  },
});
