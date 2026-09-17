# Antasphere Documentation

The unified docs site for the Antasphere tool ecosystem, served at
[docs.antasphere.com](https://docs.antasphere.com). Built with
[Mintlify](https://mintlify.com); one product selector, one sidebar per tool.

## How it works

Content is **generated, not authored here**. Each tool repo owns a public
`docs/` folder (pages + a `nav.yml` sidebar contract); `sync/sync.mjs` pulls
them in:

- `antasphere/` and `slideless/` are wiped and rebuilt on every sync — edit the
  source repo, never these trees.
- `docs.json` branding is hand-owned; its `navigation` block (one tab per tool, plus the anchors) is
  generated from the tools' `nav.yml` files.
- Changelogs are seeded from each repo's release tags into editable entry files
  under `sync/changelog/<tool>/` (seeded once, never overwritten — polish the
  wording there), then assembled into `<tool>/changelog.mdx`.
- `llms.txt` is regenerated from the navigation.

Source manifest: `sync/tools.yml`. Adding a tool = one entry there + a
`docs/nav.yml` in its repo + adding the repo to the `antasphere-docs-sync`
GitHub App installation.

## Local workflow

```bash
npm install
npm run sync     # pull from sibling checkouts (paths in sync/tools.yml)
npm run dev      # mint dev → http://localhost:3000
npm run check    # mint broken-links
```

Requires Node 22 and the tool repos checked out as siblings (see
`sync/tools.yml`).

## Deployment

Mintlify's GitHub App watches `prod` and deploys on push. The
`.github/workflows/sync.yml` workflow re-syncs on tool releases
(`repository_dispatch` from the tool repos), on manual dispatch, and daily.
