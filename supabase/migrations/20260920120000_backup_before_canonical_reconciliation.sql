-- Additive production snapshot taken before canonical data reconciliation.
-- This migration never deletes or overwrites public production rows.
create schema if not exists ms_backup_20260920;
create table if not exists ms_backup_20260920.bookings as table public.bookings;
create table if not exists ms_backup_20260920.clients as table public.clients;
create table if not exists ms_backup_20260920.form_submissions as table public.form_submissions;
create table if not exists ms_backup_20260920.suppliers as table public.suppliers;
create table if not exists ms_backup_20260920.tasks as table public.tasks;
create table if not exists ms_backup_20260920.messages as table public.messages;
create table if not exists ms_backup_20260920.whatsapp_contacts as table public.whatsapp_contacts;
create table if not exists ms_backup_20260920.whatsapp_conversations as table public.whatsapp_conversations;
create table if not exists ms_backup_20260920.whatsapp_messages as table public.whatsapp_messages;
create table if not exists ms_backup_20260920.whatsapp_send_audit as table public.whatsapp_send_audit;
create table if not exists ms_backup_20260920.automation_log as table public.automation_log;
create table if not exists ms_backup_20260920.admin_settings as table public.admin_settings;
create table if not exists ms_backup_20260920.staff_presence as table public.staff_presence;
create table if not exists ms_backup_20260920.admin_audit as table public.admin_audit;
create table if not exists ms_backup_20260920.backup_metadata (
  id integer primary key default 1,
  created_at timestamptz not null default now(),
  source_project_ref text not null,
  note text not null
);
insert into ms_backup_20260920.backup_metadata(id, source_project_ref, note)
values (1, 'xcpkujguvrhpsmftgxtn', 'Additive snapshot before canonical data reconciliation')
on conflict (id) do update set created_at = excluded.created_at, source_project_ref = excluded.source_project_ref, note = excluded.note;
