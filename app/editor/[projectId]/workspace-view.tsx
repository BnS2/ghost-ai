"use client";

import { useMemo, useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { Project } from "@/components/editor/use-project-dialogs";
import { useProjectActions } from "@/hooks/use-project-actions";
import { cn } from "@/lib/utils";

interface WorkspaceViewProps {
  project: { id: string; name: string };
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function WorkspaceView({ project, ownedProjects, sharedProjects }: WorkspaceViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true); // Open by default on desktop
  const {
    dialogType,
    selectedProject,
    isLoading,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions();

  const allProjects = useMemo(
    () => [...ownedProjects, ...sharedProjects],
    [ownedProjects, sharedProjects],
  );

  return (
    <div className="h-screen bg-canvas-bg flex flex-col font-sans overflow-hidden">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        projectName={project.name}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Overlay (handled by ProjectSidebar component) */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          projects={allProjects}
          onCreateProject={openCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
          activeProjectId={project.id}
          variant="persistent"
        />

        {/* Central Canvas Area */}
        <main className="flex-1 relative bg-canvas-bg overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center relative">
            {/* Grid Pattern Placeholder */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="z-10 text-center space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto border border-accent/20">
                <div className="w-8 h-8 bg-accent rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                  Canvas Ready
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  The workspace is initialized. Interactive node-based editing and Liveblocks
                  collaboration will be implemented in the next phase.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar Placeholder (AI Chat) */}
        <aside
          className={cn(
            "w-[350px] border-l border-border-subtle bg-surface flex flex-col transition-all duration-300 ease-in-out shrink-0",
            !isAiSidebarOpen && "w-0 border-none opacity-0 overflow-hidden",
          )}
        >
          <div className="p-4 border-b border-border-subtle flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-sm font-semibold text-text-primary">AI Assistant</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-text-muted">
              AI capabilities coming soon
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              In the future, you&apos;ll be able to chat with an AI to help build and refine your
              canvas nodes.
            </p>
          </div>
        </aside>
      </div>

      <ProjectDialogs
        open={dialogType !== null}
        dialogType={dialogType}
        selectedProject={selectedProject}
        isLoading={isLoading}
        onClose={closeDialog}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  );
}
