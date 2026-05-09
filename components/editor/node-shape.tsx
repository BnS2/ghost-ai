import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type CanvasNodeShape, DEFAULT_NODE_COLOR } from "@/types/canvas";

interface NodeShapeProps {
  shape?: CanvasNodeShape;
  fill?: string;
  textColor?: string;
  selected?: boolean;
  preview?: boolean;
  className?: string;
  children?: ReactNode;
}

const SHAPE_CONTENT_CLASS =
  "pointer-events-none relative z-10 flex h-full w-full items-center justify-center px-4 py-2 text-center text-sm font-medium wrap-break-word";

function shapeStyles(fill?: string, textColor?: string): CSSProperties {
  return {
    backgroundColor: fill ?? DEFAULT_NODE_COLOR.fill,
    color: textColor ?? DEFAULT_NODE_COLOR.text,
  };
}

function svgShapeStyles(fill?: string, textColor?: string): CSSProperties {
  return {
    color: textColor ?? DEFAULT_NODE_COLOR.text,
    "--node-fill": fill ?? DEFAULT_NODE_COLOR.fill,
  } as CSSProperties;
}

function SvgChrome({
  shape,
  selected,
  preview,
}: {
  shape: "diamond" | "hexagon" | "cylinder";
  selected?: boolean;
  preview?: boolean;
}) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";
  const strokeWidth = selected ? 2 : 1.25;
  const commonShapeProps = {
    fill: "var(--node-fill)",
    stroke,
    strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (shape === "diamond") {
    return (
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <polygon points="50 4 96 50 50 96 4 50" {...commonShapeProps} />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <polygon points="25 5 75 5 97 50 75 95 25 95 3 50" {...commonShapeProps} />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path d="M8 18C8 8.6 92 8.6 92 18V82C92 91.4 8 91.4 8 82V18Z" {...commonShapeProps} />
      <ellipse cx="50" cy="18" rx="42" ry="10" {...commonShapeProps} fill="var(--node-fill)" />
      {!preview && (
        <path
          d="M8 82C8 91.4 92 91.4 92 82"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

export function NodeShape({
  shape = "rectangle",
  fill,
  textColor,
  selected,
  preview,
  className,
  children,
}: NodeShapeProps) {
  const baseClass = cn(
    "relative h-full w-full overflow-hidden shadow-sm transition-colors",
    preview && "opacity-75 shadow-lg",
    className,
  );
  const borderClass = selected ? "border-accent-primary" : "border-border-subtle";

  if (shape === "rectangle") {
    return (
      <div
        className={cn(baseClass, "rounded-xl border", borderClass)}
        style={shapeStyles(fill, textColor)}
      >
        <div className={SHAPE_CONTENT_CLASS}>{children}</div>
      </div>
    );
  }

  if (shape === "pill") {
    return (
      <div
        className={cn(baseClass, "rounded-full border", borderClass)}
        style={shapeStyles(fill, textColor)}
      >
        <div className={SHAPE_CONTENT_CLASS}>{children}</div>
      </div>
    );
  }

  if (shape === "circle") {
    return (
      <div
        className={cn(baseClass, "rounded-full border", borderClass)}
        style={shapeStyles(fill, textColor)}
      >
        <div className={SHAPE_CONTENT_CLASS}>{children}</div>
      </div>
    );
  }

  return (
    <div className={baseClass} style={svgShapeStyles(fill, textColor)}>
      <SvgChrome shape={shape} selected={selected} preview={preview} />
      <div className={SHAPE_CONTENT_CLASS}>{children}</div>
    </div>
  );
}
