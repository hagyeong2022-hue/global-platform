import { Suspense } from "react";
import { getCompanies } from "@/lib/googleSheets";
import ProgramsClient from "@/components/ProgramsClient";

export const revalidate = 60;

export default async function ProgramsPage() {
  const companies = await getCompanies().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">글로벌 프로그램 현황</h1>
        <p className="text-sm text-secondary mt-1">연도별 진출 국가 및 참여 기업 현황</p>
      </div>
      <Suspense fallback={<div className="text-sm text-secondary">불러오는 중…</div>}>
        <ProgramsClient companies={companies} />
      </Suspense>
    </div>
  );
}
