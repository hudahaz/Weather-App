-- Run once in the Supabase SQL editor before enabling location-specific BIT.
-- Existing reports remain readable: the browser falls back to operation_reports.bit.
alter table public.operation_reports
  add column if not exists location_bits jsonb not null default '{}'::jsonb;

-- Preserve the original BIT for existing code and legacy reports.
-- Populate the JSON mapping for older reports that only have one BIT.
update public.operation_reports r
set location_bits = coalesce((
  select jsonb_object_agg(loc, r.bit)
  from jsonb_array_elements_text(to_jsonb(r.locations)) as loc
), '{}'::jsonb)
where location_bits = '{}'::jsonb and bit is not null;

comment on column public.operation_reports.location_bits
is 'Map of location name to per-location BIT; bit column retains compatibility with existing consumers.';
