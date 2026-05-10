"use client";

import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  ConnectionMode,
  type DefaultEdgeOptions,
  type EdgeChange,
  type EdgeProps,
  MarkerType,
  MiniMap,
  type NodeChange,
  type NodeProps,
  type OnSelectionChangeParams,
  ReactFlow,
  SelectionMode,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  type CanvasShapeDragPayload,
  type canvasEdge,
  type canvasNode,
  DEFAULT_NODE_COLOR,
  type NODE_COLORS,
  NODE_SHAPES,
} from "@/types/canvas";
import { CanvasControls } from "./canvas-controls";
import { CanvasEdge } from "./canvas-edge";
import { CanvasNode } from "./canvas-node";
import { SHAPE_DRAG_MIME_TYPE } from "./shape-panel";
import type { CanvasTemplate } from "./starter-templates";

const CANVAS_EDGE_TYPE = "canvas";
const CLIPBOARD_OFFSET = 32;
const DEFAULT_CANVAS_EDGE_OPTIONS = {
  type: CANVAS_EDGE_TYPE,
  data: {
    label: "",
  },
  interactionWidth: 24,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "var(--text-secondary)",
    width: 16,
    height: 16,
  },
  style: {
    stroke: "var(--text-secondary)",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.6,
  },
} satisfies DefaultEdgeOptions;

interface CanvasFlowProps {
  onPreviewClear?: () => void;
  onPreviewMove?: (position: { x: number; y: number }) => void;
  onTemplateImported?: () => void;
  templateImport?: {
    id: number;
    template: CanvasTemplate;
  } | null;
}

interface CanvasClipboard {
  edges: canvasEdge[];
  nodes: canvasNode[];
  pasteCount: number;
}

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

function cloneTemplateNode(node: canvasNode): canvasNode {
  return {
    ...node,
    data: {
      ...node.data,
    },
    position: {
      ...node.position,
    },
    style: node.style ? { ...node.style } : undefined,
  };
}

function cloneTemplateEdge(edge: canvasEdge): canvasEdge {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : undefined,
    style: edge.style ? { ...edge.style } : undefined,
  };
}

function cloneClipboardNode(node: canvasNode): canvasNode {
  return {
    ...node,
    data: {
      ...node.data,
    },
    dragging: false,
    position: {
      ...node.position,
    },
    selected: false,
    style: node.style ? { ...node.style } : undefined,
  };
}

function cloneClipboardEdge(edge: canvasEdge): canvasEdge {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : undefined,
    selected: false,
    style: edge.style ? { ...edge.style } : undefined,
  };
}

export function CanvasFlow({
  onPreviewClear,
  onPreviewMove,
  onTemplateImported,
  templateImport,
}: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } = useLiveblocksFlow<
    canvasNode,
    canvasEdge
  >({
    suspense: true,
  });
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const reactFlow = useReactFlow<canvasNode, canvasEdge>();
  const isInitialized = useNodesInitialized();
  const nodeIdCounter = useRef(0);
  const edgeIdCounter = useRef(0);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const clipboardRef = useRef<CanvasClipboard | null>(null);
  const [selectedElementCount, setSelectedElementCount] = useState(0);
  const [selectedNodeCount, setSelectedNodeCount] = useState(0);
  const lastTemplateImportIdRef = useRef<number | null>(null);
  const fitViewAppliedRef = useRef<number | null>(null);
  const miniMapNodeColor = useCallback(
    (node: canvasNode) => node.data.textColor ?? DEFAULT_NODE_COLOR.text,
    [],
  );

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
    }
  }, [canRedo, redo]);

  const copySelection = useCallback(() => {
    const selectedNodes = reactFlow.getNodes().filter((node) => node.selected);

    if (selectedNodes.length === 0) {
      return false;
    }

    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
    const internalEdges = reactFlow
      .getEdges()
      .filter((edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target));

    clipboardRef.current = {
      edges: internalEdges.map(cloneClipboardEdge),
      nodes: selectedNodes.map(cloneClipboardNode),
      pasteCount: 0,
    };

    return true;
  }, [reactFlow]);

  const pasteClipboard = useCallback(() => {
    const clipboard = clipboardRef.current;

    if (!clipboard || clipboard.nodes.length === 0) {
      return false;
    }

    const pasteCount = clipboard.pasteCount + 1;
    clipboardRef.current = {
      ...clipboard,
      pasteCount,
    };

    const idMap = new Map<string, string>();
    const offset = CLIPBOARD_OFFSET * pasteCount;

    const existingNodeSelectionChanges = reactFlow
      .getNodes()
      .filter((node) => node.selected)
      .map<NodeChange<canvasNode>>((node) => ({
        id: node.id,
        selected: false,
        type: "select",
      }));
    const existingEdgeSelectionChanges = reactFlow
      .getEdges()
      .filter((edge) => edge.selected)
      .map<EdgeChange<canvasEdge>>((edge) => ({
        id: edge.id,
        selected: false,
        type: "select",
      }));

    const newNodes = clipboard.nodes.map<canvasNode>((node) => {
      const nextCounter = nodeIdCounter.current;
      nodeIdCounter.current += 1;

      const nextNodeId = `${node.id}-copy-${Date.now()}-${nextCounter}`;
      idMap.set(node.id, nextNodeId);

      return {
        ...cloneClipboardNode(node),
        id: nextNodeId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true,
      };
    });

    const newEdges = clipboard.edges.flatMap<canvasEdge>((edge) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);

      if (!source || !target) {
        return [];
      }

      const nextCounter = edgeIdCounter.current;
      edgeIdCounter.current += 1;

      return [
        {
          ...cloneClipboardEdge(edge),
          id: `${edge.id}-copy-${Date.now()}-${nextCounter}`,
          source,
          target,
          selected: false,
        },
      ];
    });

    if (existingEdgeSelectionChanges.length > 0 || newEdges.length > 0) {
      onEdgesChange([
        ...existingEdgeSelectionChanges,
        ...newEdges.map<EdgeChange<canvasEdge>>((edge) => ({ item: edge, type: "add" })),
      ]);
    }

    onNodesChange([
      ...existingNodeSelectionChanges,
      ...newNodes.map<NodeChange<canvasNode>>((node) => ({ item: node, type: "add" })),
    ]);

    return true;
  }, [onEdgesChange, onNodesChange, reactFlow]);

  const duplicateSelection = useCallback(() => {
    if (!copySelection()) {
      return false;
    }

    return pasteClipboard();
  }, [copySelection, pasteClipboard]);

  const clipboardActions = useMemo(
    () => ({
      copy: copySelection,
      duplicate: duplicateSelection,
      paste: pasteClipboard,
    }),
    [copySelection, duplicateSelection, pasteClipboard],
  );

  useKeyboardShortcuts(reactFlow, handleUndo, handleRedo, clipboardActions);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (!templateImport || lastTemplateImportIdRef.current === templateImport.id) {
      return;
    }

    lastTemplateImportIdRef.current = templateImport.id;
    fitViewAppliedRef.current = null;

    const nextNodes = templateImport.template.nodes.map(cloneTemplateNode);
    const nextEdges = templateImport.template.edges.map(cloneTemplateEdge);
    const removeEdges = edgesRef.current.map((edge) => ({ id: edge.id, type: "remove" as const }));
    const removeNodes = nodesRef.current.map((node) => ({ id: node.id, type: "remove" as const }));

    if (removeEdges.length > 0 || nextEdges.length > 0) {
      onEdgesChange([
        ...removeEdges,
        ...nextEdges.map((edge) => ({ item: edge, type: "add" as const })),
      ]);
    }

    if (removeNodes.length > 0 || nextNodes.length > 0) {
      onNodesChange([
        ...removeNodes,
        ...nextNodes.map((node) => ({ item: node, type: "add" as const })),
      ]);
    }
  }, [onEdgesChange, onNodesChange, templateImport]);

  useEffect(() => {
    if (!templateImport || !isInitialized || fitViewAppliedRef.current === templateImport.id) {
      return;
    }

    const templateNodeIds = new Set(templateImport.template.nodes.map((node) => node.id));
    const hasImportedNodes =
      nodes.length === templateNodeIds.size && nodes.every((node) => templateNodeIds.has(node.id));

    if (!hasImportedNodes) {
      return;
    }

    fitViewAppliedRef.current = templateImport.id;
    void reactFlow.fitView({ duration: 260, padding: 0.22 });
    onTemplateImported?.();
  }, [isInitialized, nodes, onTemplateImported, reactFlow, templateImport]);

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      const node = nodesRef.current.find((currentNode) => currentNode.id === nodeId);

      if (!node || node.data.label === label) {
        return;
      }

      onNodesChange([
        {
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              label,
            },
          },
          type: "replace",
        },
      ]);
    },
    [onNodesChange],
  );

  const updateNodeColor = useCallback(
    (nodeId: string, color: (typeof NODE_COLORS)[number]) => {
      const node = nodesRef.current.find((currentNode) => currentNode.id === nodeId);

      if (!node || (node.data.color === color.fill && node.data.textColor === color.text)) {
        return;
      }

      onNodesChange([
        {
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              color: color.fill,
              textColor: color.text,
            },
          },
          type: "replace",
        },
      ]);
    },
    [onNodesChange],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      void reactFlow.deleteElements({ nodes: [{ id: nodeId }] });
    },
    [reactFlow],
  );

  const deleteSelectedElements = useCallback(() => {
    const selectedNodes = reactFlow.getNodes().filter((node) => node.selected);
    const selectedEdges = reactFlow.getEdges().filter((edge) => edge.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return;
    }

    void reactFlow.deleteElements({
      nodes: selectedNodes,
      edges: selectedEdges,
    });
  }, [reactFlow]);

  const updateSelectionCount = useCallback(
    ({
      edges: selectedEdges,
      nodes: selectedNodes,
    }: OnSelectionChangeParams<canvasNode, canvasEdge>) => {
      setSelectedElementCount(selectedNodes.length + selectedEdges.length);
      setSelectedNodeCount(selectedNodes.length);
    },
    [],
  );

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      const edge = edgesRef.current.find((currentEdge) => currentEdge.id === edgeId);

      if (!edge || (edge.data?.label ?? "") === label) {
        return;
      }

      onEdgesChange([
        {
          id: edgeId,
          item: {
            ...edge,
            data: {
              ...edge.data,
              label,
            },
          },
          type: "replace",
        },
      ]);
    },
    [onEdgesChange],
  );

  const nodeTypes = useMemo(
    () => ({
      custom: (nodeProps: NodeProps<canvasNode>) => (
        <CanvasNode
          {...nodeProps}
          onColorChange={updateNodeColor}
          onCopy={copySelection}
          onDelete={deleteNode}
          onDuplicate={duplicateSelection}
          onLabelChange={updateNodeLabel}
          showToolbar={selectedNodeCount === 1}
        />
      ),
    }),
    [
      copySelection,
      deleteNode,
      duplicateSelection,
      selectedNodeCount,
      updateNodeColor,
      updateNodeLabel,
    ],
  );

  const edgeTypes = useMemo(
    () => ({
      [CANVAS_EDGE_TYPE]: (edgeProps: EdgeProps<canvasEdge>) => (
        <CanvasEdge {...edgeProps} onLabelChange={updateEdgeLabel} />
      ),
    }),
    [updateEdgeLabel],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge(
        {
          ...connection,
          ...DEFAULT_CANVAS_EDGE_OPTIONS,
        },
        edgesRef.current,
      );

      if (nextEdges.length === edgesRef.current.length) {
        return;
      }

      const newEdge = nextEdges.at(-1);

      if (!newEdge) {
        return;
      }

      onEdgesChange([{ type: "add", item: newEdge }]);
    },
    [onEdgesChange],
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      onPreviewMove?.({ x: event.clientX, y: event.clientY });
    },
    [onPreviewMove],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      onPreviewClear?.();

      const serializedPayload = event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE);

      if (!serializedPayload) {
        return;
      }

      try {
        const payload: unknown = JSON.parse(serializedPayload);

        if (!isShapeDragPayload(payload)) {
          return;
        }

        const position = reactFlow.screenToFlowPosition({
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
    [onNodesChange, onPreviewClear, reactFlow],
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
        onSelectionChange={updateSelectionCount}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_CANVAS_EDGE_OPTIONS}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        connectionMode={ConnectionMode.Loose}
        connectionRadius={36}
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
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
        <CanvasControls
          canRedo={canRedo}
          canUndo={canUndo}
          onDeleteSelected={deleteSelectedElements}
          onRedo={handleRedo}
          onUndo={handleUndo}
          reactFlow={reactFlow}
          selectedCount={selectedElementCount}
        />
      </ReactFlow>
    </div>
  );
}
