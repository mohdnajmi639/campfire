import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DirectMessage from "@/models/DirectMessage";
import Conversation from "@/models/Conversation";
import Member from "@/models/Member";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ users: [], messages: [] });
    }

    await dbConnect();

    // 1. Get all member profiles for the current user
    const userMembers = await Member.find({ userId: user._id }).lean();
    const memberIds = userMembers.map((m) => m._id);

    // 2. Get all conversations the user is a part of
    const conversations = await Conversation.find({
      $or: [{ memberOneId: { $in: memberIds } }, { memberTwoId: { $in: memberIds } }],
    })
    .populate({
      path: "memberOneId",
      model: Member,
      populate: { path: "userId", model: User },
    })
    .populate({
      path: "memberTwoId",
      model: Member,
      populate: { path: "userId", model: User },
    })
    .lean();

    const conversationIds = conversations.map((c) => c._id);

    // 3. Search Users (Matching the query in existing conversations)
    const regex = new RegExp(q, "i");
    const matchedUsers: any[] = [];

    for (const conv of conversations as any[]) {
      const isMemberOne = memberIds.some(
        (id) => id.toString() === conv.memberOneId._id.toString()
      );
      const otherMember = isMemberOne ? conv.memberTwoId : conv.memberOneId;
      const otherUser = otherMember?.userId;

      if (otherUser && (regex.test(otherUser.name) || regex.test(otherUser.email))) {
        matchedUsers.push({
          conversationId: conv._id.toString(),
          user: otherUser,
        });
      }
    }

    // 4. Search Direct Messages
    const matchedMessages = await DirectMessage.find({
      conversationId: { $in: conversationIds },
      content: { $regex: q, $options: "i" },
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: "memberId",
        model: Member,
        populate: { path: "userId", model: User },
      })
      .lean();

    return NextResponse.json({
      users: matchedUsers,
      messages: matchedMessages,
    });
  } catch (error) {
    console.error("[SEARCH_DMS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
