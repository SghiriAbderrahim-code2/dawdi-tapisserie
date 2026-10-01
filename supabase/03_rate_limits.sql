-- =====================================================
-- rate_limits - حد الطلبات لكل IP (من الـ spec، شغّله بعد schema_v2.sql)
-- يقرأه الخادم عبر service_role فقط (بدون سياسات = لا وصول من العميل)
-- =====================================================

create table public.rate_limits (
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index on public.rate_limits (ip_hash, created_at desc);

alter table public.rate_limits enable row level security;
