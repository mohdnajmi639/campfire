import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Channel from "@/models/Channel";
import Member from "@/models/Member";
import { MemberRole } from "@/types";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, type, serverId } = await req.json();

    if (!name || !type || !serverId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (name === "general") {
      return NextResponse.json(
        { error: "Channel name cannot be 'general'" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify user is admin or moderator
    const member = await Member.findOne({
      userId: user._id,
      serverId,
    });

    if (
      !member ||
      (member.role !== MemberRole.ADMIN &&
        member.role !== MemberRole.MODERATOR)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const channel = await Channel.create({
      name,
      type,
      userId: user._id,
      serverId,
    });

    await Server.findByIdAndUpdate(serverId, {
      $push: { channels: channel._id },
    });

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${serverId}`, "server-update", {});

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("[CHANNELS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

