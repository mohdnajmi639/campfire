import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Channel from "@/models/Channel";
import Member from "@/models/Member";
import { MemberRole } from "@/types";
import Message from "@/models/Message";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;
    const { name, type, serverId } = await req.json();



    await dbConnect();

    const member = await Member.findOne({ userId: user._id, serverId });
    if (
      !user.isSuperAdmin &&
      (!member ||
      (member.role !== MemberRole.ADMIN &&
        member.role !== MemberRole.MODERATOR))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const channel = await Channel.findOneAndUpdate(
      { _id: channelId, serverId },
      { name, type },
      { new: true }
    );

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or is protected" },
        { status: 404 }
      );
    }

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${serverId}`, "server-update", {});

    return NextResponse.json(channel);
  } catch (error) {
    console.error("[CHANNEL_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;
    const serverId = req.nextUrl.searchParams.get("serverId");

    if (!serverId) {
      return NextResponse.json(
        { error: "Server ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const member = await Member.findOne({ userId: user._id, serverId });
    if (
      !user.isSuperAdmin &&
      (!member ||
      (member.role !== MemberRole.ADMIN &&
        member.role !== MemberRole.MODERATOR))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent deleting the default channel (the oldest one in the server)
    const defaultChannel = await Channel.findOne({ serverId }).sort({ createdAt: 1 });
    if (defaultChannel && defaultChannel._id.toString() === channelId) {
      return NextResponse.json(
        { error: "Cannot delete the default channel" },
        { status: 400 }
      );
    }

    const channel = await Channel.findOneAndDelete({
      _id: channelId,
      serverId,
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or is protected" },
        { status: 404 }
      );
    }

    await Message.deleteMany({ channelId });
    await Channel.findByIdAndDelete(channelId);
    await Server.findByIdAndUpdate(serverId, {
      $pull: { channels: channelId },
    });

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${serverId}`, "server-update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHANNEL_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
