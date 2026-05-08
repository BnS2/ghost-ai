"use client";

import { UserButton } from "@clerk/nextjs";
import { MessageSquareIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName = "Untitled Project",
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
          <div className="text-xs font-bold text-accent px-1.5 py-0.5 rounded border border-accent/20 bg-accent/5 hidden sm:block">
            GHOST
          </div>
          <div className="text-sm font-medium text-text-primary truncate">{projectName}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-text-secondary hover:text-text-primary hidden sm:flex"
        >
          <Share2Icon className="h-4 w-4" />
          Share
        </Button>
        <div className="w-px h-4 bg-border-subtle mx-1 hidden sm:block" />
        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary">
          <MessageSquareIcon className="h-5 w-5" />
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
