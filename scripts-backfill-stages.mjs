import { google } from "googleapis";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const get = (k) => env.match(new RegExp(`${k}=(.+)`))?.[1].trim();
const key = JSON.parse(Buffer.from(get("GOOGLE_SERVICE_ACCOUNT_KEY"), "base64").toString("utf-8"));
const NAVER_ID = get("NAVER_CLIENT_ID");
const NAVER_SECRET = get("NAVER_CLIENT_SECRET");

const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "SHEETS_ID_REDACTED";
const TAB = "1-3. 참가(선정)기업(2019~)";

// 1) 기업명 읽기 (F열, 3행부터)
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `'${TAB}'!A3:F1000`,
});
const rows = res.data.values ?? [];
const names = rows.map((r) => (r[5] ?? "").toString().trim());
const unique = [...new Set(names.filter((n) => n.length >= 2))];
console.log(`총 ${rows.length}행, 고유 기업 ${unique.length}개`);

// 2) 단계 추론 규칙 — 구체적인 패턴 먼저
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&quot;|&amp;|&lt;|&gt;|&#39;/g, " ");
const RULES = [
  { re: /프리\s*-?\s*IPO|pre\s*-?\s*ipo|상장\s*전\s*투자/i, stage: "Pre-IPO" },
  { re: /(코스닥|코스피|나스닥)\s*(상장|입성)|상장\s*(완료|했다|에 성공)/, stage: "상장" },
  { re: /시리즈\s*-?\s*D|series\s*D/i, stage: "Series C+" },
  { re: /시리즈\s*-?\s*C|series\s*C/i, stage: "Series C+" },
  { re: /시리즈\s*-?\s*B|series\s*B/i, stage: "Series B" },
  { re: /프리\s*-?\s*(시리즈)?\s*A|pre\s*-?\s*(series\s*)?A\b/i, stage: "Pre-A" },
  { re: /시리즈\s*-?\s*A|series\s*A/i, stage: "Series A" },
  { re: /시드\s*(투자|라운드|머니)|씨드\s*투자|seed\s*(round|투자)/i, stage: "Seed" },
];
const INVEST_HINT = /투자|유치|라운드|펀딩/;

async function inferStage(name) {
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(`"${name}" 투자 유치`)}&display=30&sort=sim`;
  const r = await fetch(url, { headers: { "X-Naver-Client-Id": NAVER_ID, "X-Naver-Client-Secret": NAVER_SECRET } });
  if (!r.ok) { console.log(`  ! ${name}: API ${r.status}`); return null; }
  const data = await r.json();
  let best = null;
  for (const item of data.items ?? []) {
    const text = strip(item.title + " " + item.description);
    if (!text.includes(name)) continue;          // 기업명이 본문에 없으면 다른 회사 기사로 간주
    if (!INVEST_HINT.test(text)) continue;
    for (const rule of RULES) {
      if (rule.re.test(text)) {
        const d = new Date(item.pubDate);
        if (!best || d > best.date) best = { stage: rule.stage, date: d };
        break;
      }
    }
  }
  return best;
}

// 3) 고유 기업별 추론 (rate limit: 초당 ~8건)
const found = new Map();
let done = 0;
for (const name of unique) {
  const result = await inferStage(name);
  if (result) {
    found.set(name, result);
    console.log(`  ✓ ${name}: ${result.stage} (${result.date.toISOString().slice(0, 10)})`);
  }
  done++;
  if (done % 25 === 0) console.log(`-- 진행 ${done}/${unique.length}`);
  await new Promise((r) => setTimeout(r, 130));
}
console.log(`추론 성공: ${found.size}/${unique.length}개 기업`);

// 4) AE/AF열에 일괄 기록 (못 찾은 기업은 빈칸 유지)
const values = names.map((n) => {
  const f = found.get(n);
  return f ? [f.stage, f.date.toISOString().slice(0, 10)] : ["", ""];
});
await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `'${TAB}'!AE3:AF${2 + values.length}`,
  valueInputOption: "RAW",
  requestBody: { values },
});
console.log(`시트 기록 완료: AE3:AF${2 + values.length}`);
