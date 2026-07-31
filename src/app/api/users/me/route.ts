import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { image, statusText, isSuperAdmin, manualPresence } = await req.json();

    const updates: any = {};
    if (image !== undefined) updates.image = image;
    if (statusText !== undefined) updates.statusText = statusText;
    if (manualPresence !== undefined) updates.manualPresence = manualPresence;
    
    // Only allow blackmamba to change their super admin status
    if (isSuperAdmin !== undefined && user.name === "blackmamba") {
      updates.isSuperAdmin = isSuperAdmin;
    }

    if (Object.keys(updates).length > 0) {
      if (image !== undefined) {
        const oldUser = await User.findById(user._id);

        // If they had an image, it was from uploadthing (ufs.sh), and it's changing
        if (oldUser?.image && oldUser.image !== image && oldUser.image.includes("ufs.sh")) {
          try {
            const fileKey = oldUser.image.split("/").pop();
            if (fileKey) {
              const { UTApi } = await import("uploadthing/server");
              const utapi = new UTApi();
              await utapi.deleteFiles(fileKey);
            }
          } catch (error) {
            console.error("Failed to delete old image:", error);
          }
        }
      }

      await User.findByIdAndUpdate(user._id, { $set: updates });
      
      try {
        const Member = (await import("@/models/Member")).default;
        const { pusherServer } = await import("@/lib/pusher");
        const members = await Member.find({ userId: user._id });
        for (const member of members) {
          await pusherServer.trigger(`server-${member.serverId.toString()}`, "member-update", {});
        }
      } catch (error) {
        console.error("Pusher error:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USERS_ME_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
