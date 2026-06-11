import { NextRequest, NextResponse } from "next/server";
import { createCompaniesSnapshot } from "@/lib/backup";

// 시트 데이터 일일 백업 — Vercel Cron이 매일 호출 (vercel.json)
// CRON_SECRET이 설정돼 있으면 Authorization 헤더를 검증 (Vercel Cron이 자동 전송)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const { rowCount, takenAt } = await createCompaniesSnapshot();
    return NextResponse.json({ ok: true, rowCount, takenAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
