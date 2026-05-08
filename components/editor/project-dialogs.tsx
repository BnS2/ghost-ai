"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateSlug, generateSuffix } from "@/lib/identifiers";
import type { Project } from "./use-project-dialogs";

interface ProjectDialogsProps {
	open: boolean;
	dialogType: "create" | "rename" | "delete" | null;
	selectedProject: Project | null;
	isLoading?: boolean;
	onClose: () => void;
	onCreate?: (name: string, suffix: string) => void;
	onRename?: (projectId: string, name: string) => void;
	onDelete?: (projectId: string) => void;
}

export function ProjectDialogs({
	open,
	dialogType,
	selectedProject,
	isLoading,
	onClose,
	onCreate,
	onRename,
	onDelete,
}: ProjectDialogsProps) {
	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			onClose();
		}
	};

	if (dialogType === "create") {
		return (
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<CreateDialogContent
					onClose={onClose}
					onCreate={onCreate}
					isLoading={isLoading}
				/>
			</Dialog>
		);
	}

	if (dialogType === "rename" && selectedProject) {
		return (
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<RenameDialogContent
					key={selectedProject.id}
					project={selectedProject}
					onClose={onClose}
					onRename={onRename}
					isLoading={isLoading}
				/>
			</Dialog>
		);
	}

	if (dialogType === "delete" && selectedProject) {
		return (
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DeleteDialogContent
					project={selectedProject}
					onClose={onClose}
					onDelete={onDelete}
					isLoading={isLoading}
				/>
			</Dialog>
		);
	}

	return null;
}

function CreateDialogContent({
	onClose,
	onCreate,
	isLoading,
}: {
	onClose: () => void;
	onCreate?: (name: string, suffix: string) => void;
	isLoading?: boolean;
}) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [suffix] = useState(() => generateSuffix());

	const handleNameChange = (value: string) => {
		setName(value);
		setSlug(generateSlug(value));
	};

	const handleSubmit = () => {
		onCreate?.(name, suffix);
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Create Project</DialogTitle>
				<DialogDescription>
					Give your project a name to get started.
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4">
				<div className="grid gap-2">
					<label
						htmlFor="project-name"
						className="text-sm font-medium text-text-primary"
					>
						Project Name
					</label>
					<Input
						id="project-name"
						placeholder="My Architecture Project"
						value={name}
						onChange={(e) => handleNameChange(e.target.value)}
						disabled={isLoading}
						autoFocus
					/>
				</div>
				{slug && (
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2 text-sm text-text-muted">
							<code className="px-2 py-1 bg-elevated rounded-md font-mono text-accent-primary">
								{slug}-{suffix}
							</code>
						</div>
					</div>
				)}
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose} disabled={isLoading}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!name.trim() || isLoading}>
					<PlusIcon className="h-4 w-4" />
					{isLoading ? "Creating..." : "Create Project"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

function RenameDialogContent({
	project,
	onClose,
	onRename,
	isLoading,
}: {
	project: Project;
	onClose: () => void;
	onRename?: (projectId: string, name: string) => void;
	isLoading?: boolean;
}) {
	const [name, setName] = useState(project.name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	const handleSubmit = () => {
		if (!name.trim()) return;
		onRename?.(project.id, name);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.nativeEvent.isComposing || e.keyCode === 229) return;
		if (e.key === "Enter" && name.trim()) {
			handleSubmit();
		}
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Rename Project</DialogTitle>
				<DialogDescription>
					Current project:{" "}
					<span className="font-medium text-text-primary">{project.name}</span>
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<label
						htmlFor="rename-name"
						className="text-sm font-medium text-text-primary"
					>
						Project Name
					</label>
					<Input
						ref={inputRef}
						id="rename-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading}
					/>
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose} disabled={isLoading}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!name.trim() || isLoading}>
					<PencilIcon className="h-4 w-4 mr-2" />
					{isLoading ? "Saving..." : "Save Changes"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

function DeleteDialogContent({
	project,
	onClose,
	onDelete,
	isLoading,
}: {
	project: Project;
	onClose: () => void;
	onDelete?: (projectId: string) => void;
	isLoading?: boolean;
}) {
	const handleSubmit = () => {
		onDelete?.(project.id);
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Delete Project</DialogTitle>
				<DialogDescription>
					Are you sure you want to delete{" "}
					<span className="font-medium text-text-primary">{project.name}</span>?
					<span className="block mt-2 font-medium text-destructive">
						This action cannot be undone.
					</span>
				</DialogDescription>
			</DialogHeader>
			<DialogFooter className="sm:justify-end">
				<Button variant="outline" onClick={onClose} disabled={isLoading}>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onClick={handleSubmit}
					disabled={isLoading}
				>
					<Trash2Icon className="h-4 w-4 mr-2" />
					{isLoading ? "Deleting..." : "Delete Project"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
