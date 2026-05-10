import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { db, type PrismaClient } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let body: { runId?: string };
    try {
      body = await req.json();
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const { runId } = body;

    if (!runId || typeof runId !== "string") {
      return new NextResponse("runId is required", { status: 400 });
    }

    const projectDb = db as PrismaClient;
    const taskRun = await projectDb.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return new NextResponse("Run not found", { status: 404 });
    }

    if (taskRun.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
      expirationTime: "1h",
    });

    return NextResponse.json({ token: publicToken });
  } catch (error) {
    console.error("[AI_DESIGN_TOKEN_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
