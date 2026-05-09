"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type React from "react";
import { useCallback, useMemo, useRef } from "react";
import {
  type CanvasShapeDragPayload,
  type canvasEdge,
  type canvasNode,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
} from "@/types/canvas";
import { CanvasNode } from "./canvas-node";
import { SHAPE_DRAG_MIME_TYPE } from "./shape-panel";

function isShapeDragPayload(value: unknown): value is CanvasShapeDragPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CanvasShapeDragPayload>;

  return (
    typeof payload.shape === "string" &&
    NODE_SHAPES.includes(payload.shape) &&
    typeof payload.width === "number" &&
    Number.isFinite(payload.width) &&
    payload.width > 0 &&
    typeof payload.height === "number" &&
    Number.isFinite(payload.height) &&
    payload.height > 0
  );
}

export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<
    canvasNode,
    canvasEdge
  >({
    suspense: true,
  });

  const { screenToFlowPosition } = useReactFlow();
  const nodeIdCounter = useRef(0);
  const nodeTypes = useMemo(() => ({ custom: CanvasNode }), []);
  const miniMapNodeColor = useCallback(
    (node: canvasNode) => node.data.color ?? DEFAULT_NODE_COLOR.fill,
    [],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const serializedPayload = event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE);

      if (!serializedPayload) {
        return;
      }

      try {
        const payload: unknown = JSON.parse(serializedPayload);

        if (!isShapeDragPayload(payload)) {
          return;
        }

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const nextCounter = nodeIdCounter.current;
        nodeIdCounter.current += 1;

        const newNode: canvasNode = {
          id: `${payload.shape}-${Date.now()}-${nextCounter}`,
          type: "custom",
          position: {
            x: position.x - payload.width / 2,
            y: position.y - payload.height / 2,
          },
          data: {
            label: "",
            color: DEFAULT_NODE_COLOR.fill,
            textColor: DEFAULT_NODE_COLOR.text,
            shape: payload.shape,
          },
          style: {
            width: payload.width,
            height: payload.height,
          },
        };

        onNodesChange([{ type: "add", item: newNode }]);
      } catch (error) {
        console.error("Failed to parse shape drop payload", error);
      }
    },
    [onNodesChange, screenToFlowPosition],
  );

  return (
    <div
      aria-label="Architecture canvas"
      className="h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="application"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        className="w-full h-full"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--border-subtle)"
        />
        <MiniMap
          ariaLabel="Canvas overview"
          bgColor="var(--bg-elevated)"
          className="rounded-2xl border border-border-default shadow-lg"
          maskColor="color-mix(in srgb, var(--bg-base) 72%, transparent)"
          maskStrokeColor="var(--accent-primary)"
          maskStrokeWidth={1}
          nodeBorderRadius={8}
          nodeColor={miniMapNodeColor}
          nodeStrokeColor="var(--border-subtle)"
          nodeStrokeWidth={1}
        />
      </ReactFlow>
    </div>
  );
}
