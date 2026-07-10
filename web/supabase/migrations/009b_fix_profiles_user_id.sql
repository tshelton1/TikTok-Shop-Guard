-- FIX: profiles.user_id is NOT NULL on your live schema
-- Paste this entire script into Supabase SQL Editor → Run
-- Do NOT paste the filename

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_name text;
  v_has_user_id boolean;
  v_has_owner_user_id boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
  ) into v_has_user_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shops' and column_name = 'owner_user_id'
  ) into v_has_owner_user_id;

  -- Insert profile; include user_id when that column exists on your live table
  if v_has_user_id then
    insert into public.profiles (
      id, user_id, email, full_name, plan_id, subscription_status, trial_ends_at
    )
    values (
      new.id,
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
          user_id = coalesce(public.profiles.user_id, excluded.user_id),
          updated_at = now();
  else
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
  end if;

  v_shop_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'shop_name'), ''),
    'My Shop'
  );

  if v_has_owner_user_id then
    insert into public.shops (owner_user_id, name, platform, status)
    values (new.id, v_shop_name, 'tiktok_shop', 'active');
  else
    -- Fallback if shops has no owner_user_id: create shop then membership manually
    insert into public.shops (name, platform, status)
    values (v_shop_name, 'tiktok_shop', 'active');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
