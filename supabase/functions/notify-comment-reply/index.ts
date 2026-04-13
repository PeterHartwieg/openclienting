// Supabase Edge Function: notify-comment-reply
// Triggered via database webhook when a comment with parent_comment_id is inserted.
// Notifies the parent comment's author.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://openclienting.org";

Deno.serve(async (req) => {
  const payload = await req.json();
  const { type, record } = payload;

  if (type !== "INSERT" || !record || !record.parent_comment_id) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get parent comment to find the author
  const { data: parent } = await supabase
    .from("comments")
    .select("author_id, target_type, target_id")
    .eq("id", record.parent_comment_id)
    .maybeSingle();

  if (!parent) return new Response("Parent not found", { status: 200 });

  // Don't notify if replying to yourself
  if (parent.author_id === record.author_id) {
    return new Response("Self-reply, skip", { status: 200 });
  }

  // Check preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_comment_replies")
    .eq("user_id", parent.author_id)
    .maybeSingle();

  const shouldEmail = prefs?.email_comment_replies ?? true;

  const title = "Someone replied to your comment";
  const body = record.body.slice(0, 100);
  const link = `/en/problems/${parent.target_id}`;

  // Log notification
  await supabase.from("notifications").insert({
    user_id: parent.author_id,
    type: "comment_reply",
    title,
    body,
    link,
  });

  // Send email
  if (shouldEmail && BREVO_API_KEY) {
    const { data: authUser } = await supabase.auth.admin.getUserById(parent.author_id);
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
          textContent: `${title}\n\n${body}\n\nView at: ${SITE_URL}${link}`,
        }),
      });
    }
  }

  return new Response("OK", { status: 200 });
});
