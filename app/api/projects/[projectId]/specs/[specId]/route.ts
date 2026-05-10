import { auth } from "@clerk/nextjs/server";
import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ENV } from "varlock/env";
import { db, type PrismaClient } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export const dynamic = "force-dynamic";

function getBlobToken() {
  if (!ENV.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to access spec content.");
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

    const response = new Response(result.stream);
    const text = await response.text();

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("[PROJECT_SPEC_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
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
    let body: { content?: string };
    try {
      body = await _req.json();
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const { content } = body;

    if (!content || typeof content !== "string") {
      return new NextResponse("content is required", { status: 400 });
    }

    const projectDb = db as PrismaClient;
    const spec = await projectDb.projectSpec.findFirst({
      where: { id: specId, projectId },
    });

    if (!spec) {
      return new NextResponse("Spec not found", { status: 404 });
    }

    const blob = await put(`specs/${specId}.md`, content, {
      access: "private",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "text/markdown",
      token: getBlobToken(),
    });

    const updated = await projectDb.projectSpec.update({
      where: { id: specId },
      data: { filePath: blob.url },
    });

    return NextResponse.json({ id: updated.id, createdAt: updated.createdAt });
  } catch (error) {
    console.error("[PROJECT_SPEC_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
