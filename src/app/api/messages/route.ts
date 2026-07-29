import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
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
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const query: any = { channelId };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(MESSAGES_BATCH)
      .populate({
        path: "memberId",
        populate: { path: "userId", model: User },
      })
      .lean();

    let nextCursor = null;
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1]._id.toString();
    }

    return NextResponse.json({
      items: messages,
      nextCursor,
    });
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
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

    const { content, fileUrl, channelId, serverId } = await req.json();

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: "Content or file is required" },
        { status: 400 }
      );
    }

    if (!channelId || !serverId) {
      return NextResponse.json(
        { error: "Channel and server IDs are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const member = await Member.findOne({
      userId: user._id,
      serverId,
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 403 });
    }

    const message = await Message.create({
      content: content || "",
      fileUrl: fileUrl || "",
      channelId,
      memberId: member._id,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate({
        path: "memberId",
        populate: { path: "userId", model: User },
      })
      .lean();

    // Broadcast via Pusher
    const channelKey = `chat-${channelId}`;
    await pusherServer.trigger(channelKey, "message:create", populatedMessage);

    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
