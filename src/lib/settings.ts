import { getSupabaseAdmin } from "@/lib/supabase";

// 앱 설정/시크릿을 Supabase app_settings 에 서버 전용으로 보관.
// 키 원문은 절대 클라이언트로 보내지 않는다 (마스킹 상태만 노출).

export type SettingKey =
  | "dart_api_key"
  | "innoforest_api_key"
  | "innoforest_api_base"
  | "innoforest_enabled";

// 모듈 캐시 (60초) — 매 요청 DB 왕복 방지
const cache = new Map<string, { value: string | null; at: number }>();
const TTL = 60 * 1000;

export async function getSetting(key: SettingKey): Promise<string | null> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.value;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    const value = data?.value ?? null;
    cache.set(key, { value, at: Date.now() });
    return value;
  } catch {
    return null;
  }
}

export async function setSetting(key: SettingKey, value: string, updatedBy?: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy ?? null });
  if (error) throw new Error(error.message);
  cache.set(key, { value, at: Date.now() });
}

/** 시크릿을 마스킹해서 상태만 반환 (예: "••••AB12"). 미설정이면 null */
export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  const tail = value.slice(-4);
  return `••••${tail}`;
}
