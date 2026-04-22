import KpiCard from "@/components/KpiCard";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      {/* KPI 카드 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">주요 현황</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="올해 진출 지원 국가"
            value="—"
            sub="누적 —개국"
            color="blue"
          />
          <KpiCard
            title="관리 기업 수"
            value="—"
            color="green"
          />
          <KpiCard
            title="당년도 매출액 합산"
            value="—"
            sub="NICE / DART 연동 예정"
            color="purple"
          />
          <KpiCard
            title="이달의 뉴스"
            value="—"
            sub="건"
            color="orange"
          />
        </div>
      </section>

      {/* 오늘의 뉴스 피드 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">오늘의 뉴스</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">
          뉴스 피드 연동 예정 (5단계)
        </div>
      </section>

      {/* 기업 목록 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">기업 목록</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">기업명</th>
                <th className="px-4 py-3 text-left">대표자</th>
                <th className="px-4 py-3 text-left">업종</th>
                <th className="px-4 py-3 text-left">아이템</th>
                <th className="px-4 py-3 text-left">성장단계</th>
                <th className="px-4 py-3 text-left">진출 국가</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  구글 시트 연동 예정 (2단계)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
