"use client";

import { useMemo, useState } from "react";
import type { Company } from "@/lib/googleSheets";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

type RegionGroup = {
  region: string;
  companies: Company[];
  programs: string[];
};

export default function ProgramsClient({ companies }: { companies: Company[] }) {
  const years = useMemo(() => {
    const set = new Set(companies.map((c) => c.year).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [companies]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0] ?? "");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const yearData = useMemo(
    () => companies.filter((c) => c.year === selectedYear),
    [companies, selectedYear]
  );

  const regionGroups = useMemo<RegionGroup[]>(() => {
    const map = new Map<string, Company[]>();
    for (const c of yearData) {
      const key = c.region || "기타";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries())
      .map(([region, list]) => ({
        region,
        companies: list,
        programs: Array.from(new Set(list.map((c) => c.programName).filter(Boolean))),
      }))
      .sort((a, b) => b.companies.length - a.companies.length);
  }, [yearData]);

  const chartData = regionGroups.map((g) => ({
    name: g.region,
    count: g.companies.length,
  }));

  const totalCompanies = yearData.length;
  const totalRegions = regionGroups.length;
  const totalPrograms = new Set(yearData.map((c) => c.programName).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6">
      {/* 연도 탭 */}
      <div className="flex flex-wrap gap-2">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => { setSelectedYear(year); setExpandedRegion(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === year
                ? "bg-accent text-white"
                : "bg-surface border border-edge text-secondary hover:bg-elevated hover:text-primary"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* KPI 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-edge p-4 text-center">
          <p className="text-xs text-secondary/80 mb-1">지원 기업 수</p>
          <p className="text-2xl font-bold text-accent">{totalCompanies.toLocaleString()}</p>
          <p className="text-xs text-secondary/80 mt-0.5">개 기업</p>
        </div>
        <div className="bg-surface rounded-xl border border-edge p-4 text-center">
          <p className="text-xs text-secondary/80 mb-1">진출 국가 수</p>
          <p className="text-2xl font-bold text-accent">{totalRegions}</p>
          <p className="text-xs text-secondary/80 mt-0.5">개국</p>
        </div>
        <div className="bg-surface rounded-xl border border-edge p-4 text-center">
          <p className="text-xs text-secondary/80 mb-1">운영 프로그램</p>
          <p className="text-2xl font-bold text-[#A78BFA]">{totalPrograms}</p>
          <p className="text-xs text-secondary/80 mt-0.5">개 프로그램</p>
        </div>
      </div>

      {/* 바 차트 */}
      {chartData.length > 0 && (
        <div className="bg-surface rounded-xl border border-edge p-6">
          <h2 className="text-sm font-semibold text-secondary uppercase mb-4">
            {selectedYear}년 국가별 지원 기업 수
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243049" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v}개 기업`, "기업 수"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #243049", background: "#1C2740", color: "#F1F5F9", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 국가별 기업 테이블 */}
      <div className="bg-surface rounded-xl border border-edge overflow-hidden">
        <div className="px-6 py-4 border-b border-edge">
          <h2 className="text-sm font-semibold text-secondary uppercase">
            {selectedYear}년 국가별 기업 목록
          </h2>
        </div>
        <div className="divide-y divide-edge/60">
          {regionGroups.map((g) => (
            <div key={g.region}>
              <button
                onClick={() => setExpandedRegion(expandedRegion === g.region ? null : g.region)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent min-w-fit">
                    {g.region}
                  </span>
                  <span className="text-xs text-secondary/80 text-left truncate max-w-sm">
                    {g.programs.join(" · ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-primary">{g.companies.length}개</span>
                  <span className="text-secondary/80 text-xs">{expandedRegion === g.region ? "▲" : "▼"}</span>
                </div>
              </button>

              {expandedRegion === g.region && (
                <div className="px-6 pb-3 bg-elevated">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                    {g.companies.map((c) => (
                      <Link
                        key={c.id}
                        href={`/companies/${encodeURIComponent(c.id)}`}
                        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-base/40 border border-edge hover:border-accent/40 hover:bg-elevated/60 transition-colors"
                      >
                        <span className="text-sm font-medium text-accent truncate">{c.name}</span>
                        <span className="text-xs text-secondary/80 truncate">{c.industry || c.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-6 py-2 bg-elevated border-t border-edge text-xs text-secondary/80 text-right">
          {selectedYear}년 총 {totalCompanies}개 기업 · {totalRegions}개국
        </div>
      </div>
    </div>
  );
}
