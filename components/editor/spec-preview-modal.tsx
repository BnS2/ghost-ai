"use client";

import { DownloadIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecPreviewModalProps {
  specId: string | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function specFilename(specId: string): string {
  return `spec-${specId}.md`;
}

export function SpecPreviewModal({ specId, projectId, open, onOpenChange }: SpecPreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !specId || specId === fetchedRef.current) {
      return;
    }

    fetchedRef.current = specId;
    setContent(null);
    setError(null);
    setLoading(true);

    fetch(`/api/projects/${projectId}/specs/${specId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load spec (${response.status})`);
        }

        const data: unknown = await response.json();

        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data) ||
          !("content" in data) ||
          typeof (data as Record<string, unknown>).content !== "string"
        ) {
          throw new Error("Invalid spec response");
        }

        setContent((data as { content: string }).content);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load spec");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, specId, projectId]);

  useEffect(() => {
    if (!open) {
      fetchedRef.current = null;
    }
  }, [open]);

  const handleDownload = useCallback(() => {
    if (!specId) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = `/api/projects/${projectId}/specs/${specId}/download`;
    anchor.download = specFilename(specId);
    anchor.click();
  }, [specId, projectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center gap-3 px-6 pt-5 pb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent-primary/25 bg-accent-primary-dim text-accent-primary">
            <FileTextIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">
              {specId ? specFilename(specId) : "Spec"}
            </DialogTitle>
            <DialogDescription className="text-xs">Markdown preview</DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="ml-auto gap-1.5 text-text-muted hover:text-text-primary"
            aria-label="Download spec"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Download
          </Button>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-110px)] min-h-[120px]">
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2Icon aria-hidden="true" className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : content ? (
              <div className="prose-custom text-sm leading-relaxed text-text-primary">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-6 text-xl font-semibold text-text-primary first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-5 text-lg font-semibold text-text-primary">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-base font-semibold text-text-primary">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="mb-2 mt-3 text-sm font-semibold text-text-primary">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-text-secondary">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 list-disc space-y-1 pl-5 text-text-secondary">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal space-y-1 pl-5 text-text-secondary">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-text-primary">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-text-secondary">{children}</em>
                    ),
                    code: ({
                      className,
                      children,
                      ...props
                    }: React.ComponentPropsWithoutRef<"code"> & { className?: string }) => {
                      const isInline = !className?.includes("language-");

                      if (isInline) {
                        return (
                          <code
                            className="rounded-md bg-subtle px-1.5 py-0.5 text-[0.8rem] text-accent-primary"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      return (
                        <pre className="mb-3 overflow-auto rounded-xl border border-surface-border bg-subtle p-4">
                          <code
                            className="text-[0.8rem] leading-relaxed text-text-secondary"
                            {...props}
                          >
                            {children}
                          </code>
                        </pre>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    blockquote: ({ children }) => (
                      <blockquote className="mb-3 border-l-2 border-accent-primary/40 bg-subtle/50 px-4 py-2 text-text-secondary italic">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-4 border-surface-border" />,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-accent-primary underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="mb-4 overflow-auto rounded-xl border border-surface-border">
                        <table className="w-full text-left text-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="border-b border-surface-border bg-subtle/50">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 font-semibold text-text-primary">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-text-secondary">{children}</td>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
