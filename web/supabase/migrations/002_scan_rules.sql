-- TikTok Shop Guard — policy scan rules
-- Greenfield: run after 001_initial.sql
-- Idempotent — safe to re-run. Coexists with listing_scan_rules (005) if present.

create extension if not exists pgcrypto;

-- Reuse updated_at helper from 001_initial when available
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
-- scan_rules
-- ---------------------------------------------------------------------------

create table if not exists public.scan_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  severity text not null check (severity in ('high', 'medium', 'low')),
  condition_type text not null check (
    condition_type in (
      'title_restricted_claim',
      'description_restricted_claim',
      'category_mismatch',
      'price_pattern',
      'image_text_warning'
    )
  ),
  condition_value jsonb not null default '{}'::jsonb,
  remediation_tip text not null,
  active boolean not null default true,
  blocks_publish boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists scan_rules_set_updated_at on public.scan_rules;
create trigger scan_rules_set_updated_at
  before update on public.scan_rules
  for each row execute function public.set_updated_at();

create index if not exists scan_rules_active_idx on public.scan_rules (active);
create index if not exists scan_rules_condition_idx on public.scan_rules (condition_type);

alter table public.scan_rules enable row level security;

drop policy if exists "Authenticated users can read active scan rules" on public.scan_rules;
create policy "Authenticated users can read active scan rules"
  on public.scan_rules for select
  to authenticated
  using (active = true);

grant select on public.scan_rules to authenticated;

-- ---------------------------------------------------------------------------
-- Seed default policy rules (skip if already seeded)
-- ---------------------------------------------------------------------------

insert into public.scan_rules (
  name,
  severity,
  condition_type,
  condition_value,
  remediation_tip,
  active,
  blocks_publish
)
select *
from (
  values
    (
      'Medical cure claim in title',
      'high',
      'title_restricted_claim',
      '{"pattern": "\\\\b(cure|cures|heal|heals|treats)\\\\b", "flags": "i", "rewrite_from": "\\\\b(cure|cures|heal|heals|treats)\\\\b", "rewrite_to": "supports"}'::jsonb,
      'Remove medical cure language from the title. Use phrasing like "supports" instead.',
      true,
      true
    ),
    (
      'Unverified FDA claim in title',
      'high',
      'title_restricted_claim',
      '{"pattern": "\\\\b(fda approved|fda-approved)\\\\b", "flags": "i", "rewrite_from": "\\\\b(FDA approved|FDA-approved)\\\\b", "rewrite_to": ""}'::jsonb,
      'Do not reference FDA approval in the title without documented proof.',
      true,
      true
    ),
    (
      'Unsubstantiated superlative in title',
      'medium',
      'title_restricted_claim',
      '{"pattern": "\\\\b(#1|best|top rated|miracle)\\\\b", "flags": "i", "rewrite_from": "\\\\b(#1|best|top rated|miracle)\\\\b", "rewrite_to": ""}'::jsonb,
      'Remove superlatives from the title unless substantiated with proof.',
      true,
      false
    ),
    (
      'Absolute guarantee in description',
      'medium',
      'description_restricted_claim',
      '{"pattern": "\\\\b(100%|guaranteed|guarantee|money back)\\\\b", "flags": "i", "rewrite_from": "\\\\b(guaranteed|100%)\\\\b", "rewrite_to": "designed to"}'::jsonb,
      'Replace absolute guarantees with qualified statements.',
      true,
      false
    ),
    (
      'Restricted health outcome in description',
      'high',
      'description_restricted_claim',
      '{"pattern": "\\\\b(weight loss|lose weight|fat burn|clinically proven)\\\\b", "flags": "i"}'::jsonb,
      'Health outcome claims are restricted. Focus on product features.',
      true,
      true
    ),
    (
      'Beauty keywords in wrong category',
      'medium',
      'category_mismatch',
      '{"keywords": ["serum", "moisturizer", "skincare", "vitamin c", "spf"], "disallowed_categories": ["electronics", "home", "fashion", "food"]}'::jsonb,
      'Move to Beauty & Personal Care or remove beauty-specific terms.',
      true,
      false
    ),
    (
      'Electronics keywords in wrong category',
      'medium',
      'category_mismatch',
      '{"keywords": ["bluetooth", "earbuds", "charger", "watt", "usb-c"], "disallowed_categories": ["beauty", "food", "health", "fashion"]}'::jsonb,
      'Move to Electronics or remove tech-specific terms.',
      true,
      false
    ),
    (
      'Invalid or zero price',
      'high',
      'price_pattern',
      '{"min": 0.01}'::jsonb,
      'Set a valid price greater than zero before publishing.',
      true,
      true
    ),
    (
      'Unusually high price',
      'low',
      'price_pattern',
      '{"max": 500}'::jsonb,
      'High-ticket items may require additional seller verification.',
      true,
      false
    ),
    (
      'Image text overlay indicator',
      'medium',
      'image_text_warning',
      '{"pattern": "text|overlay|banner|promo", "flags": "i"}'::jsonb,
      'Use clean product photos without heavy promotional text overlays.',
      true,
      false
    ),
    (
      'Before/after image indicator',
      'high',
      'image_text_warning',
      '{"pattern": "before.?after|results|transformation", "flags": "i"}'::jsonb,
      'Avoid before/after imagery in beauty and health categories.',
      true,
      false
    ),
    (
      'Missing product images',
      'high',
      'image_text_warning',
      '{"min": 1}'::jsonb,
      'Upload at least one clear product image before publishing.',
      true,
      true
    )
) as seed(name, severity, condition_type, condition_value, remediation_tip, active, blocks_publish)
where not exists (select 1 from public.scan_rules limit 1);
