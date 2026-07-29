import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Channel from "@/models/Channel";
import Member from "@/models/Member";

export default async function ServerPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  const server = await Server.findById(serverId).populate("channels").lean();
  if (!server) return redirect("/");

  // Redirect to the "general" text channel
  const generalChannel = (server.channels as any[])?.find(
    (c: any) => c.name === "general"
  );

  if (generalChannel) {
    return redirect(
      `/servers/${serverId}/channels/${generalChannel._id.toString()}`
    );
  }

  return redirect("/");
}
