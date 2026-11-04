-- Safe additive schema migration for location-specific BIT.
-- Run in the SQL Editor of the intended Supabase project.
-- Existing reports are not updated: avoids firing validate_operation_report().
-- Client falls back to the existing bit field for legacy reports.

alter table public.operation_reports
  add column if not exists location_bits jsonb not null default '{}'::jsonb;

comment on column public.operation_reports.location_bits
is 'Map of location name to per-location BIT; existing rows use the bit fallback.';
