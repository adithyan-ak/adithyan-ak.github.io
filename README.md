# Adithyan Arun Kumar — Declassified Dossier

The canonical portfolio and research archive for Adithyan Arun Kumar. It is a
lean Next.js static export: articles are Markdown at authoring time and
pre-rendered HTML with no article-specific client JavaScript.

## URL policy

- `/` — public research dossier
- `/blog/` — field-note archive
- `/{slug}/` — canonical article URL
- `/rss.xml` — RSS feed

Articles intentionally live at the root. The four migrated Hashnode posts were
already published at those URLs, so retaining them preserves links and search
equity. `/blog/` is an archive, not part of an article's canonical path.

## Publish a field note

1. Copy `content/posts/_template.md` to `content/posts/{slug}.md`.
2. Replace every frontmatter value and set `draft: false` when it is ready.
3. Put durable images in `public/images/posts/` and reference them as
   `/images/posts/filename.ext`.
4. Run `npm test` and `npm run lint`.
5. Commit and push to `master`; GitHub Pages deploys the static export.

The article route, archive, home page, sitemap, RSS feed, Open Graph fields,
Twitter card, canonical URL, and Article/Breadcrumb JSON-LD all inherit from the
same frontmatter. There is no second metadata file to keep synchronized.

### Frontmatter contract

| Field | Purpose |
| --- | --- |
| `title` | Visible article H1 |
| `seoTitle` | Optional shorter search/social title |
| `description` | Search and social description; target 140–160 characters |
| `deck` | Human-readable abstract shown on the site |
| `slug` | Permanent root-level URL identifier; do not change after publishing |
| `file` | Two-digit dossier identifier |
| `publishedAt` / `updatedAt` | ISO 8601 timestamps |
| `category` / `tags` | Archive, feed, and article taxonomy |
| `coverImage` | Local article hero and social-preview image path |
| `coverImageAlt` | Descriptive alternative text for the hero and social image |
| `coverImageWidth` / `coverImageHeight` | Intrinsic pixel dimensions used to prevent layout shift |
| `status` | `Published` |
| `draft` | `true` keeps the post out of all generated routes |

Write H2 and H3 headings normally. They receive deterministic IDs, and H2
headings populate the article contents rail. Reading time and word count are
computed during the build.

## Local preview

```bash
npm install
npm run dev
```

Open `http://localhost:3000/`.

## Validation

```bash
npm test
npm run lint
npm audit --omit=dev
```

`npm test` performs a production static export and verifies routes, canonical
URLs, metadata, structured data, migrated content, RSS, sitemap, and artifacts.
