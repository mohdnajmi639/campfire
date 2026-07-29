import { NavigationSidebar } from "@/components/navigation/NavigationSidebar";

import { GlobalVoiceProvider } from "@/components/providers/GlobalVoiceProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Navigation Sidebar (server icons) */}
      <div className="hidden md:flex h-full w-[72px] shrink-0 flex-col">
        <NavigationSidebar />
      </div>

      {/* Content */}
      <main className="flex-1 h-full relative">
        {children}
        <GlobalVoiceProvider />
      </main>
    </div>
  );
}
