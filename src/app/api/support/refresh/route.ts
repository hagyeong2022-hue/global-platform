import { NextRequest, NextResponse } from "next/server";
import { fetchKstartupAnnouncements } from "@/lib/kstartup";
import { getSupabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Cron 보호
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.KSTARTUP_API_KEY) {
    return NextResponse.json({ ok: false, message: "KSTARTUP_API_KEY 미설정" });
  }

  try {
    // K-Startup은 page 1이 최신순. 최신 2000건을 받아 마감 전 공고만 추림.
    const all = (
      await Promise.all([1, 2].map((p) => fetchKstartupAnnouncements(p, 1000)))
    ).flat();

    if (all.length === 0) {
      return NextResponse.json({ ok: true, upserted: 0, message: "응답 데이터 없음" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const open = all.filter((a) => !a.apply_end || a.apply_end >= today);

    if (open.length === 0) {
      return NextResponse.json({ ok: true, upserted: 0, message: "마감 전 공고 없음" });
    }

    const supabase = getSupabaseAdmin();

    // upsert (공고번호 기준 중복 방지)
    const rows = open.map((a) => ({ ...a, fetched_at: new Date().toISOString() }));
    const { error } = await supabase
      .from("support_announcements")
      .upsert(rows, { onConflict: "id" });

    if (error) throw error;

    // 90일 이상 지난 마감 공고 정리
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    await supabase
      .from("support_announcements")
      .delete()
      .lt("apply_end", cutoff.toISOString().slice(0, 10));

    return NextResponse.json({ ok: true, upserted: rows.length });
  } catch (e) {
    console.error("support/refresh error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
