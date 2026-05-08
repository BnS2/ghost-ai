import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
	const { userId } = await auth();

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const projects = await db.project.findMany({
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
		const body = await req.json();
		const { name, description } = body;

		const project = await db.project.create({
			data: {
				ownerId: userId,
				name: name || "Untitled Project",
				description: description || null,
			},
		});

		return NextResponse.json(project);
	} catch (error) {
		console.error("[PROJECTS_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
