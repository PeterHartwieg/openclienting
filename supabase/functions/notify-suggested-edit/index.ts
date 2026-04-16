// Supabase Edge Function: notify-suggested-edit
// Triggered via database webhook when a suggested_edit is inserted.
// Emails (branded HTML + text) and notifies the original content author.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getRecipientLocale,
  localizedUrl,
  sendBrandedEmail,
} from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  const tableName = targetTypeToTable[record.target_type];
  if (!tableName) return new Response("Unknown target type", { status: 200 });

  const { data: target } = await supabase
    .from(tableName)
    .select("author_id, title, body, problem_id")
    .eq("id", record.target_id)
    .maybeSingle();

  if (!target) return new Response("Target not found", { status: 200 });

  // Don't notify if the suggester is the author.
  if (target.author_id === record.author_id) {
    return new Response("Self-edit, skip", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_suggested_edits")
    .eq("user_id", target.author_id)
    .maybeSingle();

  const shouldEmail = prefs?.email_suggested_edits ?? true;

  const contentType = record.target_type.replace(/_/g, " ");
  const title = `Someone suggested an edit to your ${contentType}`;
  const snippet = target.title ?? target.body?.slice(0, 140) ?? "";
  const problemId = target.problem_id ?? record.target_id;
  const relativeLink = `/problems/${problemId}`;

  await supabase.from("notifications").insert({
    user_id: target.author_id,
    type: "suggested_edit",
    title,
    body: snippet.slice(0, 100),
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const { data: authUser } = await supabase.auth.admin.getUserById(target.author_id);
    if (authUser?.user?.email) {
      const locale = await getRecipientLocale(supabase, target.author_id);
      await sendBrandedEmail({
        to: authUser.user.email,
        title,
        preheader: `A suggested improvement to your ${contentType}.`,
        intro:
          `A community member has suggested an edit to your ${contentType} on OpenClienting.org. ` +
          "Review the diff and accept or reject it from the content page.",
        detail: snippet || undefined,
        ctaText: "Review the suggested edit",
        ctaUrl: localizedUrl(relativeLink, locale),
        footer:
          "You're receiving this because someone suggested an edit to content you authored. " +
          "You can turn off these emails in your account settings.",
      });
    }
  }

  return new Response("OK", { status: 200 });
});
