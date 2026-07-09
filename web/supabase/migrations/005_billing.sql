-- TikTok Shop Guard — Stripe billing & subscription state
-- Greenfield: run after 001_initial.sql (creates profiles + billing RPCs)
-- Idempotent — safe to re-run alongside 008_billing_entitlements.sql

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

-- ---------------------------------------------------------------------------
-- profiles (billing + Stripe customer state)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  stripe_customer_id text unique,
  subscription_status text not null default 'inactive',
  subscription_id text,
  price_id text,
  plan_id text not null default 'trial'
    check (plan_id in ('trial', 'starter', 'pro')),
  trial_ends_at timestamptz,
  scans_used_this_period integer not null default 0,
  usage_period_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_id text,
  add column if not exists price_id text,
  add column if not exists plan_id text not null default 'trial',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists scans_used_this_period integer not null default 0,
  add column if not exists usage_period_start timestamptz not null default now();

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_plan_id_idx on public.profiles (plan_id);
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill billing profiles from users_profile (001_initial greenfield)
insert into public.profiles (
  id,
  email,
  full_name,
  plan_id,
  subscription_status,
  trial_ends_at
)
select
  up.id,
  up.email,
  up.full_name,
  'trial',
  'trialing',
  now() + interval '14 days'
from public.users_profile up
where not exists (select 1 from public.profiles p where p.id = up.id)
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Prevent users from self-updating billing fields
create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if (
    new.subscription_status is distinct from old.subscription_status
    or new.subscription_id is distinct from old.subscription_id
    or new.price_id is distinct from old.price_id
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.plan_id is distinct from old.plan_id
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.scans_used_this_period is distinct from old.scans_used_this_period
    or new.usage_period_start is distinct from old.usage_period_start
  ) then
    raise exception 'Billing fields cannot be updated directly';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_billing_fields on public.profiles;
create trigger protect_profile_billing_fields
  before update on public.profiles
  for each row execute function public.protect_profile_billing_fields();

-- Service role updates billing (webhooks, usage tracking)
create or replace function public.update_profile_billing(
  p_user_id uuid,
  p_subscription_status text default null,
  p_subscription_id text default null,
  p_price_id text default null,
  p_stripe_customer_id text default null,
  p_plan_id text default null,
  p_trial_ends_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    subscription_status = coalesce(p_subscription_status, subscription_status),
    subscription_id = coalesce(p_subscription_id, subscription_id),
    price_id = coalesce(p_price_id, price_id),
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
    plan_id = coalesce(p_plan_id, plan_id),
    trial_ends_at = coalesce(p_trial_ends_at, trial_ends_at),
    updated_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public.increment_scan_usage(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.profiles
  set
    scans_used_this_period = case
      when usage_period_start < (now() - interval '30 days') then 1
      else scans_used_this_period + 1
    end,
    usage_period_start = case
      when usage_period_start < (now() - interval '30 days') then now()
      else usage_period_start
    end,
    updated_at = now()
  where id = p_user_id
  returning scans_used_this_period into v_count;

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.update_profile_billing(uuid, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.increment_scan_usage(uuid) to service_role;

grant select, update on public.profiles to authenticated;
