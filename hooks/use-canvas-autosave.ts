"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasSnapshot } from "@/lib/canvas-snapshot";
import type { canvasEdge, canvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 2000;

function canvasFingerprint(nodes: canvasNode[], edges: canvasEdge[]): string {
  const parts: string[] = [];
  for (const n of nodes) {
    parts.push(`${n.id}:${Math.round(n.position.x)},${Math.round(n.position.y)}`);
    if (n.data?.label !== undefined) parts.push(`l:${n.data.label}`);
  }
  for (const e of edges) {
    parts.push(`${e.id}:${e.source}->${e.target}`);
  }
  parts.sort();
  return parts.join("|");
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
  const lastPersistedFingerprintRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const currentFingerprint = canvasFingerprint(nodes, edges);

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
      lastPersistedFingerprintRef.current = canvasFingerprint(snapshotNodes, snapshotEdges);
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

        lastPersistedFingerprintRef.current = canvasFingerprint(snapshotNodes, snapshotEdges);
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

    if (lastPersistedFingerprintRef.current === null) {
      if (isEmptyCanvas(nodes, edges)) {
        lastPersistedFingerprintRef.current = currentFingerprint;
        const id = setTimeout(() => setStatus("saved"), 0);
        return () => clearTimeout(id);
      }
    } else if (currentFingerprint === lastPersistedFingerprintRef.current) {
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
  }, [currentFingerprint, enabled, nodes, edges, save]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { save, status };
}
