import Link from "next/link";
import { getServerSession } from "next-auth";
import UserMenu from "@/components/UserMenu";

export default async function Navbar() {
  const session = await getServerSession();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-600">
          Global Platform
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">대시보드</Link>
          <Link href="/programs" className="hover:text-blue-600 transition-colors">글로벌 프로그램</Link>
          <Link href="/email" className="hover:text-blue-600 transition-colors">이메일 보내기</Link>
          {session && <UserMenu session={session} />}
        </nav>
      </div>
    </header>
  );
}
