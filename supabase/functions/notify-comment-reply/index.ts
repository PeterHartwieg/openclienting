// Supabase Edge Function: notify-comment-reply
// Triggered via database webhook when a comment with parent_comment_id is
// inserted. Emails (branded HTML + text) and notifies the parent comment's author.

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
  const { type, record } = payload;

  if (type !== "INSERT" || !record || !record.parent_comment_id) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: parent } = await supabase
    .from("comments")
    .select("author_id, target_type, target_id")
    .eq("id", record.parent_comment_id)
    .maybeSingle();

  if (!parent) return new Response("Parent not found", { status: 200 });

  // Don't notify on self-reply.
  if (parent.author_id === record.author_id) {
    return new Response("Self-reply, skip", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_comment_replies")
    .eq("user_id", parent.author_id)
    .maybeSingle();

  const shouldEmail = prefs?.email_comment_replies ?? true;

  const title = "Someone replied to your comment";
  const snippet = (record.body ?? "").slice(0, 280);
  const relativeLink = `/problems/${parent.target_id}`;

  await supabase.from("notifications").insert({
    user_id: parent.author_id,
    type: "comment_reply",
    title,
    body: snippet.slice(0, 100),
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const { data: authUser } = await supabase.auth.admin.getUserById(parent.author_id);
    if (authUser?.user?.email) {
      const locale = await getRecipientLocale(supabase, parent.author_id);
      await sendBrandedEmail({
        to: authUser.user.email,
        title,
        preheader: "A new reply in a discussion you're part of.",
        intro: "Someone just replied to a comment you posted on OpenClienting.org:",
        detail: snippet || undefined,
        ctaText: "View the discussion",
        ctaUrl: localizedUrl(relativeLink, locale),
        footer:
          "You're receiving this because someone replied to your comment. " +
          "You can turn off these emails in your account settings.",
      });
    }
  }

  return new Response("OK", { status: 200 });
});
