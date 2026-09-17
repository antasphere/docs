#!/usr/bin/env node
/**
 * Docs sync pipeline.
 *
 * Pulls each tool's `docs/` tree (public pages + nav.yml) and git release tags
 * into this site: transforms .md → .mdx (frontmatter from the H1, links
 * rewritten, MDX hazards rejected), regenerates navigation.products in
 * docs.json, seeds editable changelog entries from tags, assembles the
 * per-tool changelog pages, and regenerates llms.txt.
 *
 * Local run: `npm run sync` (reads sibling checkouts via sync/tools.yml).
 * CI run: TOOL_CHECKOUT_<SLUG> env vars point at the checked-out tool repos.
 *
 * The generated trees (<slug>/) are wiped and rebuilt on every run; changelog
 * entry files under sync/changelog/ are seeded once and NEVER overwritten.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function fail(msg) {
  errors.push(msg);
}

function git(dir, args) {
  return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
}

function readYaml(file) {
  return YAML.parse(fs.readFileSync(file, "utf8"));
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const config = readYaml(path.join(ROOT, "sync", "tools.yml"));
const DOMAIN = config.site.domain;

function checkoutDir(tool) {
  const env = process.env[`TOOL_CHECKOUT_${tool.slug.toUpperCase()}`];
  const dir = env ? path.resolve(env) : path.resolve(ROOT, tool.localPath);
  if (!fs.existsSync(path.join(dir, "docs", "nav.yml"))) {
    throw new Error(
      `[${tool.slug}] no docs/nav.yml under ${dir} — wrong checkout path?`
    );
  }
  return dir;
}

// ---------------------------------------------------------------------------
// Markdown helpers (fence- and inline-code-aware)
// ---------------------------------------------------------------------------
/** Split a line into segments, tagging inline-code spans. */
function segments(line) {
  return line.split(/(`[^`]*`)/g).map((text) => ({
    code: text.startsWith("`") && text.endsWith("`") && text.length > 1,
    text,
  }));
}

/** Iterate non-fence lines of a document, giving fence state per line. */
function* proseLines(lines) {
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) yield { i, line };
  }
}

function stripInlineMd(text) {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max = 180) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

// ---------------------------------------------------------------------------
// Per-tool content sync
// ---------------------------------------------------------------------------
function listPages(docsDir) {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) {
        out.push(path.relative(docsDir, full).replace(/\.md$/, ""));
      }
    }
  })(docsDir);
  return out.sort();
}

function validateNav(tool, nav, pages) {
  const navPages = nav.groups.flatMap((g) => g.pages);
  const seen = new Set();
  for (const p of navPages) {
    if (seen.has(p)) fail(`[${tool.slug}] nav.yml lists "${p}" twice`);
    seen.add(p);
  }
  for (const p of navPages) {
    if (!pages.includes(p))
      fail(`[${tool.slug}] nav.yml lists "${p}" but docs/${p}.md is missing`);
  }
  for (const p of pages) {
    if (!seen.has(p))
      fail(`[${tool.slug}] docs/${p}.md exists but is not in nav.yml`);
  }
}

function transformPage(tool, docsDir, relNoExt, fileMap) {
  const srcFile = path.join(docsDir, relNoExt + ".md");
  const raw = fs.readFileSync(srcFile, "utf8");
  const lines = raw.split("\n");

  // Title: the leading H1.
  const h1Index = lines.findIndex((l) => /^# /.test(l));
  const before = lines.slice(0, h1Index).filter((l) => l.trim() !== "");
  if (h1Index === -1 || before.length > 0) {
    fail(`[${tool.slug}] ${relNoExt}.md must start with an H1 ("# …")`);
    return null;
  }
  const title = lines[h1Index].replace(/^#\s+/, "").trim();
  const body = lines.slice(h1Index + 1);
  while (body.length && body[0].trim() === "") body.shift();

  // Description: the first prose paragraph (stop at headings/fences/tables/lists).
  const para = [];
  for (const line of body) {
    const t = line.trim();
    if (t === "") {
      if (para.length) break;
      continue;
    }
    if (/^(#|```|~~~|\||[-*+] |> |\d+\. |<)/.test(t)) break;
    para.push(t);
  }
  // The intro IS the page's description (Mintlify renders it under the title
  // as the subtitle), so it leaves the body: rendering it twice — once as the
  // subtitle, once as the first paragraph — was the site's most visible flaw.
  // Whole, not truncated: a subtitle cut with an ellipsis reads as an error.
  // Links inside it flatten to their text; an intro that needs a live link
  // repeats it in the body. llms.txt truncates its own copy.
  const description = stripInlineMd(para.join(" "));
  if (para.length) {
    body.splice(0, para.length);
    while (body.length && body[0].trim() === "") body.shift();
  }

  // Link rewriting + MDX hazard lint on prose.
  for (const { i, line } of proseLines(body)) {
    const segs = segments(line);
    let rebuilt = "";
    for (const seg of segs) {
      if (seg.code) {
        rebuilt += seg.text;
        continue;
      }
      let text = seg.text;
      // Rewrite relative .md links → absolute extensionless site paths.
      text = text.replace(
        /\]\(([^)\s]+?\.md)(#[^)]*)?\)/g,
        (match, target, anchor = "") => {
          if (/^[a-z]+:\/\//.test(target)) return match;
          const resolved = path.posix
            .normalize(path.posix.join(path.posix.dirname(relNoExt), target))
            .replace(/\.md$/, "");
          if (resolved.startsWith("..")) {
            fail(
              `[${tool.slug}] ${relNoExt}.md:${i + 1} links outside docs/: ${target}`
            );
            return match;
          }
          if (!fileMap.has(resolved)) {
            fail(
              `[${tool.slug}] ${relNoExt}.md:${i + 1} links to missing page: ${target}`
            );
            return match;
          }
          return `](${fileMap.get(resolved)}${anchor})`;
        }
      );
      // MDX hazards: any bare "<" glued to a following character (MDX starts
      // JSX-tag parsing on it, whatever the character), and bare "{" in prose.
      const tag = text.match(/(?<!\\)<(?=\S)/);
      if (tag) {
        fail(
          `[${tool.slug}] ${relNoExt}.md:${i + 1} bare "<" would parse as JSX/autolink: ${line.trim().slice(0, 80)}`
        );
      }
      if (/\{/.test(text)) {
        fail(
          `[${tool.slug}] ${relNoExt}.md:${i + 1} bare "{" would parse as a JSX expression: ${line.trim().slice(0, 80)}`
        );
      }
      rebuilt += text;
    }
    body[i] = rebuilt;
  }

  const fm = [`title: ${JSON.stringify(title)}`];
  if (description) fm.push(`description: ${JSON.stringify(description)}`);
  return [
    "---",
    ...fm,
    "---",
    "",
    `{/* GENERATED from ${tool.repo} docs/${relNoExt}.md — edit there, then run \`npm run sync\`. */}`,
    "",
    ...body,
  ].join("\n");
}

function syncTool(tool) {
  const repoDir = checkoutDir(tool);
  const docsDir = path.join(repoDir, "docs");
  const nav = readYaml(path.join(docsDir, "nav.yml"));
  const pages = listPages(docsDir);
  validateNav(tool, nav, pages);

  const fileMap = new Map(pages.map((p) => [p, `/${tool.slug}/${p}`]));
  const outDir = path.join(ROOT, tool.slug);
  fs.rmSync(outDir, { recursive: true, force: true });

  const meta = new Map(); // page → {title, description} for llms.txt
  for (const page of pages) {
    const out = transformPage(tool, docsDir, page, fileMap);
    if (out == null) continue;
    const outFile = path.join(outDir, page + ".mdx");
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, out);
    const fmTitle = out.match(/^title: (".*")$/m);
    const fmDesc = out.match(/^description: (".*")$/m);
    meta.set(page, {
      title: fmTitle ? JSON.parse(fmTitle[1]) : page,
      description: fmDesc ? JSON.parse(fmDesc[1]) : "",
    });
  }

  const changelog = buildChangelog(tool, repoDir, outDir);
  return { tool, nav, pages, meta, changelog };
}

// ---------------------------------------------------------------------------
// Changelog: seed editable entries from git tags, assemble the page
// ---------------------------------------------------------------------------
function parseVersion(tag) {
  const m = tag.match(/v(\d+)\.(\d+)\.(\d+)/);
  return m ? m.slice(1).map(Number) : [0, 0, 0];
}

function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < 3; i++) if (va[i] !== vb[i]) return va[i] - vb[i];
  return 0;
}

function escapeMdx(text) {
  return text.replace(/</g, "\\<").replace(/\{/g, "\\{");
}

function cleanSubject(subject) {
  return subject.replace(/^[a-z]+(\([^)]*\))?!?:\s*/, "");
}

/**
 * Seed a changelog entry with the release TITLE ONLY, never the commit log.
 *
 * This used to dump every `feat:`/`fix:` subject between the two tags into
 * Added/Fixed sections. Commit subjects are written for the team: they carry
 * ticket ids, internal document names, the shape of what a review found, and
 * the occasional "not ready to ship". Every one of those published verbatim
 * (2026-09-16: 101 such lines were live on the public site the day the docs
 * went public). A commit log is not release notes, and no filter makes it
 * into release notes — so the body is a human's to write.
 *
 * The seed is therefore the frontmatter plus the tag's own subject, and the
 * file is written once and never regenerated (see buildChangelog), so a
 * rewritten entry survives every later sync. Write the body from the
 * product's own docs: what a reader can now do, in the words the docs use.
 */
function seedEntry(tag, date, subject, channel) {
  return (
    [
      "---",
      `version: ${JSON.stringify(tag)}`,
      `date: ${JSON.stringify(date)}`,
      `channel: ${channel}`,
      "---",
      "",
      escapeMdx(cleanSubject(subject) || tag),
      "",
    ].join("\n") + "\n"
  );
}

function buildChangelog(tool, repoDir, outDir) {
  const entriesDir = path.join(ROOT, "sync", "changelog", tool.slug);
  fs.mkdirSync(entriesDir, { recursive: true });

  const refs = git(repoDir, [
    "for-each-ref",
    "refs/tags",
    "--format=%(refname:short)|%(creatordate:short)|%(subject)",
  ])
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [tag, date, ...rest] = l.split("|");
      return { tag, date, subject: rest.join("|") };
    });

  for (const channel of ["product", "cli"]) {
    const series = refs
      .filter((r) =>
        channel === "cli" ? /^cli-v\d/.test(r.tag) : /^v\d/.test(r.tag)
      )
      .sort((a, b) => compareVersions(a.tag, b.tag));
    series.forEach((ref) => {
      const entryFile = path.join(entriesDir, `${ref.tag}.md`);
      if (fs.existsSync(entryFile)) return; // seeded once, never overwritten
      fs.writeFileSync(entryFile, seedEntry(ref.tag, ref.date, ref.subject, channel));
      console.log(
        `[${tool.slug}] seeded changelog entry ${ref.tag} (title only — write its body by hand)`
      );
    });
  }

  // Assemble the page from ALL entry files (including hand-edited ones).
  const entries = fs
    .readdirSync(entriesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(entriesDir, f), "utf8");
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!m) {
        fail(`[${tool.slug}] changelog entry ${f} has no frontmatter`);
        return null;
      }
      const fm = YAML.parse(m[1]);
      return { ...fm, body: m[2].trim(), file: f };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || compareVersions(b.version, a.version)
    );

  const blocks = entries.map((e) => {
    const tags = e.channel === "cli" ? ` tags={["CLI"]}` : "";
    return `<Update label="${e.version}" description="${e.date}"${tags}>\n\n${e.body}\n\n</Update>`;
  });

  const page = [
    "---",
    `title: "Changelog"`,
    `description: "Release history, sourced from ${tool.repo} release tags."`,
    "---",
    "",
    `{/* GENERATED — edit the entry files under sync/changelog/${tool.slug}/, then run \`npm run sync\`. */}`,
    "",
    ...blocks,
    "",
  ].join("\n");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "changelog.mdx"), page);
  return entries.length;
}

// ---------------------------------------------------------------------------
// docs.json navigation + llms.txt
// ---------------------------------------------------------------------------
function writeNavigation(results) {
  const docsJsonPath = path.join(ROOT, "docs.json");
  const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, "utf8"));
  // The anchors above every sidebar come from tools.yml (site.anchors), so the
  // sync — which owns `navigation` whole — writes them back on every run.
  const anchors = config.site?.anchors ?? [];
  docsJson.navigation = {
    ...(anchors.length ? { global: { anchors } } : {}),
    products: results.map(({ tool, nav }) => ({
      product: nav.product,
      description: nav.description,
      icon: tool.icon,
      groups: [
        ...nav.groups.map((g) => ({
          group: g.title,
          pages: g.pages.map((p) => `${tool.slug}/${p}`),
        })),
        { group: "Changelog", pages: [`${tool.slug}/changelog`] },
      ],
    })),
  };
  fs.writeFileSync(docsJsonPath, JSON.stringify(docsJson, null, 2) + "\n");
}

function writeLlmsTxt(results) {
  const lines = [
    "# Antasphere Documentation",
    "",
    "> Documentation for the Antasphere tool ecosystem: one account, every tool.",
    "> Each section below covers one product. Generated by sync/sync.mjs — do not edit.",
    "",
  ];
  for (const { tool, nav, meta } of results) {
    lines.push(`## ${nav.product}`, "");
    for (const group of nav.groups) {
      for (const page of group.pages) {
        const m = meta.get(page);
        if (!m) continue;
        const url = `https://${DOMAIN}/${tool.slug}/${page}`;
        lines.push(`- [${m.title}](${url})${m.description ? `: ${truncate(m.description)}` : ""}`);
      }
    }
    lines.push(`- [Changelog](https://${DOMAIN}/${tool.slug}/changelog): Release history for ${nav.product}.`, "");
  }
  fs.writeFileSync(path.join(ROOT, "llms.txt"), lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const results = [];
for (const tool of config.tools) {
  try {
    results.push(syncTool(tool));
  } catch (err) {
    fail(err.message);
  }
}

if (errors.length === 0) {
  writeNavigation(results);
  writeLlmsTxt(results);
  for (const { tool, pages, changelog } of results) {
    console.log(
      `[${tool.slug}] synced ${pages.length} pages + changelog (${changelog} entries)`
    );
  }
  console.log("sync OK");
} else {
  console.error(`sync FAILED with ${errors.length} error(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
