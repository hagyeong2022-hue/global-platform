import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
      <div>
        <h1 className="text-xl font-semibold text-primary">관리자 — 데이터 편집</h1>
        <p className="text-sm text-secondary mt-1">
          성장지표(매출·투자유치·고용·투자단계·최근투자일)를 수정하면 구글 시트에 즉시 반영됩니다.
          기업명·사업자번호 등 식별정보는 시트에서만 수정하세요.
        </p>
      </div>
      <AdminClient companies={companies} />
    </div>
  );
}
