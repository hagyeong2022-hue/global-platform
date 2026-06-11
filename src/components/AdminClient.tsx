"use client";

import { useState, useMemo } from "react";
import type { Company } from "@/lib/googleSheets";

// 투자단계 표준값 (시트의 잘못된 값도 여기서 교정)
const STAGES = [
  "", "예비창업", "Seed", "Pre-A", "Series A", "Series B",
  "Series C+", "Pre-IPO", "상장", "M&A·Exit",
];

const TEXT_FIELDS = [
  { key: "revenue", label: "매출(원)", placeholder: "예: 1200000000" },
  { key: "investmentAmount", label: "투자유치(원)", placeholder: "예: 500000000" },
  { key: "employment", label: "고용(명)", placeholder: "예: 25" },
  { key: "lastInvestmentDate", label: "최근투자일", placeholder: "예: 2025-03" },
] as const;

type RowStatus = "idle" | "saving" | "saved" | "error";

export default function AdminClient({ companies }: { companies: Company[] }) {
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<number, Record<string, string>>>({});
  const [status, setStatus] = useState<Record<number, RowStatus>>({});

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s
      ? companies.filter((c) =>
          `${c.name} ${c.ceoName} ${c.businessNumber} ${c.industry}`.toLowerCase().includes(s)
        )
      : companies;
    return base.slice(0, 100);
  }, [companies, q]);

  function getVal(c: Company, key: string): string {
    const e = edits[c.rowNumber]?.[key];
    if (e !== undefined) return e;
    return (c[key as keyof Company] as string) ?? "";
  }
  function setVal(rowNumber: number, key: string, value: string) {
    setEdits((p) => ({ ...p, [rowNumber]: { ...p[rowNumber], [key]: value } }));
  }
  function isDirty(rowNumber: number) {
    return !!edits[rowNumber] && Object.keys(edits[rowNumber]).length > 0;
  }

  async function save(c: Company) {
    const fields = edits[c.rowNumber];
    if (!fields) return;
    setStatus((p) => ({ ...p, [c.rowNumber]: "saving" }));
    try {
      const res = await fetch("/api/admin/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: c.rowNumber, fields }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "저장 실패");
      setStatus((p) => ({ ...p, [c.rowNumber]: "saved" }));
      setEdits((p) => {
        const next = { ...p };
        delete next[c.rowNumber];
        return next;
      });
      setTimeout(() => setStatus((p) => ({ ...p, [c.rowNumber]: "idle" })), 2000);
    } catch (e) {
      setStatus((p) => ({ ...p, [c.rowNumber]: "error" }));
      alert(e instanceof Error ? e.message : "저장 실패");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="기업명·대표자·사업자번호 검색…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
      </div>
      <p className="text-xs text-secondary">
        {q ? `검색 결과 ${filtered.length}개 (최대 100개 표시)` : `전체 ${companies.length}개 중 100개 표시 — 검색으로 좁히세요`}
      </p>

      <div className="rounded-xl border border-edge bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elevated text-secondary text-xs">
              <tr>
                <th className="px-3 py-3 text-left whitespace-nowrap">기업명 ({"연도"})</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">투자단계</th>
                {TEXT_FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-3 text-left whitespace-nowrap">{f.label}</th>
                ))}
                <th className="px-3 py-3 text-left whitespace-nowrap">저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60">
              {filtered.map((c) => {
                const st = status[c.rowNumber] ?? "idle";
                const dirty = isDirty(c.rowNumber);
                return (
                  <tr key={c.rowNumber} className="hover:bg-elevated/40">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium text-primary">{c.name}</div>
                      <div className="text-xs text-secondary/70">{c.year} · 행{c.rowNumber}</div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={getVal(c, "investmentStage")}
                        onChange={(e) => setVal(c.rowNumber, "investmentStage", e.target.value)}
                        className="rounded-lg border border-edge bg-base px-2 py-1.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s || "—"}</option>
                        ))}
                      </select>
                    </td>
                    {TEXT_FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2">
                        <input
                          value={getVal(c, f.key)}
                          onChange={(e) => setVal(c.rowNumber, f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-28 rounded-lg border border-edge bg-base px-2 py-1.5 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => save(c)}
                        disabled={!dirty || st === "saving"}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          st === "saved"
                            ? "bg-positive text-white"
                            : st === "error"
                            ? "bg-negative text-white"
                            : dirty
                            ? "bg-accent text-white hover:bg-accent-hover"
                            : "bg-elevated text-secondary/50 cursor-not-allowed"
                        }`}
                      >
                        {st === "saving" ? "저장 중…" : st === "saved" ? "✓ 저장됨" : st === "error" ? "오류" : "저장"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
