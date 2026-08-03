import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fieldNotes } from "../../data";
import styles from "../dossier-blog.module.css";

export function generateStaticParams() {
  return fieldNotes.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = fieldNotes.find((entry) => entry.slug === slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} — Field Notes`,
    description: post.deck,
  };
}

function headingId(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default async function DossierFieldNote({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const postIndex = fieldNotes.findIndex((entry) => entry.slug === slug);
  const post = fieldNotes[postIndex];

  if (!post) {
    notFound();
  }

  const nextPost = fieldNotes[(postIndex + 1) % fieldNotes.length];

  return (
    <div className={styles.scene}>
      <a className={styles.skipLink} href="#field-note">
        Skip to field note
      </a>

      <header className={`${styles.utility} ${styles.articleUtility}`}>
        <p>
          FN–{post.index} <span aria-hidden="true">/</span> Declassified
        </p>
        <Link href="/blog">
          <span className={styles.desktopLabel}>Field note </span>index ↗
        </Link>
      </header>

      <main className={`${styles.frame} ${styles.articleFrame}`} id="field-note">
        <article className={`${styles.paper} ${styles.articlePaper}`}>
          <div className={styles.folderTab}>
            FN–{post.index} / {post.category}
          </div>

          <header className={styles.articleHeader}>
            <div className={styles.filingLine}>
              <p>
                <span>Filed</span> {post.dateLabel}
              </p>
              <p>
                <span>Status</span> {post.status}
              </p>
              <p>
                <span>Read</span> {post.readTime}
              </p>
            </div>

            <p className={styles.kicker}>Declassified field note</p>
            <h1>{post.title}</h1>
            <p className={styles.articleDeck}>{post.deck}</p>

            <div className={styles.byline}>
              <p>
                <span>Author</span> Adithyan Arun Kumar
              </p>
              <p>
                <span>Discipline</span> Agentic security research
              </p>
              <div className={styles.declassifiedStamp} aria-hidden="true">
                Declassified
              </div>
            </div>
          </header>

          <div className={styles.articleGrid}>
            <aside className={styles.marginFile}>
              <p>Contents</p>
              <ol>
                {post.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#${headingId(section.heading)}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
              <dl>
                <div>
                  <dt>File</dt>
                  <dd>AK–FN–{post.index}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{post.category}</dd>
                </div>
                <div>
                  <dt>Distribution</dt>
                  <dd>Public</dd>
                </div>
              </dl>
            </aside>

            <div className={styles.prose}>
              {post.sections.map((section, index) => (
                <section
                  id={headingId(section.heading)}
                  key={section.heading}
                >
                  <div className={styles.sectionMarker}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <i aria-hidden="true" />
                  </div>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.callout ? (
                    <blockquote>
                      <span>Analyst note</span>
                      {section.callout}
                    </blockquote>
                  ) : null}
                </section>
              ))}
            </div>
          </div>

          <nav className={styles.nextFile} aria-label="Next field note">
            <div>
              <span>Next public file</span>
              <small>FN–{nextPost.index}</small>
            </div>
            <Link href={`/blog/${nextPost.slug}`}>
              <strong>{nextPost.title}</strong>
              <span aria-hidden="true">→</span>
            </Link>
          </nav>

          <footer className={styles.footer}>
            <Link href="/">AK–AIS–2026 / Main dossier</Link>
            <span>End of file FN–{post.index}</span>
          </footer>
        </article>
      </main>
    </div>
  );
}
