"use client";

import type { LucideIcon } from "lucide-react";
import { Circle, Cylinder, Diamond, Hexagon, Pill, Square } from "lucide-react";
import type React from "react";
import type { CanvasNodeShape, CanvasShapeDragPayload } from "@/types/canvas";

export const SHAPE_DRAG_MIME_TYPE = "application/x-ghost-ai-shape";

export interface ShapeDragPreviewState extends CanvasShapeDragPayload {
  x: number;
  y: number;
}

interface ShapePanelItem {
  name: CanvasNodeShape;
  icon: LucideIcon;
  width: number;
  height: number;
}

const SHAPES: ShapePanelItem[] = [
  { name: "rectangle", icon: Square, width: 160, height: 80 },
  { name: "diamond", icon: Diamond, width: 150, height: 150 },
  { name: "circle", icon: Circle, width: 100, height: 100 },
  { name: "pill", icon: Pill, width: 160, height: 60 },
  { name: "cylinder", icon: Cylinder, width: 120, height: 120 },
  { name: "hexagon", icon: Hexagon, width: 120, height: 100 },
];

interface ShapePanelProps {
  onPreviewChange?: (preview: ShapeDragPreviewState | null) => void;
}

function setTransparentDragImage(event: React.DragEvent<HTMLButtonElement>) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  event.dataTransfer.setDragImage(canvas, 0, 0);
}

export function ShapePanel({ onPreviewChange }: ShapePanelProps) {
  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, shapeData: ShapePanelItem) => {
    const payload: CanvasShapeDragPayload = {
      shape: shapeData.name,
      width: shapeData.width,
      height: shapeData.height,
    };
    event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
    setTransparentDragImage(event);
    onPreviewChange?.({
      ...payload,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onDrag = (event: React.DragEvent<HTMLButtonElement>, shapeData: ShapePanelItem) => {
    if (event.clientX === 0 && event.clientY === 0) {
      return;
    }

    onPreviewChange?.({
      shape: shapeData.name,
      width: shapeData.width,
      height: shapeData.height,
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-subtle bg-surface/95 px-4 py-2 shadow-2xl backdrop-blur">
      {SHAPES.map((shape) => (
        <button
          key={shape.name}
          type="button"
          aria-label={`Drag ${shape.name} shape onto the canvas`}
          className="cursor-grab rounded-xl p-2 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary active:cursor-grabbing"
          draggable
          onDrag={(event) => onDrag(event, shape)}
          onDragEnd={() => onPreviewChange?.(null)}
          onDragStart={(event) => onDragStart(event, shape)}
          title={`Drag to add ${shape.name}`}
        >
          <shape.icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
