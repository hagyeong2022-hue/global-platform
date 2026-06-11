"use client";

import { useState } from "react";

type Initial = {
  dart_api_key: string | null;
  innoforest_api_key: string | null;
  innoforest_api_base: string;
  innoforest_enabled: boolean;
};

function SecretField({
  label,
  settingKey,
  masked,
  hint,
}: {
  label: string;
  settingKey: string;
  masked: string | null;
  hint?: string;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [current, setCurrent] = useState(masked);

  async function save() {
    if (!value.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "저장 실패");
      setStatus("saved");
      setCurrent(`••••${value.trim().slice(-4)}`);
      setValue("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      alert(e instanceof Error ? e.message : "저장 실패");
    }
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-primary">{label}</label>
        <span className="text-xs text-secondary">
          {current ? `설정됨 (${current})` : "미설정"}
        </span>
      </div>
      {hint && <p className="text-xs text-secondary/70">{hint}</p>}
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="새 키 입력 (저장 후 마스킹)"
          className="flex-1 rounded-lg border border-edge bg-base px-3 py-2 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={save}
          disabled={!value.trim() || status === "saving"}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            status === "saved"
              ? "bg-positive text-white"
              : value.trim()
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-elevated text-secondary/50 cursor-not-allowed"
          }`}
        >
          {status === "saving" ? "저장 중…" : status === "saved" ? "✓ 저장됨" : "저장"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsClient({ initial }: { initial: Initial }) {
  const [enabled, setEnabled] = useState(initial.innoforest_enabled);
  const [base, setBase] = useState(initial.innoforest_api_base);
  const [saving, setSaving] = useState(false);

  async function setKV(key: string, value: string) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function toggleInno() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      await setKV("innoforest_enabled", next ? "true" : "false");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* DART */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-secondary uppercase">DART (기본 재무 소스)</h2>
        <SecretField
          label="DART API 키"
          settingKey="dart_api_key"
          masked={initial.dart_api_key}
          hint="opendart.fss.or.kr → 무료·즉시 발급. 입력하면 상장·외부감사 기업 매출이 자동 수집됩니다."
        />
      </section>

      {/* 혁신의숲 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-secondary uppercase">혁신의숲 (확장 데이터)</h2>
        <SecretField
          label="혁신의숲 API 키"
          settingKey="innoforest_api_key"
          masked={initial.innoforest_api_key}
          hint="support@innoforest.co.kr 에서 발급. 입력 후 아래 토글을 켜면 매출·고용·투자이력 등이 연동됩니다."
        />
        <div className="rounded-xl border border-edge bg-surface p-5 flex flex-col gap-2">
          <label className="text-sm font-medium text-primary">혁신의숲 API Base (선택)</label>
          <div className="flex gap-2">
            <input
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="https://api.innoforest.co.kr (문서 확인 후 입력)"
              className="flex-1 rounded-lg border border-edge bg-base px-3 py-2 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={() => setKV("innoforest_api_base", base.trim())}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover"
            >
              저장
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-edge bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">혁신의숲 연동 활성화</p>
            <p className="text-xs text-secondary/70 mt-0.5">키 입력 + 활성화 시에만 외부 호출이 일어납니다.</p>
          </div>
          <button
            onClick={toggleInno}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-positive" : "bg-edge"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
