-- TikTok Shop Guard — appeal document storage (Supabase Storage)
-- Greenfield: run after 003_violations_appeals.sql
-- Idempotent. Supersedes 007_appeal_document_storage.sql on fresh installs.

-- ---------------------------------------------------------------------------
-- appeal_documents metadata columns
-- ---------------------------------------------------------------------------

alter table public.appeal_documents
  add column if not exists document_type text
    check (document_type in ('screenshot', 'invoice', 'authenticity', 'other')),
  add column if not exists storage_path text;

create index if not exists appeal_documents_storage_path_idx
  on public.appeal_documents (storage_path)
  where storage_path is not null;

drop policy if exists "Members can delete appeal documents" on public.appeal_documents;
create policy "Members can delete appeal documents"
  on public.appeal_documents for delete
  to authenticated
  using (
    exists (
      select 1
      from public.appeals a
      where a.id = appeal_id
        and public.is_shop_member(a.shop_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket (private — access via RLS + signed URLs)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'appeal-documents',
  'appeal-documents',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Shop-scoped storage access (first path segment = shop_id)
-- ---------------------------------------------------------------------------

create or replace function public.appeal_storage_shop_allowed(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  shop_part text;
  shop_uuid uuid;
begin
  shop_part := split_part(object_name, '/', 1);

  if shop_part is null or shop_part = '' then
    return false;
  end if;

  -- Preview/dev mock shops (e.g. shop-1) — any signed-in user
  if shop_part like 'shop-%' then
    return auth.uid() is not null;
  end if;

  begin
    shop_uuid := shop_part::uuid;
  exception
    when others then
      return false;
  end;

  return public.is_shop_member(shop_uuid);
end;
$$;

grant execute on function public.appeal_storage_shop_allowed(text) to authenticated;

drop policy if exists "Shop members can read appeal documents storage" on storage.objects;
create policy "Shop members can read appeal documents storage"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'appeal-documents'
    and public.appeal_storage_shop_allowed(name)
  );

drop policy if exists "Shop members can upload appeal documents storage" on storage.objects;
create policy "Shop members can upload appeal documents storage"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'appeal-documents'
    and public.appeal_storage_shop_allowed(name)
  );

drop policy if exists "Shop members can update appeal documents storage" on storage.objects;
create policy "Shop members can update appeal documents storage"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'appeal-documents'
    and public.appeal_storage_shop_allowed(name)
  )
  with check (
    bucket_id = 'appeal-documents'
    and public.appeal_storage_shop_allowed(name)
  );

drop policy if exists "Shop members can delete appeal documents storage" on storage.objects;
create policy "Shop members can delete appeal documents storage"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'appeal-documents'
    and public.appeal_storage_shop_allowed(name)
  );
