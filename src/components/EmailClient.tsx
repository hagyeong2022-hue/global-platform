"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Company } from "@/lib/googleSheets";

type EmailEntry = {
  companyName: string;
  role: string;
  name: string;
  email: string;
};

// ─── 멀티셀렉트 드롭다운 (프로그램·산업분야 필터) ───────────────
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
        <div className="absolute z-30 mt-2 w-64 max-h-72 overflow-y-auto rounded-xl border border-edge bg-elevated shadow-xl p-2">
          {options.length === 0 && <p className="px-2 py-1.5 text-xs text-secondary">옵션 없음</p>}
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

export default function EmailClient({ companies }: { companies: Company[] }) {
  const years = useMemo(() => {
    const set = new Set(companies.map((c) => c.year).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [companies]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0] ?? "");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "ceo" | "manager">("all");
  const [programs, setPrograms] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  // 연도 바뀌면 하위 필터 초기화 (연도마다 프로그램·분야가 달라서)
  function changeYear(year: string) {
    setSelectedYear(year);
    setPrograms([]);
    setIndustries([]);
  }

  const yearData = useMemo(
    () => companies.filter((c) => c.year === selectedYear),
    [companies, selectedYear]
  );

  // 프로그램·산업분야 옵션 (선택 연도 기준, 건수 표시)
  const programOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of yearData) {
      const v = c.programName.trim();
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
  }, [yearData]);

  const industryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of yearData) {
      const v = c.industry.trim();
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
  }, [yearData]);

  // 프로그램·분야 필터 적용된 기업
  const filteredCompanies = useMemo(
    () =>
      yearData.filter((c) => {
        if (programs.length > 0 && !programs.includes(c.programName.trim())) return false;
        if (industries.length > 0 && !industries.includes(c.industry.trim())) return false;
        return true;
      }),
    [yearData, programs, industries]
  );

  const entries = useMemo<EmailEntry[]>(() => {
    const seen = new Set<string>();
    const result: EmailEntry[] = [];
    for (const c of filteredCompanies) {
      if (c.ceoEmail?.trim() && (filter === "all" || filter === "ceo")) {
        const key = c.ceoEmail.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ companyName: c.name, role: "대표자", name: c.ceoName, email: c.ceoEmail.trim() });
        }
      }
      if (c.managerEmail?.trim() && (filter === "all" || filter === "manager")) {
        const key = c.managerEmail.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ companyName: c.name, role: "담당자", name: c.managerName, email: c.managerEmail.trim() });
        }
      }
    }
    return result;
  }, [filteredCompanies, filter]);

  const emailList = entries.map((e) => e.email).join(", ");

  async function handleCopy() {
    await navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // 메일 앱으로 열기 — 수신자는 BCC(상호 비공개)
  const mailtoHref = useMemo(() => {
    if (entries.length === 0) return "";
    const bcc = entries.map((e) => e.email).join(",");
    return `mailto:?bcc=${encodeURIComponent(bcc)}`;
  }, [entries]);

  // 선택된 필터 칩
  const activeChips = [
    ...programs.map((v) => ({ kind: "program" as const, value: v })),
    ...industries.map((v) => ({ kind: "industry" as const, value: v })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 연도 탭 */}
      <div className="flex flex-wrap gap-2">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => changeYear(year)}
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

      {/* 프로그램·산업분야 필터 */}
      <div className="flex flex-wrap gap-2 items-center">
        <MultiSelect label="참가 프로그램" options={programOptions} selected={programs} onChange={setPrograms} />
        <MultiSelect label="산업분야" options={industryOptions} selected={industries} onChange={setIndustries} />
        {activeChips.length > 0 && (
          <button
            onClick={() => { setPrograms([]); setIndustries([]); }}
            className="text-xs text-secondary hover:text-primary underline underline-offset-2"
          >
            필터 해제
          </button>
        )}
      </div>

      {/* 선택된 필터 칩 */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {activeChips.map((chip) => (
            <span
              key={`${chip.kind}-${chip.value}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-soft text-accent text-xs font-medium"
            >
              <span className="opacity-60">{chip.kind === "program" ? "프로그램" : "분야"}:</span> {chip.value}
              <button
                onClick={() =>
                  chip.kind === "program"
                    ? setPrograms((p) => p.filter((v) => v !== chip.value))
                    : setIndustries((p) => p.filter((v) => v !== chip.value))
                }
                className="hover:opacity-70"
                aria-label="필터 제거"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 수신자 역할 필터 + 보내기/복사 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(["all", "ceo", "manager"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                filter === f
                  ? "bg-accent text-white border-accent"
                  : "bg-base/40 text-secondary border-edge hover:bg-elevated"
              }`}
            >
              {f === "all" ? "전체" : f === "ceo" ? "대표자만" : "담당자만"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary/80 tnum">{entries.length}개 수신자</span>
          <button
            onClick={handleCopy}
            disabled={entries.length === 0}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              entries.length === 0
                ? "border-edge text-secondary/50 cursor-not-allowed"
                : copied
                ? "border-green-600 text-green-500"
                : "border-edge text-secondary hover:bg-elevated hover:text-primary"
            }`}
          >
            {copied ? "✓ 복사됨" : "주소 복사"}
          </button>
          <a
            href={mailtoHref || undefined}
            aria-disabled={entries.length === 0}
            onClick={(e) => { if (entries.length === 0) e.preventDefault(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              entries.length === 0
                ? "bg-elevated text-secondary/50 cursor-not-allowed pointer-events-none"
                : "bg-accent text-white hover:bg-accent-hover"
            }`}
          >
            ✉ 메일 보내기 ({entries.length})
          </a>
        </div>
      </div>

      {/* 수신자 미리보기 */}
      <div className="bg-surface rounded-xl border border-edge overflow-hidden">
        <div className="px-4 py-2.5 bg-elevated border-b border-edge text-xs text-secondary">
          {selectedYear}년 수신자 목록 — &lsquo;메일 보내기&rsquo;는 메일 앱을 열고 아래 주소를 BCC(상호 비공개)에 채웁니다
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-secondary/80">
            조건에 맞는 수신자 이메일이 없습니다.
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[500px] divide-y divide-edge/60">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-elevated">
                <div className="w-16 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.role === "대표자"
                      ? "bg-accent-soft text-accent"
                      : "bg-elevated text-secondary"
                  }`}>
                    {e.role}
                  </span>
                </div>
                <div className="w-28 shrink-0 text-sm text-primary truncate">{e.companyName}</div>
                <div className="w-20 shrink-0 text-sm text-secondary truncate">{e.name}</div>
                <div className="text-sm text-accent truncate">{e.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
