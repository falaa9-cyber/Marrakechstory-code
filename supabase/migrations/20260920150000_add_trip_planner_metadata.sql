-- Additive planner metadata. The existing bookings.daily_itinerary JSON remains canonical
-- so older and newer booking records remain compatible.
alter table public.bookings add column if not exists planner_preferences jsonb not null default '{}'::jsonb;
alter table public.bookings add column if not exists trip_generation_status text not null default 'idle' check (trip_generation_status in ('idle','queued','running','completed','failed'));
create index if not exists bookings_trip_generation_status_idx on public.bookings (trip_generation_status);
