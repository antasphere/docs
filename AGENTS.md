# Agent guide — antasphere/docs

Mintlify site for docs.antasphere.com. Read this before editing anything.

## The one rule

`antasphere/`, `slideless/`, `llms.txt`, and `docs.json`'s
`navigation.products` block are **GENERATED** by `sync/sync.mjs`. Never edit
them directly — your change dies on the next sync. Edit instead:

| You want to change… | Edit… |
|---|---|
| A documentation page | the source repo's `docs/` (antasphere/hub or antasphere/slideless), then `npm run sync` |
| Sidebar structure / titles | the source repo's `docs/nav.yml` |
| Changelog wording | `sync/changelog/<tool>/<version>.md` (editable; never regenerated) |
| Branding, colors, navbar | `docs.json` (everything except `navigation`) |
| The pipeline itself | `sync/sync.mjs`, `sync/tools.yml` |

## Source page contract (in the tool repos)

- Plain `.md`, starts with an H1, then a 1–2 sentence intro paragraph (becomes
  the page description). No frontmatter.
- Subfolders map to sidebar groups; `nav.yml` lists every page exactly once.
- No links out of `docs/`; no bare `<…>` or `{…}` in prose (MDX). The sync
  fails loudly on violations.

## Verify

`npm run sync` must exit 0; `npm run dev` to preview; `npm run check` for
broken links. Deploys happen automatically on push to `prod` (Mintlify GitHub
App).
