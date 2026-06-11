import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanies } from "@/lib/googleSheets";
import { collectNews } from "@/lib/newsCache";

export const maxDuration = 60;

// 뉴스 일괄 수집 — Cron(CRON_SECRET) 또는 관리자. 최근 2개 년도 기업 대상.
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
    const years = Array.from(new Set(companies.map((c) => c.year).filter(Boolean)))
      .sort((a, b) => Number(b) - Number(a))
      .slice(0, 2);
    const targets = companies.filter((c) => years.includes(c.year));
    const r = await collectNews(targets);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
