import { auth } from "@clerk/nextjs/server";
import { tasks, auth as triggerAuth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { db, type PrismaClient } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let body: { roomId?: string; projectId?: string; prompt?: string };
    try {
      body = await req.json();
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const { roomId, projectId, prompt } = body;

    if (!roomId || typeof roomId !== "string") {
      return new NextResponse("roomId is required", { status: 400 });
    }
    if (!projectId || typeof projectId !== "string") {
      return new NextResponse("projectId is required", { status: 400 });
    }
    if (!prompt || typeof prompt !== "string") {
      return new NextResponse("prompt is required", { status: 400 });
    }

    if (roomId !== projectId) {
      return new NextResponse("roomId must match projectId", { status: 403 });
    }

    const hasAccess = await checkProjectAccess(projectId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    let currentCanvas: { nodes: unknown[]; edges: unknown[] } | undefined;

    try {
      const projectDb = db as PrismaClient;
      const project = await projectDb.project.findUnique({
        where: { id: projectId },
        select: { canvasJsonPath: true },
      });

      if (project?.canvasJsonPath) {
        const blobResponse = await fetch(project.canvasJsonPath, {
          cache: "no-store",
        });

        if (blobResponse.ok) {
          const canvasData: unknown = await blobResponse.json();

          if (
            canvasData &&
            typeof canvasData === "object" &&
            !Array.isArray(canvasData) &&
            "nodes" in canvasData &&
            Array.isArray(canvasData.nodes) &&
            "edges" in canvasData &&
            Array.isArray(canvasData.edges)
          ) {
            currentCanvas = {
              nodes: canvasData.nodes,
              edges: canvasData.edges,
            };
          }
        }
      }
    } catch {
      // Pass undefined if canvas fetch fails — task will generate from scratch
    }

    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId,
      currentCanvas,
    });

    const projectDb = db as PrismaClient;
    await projectDb.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    });

    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "1h",
    });

    return NextResponse.json({ runId: handle.id, publicToken }, { status: 201 });
  } catch (error) {
    console.error("[AI_DESIGN_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
