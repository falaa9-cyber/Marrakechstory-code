-- MarrakechStory hardening pass
-- - Moves staff helper functions into a private schema for RLS use
-- - Removes public execution from privileged helper/trigger functions
-- - Makes booking-files private and restricts storage access to staff
-- - Replaces permissive policies on public-facing tables with validated checks
-- - Wraps helper calls in SELECT to reduce per-row RLS overhead

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'f.alaa9@gmail.com';
$$;

create or replace function private.ms_partner_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(lower(coalesce((select partner_email from public.admin_settings where id = 1), '')), '');
$$;

create or replace function private.is_ms_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select private.is_ms_admin()) then true
    when coalesce(lower(auth.jwt() ->> 'email'), '') = coalesce((select private.ms_partner_email()), '__none__')
         and not coalesce((select partner_blocked from public.admin_settings where id = 1), false) then true
    else false end;
$$;

create or replace function public.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'f.alaa9@gmail.com';
$$;

create or replace function public.safe_int(t text, fallback integer default 0)
returns integer
language plpgsql
immutable
set search_path = public
as $$
begin
  return coalesce(nullif(regexp_replace(coalesce(t, ''), '[^0-9-]', '', 'g'), '')::int, fallback);
exception when others then
  return fallback;
end
$$;

drop policy if exists "admin_settings_all" on public.admin_settings;
drop policy if exists "admin_settings_staff_read" on public.admin_settings;
create policy "admin_settings_all"
  on public.admin_settings
  for all
  to authenticated
  using ((select private.is_ms_admin()))
  with check ((select private.is_ms_admin()));
create policy "admin_settings_staff_read"
  on public.admin_settings
  for select
  to authenticated
  using ((select private.is_ms_staff()));

drop policy if exists "app_secrets_admin" on public.app_secrets;
create policy "app_secrets_admin"
  on public.app_secrets
  for all
  to authenticated
  using ((select private.is_ms_admin()))
  with check ((select private.is_ms_admin()));

drop policy if exists "automation_log_admin_all" on public.automation_log;
create policy "automation_log_admin_all"
  on public.automation_log
  for all
  to authenticated
  using ((select private.is_ms_admin()))
  with check ((select private.is_ms_admin()));

drop policy if exists "bookings_admin_all" on public.bookings;
drop policy if exists "bookings_staff_all" on public.bookings;
drop policy if exists "bookings_client_read" on public.bookings;
create policy "bookings_staff_all"
  on public.bookings
  for all
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));
create policy "bookings_client_read"
  on public.bookings
  for select
  to authenticated
  using (
    lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or (select private.is_ms_staff())
  );

drop policy if exists "clients_admin_all" on public.clients;
drop policy if exists "clients_staff_all" on public.clients;
create policy "clients_staff_all"
  on public.clients
  for all
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));

drop policy if exists "suppliers_admin_all" on public.suppliers;
drop policy if exists "suppliers_staff_all" on public.suppliers;
create policy "suppliers_staff_all"
  on public.suppliers
  for all
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));

drop policy if exists "tasks_admin_all" on public.tasks;
drop policy if exists "tasks_staff_all" on public.tasks;
create policy "tasks_staff_all"
  on public.tasks
  for all
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));

drop policy if exists "form_submissions_admin_delete" on public.form_submissions;
drop policy if exists "form_submissions_admin_read" on public.form_submissions;
drop policy if exists "form_submissions_admin_write" on public.form_submissions;
drop policy if exists "form_submissions_staff_delete" on public.form_submissions;
drop policy if exists "form_submissions_staff_read" on public.form_submissions;
drop policy if exists "form_submissions_staff_update" on public.form_submissions;
drop policy if exists "anon can insert" on public.form_submissions;
create policy "anon can insert"
  on public.form_submissions
  for insert
  to anon, authenticated
  with check (
    kind in ('itinerary', 'quickbook', 'tweak', 'collaboration')
    and (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
    and coalesce(length(name), 0) <= 160
    and coalesce(length(phone), 0) <= 80
    and coalesce(length(country), 0) <= 80
    and coalesce(length(via), 0) <= 120
    and coalesce(length(user_agent), 0) <= 400
    and coalesce(length(source_url), 0) <= 400
    and (payload is not null and jsonb_typeof(payload) = 'object')
  );
create policy "form_submissions_staff_read"
  on public.form_submissions
  for select
  to authenticated
  using ((select private.is_ms_staff()));
create policy "form_submissions_staff_update"
  on public.form_submissions
  for update
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));
create policy "form_submissions_staff_delete"
  on public.form_submissions
  for delete
  to authenticated
  using ((select private.is_ms_staff()));

drop policy if exists "messages_admin_all" on public.messages;
drop policy if exists "messages_staff_all" on public.messages;
drop policy if exists "messages_client_read" on public.messages;
drop policy if exists "messages_client_send" on public.messages;
drop policy if exists "messages_client_update" on public.messages;
create policy "messages_staff_all"
  on public.messages
  for all
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));
create policy "messages_client_read"
  on public.messages
  for select
  to authenticated
  using (lower(client_email::text) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy "messages_client_send"
  on public.messages
  for insert
  to authenticated
  with check (
    lower(client_email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and sender = 'client'
  );
create policy "messages_client_update"
  on public.messages
  for update
  to authenticated
  using (
    lower(client_email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and sender = 'admin'
  )
  with check (
    lower(client_email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and sender = 'admin'
  );

drop policy if exists "page_views_admin_read" on public.page_views;
drop policy if exists "page_views_staff_read" on public.page_views;
drop policy if exists "page_views_insert" on public.page_views;
drop policy if exists "page_views_update" on public.page_views;
create policy "page_views_staff_read"
  on public.page_views
  for select
  to authenticated
  using ((select private.is_ms_staff()));
create policy "page_views_insert"
  on public.page_views
  for insert
  to anon, authenticated
  with check (
    id is not null
    and coalesce(length(session_id), 0) between 1 and 120
    and coalesce(length(device), 0) <= 32
    and coalesce(length(country), 0) <= 100
    and coalesce(length(country_code), 0) <= 10
    and coalesce(length(city), 0) <= 120
    and coalesce(length(referrer), 0) <= 200
    and coalesce(length(lang), 0) <= 12
    and coalesce(length(landing), 0) <= 300
    and coalesce(length(user_agent), 0) <= 400
    and (sections is null or jsonb_typeof(sections) = 'array')
    and coalesce(duration_seconds, 0) between 0 and 172800
  );
create policy "page_views_update"
  on public.page_views
  for update
  to anon, authenticated
  using (
    id is not null
    and created_at > now() - interval '2 days'
    and coalesce(length(session_id), 0) between 1 and 120
  )
  with check (
    id is not null
    and created_at > now() - interval '2 days'
    and updated_at >= created_at
    and coalesce(length(session_id), 0) between 1 and 120
    and coalesce(length(device), 0) <= 32
    and coalesce(length(country), 0) <= 100
    and coalesce(length(country_code), 0) <= 10
    and coalesce(length(city), 0) <= 120
    and coalesce(length(referrer), 0) <= 200
    and coalesce(length(lang), 0) <= 12
    and coalesce(length(landing), 0) <= 300
    and coalesce(length(user_agent), 0) <= 400
    and (sections is null or jsonb_typeof(sections) = 'array')
    and coalesce(duration_seconds, 0) between 0 and 172800
  );

drop policy if exists "staff_presence_insert" on public.staff_presence;
drop policy if exists "staff_presence_select" on public.staff_presence;
drop policy if exists "staff_presence_update" on public.staff_presence;
create policy "staff_presence_insert"
  on public.staff_presence
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
create policy "staff_presence_select"
  on public.staff_presence
  for select
  to authenticated
  using ((select private.is_ms_staff()));
create policy "staff_presence_update"
  on public.staff_presence
  for update
  to authenticated
  using (
    (select private.is_ms_staff())
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "admin_audit_admin_read" on public.admin_audit;
drop policy if exists "admin_audit_insert" on public.admin_audit;
create policy "admin_audit_admin_read"
  on public.admin_audit
  for select
  to authenticated
  using ((select private.is_ms_admin()));
create policy "admin_audit_insert"
  on public.admin_audit
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    and lower(actor_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "subscribers_admin_read" on public.subscribers;
drop policy if exists "anon can insert subscribers" on public.subscribers;
drop policy if exists "anon can update by email" on public.subscribers;
create policy "subscribers_admin_read"
  on public.subscribers
  for select
  to authenticated
  using ((select private.is_ms_admin()));
create policy "anon can insert subscribers"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (
    email is not null
    and email::text ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and coalesce(length(name), 0) <= 160
    and coalesce(length(phone), 0) <= 80
    and coalesce(length(country), 0) <= 80
    and coalesce(length(source), 0) <= 120
    and coalesce(length(user_agent), 0) <= 400
    and last_seen_at > now() - interval '365 days'
    and last_seen_at < now() + interval '10 minutes'
    and coalesce(visit_count, 0) between 0 and 100000
    and (payload is not null and jsonb_typeof(payload) = 'object')
  );

update storage.buckets
set public = false
where id = 'booking-files';

drop policy if exists "booking_files_public_read" on storage.objects;
drop policy if exists "booking_files_select" on storage.objects;
drop policy if exists "booking_files_insert" on storage.objects;
drop policy if exists "booking_files_update" on storage.objects;
drop policy if exists "booking_files_delete" on storage.objects;
create policy "booking_files_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'booking-files'
    and (select private.is_ms_staff())
    and (
      name ~ '^[0-9a-f-]{36}/.+'
      or name ~ '^collab/[0-9a-f-]{36}/.+'
    )
  );
create policy "booking_files_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'booking-files'
    and (select private.is_ms_staff())
    and (
      name ~ '^[0-9a-f-]{36}/.+'
      or name ~ '^collab/[0-9a-f-]{36}/.+'
    )
  );
create policy "booking_files_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'booking-files'
    and (select private.is_ms_staff())
    and (
      name ~ '^[0-9a-f-]{36}/.+'
      or name ~ '^collab/[0-9a-f-]{36}/.+'
    )
  )
  with check (
    bucket_id = 'booking-files'
    and (select private.is_ms_staff())
    and (
      name ~ '^[0-9a-f-]{36}/.+'
      or name ~ '^collab/[0-9a-f-]{36}/.+'
    )
  );
create policy "booking_files_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'booking-files'
    and (select private.is_ms_staff())
    and (
      name ~ '^[0-9a-f-]{36}/.+'
      or name ~ '^collab/[0-9a-f-]{36}/.+'
    )
  );

revoke execute on function public.is_ms_staff() from public, anon, authenticated;
revoke execute on function public.ms_partner_email() from public, anon, authenticated;
revoke execute on function public.ms_my_role() from public, anon, authenticated;
revoke execute on function public.notify_form_submission() from public, anon, authenticated;
revoke execute on function public.route_form_submission() from public, anon, authenticated;
