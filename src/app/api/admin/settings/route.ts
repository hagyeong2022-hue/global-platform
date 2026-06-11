import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSetting, setSetting, maskSecret, SettingKey } from "@/lib/settings";

const SECRET_KEYS: SettingKey[] = ["dart_api_key", "innoforest_api_key"];
const PLAIN_KEYS: SettingKey[] = ["innoforest_api_base", "innoforest_enabled"];
const ALL_KEYS = [...SECRET_KEYS, ...PLAIN_KEYS];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

// GET: 현재 설정 상태 (시크릿은 마스킹). 관리자만.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "관리자 권한 필요" }, { status: 403 });
  }
  const out: Record<string, string | null> = {};
  for (const k of SECRET_KEYS) out[k] = maskSecret(await getSetting(k)); // 마스킹된 상태만
  for (const k of PLAIN_KEYS) out[k] = await getSetting(k);
  return NextResponse.json({ ok: true, settings: out });
}

// POST: 설정 저장 { key, value }. 관리자만. 시크릿 원문은 저장만 하고 반환 안 함.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자 권한 필요" }, { status: 403 });
  }
  let body: { key?: string; value?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  const key = body.key as SettingKey;
  if (!ALL_KEYS.includes(key)) {
    return NextResponse.json({ ok: false, error: "허용되지 않은 설정 키" }, { status: 400 });
  }
  try {
    await setSetting(key, String(body.value ?? ""), session.user?.email ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
