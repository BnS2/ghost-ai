import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma";
import { db, type PrismaClient } from "@/lib/prisma";
import { getIdentity } from "@/lib/project-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await params;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const identity = await getIdentity();
  if (!identity) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const normalizedEmail = identity.email?.toLowerCase();

  try {
    const projectDb = db as PrismaClient;

    // Verify access (owner or collaborator)
    const project = await projectDb.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          ...(normalizedEmail ? [{ collaborators: { some: { email: normalizedEmail } } }] : []),
        ],
      },
      include: {
        collaborators: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const collaborators = project.collaborators;
    const emails = collaborators.map((c) => c.email);

    if (emails.length === 0) {
      return NextResponse.json([]);
    }

    // Enrich with Clerk data
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: emails,
    });

    const enrichedCollaborators = collaborators.map((collab) => {
      const clerkUser = clerkUsers.data.find((u) =>
        u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === collab.email.toLowerCase()),
      );

      return {
        id: collab.id,
        email: collab.email,
        name: clerkUser
          ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
            clerkUser.username ||
            null
          : null,
        imageUrl: clerkUser?.imageUrl || null,
        createdAt: collab.createdAt,
      };
    });

    return NextResponse.json(enrichedCollaborators);
  } catch (error) {
    console.error("[COLLABORATORS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await params;

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

    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new NextResponse("Invalid email format", { status: 400 });
    }

    try {
      const collaborator = await projectDb.projectCollaborator.create({
        data: {
          projectId,
          email,
        },
      });

      return NextResponse.json(collaborator, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return new NextResponse("Collaborator already exists", { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("[COLLABORATORS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
