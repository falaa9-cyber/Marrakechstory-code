-- MarrakechStory helper for cached JWT email lookups in RLS policies

create or replace function private.current_user_email()
returns text
language sql
stable
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

drop policy if exists "bookings_read" on public.bookings;
create policy "bookings_read"
  on public.bookings
  for select
  to authenticated
  using (
    (select private.is_ms_staff())
    or lower(coalesce(email, '')) = (select private.current_user_email())
  );

drop policy if exists "messages_read" on public.messages;
drop policy if exists "messages_insert" on public.messages;
drop policy if exists "messages_update" on public.messages;
create policy "messages_read"
  on public.messages
  for select
  to authenticated
  using (
    (select private.is_ms_staff())
    or lower(client_email::text) = (select private.current_user_email())
  );
create policy "messages_insert"
  on public.messages
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    or (
      lower(client_email::text) = (select private.current_user_email())
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
      lower(client_email::text) = (select private.current_user_email())
      and sender = 'admin'
    )
  )
  with check (
    (select private.is_ms_staff())
    or (
      lower(client_email::text) = (select private.current_user_email())
      and sender = 'admin'
    )
  );

drop policy if exists "staff_presence_insert" on public.staff_presence;
drop policy if exists "staff_presence_update" on public.staff_presence;
create policy "staff_presence_insert"
  on public.staff_presence
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    and lower(email) = (select private.current_user_email())
  );
create policy "staff_presence_update"
  on public.staff_presence
  for update
  to authenticated
  using (
    (select private.is_ms_staff())
    and lower(email) = (select private.current_user_email())
  )
  with check (
    lower(email) = (select private.current_user_email())
  );

drop policy if exists "admin_audit_insert" on public.admin_audit;
create policy "admin_audit_insert"
  on public.admin_audit
  for insert
  to authenticated
  with check (
    (select private.is_ms_staff())
    and lower(actor_email) = (select private.current_user_email())
  );
