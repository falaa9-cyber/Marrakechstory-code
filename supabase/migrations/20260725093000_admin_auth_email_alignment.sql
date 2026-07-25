-- Align admin authentication with a configurable admin email instead of a
-- single hard-coded address. Keeps the legacy Gmail admin working as a fallback
-- while allowing the current owner login to be configured in admin_settings.

alter table public.admin_settings
  add column if not exists admin_email text;

update public.admin_settings
set admin_email = lower(coalesce(nullif(admin_email, ''), 'f.alaa@live.com'))
where id = 1;

create or replace function private.ms_admin_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(lower(coalesce((select admin_email from public.admin_settings where id = 1), '')), '');
$$;

create or replace function private.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in (
    'f.alaa9@gmail.com',
    coalesce((select private.ms_admin_email()), '__none__')
  );
$$;

create or replace function public.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in (
    'f.alaa9@gmail.com',
    coalesce((select private.ms_admin_email()), '__none__')
  );
$$;
