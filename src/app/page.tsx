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

  return redirect("/me");
}

// Client component for the create server button
import { CreateServerButton } from "@/components/CreateServerButton";

function SetupButton() {
  return <CreateServerButton />;
}
