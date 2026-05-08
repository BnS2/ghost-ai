import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, type PrismaClient } from "@/lib/prisma";
import { getProjects } from "@/lib/projects";
import { WorkspaceView } from "./workspace-view";

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

	// Fetch both the current project and the list of projects for the sidebar
	const projectDb = db as PrismaClient;
	const [project, { owned, shared }] = await Promise.all([
		projectDb.project.findFirst({
			where: {
				id: projectId,
				OR: [
					{ ownerId: userId },
					...(email ? [{ collaborators: { some: { email } } }] : []),
				],
			},
		}),
		getProjects(),
	]);

	if (!project) redirect("/editor");

	return (
		<WorkspaceView
			project={project}
			ownedProjects={owned}
			sharedProjects={shared}
		/>
	);
}
