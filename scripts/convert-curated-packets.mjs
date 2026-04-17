#!/usr/bin/env node
/**
 * Converts curated YAML packets into the JSON payload shape expected by
 * scripts/import-curated-content.mjs.
 *
 * Usage:
 *   node scripts/convert-curated-packets.mjs \
 *     --dir=docs/curated-problem-agent-pack/packets \
 *     --tag-resolution=docs/curated-problem-agent-pack/tag-resolution.csv \
 *     --out-dir=docs/curated-problem-agent-pack/import-payloads
 *
 *   node scripts/convert-curated-packets.mjs \
 *     --packet=docs/curated-problem-agent-pack/packets/packet-a-005-electric-mirror.yaml \
 *     --tag-resolution=docs/curated-problem-agent-pack/tag-resolution.csv \
 *     --out-dir=docs/curated-problem-agent-pack/import-payloads
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { load } from 'js-yaml';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
  options: {
    packet: { type: 'string' },
    dir: { type: 'string' },
    'tag-resolution': { type: 'string' },
    'out-dir': { type: 'string' },
    clean: { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (!args.packet && !args.dir) {
  console.error('Error: supply --packet=<file.yaml> or --dir=<directory>.');
  process.exit(1);
}

if (!args['tag-resolution']) {
  console.error('Error: --tag-resolution=<tag-resolution.csv> is required.');
  process.exit(1);
}

if (!args['out-dir']) {
  console.error('Error: --out-dir=<directory> is required.');
  process.exit(1);
}

const tagResolutionPath = resolve(args['tag-resolution']);
const outDir = resolve(args['out-dir']);

function collectPacketFiles() {
  if (args.packet) {
    return [resolve(args.packet)];
  }

  const dir = resolve(args.dir);
  return readdirSync(dir)
    .filter((file) => ['.yaml', '.yml'].includes(extname(file)))
    .sort()
    .map((file) => resolve(dir, file));
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseTagResolution(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...dataLines] = lines;
  const headers = splitCsvLine(headerLine);
  const packetMap = new Map();

  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const packetId = row.packet_id?.trim();

    if (!packetId) continue;

    if (!packetMap.has(packetId)) {
      packetMap.set(packetId, {
        resolvedTagIds: [],
        resolvedRows: [],
        deferredRows: [],
      });
    }

    const entry = packetMap.get(packetId);
    const status = row.resolution_status?.trim();
    const tagId = row.resolved_tag_id?.trim();

    if (status === 'resolved' && tagId) {
      if (!entry.resolvedTagIds.includes(tagId)) {
        entry.resolvedTagIds.push(tagId);
      }
      entry.resolvedRows.push(row);
    } else if (status === 'deferred') {
      entry.deferredRows.push(row);
    }
  }

  return packetMap;
}

function citationRefs(value) {
  return Array.isArray(value?.citation_refs) ? value.citation_refs : [];
}

function collectCitationUsage(packet) {
  const directRefs = new Set();
  const inferenceRefs = new Set();
  const directOnlyRefs = [
    ...(packet.problem_statement?.title_citation_refs ?? []),
    ...(packet.problem_statement?.description_citation_refs ?? []),
    ...citationRefs(packet.problem_owner_organization?.sme_evidence),
    ...citationRefs(packet.solution_provider_organization?.provider_evidence),
  ];

  for (const ref of directOnlyRefs) {
    if (ref) directRefs.add(ref);
  }

  for (const requirement of packet.problem_statement?.requirements ?? []) {
    const refs = citationRefs(requirement);
    for (const ref of refs) {
      if (!ref) continue;
      if (requirement?.source_basis === 'inference') inferenceRefs.add(ref);
      else directRefs.add(ref);
    }
  }

  for (const fieldName of [
    'scope',
    'suggested_kpis',
    'success_criteria',
    'common_pitfalls',
    'duration',
    'resource_commitment',
  ]) {
    const field = packet.problem_statement?.pilot_framework?.[fieldName];
    const refs = citationRefs(field);
    for (const ref of refs) {
      if (!ref) continue;
      if (field?.source_basis === 'inference') inferenceRefs.add(ref);
      else directRefs.add(ref);
    }
  }

  return { directRefs, inferenceRefs };
}

function flattenPilotFramework(pilotFramework, citationsByKey) {
  if (!pilotFramework) return null;

  const pfFields = [
    'scope', 'suggested_kpis', 'success_criteria',
    'common_pitfalls', 'duration', 'resource_commitment',
  ];

  // Collect the union of all field-level citation refs across the pilot framework,
  // resolving each key to full citation data.  Deduped by source_url.
  const pfCitationsByUrl = new Map();
  for (const fieldName of pfFields) {
    const field = pilotFramework[fieldName];
    const isInference = field?.source_basis === 'inference';
    for (const ref of citationRefs(field)) {
      const citation = citationsByKey.get(ref);
      if (!citation || !citation.source_url) continue;
      if (!pfCitationsByUrl.has(citation.source_url)) {
        pfCitationsByUrl.set(citation.source_url, {
          source_url: citation.source_url,
          source_title: citation.source_title ?? '',
          publisher: citation.publisher ?? '',
          source_type: citation.source_type ?? 'secondary',
          access_date: citation.access_date ?? '',
          evidence_note: citation.evidence_note ?? '',
          is_sourced_fact: !isInference,
        });
      }
    }
  }

  return {
    scope: pilotFramework.scope?.text ?? '',
    suggested_kpis: pilotFramework.suggested_kpis?.text ?? '',
    success_criteria: pilotFramework.success_criteria?.text ?? '',
    common_pitfalls: pilotFramework.common_pitfalls?.text ?? '',
    duration: pilotFramework.duration?.text ?? '',
    resource_commitment: pilotFramework.resource_commitment?.text ?? '',
    citations: Array.from(pfCitationsByUrl.values()),
  };
}

function buildPayload(packet, tagResolutionEntry) {
  const { directRefs, inferenceRefs } = collectCitationUsage(packet);
  const resolvedTagIds = tagResolutionEntry?.resolvedTagIds ?? [];
  const ownerMatch = packet.problem_owner_organization?.existing_org_match;
  const ownerOrgId = ownerMatch?.matched ? (ownerMatch.organization_id ?? null) : null;
  const providerMatch = packet.solution_provider_organization?.existing_org_match;
  const providerOrgId = providerMatch?.matched ? (providerMatch.organization_id ?? null) : null;
  const hasProviderOrg = packet.solution_provider_organization?.present
    && (packet.solution_provider_organization?.name ?? '').trim() !== '';

  // Build a lookup map so field-level citation_refs can be resolved to full citation objects.
  const citationsByKey = new Map(
    (packet.citations ?? [])
      .filter((c) => c.citation_key)
      .map((c) => [c.citation_key, c]),
  );

  return {
    packet_id: packet.packet_id,
    problem_owner_org: {
      organization_id: ownerOrgId,
      name: packet.problem_owner_organization?.name ?? '',
      website: packet.problem_owner_organization?.website ?? '',
      description: packet.problem_owner_organization?.short_description ?? '',
      country: packet.problem_owner_organization?.country ?? '',
    },
    solution_provider_org: hasProviderOrg ? {
      organization_id: providerOrgId,
      name: packet.solution_provider_organization?.name ?? '',
      website: packet.solution_provider_organization?.website ?? '',
      description: packet.solution_provider_organization?.short_description ?? '',
      country: packet.solution_provider_organization?.country ?? '',
    } : null,
    problem: {
      title: packet.problem_statement?.title ?? '',
      description: packet.problem_statement?.description ?? '',
      source_language: 'en',
      tag_ids: resolvedTagIds,
    },
    requirements: (packet.problem_statement?.requirements ?? []).map((requirement) => {
      const isInference = requirement?.source_basis === 'inference';
      const reqCitations = citationRefs(requirement)
        .map((ref) => citationsByKey.get(ref))
        .filter((c) => c && c.source_url)
        .map((citation) => ({
          source_url: citation.source_url,
          source_title: citation.source_title ?? '',
          publisher: citation.publisher ?? '',
          source_type: citation.source_type ?? 'secondary',
          access_date: citation.access_date ?? '',
          evidence_note: citation.evidence_note ?? '',
          is_sourced_fact: !isInference,
        }));
      return {
        body: requirement?.text ?? '',
        citations: reqCitations,
      };
    }),
    pilot_framework: flattenPilotFramework(packet.problem_statement?.pilot_framework, citationsByKey),
    citations: (packet.citations ?? []).map((citation) => ({
      source_url: citation.source_url,
      source_title: citation.source_title ?? '',
      publisher: citation.publisher ?? '',
      source_type: citation.source_type ?? 'secondary',
      access_date: citation.access_date ?? '',
      evidence_note: citation.evidence_note ?? '',
      // Default to sourced facts unless a citation is used only for inference.
      is_sourced_fact: !inferenceRefs.has(citation.citation_key) || directRefs.has(citation.citation_key),
    })),
    curator_note: packet.provenance?.curator_note ?? '',
  };
}

function validatePacket(packet, tagResolutionEntry) {
  const errors = [];

  if (!packet.packet_id) errors.push('packet_id is required');
  if (!packet.problem_statement?.title) errors.push('problem_statement.title is required');
  if (!packet.problem_statement?.description) errors.push('problem_statement.description is required');
  if (!Array.isArray(packet.citations) || packet.citations.length === 0) {
    errors.push('at least one citation is required');
  }
  if ((tagResolutionEntry?.resolvedTagIds ?? []).length === 0) {
    errors.push('at least one resolved live tag is required');
  }

  return errors;
}

const packetFiles = collectPacketFiles();

if (packetFiles.length === 0) {
  console.error('No YAML packet files found.');
  process.exit(1);
}

if (args.clean && statSync(outDir, { throwIfNoEntry: false })?.isDirectory()) {
  rmSync(outDir, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });

const tagResolution = parseTagResolution(readFileSync(tagResolutionPath, 'utf8'));
const warnings = [];
let convertedCount = 0;
let errorCount = 0;

for (const file of packetFiles) {
  const packet = load(readFileSync(file, 'utf8'));
  const tagEntry = tagResolution.get(packet.packet_id);
  const errors = validatePacket(packet, tagEntry);

  console.log(`\n-- ${basename(file)} --`);
  console.log(`   packet_id: ${packet.packet_id}`);

  if (errors.length > 0) {
    errorCount++;
    console.error('   Validation failed:');
    for (const error of errors) {
      console.error(`   - ${error}`);
    }
    continue;
  }

  if (tagEntry.deferredRows.length > 0) {
    warnings.push({
      packetId: packet.packet_id,
      message: `Deferred tag proposals omitted from import payload: ${tagEntry.deferredRows.map((row) => row.proposed_tag).join(', ')}`,
    });
  }

  const payload = buildPayload(packet, tagEntry);
  const outputFile = resolve(outDir, `${basename(file, extname(file))}.json`);
  writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  convertedCount++;

  console.log(`   Wrote ${outputFile}`);
  console.log(`   Resolved tags: ${payload.problem.tag_ids.length}`);
}

console.log('\n== Conversion Summary ==');
console.log(`Converted: ${convertedCount}`);
console.log(`Errors:    ${errorCount}`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) {
    console.log(`- ${warning.packetId}: ${warning.message}`);
  }
}

if (errorCount > 0) {
  process.exit(1);
}
