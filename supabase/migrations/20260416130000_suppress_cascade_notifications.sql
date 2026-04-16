-- Suppress duplicate notifications during the problem-approval cascade.
--
-- When a moderator approves a problem_template, the server action also
-- auto-publishes that same author's initial requirement and pilot_framework.
-- Previously each of those status changes fired `notify-status-change` —
-- so the author received up to three emails ("problem approved" +
-- "requirement approved" + "pilot framework approved") for what is
-- conceptually a single decision.
--
-- Fix: let the trigger check a transaction-local GUC (`app.skip_notify`)
-- and return early when it's set. The cascade now runs inside a SECURITY
-- DEFINER RPC that sets the GUC before updating child rows — so the
-- problem_template UPDATE (outside the RPC) still emails normally, and
-- the cascaded child UPDATEs skip the webhook silently.
--
-- Standalone approvals of a requirement / pilot_framework (e.g. community
-- contributions to an already-published problem) continue to email as
-- before — they don't go through the RPC, so the GUC is unset.

-- ------------------------------------------------------------
-- 1) Teach the existing status-change trigger to honor app.skip_notify
-- ------------------------------------------------------------
create or replace function public.trigger_notify_status_change()
returns trigger as $$
begin
  -- Set inside cascade_approve_initial_content() to squelch redundant
  -- notifications during a problem approval cascade. `true` as the third
  -- arg to current_setting suppresses "unrecognized parameter" errors
  -- when the GUC is unset (the common case).
  if coalesce(current_setting('app.skip_notify', true), 'false') = 'true' then
    return NEW;
  end if;

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

-- ------------------------------------------------------------
-- 2) RPC for the cascade: sets GUC, then updates children
-- ------------------------------------------------------------
-- Called from src/app/[locale]/moderate/actions.ts immediately after the
-- problem_templates.status update. Only moderators/admins can invoke it;
-- the caller's role check is enforced in the server action already, and
-- the function runs security-definer to bypass RLS on the child tables.
create or replace function public.cascade_approve_initial_content(p_problem_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  -- Suppress notify-status-change webhooks for the child rows we're about
  -- to update. Transaction-local so it naturally resets at commit.
  perform set_config('app.skip_notify', 'true', true);

  select author_id into v_author_id
  from problem_templates
  where id = p_problem_id;

  if v_author_id is null then
    return;
  end if;

  update requirements
  set status = 'published'
  where problem_id = p_problem_id
    and author_id = v_author_id
    and status = 'submitted';

  update pilot_frameworks
  set status = 'published'
  where problem_id = p_problem_id
    and author_id = v_author_id
    and status = 'submitted';
end;
$$;

revoke all on function public.cascade_approve_initial_content(uuid) from public;
grant execute on function public.cascade_approve_initial_content(uuid) to authenticated;
