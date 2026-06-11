import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminUsersClient from "@/components/AdminUsersClient";

export const revalidate = 0;
function isE2E() {
  return process.env.E2E_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user?.role === "admin" || isE2E())) redirect("/");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">관리자 — 계정 관리</h1>
        <p className="text-sm text-secondary mt-1">
          로그인을 허용할 팀원 계정을 추가·관리합니다. 역할이 <b>관리자</b>면 편집·설정·로고·계정관리 권한을 갖습니다.
        </p>
      </div>
      <AdminUsersClient myEmail={session?.user?.email ?? ""} />
    </div>
  );
}
