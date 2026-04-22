import { google } from "googleapis";

const SPREADSHEET_ID = "11Y81xqex2Rjue7HeOxWt8M7R24a3in6WGmX35QKkADM";
const COMPANIES_TAB = "1-3. 참가(선정)기업(2019~)";

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
    range: `'${COMPANIES_TAB}'!A3:R1000`,
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
    }));
}
