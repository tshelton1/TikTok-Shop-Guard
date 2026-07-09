-- Extend violations and appeals for appeal packet workflow

alter table public.violations
  add column if not exists issue_category text,
  add column if not exists listing_title text,
  add column if not exists appeal_deadline_at timestamptz;

alter table public.appeals
  add column if not exists issue_category text,
  add column if not exists recommended_response text,
  add column if not exists evidence_checklist jsonb not null default '[]'::jsonb,
  add column if not exists draft_message text,
  add column if not exists deadline_at timestamptz,
  add column if not exists supporting_docs_notes text;

-- One active draft appeal per violation (optional uniqueness for drafts)
create unique index if not exists appeals_violation_draft_uidx
  on public.appeals(violation_id)
  where status = 'draft';

comment on column public.appeals.evidence_checklist is
  'Array of { "id": string, "label": string, "required": boolean, "checked": boolean }';

comment on column public.appeals.draft_message is
  'User-editable appeal message draft';
