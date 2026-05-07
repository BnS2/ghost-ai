"use client";

import { useCallback, useState } from "react";

export interface Project {
	id: string;
	name: string;
	slug: string;
	isOwned: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

interface UseProjectDialogsReturn {
	dialogType: DialogType;
	selectedProject: Project | null;
	isLoading: boolean;
	openCreateDialog: () => void;
	openRenameDialog: (project: Project) => void;
	openDeleteDialog: (project: Project) => void;
	closeDialog: () => void;
	setLoading: (loading: boolean) => void;
}

export function useProjectDialogs(): UseProjectDialogsReturn {
	const [dialogType, setDialogType] = useState<DialogType>(null);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [isLoading, setIsLoading] = useState(false);

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

	const setLoading = useCallback((loading: boolean) => {
		setIsLoading(loading);
	}, []);

	return {
		dialogType,
		selectedProject,
		isLoading,
		openCreateDialog,
		openRenameDialog,
		openDeleteDialog,
		closeDialog,
		setLoading,
	};
}

export function generateSlug(name: string): string {
	const slug = name
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	if (slug) return slug;

	// Fallback for purely non-Latin names (e.g. CJK): hex codepoints
	return Array.from(name)
		.map((c) => (c.codePointAt(0) ?? 0).toString(16))
		.join("-");
}
