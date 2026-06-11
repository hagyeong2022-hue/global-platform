import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanies } from "@/lib/googleSheets";
import { refreshRevenueCache } from "@/lib/revenueCache";

export const maxDuration = 60;

// DART 매출 캐시 갱신 — 관리자 또는 Cron(CRON_SECRET)만.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isCron = secret && auth === `Bearer ${secret}`;
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  if (!isCron && !isAdmin) {
    return NextResponse.json({ ok: false, error: "권한 필요" }, { status: 403 });
  }
  try {
    const companies = await getCompanies();
    const r = await refreshRevenueCache(companies);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
