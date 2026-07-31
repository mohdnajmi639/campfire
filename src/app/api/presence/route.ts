import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { isIdle, isOffline } = await req.json();

    const updates: any = {
      lastSeen: new Date(),
    };

    let statusChanged = false;

    // Check if they were previously offline
    if (user.lastSeen) {
      const timeSinceLastSeen = Date.now() - new Date(user.lastSeen).getTime();
      if (timeSinceLastSeen > 20 * 1000 && !isOffline) {
        statusChanged = true; // Transitioning from offline -> online
      }
    } else {
      statusChanged = true; // First time ever seen
    }

    if (typeof isIdle === "boolean") {
      updates.isClientIdle = isIdle;
      if (user.isClientIdle !== isIdle) {
        statusChanged = true;
      }
    }

    if (isOffline) {
      updates.lastSeen = new Date(Date.now() - 5 * 60000); 
      statusChanged = true;
    }

    await User.findByIdAndUpdate(user._id, { $set: updates });

    if (statusChanged) {
      try {
        const Member = (await import("@/models/Member")).default;
        const Friendship = (await import("@/models/Friendship")).default;
        const { pusherServer } = await import("@/lib/pusher");
        
        // Broadcast to servers
        const members = await Member.find({ userId: user._id });
        for (const member of members) {
          await pusherServer.trigger(`server-${member.serverId.toString()}`, "member-update", {});
        }

        // Broadcast to friends
        const friendships = await Friendship.find({
          $or: [{ user1: user._id }, { user2: user._id }],
          status: "accepted",
        });
        for (const f of friendships) {
          const friendId = f.user1.toString() === user._id.toString() ? f.user2.toString() : f.user1.toString();
          await pusherServer.trigger(`user-${friendId}`, "user-update", {});
        }
      } catch (err) {
        console.error("[PRESENCE_PUSHER_ERROR]", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRESENCE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
