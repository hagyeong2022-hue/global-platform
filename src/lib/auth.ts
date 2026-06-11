import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdmin } from "@/lib/supabase";

// 허용 이메일은 환경변수(쉼표 구분)로 관리 — 코드에 개인정보를 두지 않는다 (공개 레포)
function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// 사용자 레코드 캐시 (이메일 → {allowed, role}), 5분 TTL
type UserRec = { allowed: boolean; role: string };
const userCache = new Map<string, { rec: UserRec; at: number }>();
const USER_TTL = 5 * 60 * 1000;

async function getUserRecord(email: string): Promise<UserRec> {
  const key = email.toLowerCase();
  const cached = userCache.get(key);
  if (cached && Date.now() - cached.at < USER_TTL) return cached.rec;
  let rec: UserRec = { allowed: false, role: "member" };
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("allowed_users")
      .select("role")
      .eq("email", key)
      .maybeSingle();
    if (data) rec = { allowed: true, role: data.role ?? "member" };
  } catch {
    // DB 장애 시 아래 env fallback
  }
  userCache.set(key, { rec, at: Date.now() });
  return rec;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 토큰 유효 상한 (실제 만료는 아래 세션 쿠키가 결정)
  },
  // 세션 쿠키(만료시각 없음) → 브라우저 종료·재부팅 시 삭제되어 재로그인 필요.
  // 켜져 있는 동안에는 계속 로그인 유지.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // maxAge·expires 미설정 = 세션 쿠키 (재부팅 시 만료)
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      const email = (user.email ?? "").toLowerCase();
      if (!email) return false;
      const rec = await getUserRecord(email);
      // allowed_users DB 우선, DB에 없으면 env ALLOWED_EMAILS fallback (이전 호환)
      return rec.allowed || getAllowedEmails().includes(email);
    },
    async jwt({ token, user }) {
      if (user?.email) token.role = (await getUserRecord(user.email)).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = (token.role as string) ?? "member";
      return session;
    },
  },
};
