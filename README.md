# ryan lu — personal site

Static site, built by Jekyll — which is baked directly into GitHub Pages.
Push to `main` and GitHub builds and serves it. No workflow file, no Node, no
generated output committed to the repo.

## Layout

    _config.yml          site title/url, the shared nav, plugin list
    _layouts/default.html  the shell every page shares (head, nav, footer)
    _layouts/post.html     wraps a writing post's date/prose/back-link, then default
    _includes/nav.html      the nav partial
    _includes/footer.html   the footer partial
    assets/site.css       all styling
    assets/site.js        theme toggle, LA clock, academic year
    assets/photos/        01.webp, 02.webp, ... for the photos page
    _posts/                one file per writing post, named YYYY-MM-DD-slug.html
    about.html, experience.html, index.html, links.html, photos.html,
    privacy.html, projects.html, writing.html, 404.html
                          top-level pages, each its own file with front matter
    llms.txt              front matter + Liquid, so it's generated like any page
    robots.txt             plain static file

Everything here (aside from `_config.yml`) is a real page you edit directly —
there is no separate source tree and no build step to remember to run. Jekyll
reads the front matter (`layout`, `title`, `navKey`, `description`, ...) and
the rest of the file is the page body.

## Local preview

    bundle install
    bundle exec jekyll serve

Requires Ruby (`brew install ruby` if the system one is too old — check with
`ruby -v`, want 3.0+). Visit `http://localhost:4000`.

## Adding a post

Create `_posts/2026-09-01-my-post.html`:

    ---
    layout: post
    navKey: writing
    title: "my post"
    description: "One line for search results."
    ---
    <p>First paragraph.</p>
    <p>Second paragraph.</p>

The date and slug come from the filename. It's picked up by `/writing.html`,
the sitemap, and `llms.txt` automatically, and renders at `/writing/my-post.html`.

## Adding a page

Create `thing.html` at the repo root with front matter:

    ---
    layout: default
    navKey: thing
    title: thing
    description: "One line for search results and llms.txt."
    ---
    <p>Page content.</p>

If it should appear in the nav, add it to the `nav:` list in `_config.yml`
(`key` must match `navKey` above) — otherwise it's reachable by URL/links only,
same as `privacy.html`.

## Photos

Drop images in `assets/photos/`, named `01.ext`, `02.ext` and so on —
`photos.html` reads that folder at build time and emits one slot per file,
sorted by filename. With the folder empty it renders eight striped
placeholders.

Compress and strip metadata before adding a photo — phone photos carry
GPS/EXIF data and are typically several MB straight off the camera, wasted
weight at the ~180–500px grid tile these render at. A quick recipe:

    python3 -c "
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open('IN.jpg')).convert('RGB')
    scale = 1200 / max(im.size)
    if scale < 1: im = im.resize([round(d*scale) for d in im.size])
    im.save('assets/photos/01.webp', 'WEBP', quality=80, method=6)
    "

Not passing `exif=` to `.save()` drops all metadata, including GPS.

## Generated for you

`/writing.html`'s post list, `sitemap.xml` (via the `jekyll-sitemap` plugin),
`llms.txt`, the footer's "Updated" date (`site.time`, the build timestamp).

## Deploying

GitHub Pages is set to **Deploy from a branch** (Settings → Pages → Source →
Deploy from a branch → `main` → `/ (root)`). GitHub runs Jekyll itself on
every push — that's what "Deploy from a branch" means when a `_config.yml`
is present. There is nothing else to configure and no CI to maintain.

`jekyll-sitemap` is on [GitHub Pages' plugin
allowlist](https://pages.github.com/versions/), so it runs there with no
extra setup.

## Notes

- No analytics, no cookies, no third-party requests. One `localStorage` key,
  `rl-theme`, documented at `/privacy.html`.
- Everything renders server-side — no JavaScript is required to read any
  page. `assets/site.js` only handles the theme toggle, the LA clock, and the
  academic-year label.
