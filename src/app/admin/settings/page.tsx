import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSetting, getEffectiveSetting, maskSecret } from "@/lib/settings";
import AdminSettingsClient from "@/components/AdminSettingsClient";

export const revalidate = 0;

function isE2E() {
  return process.env.E2E_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user?.role === "admin" || isE2E())) redirect("/");

  const initial = {
    dart_api_key: maskSecret((await getEffectiveSetting("dart_api_key")).value),
    innoforest_api_key: maskSecret((await getEffectiveSetting("innoforest_api_key")).value),
    innoforest_api_base: (await getSetting("innoforest_api_base")) ?? "",
    innoforest_enabled: (await getEffectiveSetting("innoforest_enabled")).value === "true",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">관리자 — 연동 설정</h1>
        <p className="text-sm text-secondary mt-1">
          API 키는 서버에만 안전하게 저장되며 화면에는 마스킹 상태로만 표시됩니다. 입력 즉시 적용(재배포 불필요).
        </p>
      </div>
      <AdminSettingsClient initial={initial} />
    </div>
  );
}
