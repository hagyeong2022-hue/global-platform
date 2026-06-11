import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// E2E 테스트 전용 인증 우회 — 로컬(dev)에서 E2E_BYPASS_AUTH=true 일 때만.
// 프로덕션(Vercel)은 NODE_ENV=production 이라 절대 우회되지 않음.
const e2eBypass =
  process.env.E2E_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";

export default e2eBypass
  ? () => NextResponse.next()
  : withAuth({
      pages: {
        signIn: "/login",
      },
    });

export const config = {
  // keepalive·backup은 Vercel Cron이 비로그인으로 호출하므로 인증 제외
  matcher: ["/((?!login|api/auth|api/keepalive|api/backup|api/revenue/refresh|api/news/collect|_next/static|_next/image|favicon.ico).*)"],
};
