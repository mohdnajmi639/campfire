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
      .populate({
        path: "replyToId",
        populate: {
          path: "memberId",
          populate: { path: "userId", model: User },
        },
      })
      .populate({ path: "mentions", model: User })
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

    const { content, fileUrl, channelId, serverId, replyToId } = await req.json();

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

    // Parse Mentions
    const serverMembers = await Member.find({ serverId }).populate({ path: "userId", model: User });
    const mentions: string[] = [];
    if (content) {
      for (const m of serverMembers) {
        const u = m.userId as any;
        if (u && u.name && content.includes(`@${u.name}`) && u._id.toString() !== user._id.toString()) {
          mentions.push(u._id);
        }
      }
    }

    const messageData: any = {
      content: content || "",
      fileUrl: fileUrl || "",
      channelId,
      memberId: member._id,
      mentions,
    };
    if (replyToId) {
      messageData.replyToId = replyToId;
    }

    const message = await Message.create(messageData);

    const populatedMessage = await Message.findById(message._id)
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
      .populate({ path: "mentions", model: User })
      .lean();

    // Broadcast via Pusher
    const channelKey = `chat-${channelId}`;
    await pusherServer.trigger(channelKey, "message:create", populatedMessage);

    // Notify mentioned users
    if (mentions.length > 0) {
      for (const mentionId of mentions) {
        await pusherServer.trigger(`user-${mentionId}`, "user-mention", {
          messageId: populatedMessage._id,
          content: populatedMessage.content,
          channelId,
          serverId,
          authorName: user.name,
        });
      }
    }

    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
