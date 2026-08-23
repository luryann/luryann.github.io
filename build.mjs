#!/usr/bin/env node
// Static site build. No dependencies, no config. Requires Node 18+.
//
//   node build.mjs          -> writes dist/
//
// How it works:
//   src/layout.html         the one shell every page uses ({{token}} holes)
//   src/pages/*.html        one file per page, first line is a <!--meta {...} --> comment
//   src/writing/*.html      one file per post, named YYYY-MM-DD-slug.html
//   src/assets/*            copied verbatim to dist/assets/
//
// Generated for you: the writing index, sitemap.xml, llms.txt, robots.txt,
// 404.html, .nojekyll, and the "Updated" date in the footer.
//
// To add a post: drop a file in src/writing/. Nothing else to touch.
// To add a page: drop a file in src/pages/ and add it to NAV below if it
// should appear in the nav.

import { readFile, writeFile, mkdir, readdir, rm, cp } from "node:fs/promises";
import { join, dirname } from "node:path";

const SITE = process.env.SITE_URL || "https://luryann.github.io";
const AUTHOR = "Ryan Lu";
const SRC = "src";
const OUT = "dist";

// nav order; key "" is the index. Keys must match a page's navKey.
const NAV = [
  ["", "index"],
  ["projects", "projects"],
  ["experience", "experience"],
  ["writing", "writing"],
  ["photos", "photos"],
  ["about", "about"],
  ["links", "links"],
];

const JSONLD = `<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"Person","@id":"#ryanlu","name":"Ryan Lu","givenName":"Ryan","familyName":"Lu","jobTitle":"Computer Engineering student","description":"Computer engineering student at UC Santa Barbara, based in Los Angeles, California. Web development, timing systems, research sales.","address":{"@type":"PostalAddress","addressLocality":"Los Angeles","addressRegion":"CA","addressCountry":"US"},
"email":"mailto:ryanlu@ucsb.edu","knowsLanguage":[{"@type":"Language","name":"English"},{"@type":"Language","name":"Chinese"}],
"alumniOf":{"@type":"CollegeOrUniversity","name":"University of California, Santa Barbara"},
"sameAs":["https://github.com/luryann"],
"worksFor":[{"@type":"Organization","name":"Lumos Scientific"},{"@type":"Organization","name":"Southern California Swimming"}]},
{"@type":"WebSite","name":"Ryan Lu","url":"${SITE}/","inLanguage":"en","about":{"@id":"#ryanlu"},"author":{"@id":"#ryanlu"}}]}
<\/script>`;

const UPDATED = (process.env.LAST_UPDATED || new Date().toISOString().slice(0, 10)).slice(0, 10);

const dashes = (s) => "-".repeat(s.length);
const rootFor = (path) => path === "" ? "./" : "../".repeat(path.replace(/\/$/, "").split("/").length);
const fill = (tpl, vals) => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vals ? vals[k] : m));

function parse(source) {
  const m = source.match(/^<!--meta\s([\s\S]*?)-->\s*/);
  if (!m) throw new Error("file is missing its <!--meta {...} --> header");
  return { meta: JSON.parse(m[1]), body: source.slice(m[0].length) };
}

const layout = await readFile(join(SRC, "layout.html"), "utf8");

function nav(activeKey, root) {
  return NAV.map(([key, label]) => {
    const href = root + (key ? key + "/" : "");
    const current = key === activeKey ? ' aria-current="page"' : "";
    return `      <a href="${href}"${current}>[${label}]</a>`;
  }).join("\n");
}

function render({ path, navKey, pageTitle, title, description, jsonld, content, rootOverride, noindex }) {
  const root = rootOverride || rootFor(path);
  const heading = title
    ? `    <div class="heading">\n      <h2>${title}</h2>\n      <div aria-hidden="true">${dashes(title)}</div>\n    </div>\n`
    : "";
  return fill(layout, {
    title: pageTitle || `${title} - ${AUTHOR}`,
    description,
    canonical: `${SITE}/${path}`,
    ogtype: path.startsWith("writing/") ? "article" : "website",
    root,
    nav: nav(navKey ?? null, root),
    heading,
    content: fill(content, { root, updated: UPDATED, photos: photoSlots(root) }),
    updated: UPDATED,
    jsonld: jsonld ? JSONLD : "",
  }).replace(
    /<link rel="canonical"[^>]*>/,
    noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}/${path}">`
  );
}

// Photo slots are emitted only for files that actually exist, so a fresh clone
// renders empty placeholders instead of logging image 404s.
const PHOTO_SLOTS = 8;
let photoFiles = [];
try {
  photoFiles = (await readdir(join(SRC, "assets", "photos")))
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort();
} catch {}

function photoSlots(root) {
  const slots = photoFiles.length ? photoFiles : new Array(PHOTO_SLOTS).fill(null);
  return slots.map((f) => {
    const img = f
      ? `\n      <img src="${root}assets/photos/${f}" alt="" loading="lazy" decoding="async">\n    `
      : "";
    return `  <li>\n    <div class="photo">${img}</div>\n  </li>`;
  }).join("\n");
}

async function emit(path, html) {
  const file = join(OUT, path, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// --- posts (newest first) ---
const postFiles = (await readdir(join(SRC, "writing"))).filter((f) => f.endsWith(".html")).sort().reverse();
const posts = [];
for (const f of postFiles) {
  const { meta, body } = parse(await readFile(join(SRC, "writing", f), "utf8"));
  posts.push({ ...meta, body });
}

for (const p of posts) {
  const path = `writing/${p.slug}/`;
  const root = rootFor(path);
  const content =
    `    <article>\n      <div class="dim">${p.date}</div>\n      <div class="prose">\n${p.body.trim().split("\n").map((l) => "        " + l).join("\n")}\n      </div>\n      <div><a href="${root}writing/">[back to writing]</a></div>\n    </article>\n`;
  await emit(path, render({ path, navKey: "writing", title: p.title, description: p.description, content }));
}

// --- writing index, generated from the posts above ---
const writingIndex =
  `    <ul class="list list--tight">\n` +
  posts.map((p) => `      <li class="row"><span class="dim">${p.date}</span><a href="../writing/${p.slug}/">${p.title}</a></li>`).join("\n") +
  `\n    </ul>\n`;
await emit("writing/", render({
  path: "writing/", navKey: "writing", title: "writing",
  description: "Posts on swim timing systems, cars, music, and building things that last.",
  content: writingIndex,
}));

// --- pages ---
const pageFiles = (await readdir(join(SRC, "pages"))).filter((f) => f.endsWith(".html"));
const pages = [];
for (const f of pageFiles) {
  const { meta, body } = parse(await readFile(join(SRC, "pages", f), "utf8"));
  pages.push({ ...meta, content: body });
  await emit(meta.path, render({ ...meta, content: body }));
}

// --- 404 ---
// Pages serves this file for a miss at any depth while the URL stays put, so it
// is the one page that must use root-absolute paths.
await writeFile(join(OUT, "404.html"), render({
  path: "", rootOverride: "/", noindex: true,
  navKey: null, pageTitle: "Not found - " + AUTHOR, title: "404",
  description: "Page not found.",
  content: `    <div class="prose">\n      <p>That page does not exist.</p>\n      <p><a href="/">[back to index]</a></p>\n    </div>\n`,
}));

// --- assets ---
await cp(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });

// --- sitemap / robots / llms / nojekyll ---
const urls = ["", ...pages.map((p) => p.path).filter((p) => p !== ""), "writing/", ...posts.map((p) => `writing/${p.slug}/`)];
await writeFile(join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [...new Set(urls)].map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${UPDATED}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`);

await writeFile(join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

await writeFile(join(OUT, "llms.txt"),
  `# Ryan Lu\n\n> Computer engineering student at UC Santa Barbara, based in Los Angeles, California. Web development, swim timing systems, research sales.\n\nContact: ryanlu@ucsb.edu\nGitHub: https://github.com/luryann\n\n## Pages\n` +
  `- [Index](${SITE}/): who I am, one paragraph.\n` +
  pages.filter((p) => p.path).map((p) => `- [${p.title}](${SITE}/${p.path}): ${p.description}\n`).join("") +
  `- [Writing](${SITE}/writing/): posts.\n` +
  posts.map((p) => `  - [${p.title}](${SITE}/writing/${p.slug}/) ${p.date}\n`).join("") +
  `\n## Notes for crawlers\nEvery page is a separate static HTML document with all of its text in the initial response. No JavaScript is required to read anything.\n`);

await writeFile(join(OUT, ".nojekyll"), "");

console.log(`built ${pages.length + posts.length + 2} pages -> ${OUT}/`);
