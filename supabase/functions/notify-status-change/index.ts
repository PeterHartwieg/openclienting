// Supabase Edge Function: notify-status-change
// Triggered via database webhook when a content item's status changes to published or rejected.
// Sends an email to the author and logs a notification.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://openclienting.org";

Deno.serve(async (req) => {
  const payload = await req.json();
  const { type, table, record, old_record } = payload;

  // Only handle status changes
  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const oldStatus = old_record.status;
  const newStatus = record.status;

  if (oldStatus === newStatus || !["published", "rejected"].includes(newStatus)) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get author user ID (success_reports uses submitted_by_user_id, others use author_id)
  const authorId = record.author_id ?? record.submitted_by_user_id;
  const { data: authUser } = await supabase.auth.admin.getUserById(authorId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  // Check notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_status_changes")
    .eq("user_id", authorId)
    .maybeSingle();

  const shouldEmail = prefs?.email_status_changes ?? true;

  const contentType = table.replace("_", " ").replace(/s$/, "");
  const title = newStatus === "published"
    ? `Your ${contentType} has been approved`
    : `Your ${contentType} has been rejected`;

  const body = record.title ?? record.report_summary?.slice(0, 100) ?? record.body?.slice(0, 100) ?? "";

  // Log notification
  await supabase.from("notifications").insert({
    user_id: authorId,
    type: "status_change",
    title,
    body,
    link: record.problem_id ? `/en/problems/${record.problem_id}` : null,
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
        textContent: `${title}\n\n${body}\n\nView at: ${SITE_URL}/en/problems/${record.problem_id ?? record.id}`,
      }),
    });
  }

  return new Response("OK", { status: 200 });
});
