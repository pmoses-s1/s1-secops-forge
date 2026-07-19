# Contributing to S1 SecOps Forge

Thanks for adding to the catalogue. Contributions are welcome from anyone.

## What can be listed

Community apps for SentinelOne: deployers, SDL solutions, skills, MCP servers, and integrations. The repo must be public. Do not submit tools that require secrets or credentials to be hard-coded, or that ship malware or exploit code.

Everything is listed as **community-supported**. See [DISCLAIMER.md](DISCLAIMER.md).

## Add your app by pull request

1. Fork this repo.
2. Add one object to the `apps` array in `apps.json`. Follow `schema/app.schema.json`.
3. Fill only the curated fields. Leave live fields out; enrichment fills stars, description, version, last updated, license, and avatar from GitHub.
4. Validate locally:
   ```bash
   node scripts/validate.mjs
   ```
5. Open a pull request. CI validates the schema and confirms the repo is public.

### Field guide

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Lowercase unique slug. |
| `name` | yes | Display name on the card. |
| `repo` | yes | `owner/name`. Drives all live data. |
| `category` | yes | One of the allowed categories. |
| `type` | yes | One of the allowed types. |
| `tagline` | no | Short curated line. Empty uses the GitHub description. |
| `s1_products` | no | Array of product areas, for example `["Purple AI"]`. |
| `author` | no | Defaults to the repo owner. |
| `docs_url` | no | External docs link. |
| `featured` | no | Pin to the featured row. Maintainers decide. |

## Add your app by form

Open a [new issue](../../issues/new?template=submit-app.yml) with the "Submit an app" template. A maintainer will convert it to a pull request.

## Maintainer notes

- `catalogue.json` is generated. Never edit it by hand; the Action overwrites it.
- Bump nothing manually for versions or stars. If a card looks stale, re-run the **Enrich catalogue** Action.
