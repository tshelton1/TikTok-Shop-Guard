-- Canonicalize auth/signup around public.profiles
-- Apply this on live projects that already ran earlier migrations.
-- Safe to re-run (idempotent where possible).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Ensure profiles has billing columns
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_id text,
  add column if not exists price_id text,
  add column if not exists plan_id text not null default 'trial',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists scans_used_this_period integer not null default 0,
  add column if not exists usage_period_start timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 2) Backfill profiles from legacy users_profile
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.users_profile') is not null then
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
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3) Fix typo table shop_memebers → shop_members (if present)
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.shop_memebers') is not null
     and to_regclass('public.shop_members') is not null then
    execute $sql$
      insert into public.shop_members (shop_id, user_id, role, status, created_at, updated_at)
      select shop_id, user_id, role, status, created_at, updated_at
      from public.shop_memebers
      on conflict (shop_id, user_id) do nothing
    $sql$;
    execute 'drop table public.shop_memebers cascade';
  elsif to_regclass('public.shop_memebers') is not null
        and to_regclass('public.shop_members') is null then
    execute 'alter table public.shop_memebers rename to shop_members';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 4) Repoint user FKs to profiles
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  -- Drop FKs on shops.owner_user_id that do not reference profiles
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'shops'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%owner_user_id%'
      and pg_get_constraintdef(con.oid) not ilike '%profiles%'
  loop
    execute format('alter table public.shops drop constraint %I', r.conname);
  end loop;

  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'shops'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%owner_user_id%profiles%'
  ) then
    alter table public.shops
      add constraint shops_owner_user_id_fkey
      foreign key (owner_user_id) references public.profiles (id) on delete restrict;
  end if;

  -- Drop FKs on shop_members.user_id that do not reference profiles
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'shop_members'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%user_id%'
      and pg_get_constraintdef(con.oid) not ilike '%profiles%'
      and pg_get_constraintdef(con.oid) not ilike '%shops%'
  loop
    execute format('alter table public.shop_members drop constraint %I', r.conname);
  end loop;

  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'shop_members'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%user_id%profiles%'
  ) then
    alter table public.shop_members
      add constraint shop_members_user_id_fkey
      foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end
$$;

-- Appeals / documents created_by & uploaded_by → profiles
do $$
declare
  r record;
begin
  if to_regclass('public.appeals') is not null then
    for r in
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = 'appeals'
        and con.contype = 'f'
        and pg_get_constraintdef(con.oid) ilike '%created_by%'
        and pg_get_constraintdef(con.oid) ilike '%users_profile%'
    loop
      execute format('alter table public.appeals drop constraint %I', r.conname);
    end loop;

    if not exists (
      select 1 from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public' and rel.relname = 'appeals'
        and con.contype = 'f'
        and pg_get_constraintdef(con.oid) ilike '%created_by%profiles%'
    ) then
      alter table public.appeals
        add constraint appeals_created_by_fkey
        foreign key (created_by) references public.profiles (id) on delete set null;
    end if;
  end if;

  if to_regclass('public.appeal_documents') is not null then
    for r in
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = 'appeal_documents'
        and con.contype = 'f'
        and pg_get_constraintdef(con.oid) ilike '%uploaded_by%'
        and pg_get_constraintdef(con.oid) ilike '%users_profile%'
    loop
      execute format('alter table public.appeal_documents drop constraint %I', r.conname);
    end loop;

    if not exists (
      select 1 from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public' and rel.relname = 'appeal_documents'
        and con.contype = 'f'
        and pg_get_constraintdef(con.oid) ilike '%uploaded_by%profiles%'
    ) then
      alter table public.appeal_documents
        add constraint appeal_documents_uploaded_by_fkey
        foreign key (uploaded_by) references public.profiles (id) on delete set null;
    end if;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 5) Canonical handle_new_user + single auth.users trigger
-- ---------------------------------------------------------------------------

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
    id,
    email,
    full_name,
    plan_id,
    subscription_status,
    trial_ends_at
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
    set
      email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  v_shop_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'shop_name'), ''),
    'My Shop'
  );

  insert into public.shops (owner_user_id, name, platform)
  values (new.id, v_shop_name, 'tiktok_shop');

  -- shop_members inserted by on_shop_created → handle_new_shop
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 6) Compatibility view (optional) then drop legacy users_profile when safe
-- ---------------------------------------------------------------------------

-- App code should read public.profiles. Keep a view temporarily if needed.
drop view if exists public.users_profile_compat;
-- If users_profile is a table, leave it until FKs are gone; then drop.

do $$
begin
  -- Only drop users_profile when no remaining FKs point at it
  if to_regclass('public.users_profile') is not null
     and not exists (
       select 1
       from pg_constraint con
       join pg_class rel on rel.oid = con.confrelid
       join pg_namespace nsp on nsp.oid = rel.relnamespace
       where nsp.nspname = 'public'
         and rel.relname = 'users_profile'
         and con.contype = 'f'
     ) then
    execute 'drop table public.users_profile cascade';
  end if;
end
$$;

grant select, update on public.profiles to authenticated;
