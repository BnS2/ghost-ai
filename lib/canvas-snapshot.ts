import type { canvasEdge, canvasNode } from "@/types/canvas";

export interface CanvasSnapshot {
  edges: canvasEdge[];
  nodes: canvasNode[];
  savedAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCanvasNode(value: unknown): value is canvasNode {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isRecord(value.data) &&
    isRecord(value.position) &&
    typeof value.position.x === "number" &&
    typeof value.position.y === "number"
  );
}

function isCanvasEdge(value: unknown): value is canvasEdge {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.source === "string" &&
    typeof value.target === "string"
  );
}

export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null;
  }

  if (!value.nodes.every(isCanvasNode) || !value.edges.every(isCanvasEdge)) {
    return null;
  }

  if (value.savedAt !== undefined && typeof value.savedAt !== "string") {
    return null;
  }

  return {
    edges: value.edges,
    nodes: value.nodes,
    savedAt: value.savedAt,
  };
}
