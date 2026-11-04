-- Run in the existing project's Supabase SQL Editor before deploying location/BIT entry.
-- Existing reports retain NULL and use their legacy report-wide BIT until edited.
begin;
alter table public.operation_reports add column if not exists location_bits jsonb;
create or replace function public.valid_report_location_bits(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare entry jsonb;
begin
  if value is null then return true; end if;
  if jsonb_typeof(value) <> 'array' then return false; end if;
  if jsonb_array_length(value) not between 1 and 20 then return false; end if;
  for entry in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(entry) <> 'object'
      or jsonb_typeof(entry->'location') is distinct from 'string'
      or jsonb_typeof(entry->'bit') is distinct from 'string'
      or length(btrim(entry->>'location')) not between 1 and 300
      or length(btrim(entry->>'bit')) not between 1 and 100 then return false;
    end if;
  end loop;
  return true;
end;
$$;
alter table public.operation_reports drop constraint if exists operation_reports_location_bits_check;
alter table public.operation_reports add constraint operation_reports_location_bits_check
  check (public.valid_report_location_bits(location_bits));
notify pgrst, 'reload schema';
commit;
