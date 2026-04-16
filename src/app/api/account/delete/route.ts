// Hard-delete the caller's account. Uses the service-role admin client
// because `auth.admin.deleteUser` can't run under the anon key.
//
// Safety gates (in order):
//   1. Session must exist (anon client verifies).
//   2. Caller must type their exact email in the confirmation field.
//   3. Caller must not be the sole active admin of any organization —
//      re-checked here so a stale client view can't bypass the UI block.
// When all pass we clean avatar objects (storage doesn't cascade) then
// call auth.admin.deleteUser(user.id). CASCADE on profiles and
// downstream tables handles the rest.
import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const confirmation = body.confirmation?.trim() ?? "";

  const supabase = await createAnonClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!user.email) {
    return NextResponse.json(
      { error: "Account has no email on file; deletion requires support" },
      { status: 400 }
    );
  }
  if (confirmation.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Confirmation text does not match your email" },
      { status: 400 }
    );
  }

  // Re-check the sole-admin constraint server-side. Mirrors
  // getDeletionBlockers() in lib/actions/account.ts.
  const { data: myAdminMemberships } = await supabase
    .from("organization_memberships")
    .select("organization_id, organizations (id, name)")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("membership_status", "active");

  if (myAdminMemberships?.length) {
    const blockers: string[] = [];
    for (const m of myAdminMemberships) {
      const { count } = await supabase
        .from("organization_memberships")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", m.organization_id)
        .eq("role", "admin")
        .eq("membership_status", "active")
        .neq("user_id", user.id);
      if ((count ?? 0) === 0) {
        const org = m.organizations as unknown as { name: string } | null;
        if (org) blockers.push(org.name);
      }
    }
    if (blockers.length) {
      return NextResponse.json(
        {
          error:
            "You are the sole admin of: " +
            blockers.join(", ") +
            ". Transfer admin rights or leave these organizations before deleting your account.",
        },
        { status: 409 }
      );
    }
  }

  const admin = createAdminClient();

  // Avatar storage does not cascade — clean it first so the bucket
  // doesn't accumulate orphaned objects.
  const { data: avatarObjects } = await admin.storage
    .from("avatars")
    .list(user.id);
  if (avatarObjects?.length) {
    await admin.storage
      .from("avatars")
      .remove(avatarObjects.map((o) => `${user.id}/${o.name}`));
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Invalidate the session cookie so the client redirect lands on a
  // clean anonymous state.
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
