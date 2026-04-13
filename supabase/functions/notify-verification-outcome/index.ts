// Supabase Edge Function: notify-verification-outcome
// Triggered via database webhook when an organization's verification_status
// or a membership's membership_status changes to a terminal state.
// Notifies the org creator or the requesting user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://openclienting.org";

Deno.serve(async (req) => {
  const payload = await req.json();
  const { type, table, record, old_record } = payload;

  if (type !== "UPDATE" || !record || !old_record) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let recipientId: string;
  let title: string;
  let body: string;

  if (table === "organizations") {
    const oldStatus = old_record.verification_status;
    const newStatus = record.verification_status;

    if (oldStatus === newStatus || !["verified", "rejected"].includes(newStatus)) {
      return new Response("OK", { status: 200 });
    }

    recipientId = record.created_by;
    title = newStatus === "verified"
      ? "Your organization has been verified"
      : "Your organization verification was rejected";
    body = record.name ?? "";
  } else if (table === "organization_memberships") {
    const oldStatus = old_record.membership_status;
    const newStatus = record.membership_status;

    if (oldStatus === newStatus || !["active", "rejected"].includes(newStatus)) {
      return new Response("OK", { status: 200 });
    }

    recipientId = record.user_id;

    // Look up the org name for context
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", record.organization_id)
      .maybeSingle();

    const orgName = org?.name ?? "an organization";
    title = newStatus === "active"
      ? "Your membership request was approved"
      : "Your membership request was rejected";
    body = orgName;
  } else {
    return new Response("Unknown table", { status: 200 });
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(recipientId);
  if (!authUser?.user?.email) {
    return new Response("No email", { status: 200 });
  }

  // Check notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_verification_outcomes")
    .eq("user_id", recipientId)
    .maybeSingle();

  const shouldEmail = prefs?.email_verification_outcomes ?? true;

  const link = "/en/dashboard/organizations";

  // Log notification
  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "verification_outcome",
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
        textContent: `${title}\n\n${body}\n\nView at: ${SITE_URL}${link}`,
      }),
    });
  }

  return new Response("OK", { status: 200 });
});
