-- WhatsApp data is canonical operational data. Keep it private, but let the
-- authenticated MarrakechStory admin read and manage it. Webhook writes still
-- use the server-side service role and remain outside the browser surface.
do $$
declare t text;
begin
  foreach t in array array['whatsapp_contacts','whatsapp_conversations','whatsapp_messages','whatsapp_send_audit'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_ms_admin()) with check (public.is_ms_admin())', t || '_admin_all', t);
  end loop;
end $$;
