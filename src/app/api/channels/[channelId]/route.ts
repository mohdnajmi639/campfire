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

    if (name === "general") {
      return NextResponse.json(
        { error: "Cannot rename to 'general'" },
        { status: 400 }
      );
    }

    await dbConnect();

    const member = await Member.findOne({ userId: user._id, serverId });
    if (
      !member ||
      (member.role !== MemberRole.ADMIN &&
        member.role !== MemberRole.MODERATOR)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const channel = await Channel.findOneAndUpdate(
      { _id: channelId, serverId, name: { $ne: "general" } },
      { name, type },
      { new: true }
    );

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or is protected" },
        { status: 404 }
      );
    }

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
      !member ||
      (member.role !== MemberRole.ADMIN &&
        member.role !== MemberRole.MODERATOR)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const channel = await Channel.findOne({
      _id: channelId,
      serverId,
      name: { $ne: "general" },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHANNEL_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
