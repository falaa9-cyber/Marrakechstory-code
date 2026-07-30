-- Replace legacy public staff RPC helpers with JWT-only, SECURITY INVOKER
-- versions so cached clients can still resolve a role without exposing
-- SECURITY DEFINER functions through the public API.

create or replace function public.ms_my_role()
returns text
language sql
stable
set search_path = public
as $$
  select case
    when coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' then 'admin'
    when coalesce(lower(auth.jwt() ->> 'email'), '') = 'f.alaa@live.com' then 'admin'
    when coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'partner' then 'partner'
    else null
  end;
$$;

create or replace function public.is_ms_staff()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((select public.ms_my_role()) in ('admin', 'partner'), false);
$$;

grant execute on function public.ms_my_role() to authenticated;
grant execute on function public.is_ms_staff() to authenticated;
