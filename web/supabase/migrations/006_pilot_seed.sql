-- Pilot seed: sample scan rules for first-run policy checks
-- Safe to re-run (upserts by rule key)

insert into public.scan_rules (
  id,
  rule_key,
  name,
  description,
  category,
  severity,
  enabled,
  evaluator_type,
  config
)
values
  (
    gen_random_uuid(),
    'health_claim_title',
    'Health claim in title',
    'Flags medical or curative language in product titles.',
    'health_claims',
    5,
    true,
    'title_claims',
    '{"patterns":["cure","treat","heal","FDA approved"]}'::jsonb
  ),
  (
    gen_random_uuid(),
    'category_mismatch_beauty',
    'Beauty category mismatch',
    'Detects electronics or supplement keywords in beauty listings.',
    'category',
    3,
    true,
    'category_mismatch',
    '{"expected_category":"beauty","blocked_keywords":["bluetooth","speaker","protein"]}'::jsonb
  ),
  (
    gen_random_uuid(),
    'promo_image_filename',
    'Promotional image filename',
    'Warns when image filenames suggest overlays or sale text.',
    'images',
    2,
    true,
    'image_filename',
    '{"blocked_tokens":["sale","free","%","discount"]}'::jsonb
  )
on conflict (rule_key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  severity = excluded.severity,
  enabled = excluded.enabled,
  evaluator_type = excluded.evaluator_type,
  config = excluded.config,
  updated_at = now();
