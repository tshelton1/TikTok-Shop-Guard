-- TikTok Shop Guard — violations, appeals, appeal documents
-- Greenfield: run after 001_initial.sql (and optionally 002_scan_rules.sql).
-- Idempotent — safe to re-run. Skips if you already applied 002_core_domain.sql + 006/007.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'violation_status') then
    create type public.violation_status as enum ('open', 'resolved', 'dismissed', 'appealed');
  end if;

  if not exists (select 1 from pg_type where typname = 'appeal_status') then
    create type public.appeal_status as enum (
      'draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum ('uploaded', 'processing', 'available', 'rejected');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- violations
-- ---------------------------------------------------------------------------

create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  listing_title text,
  title text not null,
  details text,
  issue_category text not null default 'General Policy',
  severity integer not null default 3 check (severity between 1 and 5),
  status public.violation_status not null default 'open',
  detected_at timestamptz not null default now(),
  appeal_deadline_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists violations_set_updated_at on public.violations;
create trigger violations_set_updated_at
  before update on public.violations
  for each row execute function public.set_updated_at();

create index if not exists violations_shop_idx on public.violations (shop_id);
create index if not exists violations_status_idx on public.violations (status);
create index if not exists violations_detected_at_idx on public.violations (detected_at desc);

-- ---------------------------------------------------------------------------
-- appeals
-- ---------------------------------------------------------------------------

create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  violation_id uuid not null references public.violations (id) on delete cascade,
  status public.appeal_status not null default 'draft',
  issue_category text,
  recommended_response text,
  evidence_checklist jsonb not null default '[]'::jsonb,
  draft_message text,
  deadline_at timestamptz,
  supporting_docs_notes text,
  reason text,
  notes text,
  created_by uuid references public.users_profile (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists appeals_set_updated_at on public.appeals;
create trigger appeals_set_updated_at
  before update on public.appeals
  for each row execute function public.set_updated_at();

create index if not exists appeals_shop_idx on public.appeals (shop_id);
create index if not exists appeals_violation_idx on public.appeals (violation_id);
create index if not exists appeals_status_idx on public.appeals (status);

create unique index if not exists appeals_violation_draft_uidx
  on public.appeals (violation_id)
  where status = 'draft';

comment on column public.appeals.evidence_checklist is
  'JSON array: { id, label, required, checked }';

-- ---------------------------------------------------------------------------
-- appeal_documents
-- ---------------------------------------------------------------------------

create table if not exists public.appeal_documents (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals (id) on delete cascade,
  status public.document_status not null default 'uploaded',
  file_name text not null,
  file_url text not null,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  document_type text check (document_type in ('screenshot', 'invoice', 'authenticity', 'other')),
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.users_profile (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists appeal_documents_set_updated_at on public.appeal_documents;
create trigger appeal_documents_set_updated_at
  before update on public.appeal_documents
  for each row execute function public.set_updated_at();

create index if not exists appeal_documents_appeal_idx on public.appeal_documents (appeal_id);
create index if not exists appeal_documents_storage_path_idx
  on public.appeal_documents (storage_path)
  where storage_path is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.violations enable row level security;
alter table public.appeals enable row level security;
alter table public.appeal_documents enable row level security;

drop policy if exists "Members can view shop violations" on public.violations;
create policy "Members can view shop violations"
  on public.violations for select
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "Members can view shop appeals" on public.appeals;
create policy "Members can view shop appeals"
  on public.appeals for select
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "Members can insert shop appeals" on public.appeals;
create policy "Members can insert shop appeals"
  on public.appeals for insert
  to authenticated
  with check (public.is_shop_member(shop_id));

drop policy if exists "Members can update shop appeals" on public.appeals;
create policy "Members can update shop appeals"
  on public.appeals for update
  to authenticated
  using (public.is_shop_member(shop_id))
  with check (public.is_shop_member(shop_id));

drop policy if exists "Members can view appeal documents" on public.appeal_documents;
create policy "Members can view appeal documents"
  on public.appeal_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.appeals a
      where a.id = appeal_id and public.is_shop_member(a.shop_id)
    )
  );

drop policy if exists "Members can insert appeal documents" on public.appeal_documents;
create policy "Members can insert appeal documents"
  on public.appeal_documents for insert
  to authenticated
  with check (
    exists (
      select 1 from public.appeals a
      where a.id = appeal_id and public.is_shop_member(a.shop_id)
    )
  );

drop policy if exists "Members can delete appeal documents" on public.appeal_documents;
create policy "Members can delete appeal documents"
  on public.appeal_documents for delete
  to authenticated
  using (
    exists (
      select 1 from public.appeals a
      where a.id = appeal_id and public.is_shop_member(a.shop_id)
    )
  );

grant select on public.violations to authenticated;
grant select, insert, update on public.appeals to authenticated;
grant select, insert, delete on public.appeal_documents to authenticated;
