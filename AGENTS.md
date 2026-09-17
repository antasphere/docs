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
| Palette, faces, logo, navbar | `docs.json` (everything except `navigation`; the sync writes one tab per tool) |
| The ground, the type weights | `style.css` |
| The pipeline itself | `sync/sync.mjs`, `sync/tools.yml` |

## The changelog is written, never generated

A new release tag seeds `sync/changelog/<tool>/<version>.md` with the release
TITLE and nothing else. The body is a human's to write, from the product's own
docs, in the words a reader uses. The file is written once and never
regenerated, so what is written there survives every later sync.

It used to seed the commit subjects between the two tags. That is what put 101
lines of internal engineering log on the public site the day it opened: ticket
ids, internal document names, what a code review had found, and one
"NOT READY TO SHIP". A commit log is written for the team; release notes are
written for the reader; no filter turns one into the other.

What never goes in an entry: an internal ticket id, a file path, a symbol or
table name, an internal document name, anything about how the code was
reviewed, and anything that reads as the shape of a past weakness (say what is
true for the reader now, not what was wrong before). Three to six plain
sentences per release, or fewer. An entry you cannot write honestly from the
docs stays as its title alone.

## Deploying a tool, and where the release motion lives

This site follows the tools; it never deploys them. Each tool owns its own
release motion, and the rule is the same everywhere: **the version moves before
the promotion, by hand, once per release.**

On Slideless, which has the complete pipeline, that is `pnpm release
patch|minor|major --title "…"` on a clean `dev` (it bumps the package files,
commits, and makes the annotated `vX.Y.Z` tag), then pushing the branch and the
tag, then `git push origin origin/dev:refs/heads/prod`. The tag push publishes
the image aliases; the prod push publishes and hands the image to the fleet
repository, which rolls it and probes the live instance for that exact version.
A first job refuses any push whose package version is already released on
another commit, so a promotion that forgot the bump fails in twenty seconds
instead of shipping a lookalike of the previous release.

That last part is why the rule exists: the image reports its own version
intrinsically, and a deploy probe asserting a version that never changes
asserts nothing at all.

The hub does not have this yet (no release script, no guard, no automated
roll), which is tracked. A new tool joining this site should carry the
Slideless motion from the start rather than invent one.

## Branding

The site wears the Antasphere brand: Sentient Light for headings, Synonym (the
website's reading face since 2026-09-12) for everything else, the graphite ground
and the glacier accent. Two files carry it and they are read together.

`docs.json` holds what Mintlify has a field for: `colors`, `background.color`
(the FLAT ground — #F7F6F4 light, #1A1918 dark, the website's `--color-bg`),
`fonts` (Sentient Light and Synonym Variable, both self-hosted under `fonts/`),
`logo`, `favicon`, `navbar`. `style.css` holds what it does not, and Mintlify
loads it on every page with no reference from `docs.json`:

- **The faces' other weights.** Sentient Medium (500) and Synonym's 200–700 axis
  as `@font-face`, so no weight is ever a synthesised bold. Body text sits at
  450 / -0.008em, the website's html rule.
- **The heading tiers**, scoped to the reading column: h1 500 / -0.015em, h2–h6
  300 / -0.005em (the console's two display tiers).
- **The chrome.** The bar flat on the ground colour in both scroll states, the
  logo at 22px, the sidebar's group titles as uppercase letterspaced labels in
  the ink colour, page rows at 0.3rem, groups 1.25rem apart, every label at 14px.

There is no gradient and no grain any more (2026-09-17): the pooled field read as
a dim, uneven page next to the website's flat bar. `style.css` is a sibling of
`labs/products/exos/exos/docs/style.css` and the two are kept byte-identical —
port a change to both.

Assets: `logo/{light,dark}.svg` is the lockup generated from the brand's mark
module (`company/brand/src/lib/mark.js`, `assetSvg('lockup', tone)`) with the
wordmark outlined (a logo loads as an `<img>`, where no webfont reaches it);
`favicon.svg` is `assetSvg('tile', 'light')`, byte-equal to the website's.
Regenerate the three together from the module, never by hand. The brand sources
win over anything inferred here: `company/brand/src/lib/tokens.css` and
`company/website/apps/website/src/styles/{brand,global}.css`.

The links pinned above every sidebar (My account, Slideless, antasphere.com) are
`site.anchors` in `sync/tools.yml`; the sync writes them into
`navigation.global.anchors` on every run.

## Source page contract (in the tool repos)

- Plain `.md`, starts with an H1, then a 1–2 sentence intro paragraph, which
  BECOMES the page description (the subtitle under the title) and is removed
  from the body — so write it as a subtitle, and put any link it needs in the
  body too. No frontmatter.
- Subfolders map to sidebar groups; `nav.yml` lists every page exactly once.
- No links out of `docs/`; no bare `<…>` or `{…}` in prose (MDX). The sync
  fails loudly on violations.

## Verify

`npm run sync` must exit 0; `npm run dev` to preview; `npm run check` for
broken links. Deploys happen automatically on push to `prod` (Mintlify GitHub
App).
