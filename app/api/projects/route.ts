import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, type PrismaClient } from "@/lib/prisma";

export async function GET() {
	const { userId } = await auth();

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const projectDb = db as PrismaClient;
		const projects = await projectDb.project.findMany({
			where: {
				ownerId: userId,
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		return NextResponse.json(projects);
	} catch (error) {
		console.error("[PROJECTS_GET]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function POST(req: Request) {
	const { userId } = await auth();

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		let body: { name?: string; description?: string | null } = {};
		try {
			body = await req.json();
		} catch {
			// Fallback to empty body for graceful degradation
		}

		const { name, description } = body;

		const projectDb = db as PrismaClient;
		const project = await projectDb.project.create({
			data: {
				ownerId: userId,
				name: name || "Untitled Project",
				description: description ?? null,
			},
		});

		return NextResponse.json(project, { status: 201 });
	} catch (error) {
		console.error("[PROJECTS_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
