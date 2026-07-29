import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function currentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email }).lean();

  if (!user) {
    return null;
  }

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image || "",
  };
}
