"use client";

import { useMemo, useState } from "react";
import type { Company } from "@/lib/googleSheets";

type EmailEntry = {
  companyName: string;
  role: string;
  name: string;
  email: string;
};

export default function EmailClient({ companies }: { companies: Company[] }) {
  const years = useMemo(() => {
    const set = new Set(companies.map((c) => c.year).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [companies]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0] ?? "");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "ceo" | "manager">("all");

  const yearData = useMemo(
    () => companies.filter((c) => c.year === selectedYear),
    [companies, selectedYear]
  );

  const entries = useMemo<EmailEntry[]>(() => {
    const seen = new Set<string>();
    const result: EmailEntry[] = [];
    for (const c of yearData) {
      if (c.ceoEmail?.trim() && (filter === "all" || filter === "ceo")) {
        const key = `${c.ceoEmail.trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ companyName: c.name, role: "대표자", name: c.ceoName, email: c.ceoEmail.trim() });
        }
      }
      if (c.managerEmail?.trim() && (filter === "all" || filter === "manager")) {
        const key = `${c.managerEmail.trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ companyName: c.name, role: "담당자", name: c.managerName, email: c.managerEmail.trim() });
        }
      }
    }
    return result;
  }, [yearData, filter]);

  const emailList = entries.map((e) => e.email).join(", ");

  async function handleCopy() {
    await navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 연도 탭 */}
      <div className="flex flex-wrap gap-2">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === year
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* 필터 + 복사 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(["all", "ceo", "manager"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                filter === f
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "전체" : f === "ceo" ? "대표자만" : "담당자만"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{entries.length}개 이메일</span>
          <button
            onClick={handleCopy}
            disabled={entries.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              entries.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? "✓ 복사됨" : "전체 주소 복사"}
          </button>
        </div>
      </div>

      {/* 이메일 미리보기 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
          {selectedYear}년 수신자 목록 — 아래 주소가 복사됩니다
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            이 연도에 등록된 이메일 주소가 없습니다.
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[500px] divide-y divide-gray-100">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                <div className="w-16 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.role === "대표자"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {e.role}
                  </span>
                </div>
                <div className="w-28 shrink-0 text-sm text-gray-700 truncate">{e.companyName}</div>
                <div className="w-20 shrink-0 text-sm text-gray-500 truncate">{e.name}</div>
                <div className="text-sm text-blue-600 truncate">{e.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
