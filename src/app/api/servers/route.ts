import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import { MemberRole } from "@/types";
import Channel from "@/models/Channel";
import { ChannelType } from "@/types";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await dbConnect();

    // Create server
    const server = await Server.create({
      name,
      imageUrl: imageUrl || "",
      inviteCode: uuidv4(),
      userId: user._id,
    });

    // Create admin member
    const member = await Member.create({
      userId: user._id,
      serverId: server._id,
      role: MemberRole.ADMIN,
    });

    // Create default "general" text channel
    const channel = await Channel.create({
      name: "general",
      type: ChannelType.TEXT,
      userId: user._id,
      serverId: server._id,
    });

    // Update server with member and channel references
    server.members.push(member._id);
    server.channels.push(channel._id);
    await server.save();

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    console.error("[SERVERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

