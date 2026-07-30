import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = await params;

    await dbConnect();

    // Cannot leave if you're the owner
    const server = await Server.findById(serverId);
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    if (server.userId.toString() === user._id) {
      return NextResponse.json(
        { error: "Owner cannot leave the server" },
        { status: 400 }
      );
    }

    // Remove member
    const member = await Member.findOneAndDelete({
      userId: user._id,
      serverId,
    });

    if (member) {
      await Server.findByIdAndUpdate(serverId, {
        $pull: { members: member._id },
      });
      
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger(`server-${serverId}`, "server-update", {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SERVER_LEAVE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
