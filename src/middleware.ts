import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // keepalive는 Vercel Cron이 비로그인으로 호출하므로 인증 제외
  matcher: ["/((?!login|api/auth|api/keepalive|_next/static|_next/image|favicon.ico).*)"],
};
