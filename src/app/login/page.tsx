import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-6 w-full max-w-sm shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">Global Platform</h1>
          <p className="text-sm text-gray-400">글로벌 진출 기업 관리 대시보드</p>
        </div>
        <div className="w-full border-t border-gray-100" />
        <p className="text-sm text-gray-500">팀원 Google 계정으로 로그인하세요</p>
        <LoginButton />
      </div>
    </div>
  );
}
