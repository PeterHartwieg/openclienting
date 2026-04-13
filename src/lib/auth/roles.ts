import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile
    ? { ...user, profile }
    : { ...user, profile: null };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user?.profile) throw new Error("Unauthorized");

  const roleHierarchy: Record<UserRole, number> = {
    contributor: 0,
    moderator: 1,
    admin: 2,
  };

  if (roleHierarchy[user.profile.role as UserRole] < roleHierarchy[role]) {
    throw new Error("Forbidden");
  }

  return user;
}
