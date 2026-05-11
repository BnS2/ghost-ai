import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ENV } from "varlock/env";
import { db, type PrismaClient } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export const dynamic = "force-dynamic";

function getBlobToken() {
  if (!ENV.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to fetch spec content.");
  }

  return ENV.BLOB_READ_WRITE_TOKEN;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> },
) {
  const { userId } = await auth();
  const { projectId, specId } = await params;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const project = await checkProjectAccess(projectId);
  if (!project) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const projectDb = db as PrismaClient;
    const spec = await projectDb.projectSpec.findFirst({
      where: { id: specId, projectId },
    });

    if (!spec) {
      return new NextResponse("Spec not found", { status: 404 });
    }

    if (!spec.filePath) {
      return new NextResponse("Spec content not yet available", { status: 404 });
    }

    const result = await get(spec.filePath, {
      access: "private",
      token: getBlobToken(),
      useCache: false,
    });

    if (!result || result.statusCode !== 200) {
      return new NextResponse("Spec content not found", { status: 404 });
    }

    return new NextResponse(result.stream as ReadableStream, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
      },
    });
  } catch (error) {
    console.error("[PROJECT_SPEC_DOWNLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
