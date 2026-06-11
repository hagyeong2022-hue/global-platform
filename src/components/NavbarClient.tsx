"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const MENUS = [
  { href: "/", label: "홈" },
  { href: "/startups", label: "스타트업" },
  { href: "/bookmarks", label: "관심기업" },
  { href: "/programs", label: "프로그램" },
  { href: "/news", label: "뉴스" },
  { href: "/email", label: "이메일" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function NavbarClient({ userEmail, isAdmin = false }: { userEmail: string | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menus = isAdmin ? [...MENUS, { href: "/admin", label: "관리자" }] : MENUS;

  return (
    <header className="bg-surface/80 backdrop-blur border-b border-edge sticky top-0 z-20">
      <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-primary shrink-0">
          SBA <span className="text-accent">Global</span>
        </Link>

        {/* 검색 (⌘K) */}
        <button
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-edge text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
        >
          <span>🔍 검색</span>
          <kbd className="text-[10px] px-1 py-0.5 rounded bg-elevated border border-edge">⌘K</kbd>
        </button>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive(pathname, m.href)
                  ? "bg-accent-soft text-accent"
                  : "text-secondary hover:text-primary hover:bg-elevated"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {userEmail && (
            <>
              <span className="text-xs text-secondary hidden lg:block">{userEmail}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="hidden md:block text-xs px-3 py-1.5 rounded-lg border border-edge text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                로그아웃
              </button>
            </>
          )}
          {/* 모바일 햄버거 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-secondary hover:bg-elevated"
            aria-label="메뉴 열기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              {mobileOpen ? (
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-edge bg-surface px-4 py-3 flex flex-col gap-1 text-sm font-medium">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 rounded-lg ${
                isActive(pathname, m.href)
                  ? "bg-accent-soft text-accent"
                  : "text-secondary hover:bg-elevated hover:text-primary"
              }`}
            >
              {m.label}
            </Link>
          ))}
          {userEmail && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 px-3 py-2.5 rounded-lg border border-edge text-secondary text-left hover:bg-elevated"
            >
              로그아웃 ({userEmail})
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
