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

// 역할 조회 캐시 (이메일 → role), 로그인 시 1회 + 5분 TTL
const roleCache = new Map<string, { role: string; at: number }>();
const ROLE_TTL = 5 * 60 * 1000;

async function getUserRole(email: string): Promise<string> {
  const key = email.toLowerCase();
  const cached = roleCache.get(key);
  if (cached && Date.now() - cached.at < ROLE_TTL) return cached.role;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("allowed_users")
      .select("role")
      .eq("email", key)
      .maybeSingle();
    const role = data?.role ?? "member";
    roleCache.set(key, { role, at: Date.now() });
    return role;
  } catch {
    return "member";
  }
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
      const allowed = getAllowedEmails();
      if (allowed.length === 0) {
        console.error("ALLOWED_EMAILS 환경변수가 비어 있음 — 모든 로그인 거부");
        return false;
      }
      return allowed.includes((user.email ?? "").toLowerCase());
    },
    async jwt({ token, user }) {
      // 로그인 시점에만 역할 조회 → 토큰에 저장
      if (user?.email) token.role = await getUserRole(user.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = (token.role as string) ?? "member";
      return session;
    },
  },
};
