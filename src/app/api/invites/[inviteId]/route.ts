import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import ServerInvite from "@/models/ServerInvite";
import Server from "@/models/Server";
import Member from "@/models/Member";
import { MemberRole } from "@/types";
import dbConnect from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invite = await ServerInvite.findById(inviteId).populate({ path: "server", model: Server });

    if (!invite || invite.invitee.toString() !== user._id.toString()) {
      return new NextResponse("Invite not found", { status: 404 });
    }

    if (invite.status !== "pending") {
      return new NextResponse("Invite no longer pending", { status: 400 });
    }

    const server = invite.server as any;
    if (!server) {
      return new NextResponse("Server not found", { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await Member.findOne({
      userId: user._id,
      serverId: server._id,
    });

    if (existingMember) {
      invite.status = "accepted";
      await invite.save();
      return NextResponse.json({ success: true, serverId: server._id });
    }

    // Add user to server
    const member = await Member.create({
      role: MemberRole.GUEST,
      userId: user._id,
      serverId: server._id,
    });

    server.members.push(member._id);
    await server.save();

    invite.status = "accepted";
    await invite.save();

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`user-${user._id}`, "user-update", {});
    await pusherServer.trigger(`server-${server._id}`, "server-update", {});

    return NextResponse.json({ success: true, serverId: server._id });
  } catch (error) {
    console.error("[INVITE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invite = await ServerInvite.findById(inviteId);

    if (!invite || invite.invitee.toString() !== user._id.toString()) {
      return new NextResponse("Invite not found", { status: 404 });
    }

    invite.status = "declined";
    await invite.save();

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`user-${user._id}`, "user-update", {});

    return new NextResponse("Invite declined", { status: 200 });
  } catch (error) {
    console.error("[INVITE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
