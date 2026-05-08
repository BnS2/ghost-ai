"use client";

import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { Project } from "@/components/editor/use-project-dialogs";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";

interface EditorViewProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function EditorView({ ownedProjects, sharedProjects }: EditorViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <div className="relative min-h-screen bg-bg-base flex flex-col font-sans">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            Create a project or open an existing one
          </h1>
          <p className="text-text-secondary">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <div className="pt-4">
            <Button
              onClick={openCreateDialog}
              className="bg-accent-primary hover:bg-accent-primary/90 text-black font-bold gap-2 p-5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={3.5} />
              New Project
            </Button>
          </div>
        </div>
      </main>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={allProjects}
        onCreateProject={openCreateDialog}
        onRenameProject={openRenameDialog}
        onDeleteProject={openDeleteDialog}
      />

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
