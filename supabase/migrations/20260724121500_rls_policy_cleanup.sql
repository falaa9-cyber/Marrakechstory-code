-- MarrakechStory RLS cleanup
-- - Removes overlapping permissive policies
-- - Wraps auth.jwt() lookups in SELECT for better RLS planning

drop policy if exists "admin_settings_all" on public.admin_settings;
drop policy if exists "admin_settings_staff_read" on public.admin_settings;
create policy "admin_settings_staff_read"
  on public.admin_settings
  for select
  to authenticated
  using ((select private.is_ms_staff()));
create policy "admin_settings_admin_insert"
  on public.admin_settings
  for insert
  to authenticated
  with check ((select private.is_ms_admin()));
create policy "admin_settings_admin_update"
  on public.admin_settings
  for update
  to authenticated
  using ((select private.is_ms_admin()))
  with check ((select private.is_ms_admin()));
create policy "admin_settings_admin_delete"
  on public.admin_settings
  for delete
  to authenticated
  using ((select private.is_ms_admin()));

drop policy if exists "bookings_staff_all" on public.bookings;
drop policy if exists "bookings_client_read" on public.bookings;
create policy "bookings_read"
  on public.bookings
  for select
  to authenticated
  using (
    (select private.is_ms_staff())
    or lower(coalesce(email, '')) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
create policy "bookings_staff_insert"
  on public.bookings
  for insert
  to authenticated
  with check ((select private.is_ms_staff()));
create policy "bookings_staff_update"
  on public.bookings
  for update
  to authenticated
  using ((select private.is_ms_staff()))
  with check ((select private.is_ms_staff()));
create policy "bookings_staff_delete"
  on public.bookings
  for delete
  to authenticated
  using ((select private.is_ms_staff()));

drop policy if exists "messages_staff_all" on public.messages;
drop policy if exists "messages_client_read" on public.messages;
drop policy if exists "messages_client_send" on public.messages;
drop policy if exists "messages_client_update" on public.messages;
create policy "messages_read"
  on public.messages
  for select
  to authenticated
  using (
    (select private.is_ms_staff())
    or lower(client_email::text) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
create policy "messages_insert"
  on public.messages
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    or (
      lower(client_email::text) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and sender = 'client'
    )
  );
create policy "messages_update"
  on public.messages
  for update
  to authenticated
  using (
    (select private.is_ms_staff())
    or (
      lower(client_email::text) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and sender = 'admin'
    )
  )
  with check (
    (select private.is_ms_staff())
    or (
      lower(client_email::text) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and sender = 'admin'
    )
  );
create policy "messages_staff_delete"
  on public.messages
  for delete
  to authenticated
  using ((select private.is_ms_staff()));

drop policy if exists "staff_presence_insert" on public.staff_presence;
drop policy if exists "staff_presence_update" on public.staff_presence;
create policy "staff_presence_insert"
  on public.staff_presence
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
create policy "staff_presence_update"
  on public.staff_presence
  for update
  to authenticated
  using (
    (select private.is_ms_staff())
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  )
  with check (
    lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

drop policy if exists "admin_audit_insert" on public.admin_audit;
create policy "admin_audit_insert"
  on public.admin_audit
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    and lower(actor_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
