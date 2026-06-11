import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CommandPalette from "@/components/CommandPalette";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "SBA Global",
  description: "글로벌 진출 스타트업 관리 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-base text-primary antialiased">
        <SessionWrapper>
          <Navbar />
          <CommandPalette />
          <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">{children}</main>
        </SessionWrapper>
      </body>
    </html>
  );
}
