"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
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
        <div className="text-sm font-medium text-text-primary">ghost ai</div>
      </div>

      <div className="flex-1 flex justify-center">
        {/* Center section - reserved for future breadcrumbs or status */}
      </div>

      <div className="flex-1 flex justify-end">
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
