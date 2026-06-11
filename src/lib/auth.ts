import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 허용 이메일은 환경변수(쉼표 구분)로만 관리 — 코드에 개인정보를 두지 않는다 (공개 레포)
function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
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
  },
};
