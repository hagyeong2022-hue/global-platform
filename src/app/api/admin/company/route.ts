import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateCompanyRow, EDITABLE_COLUMNS, EditableField } from "@/lib/googleSheets";
import { revalidatePath } from "next/cache";

// 대시보드 관리자 편집 → 시트로 되쓰기 (Option A). 관리자(role=admin)만 허용.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { rowNumber?: unknown; fields?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const rowNumber = Number(body?.rowNumber);
  const fields = body?.fields ?? {};

  // 허용된 성장지표 컬럼만 추출 (그 외 필드는 무시)
  const clean: Partial<Record<EditableField, string>> = {};
  for (const k of Object.keys(EDITABLE_COLUMNS) as EditableField[]) {
    if (k in fields) clean[k] = String(fields[k] ?? "");
  }

  try {
    const result = await updateCompanyRow(rowNumber, clean);
    // 읽기 캐시 즉시 갱신 → 다른 화면에도 바로 반영
    revalidatePath("/");
    revalidatePath("/startups");
    revalidatePath("/admin");
    return NextResponse.json({ ok: true, updated: result.updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
