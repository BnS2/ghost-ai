import { currentUser } from "@clerk/nextjs/server";

interface ClerkError {
  message: string;
  code?: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Attempts to fetch the current user with a simple retry mechanism.
 * Clerk's currentUser() can occasionally fail with "fetch failed" during
 * session initialization or transient network issues.
 */
export async function currentUserWithRetry(retries = 2, delay = 500) {
  for (let i = 0; i <= retries; i++) {
    try {
      // Add a timeout to the Clerk API call to prevent indefinite hangs
      return await Promise.race([
        currentUser(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("fetch failed (timeout)")), 3000),
        ),
      ]);
    } catch (error) {
      const err = error as ClerkError;

      // Check for fetch failed or unexpected error in Clerk response
      const message = err.message || "";
      const clerkErrorCode = err.code;
      const innerErrors = err.errors || [];
      const hasUnexpectedError = innerErrors.some(
        (e) => e.code === "unexpected_error" || e.message?.includes("fetch failed"),
      );

      const isRetryable =
        message.includes("fetch failed") ||
        clerkErrorCode === "api_response_error" ||
        hasUnexpectedError;

      if (i === retries || !isRetryable) {
        console.error(`Clerk currentUser fetch failed after ${i} retries:`, error);
        return null;
      }

      console.warn(
        `Clerk currentUser fetch failed (attempt ${i + 1}/${retries + 1}), retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      // Exponential backoff
      delay *= 2;
    }
  }
  return null;
}
