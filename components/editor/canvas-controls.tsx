"use client";

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";

const VIEWPORT_ANIMATION_MS = 180;

interface CanvasControlsProps<NodeType extends Node, EdgeType extends Edge> {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onUndo: () => void;
  reactFlow: ReactFlowInstance<NodeType, EdgeType>;
}

interface ControlButtonProps {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function ControlButton({ disabled = false, icon: Icon, label, onClick }: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:pointer-events-none disabled:text-text-faint disabled:opacity-45"
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}

export function CanvasControls<NodeType extends Node, EdgeType extends Edge>({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  reactFlow,
}: CanvasControlsProps<NodeType, EdgeType>) {
  return (
    <div
      className="absolute bottom-24 left-6 z-10 flex items-center gap-2 rounded-full border border-border-subtle bg-surface/95 px-3 py-2 shadow-2xl backdrop-blur"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <ControlButton
          icon={Minus}
          label="Zoom out"
          onClick={() => void reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_MS })}
        />
        <ControlButton
          icon={Maximize2}
          label="Fit view"
          onClick={() =>
            void reactFlow.fitView({
              duration: VIEWPORT_ANIMATION_MS,
              padding: 0.16,
            })
          }
        />
        <ControlButton
          icon={Plus}
          label="Zoom in"
          onClick={() => void reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_MS })}
        />
      </div>
      <div aria-hidden="true" className="h-6 w-px bg-border-subtle" />
      <div className="flex items-center gap-1">
        <ControlButton disabled={!canUndo} icon={Undo2} label="Undo" onClick={onUndo} />
        <ControlButton disabled={!canRedo} icon={Redo2} label="Redo" onClick={onRedo} />
      </div>
    </div>
  );
}
