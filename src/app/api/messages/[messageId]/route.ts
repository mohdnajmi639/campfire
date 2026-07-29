import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Member from "@/models/Member";
import { MemberRole } from "@/types";
import User from "@/models/User";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { content, serverId, channelId } = await req.json();

    await dbConnect();

    const member = await Member.findOne({ userId: user._id, serverId });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 403 });
    }

    const message = await Message.findById(messageId);
    if (!message || message.deleted) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Only the message author can edit
    if (message.memberId.toString() !== member._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { content },
      { new: true }
    )
      .populate({
        path: "memberId",
        populate: { path: "userId", model: User },
      })
      .lean();

    // Broadcast update
    const channelKey = `chat-${channelId}`;
    await pusherServer.trigger(channelKey, "message:update", updatedMessage);

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[MESSAGE_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const serverId = req.nextUrl.searchParams.get("serverId");
    const channelId = req.nextUrl.searchParams.get("channelId");

    if (!serverId || !channelId) {
      return NextResponse.json(
        { error: "Server and channel IDs required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const member = await Member.findOne({ userId: user._id, serverId });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 403 });
    }

    const message = await Message.findById(messageId);
    if (!message || message.deleted) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const isOwner = message.memberId.toString() === member._id.toString();
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;

    if (!isOwner && !isAdmin && !isModerator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        content: "This message has been deleted.",
        fileUrl: "",
        deleted: true,
      },
      { new: true }
    )
      .populate({
        path: "memberId",
        populate: { path: "userId", model: User },
      })
      .lean();

    // Broadcast deletion
    const channelKey = `chat-${channelId}`;
    await pusherServer.trigger(channelKey, "message:update", updatedMessage);

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[MESSAGE_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
