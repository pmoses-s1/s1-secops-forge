#!/usr/bin/env node
/*
 * enrich.mjs
 * Reads apps.json (the curated manifest) and writes catalogue.json with
 * live metadata pulled from the GitHub API baked in. Run this in CI on a
 * schedule so the published page loads one static file and never calls the
 * GitHub API from the browser.
 *
 * Set GITHUB_TOKEN in the environment for a higher rate limit (5000/hr).
 * Without a token it uses the unauthenticated limit (60/hr), which is fine
 * for a small manifest.
 *
 * Usage: node scripts/enrich.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const IN = new URL('apps.json', ROOT);
const OUT = new URL('catalogue.json', ROOT);

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 's1-secops-forge-enrich',
  ...(token ? { 'Authorization': 'Bearer ' + token } : {})
};

async function gh(path) {
  const res = await fetch('https://api.github.com' + path, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}: ${await res.text()}`);
  return res.json();
}

async function enrichOne(app) {
  const out = { ...app };
  try {
    const repo = await gh('/repos/' + app.repo);
    if (repo) {
      out.stars = repo.stargazers_count;
      out.forks = repo.forks_count;
      out.description = repo.description || app.tagline || '';
      out.topics = repo.topics || [];
      out.pushed_at = repo.pushed_at;
      out.updated_at = repo.updated_at;
      out.open_issues = repo.open_issues_count;
      out.license = repo.license && repo.license.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : '';
      out.avatar_url = repo.owner ? repo.owner.avatar_url : '';
      out.html_url = repo.html_url;
      out.default_branch = repo.default_branch;
      out.archived = !!repo.archived;
      if (!out.author) out.author = repo.owner ? repo.owner.login : app.repo.split('/')[0];
    }
    const rel = await gh('/repos/' + app.repo + '/releases/latest');
    if (rel && rel.tag_name) {
      out.version = rel.tag_name;
      out.release_url = rel.html_url;
      out.download_count = (rel.assets || []).reduce((n, a) => n + (a.download_count || 0), 0);
    }
  } catch (e) {
    console.error('  ! enrich failed for', app.repo, '-', e.message);
    out.enrich_error = true;
  }
  return out;
}

async function main() {
  const manifest = JSON.parse(await readFile(IN, 'utf8'));
  const apps = [];
  for (const app of manifest.apps) {
    process.stdout.write('Enriching ' + app.repo + ' ... ');
    const e = await enrichOne(app);
    apps.push(e);
    console.log(e.stars != null ? (e.stars + ' stars') : 'manifest only');
  }
  const catalogue = {
    catalogue: manifest.catalogue,
    categories: manifest.categories || [],
    types: manifest.types || [],
    generated_at: new Date().toISOString(),
    count: apps.length,
    apps
  };
  await writeFile(OUT, JSON.stringify(catalogue, null, 2) + '\n', 'utf8');
  console.log('\nWrote', apps.length, 'apps to catalogue.json');
}

main().catch(e => { console.error(e); process.exit(1); });
