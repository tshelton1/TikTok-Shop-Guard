-- TikTok Shop Guard — initial auth & multi-tenant schema
-- DEPRECATED for new installs: prefer 001_profiles.sql → 009_canonicalize_profiles_auth.sql.
-- Canonical user table is public.profiles (not users_profile).
-- This file no longer installs on_auth_user_created / handle_new_user (see 008 + 009).
-- If you already ran 001_profiles.sql … 003_rls_and_shop_auth.sql, skip this file.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

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
  if not exists (select 1 from pg_type where typname = 'shop_status') then
    create type public.shop_status as enum ('active', 'paused', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('active', 'invited', 'suspended', 'deleted');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- users_profile (extends auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_profile_set_updated_at on public.users_profile;
create trigger users_profile_set_updated_at
  before update on public.users_profile
  for each row execute function public.set_updated_at();

create index if not exists users_profile_email_idx on public.users_profile (email);

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  status public.shop_status not null default 'active',
  name text not null,
  platform text not null default 'tiktok_shop',
  external_shop_id text,
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

create index if not exists shops_owner_idx on public.shops (owner_user_id);
create index if not exists shops_status_idx on public.shops (status);

-- ---------------------------------------------------------------------------
-- shop_members
-- ---------------------------------------------------------------------------

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

drop trigger if exists shop_members_set_updated_at on public.shop_members;
create trigger shop_members_set_updated_at
  before update on public.shop_members
  for each row execute function public.set_updated_at();

create index if not exists shop_members_user_idx on public.shop_members (user_id);
create index if not exists shop_members_shop_idx on public.shop_members (shop_id);

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer — avoids RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_shop_member(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members sm
    where sm.shop_id = p_shop_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
  );
$$;

create or replace function public.is_shop_admin(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members sm
    where sm.shop_id = p_shop_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role in ('owner', 'admin')
  );
$$;

create or replace function public.user_shop_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select sm.shop_id
  from public.shop_members sm
  where sm.user_id = auth.uid()
    and sm.status = 'active';
$$;

grant execute on function public.is_shop_member(uuid) to authenticated;
grant execute on function public.is_shop_admin(uuid) to authenticated;
grant execute on function public.user_shop_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger intentionally omitted here.
-- Canonical handle_new_user lives in 008_billing_entitlements.sql / 009.
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

-- Ensure owners are members when shops are created manually
create or replace function public.handle_new_shop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.shop_members (shop_id, user_id, role, status)
  values (new.id, new.owner_user_id, 'owner', 'active')
  on conflict (shop_id, user_id) do update
    set role = 'owner', status = 'active', updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_shop_created on public.shops;
create trigger on_shop_created
  after insert on public.shops
  for each row execute function public.handle_new_shop();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users_profile enable row level security;
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;

-- users_profile: own row only
drop policy if exists "Users can view own profile" on public.users_profile;
create policy "Users can view own profile"
  on public.users_profile for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users_profile;
create policy "Users can update own profile"
  on public.users_profile for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- shops: members can read; admins can update
drop policy if exists "Members can view their shops" on public.shops;
create policy "Members can view their shops"
  on public.shops for select
  to authenticated
  using (public.is_shop_member(id));

drop policy if exists "Authenticated users can create shops" on public.shops;
create policy "Authenticated users can create shops"
  on public.shops for insert
  to authenticated
  with check (auth.uid() = owner_user_id);

drop policy if exists "Admins can update their shops" on public.shops;
create policy "Admins can update their shops"
  on public.shops for update
  to authenticated
  using (public.is_shop_admin(id))
  with check (public.is_shop_admin(id));

-- shop_members: members of the same shop can read; admins manage
drop policy if exists "Members can view shop membership" on public.shop_members;
create policy "Members can view shop membership"
  on public.shop_members for select
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "Admins can add shop members" on public.shop_members;
create policy "Admins can add shop members"
  on public.shop_members for insert
  to authenticated
  with check (public.is_shop_admin(shop_id));

drop policy if exists "Admins can update shop members" on public.shop_members;
create policy "Admins can update shop members"
  on public.shop_members for update
  to authenticated
  using (public.is_shop_admin(shop_id))
  with check (public.is_shop_admin(shop_id));

drop policy if exists "Admins can remove shop members" on public.shop_members;
create policy "Admins can remove shop members"
  on public.shop_members for delete
  to authenticated
  using (public.is_shop_admin(shop_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, update on public.users_profile to authenticated;
grant select, insert, update on public.shops to authenticated;
grant select, insert, update, delete on public.shop_members to authenticated;
