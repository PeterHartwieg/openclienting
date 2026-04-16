// Supabase Edge Function: notify-verification-outcome
// Triggered via database webhook when an organization's verification_status
// or a membership's membership_status changes to a terminal state. Emails
// (branded HTML + text) and notifies the org creator or the requesting user.

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
  const { type, table, record, old_record } = payload;

  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let recipientId: string;
  let title: string;
  let intro: string;
  let preheader: string;
  let detail: string | undefined;
  let approved: boolean;

  if (table === "organizations") {
    const oldStatus = old_record.verification_status;
    const newStatus = record.verification_status;

    if (oldStatus === newStatus || !["verified", "rejected"].includes(newStatus)) {
      return new Response("OK", { status: 200 });
    }

    recipientId = record.created_by;
    approved = newStatus === "verified";
    title = approved
      ? "Your organization has been verified"
      : "Your organization verification was rejected";
    preheader = approved
      ? `${record.name ?? "Your organization"} is now verified on OpenClienting.`
      : `Your verification request for ${record.name ?? "your organization"} was rejected.`;
    intro = approved
      ? `Your organization “${record.name ?? ""}” has been reviewed and verified. ` +
        "Your submissions and those of verified members will now display the organization's trust signals."
      : `Your organization “${record.name ?? ""}” could not be verified at this time. ` +
        "You can update the organization details and request verification again from your dashboard.";
    detail = undefined;
  } else if (table === "organization_memberships") {
    const oldStatus = old_record.membership_status;
    const newStatus = record.membership_status;

    if (oldStatus === newStatus || !["active", "rejected"].includes(newStatus)) {
      return new Response("OK", { status: 200 });
    }

    recipientId = record.user_id;
    approved = newStatus === "active";

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", record.organization_id)
      .maybeSingle();

    const orgName = org?.name ?? "an organization";
    title = approved
      ? "Your membership request was approved"
      : "Your membership request was rejected";
    preheader = approved
      ? `You're now a verified member of ${orgName}.`
      : `Your request to join ${orgName} was rejected.`;
    intro = approved
      ? `An admin of ${orgName} has approved your membership request. Your submissions can now ` +
        "display your affiliation to this organization."
      : `An admin of ${orgName} was unable to approve your membership request. ` +
        "If you believe this was a mistake, contact the organization directly.";
    detail = orgName;
  } else {
    return new Response("Unknown table", { status: 200 });
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(recipientId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_verification_outcomes")
    .eq("user_id", recipientId)
    .maybeSingle();

  const shouldEmail = prefs?.email_verification_outcomes ?? true;

  const relativeLink = "/dashboard/organizations";

  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "verification_outcome",
    title,
    body: detail ?? "",
    link: `/en${relativeLink}`,
  });

  if (shouldEmail) {
    const locale = await getRecipientLocale(supabase, recipientId);
    await sendBrandedEmail({
      to: authUser.user.email,
      title,
      preheader,
      intro,
      detail,
      ctaText: "Open organization settings",
      ctaUrl: localizedUrl(relativeLink, locale),
      footer:
        "You're receiving this because you're involved with an organization on OpenClienting. " +
        "You can turn off these emails in your account settings.",
    });
  }

  return new Response("OK", { status: 200 });
});
