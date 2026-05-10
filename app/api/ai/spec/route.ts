import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { db, type PrismaClient } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let body: {
      roomId?: string;
      chatHistory?: unknown[];
      nodes?: unknown[];
      edges?: unknown[];
    };
    try {
      body = await req.json();
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const { roomId, chatHistory, nodes, edges } = body;

    if (!roomId || typeof roomId !== "string") {
      return new NextResponse("roomId is required", { status: 400 });
    }

    const hasAccess = await checkProjectAccess(roomId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: roomId,
      roomId,
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
      nodes: Array.isArray(nodes) ? nodes : [],
      edges: Array.isArray(edges) ? edges : [],
    });

    const projectDb = db as PrismaClient;
    await projectDb.taskRun.create({
      data: {
        runId: handle.id,
        projectId: roomId,
        userId,
      },
    });

    const projectSpec = await projectDb.projectSpec.create({
      data: {
        projectId: roomId,
      },
    });

    return NextResponse.json({ runId: handle.id, specId: projectSpec.id }, { status: 201 });
  } catch (error) {
    console.error("[AI_SPEC_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
