import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Member from "@/models/Member";
import User from "@/models/User";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";

export default async function DMPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  const conversation = await Conversation.findById(conversationId)
    .populate({
      path: "memberOneId",
      model: Member,
      populate: { path: "userId", model: User },
    })
    .populate({
      path: "memberTwoId",
      model: Member,
      populate: { path: "userId", model: User },
    })
    .lean();

  if (!conversation) {
    return redirect("/me");
  }

  const memberOne = conversation.memberOneId as any;
  const memberTwo = conversation.memberTwoId as any;

  // Determine which member is the current user
  const isMemberOne = memberOne.userId._id.toString() === user._id.toString();
  
  if (!isMemberOne && memberTwo.userId._id.toString() !== user._id.toString()) {
    // Current user is not part of this conversation
    return redirect("/me");
  }

  const currentMember = isMemberOne ? memberOne : memberTwo;
  const otherMember = isMemberOne ? memberTwo : memberOne;
  const otherUser = otherMember.userId;

  // Since Conversations in Campfire are currently bound to a server via Member schema
  const serverId = currentMember.serverId.toString();

  return (
    <div className="flex h-full flex-col bg-discord-chat">
      <ChatHeader
        name={otherUser.name}
        type="conversation"
        imageUrl={otherUser.image}
      />
      <ChatMessages
        name={otherUser.name}
        chatId={conversationId}
        apiUrl="/api/direct-messages"
        paramKey="conversationId"
        paramValue={conversationId}
        type="conversation"
        currentMemberId={currentMember._id.toString()}
        currentMemberRole={currentMember.role}
        serverId={serverId}
      />
      <ChatInput
        apiUrl="/api/direct-messages"
        query={{ conversationId, serverId }}
        name={otherUser.name}
        type="conversation"
      />
    </div>
  );
}
