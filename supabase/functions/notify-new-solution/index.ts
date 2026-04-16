// Supabase Edge Function: notify-new-solution
// Triggered when a solution_approach.status transitions to 'published'.
// Notifies the PROBLEM author that a new solution was posted on their problem.
// (The solution author themselves is notified by notify-status-change.)

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

  const { data: problem } = await supabase
    .from("problem_templates")
    .select("author_id, title")
    .eq("id", record.problem_id)
    .maybeSingle();

  if (!problem) return new Response("Problem not found", { status: 200 });

  // Don't notify authors who posted a solution on their own problem.
  if (problem.author_id === record.author_id) {
    return new Response("Self-solution, skip", { status: 200 });
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(problem.author_id);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_new_solution_on_problem")
    .eq("user_id", problem.author_id)
    .maybeSingle();

  const shouldEmail = prefs?.email_new_solution_on_problem ?? true;

  const title = "A new solution was posted on your problem";
  const solutionTitle = record.title ?? "";
  const solutionDescription = (record.description ?? "").slice(0, 280);
  const snippetForNotification = solutionTitle.slice(0, 100);
  const relativeLink = `/problems/${record.problem_id}`;

  await supabase.from("notifications").insert({
    user_id: problem.author_id,
    type: "new_solution_on_problem",
    title,
    body: snippetForNotification,
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const locale = await getRecipientLocale(supabase, problem.author_id);
    await sendBrandedEmail({
      to: authUser.user.email,
      title,
      preheader: `A new solution was added to “${problem.title ?? "your problem"}”.`,
      intro:
        `Someone just published a new solution approach for your problem “${problem.title ?? ""}” on OpenClienting.org. ` +
        "Take a look and join the discussion.",
      detail: solutionTitle
        ? solutionDescription
          ? `${solutionTitle}\n\n${solutionDescription}`
          : solutionTitle
        : solutionDescription || undefined,
      ctaText: "View the problem page",
      ctaUrl: localizedUrl(relativeLink, locale),
      footer:
        "You're receiving this because you're the author of the problem. " +
        "You can turn off these emails in your account settings.",
    });
  }

  return new Response("OK", { status: 200 });
});
