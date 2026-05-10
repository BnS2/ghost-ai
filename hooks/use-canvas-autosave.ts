"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasSnapshot } from "@/lib/canvas-snapshot";
import type { canvasEdge, canvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 2000;

function serializeCanvas(nodes: canvasNode[], edges: canvasEdge[]) {
  return JSON.stringify({ edges, nodes });
}

function isEmptyCanvas(nodes: canvasNode[], edges: canvasEdge[]) {
  return nodes.length === 0 && edges.length === 0;
}

interface UseCanvasAutosaveOptions {
  enabled: boolean;
}

export function useCanvasAutosave(
  projectId: string,
  nodes: canvasNode[],
  edges: canvasEdge[],
  { enabled }: UseCanvasAutosaveOptions,
) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const lastPersistedSnapshotRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const latestSnapshot = serializeCanvas(nodes, edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const save = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    abortControllerRef.current?.abort();

    const snapshotNodes = nodesRef.current;
    const snapshotEdges = edgesRef.current;

    if (isEmptyCanvas(snapshotNodes, snapshotEdges)) {
      lastPersistedSnapshotRef.current = serializeCanvas(snapshotNodes, snapshotEdges);
      setStatus("saved");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setStatus("saving");

    const snapshot: CanvasSnapshot = { edges: snapshotEdges, nodes: snapshotNodes };

    fetch(`/api/projects/${projectId}/canvas`, {
      body: JSON.stringify(snapshot),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Canvas save failed with ${response.status}`);
        }

        lastPersistedSnapshotRef.current = serializeCanvas(snapshotNodes, snapshotEdges);
        setStatus("saved");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to save canvas", error);
        setStatus("error");
      });
  }, [projectId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (lastPersistedSnapshotRef.current === null) {
      if (isEmptyCanvas(nodes, edges)) {
        lastPersistedSnapshotRef.current = latestSnapshot;
        const id = setTimeout(() => setStatus("saved"), 0);
        return () => clearTimeout(id);
      }
    } else if (latestSnapshot === lastPersistedSnapshotRef.current) {
      return;
    }

    setStatus("idle");

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      save();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [edges, enabled, latestSnapshot, nodes, save]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { save, status };
}
