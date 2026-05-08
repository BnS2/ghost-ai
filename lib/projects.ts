import { auth } from "@clerk/nextjs/server";
import type { Project as PrismaProject } from "@/app/generated/prisma";
import { db, type PrismaClient } from "@/lib/prisma";
import { getIdentity } from "./project-access";

export async function getProjects() {
  const { userId } = await auth();
  if (!userId) return { owned: [], shared: [] };

  const projectDb = db as PrismaClient;

  // Start identity fetch (cached) and owned projects fetch in parallel
  const [identity, owned] = await Promise.all([
    getIdentity(),
    projectDb.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const email = identity?.email;

  // Fetch shared projects if email is available
  const shared = email
    ? await projectDb.project.findMany({
        where: {
          collaborators: {
            some: { email },
          },
          NOT: { ownerId: userId },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

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
