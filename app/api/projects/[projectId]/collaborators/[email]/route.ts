import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma";
import { db, type PrismaClient } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; email: string }> },
) {
  const { userId } = await auth();
  const { projectId, email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail).toLowerCase();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const projectDb = db as PrismaClient;

    // Verify ownership
    const project = await projectDb.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (project.ownerId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete collaborator
    await projectDb.projectCollaborator.delete({
      where: {
        projectId_email: {
          projectId,
          email,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return new NextResponse("Not Found", { status: 404 });
    }
    console.error("[COLLABORATOR_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
