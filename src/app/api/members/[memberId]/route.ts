import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Member, { MemberRole } from "@/models/Member";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const { role, serverId } = await req.json();

    await dbConnect();

    // Verify requesting user is admin
    const adminMember = await Member.findOne({
      userId: user._id,
      serverId,
      role: MemberRole.ADMIN,
    });

    if (!adminMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const member = await Member.findByIdAndUpdate(
      memberId,
      { role },
      { new: true }
    ).populate("userId");

    return NextResponse.json(member);
  } catch (error) {
    console.error("[MEMBER_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const serverId = req.nextUrl.searchParams.get("serverId");

    if (!serverId) {
      return NextResponse.json(
        { error: "Server ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify requesting user is admin
    const adminMember = await Member.findOne({
      userId: user._id,
      serverId,
      role: MemberRole.ADMIN,
    });

    if (!adminMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Cannot kick yourself
    const targetMember = await Member.findById(memberId);
    if (!targetMember || targetMember.userId.toString() === user._id) {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }

    await Member.findByIdAndDelete(memberId);

    // Remove from server members array
    const Server = (await import("@/models/Server")).default;
    await Server.findByIdAndUpdate(serverId, {
      $pull: { members: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEMBER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
