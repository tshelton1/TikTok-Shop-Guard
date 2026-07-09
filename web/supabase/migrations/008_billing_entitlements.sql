-- Billing plan tracking, scan usage, and protected profile fields

alter table public.profiles
  add column if not exists plan_id text not null default 'trial'
    check (plan_id in ('trial', 'starter', 'pro')),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists scans_used_this_period integer not null default 0,
  add column if not exists usage_period_start timestamptz not null default now();

create index if not exists profiles_plan_id_idx on public.profiles(plan_id);

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

-- Signup: start 14-day free trial
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
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
  );

  insert into public.users (id, status, role)
  values (new.id, 'active', 'owner')
  on conflict (id) do nothing;

  v_shop_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'shop_name'), ''),
    'My Shop'
  );

  insert into public.shops (owner_user_id, name, platform)
  values (new.id, v_shop_name, 'tiktok')
  returning id into v_shop_id;

  insert into public.shop_members (shop_id, user_id, role, status)
  values (v_shop_id, new.id, 'owner', 'active');

  return new;
end;
$$;
