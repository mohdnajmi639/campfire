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

  // Redirect to the "general" text channel if it exists, otherwise the first text channel
  let targetChannel = (server.channels as any[])?.find(
    (c: any) => c.name === "general" && c.type === "TEXT"
  );
  
  if (!targetChannel && server.channels && server.channels.length > 0) {
    targetChannel = (server.channels as any[])?.find((c: any) => c.type === "TEXT") || server.channels[0];
  }

  if (targetChannel) {
    return redirect(
      `/servers/${serverId}/channels/${targetChannel._id.toString()}`
    );
  }

  return redirect("/");
}
