import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import DirectMessage from "@/models/DirectMessage";
import Member from "@/models/Member";
import User from "@/models/User";
import { pusherServer } from "@/lib/pusher";

const MESSAGES_BATCH = 15;

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor");
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const query: any = { conversationId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await DirectMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(MESSAGES_BATCH)
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

    let nextCursor = null;
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1]._id.toString();
    }

    return NextResponse.json({ items: messages, nextCursor });
  } catch (error) {
    console.error("[DIRECT_MESSAGES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, fileUrl, conversationId, replyToId } = await req.json();

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: "Content or file is required" },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
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
      conversation.memberOne.userId.toString() === user._id.toString()
        ? conversation.memberOne
        : conversation.memberTwo.userId.toString() === user._id.toString()
        ? conversation.memberTwo
        : null;

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 403 });
    }

    const messageData: any = {
      content: content || "",
      fileUrl: fileUrl || "",
      conversationId,
      memberId: member._id,
    };
    if (replyToId) {
      messageData.replyToId = replyToId;
    }

    const message = await DirectMessage.create(messageData);

    const populatedMessage = await DirectMessage.findById(message._id)
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
    await pusherServer.trigger(channelKey, "message:create", populatedMessage);

    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error("[DIRECT_MESSAGES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
