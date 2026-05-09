import { Handle, type NodeProps, NodeResizer, Position } from "@xyflow/react";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type canvasNode, NODE_COLORS } from "@/types/canvas";
import { NodeShape } from "./node-shape";

const HANDLE_CLASS =
  "z-10 h-3 w-3 border border-base! bg-text-primary! opacity-0 shadow-sm transition-opacity group-hover:opacity-100";
const RESIZE_HANDLE_CLASS =
  "h-2.5! w-2.5! rounded-full! border! border-accent-primary! bg-surface! opacity-80!";
const RESIZE_LINE_CLASS = "border-accent-primary! opacity-45!";
const MIN_NODE_WIDTH = 100;
const MIN_NODE_HEIGHT = 50;
const EMPTY_LABEL_PLACEHOLDER = "Label";

const CONNECTION_HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left];

interface CanvasNodeProps extends NodeProps<canvasNode> {
  onColorChange: (nodeId: string, color: (typeof NODE_COLORS)[number]) => void;
  onLabelChange: (nodeId: string, label: string) => void;
}

function stopCanvasInteraction(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function CanvasNode({ data, id, selected, onColorChange, onLabelChange }: CanvasNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const label = data.label;
  const visibleLabel = label.trim().length > 0 ? label : EMPTY_LABEL_PLACEHOLDER;
  const activeFill = data.color ?? NODE_COLORS[0].fill;
  const activeTextColor = data.textColor ?? NODE_COLORS[0].text;

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [isEditing]);

  useLayoutEffect(() => {
    if (!isEditing || !textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  });

  const startEditing = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const onLabelInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onLabelChange(id, event.target.value);
  };

  const onLabelInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Escape") {
      return;
    }

    event.stopPropagation();
    setIsEditing(false);
  };

  const onNodeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== "F2") {
      return;
    }

    event.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div className="group relative h-full min-h-[50px] w-full min-w-[100px]">
      <NodeResizer
        color="var(--accent-primary)"
        handleClassName={RESIZE_HANDLE_CLASS}
        isVisible={selected}
        lineClassName={RESIZE_LINE_CLASS}
        minHeight={MIN_NODE_HEIGHT}
        minWidth={MIN_NODE_WIDTH}
      />
      {CONNECTION_HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className={HANDLE_CLASS}
        />
      ))}
      {selected && (
        <div
          aria-label="Node color themes"
          className="nodrag nopan absolute bottom-full left-1/2 z-30 mb-3 flex -translate-x-1/2 gap-1.5 rounded-xl border border-border-default bg-elevated/95 p-1.5 shadow-lg backdrop-blur"
          onDoubleClick={stopCanvasInteraction}
          onMouseDown={stopCanvasInteraction}
          onPointerDown={stopCanvasInteraction}
          role="toolbar"
        >
          {NODE_COLORS.map((color) => {
            const isActive = activeFill === color.fill && activeTextColor === color.text;

            return (
              <button
                key={`${color.fill}-${color.text}`}
                aria-label={`Apply node color ${color.text}`}
                aria-pressed={isActive}
                className="h-5 w-5 rounded-full border p-0 transition-[border-color,box-shadow,transform] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-elevated"
                onClick={(event) => {
                  event.stopPropagation();
                  onColorChange(id, color);
                }}
                onMouseDown={stopCanvasInteraction}
                onPointerDown={stopCanvasInteraction}
                style={{
                  backgroundColor: color.fill,
                  borderColor: isActive ? color.text : "var(--border-subtle)",
                  boxShadow: isActive
                    ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${color.text}`
                    : `0 0 0 0 transparent`,
                  color: color.text,
                }}
                title="Apply node color"
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="block h-full w-full rounded-full opacity-0 transition-opacity hover:opacity-100"
                  style={{
                    boxShadow: `0 0 8px 1px ${color.text}`,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
      <button
        aria-label="Edit node label"
        className="block h-full w-full cursor-inherit border-none bg-transparent p-0 text-inherit"
        onDoubleClick={startEditing}
        onKeyDown={onNodeKeyDown}
        type="button"
      >
        <NodeShape
          fill={data.color}
          selected={selected}
          shape={data.shape}
          textColor={data.textColor}
        >
          <span className={label.trim().length > 0 ? undefined : "opacity-50"}>{visibleLabel}</span>
        </NodeShape>
      </button>
      {isEditing && (
        <div className="nodrag nopan absolute inset-0 z-20 flex items-center justify-center px-4 py-2">
          <textarea
            ref={textareaRef}
            aria-label="Edit node label"
            className="block max-h-full min-h-5 w-full resize-none overflow-hidden border-none bg-transparent text-center text-sm font-medium leading-5 outline-none wrap-break-word"
            onBlur={() => setIsEditing(false)}
            onChange={onLabelInputChange}
            onClick={stopCanvasInteraction}
            onDoubleClick={stopCanvasInteraction}
            onKeyDown={onLabelInputKeyDown}
            onMouseDown={stopCanvasInteraction}
            onPointerDown={stopCanvasInteraction}
            placeholder={EMPTY_LABEL_PLACEHOLDER}
            rows={1}
            style={{ color: data.textColor }}
            value={label}
          />
        </div>
      )}
    </div>
  );
}
