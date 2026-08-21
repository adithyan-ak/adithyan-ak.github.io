import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { pageAlternates } from "@/lib/seo";
import { postPath, SITE } from "@/lib/site";
import styles from "./dossier-blog.module.css";

export const metadata: Metadata = {
  title: SITE.title,
  description:
    "Independent research notes on agent infrastructure, attack paths, security boundaries, and offensive engineering.",
  alternates: pageAlternates("/blog"),
  openGraph: {
    type: "website",
    url: "/blog",
    title: SITE.title,
    description:
      "Independent research notes on agent infrastructure, attack paths, security boundaries, and offensive engineering.",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description:
      "Independent research notes on agent infrastructure, attack paths, security boundaries, and offensive engineering.",
    images: ["/og-dossier.png"],
  },
};

export default function DossierFieldNotes() {
  const posts = getAllPosts();

  return (
    <div className={styles.scene}>
      <a className={styles.skipLink} href="#field-note-index">
        Skip to field notes
      </a>

      <header className={styles.utility}>
        <p>
          File series FN <span aria-hidden="true">/</span> Public archive
        </p>
        <Link href="/">
          <span className={styles.desktopLabel}>Research </span>
          dossier ↗
        </Link>
      </header>

      <main className={styles.frame} id="field-note-index">
        <article className={styles.paper} aria-labelledby="field-notes-title">
          <div className={styles.folderTab}>Field notes / master index</div>

          <header className={styles.indexHeader}>
            <div className={styles.filingLine}>
              <p>
                <span>Series</span> AK-FN-2026
              </p>
              <p>
                <span>Entries</span> {String(posts.length).padStart(2, "0")}
              </p>
              <p>
                <span>Order</span> Newest first
              </p>
            </div>

            <div className={styles.indexTitle}>
              <div>
                <p className={styles.kicker}>Research archive / public record</p>
                <h1 id="field-notes-title">Field Notes</h1>
                <p>
                  Notes on agentic attack paths, protocol boundaries, delegated
                  authority, and offensive engineering.
                </p>
              </div>
              <div className={styles.archiveStamp} aria-hidden="true">
                Open files
              </div>
            </div>
          </header>

          <section className={styles.fileIndex} aria-label="Field note index">
            <div className={styles.indexLabels} aria-hidden="true">
              <span>Record</span>
              <span>Subject / abstract</span>
              <span>Filed</span>
            </div>

            {posts.map((post) => (
              <Link
                className={styles.fileRow}
                href={postPath(post.slug)}
                key={post.slug}
              >
                <div className={styles.fileNumber}>
                  <span>FN-{post.file}</span>
                  <small>{post.category}</small>
                </div>
                <div className={styles.fileSubject}>
                  <h2>{post.title}</h2>
                  <p>{post.deck}</p>
                  <small>{post.readingMinutes} min read</small>
                </div>
                <div className={styles.fileDate}>
                  <time dateTime={post.publishedAt}>{post.dateLabel}</time>
                  <span aria-hidden="true">Open ↗</span>
                </div>
              </Link>
            ))}
          </section>

          <aside className={styles.handlingNotes} aria-label="Archive information">
            <div>
              <span>Handling note 01</span>
              <p>
                These are technical notes rather than announcements. Each file
                records what I tested, what I observed, and what the evidence
                supports.
              </p>
            </div>
            <div>
              <span>Distribution</span>
              <p>
                <a href="/rss.xml">RSS feed ↗</a>
                <a href="mailto:adithyan@adithyanak.com">Email ↗</a>
              </p>
            </div>
          </aside>

          <footer className={styles.footer}>
            <Link href="/">AK-AIS-2026 / Main dossier</Link>
            <span>End of index</span>
          </footer>
        </article>
      </main>
    </div>
  );
}
