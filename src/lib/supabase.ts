import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트 (Secret key 사용) — 클라이언트 컴포넌트에서 임포트 금지
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;
  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}
