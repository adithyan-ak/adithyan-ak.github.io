# Adithyan Arun Kumar — Declassified Dossier

The canonical portfolio and research archive for Adithyan Arun Kumar.

## Routes

- `/` — public research dossier
- `/blog` — field-note index
- `/blog/[slug]` — individual research notes
- `/rss.xml` — RSS feed

The site uses a single archival design system across the portfolio, writing
index, articles, error page, metadata, and social preview.

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
```

## Deployment

Every push to `master` builds a static export and deploys it to GitHub Pages.
The custom domain is declared in `public/CNAME`.
