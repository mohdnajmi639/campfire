import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import { redirect } from "next/navigation";
import { NavigationItem } from "./NavigationItem";
import { NavigationAction } from "./NavigationAction";
import { UserButton } from "./UserButton";
import { Flame } from "lucide-react";

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
      <div className="group mb-1 flex">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-channel transition-all duration-200 group-hover:rounded-xl group-hover:bg-campfire-orange cursor-pointer">
          <Flame className="h-6 w-6 text-campfire-orange transition-colors group-hover:text-white" />
        </div>
      </div>

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

      {/* User Button */}
      <div className="mt-auto">
        <UserButton name={user.name} image={user.image} />
      </div>
    </div>
  );
}
