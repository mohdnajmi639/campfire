import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Channel from "@/models/Channel";
import { ChannelType } from "@/types";
import Member from "@/models/Member";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { VoiceChannelTrigger } from "@/components/voice-channel-trigger";
import { RightSidebar } from "@/components/chat/RightSidebar";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  const channel = await Channel.findById(channelId).lean();
  if (!channel) return redirect("/");

  const member = await Member.findOne({
    userId: user._id,
    serverId,
  }).lean();

  if (!member) return redirect("/");

  return (
    <div className="flex h-full w-full bg-discord-chat overflow-hidden">
      <div className="flex h-full flex-col flex-1 min-w-0">
        <ChatHeader
          name={channel.name}
          type="channel"
          channelType={channel.type}
          serverId={serverId}
          channelId={channelId}
        />

        {channel.type === ChannelType.TEXT && (
          <>
            <ChatMessages
              name={channel.name}
              chatId={channelId}
              apiUrl="/api/messages"
              paramKey="channelId"
              paramValue={channelId}
              type="channel"
              currentMemberId={member._id.toString()}
              currentMemberRole={user.isSuperAdmin ? "ADMIN" : member.role}
              currentUserId={user._id.toString()}
              serverId={serverId}
            />
            <ChatInput
              apiUrl="/api/messages"
              query={{ channelId, serverId }}
              name={channel.name}
              type="channel"
            />
          </>
        )}

        {channel.type === ChannelType.AUDIO && (
          <VoiceChannelTrigger
            channel={{
              id: channelId,
              name: channel.name,
              serverId,
              video: false,
            }}
          />
        )}

        {channel.type === ChannelType.VIDEO && (
          <VoiceChannelTrigger
            channel={{
              id: channelId,
              name: channel.name,
              serverId,
              video: true,
            }}
          />
        )}
      </div>
      {channel.type === ChannelType.TEXT && (
        <RightSidebar
          currentMemberId={member._id.toString()}
          currentMemberRole={user.isSuperAdmin ? "ADMIN" : member.role}
          currentUserId={user._id.toString()}
        />
      )}
    </div>
  );
}
