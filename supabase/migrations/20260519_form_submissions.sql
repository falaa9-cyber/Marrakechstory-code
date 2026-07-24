-- Marrakech Story — form submissions table.
-- Anon role can INSERT only. SELECT / UPDATE / DELETE deny by default
-- (admin reads go through the list-submissions Edge Function with
-- the service role).

create table if not exists public.form_submissions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  kind         text not null,
  name         text,
  email        text,
  phone        text,
  country      text,
  start_date   date,
  end_date     date,
  duration     int,
  trip_type    text,
  via          text,
  user_agent   text,
  source_url   text,
  payload      jsonb not null
);

create index if not exists form_submissions_created_at_idx
  on public.form_submissions (created_at desc);
create index if not exists form_submissions_email_idx
  on public.form_submissions (email);

alter table public.form_submissions enable row level security;

drop policy if exists "anon can insert" on public.form_submissions;
create policy "anon can insert"
  on public.form_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "no read for anon" on public.form_submissions;
create policy "no read for anon"
  on public.form_submissions
  for select
  to anon
  using (false);

-- pg_net trigger: forward each insert to the notify-submission Edge Function.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions, vault
as $$
declare
  v_secret text;
  v_url    text := 'https://xcpkujguvrhpsmftgxtn.supabase.co/functions/v1/notify-submission';
begin
  begin
    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'WEBHOOK_SHARED_SECRET'
    limit 1;
  exception when others then
    v_secret := null;
  end;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_form_submission on public.form_submissions;
create trigger trg_notify_form_submission
  after insert on public.form_submissions
  for each row
  execute function public.notify_form_submission();
