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
import { generateSlug, type Project } from "./use-project-dialogs";

interface ProjectDialogsProps {
	open: boolean;
	dialogType: "create" | "rename" | "delete" | null;
	selectedProject: Project | null;
	onClose: () => void;
}

export function ProjectDialogs({
	open,
	dialogType,
	selectedProject,
	onClose,
}: ProjectDialogsProps) {
	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			onClose();
		}
	};

	if (dialogType === "create") {
		return (
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<CreateDialogContent onClose={onClose} />
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
				/>
			</Dialog>
		);
	}

	if (dialogType === "delete" && selectedProject) {
		return (
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DeleteDialogContent project={selectedProject} onClose={onClose} />
			</Dialog>
		);
	}

	return null;
}

function CreateDialogContent({ onClose }: { onClose: () => void }) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");

	const handleNameChange = (value: string) => {
		setName(value);
		setSlug(generateSlug(value));
	};

	const handleSubmit = () => {
		console.log("Submit: create", { name, slug });
		onClose();
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
						autoFocus
					/>
				</div>
				{slug && (
					<div className="flex items-center gap-2 text-sm text-text-muted">
						<code className="px-2 py-1 bg-elevated rounded-md font-mono text-accent-primary">
							{slug}
						</code>
					</div>
				)}
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!name.trim()}>
					<PlusIcon className="h-4 w-4" />
					Create Project
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

function RenameDialogContent({
	project,
	onClose,
}: {
	project: Project;
	onClose: () => void;
}) {
	const [name, setName] = useState(project.name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Small delay to ensure Dialog is fully open and interactive
		const timer = setTimeout(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	const handleSubmit = () => {
		if (!name.trim()) return;
		console.log("Submit: rename", { name });
		onClose();
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
					/>
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!name.trim()}>
					<PencilIcon className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

function DeleteDialogContent({
	project,
	onClose,
}: {
	project: Project;
	onClose: () => void;
}) {
	const handleSubmit = () => {
		console.log("Submit: delete", { id: project.id });
		onClose();
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
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button variant="destructive" onClick={handleSubmit}>
					<Trash2Icon className="h-4 w-4 mr-2" />
					Delete Project
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
