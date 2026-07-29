-- Update MarrakechStory's default admin email helpers to the new owner address.
-- The live admin email still comes from public.admin_settings.admin_email when set;
-- this just removes the old Gmail fallback from helper functions and defaults.

update public.admin_settings
set admin_email = 'f.alaa@live.com'
where id = 1
  and lower(coalesce(admin_email, '')) in ('', 'f.alaa9@gmail.com');

create or replace function private.is_ms_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in (
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
  select coalesce(lower(auth.jwt() ->> 'email'), '') in (
    'f.alaa@live.com',
    coalesce((select private.ms_admin_email()), '__none__')
  );
$$;
