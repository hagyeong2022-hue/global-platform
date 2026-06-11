"use client";

import { useState } from "react";

type IrFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  viewLink: string;
  downloadLink: string;
};

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("presentation")) return "📊";
  return "📎";
}

function fileTypeLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "application/vnd.google-apps.presentation") return "Google Slides";
  if (mimeType === "application/vnd.ms-powerpoint") return "PPT";
  if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "PPTX";
  return "파일";
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "";
  }
}

export default function IrPanel({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<IrFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (files !== null) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ir?company=${encodeURIComponent(companyName)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
      setFiles(data.files ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-end">
        <button
          onClick={handleToggle}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          IR 자료 보기
          <span className="text-xs opacity-75">{open ? "▲" : "▼"}</span>
        </button>
      </div>

      {open && (
        <div className="w-full rounded-lg border border-edge bg-elevated p-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              구글 드라이브에서 불러오는 중…
            </div>
          )}

          {!loading && error && (
            <div className="text-sm text-negative">오류: {error}</div>
          )}

          {!loading && !error && files && files.length === 0 && (
            <div className="text-sm text-secondary/80">등록된 IR 자료가 없습니다.</div>
          )}

          {!loading && !error && files && files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-base/40 border border-edge"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{fileIcon(f.mimeType)}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-primary truncate" title={f.name}>
                        {f.name}
                      </span>
                      <span className="text-xs text-secondary/80">
                        {fileTypeLabel(f.mimeType)}
                        {f.modifiedTime && ` · ${formatDate(f.modifiedTime)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={f.viewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
                    >
                      미리보기
                    </a>
                    <a
                      href={f.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-md border border-edge text-primary hover:bg-elevated"
                    >
                      다운로드
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
