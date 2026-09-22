# Agent guide — antasphere/docs

Mintlify site for docs.antasphere.com. Read this before editing anything.

## The one rule

`antasphere/`, `slideless/`, `llms.txt`, and `docs.json`'s `navigation`
block are **GENERATED** by `sync/sync.mjs`. Never edit them directly — your
change dies on the next sync. The navigation's shape (since 2026-09-22): the
products as ONE dropdown beside the logo, and under the chosen product a few
tabs, each one rail's worth of the tool's groups — one tab per tool had put a
nine-group rail under Slideless. Edit instead:

| You want to change… | Edit… |
|---|---|
| A documentation page | the source repo's `docs/` (antasphere/hub or antasphere/slideless), then `npm run sync` |
| Sidebar structure / titles | the source repo's `docs/nav.yml` |
| Which groups sit under which tab of a product (five at most) | `sync/tools.yml` (`tabs:`, by the groups' titles; the sync refuses a group left out or placed twice) |
| Changelog wording | `sync/changelog/<tool>/<version>.md` (editable; never regenerated) |
| Palette, faces, logo, navbar, code theme | `docs.json` (everything except `navigation`, which the sync writes) |
| The material: the field, the grain, the plates, the chrome, the type | `style.css` |
| A tool's landing band (title, lede, drawing), which groups stay bare | `sync/tools.yml` (`hero:`, `plain:`); the band itself is `snippets/HeroBand.jsx` + `.ant-hero` in `style.css` |
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

The site wears the look of the PRODUCTS (since 2026-09-22): the hub and
Slideless dashboards after their rebrand, so a person moving from their
account to a tool to its docs stays on one paper. The source of every value
is the products' own token file, `apps/dashboard/src/lib/tokens.css` in
either repo (the two are twins); `company/brand` still carries the older
graphite/glacier skin and is NOT the source here. The vocabulary, in the
products' own words: the creme **paper** (#F7F4EC; at night Clave's charcoal
#34302C — the ash ramp of clave-app's `[data-theme="charcoal"]`, nothing in it
black — rather than the products' near-black) under a
quiet seeded **field** with the film **grain**; **plates** of translucent
paper on one **hairline** (#E0DACA); a warm umber **accent** (#7A6652, its
deep ink #5C4D3E for text; terracotta #DB7D5F at night) for the few things an
accent touches; the one action **ink on paper**; Sentient over Synonym; one
motion (160 ms, `cubic-bezier(0.2, 0, 0, 1)`). Two files carry it and they
are read together.

`docs.json` holds what Mintlify has a field for: `colors` (the accent, its
night and its deep ink), `background.color` (the paper), `fonts` (Sentient
Light and Synonym Variable, self-hosted under `fonts/`), `logo`, `favicon`,
`navbar`, and `styling.codeblocks.theme` (rose-pine-dawn / rose-pine-moon,
the warm pair; the block's own plate comes from style.css). `style.css` holds
what it does not, and Mintlify loads it on every page with no reference from
`docs.json`:

- **The tokens**, verbatim from the products, light and dark, so a value can
  be checked against its source by name.
- **The ground.** The field is painted over Mintlify's flat sheet
  (`#background-color`) as pools of the umber paper's hues at the products'
  default level, and the grain as an overlay sheet on top. A whisper: the
  2026-09-17 objection (a pooled field read as a dim, uneven page) was to a
  field at full strength beside a flat bar; the bar is now a plate on the
  same field, as the products' shell is.
- **The faces' other weights** as `@font-face`, so no weight is ever a
  synthesised bold. Body at 450 / -0.008em, the products' reading voice.
- **The heading tiers**, scoped to the reading column: h1 500 / -0.015em, h2–h6
  300 / -0.005em, h2 on a hairline.
- **The chrome.** The bar as a plate (its hairline only once scrolled), the
  logo at 22px, the search entry and the context menu as fields on the plate,
  the one button ink on paper on 10px corners, the sidebar straight on the
  field with its group titles in the eyebrow register (Synonym, 11px, 0.14em,
  uppercase, muted) and the open page on the accent's wash — never a fill.
- **The prose.** Links in the deep accent on a hairline underline, inline
  code as a chip of the sunken paper, quotes as the products' notice (a quiet
  plate, no bar on its side), tables as hairlines between rows, code blocks
  as the products' code plate, cards as sheets that lift under the pointer.
- **The bands** (`.ant-hero`): the products' page band, rendered by
  `snippets/HeroBand.jsx` — a seeded canvas field with the grain (painted
  once as an oversized sheet and drawn shifted, so no edge ever shows), one
  of the brand's drawings as a true 3D body (`latitudes`, `meridians`,
  `harmonic`, `lattice`, the products' `solids.ts` ported verbatim) turning
  about its centre toward the pointer, the ground sliding the other way, the
  words at the foot; nothing moves under prefers-reduced-motion. Three
  shapes, the sync's choice per page: the FULL band on a tool's index (title
  and lede from `tools.yml`'s `hero:` block), the COMPACT band on every
  section page and the changelog (the group as eyebrow, the page's title, no
  lede, the body dealt from the page's path, the FIELD the same on every page —
  one seed, `fieldSeed` in HeroBand.jsx; the intro stays in the body
  under it), and NONE on the pages of the groups `tools.yml` lists as `plain:`
  — the references written for agents — so a bare page reads as "not for
  you". On a band page Mintlify's own title and subtitle are hidden and its
  Copy page menu sits in the band's top-right corner.

`style.css` USED to be a byte-identical sibling of
`labs/products/exos/exos/docs/style.css`; the two diverged on 2026-09-22 (the
Exos docs keep the company skin). Port nothing between them by reflex.

Assets: `logo/{light,dark}.svg` is the lockup generated from the brand's mark
module (`company/brand/src/lib/mark.js`, `assetSvg('lockup', tone)`) with the
wordmark outlined (a logo loads as an `<img>`, where no webfont reaches it);
`favicon.svg` is `assetSvg('tile', 'light')`, the creme tile the products
carry too. Regenerate the three together from the module, never by hand.

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
