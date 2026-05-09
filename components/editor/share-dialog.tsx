"use client";

import { CheckIcon, CopyIcon, Loader2Icon, MailIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isOwner: boolean;
}

export function ShareDialog({ isOpen, onClose, projectId, isOwner }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data);
      }
    } catch (error) {
      console.error("Failed to fetch collaborators", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        void fetchCollaborators();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchCollaborators]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isInviting) return;

    setIsInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setEmail("");
        void fetchCollaborators();
      } else {
        const error = await res.text();
        console.error("Failed to invite collaborator:", error);
      }
    } catch (error) {
      console.error("Failed to invite collaborator", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (targetEmail: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(targetEmail)}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        void fetchCollaborators();
      }
    } catch (error) {
      console.error("Failed to remove collaborator", error);
    }
  };

  const copyLink = () => {
    const url = `${origin}/editor/${projectId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface border-border-default rounded-3xl flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-text-primary text-xl font-bold tracking-tight">
            Share Project
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            {isOwner
              ? "Manage who can view and edit this project."
              : "View current project collaborators."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
          {/* Invite Section */}
          {isOwner && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Collaborator email"
                  className="pl-9 bg-base border-border-subtle focus:border-accent-primary rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="bg-accent-primary text-black hover:bg-accent-primary/90 rounded-xl px-4"
              >
                {isInviting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlusIcon className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline text-xs font-bold">Invite</span>
              </Button>
            </form>
          )}

          {/* Collaborator List */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Collaborators
            </h4>
            <ScrollArea className="h-[160px] pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2Icon className="h-6 w-6 animate-spin text-accent-primary/50" />
                </div>
              ) : collaborators.length === 0 ? (
                <div className="text-center py-12 bg-base/50 rounded-2xl border border-dashed border-border-subtle">
                  <p className="text-text-muted text-sm italic">No collaborators added yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-base border border-border-subtle group hover:border-border-default hover:bg-surface/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-border-subtle shrink-0">
                          <AvatarImage src={collab.imageUrl || undefined} />
                          <AvatarFallback className="bg-surface text-text-secondary text-xs font-bold">
                            {collab.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex flex-col">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {collab.name || collab.email.split("@")[0]}
                          </p>
                          <p className="text-[11px] text-text-muted truncate leading-none mt-0.5">
                            {collab.email}
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-muted hover:text-state-error hover:bg-state-error/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                          onClick={() => handleRemove(collab.email)}
                          aria-label={`Remove ${collab.email}`}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Copy Link Section */}
          {isOwner && (
            <div className="pt-3 border-t border-border-subtle space-y-2">
              <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                Project Link
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-base border border-border-subtle rounded-xl text-[11px] text-text-secondary truncate font-mono">
                  {origin ? `${origin}/editor/${projectId}` : ""}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className={cn(
                    "h-9 px-4 rounded-xl border-border-subtle bg-surface/50 hover:bg-surface hover:text-text-primary transition-all shrink-0",
                    copied &&
                      "border-state-success text-state-success hover:border-state-success hover:text-state-success",
                  )}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 mr-2" />{" "}
                      <span className="text-xs font-bold tracking-tight">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5 mr-2" />{" "}
                      <span className="text-xs font-bold tracking-tight">Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
