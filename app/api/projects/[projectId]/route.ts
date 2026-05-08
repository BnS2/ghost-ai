import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ projectId: string }> },
) {
	const { userId } = await auth();
	const { projectId } = await params;

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const body = await req.json();
		const { name, description } = body;

		if (!projectId) {
			return new NextResponse("Project ID is required", { status: 400 });
		}

		// Verify ownership
		const existingProject = await db.project.findUnique({
			where: {
				id: projectId,
			},
		});

		if (!existingProject) {
			return new NextResponse("Not Found", { status: 404 });
		}

		if (existingProject.ownerId !== userId) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const project = await db.project.update({
			where: {
				id: projectId,
			},
			data: {
				name,
				description,
			},
		});

		return NextResponse.json(project);
	} catch (error) {
		console.error("[PROJECT_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ projectId: string }> },
) {
	const { userId } = await auth();
	const { projectId } = await params;

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		if (!projectId) {
			return new NextResponse("Project ID is required", { status: 400 });
		}

		// Verify ownership
		const existingProject = await db.project.findUnique({
			where: {
				id: projectId,
			},
		});

		if (!existingProject) {
			return new NextResponse("Not Found", { status: 404 });
		}

		if (existingProject.ownerId !== userId) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const project = await db.project.delete({
			where: {
				id: projectId,
			},
		});

		return NextResponse.json(project);
	} catch (error) {
		console.error("[PROJECT_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
