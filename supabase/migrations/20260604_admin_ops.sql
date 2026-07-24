-- MarrakechStory Admin / Operations system (ported from Marrakechstory-Admin Firestore app).
-- 4 tables: clients, suppliers, tasks, bookings. RLS locked to the admin email only.
-- Admin email: f.alaa9@gmail.com  (enforced via public.is_ms_admin()).
-- Applied to project xcpkujguvrhpsmftgxtn on 2026-06-04.
-- See admin.jsx (window.MS_AdminMount) for the front-end that consumes these.

create or replace function public.is_ms_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'f.alaa9@gmail.com';
$$;

-- clients, suppliers, tasks, bookings tables + RLS (admin-only).
-- Full DDL lives in the applied migration `admin_ops_tables`.
-- Policies: <table>_admin_all FOR ALL TO authenticated USING (is_ms_admin()).
-- form_submissions / subscribers: admin SELECT; form_submissions admin UPDATE/DELETE.
