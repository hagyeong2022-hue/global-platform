import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "SBA Global",
  description: "글로벌 진출 스타트업 관리 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full flex bg-base text-primary antialiased">
        <SessionWrapper>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-auto">
            <CommandPalette />
            <main className="flex-1 w-full max-w-[1200px] px-8 py-8">{children}</main>
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
