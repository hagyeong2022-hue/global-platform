"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Company } from "@/lib/googleSheets";
import StageBadge from "@/components/ui/StageBadge";
import CompanyAvatar from "@/components/ui/CompanyAvatar";
import { countryFlag } from "@/lib/countryFlag";
import { formatKRW, parseWon } from "@/lib/format";

// ─── 필터 축 정의 ───────────────────────────────────────────
type FilterKey = "year" | "industry" | "country" | "program" | "stage";

const FILTER_DEFS: { key: FilterKey; label: string; getValue: (c: Company) => string }[] = [
  { key: "year", label: "지원 년도", getValue: (c) => c.year },
  { key: "industry", label: "분야", getValue: (c) => c.industry },
  { key: "country", label: "진출 국가", getValue: (c) => c.region },
  { key: "program", label: "프로그램", getValue: (c) => c.programName },
  { key: "stage", label: "투자단계", getValue: (c) => c.investmentStage },
];

// ─── 테이블 컬럼 정의 ────────────────────────────────────────
type ColumnKey =
  | "name" | "industry" | "description" | "ceoName"
  | "stage" | "country" | "program" | "establishedDate"
  | "revenue" | "employment";

const COLUMN_DEFS: { key: ColumnKey; label: string; sortValue: (c: Company) => string }[] = [
  { key: "name", label: "기업명", sortValue: (c) => c.name },
  { key: "industry", label: "분야", sortValue: (c) => c.industry },
  { key: "description", label: "아이템", sortValue: (c) => c.description },
  { key: "ceoName", label: "대표자", sortValue: (c) => c.ceoName },
  { key: "stage", label: "투자단계", sortValue: (c) => c.investmentStage },
  { key: "country", label: "진출 국가", sortValue: (c) => c.region },
  { key: "program", label: "프로그램", sortValue: (c) => c.programName },
  { key: "establishedDate", label: "설립일", sortValue: (c) => c.establishedDate },
  { key: "revenue", label: "매출", sortValue: (c) => String(parseWon(c.revenue)).padStart(15, "0") },
  { key: "employment", label: "고용(명)", sortValue: (c) => c.employment.padStart(6, "0") },
];

const DEFAULT_VISIBLE: ColumnKey[] = ["name", "industry", "description", "ceoName", "stage", "country", "program"];

// ─── 멀티셀렉트 드롭다운 ─────────────────────────────────────
function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const active = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
          active
            ? "bg-accent-soft text-accent border-accent/40"
            : "border-edge text-secondary hover:text-primary hover:bg-elevated"
        }`}
      >
        {label}
        {active && <span className="ml-1 text-xs">({selected.length})</span>}
        <span className="ml-1 text-xs opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-60 max-h-72 overflow-y-auto rounded-xl border border-edge bg-elevated shadow-xl p-2">
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-secondary">옵션 없음</p>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="accent-[#3B82F6]"
              />
              <span className="flex-1 truncate text-primary">{opt.value}</span>
              <span className="text-xs text-secondary tnum">({opt.count})</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CSV 다운로드 ───────────────────────────────────────────
function downloadCsv(companies: Company[], visibleCols: ColumnKey[]) {
  const cols = COLUMN_DEFS.filter((c) => visibleCols.includes(c.key));
  const header = cols.map((c) => c.label).join(",");
  const rows = companies.map((c) =>
    cols
      .map((col) => {
        const v = col.sortValue(c) ?? "";
        return `"${String(v).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  // BOM으로 엑셀 한글 깨짐 방지
  const blob = new Blob(["﻿" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `startups_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────
export default function StartupExplorer({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL → 필터 상태 (단일 소스: URL)
  const filters = useMemo(() => {
    const result: Record<FilterKey, string[]> = { year: [], industry: [], country: [], program: [], stage: [] };
    for (const def of FILTER_DEFS) {
      const raw = searchParams.get(def.key);
      if (raw) result[def.key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return result;
  }, [searchParams]);

  const query = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(query);
  useEffect(() => setSearchInput(query), [query]);

  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const [sort, setSort] = useState<{ key: ColumnKey; dir: 1 | -1 } | null>(null);

  // URL 업데이트
  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      router.replace(`/startups${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  function setFilter(key: FilterKey, values: string[]) {
    updateParams((p) => {
      if (values.length === 0) p.delete(key);
      else p.set(key, values.join(","));
    });
  }

  function setQuery(q: string) {
    updateParams((p) => {
      if (!q.trim()) p.delete("q");
      else p.set("q", q.trim());
    });
  }

  function clearAll() {
    router.replace("/startups", { scroll: false });
  }

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== query) setQuery(searchInput);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ─── 필터링 ───
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      for (const def of FILTER_DEFS) {
        const sel = filters[def.key];
        if (sel.length > 0 && !sel.includes(def.getValue(c))) return false;
      }
      if (q) {
        const haystack = `${c.name} ${c.ceoName} ${c.description} ${c.industry}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [companies, filters, query]);

  // 정렬
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const def = COLUMN_DEFS.find((c) => c.key === sort.key)!;
    return [...filtered].sort((a, b) => def.sortValue(a).localeCompare(def.sortValue(b), "ko") * sort.dir);
  }, [filtered, sort]);

  // 필터 옵션 (각 축: 다른 축 필터 적용 결과 기준 건수)
  const filterOptions = useMemo(() => {
    const result: Record<FilterKey, { value: string; count: number }[]> = {
      year: [], industry: [], country: [], program: [], stage: [],
    };
    for (const def of FILTER_DEFS) {
      const counts = new Map<string, number>();
      // 자기 축 제외한 나머지 필터만 적용한 모수에서 집계
      const base = companies.filter((c) => {
        for (const other of FILTER_DEFS) {
          if (other.key === def.key) continue;
          const sel = filters[other.key];
          if (sel.length > 0 && !sel.includes(other.getValue(c))) return false;
        }
        return true;
      });
      for (const c of base) {
        const v = def.getValue(c).trim();
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      result[def.key] = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) =>
          def.key === "year" ? b.value.localeCompare(a.value) : b.count - a.count
        );
    }
    return result;
  }, [companies, filters]);

  // 선택된 필터 칩
  const activeChips = FILTER_DEFS.flatMap((def) =>
    filters[def.key].map((v) => ({ key: def.key, label: def.label, value: v }))
  );

  // 미니 KPI
  const regionCount = new Set(filtered.map((c) => c.region).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-4">
      {/* 미니 KPI */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="rounded-xl border border-edge bg-surface px-5 py-4">
          <p className="text-xs text-secondary">관리 기업 수</p>
          <p className="text-2xl font-bold text-accent tnum mt-1">{filtered.length.toLocaleString()}<span className="text-sm font-medium text-secondary ml-1">개사</span></p>
        </div>
        <div className="rounded-xl border border-edge bg-surface px-5 py-4">
          <p className="text-xs text-secondary">진출 국가 수</p>
          <p className="text-2xl font-bold text-positive tnum mt-1">{regionCount}<span className="text-sm font-medium text-secondary ml-1">개국</span></p>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">🔍</span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="기업명, 대표자, 아이템, 분야 검색…"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-edge bg-surface text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-2 items-center">
        {FILTER_DEFS.map((def) => (
          <MultiSelect
            key={def.key}
            label={def.label}
            options={filterOptions[def.key]}
            selected={filters[def.key]}
            onChange={(values) => setFilter(def.key, values)}
          />
        ))}
      </div>

      {/* 선택된 필터 칩 */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {activeChips.map((chip) => (
            <span
              key={`${chip.key}-${chip.value}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-soft text-accent text-xs font-medium"
            >
              <span className="opacity-60">{chip.label}:</span> {chip.value}
              <button
                onClick={() => setFilter(chip.key, filters[chip.key].filter((v) => v !== chip.value))}
                className="hover:opacity-70"
                aria-label="필터 제거"
              >
                ✕
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-secondary hover:text-primary underline underline-offset-2">
            전체 해제
          </button>
        </div>
      )}

      {/* 결과 헤더: 건수 + 열 설정 + CSV */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-secondary">
          검색 결과 <span className="text-primary font-semibold tnum">{sorted.length.toLocaleString()}</span>개사
        </p>
        <div className="flex gap-2">
          <div ref={colMenuRef} className="relative">
            <button
              onClick={() => setColMenuOpen(!colMenuOpen)}
              className="px-3 py-1.5 rounded-lg border border-edge text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
            >
              ⚙ 열 설정
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-edge bg-elevated shadow-xl p-2">
                {COLUMN_DEFS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface cursor-pointer text-sm text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(col.key)}
                      disabled={col.key === "name"}
                      onChange={() =>
                        setVisibleCols((prev) =>
                          prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key]
                        )
                      }
                      className="accent-[#3B82F6]"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => downloadCsv(sorted, visibleCols)}
            disabled={sorted.length === 0}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↓ CSV 다운로드
          </button>
        </div>
      </div>

      {/* 테이블 */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-10 text-center">
          <p className="text-sm text-secondary mb-3">조건에 맞는 기업이 없습니다</p>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-edge bg-surface overflow-hidden">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-elevated text-secondary text-xs sticky top-0 z-10">
                <tr>
                  {COLUMN_DEFS.filter((c) => visibleCols.includes(c.key)).map((col) => (
                    <th
                      key={col.key}
                      onClick={() =>
                        setSort((prev) =>
                          prev?.key === col.key
                            ? prev.dir === 1 ? { key: col.key, dir: -1 } : null
                            : { key: col.key, dir: 1 }
                        )
                      }
                      className="px-4 py-3 text-left whitespace-nowrap cursor-pointer select-none hover:text-primary"
                    >
                      {col.label}
                      {sort?.key === col.key && <span className="ml-1 text-accent">{sort.dir === 1 ? "↑" : "↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/60">
                {sorted.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/companies/${encodeURIComponent(c.id)}`)}
                    className="hover:bg-elevated/70 transition-colors cursor-pointer"
                  >
                    {visibleCols.includes("name") && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-2.5">
                          <CompanyAvatar name={c.name} size="sm" />
                          <Link
                            href={`/companies/${encodeURIComponent(c.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-primary hover:text-accent"
                          >
                            {c.name}
                          </Link>
                        </span>
                      </td>
                    )}
                    {visibleCols.includes("industry") && (
                      <td className="px-4 py-3 whitespace-nowrap text-secondary">{c.industry || "—"}</td>
                    )}
                    {visibleCols.includes("description") && (
                      <td className="px-4 py-3 text-secondary max-w-md truncate" title={c.description}>
                        {c.description || "—"}
                      </td>
                    )}
                    {visibleCols.includes("ceoName") && (
                      <td className="px-4 py-3 whitespace-nowrap text-secondary">{c.ceoName || "—"}</td>
                    )}
                    {visibleCols.includes("stage") && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StageBadge stage={c.investmentStage} />
                      </td>
                    )}
                    {visibleCols.includes("country") && (
                      <td className="px-4 py-3 whitespace-nowrap text-primary">
                        {c.region ? `${countryFlag(c.region)} ${c.region}` : "—"}
                      </td>
                    )}
                    {visibleCols.includes("program") && (
                      <td className="px-4 py-3 text-secondary max-w-xs truncate" title={c.programName}>
                        {c.programName || "—"}
                      </td>
                    )}
                    {visibleCols.includes("establishedDate") && (
                      <td className="px-4 py-3 whitespace-nowrap text-secondary tnum">{c.establishedDate || "—"}</td>
                    )}
                    {visibleCols.includes("revenue") && (
                      <td className="px-4 py-3 whitespace-nowrap text-secondary tnum text-right">{formatKRW(c.revenue) ? `${formatKRW(c.revenue)}원` : "—"}</td>
                    )}
                    {visibleCols.includes("employment") && (
                      <td className="px-4 py-3 whitespace-nowrap text-secondary tnum text-right">{c.employment || "—"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
