import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SidebarClient from "@/components/SidebarClient";

export default async function Sidebar() {
  const session = await getServerSession(authOptions);
  return (
    <SidebarClient
      userEmail={session?.user?.email ?? null}
      isAdmin={session?.user?.role === "admin"}
    />
  );
}
