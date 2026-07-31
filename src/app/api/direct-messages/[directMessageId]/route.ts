import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import DirectMessage from "@/models/DirectMessage";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ directMessageId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { directMessageId } = await params;
    const { content, conversationId } = await req.json();

    await dbConnect();

    const conversation = await Conversation.findById(conversationId).populate(
      "memberOne memberTwo"
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const member =
      (conversation.memberOneId as any).userId.toString() === user._id.toString()
        ? conversation.memberOneId
        : (conversation.memberTwoId as any).userId.toString() === user._id.toString()
        ? conversation.memberTwoId
        : null;

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 403 });
    }

    const message = await DirectMessage.findById(directMessageId);
    if (!message || message.deleted) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.memberId.toString() !== member._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedMessage = await DirectMessage.findByIdAndUpdate(
      directMessageId,
      { content },
      { new: true }
    )
      .populate({
        path: "memberId",
        populate: { path: "userId", model: User },
      })
      .populate({
        path: "replyToId",
        populate: {
          path: "memberId",
          populate: { path: "userId", model: User },
        },
      })
      .lean();

    const channelKey = `chat-${conversationId}`;
    await pusherServer.trigger(channelKey, "message:update", updatedMessage);

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[DIRECT_MESSAGE_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ directMessageId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { directMessageId } = await params;
    const conversationId = req.nextUrl.searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const conversation = await Conversation.findById(conversationId).populate(
      "memberOne memberTwo"
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const member =
      (conversation.memberOneId as any).userId.toString() === user._id.toString()
        ? conversation.memberOneId
        : (conversation.memberTwoId as any).userId.toString() === user._id.toString()
        ? conversation.memberTwoId
        : null;

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 403 });
    }

    const message = await DirectMessage.findById(directMessageId);
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const hardDelete = req.nextUrl.searchParams.get("hardDelete") === "true";

    if (message.deleted && !hardDelete) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const isOwner = message.memberId.toString() === member._id.toString();

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const channelKey = `chat-${conversationId}`;

    if (hardDelete) {
      await DirectMessage.findByIdAndDelete(directMessageId);
      await pusherServer.trigger(channelKey, "message:delete", directMessageId);
      return NextResponse.json({ success: true });
    }

    const updatedMessage = await DirectMessage.findByIdAndUpdate(
      directMessageId,
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
      .populate({
        path: "replyToId",
        populate: {
          path: "memberId",
          populate: { path: "userId", model: User },
        },
      })
      .lean();

    await pusherServer.trigger(channelKey, "message:update", updatedMessage);

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("[DIRECT_MESSAGE_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
