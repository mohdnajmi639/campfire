import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";
import User from "@/models/User";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = await params;

    await dbConnect();

    const members = await Member.find({ serverId })
      .populate({ path: "userId", model: User })
      .lean();

    return NextResponse.json(members);
  } catch (error) {
    console.error("[SERVER_MEMBERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
