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
		let body: { id?: string; name?: string; description?: string | null };
		try {
			body = await req.json();
		} catch {
			return new NextResponse("Invalid JSON", { status: 400 });
		}

		if (!body || typeof body !== "object" || Array.isArray(body)) {
			return new NextResponse("Invalid payload", { status: 400 });
		}

		const { id, name, description } = body;

		// Validate ID format if provided
		if (id !== undefined && id !== null) {
			const isValidId =
				typeof id === "string" && /^[A-Za-z0-9\-_]+$/.test(id) && id.length > 0;
			if (!isValidId) {
				return new NextResponse("Invalid project ID format", { status: 400 });
			}
		}

		// Validate name and description types
		if (name !== undefined && typeof name !== "string") {
			return new NextResponse("Name must be a string", { status: 400 });
		}
		if (
			description !== undefined &&
			description !== null &&
			typeof description !== "string"
		) {
			return new NextResponse("Description must be a string", { status: 400 });
		}

		const projectDb = db as PrismaClient;
		const project = await projectDb.project.create({
			data: {
				id: id || undefined,
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
