import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanies } from "@/lib/googleSheets";
import { getLogoMap } from "@/lib/logos";
import AdminLogosClient from "@/components/AdminLogosClient";

export const revalidate = 0;
function isE2E() {
  return process.env.E2E_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

export default async function AdminLogosPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user?.role === "admin" || isE2E())) redirect("/");
  const [companies, logoMap] = await Promise.all([getCompanies().catch(() => []), getLogoMap().catch((): Record<string, string> => ({}))]);
  const unique = companies.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);
  const list = unique.map((c) => ({ id: c.id, name: c.name, industry: c.industry }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">관리자 — 기업 로고</h1>
        <p className="text-sm text-secondary mt-1">로고를 업로드하면 목록·상세의 아바타가 로고로 바뀝니다. (PNG/JPG/WebP/SVG, 2MB 이하)</p>
      </div>
      <AdminLogosClient companies={list} initialLogos={logoMap} />
    </div>
  );
}
