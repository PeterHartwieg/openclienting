-- Phase 6: Notification triggers for verification outcomes, success report decisions,
-- revision reverts, and abuse control function for repeated bad edits.

--------------------------------------------------------------------------------
-- 1. Organization verification outcome
--------------------------------------------------------------------------------
create or replace function public.trigger_notify_org_verification_outcome()
returns trigger as $$
begin
  if OLD.verification_status is distinct from NEW.verification_status
     and NEW.verification_status in ('verified', 'rejected') then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-verification-outcome',
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

create trigger on_org_verification_outcome
  after update of verification_status on public.organizations
  for each row execute function public.trigger_notify_org_verification_outcome();

--------------------------------------------------------------------------------
-- 2. Membership outcome (approved / rejected)
--------------------------------------------------------------------------------
create or replace function public.trigger_notify_membership_outcome()
returns trigger as $$
begin
  if OLD.membership_status is distinct from NEW.membership_status
     and NEW.membership_status in ('active', 'rejected') then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-verification-outcome',
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

create trigger on_membership_outcome
  after update of membership_status on public.organization_memberships
  for each row execute function public.trigger_notify_membership_outcome();

--------------------------------------------------------------------------------
-- 3. Success report verification decision
--------------------------------------------------------------------------------
create or replace function public.trigger_notify_success_report_decision()
returns trigger as $$
begin
  if OLD.verification_status is distinct from NEW.verification_status
     and NEW.verification_status in ('verified', 'rejected') then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-success-report-decision',
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

create trigger on_success_report_decision
  after update of verification_status on public.success_reports
  for each row execute function public.trigger_notify_success_report_decision();

--------------------------------------------------------------------------------
-- 4. Revision reverted
--------------------------------------------------------------------------------
create or replace function public.trigger_notify_revision_reverted()
returns trigger as $$
begin
  if OLD.revision_status is distinct from NEW.revision_status
     and NEW.revision_status = 'reverted' then
    perform net.http_post(
      url := public._get_secret('edge_functions_base_url') || '/notify-revision-reverted',
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

create trigger on_revision_reverted
  after update of revision_status on public.content_revisions
  for each row execute function public.trigger_notify_revision_reverted();

--------------------------------------------------------------------------------
-- 5. Abuse control: count recent reverted revisions for a user
--------------------------------------------------------------------------------
create or replace function public.count_recent_reverted_revisions(
  p_user_id uuid,
  p_window interval default interval '30 days'
)
returns integer as $$
  select count(*)::integer
  from public.content_revisions
  where author_id = p_user_id
    and revision_status = 'reverted'
    and reviewed_at > now() - p_window;
$$ language sql security definer stable;
