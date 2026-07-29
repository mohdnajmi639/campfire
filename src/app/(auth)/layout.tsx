export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-discord-darker">
      <div className="w-full max-w-md animate-scale-in">{children}</div>
    </div>
  );
}
