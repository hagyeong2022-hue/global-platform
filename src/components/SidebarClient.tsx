"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const MENUS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: "/startups",
    label: "스타트업",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: "/bookmarks",
    label: "관심기업",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    href: "/programs",
    label: "프로그램",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/news",
    label: "뉴스",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/>
      </svg>
    ),
  },
  {
    href: "/email",
    label: "이메일",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function SidebarClient({
  userEmail,
  isAdmin = false,
}: {
  userEmail: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menus = isAdmin
    ? [...MENUS, {
        href: "/admin",
        label: "관리자",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
          </svg>
        ),
      }]
    : MENUS;

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-edge bg-surface h-screen sticky top-0 overflow-y-auto">
        {/* 로고 */}
        <div className="px-5 py-5 border-b border-edge">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white text-xs font-bold">S</span>
            <span className="font-bold text-sm text-primary">
              SBA <span className="text-accent">Global</span>
            </span>
          </Link>
        </div>

        {/* 검색 버튼 */}
        <div className="px-3 pt-3">
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-edge text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <span>검색</span>
            <kbd className="ml-auto text-[10px] px-1 py-0.5 rounded bg-elevated border border-edge">⌘K</kbd>
          </button>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
          <p className="px-2 pt-2 pb-1 text-[10px] font-semibold text-secondary/60 uppercase tracking-wider">메뉴</p>
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(pathname, m.href)
                  ? "bg-accent text-white font-medium"
                  : "text-secondary hover:text-primary hover:bg-elevated"
              }`}
            >
              <span className={isActive(pathname, m.href) ? "text-white" : "text-secondary"}>{m.icon}</span>
              {m.label}
            </Link>
          ))}
        </nav>

        {/* 하단 유저 정보 */}
        {userEmail && (
          <div className="px-3 py-3 border-t border-edge">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                {userEmail[0].toUpperCase()}
              </div>
              <span className="text-xs text-secondary truncate flex-1">{userEmail}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full mt-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              로그아웃
            </button>
          </div>
        )}
      </aside>

      {/* 모바일 상단 바 */}
      <header className="md:hidden bg-surface border-b border-edge sticky top-0 z-20 flex items-center justify-between px-4 h-12">
        <Link href="/" className="font-bold text-sm text-primary">
          SBA <span className="text-accent">Global</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-secondary hover:bg-elevated"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            {mobileOpen
              ? <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
              : <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round"/>}
          </svg>
        </button>
      </header>

      {/* 모바일 드롭다운 */}
      {mobileOpen && (
        <nav className="md:hidden fixed top-12 left-0 right-0 z-20 bg-surface border-b border-edge px-4 py-2 flex flex-col gap-1 shadow-lg">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                isActive(pathname, m.href)
                  ? "bg-accent text-white font-medium"
                  : "text-secondary hover:bg-elevated hover:text-primary"
              }`}
            >
              {m.icon}
              {m.label}
            </Link>
          ))}
          {userEmail && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-1 px-3 py-2.5 rounded-lg text-sm text-left text-secondary border border-edge hover:bg-elevated"
            >
              로그아웃 ({userEmail})
            </button>
          )}
        </nav>
      )}
    </>
  );
}
