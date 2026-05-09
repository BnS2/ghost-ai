import type { Edge, Node } from "@xyflow/react";

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type CanvasNodeShape = (typeof NODE_SHAPES)[number];

export interface CanvasShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}

export type CanvasNodeData = {
  label: string;
  color?: string;
  textColor?: string;
  shape?: CanvasNodeShape;
  [key: string]: unknown;
};

export interface CanvasEdgeData {
  label?: string;
  [key: string]: unknown;
}

export type canvasNode = Node<CanvasNodeData>;
export type canvasEdge = Edge<CanvasEdgeData, "canvas">;
