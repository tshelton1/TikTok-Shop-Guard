-- EMERGENCY signup fix v2 for TikTok Shop Guard
-- Paste ONLY this SQL into Supabase → SQL Editor → Run
-- Do NOT paste the filename

-- ---------------------------------------------------------------------------
-- 0) Ensure profiles exists
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  stripe_customer_id text,
  subscription_status text not null default 'inactive',
  subscription_id text,
  price_id text,
  plan_id text not null default 'trial',
  trial_ends_at timestamptz,
  scans_used_this_period integer not null default 0,
  usage_period_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_id text,
  add column if not exists price_id text,
  add column if not exists plan_id text,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists scans_used_this_period integer,
  add column if not exists usage_period_start timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- ---------------------------------------------------------------------------
-- 1) Ensure shops has the columns signup needs
-- ---------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  name text not null default 'My Shop',
  platform text not null default 'tiktok_shop',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shops
  add column if not exists owner_user_id uuid,
  add column if not exists name text,
  add column if not exists platform text,
  add column if not exists status text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.shops set name = coalesce(nullif(name, ''), 'My Shop') where name is null;
update public.shops set platform = coalesce(nullif(platform, ''), 'tiktok_shop') where platform is null;
update public.shops set status = coalesce(nullif(status, ''), 'active') where status is null;

-- ---------------------------------------------------------------------------
-- 2) Ensure shop_members exists (correct spelling)
-- ---------------------------------------------------------------------------
create table if not exists public.shop_members (
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

alter table public.shop_members
  add column if not exists role text,
  add column if not exists status text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- If typo table exists, copy rows then drop it
do $$
begin
  if to_regclass('public.shop_memebers') is not null then
    begin
      insert into public.shop_members (shop_id, user_id, role, status)
      select shop_id, user_id, coalesce(role, 'owner'), coalesce(status, 'active')
      from public.shop_memebers
      on conflict do nothing;
    exception when others then
      raise notice 'Could not copy shop_memebers rows: %', sqlerrm;
    end;
    drop table public.shop_memebers cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Backfill profiles from users_profile if present
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.users_profile') is not null then
    insert into public.profiles (id, email, full_name, plan_id, subscription_status, trial_ends_at)
    select up.id, up.email, up.full_name, 'trial', 'trialing', now() + interval '14 days'
    from public.users_profile up
    where not exists (select 1 from public.profiles p where p.id = up.id)
    on conflict (id) do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Attach FKs only after columns exist (and only if not already present)
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  -- shops.owner_user_id → profiles
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'shops' and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ilike '%owner_user_id%'
  loop
    execute format('alter table public.shops drop constraint %I', r.conname);
  end loop;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shops' and column_name = 'owner_user_id'
  ) then
    -- Clear orphan owners that are not in profiles
    update public.shops s
    set owner_user_id = null
    where owner_user_id is not null
      and not exists (select 1 from public.profiles p where p.id = s.owner_user_id);

    alter table public.shops
      add constraint shops_owner_user_id_fkey
      foreign key (owner_user_id) references public.profiles(id) on delete restrict;
  end if;

  -- shop_members.user_id → profiles
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'shop_members' and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ilike '%user_id%'
      and pg_get_constraintdef(c.oid) not ilike '%shops%'
  loop
    execute format('alter table public.shop_members drop constraint %I', r.conname);
  end loop;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_members' and column_name = 'user_id'
  ) then
    delete from public.shop_members sm
    where not exists (select 1 from public.profiles p where p.id = sm.user_id);

    alter table public.shop_members
      add constraint shop_members_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5) Shop membership trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_shop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is not null then
    insert into public.shop_members (shop_id, user_id, role, status)
    values (new.id, new.owner_user_id, 'owner', 'active')
    on conflict (shop_id, user_id) do update
      set role = 'owner', status = 'active', updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_shop_created on public.shops;
create trigger on_shop_created
  after insert on public.shops
  for each row execute function public.handle_new_shop();

-- ---------------------------------------------------------------------------
-- 6) Canonical signup trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_name text;
begin
  insert into public.profiles (
    id, email, full_name, plan_id, subscription_status, trial_ends_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'trial',
    'trialing',
    now() + interval '14 days'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

  v_shop_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'shop_name'), ''),
    'My Shop'
  );

  insert into public.shops (owner_user_id, name, platform, status)
  values (new.id, v_shop_name, 'tiktok_shop', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
