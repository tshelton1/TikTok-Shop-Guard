-- Multi-tenant auth: grants and policy verification
-- Run after 001_profiles.sql, 002_core_domain.sql, 003_rls_and_shop_auth.sql

-- Allow authenticated clients to evaluate membership helpers used by RLS
grant execute on function public.is_shop_member(uuid) to authenticated;
grant execute on function public.is_shop_admin(uuid) to authenticated;
grant execute on function public.user_shop_ids() to authenticated;

-- Ensure core tenant tables are protected
alter table public.users enable row level security;
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;

-- Re-assert shop membership policies (idempotent)
drop policy if exists "Members can view their shops" on public.shops;
create policy "Members can view their shops"
  on public.shops for select
  using (public.is_shop_member(id));

drop policy if exists "Members can view shop members" on public.shop_members;
create policy "Members can view shop members"
  on public.shop_members for select
  using (public.is_shop_member(shop_id));

drop policy if exists "Users can view own user row" on public.users;
create policy "Users can view own user row"
  on public.users for select
  using (id = auth.uid());

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());
