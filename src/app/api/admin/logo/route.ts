import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { publicLogoUrl } from "@/lib/logos";

const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg",
};

function slug(name: string): string {
  return name.replace(/[^a-zA-Z0-9가-힣]/g, "_").slice(0, 40);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자 권한 필요" }, { status: 403 });
  }
  let body: { company?: string; dataUrl?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 }); }
  const company = String(body.company ?? "").trim();
  const dataUrl = String(body.dataUrl ?? "");
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!company || !m) return NextResponse.json({ ok: false, error: "company·이미지 필요" }, { status: 400 });
  const contentType = m[1];
  const ext = EXT[contentType];
  if (!ext) return NextResponse.json({ ok: false, error: "지원하지 않는 형식" }, { status: 400 });

  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > 2 * 1024 * 1024) return NextResponse.json({ ok: false, error: "2MB 이하만" }, { status: 400 });

  const path = `${slug(company)}-${Date.now()}.${ext}`;
  const supabase = getSupabaseAdmin();
  const up = await supabase.storage.from("logos").upload(path, buffer, { contentType, upsert: true });
  if (up.error) return NextResponse.json({ ok: false, error: up.error.message }, { status: 500 });

  await supabase.from("company_logos").upsert(
    { company_name: company, storage_path: path, updated_at: new Date().toISOString() },
    { onConflict: "company_name" }
  );
  return NextResponse.json({ ok: true, url: publicLogoUrl(path) });
}
