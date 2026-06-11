import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  return (
    <NavbarClient
      userEmail={session?.user?.email ?? null}
      isAdmin={session?.user?.role === "admin"}
    />
  );
}
