-- Database triggers that call edge functions via pg_net
-- The edge functions URL and service role key are stored in vault secrets.
--
-- After applying this migration, set the secrets in the Supabase Dashboard:
--   1. Go to Settings > Vault
--   2. Add secret: name = "edge_functions_base_url", value = "https://wruzfhglslxgjxmbguwd.supabase.co/functions/v1"
--   3. Add secret: name = "service_role_key", value = <your service role key>
--
-- Or via SQL:
--   select vault.create_secret('https://wruzfhglslxgjxmbguwd.supabase.co/functions/v1', 'edge_functions_base_url');
--   select vault.create_secret('<key>', 'service_role_key');

create extension if not exists pg_net with schema extensions;

-- Helper to get a vault secret by name
create or replace function public._get_secret(secret_name text)
returns text as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = secret_name
  limit 1;
$$ language sql security definer stable;

-- Webhook: notify-status-change
create or replace function public.trigger_notify_status_change()
returns trigger as $$
begin
  if OLD.status is distinct from NEW.status
     and NEW.status in ('published', 'rejected') then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-status-change',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public._get_secret('service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_status_change_problem_templates
  after update of status on public.problem_templates
  for each row execute function public.trigger_notify_status_change();

create trigger on_status_change_requirements
  after update of status on public.requirements
  for each row execute function public.trigger_notify_status_change();

create trigger on_status_change_pilot_frameworks
  after update of status on public.pilot_frameworks
  for each row execute function public.trigger_notify_status_change();

create trigger on_status_change_solution_approaches
  after update of status on public.solution_approaches
  for each row execute function public.trigger_notify_status_change();

create trigger on_status_change_success_reports
  after update of status on public.success_reports
  for each row execute function public.trigger_notify_status_change();

-- Webhook: notify-comment-reply
create or replace function public.trigger_notify_comment_reply()
returns trigger as $$
begin
  if NEW.parent_comment_id is not null then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-comment-reply',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public._get_secret('service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_comment_reply
  after insert on public.comments
  for each row execute function public.trigger_notify_comment_reply();

-- Webhook: notify-suggested-edit
create or replace function public.trigger_notify_suggested_edit()
returns trigger as $$
begin
  perform net.http_post(
    url := public._get_secret('edge_functions_base_url') || '/notify-suggested-edit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public._get_secret('service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_suggested_edit
  after insert on public.suggested_edits
  for each row execute function public.trigger_notify_suggested_edit();
