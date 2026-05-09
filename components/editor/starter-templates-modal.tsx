"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CanvasNodeShape, canvasNode } from "@/types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 170;
const PREVIEW_PADDING = 22;
const FALLBACK_NODE_WIDTH = 150;
const FALLBACK_NODE_HEIGHT = 72;

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

interface PreviewNode extends canvasNode {
  previewX: number;
  previewY: number;
  previewWidth: number;
  previewHeight: number;
}

function numericSize(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getNodeWidth(node: canvasNode) {
  return numericSize(node.style?.width, FALLBACK_NODE_WIDTH);
}

function getNodeHeight(node: canvasNode) {
  return numericSize(node.style?.height, FALLBACK_NODE_HEIGHT);
}

function getNodeCenter(node: PreviewNode) {
  return {
    x: node.previewX + node.previewWidth / 2,
    y: node.previewY + node.previewHeight / 2,
  };
}

function getPreviewNodes(template: CanvasTemplate): PreviewNode[] {
  const bounds = template.nodes.reduce(
    (currentBounds, node) => {
      const width = getNodeWidth(node);
      const height = getNodeHeight(node);

      return {
        maxX: Math.max(currentBounds.maxX, node.position.x + width),
        maxY: Math.max(currentBounds.maxY, node.position.y + height),
        minX: Math.min(currentBounds.minX, node.position.x),
        minY: Math.min(currentBounds.minY, node.position.y),
      };
    },
    {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    },
  );

  const boundsWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const boundsHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / boundsWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / boundsHeight,
  );
  const offsetX = (PREVIEW_WIDTH - boundsWidth * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - boundsHeight * scale) / 2;

  return template.nodes.map((node) => {
    const width = getNodeWidth(node);
    const height = getNodeHeight(node);

    return {
      ...node,
      previewX: (node.position.x - bounds.minX) * scale + offsetX,
      previewY: (node.position.y - bounds.minY) * scale + offsetY,
      previewWidth: width * scale,
      previewHeight: height * scale,
    };
  });
}

function shapePath(shape: CanvasNodeShape, node: PreviewNode) {
  const { previewX: x, previewY: y, previewWidth: width, previewHeight: height } = node;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  if (shape === "diamond") {
    return `${centerX},${y} ${x + width},${centerY} ${centerX},${y + height} ${x},${centerY}`;
  }

  if (shape === "hexagon") {
    return `${x + width * 0.24},${y} ${x + width * 0.76},${y} ${x + width},${centerY} ${
      x + width * 0.76
    },${y + height} ${x + width * 0.24},${y + height} ${x},${centerY}`;
  }

  return "";
}

function PreviewShape({ node }: { node: PreviewNode }) {
  const shape = node.data.shape ?? "rectangle";
  const fill = node.data.color;
  const stroke = node.data.textColor ?? "var(--border-subtle)";
  const commonProps = {
    fill,
    stroke,
    strokeWidth: 1.4,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (shape === "diamond" || shape === "hexagon") {
    return <polygon points={shapePath(shape, node)} {...commonProps} />;
  }

  if (shape === "circle") {
    return (
      <ellipse
        cx={node.previewX + node.previewWidth / 2}
        cy={node.previewY + node.previewHeight / 2}
        rx={node.previewWidth / 2}
        ry={node.previewHeight / 2}
        {...commonProps}
      />
    );
  }

  if (shape === "pill") {
    return (
      <rect
        height={node.previewHeight}
        rx={node.previewHeight / 2}
        width={node.previewWidth}
        x={node.previewX}
        y={node.previewY}
        {...commonProps}
      />
    );
  }

  if (shape === "cylinder") {
    const ellipseHeight = Math.min(node.previewHeight * 0.28, 18);

    return (
      <g>
        <path
          d={`M${node.previewX} ${node.previewY + ellipseHeight / 2}
            C${node.previewX} ${node.previewY - ellipseHeight / 2} ${
              node.previewX + node.previewWidth
            } ${node.previewY - ellipseHeight / 2} ${
              node.previewX + node.previewWidth
            } ${node.previewY + ellipseHeight / 2}
            V${node.previewY + node.previewHeight - ellipseHeight / 2}
            C${node.previewX + node.previewWidth} ${
              node.previewY + node.previewHeight + ellipseHeight / 2
            } ${node.previewX} ${
              node.previewY + node.previewHeight + ellipseHeight / 2
            } ${node.previewX} ${node.previewY + node.previewHeight - ellipseHeight / 2}
            Z`}
          {...commonProps}
        />
        <ellipse
          cx={node.previewX + node.previewWidth / 2}
          cy={node.previewY + ellipseHeight / 2}
          fill="none"
          rx={node.previewWidth / 2}
          ry={ellipseHeight / 2}
          stroke={stroke}
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  }

  return (
    <rect
      height={node.previewHeight}
      rx={10}
      width={node.previewWidth}
      x={node.previewX}
      y={node.previewY}
      {...commonProps}
    />
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const previewNodes = getPreviewNodes(template);
  const nodeById = new Map(previewNodes.map((node) => [node.id, node]));

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
    >
      <rect
        fill="var(--bg-base)"
        height={PREVIEW_HEIGHT}
        rx={16}
        stroke="var(--border-default)"
        width={PREVIEW_WIDTH}
      />
      {template.edges.map((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);

        if (!source || !target) {
          return null;
        }

        const sourceCenter = getNodeCenter(source);
        const targetCenter = getNodeCenter(target);

        return (
          <line
            key={edge.id}
            stroke="var(--text-secondary)"
            strokeLinecap="round"
            strokeOpacity={0.68}
            strokeWidth={1.5}
            x1={sourceCenter.x}
            x2={targetCenter.x}
            y1={sourceCenter.y}
            y2={targetCenter.y}
          />
        );
      })}
      {previewNodes.map((node) => (
        <PreviewShape key={node.id} node={node} />
      ))}
    </svg>
  );
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const importTemplate = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] gap-5 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="px-6 pt-6 pr-14">
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription>
            Replace the current canvas with a prebuilt system design.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 px-6 pb-6">
          <div className="grid gap-4 pb-1 md:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <article
                key={template.id}
                className="flex min-h-[340px] flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated/60 shadow-sm"
              >
                <div className="h-[170px] border-b border-border-default bg-base">
                  <TemplatePreview template={template} />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-primary">{template.name}</h3>
                    <p className="text-xs leading-5 text-text-muted">{template.description}</p>
                  </div>
                  <Button
                    className="mt-auto w-full gap-2"
                    onClick={() => importTemplate(template)}
                    type="button"
                    variant="outline"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
