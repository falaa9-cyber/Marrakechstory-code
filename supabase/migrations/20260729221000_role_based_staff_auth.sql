-- Prefer app_metadata roles for admin/partner auth so email changes do not break
-- admin access. Email checks remain as a compatibility fallback.

create or replace function private.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(lower(auth.jwt() ->> 'email'), '') in (
      'f.alaa@live.com',
      coalesce((select private.ms_admin_email()), '__none__')
    );
$$;

create or replace function public.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(lower(auth.jwt() ->> 'email'), '') in (
      'f.alaa@live.com',
      coalesce((select private.ms_admin_email()), '__none__')
    );
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
    when (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'partner'
      or coalesce(lower(auth.jwt() ->> 'email'), '') = coalesce((select private.ms_partner_email()), '__none__')
    ) and not coalesce((select partner_blocked from public.admin_settings where id = 1), false) then true
    else false end;
$$;
