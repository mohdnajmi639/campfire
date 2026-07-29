import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ serverId: string; memberId: string }>;
}) {
  const { serverId, memberId } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  const currentMember = await Member.findOne({
    userId: user._id,
    serverId,
  }).lean();

  if (!currentMember) return redirect("/");

  const otherMember = await Member.findById(memberId)
    .populate({ path: "userId", model: User })
    .lean();

  if (!otherMember) return redirect("/");

  // Find or create conversation
  let conversation = await Conversation.findOne({
    $or: [
      { memberOneId: currentMember._id, memberTwoId: memberId },
      { memberOneId: memberId, memberTwoId: currentMember._id },
    ],
  }).lean();

  if (!conversation) {
    const newConv = await Conversation.create({
      memberOneId: currentMember._id,
      memberTwoId: memberId,
    });
    conversation = newConv.toObject();
  }

  const otherUser = (otherMember as any).userId;
  const conversationId = conversation._id.toString();

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
