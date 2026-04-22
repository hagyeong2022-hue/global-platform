# Global Platform — SPEC.md

---

## 완성 모습 (시나리오)

1. 팀원이 접속하면 상단 KPI 4개가 한눈에 — **올해 진출 지원 국가 수**(하단에 누적 국가 수 소자 표기) · **관리 기업 수** · **당년도 매출액 합산** · **이달의 뉴스 건 수**
2. 그 아래 **오늘의 뉴스 피드** — 24시간 내 새 뉴스가 있는 기업만 카드로 노출, 기업별 컬러 태그 + 투자/글로벌 카테고리 분류
3. 스크롤하면 **기업 목록 테이블** — 기업명·업종·아이템·대표자·성장단계 배지·진출 국가 플래그 한 줄, 클릭 시 상세 페이지 이동
4. **기업 상세 페이지** — 전체 정보 + 최신 뉴스 피드 + IR 자료 버튼(구글 드라이브 PDF 연결)
5. **글로벌 프로그램 현황 페이지** — 연도별 탭(2019~2025) + 참여 기업 × 지원 국가 테이블 + 연도별 투자유치 누적 바 차트

---

## 기능 목록

### 꼭 필요한 것
- KPI 카드 4개 (올해 진출 국가 수 / 관리 기업 수 / 당년도 매출액 / 이달 뉴스 건 수)
- 오늘의 뉴스 피드 (카테고리 태그: 투자 / 글로벌)
- 기업 목록 테이블 (성장단계 배지, 국가 플래그)
- 기업 상세 페이지 (전체 정보 + 뉴스 + IR 자료 버튼)
- 글로벌 프로그램 현황 페이지 (연도별 탭 + 바 차트)
- 구글 시트 실시간 연동
- 매출액: NICE API → DART fallback → 빈칸

### 있으면 좋은 것
- 기업 검색·필터 (업종 / 투자단계 / 국가)
- IR 자료 PDF 바로 보기 (드라이브 열기 대신)
- 뉴스 북마크

---

## 단계별 상세

### 1단계 — Next.js 생성 · GitHub · Vercel 배포
- **목표:** 아무것도 없어도 Vercel URL이 열리면 성공
- **완료 조건:** `https://[프로젝트].vercel.app` 접속 시 Next.js 기본 화면 출력
- **파일 힌트:** `src/app/page.tsx`, `src/app/layout.tsx`
- **필요한 API:** 없음

---

### 2단계 — 구글 시트 API 연동
- **목표:** 시트의 기업 데이터를 API Route로 읽어서 화면에 JSON 출력
- **완료 조건:** `/api/companies` 호출 시 기업 리스트 JSON 반환
- **파일 힌트:**
  - `src/app/api/companies/route.ts`
  - `src/lib/googleSheets.ts`
  - `.env.local` (서비스 계정 키)
- **필요한 API:** Google Sheets API (googleapis 패키지)

---

### 3단계 — 기업 목록 테이블 + KPI 카드
- **목표:** 메인 대시보드 레이아웃 완성
- **완료 조건:** KPI 4개 + 기업 목록 테이블이 화면에 출력됨
- **파일 힌트:**
  - `src/app/page.tsx`
  - `src/components/KpiCard.tsx`
  - `src/components/CompanyTable.tsx`
- **필요한 API:** 없음 (2단계 연동 재사용)

---

### 4단계 — 기업 상세 페이지 + IR 자료 버튼
- **목표:** 기업 클릭 시 상세 정보 페이지 이동
- **완료 조건:** 전체 필드 표시 + 구글 드라이브 링크 버튼 작동
- **파일 힌트:**
  - `src/app/companies/[id]/page.tsx`
  - `src/components/CompanyDetail.tsx`
- **필요한 API:** 없음

---

### 5단계 — 네이버 뉴스 API + 메인 뉴스 피드
- **목표:** 기업명으로 뉴스 자동 수집, 메인에 오늘 뉴스 피드 표시
- **완료 조건:** 메인 뉴스 피드 카드 출력 + 기업 상세 페이지에 뉴스 리스트
- **파일 힌트:**
  - `src/app/api/news/route.ts`
  - `src/lib/naverNews.ts`
  - `src/components/NewsFeed.tsx`
  - `src/components/NewsCard.tsx`
- **필요한 API:** 네이버 검색 API (Client-ID, Client-Secret)

---

### 6단계 — NICE API + DART fallback 매출액 수집
- **목표:** 기업별 매출액 자동 수집, KPI 카드 당년도 합산 표시
- **완료 조건:** NICE 성공 시 NICE 데이터, 실패 시 DART 데이터, 둘 다 없으면 `-` 표시
- **파일 힌트:**
  - `src/app/api/revenue/route.ts`
  - `src/lib/nice.ts`
  - `src/lib/dart.ts`
- **필요한 API:** NICE평가정보 API (기 구독), DART OpenAPI (opendart.fss.or.kr)

---

### 7단계 — 글로벌 프로그램 현황 페이지 + 바 차트
- **목표:** 연도별 탭 + 참여 기업 × 국가 테이블 + 투자유치 바 차트
- **완료 조건:** 연도 탭 클릭 시 해당 연도 기업·국가 표시, 차트 렌더링
- **파일 힌트:**
  - `src/app/programs/page.tsx`
  - `src/components/ProgramTable.tsx`
  - `src/components/InvestmentChart.tsx`
- **필요한 API:** 없음 (차트: Recharts 패키지)

---

### 8단계 — 검색·필터 + 팀 접근 설정
- **목표:** 기업 목록 필터링 + 팀 전용 접근 보호
- **완료 조건:** 업종·투자단계·국가 필터 작동, URL 보호 설정
- **파일 힌트:**
  - `src/components/FilterBar.tsx`
  - `src/middleware.ts` (Vercel 기본 인증)
- **필요한 API:** 없음

---

## API · 외부 도구

| 도구 | 비용 | 가입·발급 방법 | 처음이면 |
|------|------|----------------|----------|
| **Google Sheets API** | 무료 | Google Cloud Console → 프로젝트 생성 → Sheets API 활성화 → 서비스 계정 → JSON 키 다운로드 | `googleapis` npm 패키지 공식 문서 |
| **네이버 뉴스 검색 API** | 무료 (일 25,000건) | developers.naver.com → 애플리케이션 등록 → Client ID / Secret 발급 | `fetch`로 직접 호출, 별도 SDK 없음 |
| **NICE평가정보 API** | 유료 (기 구독 중) | 기존 계정에서 API 키 확인 | NICE 개발자 포털 문서 참고 |
| **DART OpenAPI** | 무료 | opendart.fss.or.kr → 회원가입 → 인증키 신청 (즉시 발급) | `fetch`로 직접 호출 |
| **Recharts** | 무료 | npm install recharts | recharts.org 공식 문서 |

---

## 오늘 수업 범위 vs 집에서 이어서

| 오늘 수업 | 집에서 이어서 |
|-----------|--------------|
| 1단계 — Next.js 생성, GitHub 연결, Vercel 배포 | 2단계 — 구글 시트 API 연동 |
| 기본 페이지 구조 (레이아웃, 라우팅 이해) | 3~8단계 순서대로 |
| `.env.local` 환경변수 개념 이해 | API 키 발급 및 연동 |
