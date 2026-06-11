import { google } from "googleapis";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const keyB64 = env.match(/GOOGLE_SERVICE_ACCOUNT_KEY=(.+)/)[1].trim();
const key = JSON.parse(Buffer.from(keyB64, "base64").toString("utf-8"));
const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "SHEETS_ID_REDACTED";
const TAB = "1-3. 참가(선정)기업(2019~)";

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `'${TAB}'!A1:AZ2`,
});
const [row1 = [], row2 = []] = res.data.values ?? [];
const colName = (i) => (i < 26 ? "" : String.fromCharCode(64 + Math.floor(i / 26))) + String.fromCharCode(65 + (i % 26));
const max = Math.max(row1.length, row2.length);
for (let i = 0; i < max; i++) {
  console.log(`${colName(i)}: [${row1[i] ?? ""}] / [${row2[i] ?? ""}]`);
}
console.log("마지막 사용 컬럼:", colName(max - 1));
