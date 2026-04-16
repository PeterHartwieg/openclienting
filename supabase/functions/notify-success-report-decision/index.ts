// Supabase Edge Function: notify-success-report-decision
// Triggered via database webhook when a success report's verification_status
// changes to verified or rejected. Emails (branded HTML + text) and notifies
// the report author.

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
  const { type, record, old_record } = payload;

  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const oldStatus = old_record.verification_status;
  const newStatus = record.verification_status;

  if (oldStatus === newStatus || !["verified", "rejected"].includes(newStatus)) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const authorId = record.submitted_by_user_id;
  const { data: authUser } = await supabase.auth.admin.getUserById(authorId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_success_report_decisions")
    .eq("user_id", authorId)
    .maybeSingle();

  const shouldEmail = prefs?.email_success_report_decisions ?? true;

  const verified = newStatus === "verified";
  const title = verified
    ? "Your success report has been verified"
    : "Your success report was rejected";

  const snippet = record.report_summary?.slice(0, 280) ?? "";

  // Resolve problem_id via solution_approach.
  let relativeLink = "/dashboard";
  if (record.solution_approach_id) {
    const { data: approach } = await supabase
      .from("solution_approaches")
      .select("problem_id")
      .eq("id", record.solution_approach_id)
      .maybeSingle();
    if (approach?.problem_id) {
      relativeLink = `/problems/${approach.problem_id}`;
    }
  }

  await supabase.from("notifications").insert({
    user_id: authorId,
    type: "success_report_decision",
    title,
    body: snippet.slice(0, 100),
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const locale = await getRecipientLocale(supabase, authorId);
    const intro = verified
      ? "A moderator has verified the success report you submitted. It now contributes to the " +
        "trust score of the solution and is visible as a verified case study."
      : "A moderator reviewed your success report and was unable to verify it at this time. " +
        "You can edit and resubmit it from your dashboard.";

    await sendBrandedEmail({
      to: authUser.user.email,
      title,
      preheader: verified
        ? "Your success report is now a verified case study."
        : "Your success report could not be verified.",
      intro,
      detail: snippet || undefined,
      ctaText: verified ? "View the solution page" : "Open your dashboard",
      ctaUrl: verified
        ? localizedUrl(relativeLink, locale)
        : localizedUrl("/dashboard", locale),
      footer:
        "You're receiving this because you submitted a success report. " +
        "You can turn off these emails in your account settings.",
    });
  }

  return new Response("OK", { status: 200 });
});
