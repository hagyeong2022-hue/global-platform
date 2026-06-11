import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCompanies } from "@/lib/googleSheets";
import StageBadge from "@/components/ui/StageBadge";

export const revalidate = 0;

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("bookmarks")
    .select("company_name")
    .eq("user_email", session.user.email);

  const bookmarkedNames = new Set((data ?? []).map((r) => r.company_name));

  const companies = await getCompanies().catch(() => []);
  const bookmarked = companies.filter((c) => bookmarkedNames.has(c.name));

  // 같은 기업명 중복 제거 (연도별 행)
  const unique = bookmarked.filter(
    (c, i, arr) => arr.findIndex((x) => x.name === c.name) === i
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">관심기업</h1>
          <p className="text-sm text-secondary mt-1">
            ★ 표시한 기업 {unique.length}개
          </p>
        </div>
        <Link
          href="/startups"
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          전체 스타트업 보기 →
        </Link>
      </div>

      {unique.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-12 text-center">
          <p className="text-4xl mb-4">☆</p>
          <p className="text-primary font-medium mb-1">관심기업이 없습니다</p>
          <p className="text-sm text-secondary mb-6">
            기업 상세 페이지에서 ★ 버튼을 눌러 관심기업을 추가해 보세요.
          </p>
          <Link
            href="/startups"
            className="inline-block px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            스타트업 목록으로
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {unique.map((c) => (
            <Link
              key={c.id}
              href={`/companies/${encodeURIComponent(c.id)}`}
              className="group rounded-xl border border-edge bg-surface p-5 flex flex-col gap-3 transition-all hover:bg-elevated hover:border-accent/40 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-primary text-base leading-snug">
                  {c.name}
                </span>
                <span className="text-[#D97706] text-lg shrink-0">★</span>
              </div>

              {c.investmentStage && (
                <div>
                  <StageBadge stage={c.investmentStage} />
                </div>
              )}

              <div className="flex flex-col gap-1 mt-auto">
                {c.region && (
                  <p className="text-xs text-secondary">
                    🌏 {c.region}
                  </p>
                )}
                {c.year && (
                  <p className="text-xs text-secondary">
                    📅 {c.year}년 선정
                  </p>
                )}
                {c.lastInvestmentDate && (
                  <p className="text-xs text-secondary/70 tnum">
                    최근 투자: {c.lastInvestmentDate}
                  </p>
                )}
              </div>

              <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity text-right">
                상세보기 →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
