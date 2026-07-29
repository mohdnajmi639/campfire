import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import Channel from "@/models/Channel";
import { ChannelType } from "@/types";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { ServerHeader } from "./ServerHeader";
import { Hash, Mic, Video } from "lucide-react";
import { ServerSection } from "./ServerSection";
import { ServerChannel } from "./ServerChannel";
import { ServerMember } from "./ServerMember";

interface ServerSidebarProps {
  serverId: string;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
};

export async function ServerSidebar({ serverId }: ServerSidebarProps) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  const server = await Server.findById(serverId)
    .populate("channels")
    .populate({
      path: "members",
      populate: { path: "userId", model: User },
    })
    .lean();

  if (!server) return redirect("/");

  const textChannels = (server.channels as any[])?.filter(
    (c: any) => c.type === ChannelType.TEXT
  ) || [];
  const audioChannels = (server.channels as any[])?.filter(
    (c: any) => c.type === ChannelType.AUDIO
  ) || [];
  const videoChannels = (server.channels as any[])?.filter(
    (c: any) => c.type === ChannelType.VIDEO
  ) || [];

  const members = (server.members as any[]) || [];
  const currentMember = members.find(
    (m: any) => m.userId?._id?.toString() === user._id
  );

  if (!currentMember) return redirect("/");

  const role = currentMember.role;

  return (
    <div className="flex h-full w-60 flex-col bg-discord-channel">
      <ServerHeader
        server={{
          _id: server._id.toString(),
          name: server.name,
          imageUrl: server.imageUrl,
          inviteCode: server.inviteCode,
          userId: server.userId.toString(),
        }}
        role={role}
      />
      <div className="flex-1 overflow-y-auto px-2">
        {/* Text Channels */}
        {textChannels.length > 0 && (
          <ServerSection
            label="Text Channels"
            role={role}
            channelType={ChannelType.TEXT}
            serverId={serverId}
          >
            {textChannels.map((channel: any) => (
              <ServerChannel
                key={channel._id.toString()}
                channel={{
                  _id: channel._id.toString(),
                  name: channel.name,
                  type: channel.type,
                }}
                serverId={serverId}
                role={role}
                Icon={iconMap[channel.type as ChannelType]}
              />
            ))}
          </ServerSection>
        )}

        {/* Audio Channels */}
        {audioChannels.length > 0 && (
          <ServerSection
            label="Voice Channels"
            role={role}
            channelType={ChannelType.AUDIO}
            serverId={serverId}
          >
            {audioChannels.map((channel: any) => (
              <ServerChannel
                key={channel._id.toString()}
                channel={{
                  _id: channel._id.toString(),
                  name: channel.name,
                  type: channel.type,
                }}
                serverId={serverId}
                role={role}
                Icon={iconMap[channel.type as ChannelType]}
              />
            ))}
          </ServerSection>
        )}

        {/* Video Channels */}
        {videoChannels.length > 0 && (
          <ServerSection
            label="Video Channels"
            role={role}
            channelType={ChannelType.VIDEO}
            serverId={serverId}
          >
            {videoChannels.map((channel: any) => (
              <ServerChannel
                key={channel._id.toString()}
                channel={{
                  _id: channel._id.toString(),
                  name: channel.name,
                  type: channel.type,
                }}
                serverId={serverId}
                role={role}
                Icon={iconMap[channel.type as ChannelType]}
              />
            ))}
          </ServerSection>
        )}

        {/* Members */}
        {members.length > 0 && (
          <ServerSection label="Members" role={role} serverId={serverId}>
            {members.map((member: any) => (
              <ServerMember
                key={member._id.toString()}
                member={{
                  _id: member._id.toString(),
                  role: member.role,
                  user: {
                    _id: member.userId?._id?.toString(),
                    name: member.userId?.name,
                    image: member.userId?.image,
                  },
                }}
                serverId={serverId}
              />
            ))}
          </ServerSection>
        )}
      </div>
    </div>
  );
}

