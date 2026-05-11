import { z } from "zod";
import type { canvasEdge, canvasNode } from "@/types/canvas";

export const NODE_SHAPES_ARRAY = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

const NODE_COLOR_OPTIONS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

const addNodeSchema = z.object({
  type: z.literal("add_node"),
  id: z.string().min(1),
  shape: z.enum(NODE_SHAPES_ARRAY),
  label: z.string(),
  color: z.string(),
  textColor: z.string(),
  width: z.number().min(80).max(600),
  height: z.number().min(40).max(400),
  x: z.number(),
  y: z.number(),
});

const addEdgeSchema = z.object({
  type: z.literal("add_edge"),
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
});

const moveNodeSchema = z.object({
  type: z.literal("move_node"),
  nodeId: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

const deleteNodeSchema = z.object({
  type: z.literal("delete_node"),
  nodeId: z.string().min(1),
});

const deleteEdgeSchema = z.object({
  type: z.literal("delete_edge"),
  edgeId: z.string().min(1),
});

const updateNodeSchema = z.object({
  type: z.literal("update_node"),
  nodeId: z.string().min(1),
  label: z.string().optional(),
  color: z.string().optional(),
  textColor: z.string().optional(),
  shape: z.enum(NODE_SHAPES_ARRAY).optional(),
  width: z.number().min(80).max(600).optional(),
  height: z.number().min(40).max(400).optional(),
});

export const canvasActionSchema = z.discriminatedUnion("type", [
  addNodeSchema,
  addEdgeSchema,
  moveNodeSchema,
  deleteNodeSchema,
  deleteEdgeSchema,
  updateNodeSchema,
]);

export type CanvasAction = z.infer<typeof canvasActionSchema>;

export const canvasActionsResponseSchema = z.object({
  actions: z.array(canvasActionSchema),
});

export interface AiCanvasBroadcast {
  actions: CanvasAction[];
}

const SYSTEM_PROMPT = `You are an AI system architect assistant. Convert user prompts into structured canvas actions for a collaborative system design tool.

## Available Node Shapes
${NODE_SHAPES_ARRAY.map((s) => `- ${s}`).join("\n")}

## Available Color Pairs (fill / textColor)
${NODE_COLOR_OPTIONS.map((c) => `- fill: ${c.fill} / text: ${c.text}`).join("\n")}

## Layout Rules
- Space nodes at least 200px apart horizontally and 150px apart vertically.
- Arrange related services near each other.
- Use a left-to-right or top-to-bottom flow.
- Default node size: width 180, height 72 for most services.
- Database nodes: use cylinder shape.
- Frontend/API nodes: use rectangle shape.
- Message queues/event buses: use hexagon shape.
- External services: use diamond shape.
- Microservices: use pill shape.
- Storage/buckets: use circle shape.

## Action Types
- **add_node**: Create a new node with id, shape, label, color, textColor, width, height, x, y.
- **add_edge**: Connect two existing nodes with id, source (node id), target (node id), optional label.
- **move_node**: Reposition an existing node by nodeId to new x, y.
- **update_node**: Change label, color, textColor, shape, width, or height of an existing node by nodeId.
- **delete_node**: Remove an existing node by nodeId.
- **delete_edge**: Remove an existing edge by edgeId.

Generate unique, descriptive IDs for nodes (e.g. "api-gateway", "user-service", "postgres-db") and edges (e.g. "api-to-users").
Use only the color pairs listed above. Assign contrasting colors to adjacent nodes for visual clarity.

If the user asks to modify or refine an existing design, use move_node, update_node, delete_node, and delete_edge actions on existing nodes.
If the user asks for a new design or the canvas is empty, use add_node and add_edge actions.`;

export function buildPrompt(
  userPrompt: string,
  currentCanvas?: { nodes: canvasNode[]; edges: canvasEdge[] },
): string {
  if (!currentCanvas || (currentCanvas.nodes.length === 0 && currentCanvas.edges.length === 0)) {
    return `Generate a system architecture for: "${userPrompt}". Return a JSON object with an "actions" array of canvas actions, e.g. {"actions": [...]}. Use add_node and add_edge actions to build the complete design.`;
  }

  const nodeDescriptions = currentCanvas.nodes
    .map((n) => {
      const w = typeof n.style?.width === "number" ? n.style.width : Number(n.style?.width) || 180;
      const h =
        typeof n.style?.height === "number" ? n.style.height : Number(n.style?.height) || 72;
      return `- ${n.id}: "${n.data.label || "(no label)"}" [${n.data.shape || "rectangle"}] at (${Math.round(n.position.x)}, ${Math.round(n.position.y)}) size ${Math.round(w)}x${Math.round(h)}`;
    })
    .join("\n");

  const edgeDescriptions = currentCanvas.edges
    .map((e) => `- ${e.id}: ${e.source} -> ${e.target}${e.data?.label ? ` "${e.data.label}"` : ""}`)
    .join("\n");

  return `Current canvas state:
Nodes:
${nodeDescriptions || "(none)"}

Edges:
${edgeDescriptions || "(none)"}

User request: "${userPrompt}"

Return a JSON object with an "actions" array of canvas actions to fulfill this request, e.g. {"actions": [...]}. You may add, move, update, or delete nodes and edges. If the request asks to modify existing elements, reference them by their existing IDs.`;
}

export const SYSTEM_PROMPT_TEXT = SYSTEM_PROMPT;

const MIN_HORIZONTAL_GAP = 200;
const MIN_VERTICAL_GAP = 150;

interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function enforceNodeSpacing(
  actions: CanvasAction[],
  existingNodeRects: NodeRect[],
  minHorizontalGap = MIN_HORIZONTAL_GAP,
  minVerticalGap = MIN_VERTICAL_GAP,
): CanvasAction[] {
  const placed: NodeRect[] = [...existingNodeRects];
  const maxIterations = 10;

  return actions.map((action) => {
    if (action.type !== "add_node") return action;

    const { y, width, height } = action;
    let { x } = action;

    for (let iter = 0; iter < maxIterations; iter++) {
      let resolved = true;

      for (const p of placed) {
        const overlapX = !(
          x + width + minHorizontalGap < p.x || x > p.x + p.width + minHorizontalGap
        );
        const overlapY = !(
          y + height + minVerticalGap < p.y || y > p.y + p.height + minVerticalGap
        );

        if (overlapX && overlapY) {
          x = p.x + p.width + minHorizontalGap;
          resolved = false;
          break;
        }
      }

      if (resolved) break;
    }

    placed.push({ x, y, width, height });
    return { ...action, x, y };
  });
}
