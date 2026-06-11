import { google } from "googleapis";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const keyB64 = env.match(/GOOGLE_SERVICE_ACCOUNT_KEY=(.+)/)[1].trim();
const key = JSON.parse(Buffer.from(keyB64, "base64").toString("utf-8"));
const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "SHEETS_ID_REDACTED";
const TAB = "1-3. 참가(선정)기업(2019~)";

// 탭의 sheetId 조회
const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
const sheet = meta.data.sheets.find((s) => s.properties.title === TAB);
const sheetId = sheet.properties.sheetId;
console.log("sheetId:", sheetId, "| 현재 컬럼 수:", sheet.properties.gridProperties.columnCount);

// 컬럼 2개 추가 (AE, AF)
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: {
    requests: [
      { appendDimension: { sheetId, dimension: "COLUMNS", length: 2 } },
    ],
  },
});
console.log("컬럼 2개 추가 완료 (AE, AF)");

// 헤더 기입
const res = await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `'${TAB}'!AE1:AF2`,
  valueInputOption: "RAW",
  requestBody: {
    values: [
      ["플랫폼 자동수집 (수기입력 금지)", ""],
      ["투자단계(자동)", "최근투자일(자동)"],
    ],
  },
});
console.log("헤더 추가 완료:", res.data.updatedRange);
