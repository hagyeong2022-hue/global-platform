import { google } from "googleapis";

// ID는 환경변수로만 관리 — 공개 레포에 내부 문서 ID를 두지 않는다
const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID!;
const COMPANIES_TAB = process.env.SHEETS_COMPANIES_TAB || "기업목록";

export type Company = {
  id: string;
  rowNumber: number; // 시트 실제 행 번호 (쓰기 대상 식별용)
  year: string;
  programName: string;
  region: string;
  businessNumber: string;
  name: string;
  isAi: string;
  industry: string;
  description: string;
  address: string;
  ceoName: string;
  ceoEmail: string;
  ceoPhone: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  establishedDate: string;
  revenue: string; // S열: 매출
  investmentAmount: string; // T열: 투자
  employment: string; // U열: 고용
  investmentStage: string; // V열: 투자단계
  lastInvestmentDate: string; // W열: 최근투자일
};

// 대시보드에서 편집(시트로 되쓰기) 허용하는 성장지표 컬럼만 정의
// — 기업 식별정보(이름·사업자번호 등)는 시트에서만 수정 (행 정합성 보호)
export const EDITABLE_COLUMNS = {
  revenue: "S",
  investmentAmount: "T",
  employment: "U",
  investmentStage: "V",
  lastInvestmentDate: "W",
} as const;
export type EditableField = keyof typeof EDITABLE_COLUMNS;

function getAuth(readonly = true) {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  const key = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      readonly
        ? "https://www.googleapis.com/auth/spreadsheets.readonly"
        : "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

export async function getCompanies(): Promise<Company[]> {
  const auth = getAuth(true);
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${COMPANIES_TAB}'!A3:W1000`,
  });

  const rows = res.data.values ?? [];

  return rows
    .map((row, idx) => ({ row, rowNumber: idx + 3 })) // A3에서 시작 → 실제 행 번호
    .filter(({ row }) => row[5]?.toString().trim())
    .map(({ row, rowNumber }) => ({
      id: `${row[0] ?? ""}-${row[1] ?? rowNumber}`,
      rowNumber,
      year: String(row[0] ?? ""),
      programName: String(row[2] ?? ""),
      region: String(row[3] ?? ""),
      businessNumber: String(row[4] ?? ""),
      name: String(row[5] ?? ""),
      isAi: String(row[7] ?? ""),
      industry: String(row[8] ?? ""),
      description: String(row[9] ?? ""),
      address: String(row[10] ?? ""),
      ceoName: String(row[11] ?? ""),
      ceoEmail: String(row[12] ?? ""),
      ceoPhone: String(row[13] ?? ""),
      managerName: String(row[14] ?? ""),
      managerEmail: String(row[15] ?? ""),
      managerPhone: String(row[16] ?? ""),
      establishedDate: String(row[17] ?? ""),
      revenue: String(row[18] ?? "").trim(),
      investmentAmount: String(row[19] ?? "").trim(),
      employment: String(row[20] ?? "").trim(),
      investmentStage: String(row[21] ?? "").trim(),
      lastInvestmentDate: String(row[22] ?? "").trim(),
    }));
}

/**
 * 특정 행의 성장지표 컬럼(S~W)만 시트로 되쓰기 (Option A: 시트가 원본).
 * EDITABLE_COLUMNS에 정의된 필드만 허용 — 그 외는 무시.
 */
export async function updateCompanyRow(
  rowNumber: number,
  fields: Partial<Record<EditableField, string>>
): Promise<{ updated: EditableField[] }> {
  if (!Number.isInteger(rowNumber) || rowNumber < 3 || rowNumber > 100000) {
    throw new Error("유효하지 않은 행 번호");
  }
  const entries = (Object.entries(fields) as [EditableField, string][]).filter(
    ([k]) => k in EDITABLE_COLUMNS
  );
  if (entries.length === 0) return { updated: [] };

  const auth = getAuth(false);
  const sheets = google.sheets({ version: "v4", auth });
  const data = entries.map(([k, v]) => ({
    range: `'${COMPANIES_TAB}'!${EDITABLE_COLUMNS[k]}${rowNumber}`,
    values: [[v ?? ""]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: "USER_ENTERED", data },
  });

  return { updated: entries.map(([k]) => k) };
}
