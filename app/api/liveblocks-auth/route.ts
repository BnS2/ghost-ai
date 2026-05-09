import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { checkProjectAccess } from "@/lib/project-access";
import { liveblocks, getUserColor } from "@/lib/liveblocks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { room } = await request.json();
    if (!room) {
      return new NextResponse("Missing room ID", { status: 400 });
    }

    // Verify access to the project
    const project = await checkProjectAccess(room);
    if (!project) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const primaryEmailId = user.primaryEmailAddressId;
    const email = user.emailAddresses.find((e) => e.id === primaryEmailId)?.emailAddress;
    const name = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : email || "Anonymous";

    // Ensure room exists
    const roomExists = await liveblocks.getRoom(room).catch(() => null);
    if (!roomExists) {
      await liveblocks.createRoom(room, { defaultAccesses: [] });
    }

    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name,
        avatar: user.imageUrl,
        color: getUserColor(user.id),
      },
    });

    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    
    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
