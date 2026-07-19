#!/usr/bin/env node
/*
 * validate.mjs
 * Validates apps.json against the manifest rules before it is merged.
 * Checks required fields, repo format, unique ids, and that category and
 * type values are in the allowed enums. Exits non-zero on any error so it
 * can gate a pull request in CI.
 *
 * Usage: node scripts/validate.mjs
 */
import { readFile } from 'node:fs/promises';

const IN = new URL('../apps.json', import.meta.url);

const REPO_RE = /^[^/\s]+\/[^/\s]+$/;
const ID_RE = /^[a-z0-9][a-z0-9._-]*$/;

const errors = [];
const warnings = [];

const manifest = JSON.parse(await readFile(IN, 'utf8'));
const cats = new Set(manifest.categories || []);
const types = new Set(manifest.types || []);
const seen = new Set();

if (!Array.isArray(manifest.apps)) {
  errors.push('apps must be an array');
} else {
  manifest.apps.forEach((a, i) => {
    const at = `apps[${i}]` + (a && a.id ? ` (${a.id})` : '');
    if (!a.id || !ID_RE.test(a.id)) errors.push(`${at}: invalid or missing id (lowercase slug)`);
    if (a.id && seen.has(a.id)) errors.push(`${at}: duplicate id`);
    if (a.id) seen.add(a.id);
    if (!a.name || a.name.length < 2) errors.push(`${at}: missing name`);
    if (!a.repo || !REPO_RE.test(a.repo)) errors.push(`${at}: repo must be owner/name`);
    if (!cats.has(a.category)) errors.push(`${at}: category "${a.category}" not in allowed list`);
    if (!types.has(a.type)) errors.push(`${at}: type "${a.type}" not in allowed list`);
    if (a.tagline && a.tagline.length > 120) warnings.push(`${at}: tagline longer than 120 chars`);
    if (a.s1_products && !Array.isArray(a.s1_products)) errors.push(`${at}: s1_products must be an array`);
  });
}

for (const w of warnings) console.warn('warning:', w);

if (errors.length) {
  console.error('\nValidation failed:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log(`OK: ${manifest.apps.length} apps valid.`);
