import { Suspense } from "react";
import { getCompanies } from "@/lib/googleSheets";
import { getLogoMap } from "@/lib/logos";
import StartupExplorer from "@/components/StartupExplorer";

export const revalidate = 60;

export default async function StartupsPage() {
  const [companies, logoMap] = await Promise.all([getCompanies().catch(() => []), getLogoMap().catch((): Record<string, string> => ({}))]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">스타트업 탐색</h1>
        <p className="text-sm text-secondary mt-1">
          지원 년도·분야·국가·프로그램·투자단계로 기업을 찾아보세요
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-secondary">불러오는 중…</div>}>
        <StartupExplorer companies={companies} logoMap={logoMap} />
      </Suspense>
    </div>
  );
}
