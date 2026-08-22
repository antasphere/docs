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
| Palette, faces, logo, navbar | `docs.json` (everything except `navigation`) |
| The ground, the type weights | `style.css` |
| The pipeline itself | `sync/sync.mjs`, `sync/tools.yml` |

## Branding

The site wears the Antasphere brand: the console's Observatory pairing (Sentient
Light / Onest), the graphite ground and the glacier accent, the same recipe the
website's home ships. Two files carry it and they are read together.

`docs.json` holds what Mintlify has a field for: `colors`, `background.color`,
`fonts`, `logo`, `favicon`, `icons.library`. `style.css` holds what it does not,
and Mintlify loads it on every page with no reference from `docs.json`:

- **The ground.** The brand's field is a pooled gradient with the film grain over
  it, not flat paper. It is painted on `#background-color`, Mintlify's own fixed
  full-viewport layer, so it needs no element of ours.
- **The sidebar band.** A wash on the left of that field puts the sidebar a step
  deeper than the reading column, which is why the sidebar reads as standing off
  the page without being given a panel.
- **The heading weights.** Mintlify asks for `h1` at 700 and `h2` at 600 through
  Tailwind utilities on the tags. Sentient ships here as two real files (Light
  and Medium) and the headings are pinned to the console's two display tiers, so
  nothing is ever a synthesised bold.

Assets: `logo/{light,dark}.svg` is the lockup with the wordmark outlined (a logo
loads as an `<img>`, where no webfont reaches it); `favicon.svg` is byte-equal to
the website's. Regenerate the two logo files together. The brand sources win over
anything inferred here: `company/brand/src/lib/tokens.css` and
`company/website/apps/website/src/{styles/brand.css,brand/recipe.ts}`.

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
