// Supabase Edge Function: notify-success-report-decision
// Triggered via database webhook when a success report's verification_status
// changes to verified or rejected.
// Notifies the report author.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://openclienting.org";

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

  // Check notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_success_report_decisions")
    .eq("user_id", authorId)
    .maybeSingle();

  const shouldEmail = prefs?.email_success_report_decisions ?? true;

  const title = newStatus === "verified"
    ? "Your success report has been verified"
    : "Your success report was rejected";

  const body = record.report_summary?.slice(0, 100) ?? "";

  // Resolve problem_id via solution_approach
  let link: string | null = null;
  if (record.solution_approach_id) {
    const { data: approach } = await supabase
      .from("solution_approaches")
      .select("problem_id")
      .eq("id", record.solution_approach_id)
      .maybeSingle();

    if (approach?.problem_id) {
      link = `/en/problems/${approach.problem_id}`;
    }
  }

  // Log notification
  await supabase.from("notifications").insert({
    user_id: authorId,
    type: "success_report_decision",
    title,
    body,
    link,
  });

  // Send email if enabled
  if (shouldEmail && BREVO_API_KEY) {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "OpenClienting", email: "noreply@openclienting.org" },
        to: [{ email: authUser.user.email }],
        subject: title,
        textContent: `${title}\n\n${body}\n\nView at: ${SITE_URL}${link ?? "/en/dashboard"}`,
      }),
    });
  }

  return new Response("OK", { status: 200 });
});
