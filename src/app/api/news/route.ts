import { NextRequest, NextResponse } from "next/server";
import { searchNews } from "@/lib/naverNews";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  if (!query) return NextResponse.json({ error: "query 파라미터 필요" }, { status: 400 });

  try {
    const news = await searchNews(query, 5);
    return NextResponse.json({ news });
  } catch (error) {
    console.error("Naver News error:", error);
    return NextResponse.json({ error: "뉴스를 불러오지 못했습니다." }, { status: 500 });
  }
}
