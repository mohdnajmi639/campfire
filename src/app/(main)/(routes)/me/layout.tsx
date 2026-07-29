import { DMSidebar } from "@/components/navigation/DMSidebar";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full">
      <div className="hidden md:flex h-full w-60 shrink-0 flex-col">
        <DMSidebar />
      </div>
      <main className="flex-1 h-full">{children}</main>
    </div>
  );
}
