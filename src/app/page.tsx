import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import dbConnect from "@/lib/db";
import Server from "@/models/Server";
import Member from "@/models/Member";
import { Flame } from "lucide-react";

export default async function SetupPage() {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  await dbConnect();

  // Find first server user is a member of
  const firstMember = await Member.findOne({ userId: user._id }).lean();

  if (firstMember) {
    const server = await Server.findById(firstMember.serverId).lean();
    if (server) {
      return redirect(`/servers/${server._id}`);
    }
  }

  // No servers — show landing
  return (
    <div className="flex h-screen items-center justify-center bg-discord-darker">
      <div className="max-w-lg text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-campfire-orange to-campfire-ember shadow-2xl animate-pulse-glow">
          <Flame className="h-12 w-12 text-white" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-white">
          Welcome to Campfire
        </h1>
        <p className="mb-8 text-discord-muted">
          Create your first server to start chatting with friends and communities.
        </p>

        {/* Using a client component for the button */}
        <SetupButton />
      </div>
    </div>
  );
}

// Client component for the create server button
import { CreateServerButton } from "@/components/CreateServerButton";

function SetupButton() {
  return <CreateServerButton />;
}
