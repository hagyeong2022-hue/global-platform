-- Supabase SQL Editor에서 1회 실행 (대시보드 → SQL Editor → New query → 붙여넣기 → Run)
-- 용도: Vercel Cron keepalive가 매일 조회할 최소 테이블 (무료 플랜 7일 휴면 방지)

create table if not exists public.keepalive (
  id bigint generated always as identity primary key,
  pinged_at timestamptz not null default now()
);

insert into public.keepalive (pinged_at) values (now());

-- 외부(publishable 키) 접근 차단 — 서버의 secret 키만 읽을 수 있게 RLS 활성화
alter table public.keepalive enable row level security;

-- ── 지원공고 캐시 테이블 (2026-06-12 추가) ──────────────────────────
CREATE TABLE IF NOT EXISTS support_announcements (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  org_name    TEXT,
  category    TEXT,
  apply_start DATE,
  apply_end   DATE,
  url         TEXT,
  source      TEXT DEFAULT 'kstartup',
  fetched_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "서버 전용 읽기" ON support_announcements FOR SELECT USING (true);
CREATE POLICY "서버 전용 쓰기" ON support_announcements FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_support_apply_end ON support_announcements(apply_end);
