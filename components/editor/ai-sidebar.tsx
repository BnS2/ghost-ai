"use client";

import { BotIcon, DownloadIcon, FileTextIcon, SendIcon, SparklesIcon, XIcon } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const COMPOSER_MIN_HEIGHT = 72;
const COMPOSER_MAX_HEIGHT = 160;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const resizeComposer = useCallback((composer: HTMLTextAreaElement) => {
    composer.style.height = `${COMPOSER_MIN_HEIGHT}px`;
    const nextHeight = Math.min(composer.scrollHeight, COMPOSER_MAX_HEIGHT);
    composer.style.height = `${nextHeight}px`;
    composer.style.overflowY = composer.scrollHeight > COMPOSER_MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  const submitPrompt = useCallback(() => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    const timestamp = Date.now();

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${timestamp}`,
        role: "user",
        content: trimmedPrompt,
      },
      {
        id: `assistant-${timestamp}`,
        role: "assistant",
        content:
          "I can use this as the starting brief once AI generation is connected. For now, keep shaping the canvas and I will stay ready here.",
      },
    ]);
    setPrompt("");
    if (composerRef.current) {
      composerRef.current.style.height = `${COMPOSER_MIN_HEIGHT}px`;
      composerRef.current.style.overflowY = "hidden";
    }
  }, [prompt]);

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
    submitPrompt();
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
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-accent-primary/25 bg-accent-primary-dim text-accent-primary">
                    <BotIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Start with a system idea
                  </h3>
                  <p className="mt-2 max-w-[270px] text-xs leading-5 text-text-muted">
                    Ask Ghost AI to sketch an architecture, refine a component, or prepare a spec
                    from the canvas.
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-5",
                        message.role === "user"
                          ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary"
                          : "self-start border border-surface-border bg-elevated text-accent-ai-text",
                      )}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                />
                <Button
                  type="button"
                  onClick={submitPrompt}
                  disabled={!prompt.trim()}
                  className="h-10 w-10 rounded-xl bg-accent-primary p-0 text-white hover:bg-accent-primary/85"
                  aria-label="Send prompt"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="flex min-h-0">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <Button
              type="button"
              className="h-9 w-full gap-2 bg-accent-primary text-white hover:bg-accent-primary/85"
            >
              <SparklesIcon className="h-4 w-4" />
              Generate Spec
            </Button>

            <Card className="border-surface-border bg-elevated" size="sm">
              <CardContent className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent-primary/25 bg-accent-primary-dim text-accent-primary">
                  <FileTextIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-text-primary">
                    Architecture Spec Draft
                  </h3>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-text-muted">
                    A generated Markdown specification will summarize services, data stores,
                    integration paths, operational concerns, and open design questions.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="mt-3 gap-2 border-surface-border text-text-muted"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
