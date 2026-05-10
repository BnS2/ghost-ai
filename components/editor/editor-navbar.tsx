"use client";

import { UserButton } from "@clerk/nextjs";
import {
  LayoutTemplateIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SaveIcon,
  Share2Icon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  saveStatus?: CanvasSaveStatus;
  onSave?: () => void;
  isAiSidebarOpen?: boolean;
  onOpenTemplates?: () => void;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  saveStatus = "idle",
  onSave,
  isAiSidebarOpen = false,
  onOpenTemplates,
  onToggleAiSidebar,
  onShare,
}: EditorNavbarProps) {
  const saveStatusLabel =
    saveStatus === "saving"
      ? "Saving"
      : saveStatus === "error"
        ? "Save error"
        : saveStatus === "saved"
          ? "Saved"
          : "Save";

  return (
    <header className="h-14 border-b border-border-subtle bg-base flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-text-secondary hover:text-text-primary"
          id="sidebar-toggle"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftCloseIcon className="h-5 w-5" />
          ) : (
            <PanelLeftOpenIcon className="h-5 w-5" />
          )}
        </Button>
        <div className="flex items-center gap-2 overflow-hidden">
          <Link
            href="/editor"
            className="text-[10px] font-black tracking-widest text-accent-primary px-2 py-0.5 rounded-xl border border-accent-primary/30 bg-accent-primary/10 hidden sm:block uppercase hover:bg-accent-primary/20 transition-colors"
          >
            Ghost AI
          </Link>
          {projectName && (
            <div className="text-sm font-medium text-text-primary truncate">{projectName}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label={`Canvas ${saveStatusLabel.toLowerCase()}`}
          aria-live="polite"
          onClick={onSave}
          type="button"
          className={cn(
            "h-8 gap-2 px-4 rounded-full bg-surface/50 border border-border-subtle text-text-secondary flex items-center cursor-pointer hover:bg-surface transition-colors",
            saveStatus === "saved" && "text-state-success",
            saveStatus === "saving" && "text-text-muted",
            saveStatus === "error" && "text-state-error",
          )}
        >
          <SaveIcon className="h-4 w-4" />
          <span className="hidden text-xs font-bold sm:inline">{saveStatusLabel}</span>
        </button>
        {onOpenTemplates && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTemplates}
            aria-label="Open templates"
            className="h-8 gap-2 px-4 rounded-full bg-surface/50 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface transition-all flex"
          >
            <LayoutTemplateIcon className="h-4 w-4" />
            <span className="hidden text-xs font-bold sm:inline">Templates</span>
          </Button>
        )}
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="h-8 gap-2 px-4 rounded-full bg-surface/50 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface transition-all flex"
          >
            <Share2Icon className="h-4 w-4" />
            <span className="text-xs font-bold">Share</span>
          </Button>
        )}
        {onToggleAiSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAiSidebar}
            className={cn(
              "h-8 gap-2 px-4 rounded-full transition-all duration-300 active:scale-95",
              isAiSidebarOpen
                ? "bg-accent-primary text-black hover:bg-accent-primary/90 shadow-[0_0_15px_rgba(0,200,212,0.3)]"
                : "bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20",
            )}
            aria-label={isAiSidebarOpen ? "Close AI assistant" : "Open AI assistant"}
            aria-pressed={isAiSidebarOpen}
          >
            <SparklesIcon className={cn("h-4 w-4", isAiSidebarOpen ? "fill-black" : "fill-none")} />
            <span className="text-xs font-bold">AI</span>
          </Button>
        )}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
