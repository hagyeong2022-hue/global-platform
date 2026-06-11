"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import StageBadge from "@/components/ui/StageBadge";

type C = {
  id: string; name: string; industry: string; region: string;
  ceoName: string; description: string; investmentStage: string;
  ceoEmail: string; managerEmail: string;
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<C[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open && companies === null) {
      fetch("/api/companies").then((r) => r.json()).then((d) => setCompanies(d.companies ?? [])).catch(() => setCompanies([]));
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(""); setActive(0); }
  }, [open, companies]);

  const results = useMemo(() => {
    if (!companies) return [];
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const seen = new Set<string>();
    const out: C[] = [];
    for (const c of companies) {
      if (`${c.name} ${c.ceoName} ${c.industry} ${c.description}`.toLowerCase().includes(s)) {
        if (seen.has(c.name)) continue;
        seen.add(c.name);
        out.push(c);
        if (out.length >= 20) break;
      }
    }
    return out;
  }, [companies, q]);

  useEffect(() => setActive(0), [q]);

  function go(c: C) {
    setOpen(false);
    router.push(`/companies/${encodeURIComponent(c.id)}`);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl mx-4 rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && results[active]) go(results[active]);
          }}
          placeholder="기업명·대표자·분야 검색…"
          className="w-full px-5 py-4 bg-transparent text-primary placeholder:text-secondary/50 focus:outline-none border-b border-edge"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {!companies && <p className="px-4 py-6 text-center text-sm text-secondary">불러오는 중…</p>}
          {companies && !q && <p className="px-4 py-6 text-center text-sm text-secondary/60">기업명·대표자·분야로 검색하세요</p>}
          {companies && q && results.length === 0 && <p className="px-4 py-6 text-center text-sm text-secondary">결과 없음</p>}
          {results.map((c, i) => (
            <button
              key={c.id}
              onClick={() => go(c)}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${i === active ? "bg-elevated" : ""}`}
            >
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-primary truncate">{c.name}</span>
                <span className="block text-xs text-secondary truncate">{[c.industry, c.region].filter(Boolean).join(" · ")}</span>
              </span>
              <StageBadge stage={c.investmentStage} />
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-edge text-[11px] text-secondary/60 flex gap-3">
          <span>↑↓ 이동</span><span>↵ 열기</span><span>esc 닫기</span>
        </div>
      </div>
    </div>
  );
}
