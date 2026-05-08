import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, type PrismaClient } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await params;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let body: { name?: string; description?: string | null };
    try {
      body = await req.json();
    } catch {
      return new NextResponse("Malformed or missing body", { status: 400 });
    }

    const { name, description } = body;

    if (name !== undefined && (name === null || name.trim() === "")) {
      return new NextResponse("Name cannot be empty", { status: 400 });
    }

    // Verify ownership
    const projectDb = db as PrismaClient;
    const existingProject = await projectDb.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!existingProject) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (existingProject.ownerId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const project = await projectDb.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: name?.trim(),
        description: description ?? null,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  const { projectId } = await params;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Verify ownership
    const projectDb = db as PrismaClient;
    const existingProject = await projectDb.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!existingProject) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (existingProject.ownerId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const project = await projectDb.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
