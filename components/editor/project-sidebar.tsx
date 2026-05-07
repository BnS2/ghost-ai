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
      {isOpen && (
        <button 
          type="button"
          className="fixed inset-0 bg-transparent z-40 border-none cursor-pointer" 
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        id="project-sidebar"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-surface border-r border-border-subtle z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-border-subtle/50">
          <h2 className="text-xl font-medium text-text-primary tracking-tight">Projects</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon className="h-5 w-5 text-text-muted" />
          </Button>
        </div>

        <div className="px-6 pt-6 flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
            <div className="bg-elevated p-1 rounded-full mb-6">
              <TabsList className="w-full bg-transparent p-0 h-9 border-none flex">
                <TabsTrigger 
                  value="my-projects" 
                  className="flex-1 rounded-full text-sm font-semibold transition-all data-active:bg-base dark:data-active:bg-base data-active:text-text-primary dark:data-active:text-text-primary data-active:shadow-none data-active:border-transparent text-text-muted hover:text-text-secondary"
                >
                  My Projects
                </TabsTrigger>
                <TabsTrigger 
                  value="shared" 
                  className="flex-1 rounded-full text-sm font-semibold transition-all data-active:bg-base dark:data-active:bg-base data-active:text-text-primary dark:data-active:text-text-primary data-active:shadow-none data-active:border-transparent text-text-muted hover:text-text-secondary"
                >
                  Shared
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="my-projects" className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[15px] text-text-muted font-normal tracking-wide">No projects yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="shared" className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[15px] text-text-muted font-normal tracking-wide">No shared projects.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 mt-auto flex items-center gap-3 border-t border-border-subtle/50">
          <Button className="flex-1 bg-accent-primary hover:bg-accent-primary/90 text-black font-bold gap-2 rounded-xl h-12 border-none shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <PlusIcon className="h-4 w-4" strokeWidth={3.5} />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
