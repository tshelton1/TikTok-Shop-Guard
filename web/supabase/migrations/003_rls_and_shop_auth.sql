-- Shop membership helpers, signup wiring, and row-level security

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer to avoid RLS recursion)
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

-- ---------------------------------------------------------------------------
-- Signup: create app user row + default shop membership
-- ---------------------------------------------------------------------------

-- Membership is created by on_shop_created → handle_new_shop (do not insert shop_members here).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_name text;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
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

  insert into public.shops (owner_user_id, name)
  values (new.id, v_shop_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ensure shop owners are always members when a shop is created manually
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
    set role = 'owner', status = 'active';

  return new;
end;
$$;

drop trigger if exists on_shop_created on public.shops;

create trigger on_shop_created
  after insert on public.shops
  for each row execute function public.handle_new_shop();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.listings enable row level security;
alter table public.policy_rules enable row level security;
alter table public.violation_scans enable row level security;
alter table public.violations enable row level security;
alter table public.appeals enable row level security;
alter table public.appeal_documents enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view own user row" on public.users;
create policy "Users can view own user row"
  on public.users for select
  using (id = auth.uid());

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- SHOPS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view their shops" on public.shops;
create policy "Members can view their shops"
  on public.shops for select
  using (public.is_shop_member(id));

drop policy if exists "Users can create shops they own" on public.shops;
create policy "Users can create shops they own"
  on public.shops for insert
  with check (owner_user_id = auth.uid());

drop policy if exists "Admins can update their shops" on public.shops;
create policy "Admins can update their shops"
  on public.shops for update
  using (public.is_shop_admin(id))
  with check (public.is_shop_admin(id));

drop policy if exists "Owners can delete their shops" on public.shops;
create policy "Owners can delete their shops"
  on public.shops for delete
  using (owner_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- SHOP MEMBERS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view shop members" on public.shop_members;
create policy "Members can view shop members"
  on public.shop_members for select
  using (public.is_shop_member(shop_id));

drop policy if exists "Admins can add shop members" on public.shop_members;
create policy "Admins can add shop members"
  on public.shop_members for insert
  with check (public.is_shop_admin(shop_id));

drop policy if exists "Admins can update shop members" on public.shop_members;
create policy "Admins can update shop members"
  on public.shop_members for update
  using (public.is_shop_admin(shop_id))
  with check (public.is_shop_admin(shop_id));

drop policy if exists "Admins can remove shop members" on public.shop_members;
create policy "Admins can remove shop members"
  on public.shop_members for delete
  using (public.is_shop_admin(shop_id) or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- LISTINGS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view shop listings" on public.listings;
create policy "Members can view shop listings"
  on public.listings for select
  using (public.is_shop_member(shop_id));

drop policy if exists "Members can create shop listings" on public.listings;
create policy "Members can create shop listings"
  on public.listings for insert
  with check (public.is_shop_member(shop_id));

drop policy if exists "Members can update shop listings" on public.listings;
create policy "Members can update shop listings"
  on public.listings for update
  using (public.is_shop_member(shop_id))
  with check (public.is_shop_member(shop_id));

drop policy if exists "Admins can delete shop listings" on public.listings;
create policy "Admins can delete shop listings"
  on public.listings for delete
  using (public.is_shop_admin(shop_id));

-- ---------------------------------------------------------------------------
-- POLICY RULES (global + shop-scoped)
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view applicable policy rules" on public.policy_rules;
create policy "Members can view applicable policy rules"
  on public.policy_rules for select
  using (shop_id is null or public.is_shop_member(shop_id));

drop policy if exists "Admins can create shop policy rules" on public.policy_rules;
create policy "Admins can create shop policy rules"
  on public.policy_rules for insert
  with check (shop_id is not null and public.is_shop_admin(shop_id));

drop policy if exists "Admins can update shop policy rules" on public.policy_rules;
create policy "Admins can update shop policy rules"
  on public.policy_rules for update
  using (shop_id is not null and public.is_shop_admin(shop_id))
  with check (shop_id is not null and public.is_shop_admin(shop_id));

drop policy if exists "Admins can delete shop policy rules" on public.policy_rules;
create policy "Admins can delete shop policy rules"
  on public.policy_rules for delete
  using (shop_id is not null and public.is_shop_admin(shop_id));

-- ---------------------------------------------------------------------------
-- VIOLATION SCANS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view shop scans" on public.violation_scans;
create policy "Members can view shop scans"
  on public.violation_scans for select
  using (public.is_shop_member(shop_id));

drop policy if exists "Members can create shop scans" on public.violation_scans;
create policy "Members can create shop scans"
  on public.violation_scans for insert
  with check (public.is_shop_member(shop_id));

drop policy if exists "Members can update shop scans" on public.violation_scans;
create policy "Members can update shop scans"
  on public.violation_scans for update
  using (public.is_shop_member(shop_id))
  with check (public.is_shop_member(shop_id));

-- ---------------------------------------------------------------------------
-- VIOLATIONS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view shop violations" on public.violations;
create policy "Members can view shop violations"
  on public.violations for select
  using (public.is_shop_member(shop_id));

drop policy if exists "Members can create shop violations" on public.violations;
create policy "Members can create shop violations"
  on public.violations for insert
  with check (public.is_shop_member(shop_id));

drop policy if exists "Members can update shop violations" on public.violations;
create policy "Members can update shop violations"
  on public.violations for update
  using (public.is_shop_member(shop_id))
  with check (public.is_shop_member(shop_id));

-- ---------------------------------------------------------------------------
-- APPEALS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view shop appeals" on public.appeals;
create policy "Members can view shop appeals"
  on public.appeals for select
  using (public.is_shop_member(shop_id));

drop policy if exists "Members can create shop appeals" on public.appeals;
create policy "Members can create shop appeals"
  on public.appeals for insert
  with check (public.is_shop_member(shop_id));

drop policy if exists "Members can update shop appeals" on public.appeals;
create policy "Members can update shop appeals"
  on public.appeals for update
  using (public.is_shop_member(shop_id))
  with check (public.is_shop_member(shop_id));

-- ---------------------------------------------------------------------------
-- APPEAL DOCUMENTS (scoped via parent appeal)
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view appeal documents" on public.appeal_documents;
create policy "Members can view appeal documents"
  on public.appeal_documents for select
  using (
    exists (
      select 1
      from public.appeals a
      where a.id = appeal_id
        and public.is_shop_member(a.shop_id)
    )
  );

drop policy if exists "Members can upload appeal documents" on public.appeal_documents;
create policy "Members can upload appeal documents"
  on public.appeal_documents for insert
  with check (
    exists (
      select 1
      from public.appeals a
      where a.id = appeal_id
        and public.is_shop_member(a.shop_id)
    )
  );

drop policy if exists "Members can update appeal documents" on public.appeal_documents;
create policy "Members can update appeal documents"
  on public.appeal_documents for update
  using (
    exists (
      select 1
      from public.appeals a
      where a.id = appeal_id
        and public.is_shop_member(a.shop_id)
    )
  )
  with check (
    exists (
      select 1
      from public.appeals a
      where a.id = appeal_id
        and public.is_shop_member(a.shop_id)
    )
  );

-- ---------------------------------------------------------------------------
-- ALERTS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view their alerts" on public.alerts;
create policy "Users can view their alerts"
  on public.alerts for select
  using (
    user_id = auth.uid()
    or (shop_id is not null and public.is_shop_member(shop_id))
  );

drop policy if exists "Members can create shop alerts" on public.alerts;
create policy "Members can create shop alerts"
  on public.alerts for insert
  with check (
    (shop_id is null and user_id = auth.uid())
    or (shop_id is not null and public.is_shop_member(shop_id))
  );

drop policy if exists "Users can update their alerts" on public.alerts;
create policy "Users can update their alerts"
  on public.alerts for update
  using (
    user_id = auth.uid()
    or (shop_id is not null and public.is_shop_member(shop_id))
  )
  with check (
    user_id = auth.uid()
    or (shop_id is not null and public.is_shop_member(shop_id))
  );

-- ---------------------------------------------------------------------------
-- AUDIT LOGS
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view shop audit logs" on public.audit_logs;
create policy "Members can view shop audit logs"
  on public.audit_logs for select
  using (shop_id is not null and public.is_shop_member(shop_id));

drop policy if exists "Members can write shop audit logs" on public.audit_logs;
create policy "Members can write shop audit logs"
  on public.audit_logs for insert
  with check (
    shop_id is not null
    and public.is_shop_member(shop_id)
    and actor_user_id = auth.uid()
  );
