import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import Friendship from "@/models/Friendship";
import dbConnect from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const { friendshipId } = await params;
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return new NextResponse("Friendship not found", { status: 404 });
    }

    // Only the person who received the request can accept it
    if (friendship.actionUserId.toString() === user._id.toString()) {
      return new NextResponse("You cannot accept your own request", { status: 400 });
    }

    // Must be one of the users
    if (
      friendship.user1.toString() !== user._id.toString() &&
      friendship.user2.toString() !== user._id.toString()
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    friendship.status = "accepted";
    await friendship.save();

    return NextResponse.json(friendship);
  } catch (error) {
    console.error("[FRIENDSHIP_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const { friendshipId } = await params;
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return new NextResponse("Friendship not found", { status: 404 });
    }

    // Must be one of the users
    if (
      friendship.user1.toString() !== user._id.toString() &&
      friendship.user2.toString() !== user._id.toString()
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await Friendship.findByIdAndDelete(friendshipId);

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.error("[FRIENDSHIP_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
