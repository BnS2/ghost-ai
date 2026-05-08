"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftCloseIcon, PanelLeftOpenIcon, Share2Icon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName = "Untitled Project",
  isAiSidebarOpen = false,
  onToggleAiSidebar,
}: EditorNavbarProps) {
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
          <div className="text-sm font-medium text-text-primary truncate">{projectName}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 px-4 rounded-full bg-surface/50 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface transition-all hidden sm:flex"
        >
          <Share2Icon className="h-4 w-4" />
          <span className="text-xs font-bold">Share</span>
        </Button>
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
