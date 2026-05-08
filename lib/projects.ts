import { auth, currentUser } from "@clerk/nextjs/server";
import type { Project as PrismaProject } from "@/app/generated/prisma";
import { db, type PrismaClient } from "@/lib/prisma";

export async function getProjects() {
	const { userId } = await auth();
	if (!userId) return { owned: [], shared: [] };

	const user = await currentUser();
	const email = user?.emailAddresses[0]?.emailAddress;

	const projectDb = db as PrismaClient;

	const [owned, shared] = await Promise.all([
		projectDb.project.findMany({
			where: { ownerId: userId },
			orderBy: { updatedAt: "desc" },
		}),
		email
			? projectDb.project.findMany({
					where: {
						collaborators: {
							some: { email },
						},
						NOT: { ownerId: userId },
					},
					orderBy: { updatedAt: "desc" },
				})
			: Promise.resolve([]),
	]);

	// Map to the UI Project type
	const mapProject = (p: PrismaProject, isOwned: boolean) => ({
		id: p.id,
		name: p.name,
		slug: p.id, // Using id as slug for now, as it's what we'll use for room ID
		isOwned,
	});

	return {
		owned: owned.map((p) => mapProject(p, true)),
		shared: shared.map((p) => mapProject(p, false)),
	};
}
