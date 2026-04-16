-- Email notifications: add 2 new preferences, 2 new notification types, 2 new webhooks.
--
-- New events:
--   * notify-new-solution          — fires when a solution_approach is published;
--                                    emails the problem author so they know someone
--                                    posted a solution on their problem.
--   * notify-new-success-report    — fires when a success_report is published;
--                                    emails the problem author AND the solution author
--                                    (dedup inside the edge function).
--
-- These are separate from the existing status_change / success_report_decision
-- notifications, which target the submitter of the content. The new events target
-- the OWNER of the parent content.

-- ------------------------------------------------------------
-- 1) New preference columns
-- ------------------------------------------------------------
alter table public.notification_preferences
  add column if not exists email_new_solution_on_problem boolean not null default true,
  add column if not exists email_new_success_report_on_content boolean not null default true;

-- ------------------------------------------------------------
-- 2) Widen notifications.type check to include the new types
-- ------------------------------------------------------------
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'status_change',
    'suggested_edit',
    'comment_reply',
    'verification_outcome',
    'success_report_decision',
    'revision_reverted',
    'new_solution_on_problem',
    'new_success_report_on_content'
  ));

-- ------------------------------------------------------------
-- 3) Webhook: notify-new-solution
-- Fires on solution_approaches.status transition to 'published'.
-- ------------------------------------------------------------
create or replace function public.trigger_notify_new_solution_on_problem()
returns trigger as $$
begin
  if OLD.status is distinct from NEW.status and NEW.status = 'published' then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-new-solution',
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

drop trigger if exists on_new_solution_published on public.solution_approaches;
create trigger on_new_solution_published
  after update of status on public.solution_approaches
  for each row execute function public.trigger_notify_new_solution_on_problem();

-- ------------------------------------------------------------
-- 4) Webhook: notify-new-success-report
-- Fires on success_reports.status transition to 'published'.
-- ------------------------------------------------------------
create or replace function public.trigger_notify_new_success_report_on_content()
returns trigger as $$
begin
  if OLD.status is distinct from NEW.status and NEW.status = 'published' then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-new-success-report',
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

drop trigger if exists on_new_success_report_published on public.success_reports;
create trigger on_new_success_report_published
  after update of status on public.success_reports
  for each row execute function public.trigger_notify_new_success_report_on_content();
