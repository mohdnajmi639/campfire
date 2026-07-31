import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";
import { MemberRole } from "@/types";
import { pusherServer } from "@/lib/pusher";

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
    const { role, serverId, nickname } = await req.json();

    await dbConnect();

    // If patching nickname, check if it's the current user
    if (nickname !== undefined) {
      const targetMember = await Member.findById(memberId);
      if (!targetMember || targetMember.userId.toString() !== user._id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      
      const member = await Member.findByIdAndUpdate(
        memberId,
        { nickname: nickname === "" ? null : nickname },
        { new: true }
      ).populate("userId");
      
      const serverKey = `server-${serverId}`;
      await pusherServer.trigger(serverKey, "member-update", member);
      
      return NextResponse.json(member);
    }

    // Verify requesting user is admin
    const adminMember = await Member.findOne({
      userId: user._id,
      serverId,
      role: MemberRole.ADMIN,
    });

    if (!user.isSuperAdmin && !adminMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const member = await Member.findByIdAndUpdate(
      memberId,
      { role },
      { new: true }
    ).populate("userId");

    const serverKey = `server-${serverId}`;
    await pusherServer.trigger(serverKey, "member-update", member);

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

    if (!user.isSuperAdmin && !adminMember) {
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

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${serverId}`, "server-update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEMBER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
