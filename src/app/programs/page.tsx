export default function ProgramsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-800">글로벌 프로그램 현황</h1>

      {/* 연도별 탭 자리 */}
      <div className="flex gap-2">
        {[2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
          <button
            key={year}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {year}
          </button>
        ))}
      </div>

      {/* 테이블 자리 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">
        연도별 참여 기업 × 국가 테이블 연동 예정 (7단계)
      </div>

      {/* 차트 자리 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 h-48 flex items-center justify-center">
        연도별 투자유치 바 차트 예정 (7단계)
      </div>
    </div>
  );
}
