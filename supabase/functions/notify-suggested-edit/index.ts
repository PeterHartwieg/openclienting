// Supabase Edge Function: notify-suggested-edit
// Triggered via database webhook when a suggested_edit is inserted.
// Notifies the original content author.

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
  const { type, record } = payload;

  if (type !== "INSERT" || !record) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Look up the original content's author
  const tableName = targetTypeToTable[record.target_type];
  if (!tableName) return new Response("Unknown target type", { status: 200 });

  const { data: target } = await supabase
    .from(tableName)
    .select("author_id, title, body, problem_id")
    .eq("id", record.target_id)
    .maybeSingle();

  if (!target) return new Response("Target not found", { status: 200 });

  // Don't notify if the suggester is the author
  if (target.author_id === record.author_id) {
    return new Response("Self-edit, skip", { status: 200 });
  }

  // Check preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_suggested_edits")
    .eq("user_id", target.author_id)
    .maybeSingle();

  const shouldEmail = prefs?.email_suggested_edits ?? true;

  const title = `Someone suggested an edit to your ${record.target_type.replace("_", " ")}`;
  const body = target.title ?? target.body?.slice(0, 100) ?? "";
  const problemId = target.problem_id ?? record.target_id;

  // Log notification
  await supabase.from("notifications").insert({
    user_id: target.author_id,
    type: "suggested_edit",
    title,
    body,
    link: `/en/problems/${problemId}`,
  });

  // Send email
  if (shouldEmail && BREVO_API_KEY) {
    const { data: authUser } = await supabase.auth.admin.getUserById(target.author_id);
    if (authUser?.user?.email) {
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
          textContent: `${title}\n\n${body}\n\nView at: ${SITE_URL}/en/problems/${problemId}`,
        }),
      });
    }
  }

  return new Response("OK", { status: 200 });
});
