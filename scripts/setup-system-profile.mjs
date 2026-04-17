#!/usr/bin/env node
/**
 * Verifies that the system profile exists and is correctly configured.
 *
 * Run after migrations or on any new environment:
 *   node scripts/setup-system-profile.mjs
 *
 * Required env vars:
 *   SUPABASE_URL              — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (never the anon key)
 */

import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROFILE_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_PROFILE_EMAIL = 'system@internal.openclientorg.invalid';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Check auth.users row ──────────────────────────────────────

const { data: authUser, error: authError } =
  await supabase.auth.admin.getUserById(SYSTEM_PROFILE_ID);

if (authError || !authUser?.user) {
  console.error('❌ System auth user not found. Run migrations first.');
  if (authError) console.error('   ', authError.message);
  process.exit(1);
}

if (authUser.user.email !== SYSTEM_PROFILE_EMAIL) {
  console.warn('⚠️  System auth user email mismatch:');
  console.warn('   Expected:', SYSTEM_PROFILE_EMAIL);
  console.warn('   Found:   ', authUser.user.email);
}

// ── Check profiles row ────────────────────────────────────────

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, display_name, role, bio')
  .eq('id', SYSTEM_PROFILE_ID)
  .single();

if (profileError || !profile) {
  console.error('❌ System profile row not found. Run migrations first.');
  if (profileError) console.error('   ', profileError.message);
  process.exit(1);
}

if (profile.role !== 'admin') {
  console.error('❌ System profile has wrong role:', profile.role, '(expected: admin)');
  process.exit(1);
}

// ── All good ──────────────────────────────────────────────────

console.log('✅ System profile is correctly configured.');
console.log('   ID:          ', profile.id);
console.log('   Display name:', profile.display_name);
console.log('   Role:        ', profile.role);
