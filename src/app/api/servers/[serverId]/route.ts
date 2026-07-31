import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import Channel from "@/models/Channel";
import Message from "@/models/Message";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = await params;
    const { name, imageUrl } = await req.json();

    await dbConnect();

    const query = user.isSuperAdmin 
      ? { _id: serverId } 
      : { _id: serverId, userId: user._id };
      
    const server = await Server.findOneAndUpdate(
      query,
      { name, imageUrl },
      { new: true }
    );

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${serverId}`, "server-update", {});

    return NextResponse.json(server);
  } catch (error) {
    console.error("[SERVER_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const query = user.isSuperAdmin
      ? { _id: serverId }
      : { _id: serverId, userId: user._id };

    const server = await Server.findOne(query);
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Delete all associated data
    const channelIds = server.channels;
    await Message.deleteMany({ channelId: { $in: channelIds } });
    await Channel.deleteMany({ serverId });
    await Member.deleteMany({ serverId });
    await Server.findByIdAndDelete(serverId);

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${serverId}`, "server-update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SERVER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
