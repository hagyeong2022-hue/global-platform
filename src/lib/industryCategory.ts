/**
 * 시트의 분야(industry)는 자유 입력이라 "미디어·플랫폼", "AI·빅데이터", "헬스케어/바이오"처럼
 * 표기가 제각각이다. 이를 표준 스타트업 카테고리로 분류해 일관되게 보여주기 위한 모듈.
 */

export const INDUSTRY_CATEGORIES = [
  "AI·데이터",
  "헬스케어·바이오",
  "핀테크",
  "커머스·유통",
  "미디어·콘텐츠",
  "에듀테크",
  "모빌리티·물류",
  "푸드·농업",
  "제조·하드웨어",
  "AR·VR·XR",
  "관광·여행",
  "환경·에너지",
  "뷰티·패션",
  "플랫폼·SaaS",
  "기타",
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];

// 키워드 → 표준 카테고리 (공백 제거·소문자 기준으로 매칭)
// 더 구체적인 카테고리를 위에 두어 우선 매칭되게 한다.
const RULES: { cat: IndustryCategory; kw: string[] }[] = [
  { cat: "AR·VR·XR", kw: ["ar", "vr", "xr", "메타버스", "증강현실", "가상현실"] },
  { cat: "헬스케어·바이오", kw: ["바이오", "헬스", "의료", "메디", "디바이스", "제약", "진단", "디지털헬스", "웰니스"] },
  { cat: "핀테크", kw: ["핀테크", "금융", "보험", "결제", "페이", "자산", "투자플랫폼", "대출"] },
  { cat: "에듀테크", kw: ["에듀", "교육", "학습", "이러닝", "edu"] },
  { cat: "모빌리티·물류", kw: ["모빌리티", "자동차", "물류", "운송", "교통", "배송", "항공", "드론"] },
  { cat: "푸드·농업", kw: ["푸드", "식품", "농업", "외식", "수산", "축산", "애그", "agri"] },
  { cat: "관광·여행", kw: ["관광", "여행", "호텔", "트래블", "레저", "숙박"] },
  { cat: "환경·에너지", kw: ["환경", "에너지", "친환경", "탄소", "재생", "기후", "esg", "전기차충전"] },
  { cat: "뷰티·패션", kw: ["뷰티", "패션", "화장품", "코스메", "의류"] },
  { cat: "제조·하드웨어", kw: ["제조", "하드웨어", "센서", "로봇", "로보", "iot", "반도체", "소재", "부품", "기계", "디스플레이"] },
  { cat: "커머스·유통", kw: ["커머스", "이커머스", "쇼핑", "유통", "판매", "리테일", "마켓", "수출"] },
  { cat: "미디어·콘텐츠", kw: ["미디어", "콘텐츠", "영상", "엔터", "게임", "음악", "방송", "광고", "마케팅", "크리에이터", "웹툰"] },
  { cat: "AI·데이터", kw: ["ai", "인공지능", "빅데이터", "데이터", "머신러닝", "딥러닝"] },
  { cat: "플랫폼·SaaS", kw: ["플랫폼", "saas", "솔루션", "소프트웨어", "it", "ict", "클라우드", "앱"] },
];

/** 단일 분야 토큰을 표준 카테고리들로 변환 */
function classifyToken(token: string): IndustryCategory[] {
  const text = token.toLowerCase().replace(/\s/g, "");
  if (!text) return [];
  const hits: IndustryCategory[] = [];
  for (const r of RULES) {
    if (r.kw.some((k) => text.includes(k))) hits.push(r.cat);
  }
  return hits;
}

/**
 * 자유 입력 분야 문자열 배열 → 표준 카테고리 배열(중복 제거·표준 순서).
 * "미디어·플랫폼", "AI, 커머스" 처럼 구분자(·,/、)로 묶인 값도 분해해 분류한다.
 */
export function classifyIndustries(raws: string[]): IndustryCategory[] {
  const set = new Set<IndustryCategory>();
  for (const raw of raws) {
    for (const token of raw.split(/[,/·∙ㆍ|;]+/)) {
      for (const cat of classifyToken(token)) set.add(cat);
    }
  }
  if (set.size === 0) return ["기타"];
  return INDUSTRY_CATEGORIES.filter((c) => set.has(c));
}

// 카테고리별 칩 색상 (연한 배경 + 진한 글자)
export const CATEGORY_STYLE: Record<IndustryCategory, { bg: string; fg: string }> = {
  "AI·데이터": { bg: "#EEF2FF", fg: "#4338CA" },
  "헬스케어·바이오": { bg: "#ECFDF5", fg: "#047857" },
  "핀테크": { bg: "#EFF6FF", fg: "#1D4ED8" },
  "커머스·유통": { bg: "#FFF7ED", fg: "#C2410C" },
  "미디어·콘텐츠": { bg: "#FDF2F8", fg: "#BE185D" },
  "에듀테크": { bg: "#F0F9FF", fg: "#0369A1" },
  "모빌리티·물류": { bg: "#F0FDFA", fg: "#0F766E" },
  "푸드·농업": { bg: "#F7FEE7", fg: "#4D7C0F" },
  "제조·하드웨어": { bg: "#F1F5F9", fg: "#334155" },
  "AR·VR·XR": { bg: "#F5F3FF", fg: "#6D28D9" },
  "관광·여행": { bg: "#FEFCE8", fg: "#A16207" },
  "환경·에너지": { bg: "#F0FDF4", fg: "#15803D" },
  "뷰티·패션": { bg: "#FFF1F2", fg: "#BE123C" },
  "플랫폼·SaaS": { bg: "#F8FAFC", fg: "#475569" },
  "기타": { bg: "#F1F5F9", fg: "#64748B" },
};
