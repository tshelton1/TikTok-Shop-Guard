-- Listing scan rules: editable rule engine configuration
create table if not exists public.listing_scan_rules (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  severity text not null check (severity in ('high', 'medium', 'low')),
  condition_type text not null check (
    condition_type in (
      'title_regex',
      'description_regex',
      'combined_regex',
      'restricted_claim',
      'price_below_min',
      'price_above_max',
      'price_invalid',
      'category_mismatch',
      'title_min_length',
      'description_min_length',
      'image_filename_regex',
      'image_count_below_min'
    )
  ),
  condition_value jsonb not null default '{}'::jsonb,
  remediation_tip text not null,
  active boolean not null default true,
  blocks_publish boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists listing_scan_rules_set_updated_at on public.listing_scan_rules;
create trigger listing_scan_rules_set_updated_at
  before update on public.listing_scan_rules
  for each row execute function public.set_updated_at();

create index if not exists listing_scan_rules_shop_idx on public.listing_scan_rules(shop_id);
create index if not exists listing_scan_rules_active_idx on public.listing_scan_rules(active);
create index if not exists listing_scan_rules_condition_idx on public.listing_scan_rules(condition_type);

alter table public.listing_scan_rules enable row level security;

drop policy if exists "Members can view listing scan rules" on public.listing_scan_rules;
create policy "Members can view listing scan rules"
  on public.listing_scan_rules for select
  using (shop_id is null or public.is_shop_member(shop_id));

drop policy if exists "Admins can manage shop listing scan rules" on public.listing_scan_rules;
create policy "Admins can manage shop listing scan rules"
  on public.listing_scan_rules for all
  using (shop_id is not null and public.is_shop_admin(shop_id))
  with check (shop_id is not null and public.is_shop_admin(shop_id));

-- Global default rules (shop_id = null)
insert into public.listing_scan_rules (
  name, severity, condition_type, condition_value, remediation_tip, active, blocks_publish
) values
  (
    'Medical cure claim',
    'high',
    'restricted_claim',
    '{"pattern": "\\\\b(cure|cures|heal|heals)\\\\b", "flags": "i", "rewrite_from": "\\\\b(cure|cures|heal|heals)\\\\b", "rewrite_to": "support"}'::jsonb,
    'Remove medical cure language. Use phrasing like "supports" or "helps maintain" instead.',
    true,
    true
  ),
  (
    'Unverified FDA claim',
    'high',
    'restricted_claim',
    '{"pattern": "\\\\b(fda approved|fda-approved)\\\\b", "flags": "i", "rewrite_from": "\\\\b(FDA approved|FDA-approved)\\\\b", "rewrite_to": "formulated for daily use"}'::jsonb,
    'Do not reference FDA approval unless you have documented proof on file.',
    true,
    true
  ),
  (
    'Absolute guarantee language',
    'medium',
    'combined_regex',
    '{"pattern": "\\\\b(100%|guaranteed|guarantee)\\\\b", "flags": "i", "rewrite_from": "\\\\b(guaranteed|100%)\\\\b", "rewrite_to": "designed to"}'::jsonb,
    'Replace absolute guarantees with qualified statements such as "designed to" or "may help".',
    true,
    false
  ),
  (
    'Unsubstantiated superlative',
    'medium',
    'title_regex',
    '{"pattern": "\\\\b(#1|best|top rated)\\\\b", "flags": "i", "rewrite_from": "\\\\b(#1|best|top rated)\\\\b", "rewrite_to": ""}'::jsonb,
    'Remove superlatives unless substantiated with verifiable proof.',
    true,
    false
  ),
  (
    'Restricted health outcome claim',
    'high',
    'restricted_claim',
    '{"pattern": "\\\\b(weight loss|lose weight|fat burn)\\\\b", "flags": "i"}'::jsonb,
    'Health outcome claims are restricted. Focus on product features instead of results.',
    true,
    true
  ),
  (
    'Title too short',
    'low',
    'title_min_length',
    '{"min": 10}'::jsonb,
    'Expand the title with product type, size, and key attributes.',
    true,
    false
  ),
  (
    'Description lacks detail',
    'medium',
    'description_min_length',
    '{"min": 50}'::jsonb,
    'Add materials, usage instructions, and compliance-friendly product details.',
    true,
    false
  ),
  (
    'Invalid price',
    'high',
    'price_invalid',
    '{"min": 0.01}'::jsonb,
    'Set a valid price greater than zero before publishing.',
    true,
    true
  ),
  (
    'High price point',
    'low',
    'price_above_max',
    '{"max": 500}'::jsonb,
    'High-ticket items may require additional seller verification on TikTok Shop.',
    true,
    false
  ),
  (
    'Beauty keywords in non-beauty category',
    'medium',
    'category_mismatch',
    '{"keywords": ["serum", "moisturizer", "skincare", "vitamin c", "spf"], "disallowed_categories": ["electronics", "home", "fashion"]}'::jsonb,
    'Move this listing to Beauty & Personal Care or remove beauty-specific terms.',
    true,
    false
  ),
  (
    'Electronics keywords in non-electronics category',
    'medium',
    'category_mismatch',
    '{"keywords": ["bluetooth", "earbuds", "charger", "watt", "usb-c"], "disallowed_categories": ["beauty", "food", "health"]}'::jsonb,
    'Move this listing to Electronics or remove tech-specific terms.',
    true,
    false
  ),
  (
    'Before/after image filename',
    'high',
    'image_filename_regex',
    '{"pattern": "before.?after|results", "flags": "i"}'::jsonb,
    'Avoid before/after imagery in beauty and health categories.',
    true,
    false
  ),
  (
    'Image text overlay filename',
    'medium',
    'image_filename_regex',
    '{"pattern": "text|overlay|banner", "flags": "i"}'::jsonb,
    'Use clean product photos without heavy text overlays.',
    true,
    false
  ),
  (
    'Missing product images',
    'high',
    'image_count_below_min',
    '{"min": 1}'::jsonb,
    'Upload at least one clear product image before publishing.',
    true,
    true
  );
