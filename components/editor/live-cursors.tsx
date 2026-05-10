"use client";

import { useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";
import { useViewport, ViewportPortal } from "@xyflow/react";
import { Loader2Icon } from "lucide-react";

interface CursorParticipant {
  color: string;
  connectionId: number;
  cursor: { x: number; y: number };
  id: string;
  name: string;
  thinking: boolean;
}

export function LiveCursors() {
  const others = useOthers();
  const { user } = useUser();
  const { zoom } = useViewport();
  const currentUserId = user?.id;
  const cursors = others.flatMap<CursorParticipant>((participant) => {
    if (participant.id === currentUserId || !participant.presence.cursor) {
      return [];
    }

    return [
      {
        color: participant.info.color,
        connectionId: participant.connectionId,
        cursor: participant.presence.cursor,
        id: participant.id,
        name: participant.info.name || "Collaborator",
        thinking: participant.presence.thinking ?? false,
      },
    ];
  });

  return (
    <ViewportPortal>
      {cursors.map((participant) => (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20"
          key={participant.connectionId}
          style={{
            transform: `translate(${participant.cursor.x}px, ${participant.cursor.y}px)`,
          }}
        >
          <div
            className="relative origin-top-left"
            style={{ transform: `scale(${1 / Math.max(zoom, 0.01)})` }}
          >
            <svg
              aria-hidden="true"
              className="drop-shadow-lg"
              fill="none"
              focusable="false"
              height="22"
              viewBox="0 0 20 22"
              width="20"
            >
              <path
                d="M2 2L16 10L9.5 11.8L6.5 20L2 2Z"
                fill={participant.color}
                stroke="var(--bg-base)"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <div
              className="absolute left-4 top-4 flex max-w-36 items-center gap-1.5 truncate rounded-xl px-2 py-1 text-[11px] font-semibold leading-none text-text-primary shadow-lg ring-1 ring-bg-base"
              style={{ backgroundColor: participant.color }}
            >
              {participant.thinking ? (
                <Loader2Icon aria-hidden="true" className="h-3 w-3 shrink-0 animate-spin" />
              ) : null}
              <span className="truncate">{participant.name}</span>
            </div>
          </div>
        </div>
      ))}
    </ViewportPortal>
  );
}
