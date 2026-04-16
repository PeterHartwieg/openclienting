// Supabase Edge Function: notify-new-success-report
// Triggered when a success_report.status transitions to 'published'.
// Notifies the PROBLEM author and the SOLUTION author (if different) that a
// success report was published about their content.
// The report's own submitter is handled by notify-status-change / notify-success-report-decision.

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

  if (old_record.status === record.status || record.status !== "published") {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Resolve the solution + its parent problem so we know whom to notify.
  const { data: approach } = await supabase
    .from("solution_approaches")
    .select("id, problem_id, author_id, title")
    .eq("id", record.solution_approach_id)
    .maybeSingle();

  if (!approach) return new Response("Solution not found", { status: 200 });

  const { data: problem } = await supabase
    .from("problem_templates")
    .select("author_id, title")
    .eq("id", approach.problem_id)
    .maybeSingle();

  if (!problem) return new Response("Problem not found", { status: 200 });

  const reporterId = record.submitted_by_user_id;
  const relativeLink = `/problems/${approach.problem_id}`;
  const reportSnippet = (record.body ?? record.report_summary ?? "").slice(0, 280);

  // Collect unique recipients: problem author, solution author — excluding the reporter.
  const recipientIds = new Set<string>();
  if (problem.author_id && problem.author_id !== reporterId) {
    recipientIds.add(problem.author_id);
  }
  if (approach.author_id && approach.author_id !== reporterId) {
    recipientIds.add(approach.author_id);
  }

  for (const recipientId of recipientIds) {
    const isProblemAuthor = recipientId === problem.author_id;
    const isSolutionAuthor = recipientId === approach.author_id;

    // Per-recipient preference & email address.
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_new_success_report_on_content")
      .eq("user_id", recipientId)
      .maybeSingle();

    const shouldEmail = prefs?.email_new_success_report_on_content ?? true;

    const roleLabel = isProblemAuthor && isSolutionAuthor
      ? "your problem and solution"
      : isProblemAuthor
        ? "your problem"
        : "your solution";

    const title = `A new success report was posted about ${roleLabel}`;

    await supabase.from("notifications").insert({
      user_id: recipientId,
      type: "new_success_report_on_content",
      title,
      body: reportSnippet.slice(0, 100),
      link: `/en${relativeLink}`,
    });

    if (shouldEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(recipientId);
      if (authUser?.user?.email) {
        const locale = await getRecipientLocale(supabase, recipientId);
        await sendBrandedEmail({
          to: authUser.user.email,
          title,
          preheader: `A new success report references ${roleLabel} on OpenClienting.`,
          intro:
            `Someone on OpenClienting.org just published a success report about ${roleLabel} ` +
            `(problem: “${problem.title ?? ""}”). Take a look — verified success reports improve ` +
            "the trust score of solutions.",
          detail: reportSnippet || undefined,
          ctaText: "View the problem page",
          ctaUrl: localizedUrl(relativeLink, locale),
          footer:
            "You're receiving this because the report references content you authored. " +
            "You can turn off these emails in your account settings.",
        });
      }
    }
  }

  return new Response("OK", { status: 200 });
});
