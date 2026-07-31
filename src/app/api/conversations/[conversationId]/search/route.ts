import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import DirectMessage from "@/models/DirectMessage";
import User from "@/models/User";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { conversationId } = await params;
    const url = new URL(req.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return NextResponse.json({ items: [] });
    }

    await dbConnect();

    const messages = await DirectMessage.find({
      conversationId,
      deleted: false,
      content: { $regex: query, $options: "i" }
    })
      .sort({ createdAt: -1 })
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

    return NextResponse.json({ items: messages });
  } catch (error) {
    console.log("[CONVERSATION_SEARCH_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
