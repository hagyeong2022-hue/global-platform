import { getCompanies } from "@/lib/googleSheets";
import ProgramsClient from "@/components/ProgramsClient";

export const revalidate = 60;

export default async function ProgramsPage() {
  const companies = await getCompanies().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">글로벌 프로그램 현황</h1>
        <p className="text-sm text-gray-400 mt-1">연도별 진출 국가 및 참여 기업 현황</p>
      </div>
      <ProgramsClient companies={companies} />
    </div>
  );
}
