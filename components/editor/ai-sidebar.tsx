"use client";

import { useUser } from "@clerk/nextjs";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useEventListener,
  useFeedMessages,
} from "@liveblocks/react/suspense";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useReactFlow } from "@xyflow/react";
import {
  BotIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { SpecPreviewModal } from "@/components/editor/spec-preview-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { designAgentTask } from "@/trigger/design-agent";
import type { generateSpec } from "@/trigger/generate-spec";
import { chatMessageSchema } from "@/types/tasks";

interface SpecItem {
  id: string;
  filePath: string | null;
  createdAt: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const COMPOSER_MIN_HEIGHT = 72;
const COMPOSER_MAX_HEIGHT = 160;

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const completionHandledRef = useRef(false);

  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null);
  const [specId, setSpecId] = useState<string | null>(null);
  const [specSendError, setSpecSendError] = useState<string | null>(null);
  const specCompletionHandledRef = useRef(false);
  const submitPendingRef = useRef(false);
  const specSubmitPendingRef = useRef(false);

  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { user } = useUser();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { messages: feedMessages } = useFeedMessages("ai-chat");

  useEffect(() => {
    createFeed("ai-chat").catch(() => {
      // Feed may already exist — that's fine
    });
  }, [createFeed]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    startTransition(() => {
      setSpecsLoading(true);
    });

    fetch(`/api/projects/${projectId}/specs`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load specs (${response.status})`);
        }

        const data: unknown = await response.json();

        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data) ||
          !("specs" in data) ||
          !Array.isArray((data as Record<string, unknown>).specs)
        ) {
          throw new Error("Invalid response");
        }

        setSpecs((data as { specs: SpecItem[] }).specs);
      })
      .catch(() => {
        setSpecs([]);
      })
      .finally(() => {
        setSpecsLoading(false);
      });
  }, [projectId]);

  useEventListener(({ event }) => {
    if (event.type !== "AI_STATUS") {
      return;
    }
    setStatusText(event.text ?? event.message ?? null);
  });

  const { run } = useRealtimeRun<typeof designAgentTask>(runId ?? undefined, {
    accessToken: publicToken ?? "",
    enabled: !!runId,
  });

  const reactFlow = useReactFlow();

  const { run: specRun } = useRealtimeRun<typeof generateSpec>(specRunId ?? undefined, {
    accessToken: specPublicToken ?? "",
    enabled: !!specRunId,
  });

  const isSpecGenerating =
    specRunId !== null &&
    (!specRun || !["COMPLETED", "FAILED", "CANCELED", "EXPIRED"].includes(specRun.status));

  useEffect(() => {
    const status = run?.status;

    if (!status || !runId) {
      return;
    }

    if (!["COMPLETED", "FAILED", "CANCELED", "EXPIRED"].includes(status)) {
      return;
    }

    if (completionHandledRef.current) {
      return;
    }

    completionHandledRef.current = true;

    const sender = "Ghost AI";
    let message: string;

    if (status === "FAILED") {
      message = "Design generation failed. Please try again.";
    } else if (status === "CANCELED" || status === "EXPIRED") {
      message = "Design generation was canceled or expired.";
    } else {
      const count = run?.output?.actionCount ?? 0;
      message = `Design complete — ${count} action${count === 1 ? "" : "s"} applied.`;
    }

    createFeedMessage("ai-chat", {
      sender,
      role: "assistant",
      content: message,
      timestamp: Date.now(),
    })
      .then(() => {
        setRunId(null);
        setPublicToken(null);
        setStatusText(null);
        completionHandledRef.current = false;
      })
      .catch(() => {
        setRunId(null);
        setPublicToken(null);
        setStatusText(null);
        completionHandledRef.current = false;
      });
  }, [run?.status, run?.output?.actionCount, runId, createFeedMessage]);

  useEffect(() => {
    const status = specRun?.status;

    if (!status || !specRunId || !specId) {
      return;
    }

    if (!["COMPLETED", "FAILED", "CANCELED", "EXPIRED"].includes(status)) {
      return;
    }

    if (specCompletionHandledRef.current) {
      return;
    }

    specCompletionHandledRef.current = true;

    if (status === "COMPLETED" && specRun?.output?.spec) {
      fetch(`/api/projects/${projectId}/specs/${specId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: specRun.output.spec }),
      })
        .then(async (patchRes) => {
          if (!patchRes.ok) {
            throw new Error(`Save failed (${patchRes.status})`);
          }
          return fetch(`/api/projects/${projectId}/specs`);
        })
        .then(async (res) => {
          if (res.ok) {
            const data: unknown = await res.json();
            if (
              data &&
              typeof data === "object" &&
              !Array.isArray(data) &&
              "specs" in data &&
              Array.isArray((data as Record<string, unknown>).specs)
            ) {
              setSpecs((data as { specs: SpecItem[] }).specs);
            }
          }
        })
        .catch(() => {
          setSpecSendError("Failed to save the generated spec. Please try again.");
        })
        .finally(() => {
          setSpecRunId(null);
          setSpecPublicToken(null);
          setSpecId(null);
          setSpecSendError(null);
          specCompletionHandledRef.current = false;
        });
    } else {
      const errorMessage =
        status === "FAILED"
          ? "Spec generation failed. Please try again."
          : "Spec generation was canceled or expired.";
      startTransition(() => {
        setSpecSendError(errorMessage);
        setTimeout(() => setSpecSendError(null), 5000);
        setSpecRunId(null);
        setSpecPublicToken(null);
        setSpecId(null);
      });
      specCompletionHandledRef.current = false;
    }
  }, [specRun?.status, specRun?.output?.spec, specRunId, specId, projectId]);

  const isGenerating =
    runId !== null &&
    (!run || !["COMPLETED", "FAILED", "CANCELED", "EXPIRED"].includes(run.status));

  const resizeComposer = useCallback((composer: HTMLTextAreaElement) => {
    composer.style.height = `${COMPOSER_MIN_HEIGHT}px`;
    const nextHeight = Math.min(composer.scrollHeight, COMPOSER_MAX_HEIGHT);
    composer.style.height = `${nextHeight}px`;
    composer.style.overflowY = composer.scrollHeight > COMPOSER_MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  const submitPrompt = useCallback(async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || !user || isGenerating || submitPendingRef.current) {
      return;
    }

    submitPendingRef.current = true;

    const sender = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Unknown";

    try {
      await createFeedMessage("ai-chat", {
        sender,
        role: "user",
        content: trimmedPrompt,
        timestamp: Date.now(),
      });

      setPrompt("");
      setSendError(null);
      completionHandledRef.current = false;

      if (composerRef.current) {
        composerRef.current.style.height = `${COMPOSER_MIN_HEIGHT}px`;
        composerRef.current.style.overflowY = "hidden";
      }

      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roomId: projectId,
          prompt: trimmedPrompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        !("runId" in data) ||
        !("publicToken" in data) ||
        typeof (data as Record<string, unknown>).runId !== "string" ||
        typeof (data as Record<string, unknown>).publicToken !== "string"
      ) {
        throw new Error("Invalid API response");
      }

      const { runId: responseRunId, publicToken: responseToken } = data as {
        runId: string;
        publicToken: string;
      };

      setRunId(responseRunId);
      setPublicToken(responseToken);
      submitPendingRef.current = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message.";

      createFeedMessage("ai-chat", {
        sender: "Ghost AI",
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: Date.now(),
      }).catch(() => {
        setSendError(errorMessage);
      });

      submitPendingRef.current = false;
    }
  }, [prompt, user, isGenerating, createFeedMessage, projectId]);

  const handleGenerateSpec = useCallback(async () => {
    if (!user || isSpecGenerating || specSubmitPendingRef.current) {
      return;
    }

    specSubmitPendingRef.current = true;

    try {
      setSpecSendError(null);
      specCompletionHandledRef.current = false;

      const nodes = reactFlow.getNodes() as unknown[];
      const edges = reactFlow.getEdges() as unknown[];

      const chatMessages = feedMessages
        .map((msg) => {
          const parsed = chatMessageSchema.safeParse(msg.data);
          return parsed.success ? parsed.data : null;
        })
        .filter(Boolean);

      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory: chatMessages,
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
      }

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        !("runId" in data) ||
        !("specId" in data) ||
        typeof (data as Record<string, unknown>).runId !== "string" ||
        typeof (data as Record<string, unknown>).specId !== "string"
      ) {
        throw new Error("Invalid API response");
      }

      const { runId: responseRunId, specId: responseSpecId } = data as {
        runId: string;
        specId: string;
      };

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: responseRunId }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed (${tokenResponse.status})`);
      }

      const tokenData: unknown = await tokenResponse.json();

      if (
        !tokenData ||
        typeof tokenData !== "object" ||
        Array.isArray(tokenData) ||
        !("token" in tokenData) ||
        typeof (tokenData as Record<string, unknown>).token !== "string"
      ) {
        throw new Error("Invalid token response");
      }

      const { token } = tokenData as { token: string };

      setSpecRunId(responseRunId);
      setSpecPublicToken(token);
      setSpecId(responseSpecId);
      specSubmitPendingRef.current = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate spec.";
      setSpecSendError(errorMessage);
      setTimeout(() => setSpecSendError(null), 5000);
      specSubmitPendingRef.current = false;
    }
  }, [user, isSpecGenerating, projectId, reactFlow, feedMessages]);

  const handleComposerInput = useCallback(
    (event: FormEvent<HTMLTextAreaElement>) => {
      const composer = event.currentTarget;
      setPrompt(composer.value);
      resizeComposer(composer);
    },
    [resizeComposer],
  );

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void submitPrompt();
  };

  return (
    <aside
      aria-label="AI workspace"
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
      className={cn(
        "absolute top-4 right-4 bottom-4 z-30 flex w-[min(380px,calc(100%-2rem))] flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-[calc(100%+2rem)] opacity-0",
      )}
    >
      <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary-dim text-accent-primary">
          <BotIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-text-primary">AI Workspace</h2>
          <p className="truncate text-xs text-text-muted">Collaborate with Ghost AI</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary"
          aria-label="Close AI workspace"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="border-b border-surface-border px-4 py-3">
          <TabsList className="grid h-9 w-full grid-cols-2 bg-subtle">
            <TabsTrigger
              value="architect"
              className="text-text-muted data-active:bg-accent-primary data-active:text-background data-active:shadow-[0_0_18px_rgba(0,200,212,0.22)]"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-text-muted data-active:bg-accent-primary data-active:text-background data-active:shadow-[0_0_18px_rgba(0,200,212,0.22)]"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="architect" className="flex min-h-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {feedMessages.length === 0 ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-accent-primary/25 bg-accent-primary-dim text-accent-primary">
                    <BotIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Start with a system idea
                  </h3>
                  <p className="mt-2 max-w-[270px] text-xs leading-5 text-text-muted">
                    Ask Ghost AI to sketch an architecture, refine a component, or send a message to
                    collaborators in the room.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((starterPrompt) => (
                      <button
                        key={starterPrompt}
                        type="button"
                        onClick={() => setPrompt(starterPrompt)}
                        className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-accent-ai-text transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-accent-primary"
                      >
                        {starterPrompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {feedMessages.map((message) => {
                    const parsed = chatMessageSchema.safeParse(message.data);

                    if (!parsed.success) {
                      return null;
                    }

                    const { sender, role, content, timestamp } = parsed.data;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[86%] rounded-2xl px-3 py-2",
                          role === "user"
                            ? "self-end bg-[#62C073] text-black"
                            : "self-start border border-surface-border bg-elevated text-text-primary",
                        )}
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-[11px] font-semibold",
                              role === "user" ? "text-black/80" : "text-text-primary",
                            )}
                          >
                            {sender}
                          </span>
                          <span
                            className={cn(
                              "text-[10px]",
                              role === "user" ? "text-black/60" : "text-text-muted",
                            )}
                          >
                            {new Date(timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-5">{content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {sendError ? (
              <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2">
                <p className="text-xs text-destructive">{sendError}</p>
              </div>
            ) : null}

            {isGenerating && statusText ? (
              <div
                aria-live="polite"
                className="flex items-center gap-2.5 border-t border-surface-border bg-elevated px-4 py-2.5"
              >
                <Loader2Icon
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 animate-spin text-[#62C073]"
                />
                <span className="truncate text-xs text-text-secondary">{statusText}</span>
              </div>
            ) : null}

            <div className="border-t border-surface-border bg-base/80 p-4">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={composerRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onInput={handleComposerInput}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask Ghost AI to design, explain, or refine..."
                  className="max-h-40 min-h-[72px] resize-none bg-elevated/60 text-sm"
                  aria-label="AI prompt"
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  onClick={() => void submitPrompt()}
                  disabled={!prompt.trim() || isGenerating}
                  className="h-10 w-10 rounded-xl bg-[#62C073] p-0 text-white hover:bg-[#62C073]/85 disabled:opacity-50"
                  aria-label="Send prompt"
                >
                  {isGenerating ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="flex min-h-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
            <Button
              type="button"
              className="h-9 w-full gap-2 bg-accent-primary text-white hover:bg-accent-primary/85"
              onClick={() => void handleGenerateSpec()}
              disabled={isSpecGenerating}
            >
              {isSpecGenerating ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {isSpecGenerating ? "Generating..." : "Generate Spec"}
            </Button>

            {specSendError ? (
              <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <p className="text-xs text-destructive">{specSendError}</p>
              </div>
            ) : null}

            {isSpecGenerating ? (
              <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-surface-border bg-elevated px-3 py-2">
                <Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin text-[#62C073]" />
                <span className="text-xs text-text-secondary">
                  {((specRun?.metadata as Record<string, unknown> | undefined)?.message as
                    | string
                    | undefined) ?? "Generating specification..."}
                </span>
              </div>
            ) : null}

            {specsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon aria-hidden="true" className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : specs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <FileTextIcon className="mb-3 h-8 w-8 text-text-muted/50" aria-hidden="true" />
                <p className="text-sm text-text-muted">No specs yet</p>
                <p className="mt-1 max-w-[220px] text-xs text-text-muted/70">
                  Generate a spec to see it here.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {specs.map((spec) => {
                  const filename = `spec-${spec.id}.md`;

                  return (
                    // biome-ignore lint/a11y/useSemanticElements: nested interactive elements require role=button
                    <div
                      key={spec.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedSpecId(spec.id);
                        setPreviewOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedSpecId(spec.id);
                          setPreviewOpen(true);
                        }
                      }}
                      className="flex items-center gap-3 rounded-xl border border-surface-border bg-elevated/60 p-3 text-left transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-accent-primary"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary-dim/80 text-accent-primary">
                        <FileTextIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{filename}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(spec.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          const anchor = document.createElement("a");
                          anchor.href = `/api/projects/${projectId}/specs/${spec.id}/download`;
                          anchor.download = filename;
                          anchor.click();
                        }}
                        className="text-text-muted hover:text-text-primary"
                        aria-label={`Download ${filename}`}
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SpecPreviewModal
        specId={selectedSpecId}
        projectId={projectId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </aside>
  );
}
