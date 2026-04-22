"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";

export default function UserMenu({ session }: { session: Session }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 hidden sm:block">
        {session.user?.email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
