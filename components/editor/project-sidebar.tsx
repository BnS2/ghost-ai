"use client";

import { MoreVerticalIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Project } from "./use-project-dialogs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreateProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

function ProjectItem({
  project,
  onRename,
  onDelete,
}: {
  project: Project;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const router = useRouter();

  return (
    <div className="group relative">
      <div className="flex items-center gap-1 rounded-lg hover:bg-white/5 transition-colors group/item">
        <button
          type="button"
          className="flex-1 min-w-0 p-3 text-left focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 rounded-lg"
          onClick={() => router.push(`/editor/${project.id}`)}
        >
          <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
          <p className="text-xs text-text-muted font-mono truncate">{project.slug}</p>
        </button>

        {project.isOwned && (
          <div className="pr-2">
            <button
              type="button"
              className={cn(
                "p-1.5 rounded-md transition-colors hover:bg-white/10",
                showActions ? "bg-white/10 text-text-primary" : "text-text-muted",
              )}
              onClick={() => setShowActions(!showActions)}
              aria-label="Project actions"
              aria-expanded={showActions}
              aria-haspopup="true"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {showActions && project.isOwned && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setShowActions(false)}
            aria-label="Close actions"
          />
          <div className="absolute right-2 top-12 bg-elevated border border-border-subtle rounded-lg shadow-xl py-1 z-20 min-w-[140px] animate-in fade-in zoom-in duration-100">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-white/5 flex items-center gap-2 transition-colors focus-visible:bg-white/5 focus-visible:outline-none"
              onClick={() => {
                onRename();
                setShowActions(false);
              }}
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors focus-visible:bg-destructive/10 focus-visible:outline-none"
              onClick={() => {
                onDelete();
                setShowActions(false);
              }}
            >
              <Trash2Icon className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((p) => p.isOwned);
  const sharedProjects = projects.filter((p) => !p.isOwned);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-overlay backdrop-blur-sm z-40 border-none cursor-pointer"
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
          isOpen ? "translate-x-0" : "-translate-x-full",
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

        <div className="px-6 pt-6 flex-1 flex flex-col min-h-0 overflow-hidden">
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

            <TabsContent value="my-projects" className="flex-1 overflow-y-auto -mx-2 px-2">
              {ownedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[15px] text-text-muted font-normal tracking-wide">
                    No projects yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {ownedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-y-auto -mx-2 px-2">
              {sharedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[15px] text-text-muted font-normal tracking-wide">
                    No shared projects.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sharedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 mt-auto flex items-center gap-3 border-t border-border-subtle/50">
          <Button
            onClick={onCreateProject}
            className="flex-1 bg-accent-primary hover:bg-accent-primary/90 text-black font-bold gap-2 rounded-xl h-12 border-none shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={3.5} />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
