import { ServerSidebar } from "@/components/server/ServerSidebar";

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;

  return (
    <div className="flex h-full">
      {/* Server Sidebar (channels) */}
      <div className="hidden md:flex h-full w-60 shrink-0 flex-col">
        <ServerSidebar serverId={serverId} />
      </div>

      {/* Channel content */}
      <main className="flex-1 h-full">{children}</main>
    </div>
  );
}
