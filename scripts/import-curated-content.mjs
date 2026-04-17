#!/usr/bin/env node
/**
 * Imports approved curated problem packets into OpenClienting.org.
 *
 * Usage:
 *   node scripts/import-curated-content.mjs \
 *     --packet=path/to/packet.json \
 *     --admin-id=<admin-profile-uuid> \
 *     [--dry-run]
 *
 *   # Import a directory of packets (alphabetical order):
 *   node scripts/import-curated-content.mjs \
 *     --dir=docs/curated-problem-agent-pack/packets/ \
 *     --admin-id=<admin-profile-uuid> \
 *     [--dry-run]
 *
 * Required env vars:
 *   SUPABASE_URL              — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (never the anon key)
 *
 * Packet format:
 *   JSON following the import payload schema in platform-ingestion-spec.md.
 *   Convert YAML packets with: yq -o=json packet.yaml > packet.json
 *
 * The script calls import_curated_problem_v1 via the Supabase RPC endpoint.
 * Packets that are already imported are skipped (idempotent).
 *
 * Dry run prints what would be imported without writing to the database.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { parseArgs } from 'util';

// ── CLI args ──────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    packet:   { type: 'string' },
    dir:      { type: 'string' },
    'admin-id': { type: 'string' },
    'dry-run':  { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (!args['admin-id']) {
  console.error('Error: --admin-id=<profile-uuid> is required for the audit trail.');
  console.error('       This must be the UUID of an admin or moderator profile.');
  process.exit(1);
}

if (!args.packet && !args.dir) {
  console.error('Error: supply --packet=<file.json> or --dir=<directory>.');
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const isDryRun = args['dry-run'];
const adminId  = args['admin-id'];

// ── Supabase client (service role) ───────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Collect packet files ─────────────────────────────────────

/** @returns {string[]} sorted absolute paths to .json packet files */
function collectPacketFiles() {
  if (args.packet) {
    return [resolve(args.packet)];
  }
  const dir = resolve(args.dir);
  return readdirSync(dir)
    .filter(f => extname(f) === '.json')
    .sort()
    .map(f => resolve(dir, f));
}

// ── Validate packet fields (fast pre-flight) ─────────────────

/** @param {object} packet @param {string} file @returns {string[]} errors */
function validatePacket(packet, file) {
  const errors = [];
  if (!packet.packet_id)               errors.push('packet_id is required');
  if (!packet.problem?.title)          errors.push('problem.title is required');
  if (!packet.problem?.description)    errors.push('problem.description is required');
  if (!Array.isArray(packet.citations))
    errors.push('citations must be an array (may be empty)');
  if (packet.citations?.some(c => !c.source_url))
    errors.push('each citation must have source_url');
  return errors;
}

// ── Flatten YAML-style nested pilot_framework ─────────────────
// packet-schema.yaml uses { scope: { text, source_basis, note }, ... }
// The RPC expects flat strings { scope: "...", ... }.
// If the value is a plain string (already flat) it is used as-is.

/** @param {object|undefined} pf */
function flattenPilotFramework(pf) {
  if (!pf) return undefined;
  const flat = {};
  const fields = [
    'scope', 'suggested_kpis', 'success_criteria',
    'common_pitfalls', 'duration', 'resource_commitment',
  ];
  for (const f of fields) {
    const v = pf[f];
    flat[f] = (v && typeof v === 'object') ? (v.text ?? '') : (v ?? '');
  }
  // Preserve field-level citations when the converter has already resolved them.
  if (Array.isArray(pf.citations)) flat.citations = pf.citations;
  return flat;
}

// ── Flatten YAML-style requirement (may have source_basis / note) ─

/** @param {object} req */
function flattenRequirement(req) {
  if (typeof req === 'string') return { body: req };
  // packet-schema shape: { text, source_basis, note }  or  { body, citations, ... }
  return {
    body: req.body ?? req.text ?? '',
    ...(Array.isArray(req.citations) ? { citations: req.citations } : {}),
  };
}

// ── Import a single packet ────────────────────────────────────

async function importPacket(packet, file) {
  console.log(`\n── ${basename(file)} ──`);
  console.log(`   packet_id: ${packet.packet_id}`);
  console.log(`   title:     ${packet.problem?.title}`);

  const errors = validatePacket(packet, file);
  if (errors.length > 0) {
    console.error('   ❌ Validation failed:');
    errors.forEach(e => console.error('      •', e));
    return { file, status: 'validation_failed', errors };
  }

  // Build RPC payload
  const payload = {
    packet_id:         packet.packet_id,
    problem_owner_org: packet.problem_owner_org ?? null,
    solution_provider_org: packet.solution_provider_org ?? null,
    problem: {
      title:           packet.problem.title,
      description:     packet.problem.description,
      source_language: packet.problem.source_language ?? 'en',
      tag_ids:         packet.problem.tag_ids ?? [],
    },
    requirements: (packet.requirements ?? []).map(flattenRequirement),
    pilot_framework:   flattenPilotFramework(packet.pilot_framework),
    citations:         packet.citations ?? [],
    curator_note:      packet.curator_note ?? '',
    _service_caller_id: adminId,
  };

  if (isDryRun) {
    console.log('   [dry-run] Would call import_curated_problem_v1 with:');
    console.log('   ', JSON.stringify(payload, null, 4).split('\n').join('\n    '));
    return { file, status: 'dry_run', packet_id: packet.packet_id };
  }

  const { data, error } = await supabase.rpc('import_curated_problem_v1', {
    p_payload: payload,
  });

  if (error) {
    console.error('   ❌ RPC error:', error.message);
    return { file, status: 'error', error: error.message };
  }

  if (data.status === 'already_imported') {
    console.log('   ⏭  Already imported — problem_id:', data.problem_id);
    if (data.org_id) console.log('      org_id:    ', data.org_id);
    if (data.provider_org_id) console.log('      provider_org_id:', data.provider_org_id);
  } else {
    console.log('   ✅ Imported — problem_id:', data.problem_id);
    if (data.org_id) console.log('      org_id:    ', data.org_id);
    if (data.provider_org_id) console.log('      provider_org_id:', data.provider_org_id);
  }

  return { file, ...data };
}

// ── Main ──────────────────────────────────────────────────────

const files = collectPacketFiles();

if (files.length === 0) {
  console.error('No .json packet files found.');
  process.exit(1);
}

console.log(`Importing ${files.length} packet(s)${isDryRun ? ' [DRY RUN]' : ''}`);
console.log(`Admin ID: ${adminId}`);

const results = [];
let successCount = 0;
let skipCount    = 0;
let errorCount   = 0;

for (const file of files) {
  let packet;
  try {
    packet = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`\n── ${basename(file)} ──`);
    console.error('   ❌ Failed to parse JSON:', err.message);
    results.push({ file, status: 'parse_error', error: err.message });
    errorCount++;
    continue;
  }

  const result = await importPacket(packet, file);
  results.push(result);

  if (result.status === 'imported' || result.status === 'dry_run') successCount++;
  else if (result.status === 'already_imported')                    skipCount++;
  else                                                              errorCount++;
}

// ── Summary ───────────────────────────────────────────────────

console.log('\n══ Summary ══════════════════════════════════');
console.log(`   Imported: ${successCount}`);
console.log(`   Skipped:  ${skipCount}`);
console.log(`   Errors:   ${errorCount}`);

if (errorCount > 0) {
  process.exit(1);
}
