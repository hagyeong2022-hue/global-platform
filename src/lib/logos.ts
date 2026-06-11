import { getSupabaseAdmin } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function publicLogoUrl(path: string): string {
  return `${BASE}/storage/v1/object/public/logos/${path}`;
}

/** 기업명 → 로고 public URL 맵 (서버에서 1회 조회해 화면에 전달) */
export async function getLogoMap(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("company_logos").select("company_name, storage_path");
    const map: Record<string, string> = {};
    for (const r of data ?? []) map[r.company_name] = publicLogoUrl(r.storage_path);
    return map;
  } catch {
    return {};
  }
}
