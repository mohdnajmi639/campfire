import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import User from "@/models/User";
import Friendship from "@/models/Friendship";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all friendships where the user is either user1 or user2
    const friendships = await Friendship.find({
      $or: [{ user1: user._id }, { user2: user._id }],
    })
      .populate("user1", "name email image")
      .populate("user2", "name email image");

    // Format the response so the frontend knows who the "other" user is easily
    const formatted = friendships.map((f) => {
      const isUser1 = f.user1._id.toString() === user._id.toString();
      const otherUser = (isUser1 ? f.user2 : f.user1) as any;
      
      return {
        _id: f._id,
        status: f.status,
        actionUserId: f.actionUserId,
        createdAt: f.createdAt,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          image: otherUser.image,
        },
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[FRIENDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = await currentUser();
    const { username } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!username) {
      return new NextResponse("Username is required", { status: 400 });
    }

    if (username.toLowerCase() === user.name.toLowerCase()) {
      return new NextResponse("You cannot add yourself", { status: 400 });
    }

    const targetUser = await User.findOne({ name: new RegExp(`^${username}$`, "i") });

    if (!targetUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if friendship already exists
    const existing = await Friendship.findOne({
      $or: [
        { user1: user._id, user2: targetUser._id },
        { user1: targetUser._id, user2: user._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return new NextResponse("Already friends", { status: 400 });
      } else {
        return new NextResponse("Friend request already exists", { status: 400 });
      }
    }

    // Create new friend request
    // To ensure unique indexing, we can sort user1 and user2 by ID so user1 is always the "lesser" ID
    const isUser1Lesser = user._id.toString() < targetUser._id.toString();
    const user1 = isUser1Lesser ? user._id : targetUser._id;
    const user2 = isUser1Lesser ? targetUser._id : user._id;

    const friendship = await Friendship.create({
      user1,
      user2,
      status: "pending",
      actionUserId: user._id,
    });

    // Populate and return so we can show it immediately
    await friendship.populate("user1", "name email image");
    await friendship.populate("user2", "name email image");

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`user-${targetUser._id}`, "user-update", {});
    await pusherServer.trigger(`user-${user._id}`, "user-update", {});

    const otherUser = (isUser1Lesser ? friendship.user2 : friendship.user1) as any;

    return NextResponse.json({
      _id: friendship._id,
      status: friendship.status,
      actionUserId: friendship.actionUserId,
      createdAt: friendship.createdAt,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        image: otherUser.image,
      },
    });
  } catch (error) {
    console.error("[FRIENDS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
