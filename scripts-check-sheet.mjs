import { google } from "googleapis";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const keyB64 = env.match(/GOOGLE_SERVICE_ACCOUNT_KEY=(.+)/)[1].trim();
const key = JSON.parse(Buffer.from(keyB64, "base64").toString("utf-8"));
console.log("서비스 계정:", key.client_email);

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "SHEETS_ID_REDACTED";
const TAB = "1-3. 참가(선정)기업(2019~)";

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `'${TAB}'!A1:U3`,
});
res.data.values?.forEach((row, i) => console.log(`행${i + 1} (${row.length}칸):`, JSON.stringify(row)));
