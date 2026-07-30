import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import { redirect } from "next/navigation";
import { NavigationItem } from "./NavigationItem";
import { NavigationAction } from "./NavigationAction";
import { Flame } from "lucide-react";
import Link from "next/link";
import { UserRealtimeUpdates } from "./UserRealtimeUpdates";

export async function NavigationSidebar() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  // Find all servers where the user is a member
  const memberRecords = await Member.find({ userId: user._id }).lean();
  const serverIds = memberRecords.map((m) => m.serverId);
  const servers = await Server.find({ _id: { $in: serverIds } }).lean();

  return (
    <div className="flex h-full w-[72px] flex-col items-center gap-y-2 bg-discord-darker py-3">
      {/* Home / Logo */}
      {/* Home / Logo */}
      <Link href="/me" className="group mb-1 flex">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-channel transition-all duration-200 group-hover:rounded-xl group-hover:bg-campfire-orange cursor-pointer">
          <Flame className="h-6 w-6 text-campfire-orange transition-colors group-hover:text-white" />
        </div>
      </Link>

      {/* Separator */}
      <div className="mx-auto h-[2px] w-8 rounded-full bg-discord-channel" />

      {/* Server List */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center gap-y-2">
          {servers.map((server) => (
            <NavigationItem
              key={server._id.toString()}
              id={server._id.toString()}
              name={server.name}
              imageUrl={server.imageUrl}
            />
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="mx-auto h-[2px] w-8 rounded-full bg-discord-channel" />

      {/* Add Server */}
      <NavigationAction />
      <UserRealtimeUpdates userId={user._id.toString()} />
    </div>
  );
}
