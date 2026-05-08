import { auth, currentUser } from "@clerk/nextjs/server";
import { db, type PrismaClient } from "@/lib/prisma";

/**
 * Gets the current Clerk identity (userId and primary email).
 */
export async function getIdentity() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  return { userId, email };
}

/**
 * Checks if the current user has access to a specific project.
 * Returns the project if access is granted, otherwise null.
 */
export async function checkProjectAccess(projectId: string) {
  const identity = await getIdentity();
  if (!identity) return null;

  const { userId, email } = identity;

  const projectDb = db as PrismaClient;
  const project = await projectDb.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, ...(email ? [{ collaborators: { some: { email } } }] : [])],
    },
  });

  return project;
}
