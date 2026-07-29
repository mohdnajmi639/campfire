import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  let image = req.nextUrl.searchParams.get("image") || "";

  if (!room || !username) {
    return NextResponse.json(
      { error: "Missing room or username" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const user = await User.findOne({ name: username });
    if (user && user.image) {
      image = user.image;
    }
  } catch (error) {
    console.error("Failed to fetch fresh user image:", error);
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit not configured" },
      { status: 500 }
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    metadata: JSON.stringify({ image }),
    ttl: "10m",
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
