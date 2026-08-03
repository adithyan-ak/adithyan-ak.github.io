import type { Metadata } from "next";
import Link from "next/link";
import { fieldNotes } from "../data";
import styles from "./dossier-blog.module.css";

export const metadata: Metadata = {
  title: "Field Notes — Adithyan Arun Kumar",
  description:
    "Declassified research notes on agent infrastructure, attack paths, security boundaries, and offensive engineering.",
};

export default function DossierFieldNotes() {
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
                <span>Series</span> AK–FN–2026
              </p>
              <p>
                <span>Entries</span> {String(fieldNotes.length).padStart(2, "0")}
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
                  Technical dispatches on agentic attack paths, protocol
                  boundaries, delegated authority, and offensive engineering.
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

            {fieldNotes.map((note) => (
              <Link
                className={styles.fileRow}
                href={`/blog/${note.slug}`}
                key={note.slug}
              >
                <div className={styles.fileNumber}>
                  <span>FN–{note.index}</span>
                  <small>{note.category}</small>
                </div>
                <div className={styles.fileSubject}>
                  <h2>{note.title}</h2>
                  <p>{note.deck}</p>
                  <small>
                    {note.status} / {note.readTime} read
                  </small>
                </div>
                <div className={styles.fileDate}>
                  <time dateTime={note.date}>{note.dateLabel}</time>
                  <span aria-hidden="true">Open ↗</span>
                </div>
              </Link>
            ))}
          </section>

          <aside className={styles.handlingNotes} aria-label="Archive information">
            <div>
              <span>Handling note 01</span>
              <p>
                Entries are research artifacts, not announcements. Each file
                records the boundary, evidence, and engineering consequence.
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
            <Link href="/">AK–AIS–2026 / Main dossier</Link>
            <span>End of index</span>
          </footer>
        </article>
      </main>
    </div>
  );
}
