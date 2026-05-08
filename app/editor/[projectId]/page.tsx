import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { db, type PrismaClient } from "@/lib/prisma";

export default async function WorkspacePage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const user = await currentUser();
	const email = user?.emailAddresses[0]?.emailAddress;

	const { projectId } = await params;

	const projectDb = db as PrismaClient;
	const project = await projectDb.project.findFirst({
		where: {
			id: projectId,
			OR: [
				{ ownerId: userId },
				{
					collaborators: {
						some: { email: email || "___non_existent___" },
					},
				},
			],
		},
	});

	if (!project) redirect("/editor");

	return (
		<div className="relative min-h-screen bg-bg-base flex flex-col font-sans">
			<EditorNavbar isSidebarOpen={false} onToggleSidebar={() => {}} />
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
		</div>
	);
}
