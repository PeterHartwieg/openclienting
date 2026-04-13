// Supabase Edge Function: notify-revision-reverted
// Triggered via database webhook when a content_revision's revision_status
// changes to reverted. Notifies the author whose edit was reverted.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://openclienting.org";

const targetTypeToTable: Record<string, string> = {
  problem_template: "problem_templates",
  requirement: "requirements",
  pilot_framework: "pilot_frameworks",
  solution_approach: "solution_approaches",
};

Deno.serve(async (req) => {
  const payload = await req.json();
  const { type, record, old_record } = payload;

  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const oldStatus = old_record.revision_status;
  const newStatus = record.revision_status;

  if (oldStatus === newStatus || newStatus !== "reverted") {
    return new Response("OK", { status: 200 });
  }

  // Don't notify if the reviewer is the author (self-revert)
  if (record.reviewer_id && record.reviewer_id === record.author_id) {
    return new Response("Self-revert, skip", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const authorId = record.author_id;
  const { data: authUser } = await supabase.auth.admin.getUserById(authorId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  // Check notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_revision_reverted")
    .eq("user_id", authorId)
    .maybeSingle();

  const shouldEmail = prefs?.email_revision_reverted ?? true;

  const contentType = (record.target_type ?? "content").replace(/_/g, " ");
  const title = `Your edit to a ${contentType} was reverted`;
  const body = record.reviewer_notes?.slice(0, 100) ?? "";

  // Resolve problem_id from the target content
  let link: string | null = null;
  const tableName = targetTypeToTable[record.target_type];
  if (tableName && record.target_id) {
    const { data: target } = await supabase
      .from(tableName)
      .select("problem_id")
      .eq("id", record.target_id)
      .maybeSingle();

    if (target?.problem_id) {
      link = `/en/problems/${target.problem_id}`;
    } else if (record.target_type === "problem_template") {
      link = `/en/problems/${record.target_id}`;
    }
  }

  // Log notification
  await supabase.from("notifications").insert({
    user_id: authorId,
    type: "revision_reverted",
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
