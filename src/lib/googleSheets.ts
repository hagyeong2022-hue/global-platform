import { google } from "googleapis";

// ID는 환경변수로만 관리 — 공개 레포에 내부 문서 ID를 두지 않는다
const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID!;
const COMPANIES_TAB = process.env.SHEETS_COMPANIES_TAB || "기업목록";

export type Company = {
  id: string;
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
  revenue: string; // S열: 매출(단위:백만원)
  investmentAmount: string; // T열: 투자(단위:백만원)
  employment: string; // U열: 고용(단위:명)
  investmentStage: string; // V열: 투자단계
  lastInvestmentDate: string; // W열: 최근투자일
};

function getAuth() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  const key = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function getCompanies(): Promise<Company[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    // V(투자단계)·W(최근투자일)는 값이 없어도 빈값으로 처리됨
    range: `'${COMPANIES_TAB}'!A3:W1000`,
  });

  const rows = res.data.values ?? [];

  return rows
    .filter((row) => row[5]?.toString().trim())
    .map((row, idx) => ({
      id: `${row[0] ?? ""}-${row[1] ?? idx}`,
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
