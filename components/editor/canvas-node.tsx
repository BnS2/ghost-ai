import { Handle, Position } from "@xyflow/react";
import type { canvasNode } from "@/types/canvas";

export function CanvasNode({ data }: { data: canvasNode["data"] }) {
  return (
    <div
      className="relative flex h-full min-h-[50px] w-full min-w-[100px] items-center justify-center rounded-xl border border-border-subtle bg-surface shadow-sm"
      style={{
        backgroundColor: data.color,
        color: data.textColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2 w-2 border-none bg-text-primary!"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="h-2 w-2 border-none bg-text-primary!"
      />
      <div className="px-4 py-2 text-center text-sm font-medium wrap-break-word">{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="h-2 w-2 border-none bg-text-primary!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2 w-2 border-none bg-text-primary!"
      />
    </div>
  );
}
