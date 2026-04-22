import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionWrapper from "@/components/SessionWrapper";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Global Platform",
  description: "글로벌 진출 기업 관리 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        <SessionWrapper>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
        </SessionWrapper>
      </body>
    </html>
  );
}
