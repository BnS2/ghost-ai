import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { db, type PrismaClient } from "@/lib/prisma";
import { currentUserWithRetry } from "./clerk-utils";

/**
 * Gets the current Clerk identity (userId and primary email).
 * Uses React cache to deduplicate calls within a single request.
 * Attempts to retrieve email from session claims first to avoid hitting the Clerk API.
 */
export const getIdentity = cache(async () => {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  // If email is in session claims (configured in Clerk Dashboard), use it to avoid an API call
  const emailInClaims = sessionClaims?.email as string | undefined;
  if (emailInClaims) {
    return { userId, email: emailInClaims };
  }

  try {
    const user = await currentUserWithRetry();
    const email = user?.emailAddresses[0]?.emailAddress;
    return { userId, email };
  } catch (error) {
    console.error("Failed to get identity from Clerk:", error);
    // Return userId at least, so owned projects can still be accessed
    return { userId, email: undefined };
  }
});

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
