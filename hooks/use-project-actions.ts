"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
	type DialogType,
	generateSlug,
	type Project,
} from "@/components/editor/use-project-dialogs";

export function useProjectActions() {
	const [dialogType, setDialogType] = useState<DialogType>(null);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const openCreateDialog = useCallback(() => {
		setDialogType("create");
		setSelectedProject(null);
	}, []);

	const openRenameDialog = useCallback((project: Project) => {
		setDialogType("rename");
		setSelectedProject(project);
	}, []);

	const openDeleteDialog = useCallback((project: Project) => {
		setDialogType("delete");
		setSelectedProject(project);
	}, []);

	const closeDialog = useCallback(() => {
		setDialogType(null);
		setSelectedProject(null);
		setIsLoading(false);
	}, []);

	const handleCreate = async (name: string, suffix?: string) => {
		if (!name.trim()) return;
		setIsLoading(true);
		try {
			// Use provided suffix or generate a new one
			const finalSuffix = suffix || Math.random().toString(36).substring(2, 6);
			const slug = `${generateSlug(name)}-${finalSuffix}`;

			const response = await fetch("/api/projects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: name.trim(), id: slug }),
			});

			if (!response.ok) throw new Error("Failed to create project");

			const project = await response.json();
			router.push(`/editor/${project.id}`);
			closeDialog();
		} catch (error) {
			console.error("[PROJECT_CREATE_ERROR]", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleRename = async (projectId: string, newName: string) => {
		if (!newName.trim()) return;
		setIsLoading(true);
		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: newName.trim() }),
			});

			if (!response.ok) throw new Error("Failed to rename project");

			router.refresh();
			closeDialog();
		} catch (error) {
			console.error("[PROJECT_RENAME_ERROR]", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (projectId: string) => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error("Failed to delete project");

			if (pathname === `/editor/${projectId}`) {
				router.push("/editor");
			} else {
				router.refresh();
			}
			closeDialog();
		} catch (error) {
			console.error("[PROJECT_DELETE_ERROR]", error);
		} finally {
			setIsLoading(false);
		}
	};

	return {
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
	};
}
