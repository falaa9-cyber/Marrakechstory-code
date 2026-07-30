-- Bring legacy public auth helpers in line with the current role-based staff auth.
-- This keeps older cached admin clients working while matching the newer
-- private helper logic used by RLS policies.

create or replace function public.is_ms_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select private.is_ms_admin()) then true
    when (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'partner'
      or coalesce(lower(auth.jwt() ->> 'email'), '') = coalesce((select private.ms_partner_email()), '__none__')
    ) and not coalesce((select partner_blocked from public.admin_settings where id = 1), false) then true
    else false
  end;
$$;

create or replace function public.ms_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select private.is_ms_admin()) then 'admin'
    when (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'partner'
      or coalesce(lower(auth.jwt() ->> 'email'), '') = coalesce((select private.ms_partner_email()), '__none__')
    ) and not coalesce((select partner_blocked from public.admin_settings where id = 1), false) then 'partner'
    else null
  end;
$$;

grant execute on function public.is_ms_staff() to authenticated;
grant execute on function public.ms_my_role() to authenticated;
