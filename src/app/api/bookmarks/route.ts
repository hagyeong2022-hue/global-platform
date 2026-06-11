import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

async function email() {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function GET() {
  const userEmail = await email();
  if (!userEmail) return NextResponse.json({ ok: false, error: "로그인 필요" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("bookmarks").select("company_name").eq("user_email", userEmail);
  return NextResponse.json({ ok: true, companies: (data ?? []).map((r) => r.company_name) });
}

export async function POST(req: NextRequest) {
  const userEmail = await email();
  if (!userEmail) return NextResponse.json({ ok: false, error: "로그인 필요" }, { status: 401 });
  let body: { company?: string; on?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 }); }
  const company = String(body.company ?? "").trim();
  if (!company) return NextResponse.json({ ok: false, error: "company 필요" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (body.on) {
    await supabase.from("bookmarks").upsert({ user_email: userEmail, company_name: company }, { onConflict: "user_email,company_name" });
  } else {
    await supabase.from("bookmarks").delete().eq("user_email", userEmail).eq("company_name", company);
  }
  return NextResponse.json({ ok: true });
}
