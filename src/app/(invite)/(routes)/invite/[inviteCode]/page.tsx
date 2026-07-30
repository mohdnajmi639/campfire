import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import { MemberRole } from "@/types";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  if (!inviteCode) return redirect("/");

  await dbConnect();

  const server = await Server.findOne({ inviteCode });
  if (!server) return redirect("/");

  // Check if already a member
  const existingMember = await Member.findOne({
    userId: user._id,
    serverId: server._id,
  });

  if (existingMember) {
    return redirect(`/servers/${server._id}`);
  }

  // Join the server
  const member = await Member.create({
    userId: user._id,
    serverId: server._id,
    role: MemberRole.GUEST,
  });

  server.members.push(member._id);
  await server.save();

  try {
    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`server-${server._id.toString()}`, "member-update", {});
  } catch (error) {
    console.error("Pusher error:", error);
  }

  return redirect(`/servers/${server._id}`);
}
