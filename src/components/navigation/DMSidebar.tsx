import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import { DMItem } from "./DMItem";
import { Search } from "lucide-react";
import { UserPanel } from "@/components/user-panel";

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

  return (
    <div className="flex h-full w-full flex-col bg-discord-channel text-primary">
      {/* Search Bar Placeholder */}
      <div className="flex h-12 items-center border-b border-discord-dark/50 px-3 shadow-sm">
        <button className="flex w-full items-center gap-x-2 rounded-sm bg-discord-darker px-2 py-1 text-sm text-discord-muted transition hover:bg-discord-darker/80">
          <Search className="h-4 w-4" />
          Find or start a conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 no-scrollbar">
        <div className="mb-2 px-2 text-xs font-semibold uppercase text-discord-muted">
          Direct Messages
        </div>
        {conversations.map((conv: any) => {
          // Identify the OTHER member in the conversation
          const isMemberOne = memberIds.some(
            (id) => id.toString() === conv.memberOneId._id.toString()
          );
          const otherMember = isMemberOne ? conv.memberTwoId : conv.memberOneId;
          const otherUser = otherMember.userId;

          if (!otherUser) return null;

          return (
            <DMItem
              key={conv._id.toString()}
              id={conv._id.toString()}
              name={otherUser.name}
              imageUrl={otherUser.image}
            />
          );
        })}
      </div>
      <UserPanel user={{ name: user.name, image: user.image }} />
    </div>
  );
}
