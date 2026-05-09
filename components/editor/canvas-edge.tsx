import { EdgeLabelRenderer, type EdgeProps, getSmoothStepPath, Position } from "@xyflow/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { canvasEdge } from "@/types/canvas";

const EMPTY_EDGE_LABEL_HINT = "Label";
const EDGE_LABEL_CLASS =
  "nodrag nopan rounded-xl border border-border-default bg-elevated/95 px-2 py-1 text-xs font-medium leading-none text-copy-primary shadow-lg backdrop-blur";
const EDGE_INPUT_CLASS =
  "nodrag nopan min-w-10 rounded-xl border border-accent-primary bg-elevated/95 px-2 py-1 text-center text-xs font-medium leading-none text-copy-primary shadow-lg outline-none ring-2 ring-accent-primary/25 backdrop-blur";

interface CanvasEdgeProps extends EdgeProps<canvasEdge> {
  onLabelChange: (edgeId: string, label: string) => void;
}

function stopCanvasInteraction(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function markerIdForEdge(edgeId: string) {
  return `canvas-edge-arrow-${edgeId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function CanvasEdge({
  data,
  id,
  interactionWidth = 24,
  onLabelChange,
  selected,
  sourcePosition = Position.Bottom,
  sourceX,
  sourceY,
  targetPosition = Position.Top,
  targetX,
  targetY,
}: CanvasEdgeProps) {
  const savedLabel = data?.label ?? "";
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(savedLabel);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = selected || isHovered || isEditing;
  const visibleLabel = savedLabel.trim();
  const shouldShowLabel = visibleLabel.length > 0 || isActive;
  const markerId = markerIdForEdge(id);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    borderRadius: 8,
    offset: 28,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const startEditing = (event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    setDraftLabel(savedLabel);
    setIsEditing(true);
  };

  const saveLabel = () => {
    const nextLabel = draftLabel.trim();

    if (nextLabel !== savedLabel) {
      onLabelChange(id, nextLabel);
    }

    setIsEditing(false);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (event.key !== "Enter" && event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    saveLabel();
  };

  const onLabelKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    startEditing(event);
  };

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerHeight="8"
          markerUnits="strokeWidth"
          markerWidth="8"
          orient="auto"
          refX="8"
          refY="4"
          viewBox="0 0 8 8"
        >
          <path
            d="M 0 0 L 8 4 L 0 8 z"
            fill={isActive ? "var(--text-primary)" : "var(--text-secondary)"}
          />
        </marker>
      </defs>
      <path
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        markerEnd={`url(#${markerId})`}
        stroke={isActive ? "var(--text-primary)" : "var(--text-secondary)"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={isActive ? 0.95 : 0.48}
        strokeWidth={1.6}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: The SVG path only supports pointer hover/double-click; the HTML label button is the keyboard-accessible edit control. */}
      <path
        className="react-flow__edge-interaction cursor-pointer"
        d={edgePath}
        fill="none"
        onDoubleClick={startEditing}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        stroke="transparent"
        strokeLinecap="round"
        strokeWidth={interactionWidth}
      />
      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                aria-label="Edit edge label"
                className={EDGE_INPUT_CLASS}
                onBlur={saveLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                onClick={stopCanvasInteraction}
                onKeyDown={onInputKeyDown}
                onMouseDown={stopCanvasInteraction}
                onPointerDown={stopCanvasInteraction}
                size={Math.max(draftLabel.length + 1, EMPTY_EDGE_LABEL_HINT.length)}
                type="text"
                value={draftLabel}
              />
            ) : (
              <button
                aria-label="Edit edge label"
                className={`${EDGE_LABEL_CLASS} ${visibleLabel.length > 0 ? "" : "text-copy-muted opacity-55"}`}
                onClick={startEditing}
                onDoubleClick={startEditing}
                onKeyDown={onLabelKeyDown}
                onMouseDown={stopCanvasInteraction}
                onPointerDown={stopCanvasInteraction}
                type="button"
              >
                {visibleLabel.length > 0 ? visibleLabel : EMPTY_EDGE_LABEL_HINT}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
