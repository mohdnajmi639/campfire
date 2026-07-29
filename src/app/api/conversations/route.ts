import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberOneId, memberTwoId } = await req.json();

    if (!memberOneId || !memberTwoId) {
      return NextResponse.json(
        { error: "Both member IDs are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find existing conversation
    let conversation = await Conversation.findOne({
      $or: [
        { memberOneId, memberTwoId },
        { memberOneId: memberTwoId, memberTwoId: memberOneId },
      ],
    }).lean();

    if (!conversation) {
      conversation = await Conversation.create({
        memberOneId,
        memberTwoId,
      });
      conversation = conversation.toObject();
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[CONVERSATIONS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
