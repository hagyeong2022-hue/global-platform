"use client";

import type { Company } from "@/lib/googleSheets";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CompanyTable({ companies }: { companies: Company[] }) {
  const years = useMemo(() => {
    const set = new Set(companies.map((c) => c.year).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [companies]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0] ?? "");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return companies.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.ceoName?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q)
      );
    }
    return companies.filter((c) => c.year === selectedYear);
  }, [companies, selectedYear, search]);

  return (
    <div className="flex flex-col gap-3">
      {/* 검색창 */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="기업명, 대표자, 업종으로 검색..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 연도 탭 — 검색 중엔 숨김 */}
      <div className={`flex flex-wrap gap-2 ${search ? "hidden" : ""}`}>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === year
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {year} <span className="text-xs opacity-70">({companies.filter((c) => c.year === year).length})</span>
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          {search ? `"${search}"에 해당하는 기업이 없습니다.` : "이 연도에 등록된 기업이 없습니다."}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">기업명</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">대표자</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">분야</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">사업내용</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">진출 국가</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">프로그램</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      <Link href={`/companies/${encodeURIComponent(c.id)}`} className="text-blue-600 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{c.ceoName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{c.industry}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-md truncate" title={c.description}>{c.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {c.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={c.programName}>{c.programName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-right">
            {search ? `검색 결과 ${filtered.length}개 기업` : `${selectedYear}년 ${filtered.length}개 기업`}
          </div>
        </div>
      )}
    </div>
  );
}
