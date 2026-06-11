import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ROLES = ["admin", "member"];

async function admin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin" ? session : null;
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ ok: false, error: "관리자 권한 필요" }, { status: 403 });
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("allowed_users")
    .select("email, name, role, created_at")
    .order("created_at", { ascending: true });
  return NextResponse.json({ ok: true, users: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await admin())) return NextResponse.json({ ok: false, error: "관리자 권한 필요" }, { status: 403 });
  let body: { email?: string; name?: string; role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = ROLES.includes(String(body.role)) ? String(body.role) : "member";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "이메일 형식 오류" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("allowed_users")
    .upsert({ email, name: body.name?.trim() || null, role }, { onConflict: "email" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await admin();
  if (!session) return NextResponse.json({ ok: false, error: "관리자 권한 필요" }, { status: 403 });
  let body: { email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email === (session.user?.email ?? "").toLowerCase()) {
    return NextResponse.json({ ok: false, error: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  // 마지막 관리자 보호
  const { data: admins } = await supabase.from("allowed_users").select("email").eq("role", "admin");
  if ((admins ?? []).length <= 1 && (admins ?? []).some((a) => a.email === email)) {
    return NextResponse.json({ ok: false, error: "마지막 관리자는 삭제할 수 없습니다." }, { status: 400 });
  }
  const { error } = await supabase.from("allowed_users").delete().eq("email", email);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
