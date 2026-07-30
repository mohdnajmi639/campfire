import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import ServerInvite from "@/models/ServerInvite";
import Server from "@/models/Server";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invites = await ServerInvite.find({
      invitee: user._id,
      status: "pending",
    })
      .populate({ path: "server", model: Server })
      .populate({ path: "inviter", model: User })
      .sort({ createdAt: -1 });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("[INVITES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
