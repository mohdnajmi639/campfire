import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { RoomServiceClient } from "livekit-server-sdk";
import Server from "@/models/Server";
import dbConnect from "@/lib/db";

const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { serverId } = await params;
    
    await dbConnect();
    const server = await Server.findById(serverId).populate("channels");
    if (!server) return new NextResponse("Server not found", { status: 404 });

    const activeRooms: Record<string, { sessionStart: number, participants: any[] }> = {};
    
    const channelIds = server.channels.map((c: any) => c._id.toString());
    const rooms = await roomService.listRooms(channelIds);
    
    for (const room of rooms) {
      const channelId = room.name;
      const participants = await roomService.listParticipants(channelId);
      if (participants.length > 0) {
          const joinedTimes = participants.map(p => Number(p.joinedAt) * 1000).filter(Boolean);
          const sessionStart = Math.min(...joinedTimes);
          
          const mappedParticipants = participants.map(p => {
             let avatarUrl = "";
             try {
                const meta = JSON.parse(p.metadata || "{}");
                avatarUrl = meta.image || "";
             } catch (e) {}

             // Default assumptions if tracks are missing
             let isMicMuted = true;
             let isCameraOn = false;
             let isScreenSharing = false;

             if (p.tracks) {
                p.tracks.forEach(t => {
                   if (t.source === 2) { // TrackSource.MICROPHONE
                      isMicMuted = t.muted;
                   } else if (t.source === 1) { // TrackSource.CAMERA
                      isCameraOn = !t.muted;
                   } else if (t.source === 3) { // TrackSource.SCREEN_SHARE
                      isScreenSharing = !t.muted;
                   }
                });
             }

             return {
                identity: p.identity,
                name: p.name || p.identity,
                avatarUrl,
                isMicMuted,
                isCameraOn,
                isScreenSharing
             };
          });

          activeRooms[channelId] = { sessionStart, participants: mappedParticipants };
      }
    }
    
    return NextResponse.json(activeRooms);
  } catch (error) {
     console.error("[LIVEKIT_STATUS]", error);
     return new NextResponse("Internal Error", { status: 500 });
  }
}
