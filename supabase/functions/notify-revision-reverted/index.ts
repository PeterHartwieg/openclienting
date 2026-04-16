// Supabase Edge Function: notify-revision-reverted
// Triggered via database webhook when a content_revision's revision_status
// changes to reverted. Emails (branded HTML + text) and notifies the author
// whose edit was reverted.

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
  const { type, record, old_record } = payload;

  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const oldStatus = old_record.revision_status;
  const newStatus = record.revision_status;

  if (oldStatus === newStatus || newStatus !== "reverted") {
    return new Response("OK", { status: 200 });
  }

  // Self-revert (author reviewing their own edit) — skip.
  if (record.reviewer_id && record.reviewer_id === record.author_id) {
    return new Response("Self-revert, skip", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const authorId = record.author_id;
  const { data: authUser } = await supabase.auth.admin.getUserById(authorId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_revision_reverted")
    .eq("user_id", authorId)
    .maybeSingle();

  const shouldEmail = prefs?.email_revision_reverted ?? true;

  const contentType = (record.target_type ?? "content").replace(/_/g, " ");
  const title = `Your edit to a ${contentType} was reverted`;
  const reviewerNote = record.reviewer_notes?.slice(0, 280) ?? "";

  // Resolve a link back to the content (or dashboard fallback).
  let relativeLink = "/dashboard";
  const tableName = targetTypeToTable[record.target_type];
  if (tableName && record.target_id) {
    const { data: target } = await supabase
      .from(tableName)
      .select("problem_id")
      .eq("id", record.target_id)
      .maybeSingle();
    if (target?.problem_id) {
      relativeLink = `/problems/${target.problem_id}`;
    } else if (record.target_type === "problem_template") {
      relativeLink = `/problems/${record.target_id}`;
    }
  }

  await supabase.from("notifications").insert({
    user_id: authorId,
    type: "revision_reverted",
    title,
    body: reviewerNote.slice(0, 100),
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const locale = await getRecipientLocale(supabase, authorId);
    await sendBrandedEmail({
      to: authUser.user.email,
      title,
      preheader: `A moderator reverted your recent edit to a ${contentType}.`,
      intro:
        `A moderator has reverted your recent edit to a ${contentType} on OpenClienting.org. ` +
        "You can view the current version and, if appropriate, propose the change again as a suggested edit.",
      detail: reviewerNote || undefined,
      ctaText: "View the content",
      ctaUrl: localizedUrl(relativeLink, locale),
      footer:
        "You're receiving this because an edit you made was reverted. " +
        "You can turn off these emails in your account settings.",
    });
  }

  return new Response("OK", { status: 200 });
});
