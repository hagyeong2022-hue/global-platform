import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/googleSheets";

export async function GET() {
  try {
    const companies = await getCompanies();
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Google Sheets error:", error);
    return NextResponse.json({ error: "데이터를 불러오지 못했습니다." }, { status: 500 });
  }
}
