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

    if (!cursor) {
      // User is loading the channel (reading the latest messages)
      const updateResult = await Member.updateOne(
        { userId: user._id, "unreadMentions.channelId": channelId },
        { $set: { "unreadMentions.$.count": 0 } }
      );
      if (updateResult.modifiedCount > 0) {
        await pusherServer.trigger(`user-${user._id.toString()}`, "user-update", {});
      }
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
      
      // Add the replied user to mentions if not already there
      const repliedMessage = await Message.findById(replyToId).populate("memberId");
      if (repliedMessage && repliedMessage.memberId) {
        const repliedMember = repliedMessage.memberId as any;
        const repliedUserId = repliedMember.userId.toString();
        if (repliedUserId !== user._id.toString() && !mentions.includes(repliedUserId)) {
          mentions.push(repliedUserId);
        }
      }
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

    if (!populatedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Broadcast via Pusher
    const channelKey = `chat-${channelId}`;
    await pusherServer.trigger(channelKey, "message:create", populatedMessage);

    // Notify mentioned users
    if (mentions.length > 0) {
      for (const mentionId of mentions) {
        // Try to increment existing channelId entry
        const updateResult = await Member.updateOne(
          { serverId, userId: mentionId, "unreadMentions.channelId": channelId },
          { $inc: { "unreadMentions.$.count": 1 } }
        );

        // If no document was updated (channelId not in array), push a new entry
        if (updateResult.modifiedCount === 0) {
          await Member.updateOne(
            { serverId, userId: mentionId },
            { $push: { unreadMentions: { channelId, count: 1 } } }
          );
        }

        // Check if this mention is actually a reply to this specific user
        const isReply = replyToId && 
          populatedMessage.replyToId && 
          (populatedMessage.replyToId as any).memberId?.userId?._id?.toString() === mentionId.toString();

        // Trigger user-mention for the toast
        await pusherServer.trigger(`user-${mentionId}`, "user-mention", {
          messageId: populatedMessage._id,
          content: populatedMessage.content,
          channelId,
          serverId,
          authorName: user.name,
          isReply,
        });

        // Trigger user-update to refresh the sidebars
        await pusherServer.trigger(`user-${mentionId}`, "user-update", {});
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
