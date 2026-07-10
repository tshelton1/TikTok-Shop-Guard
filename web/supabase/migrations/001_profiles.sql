-- Profiles table for user metadata and Stripe subscription state
-- Canonical user profile table for TikTok Shop Guard.
-- Signup trigger (handle_new_user) is owned by 008_billing_entitlements.sql / 009.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  stripe_customer_id text unique,
  subscription_status text not null default 'inactive',
  subscription_id text,
  price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Keep updated_at fresh
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
