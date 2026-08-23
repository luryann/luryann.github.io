# ryan lu — personal site

Static HTML. No framework, no dependencies. `build.mjs` wraps content files in
one shared layout and writes `dist/`, which GitHub Actions deploys to Pages.

## Build

    node build.mjs        # requires Node 18+, writes dist/

Serve it locally with anything, e.g. `npx serve dist` or `python3 -m http.server -d dist`.

## Layout

    src/layout.html          the shell every page shares (nav, footer, head)
    src/assets/site.css      all styling
    src/assets/site.js       theme toggle, LA clock, academic year
    src/assets/photos/       01.jpg … 08.jpg for the photos page
    src/pages/*.html         one file per page
    src/writing/*.html       one file per post, named YYYY-MM-DD-slug.html
    build.mjs                the build
    dist/                    generated output — never edit, never commit

Each content file starts with a `<!--meta {...} -->` header holding its title,
URL path, and description. Everything else in it is the page body.

## Adding a post

Create `src/writing/2026-09-01-my-post.html`:

    <!--meta {"slug":"my-post","date":"2026-09-01","title":"my post","description":"One line for search results."} -->
    <p>First paragraph.</p>
    <p>Second paragraph.</p>

That is the whole step. The build adds it to `/writing/`, the sitemap, and
`llms.txt`, and renders `/writing/my-post/`.

## Adding a page

Create `src/pages/thing.html` with a meta header containing `path`, `title`,
`navKey`, and `description`. If it should appear in the nav, add its key to the
`NAV` array at the top of `build.mjs`.

## Photos

Drop portrait (9:16) images in `src/assets/photos/`. The build reads that folder
and emits one slot per file, sorted by filename, so name them `01.jpg`, `02.jpg`
and so on. With the folder empty it renders eight striped placeholders — change
`PHOTO_SLOTS` in `build.mjs` to adjust that count.

## Generated for you

The writing index, `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html`,
`.nojekyll`, and the footer's "Updated" date.

## Deploying

Push to `main`. `.github/workflows/pages.yml` builds and deploys. Enable Pages
once under Settings → Pages → Source: **GitHub Actions**.

Set the site URL in one place: repository variable `SITE_URL` (Settings →
Secrets and variables → Actions → Variables). It only affects canonical tags,
the sitemap, and `llms.txt`. For a custom domain, also add `src/assets/../CNAME`
handling or set the domain in Settings → Pages.

## Notes

- No analytics, no cookies, no third-party requests. One `localStorage` key,
  `rl-theme`, documented at `/privacy/`.
- Internal links are relative, so the site works at a domain root, in a
  subdirectory, and from the filesystem.
