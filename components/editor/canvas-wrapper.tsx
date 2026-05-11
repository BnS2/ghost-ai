"use client";

import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { ReactFlowProvider } from "@xyflow/react";
import type React from "react";
import { Component, type ReactNode, useCallback, useState } from "react";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { CanvasFlow } from "./canvas-flow";
import { NodeShape } from "./node-shape";
import { PresenceAvatarGroup } from "./presence-avatar-group";
import { type ShapeDragPreviewState, ShapePanel } from "./shape-panel";
import type { CanvasTemplate } from "./starter-templates";

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface CanvasWrapperProps {
  aiSidebarOpen: boolean;
  onAiSidebarClose: () => void;
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  projectId: string;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  onTemplateImported?: () => void;
  templateImport?: {
    id: number;
    template: CanvasTemplate;
  } | null;
}

export function CanvasWrapper({
  aiSidebarOpen,
  onAiSidebarClose,
  onSaveStatusChange,
  projectId,
  saveRef,
  onTemplateImported,
  templateImport,
}: CanvasWrapperProps) {
  const [shapePreview, setShapePreview] = useState<ShapeDragPreviewState | null>(null);
  const moveShapePreview = useCallback((position: { x: number; y: number }) => {
    setShapePreview((preview) => (preview ? { ...preview, ...position } : preview));
  }, []);
  const clearShapePreview = useCallback(() => {
    setShapePreview(null);
  }, []);

  return (
    <ErrorBoundary
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-4">
          <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center">
            <svg
              aria-hidden="true"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p>Failed to connect to collaboration server.</p>
        </div>
      }
    >
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider id={projectId} initialPresence={{ cursor: null, thinking: false }}>
          <ClientSideSuspense
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-4">
                <div className="w-8 h-8 bg-accent rounded-full animate-pulse" />
                <p>Loading canvas...</p>
              </div>
            }
          >
            <ReactFlowProvider>
              <div className="relative h-full w-full">
                <CanvasFlow
                  onPreviewClear={clearShapePreview}
                  onPreviewMove={moveShapePreview}
                  onSaveStatusChange={onSaveStatusChange}
                  onTemplateImported={onTemplateImported}
                  projectId={projectId}
                  saveRef={saveRef}
                  templateImport={templateImport}
                />
                <PresenceAvatarGroup />
                <ShapePanel onPreviewChange={setShapePreview} />
                {shapePreview ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed left-0 top-0 z-50"
                    style={{
                      height: shapePreview.height,
                      transform: `translate(${shapePreview.x - shapePreview.width / 2}px, ${
                        shapePreview.y - shapePreview.height / 2
                      }px)`,
                      width: shapePreview.width,
                    }}
                  >
                    <NodeShape preview shape={shapePreview.shape} />
                  </div>
                ) : null}
                <AiSidebar
                  isOpen={aiSidebarOpen}
                  onClose={onAiSidebarClose}
                  projectId={projectId}
                />
              </div>
            </ReactFlowProvider>
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </ErrorBoundary>
  );
}
