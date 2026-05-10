"use client";

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";
import { useEffect } from "react";

const VIEWPORT_ANIMATION_MS = 180;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

export function useKeyboardShortcuts<NodeType extends Node, EdgeType extends Edge>(
  reactFlow: ReactFlowInstance<NodeType, EdgeType>,
  undo: () => void,
  redo: () => void,
  clipboardActions?: {
    copy: () => boolean;
    duplicate: () => boolean;
    paste: () => boolean;
  },
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (isModifierPressed && !event.shiftKey && event.key.toLowerCase() === "c") {
        if (clipboardActions?.copy()) {
          event.preventDefault();
        }

        return;
      }

      if (isModifierPressed && !event.shiftKey && event.key.toLowerCase() === "v") {
        if (clipboardActions?.paste()) {
          event.preventDefault();
        }

        return;
      }

      if (isModifierPressed && !event.shiftKey && event.key.toLowerCase() === "d") {
        if (clipboardActions?.duplicate()) {
          event.preventDefault();
        }

        return;
      }

      if (isModifierPressed && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
          return;
        }

        undo();
        return;
      }

      if (isModifierPressed && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (!isModifierPressed && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_MS });
        return;
      }

      if (!isModifierPressed && event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_MS });
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [clipboardActions, reactFlow, redo, undo]);
}
