-- Core domain schema: shops, listings, policy rules, scans, violations, appeals, alerts, audit logs
-- Assumes `public.profiles` already exists (see 001_profiles.sql)

-- UUID generation
create extension if not exists pgcrypto;

-- Updated-at trigger helper (shared)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Enums for consistent status fields
do $$
begin
  if not exists (select 1 from pg_type where typname = 'shop_status') then
    create type public.shop_status as enum ('active', 'paused', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('active', 'invited', 'suspended', 'deleted');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type public.listing_status as enum ('active', 'inactive', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'rule_status') then
    create type public.rule_status as enum ('active', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'scan_status') then
    create type public.scan_status as enum ('queued', 'running', 'succeeded', 'failed', 'canceled');
  end if;

  if not exists (select 1 from pg_type where typname = 'violation_status') then
    create type public.violation_status as enum ('open', 'resolved', 'dismissed', 'appealed');
  end if;

  if not exists (select 1 from pg_type where typname = 'appeal_status') then
    create type public.appeal_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum ('uploaded', 'processing', 'available', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'alert_status') then
    create type public.alert_status as enum ('unread', 'read', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'alert_type') then
    create type public.alert_type as enum ('scan_completed', 'violation_found', 'violation_resolved', 'appeal_updated', 'billing', 'security', 'system');
  end if;
end
$$;

-- USERS (app-level user settings; auth identity lives in auth.users / public.profiles)
create table if not exists public.users (
  id uuid primary key references public.profiles(id) on delete cascade,
  status public.user_status not null default 'active',
  role text not null default 'owner', -- e.g. owner, admin, member (simple + extensible)
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create index if not exists users_status_idx on public.users(status);

-- SHOPS
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  status public.shop_status not null default 'active',
  name text not null,
  platform text not null default 'tiktok_shop',
  external_shop_id text, -- id in the upstream platform
  timezone text not null default 'UTC',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

create index if not exists shops_owner_idx on public.shops(owner_user_id);
create index if not exists shops_status_idx on public.shops(status);
create unique index if not exists shops_platform_external_uidx
  on public.shops(platform, external_shop_id)
  where external_shop_id is not null and deleted_at is null;

-- SHOP MEMBERS (many users can access a shop)
create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member', -- owner/admin/member
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

drop trigger if exists shop_members_set_updated_at on public.shop_members;
create trigger shop_members_set_updated_at
  before update on public.shop_members
  for each row execute function public.set_updated_at();

create index if not exists shop_members_user_idx on public.shop_members(user_id);
create index if not exists shop_members_status_idx on public.shop_members(status);

-- LISTINGS
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  status public.listing_status not null default 'active',
  title text not null,
  sku text,
  external_listing_id text,
  url text,
  category text,
  price_cents integer,
  currency text default 'USD',
  attributes jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create index if not exists listings_shop_idx on public.listings(shop_id);
create index if not exists listings_status_idx on public.listings(status);
create unique index if not exists listings_shop_external_uidx
  on public.listings(shop_id, external_listing_id)
  where external_listing_id is not null;

-- POLICY RULES (global or shop-scoped)
create table if not exists public.policy_rules (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade, -- null => global rule
  status public.rule_status not null default 'active',
  code text not null, -- stable identifier like TT_IMAGE_TEXT, TT_CLAIM_MEDICAL
  title text not null,
  description text,
  severity integer not null default 2 check (severity between 1 and 5),
  category text,
  source text not null default 'internal', -- internal | tiktok | other
  rule jsonb not null default '{}'::jsonb, -- matching logic / thresholds
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists policy_rules_set_updated_at on public.policy_rules;
create trigger policy_rules_set_updated_at
  before update on public.policy_rules
  for each row execute function public.set_updated_at();

create index if not exists policy_rules_shop_idx on public.policy_rules(shop_id);
create index if not exists policy_rules_status_idx on public.policy_rules(status);
create unique index if not exists policy_rules_scope_code_uidx
  on public.policy_rules(coalesce(shop_id::text, 'global'), code);

-- VIOLATION SCANS (a run over a shop's listings)
create table if not exists public.violation_scans (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  status public.scan_status not null default 'queued',
  scan_type text not null default 'full', -- full | incremental | manual
  initiated_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists violation_scans_set_updated_at on public.violation_scans;
create trigger violation_scans_set_updated_at
  before update on public.violation_scans
  for each row execute function public.set_updated_at();

create index if not exists violation_scans_shop_idx on public.violation_scans(shop_id);
create index if not exists violation_scans_status_idx on public.violation_scans(status);
create index if not exists violation_scans_created_at_idx on public.violation_scans(created_at desc);

-- VIOLATIONS
create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  scan_id uuid references public.violation_scans(id) on delete set null,
  rule_id uuid references public.policy_rules(id) on delete set null,
  status public.violation_status not null default 'open',
  severity integer not null default 2 check (severity between 1 and 5),
  title text not null,
  details text,
  evidence jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists violations_set_updated_at on public.violations;
create trigger violations_set_updated_at
  before update on public.violations
  for each row execute function public.set_updated_at();

create index if not exists violations_shop_idx on public.violations(shop_id);
create index if not exists violations_listing_idx on public.violations(listing_id);
create index if not exists violations_scan_idx on public.violations(scan_id);
create index if not exists violations_rule_idx on public.violations(rule_id);
create index if not exists violations_status_idx on public.violations(status);
create index if not exists violations_detected_at_idx on public.violations(detected_at desc);

-- APPEALS
create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  violation_id uuid not null references public.violations(id) on delete cascade,
  status public.appeal_status not null default 'draft',
  reason text,
  notes text,
  submitted_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists appeals_set_updated_at on public.appeals;
create trigger appeals_set_updated_at
  before update on public.appeals
  for each row execute function public.set_updated_at();

create index if not exists appeals_shop_idx on public.appeals(shop_id);
create index if not exists appeals_violation_idx on public.appeals(violation_id);
create index if not exists appeals_status_idx on public.appeals(status);

-- APPEAL DOCUMENTS
create table if not exists public.appeal_documents (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.appeals(id) on delete cascade,
  status public.document_status not null default 'uploaded',
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes bigint,
  checksum_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists appeal_documents_set_updated_at on public.appeal_documents;
create trigger appeal_documents_set_updated_at
  before update on public.appeal_documents
  for each row execute function public.set_updated_at();

create index if not exists appeal_documents_appeal_idx on public.appeal_documents(appeal_id);
create index if not exists appeal_documents_status_idx on public.appeal_documents(status);

-- ALERTS (notifications)
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type public.alert_type not null,
  status public.alert_status not null default 'unread',
  title text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists alerts_set_updated_at on public.alerts;
create trigger alerts_set_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();

create index if not exists alerts_shop_idx on public.alerts(shop_id);
create index if not exists alerts_user_idx on public.alerts(user_id);
create index if not exists alerts_status_idx on public.alerts(status);
create index if not exists alerts_type_idx on public.alerts(type);
create unique index if not exists alerts_dedupe_uidx
  on public.alerts(coalesce(shop_id::text, 'none'), coalesce(user_id::text, 'none'), type, dedupe_key)
  where dedupe_key is not null;

-- AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null, -- e.g. listing.updated, scan.started, violation.resolved
  entity_type text, -- listing, violation, appeal, shop, rule, user, etc
  entity_id uuid,
  ip inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_shop_idx on public.audit_logs(shop_id);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

