import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="bg-surface rounded-2xl border border-edge p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-1">
            SBA <span className="text-accent">Global</span>
          </h1>
          <p className="text-sm text-secondary">글로벌 진출 스타트업 관리 대시보드</p>
        </div>
        <div className="w-full border-t border-edge" />
        <p className="text-sm text-secondary">팀원 Google 계정으로 로그인하세요</p>
        <LoginButton />
      </div>
    </div>
  );
}
