import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { ModalProvider } from "@/components/providers/ModalProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campfire — Chat, Connect, Collaborate",
  description:
    "Campfire is a real-time communication platform for communities. Chat with text, voice, and share files with your friends and teams.",
  keywords: ["chat", "voice", "community", "campfire", "real-time", "messaging"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-discord-chat text-discord-text">
        <Providers>
          <ModalProvider />
          {children}
        </Providers>
      </body>
    </html>
  );
}
