import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCompanies } from "@/lib/googleSheets";
import AdminClient from "@/components/AdminClient";

export const revalidate = 0; // 항상 최신 데이터

function isE2E() {
  return process.env.E2E_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin" || isE2E();
  if (!isAdmin) redirect("/");

  const companies = await getCompanies().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-primary">관리자 — 데이터 편집</h1>
          <p className="text-sm text-secondary mt-1">
            고용·투자단계·최근투자일을 수정하면 구글 시트에 즉시 반영됩니다. 매출은 DART, 투자는 혁신의숲에서 자동 수집됩니다.
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="shrink-0 px-4 py-2 rounded-lg border border-edge text-sm text-secondary hover:bg-elevated hover:text-primary transition-colors"
        >
          ⚙ 연동 설정
        </Link>
      </div>
      <AdminClient companies={companies} />
    </div>
  );
}
