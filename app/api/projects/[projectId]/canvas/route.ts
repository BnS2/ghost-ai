import { auth } from "@clerk/nextjs/server";
import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ENV } from "varlock/env";
import { type CanvasSnapshot, parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import { db, type PrismaClient } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export const dynamic = "force-dynamic";

function getBlobToken() {
  if (!ENV.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to persist canvas snapshots.");
  }

  return ENV.BLOB_READ_WRITE_TOKEN;
}

async function readBlobJson(url: string): Promise<unknown> {
  const result = await get(url, {
    access: "private",
    token: getBlobToken(),
    useCache: false,
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  const response = new Response(result.stream);
  return response.json();
}

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

  if (!project.canvasJsonPath) {
    return NextResponse.json({ canvas: null });
  }

  try {
    const blobJson = await readBlobJson(project.canvasJsonPath);
    const canvas = parseCanvasSnapshot(blobJson);

    if (!canvas) {
      return new NextResponse("Saved canvas is invalid", { status: 502 });
    }

    return NextResponse.json({ canvas });
  } catch (error) {
    console.error("[PROJECT_CANVAS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
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
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    const canvas = parseCanvasSnapshot(json);

    if (!canvas) {
      return new NextResponse("Invalid canvas payload", { status: 400 });
    }

    const snapshot: CanvasSnapshot = {
      edges: canvas.edges,
      nodes: canvas.nodes,
      savedAt: new Date().toISOString(),
    };

    const blob = await put(`canvas/${projectId}.json`, JSON.stringify(snapshot), {
      access: "private",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
      token: getBlobToken(),
    });

    const projectDb = db as PrismaClient;
    await projectDb.project.update({
      data: {
        canvasJsonPath: blob.url,
      },
      where: {
        id: projectId,
      },
    });

    return NextResponse.json({ canvasJsonPath: blob.url, savedAt: snapshot.savedAt });
  } catch (error) {
    console.error("[PROJECT_CANVAS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
