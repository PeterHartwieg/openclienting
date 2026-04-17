"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LANGUAGE_CODES } from "@/i18n/languages";
import { validatePassword } from "@/lib/auth/password";
import { invalidateFor } from "@/lib/cache/tags";

// ----------------------------------------------------------------
// Profile fields
// ----------------------------------------------------------------

export async function updateProfile(params: {
  displayName?: string | null;
  bio?: string | null;
  website?: string | null;
  publicEmail?: string | null;
  locale?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const updateData: Record<string, unknown> = {};

  if (params.displayName !== undefined) {
    const trimmed = params.displayName?.trim() ?? "";
    updateData.display_name = trimmed.length ? trimmed : null;
  }
  if (params.bio !== undefined) {
    const trimmed = params.bio?.trim() ?? "";
    if (trimmed.length > 500) {
      return { success: false as const, error: "Bio must be under 500 characters" };
    }
    updateData.bio = trimmed.length ? trimmed : null;
  }
  if (params.website !== undefined) {
    const trimmed = params.website?.trim() ?? "";
    if (trimmed.length > 200) {
      return { success: false as const, error: "Website URL must be under 200 characters" };
    }
    if (trimmed.length && !/^https?:\/\//i.test(trimmed)) {
      return { success: false as const, error: "Website must start with http:// or https://" };
    }
    updateData.website = trimmed.length ? trimmed : null;
  }
  if (params.publicEmail !== undefined) {
    const trimmed = params.publicEmail?.trim() ?? "";
    if (trimmed.length > 320) {
      return { success: false as const, error: "Public email must be under 320 characters" };
    }
    if (trimmed.length && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { success: false as const, error: "Public email is not a valid address" };
    }
    updateData.public_email = trimmed.length ? trimmed : null;
  }
  if (params.locale !== undefined) {
    const code = params.locale ?? "";
    if (code.length && !LANGUAGE_CODES.includes(code)) {
      return { success: false as const, error: "Unsupported locale" };
    }
    updateData.locale = code.length ? code : null;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false as const, error: "Nothing to update" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) return { success: false as const, error: error.message };

  // display_name and avatar_url appear in the getPublishedProblemForMarkdown
  // unstable_cache query (via profiles join). Bust that cache so renamed
  // authors appear correctly in the Markdown route and sitemap.
  invalidateFor("problem");
  return { success: true as const };
}

// ----------------------------------------------------------------
// Avatar upload / remove
// ----------------------------------------------------------------

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false as const, error: "File is required" };
  if (file.size > AVATAR_MAX_BYTES) {
    return { success: false as const, error: "Avatar must be under 2 MB" };
  }
  if (!AVATAR_ALLOWED_MIME.has(file.type)) {
    return { success: false as const, error: "Avatar must be JPEG, PNG, or WebP" };
  }

  const ext = AVATAR_EXT_BY_MIME[file.type];
  const path = `${user.id}/avatar.${ext}`;

  // Clean up any prior avatar with a different extension so a format
  // swap (png → webp) doesn't leak orphaned bytes.
  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (existing?.length) {
    const stale = existing
      .map((o) => `${user.id}/${o.name}`)
      .filter((p) => p !== path);
    if (stale.length) {
      await supabase.storage.from("avatars").remove(stale);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { success: false as const, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Cache-bust so <Image> picks up the new bytes even when the URL is the
  // same across uploads.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (updateError) return { success: false as const, error: updateError.message };

  // avatar_url is embedded in the getPublishedProblemForMarkdown cache.
  invalidateFor("problem");
  return { success: true as const, avatarUrl };
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (existing?.length) {
    await supabase.storage
      .from("avatars")
      .remove(existing.map((o) => `${user.id}/${o.name}`));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { success: false as const, error: error.message };

  // avatar_url is embedded in the getPublishedProblemForMarkdown cache.
  invalidateFor("problem");
  return { success: true as const };
}

// ----------------------------------------------------------------
// Password — set / change / reset
// ----------------------------------------------------------------

export async function setOrChangePassword(params: {
  newPassword: string;
  currentPassword?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const err = validatePassword(params.newPassword);
  if (err) return { success: false as const, error: err };

  // If the user already has an email identity we treat this as a change
  // and require re-authentication. Without one, this is a first-time set
  // for an OAuth-only account — we have to go through the admin API
  // because the user-scoped updateUser() sets encrypted_password without
  // creating the email identity that signInWithPassword later requires.
  const hasPassword = Array.isArray(user.identities)
    && user.identities.some((i) => i.provider === "email");

  if (hasPassword) {
    if (!params.currentPassword) {
      return { success: false as const, error: "Current password is required" };
    }
    if (!user.email) {
      return { success: false as const, error: "Account has no email on file" };
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: params.currentPassword,
    });
    if (reauthError) {
      return { success: false as const, error: "Current password is incorrect" };
    }

    const { error } = await supabase.auth.updateUser({
      password: params.newPassword,
    });
    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  }

  // First-time password set for an OAuth-only account.
  if (!user.email) {
    return { success: false as const, error: "Account has no email on file" };
  }
  const admin = createAdminClient();
  const { error: adminError } = await admin.auth.admin.updateUserById(user.id, {
    password: params.newPassword,
    email_confirm: true,
  });
  if (adminError) {
    return { success: false as const, error: adminError.message };
  }
  return { success: true as const };
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();
  const trimmed = email.trim();
  if (!trimmed) return { success: false as const, error: "Email is required" };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const redirectTo = origin ? `${origin}/auth/callback` : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo,
  });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

// ----------------------------------------------------------------
// Deletion precheck — find organizations where the caller is the only
// active admin. A non-empty list blocks account deletion.
// ----------------------------------------------------------------

export type DeletionBlocker = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};

export async function getDeletionBlockers(): Promise<DeletionBlocker[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Orgs where this user is an active admin.
  const { data: myAdminMemberships } = await supabase
    .from("organization_memberships")
    .select("organization_id, organizations (id, name, slug)")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("membership_status", "active");

  if (!myAdminMemberships?.length) return [];

  const blockers: DeletionBlocker[] = [];
  for (const m of myAdminMemberships) {
    const { count } = await supabase
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", m.organization_id)
      .eq("role", "admin")
      .eq("membership_status", "active")
      .neq("user_id", user.id);

    if ((count ?? 0) === 0) {
      // organizations is joined as a single row (PostgREST returns the
      // related record inline when the FK is single-valued).
      const org = m.organizations as unknown as {
        id: string;
        name: string;
        slug: string;
      } | null;
      if (org) {
        blockers.push({
          organizationId: org.id,
          organizationName: org.name,
          organizationSlug: org.slug,
        });
      }
    }
  }
  return blockers;
}
