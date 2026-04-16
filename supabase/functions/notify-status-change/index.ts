// Supabase Edge Function: notify-status-change
// Triggered via database webhook when a content item's status changes to
// published or rejected. Emails the author (branded HTML + text) and logs an
// in-app notification.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getRecipientLocale,
  localizedUrl,
  sendBrandedEmail,
} from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const payload = await req.json();
  const { type, table, record, old_record } = payload;

  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const oldStatus = old_record.status;
  const newStatus = record.status;

  if (oldStatus === newStatus || !["published", "rejected"].includes(newStatus)) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // success_reports renamed author_id → submitted_by_user_id; other tables still use author_id.
  const authorId = record.author_id ?? record.submitted_by_user_id;
  if (!authorId) return new Response("No author", { status: 200 });

  const { data: authUser } = await supabase.auth.admin.getUserById(authorId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_status_changes")
    .eq("user_id", authorId)
    .maybeSingle();

  const shouldEmail = prefs?.email_status_changes ?? true;

  const contentType = table.replace(/_/g, " ").replace(/s$/, "");
  const approved = newStatus === "published";
  const title = approved
    ? `Your ${contentType} has been approved`
    : `Your ${contentType} has been rejected`;

  const snippet =
    record.title ??
    record.report_summary?.slice(0, 140) ??
    record.body?.slice(0, 140) ??
    "";

  // Problems use their own id as the target; child content points at its parent problem.
  const problemId = record.problem_id ?? (table === "problem_templates" ? record.id : null);
  const relativeLink = problemId ? `/problems/${problemId}` : `/dashboard`;

  await supabase.from("notifications").insert({
    user_id: authorId,
    type: "status_change",
    title,
    body: snippet,
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const locale = await getRecipientLocale(supabase, authorId);
    const ctaUrl = localizedUrl(relativeLink, locale);

    const intro = approved
      ? `Good news — your ${contentType} is now published on OpenClienting.org and visible to the community.`
      : `A moderator reviewed your ${contentType} and was unable to publish it. ` +
        (record.rejection_reason
          ? `The reason given was: ${record.rejection_reason}`
          : "You can edit and resubmit it from your dashboard.");

    await sendBrandedEmail({
      to: authUser.user.email,
      title,
      preheader: approved
        ? `Your ${contentType} is now live.`
        : `Your ${contentType} needs changes before it can be published.`,
      intro,
      detail: snippet || undefined,
      ctaText: approved ? `View your ${contentType}` : "Open your dashboard",
      ctaUrl: approved ? ctaUrl : localizedUrl("/dashboard", locale),
      footer:
        "You're receiving this because you submitted content to OpenClienting.org. " +
        "You can turn off these emails in your account settings.",
    });
  }

  return new Response("OK", { status: 200 });
});
