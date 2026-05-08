import { auth, currentUser } from "@clerk/nextjs/server";
import { db, type PrismaClient } from "@/lib/prisma";

/**
 * Gets the current Clerk identity (userId and primary email).
 */
export async function getIdentity() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch current user from Clerk:", message);
    return null;
  });

  if (!user) return { userId, email: undefined };

  const primaryEmailId = user.primaryEmailAddressId;
  const email = user.emailAddresses.find((e) => e.id === primaryEmailId)?.emailAddress;

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
