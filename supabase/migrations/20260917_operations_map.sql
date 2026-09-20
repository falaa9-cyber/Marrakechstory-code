-- Additive location fields for the admin operations map. Existing bookings and
-- daily_itinerary JSON remain unchanged; their existing RLS policies apply.
alter table public.bookings
  add column if not exists accommodation_name text,
  add column if not exists accommodation_address text,
  add column if not exists accommodation_latitude double precision,
  add column if not exists accommodation_longitude double precision;

comment on column public.bookings.accommodation_address is 'Operational accommodation address; distinct from the client contact address.';
comment on column public.bookings.accommodation_latitude is 'Staff-confirmed latitude, WGS84.';
comment on column public.bookings.accommodation_longitude is 'Staff-confirmed longitude, WGS84.';

-- Keep the authorized operations board current when staff edit an itinerary.
-- Existing bookings RLS still governs which change events each user may receive.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- Verified operator addresses for the existing Sahara itinerary. The JSON merge
-- is idempotent and leaves all other activities and booking fields untouched.
update public.bookings b
set daily_itinerary = (
  select jsonb_agg(jsonb_set(day, '{activities}', (
    select jsonb_agg(case
      when lower(coalesce(a->>'details','')) like '%xaluca dades%' then
        a || jsonb_build_object('address','Route de Boumalne Dadès, Boumalne 45150, Morocco','location_name','Hotel Xaluca Dades','location_source_url','https://visitxaluca.com/hotels/hotel-xaluca-dades','supplier_id','c1d85e3e-ebea-4d42-9544-11b0487503da')
      when lower(coalesce(a->>'details','')) like '%sahara stars luxury camp%' then
        a || jsonb_build_object('address','Sahara Stars Camp, BP 43, Ksar Merzouga, Morocco','location_name','Sahara Stars Luxury Camp','location_source_url','https://saharastarscamp.com/book-sahara-stars-camp/','supplier_id','25b3432e-8673-4569-8f84-99ce41bc85cd')
      else a end)
    from jsonb_array_elements(coalesce(day->'activities','[]'::jsonb)) a
  ), true)) from jsonb_array_elements(coalesce(b.daily_itinerary,'[]'::jsonb)) day
)
where b.reference = 'MS-LU2UKS';
