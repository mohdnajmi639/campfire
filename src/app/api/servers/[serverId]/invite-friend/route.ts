import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import ServerInvite from "@/models/ServerInvite";
import Server from "@/models/Server";
import dbConnect from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;
    await dbConnect();
    const user = await currentUser();
    const { friendId } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!friendId) {
      return new NextResponse("Friend ID is required", { status: 400 });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return new NextResponse("Server not found", { status: 404 });
    }

    // Check if there is an existing pending invite
    const existing = await ServerInvite.findOne({
      server: server._id,
      invitee: friendId,
    });

    if (existing) {
      if (existing.status === "pending") {
        return new NextResponse("Already invited", { status: 400 });
      } else {
        // Reset to pending if it was declined previously
        existing.status = "pending";
        existing.inviter = user._id as any; // Update inviter
        await existing.save();
        return NextResponse.json(existing);
      }
    }

    const invite = await ServerInvite.create({
      server: server._id,
      inviter: user._id,
      invitee: friendId,
      status: "pending",
    });

    return NextResponse.json(invite);
  } catch (error) {
    console.error("[SERVER_INVITE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
