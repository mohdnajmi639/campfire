import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import Friendship from "@/models/Friendship";
import DirectMessage from "@/models/DirectMessage";
import { DMItem } from "./DMItem";
import { Search, UserRound } from "lucide-react";
import { UserPanel } from "@/components/user-panel";
import Link from "next/link";
import { DMSearchButton } from "./DMSearchButton";
import { getPresenceStatus } from "@/lib/presence";

export async function DMSidebar() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await dbConnect();

  // Find all member profiles for the current user
  const userMembers = await Member.find({ userId: user._id }).lean();
  const memberIds = userMembers.map((m) => m._id);

  // Find all conversations where the user is a participant
  const conversations = await Conversation.find({
    $or: [{ memberOneId: { $in: memberIds } }, { memberTwoId: { $in: memberIds } }],
  })
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
    .sort({ updatedAt: -1 })
    .lean();

  const conversationIds = conversations.map(c => c._id);
  
  // Find all conversations that have at least one message
  const messages = await DirectMessage.aggregate([
    { $match: { conversationId: { $in: conversationIds } } },
    { $group: { _id: "$conversationId" } }
  ]);
  const activeConversationIds = messages.map(m => m._id.toString());

  // Fetch accepted friendships
  const friendships = await Friendship.find({
    $or: [{ user1: user._id }, { user2: user._id }],
    status: "accepted"
  }).lean();

  const friendIds = friendships.map(f => 
    f.user1.toString() === user._id.toString() ? f.user2.toString() : f.user1.toString()
  );

  return (
    <div className="flex h-full w-full flex-col bg-discord-channel text-primary">
      {/* Search Bar Placeholder */}
      <div className="flex h-12 items-center border-b border-discord-dark/50 px-3 shadow-sm">
        <DMSearchButton />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
        <Link
          href="/me"
          className="group flex w-full items-center gap-x-4 rounded-sm px-3 py-2 text-discord-muted hover:bg-discord-hover hover:text-discord-text transition-colors mb-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[24px] bg-discord-darker group-hover:bg-discord-darker group-hover:text-white transition-all">
            <UserRound className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold">Friends</span>
        </Link>
        <div className="mb-1 px-2 pt-2 text-xs font-semibold uppercase text-discord-muted flex justify-between items-center group-hover:text-discord-text">
          <span>Direct Messages</span>
        </div>
        {conversations.map((conv: any) => {
          // Identify the OTHER member in the conversation
          const isMemberOne = memberIds.some(
            (id) => id.toString() === conv.memberOneId._id.toString()
          );
          const otherMember = isMemberOne ? conv.memberTwoId : conv.memberOneId;
          const otherUser = otherMember.userId;

          if (!otherUser) return null;

          const isFriend = friendIds.includes(otherUser._id.toString());
          const hasMessages = activeConversationIds.includes(conv._id.toString());
          
          // Only show if they are friends OR have exchanged messages
          if (!isFriend && !hasMessages) return null;

          return (
            <DMItem
              key={conv._id.toString()}
              id={conv._id.toString()}
              name={otherUser.name}
              imageUrl={otherUser.image}
              statusText={otherUser.statusText}
              presence={getPresenceStatus(otherUser, user.isSuperAdmin)}
            />
          );
        })}
      </div>
      <UserPanel user={{ name: user.name, image: user.image, statusText: user.statusText, isSuperAdmin: user.isSuperAdmin, manualPresence: user.manualPresence, isClientIdle: user.isClientIdle, lastSeen: user.lastSeen }} />
    </div>
  );
}
