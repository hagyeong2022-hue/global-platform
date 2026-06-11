"use client";

import { useEffect, useState } from "react";

// 관심기업 ☆ 토글 — 로그인 사용자별
export default function BookmarkStar({ companyName }: { companyName: string }) {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setOn((d.companies ?? []).includes(companyName)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyName]);

  async function toggle() {
    const next = !on;
    setOn(next);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: companyName, on: next }),
      });
    } catch {
      setOn(!next);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={on ? "관심기업 해제" : "관심기업 추가"}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
        on ? "border-[#FBBF24]/50 bg-[#FBBF24]/15 text-[#FBBF24]" : "border-edge text-secondary hover:bg-elevated hover:text-primary"
      }`}
    >
      {on ? "★" : "☆"} 관심기업
    </button>
  );
}
