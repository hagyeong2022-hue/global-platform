import { getCompanies } from "@/lib/googleSheets";
import EmailClient from "@/components/EmailClient";

export const revalidate = 60;

export default async function EmailPage() {
  const companies = await getCompanies().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">이메일 보내기</h1>
        <p className="text-sm text-gray-400 mt-1">
          연도를 선택하고 전체 주소를 복사해 메일 클라이언트에 붙여넣으세요.
        </p>
      </div>
      <EmailClient companies={companies} />
    </div>
  );
}
