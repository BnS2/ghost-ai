"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { Project } from "@/components/editor/use-project-dialogs";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { useProjectActions } from "@/hooks/use-project-actions";

interface WorkspaceViewProps {
  project: { id: string; name: string; ownerId: string };
  ownedProjects: Project[];
  sharedProjects: Project[];
  isOwner: boolean;
}

export function WorkspaceView({
  project,
  ownedProjects,
  sharedProjects,
  isOwner,
}: WorkspaceViewProps) {
  const subscribe = useCallback((callback: () => void) => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  }, []);

  const getSnapshot = () => window.matchMedia("(min-width: 768px)").matches;
  const getServerSnapshot = () => false;

  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpenInternal, setIsAiSidebarOpenInternal] = useState<boolean | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");
  const saveRef = useRef<(() => void) | null>(null);
  const [templateImport, setTemplateImport] = useState<{
    id: number;
    template: CanvasTemplate;
  } | null>(null);
  const templateImportIdRef = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: must reset when project changes
  useEffect(() => {
    const id = setTimeout(() => setSaveStatus("idle"), 0);
    saveRef.current = null;
    return () => clearTimeout(id);
  }, [project.id]);

  // Derived state: Use internal override if set, otherwise follow isDesktop
  const isAiSidebarOpen = isAiSidebarOpenInternal ?? isDesktop;

  const toggleAiSidebar = useCallback(() => {
    setIsAiSidebarOpenInternal((prev) => !(prev ?? isDesktop));
  }, [isDesktop]);
  const importTemplate = useCallback((template: CanvasTemplate) => {
    templateImportIdRef.current += 1;
    setTemplateImport({ id: templateImportIdRef.current, template });
  }, []);
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
        saveStatus={saveStatus}
        onSave={() => saveRef.current?.()}
        isAiSidebarOpen={isAiSidebarOpen}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onToggleAiSidebar={toggleAiSidebar}
        onShare={() => setIsShareDialogOpen(true)}
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
          <CanvasWrapper
            projectId={project.id}
            onSaveStatusChange={setSaveStatus}
            saveRef={saveRef}
            onTemplateImported={() => setTemplateImport(null)}
            templateImport={templateImport}
          />
        </main>

        <AiSidebar isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpenInternal(false)} />
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
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        projectId={project.id}
        isOwner={isOwner}
      />
      <StarterTemplatesModal
        onImport={importTemplate}
        onOpenChange={setIsTemplatesModalOpen}
        open={isTemplatesModalOpen}
      />
    </div>
  );
}
