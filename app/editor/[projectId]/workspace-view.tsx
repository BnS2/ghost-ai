"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { Project } from "@/components/editor/use-project-dialogs";
import { useProjectActions } from "@/hooks/use-project-actions";

interface WorkspaceViewProps {
	project: { id: string; name: string };
	ownedProjects: Project[];
	sharedProjects: Project[];
}

export function WorkspaceView({
	project,
	ownedProjects,
	sharedProjects,
}: WorkspaceViewProps) {
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

	const allProjects = [...ownedProjects, ...sharedProjects];

	return (
		<div className="relative min-h-screen bg-bg-base flex flex-col font-sans">
			<EditorNavbar
				isSidebarOpen={isSidebarOpen}
				onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
			/>

			<main className="flex-1 flex items-center justify-center p-4">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-text-primary">
						Workspace: {project.name}
					</h1>
					<p className="text-text-secondary font-mono text-sm">{project.id}</p>
					<div className="p-8 border-2 border-dashed border-border-subtle rounded-3xl opacity-20">
						Canvas placeholder
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
