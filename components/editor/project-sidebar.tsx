"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop for mobile or just to dim background if needed, 
          though spec says float above canvas and not push content. 
          Usually implies an overlay if it's "above" and "doesn't push".
      */}
      {isOpen && (
        <button 
          type="button"
          className="fixed inset-0 bg-black/40 z-40 transition-opacity border-none cursor-pointer" 
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-bg-surface border-r border-border-default z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Projects</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <XIcon className="h-4 w-4 text-text-muted" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="my-projects" className="flex-1 flex flex-col p-4 gap-4">
            <TabsList className="w-full justify-start bg-bg-base p-1 h-10 border border-border-subtle">
              <TabsTrigger value="my-projects" className="flex-1 data-active:bg-bg-subtle data-active:text-text-primary">My Projects</TabsTrigger>
              <TabsTrigger value="shared" className="flex-1 data-active:bg-bg-subtle data-active:text-text-primary">Shared</TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex-1 mt-0">
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border-subtle rounded-xl">
                <p className="text-sm text-text-muted">No projects yet</p>
                <p className="text-xs text-text-faint mt-1">Create your first project to get started</p>
              </div>
            </TabsContent>

            <TabsContent value="shared" className="flex-1 mt-0">
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border-subtle rounded-xl">
                <p className="text-sm text-text-muted">No shared projects</p>
                <p className="text-xs text-text-faint mt-1">Projects shared with you will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-border-subtle">
          <Button className="w-full bg-accent-primary hover:bg-accent-primary/90 text-bg-base font-semibold gap-2 rounded-xl h-11">
            <PlusIcon className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
