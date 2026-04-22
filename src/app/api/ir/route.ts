import { NextRequest, NextResponse } from "next/server";
import { getIrFiles } from "@/lib/googleDrive";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get("company") ?? "";
  if (!company.trim()) {
    return NextResponse.json({ files: [], error: "company 쿼리가 필요합니다." }, { status: 400 });
  }

  try {
    const files = await getIrFiles(company);
    return NextResponse.json({ files });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ files: [], error: msg }, { status: 500 });
  }
}
