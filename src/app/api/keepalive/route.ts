import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Supabase 무료 플랜 7일 휴면 방지 — Vercel Cron이 매일 호출 (vercel.json)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("keepalive").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
