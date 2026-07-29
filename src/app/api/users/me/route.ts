import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { image } = await req.json();

    if (image !== undefined) {
      await User.findByIdAndUpdate(user._id, { image });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USERS_ME_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
