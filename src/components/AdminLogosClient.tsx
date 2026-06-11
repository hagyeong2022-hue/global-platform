"use client";

import { useState, useMemo, useRef } from "react";
import CompanyAvatar from "@/components/ui/CompanyAvatar";

type Row = { id: string; name: string; industry: string };

export default function AdminLogosClient({
  companies,
  initialLogos,
}: {
  companies: Row[];
  initialLogos: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [logos, setLogos] = useState<Record<string, string>>(initialLogos);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s ? companies.filter((c) => c.name.toLowerCase().includes(s)) : companies;
    return base.slice(0, 100);
  }, [companies, q]);

  async function upload(name: string, file: File) {
    if (file.size > 2 * 1024 * 1024) { alert("2MB 이하만 가능합니다."); return; }
    setBusy(name);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch("/api/admin/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: name, dataUrl }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "업로드 실패");
      setLogos((p) => ({ ...p, [name]: `${data.url}?t=${Date.now()}` }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="기업명 검색…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
      </div>
      <p className="text-xs text-secondary">{q ? `${filtered.length}개` : `전체 ${companies.length}개 중 100개 표시`}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3">
            <CompanyAvatar name={c.name} logoUrl={logos[c.name]} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{c.name}</p>
              <p className="text-xs text-secondary truncate">{c.industry || "—"}</p>
            </div>
            <input
              ref={(el) => { fileRefs.current[c.name] = el; }}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(c.name, f); e.target.value = ""; }}
            />
            <button
              onClick={() => fileRefs.current[c.name]?.click()}
              disabled={busy === c.name}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-edge text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
            >
              {busy === c.name ? "업로드 중…" : logos[c.name] ? "변경" : "업로드"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
