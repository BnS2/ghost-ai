"use client";

import {
  useCanRedo,
  useCanUndo,
  useEventListener,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
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
  useStore,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BotIcon, Loader2Icon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CanvasSaveStatus, useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { type CanvasAction, enforceNodeSpacing } from "@/lib/ai-canvas-actions";
import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
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
import { LiveCursors } from "./live-cursors";
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
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  onTemplateImported?: () => void;
  projectId: string;
  saveRef?: React.MutableRefObject<(() => void) | null>;
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
  onSaveStatusChange,
  onTemplateImported,
  projectId,
  saveRef,
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
  const updateMyPresence = useUpdateMyPresence();

  const reactFlow = useReactFlow<canvasNode, canvasEdge>();
  const isInitialized = useNodesInitialized();

  useStore((state) => {
    let hash = "";
    for (const n of state.nodes) {
      hash += `|${n.id}:${Math.round(n.position.x)},${Math.round(n.position.y)}`;
    }
    for (const e of state.edges) {
      hash += `|${e.id}:${e.source}->${e.target}`;
    }
    return hash;
  });

  const nodeIdCounter = useRef(0);
  const edgeIdCounter = useRef(0);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const clipboardRef = useRef<CanvasClipboard | null>(null);
  const [selectedElementCount, setSelectedElementCount] = useState(0);
  const [selectedNodeCount, setSelectedNodeCount] = useState(0);
  const [isSavedCanvasChecked, setIsSavedCanvasChecked] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    message: string;
    status: string;
    visible: boolean;
  } | null>(null);
  const lastTemplateImportIdRef = useRef<number | null>(null);
  const fitViewAppliedRef = useRef<number | null>(null);
  const savedCanvasCheckStartedRef = useRef(false);
  const aiFitViewPendingRef = useRef(false);
  const { save, status: saveStatus } = useCanvasAutosave(projectId, nodes, edges, {
    enabled: isSavedCanvasChecked,
  });
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

  const applyAiAction = useCallback(
    (action: CanvasAction) => {
      switch (action.type) {
        case "add_node": {
          const node: canvasNode = {
            id: action.id,
            type: "custom",
            position: { x: action.x, y: action.y },
            data: {
              label: action.label,
              color: action.color,
              textColor: action.textColor,
              shape: action.shape,
            },
            style: {
              width: action.width,
              height: action.height,
            },
          };

          onNodesChange([{ type: "add", item: node }]);
          break;
        }
        case "add_edge": {
          const edge: canvasEdge = {
            id: action.id,
            type: "canvas",
            source: action.source,
            target: action.target,
            data: {
              label: action.label ?? "",
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
          };

          onEdgesChange([{ type: "add", item: edge }]);
          break;
        }
        case "move_node": {
          const existingNode = nodesRef.current.find((n) => n.id === action.nodeId);

          if (!existingNode) {
            break;
          }

          onNodesChange([
            {
              id: action.nodeId,
              item: {
                ...existingNode,
                position: { x: action.x, y: action.y },
              },
              type: "replace",
            },
          ]);
          break;
        }
        case "update_node": {
          const existingNode = nodesRef.current.find((n) => n.id === action.nodeId);

          if (!existingNode) {
            break;
          }

          const nextData = {
            ...existingNode.data,
            ...(action.label !== undefined ? { label: action.label } : {}),
            ...(action.color !== undefined ? { color: action.color } : {}),
            ...(action.textColor !== undefined ? { textColor: action.textColor } : {}),
            ...(action.shape !== undefined ? { shape: action.shape } : {}),
          };

          const nextStyle = {
            ...existingNode.style,
            ...(action.width !== undefined ? { width: action.width } : {}),
            ...(action.height !== undefined ? { height: action.height } : {}),
          };

          onNodesChange([
            {
              id: action.nodeId,
              item: {
                ...existingNode,
                data: nextData,
                style: nextStyle,
              },
              type: "replace",
            },
          ]);
          break;
        }
        case "delete_node": {
          void reactFlow.deleteElements({ nodes: [{ id: action.nodeId }] });
          break;
        }
        case "delete_edge": {
          onEdgesChange([{ id: action.edgeId, type: "remove" }]);
          break;
        }
      }
    },
    [onEdgesChange, onNodesChange, reactFlow],
  );

  useEventListener(({ event }) => {
    if (event.type === "AI_STATUS") {
      setAiStatus({
        message: event.message,
        status: event.status,
        visible: true,
      });

      if (event.status === "completed") {
        aiFitViewPendingRef.current = true;
      }

      if (event.status === "completed" || event.status === "error") {
        setTimeout(() => {
          setAiStatus((prev) =>
            prev?.status === event.status ? { ...prev, visible: false } : prev,
          );
        }, 6000);
      }
    }

    if (event.type === "AI_ACTIONS") {
      setAiStatus((prev) =>
        prev
          ? {
              ...prev,
              message: `Applying ${event.actions.length} design action${event.actions.length === 1 ? "" : "s"}...`,
              status: "processing",
              visible: true,
            }
          : null,
      );

      const existingRects = nodesRef.current.map((n) => ({
        x: n.position.x,
        y: n.position.y,
        width: typeof n.style?.width === "number" ? n.style.width : 180,
        height: typeof n.style?.height === "number" ? n.style.height : 72,
      }));

      const spacedActions = enforceNodeSpacing(event.actions, existingRects);

      for (const action of spacedActions) {
        applyAiAction(action);
      }

      aiFitViewPendingRef.current = true;
    }
  });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [onSaveStatusChange, saveStatus]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = save;
    }
    return () => {
      if (saveRef) {
        saveRef.current = null;
      }
    };
  }, [save, saveRef]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: must reset when projectId changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: synchronous reset removes the setTimeout race condition
    setIsSavedCanvasChecked(false);
    savedCanvasCheckStartedRef.current = false;
    lastTemplateImportIdRef.current = null;
    fitViewAppliedRef.current = null;
  }, [projectId]);

  useEffect(() => {
    if (!isInitialized || savedCanvasCheckStartedRef.current) {
      return;
    }

    savedCanvasCheckStartedRef.current = true;

    if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
      setIsSavedCanvasChecked(true);
      return;
    }

    const abortController = new AbortController();

    fetch(`/api/projects/${projectId}/canvas`, {
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Canvas load failed with ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (
          !payload ||
          typeof payload !== "object" ||
          !("canvas" in payload) ||
          payload.canvas === null
        ) {
          return;
        }

        const canvas = parseCanvasSnapshot(payload.canvas);

        if (!canvas) {
          throw new Error("Saved canvas response was invalid");
        }

        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          return;
        }

        if (canvas.edges.length > 0) {
          onEdgesChange(canvas.edges.map((edge) => ({ item: edge, type: "add" as const })));
        }

        if (canvas.nodes.length > 0) {
          onNodesChange(canvas.nodes.map((node) => ({ item: node, type: "add" as const })));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load saved canvas", error);
      })
      .finally(() => {
        window.requestAnimationFrame(() => {
          setIsSavedCanvasChecked(true);
        });
      });

    return () => {
      abortController.abort();
    };
  }, [isInitialized, onEdgesChange, onNodesChange, projectId]);

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

  useEffect(() => {
    if (!aiFitViewPendingRef.current || !isInitialized || nodes.length === 0) {
      return;
    }

    aiFitViewPendingRef.current = false;
    requestAnimationFrame(() => {
      void reactFlow.fitView({ duration: 260, padding: 0.22 });
    });
  }, [isInitialized, nodes, reactFlow]);

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

  const autoSpaceSelection = useCallback(() => {
    const selectedNodes = reactFlow.getNodes().filter((n) => n.selected);

    if (selectedNodes.length < 2) return;

    const maxCols = 4;
    const hGap = 200;
    const vGap = 150;

    const sorted = [...selectedNodes].sort((a, b) => {
      const dy = a.position.y - b.position.y;
      if (Math.abs(dy) > 80) return dy;
      return a.position.x - b.position.x;
    });

    const originX = sorted[0].position.x;
    const originY = sorted[0].position.y;

    const numCols = Math.min(maxCols, sorted.length);
    const numRows = Math.ceil(sorted.length / maxCols);

    const columnWidths: number[] = Array.from({ length: numCols }, () => 0);
    const rowHeights: number[] = Array.from({ length: numRows }, () => 0);

    for (let i = 0; i < sorted.length; i++) {
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);
      const w: number = Number(sorted[i].style?.width) || 180;
      const h: number = Number(sorted[i].style?.height) || 72;
      columnWidths[col] = Math.max(columnWidths[col], w);
      rowHeights[row] = Math.max(rowHeights[row], h);
    }

    const colStartX: number[] = [0];
    for (let c = 1; c < numCols; c++) {
      colStartX.push(colStartX[c - 1] + columnWidths[c - 1] + hGap);
    }

    const rowStartY: number[] = [0];
    for (let r = 1; r < numRows; r++) {
      rowStartY.push(rowStartY[r - 1] + rowHeights[r - 1] + vGap);
    }

    const changes = sorted.map((node, index) => {
      const col = index % maxCols;
      const row = Math.floor(index / maxCols);

      const colX = originX + colStartX[col];
      const rowY = originY + rowStartY[row];

      return {
        id: node.id,
        item: { ...node, position: { x: colX, y: rowY } },
        type: "replace" as const,
      };
    });

    onNodesChange(changes);
  }, [onNodesChange, reactFlow]);

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

  const updateCursorPresence = useCallback(
    (event: React.MouseEvent) => {
      const cursor = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      updateMyPresence({ cursor });
    },
    [reactFlow, updateMyPresence],
  );

  const clearCursorPresence = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <div
      aria-label="Architecture canvas"
      className="h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseLeave={clearCursorPresence}
      role="application"
    >
      {aiStatus?.visible ? (
        <div
          aria-live="polite"
          className="pointer-events-none absolute left-1/2 top-3 z-40 -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-accent-primary/30 bg-surface/90 px-4 py-2.5 text-sm text-text-primary shadow-2xl backdrop-blur-lg">
            {aiStatus.status === "error" ? (
              <BotIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <Loader2Icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin text-accent-primary"
              />
            )}
            <span className="max-w-[340px] truncate">{aiStatus.message}</span>
          </div>
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={updateCursorPresence}
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
        <LiveCursors />
        <CanvasControls
          canRedo={canRedo}
          canUndo={canUndo}
          onAutoSpace={autoSpaceSelection}
          onDeleteSelected={deleteSelectedElements}
          onRedo={handleRedo}
          onUndo={handleUndo}
          reactFlow={reactFlow}
          selectedCount={selectedElementCount}
          selectedNodeCount={selectedNodeCount}
        />
      </ReactFlow>
    </div>
  );
}
