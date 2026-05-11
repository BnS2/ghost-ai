import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, type PrismaClient } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await params;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const project = await checkProjectAccess(projectId);
  if (!project) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const projectDb = db as PrismaClient;
    const specs = await projectDb.projectSpec.findMany({
      where: { projectId },
      select: { id: true, filePath: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ specs });
  } catch (error) {
    console.error("[PROJECT_SPECS_LIST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
