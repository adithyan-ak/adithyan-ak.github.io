import type { Metadata } from "next";
import Link from "next/link";
import {
  advisories,
  capabilities,
  experience,
  publications,
  selectedSystems,
  talks,
} from "./data";
import { getAllPosts } from "@/lib/posts";
import { pageAlternates } from "@/lib/seo";
import { postPath } from "@/lib/site";
import styles from "./dossier.module.css";

export const metadata: Metadata = {
  title: "Declassified Dossier — Adithyan Arun Kumar",
  description:
    "The public research dossier of agentic security researcher Adithyan Arun Kumar.",
  alternates: pageAlternates("/"),
};

export default function Home() {
  const posts = getAllPosts().slice(0, 4);

  return (
    <div className={styles.scene}>
      <a className={styles.skipLink} href="#dossier-content">
        Skip to dossier
      </a>

      <header className={styles.utility}>
        <p>
          File AK–AIS–2026 <span aria-hidden="true">/</span> Declassified
        </p>
        <Link href="/blog">Field notes →</Link>
      </header>

      <main className={styles.frame} id="dossier-content">
        <article className={styles.paper} aria-labelledby="dossier-title">
          <div className={styles.folderTab}>Research file / 01</div>

          <header className={styles.masthead}>
            <div className={styles.filingLine}>
              <p>
                <span>File</span> AK–AIS–2026
              </p>
              <p>
                <span>Status</span> Active / Public
              </p>
              <p>
                <span>Discipline</span> Offensive research
              </p>
            </div>

            <div className={styles.identityGrid}>
              <div className={styles.identityLead}>
                <p className={styles.kicker}>Subject / public research record</p>
                <h1 id="dossier-title">
                  <span>Adithyan</span>
                  <span>Arun Kumar</span>
                </h1>
                <div className={styles.roleLine}>
                  <span>Classification</span>
                  <h2>Agentic Security Researcher</h2>
                </div>
                <div className={styles.briefBlock}>
                  <span>Research brief</span>
                  <p className={styles.abstract}>
                    I study how agents, protocols, tools, credentials, and
                    runtimes combine into attack paths—then build open-source
                    systems that make those paths visible and testable.
                  </p>
                </div>
                <nav className={styles.contact} aria-label="Contact links">
                  <a href="mailto:adithyan@adithyanak.com">
                    <span>01</span> Email
                  </a>
                  <a
                    href="https://github.com/adithyan-ak"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>02</span> GitHub ↗
                  </a>
                  <Link href="/blog">
                    <span>03</span> Field notes
                  </Link>
                </nav>
              </div>

              <aside className={styles.profileCard} aria-label="Profile summary">
                <div className={styles.profileHeader}>
                  <span>Subject record</span>
                  <div className={styles.clearanceStamp} aria-hidden="true">
                    <strong>Declassified</strong>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Current post</dt>
                    <dd>Senior Security Engineer — AI, Salesforce</dd>
                  </div>
                  <div>
                    <dt>Education</dt>
                    <dd>M.S. Information Security, Carnegie Mellon</dd>
                  </div>
                  <div>
                    <dt>Focus</dt>
                    <dd>Trust paths across the agentic stack</dd>
                  </div>
                </dl>
                <div className={styles.profileFooter}>
                  <span>AK–AIS–2026</span>
                  <span>Active / public</span>
                </div>
              </aside>
            </div>
          </header>

          <div className={styles.redactionRule} aria-hidden="true">
            <span />
            <i />
            <span />
          </div>

          <section className={styles.section} aria-labelledby="systems-title">
            <div className={styles.sectionHeading}>
              <p>Section 01</p>
              <h2 id="systems-title">Selected systems</h2>
              <span>{selectedSystems.length.toString().padStart(2, "0")} files</span>
            </div>

            <div className={styles.systemGrid}>
              {selectedSystems.map((system) => (
                <article className={styles.systemCard} key={system.name}>
                  <p className={styles.recordLabel}>
                    <span>{system.index}</span> {system.label}
                  </p>
                  <h3>{system.name}</h3>
                  <p>{system.description}</p>
                  <ul aria-label={`${system.name} technologies`}>
                    {system.meta.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a href={system.href} target="_blank" rel="noreferrer">
                    Open repository <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="advisories-title">
            <div className={styles.sectionHeading}>
              <p>Section 02</p>
              <h2 id="advisories-title">Public advisory ledger</h2>
              <span>Reviewed records</span>
            </div>

            <div className={styles.ledger} role="list">
              {advisories.map((advisory) => (
                <a
                  href={advisory.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.ledgerRow}
                  key={advisory.id}
                  role="listitem"
                >
                  <strong>{advisory.id}</strong>
                  <span>{advisory.project}</span>
                  <p>{advisory.finding}</p>
                  <small>{advisory.status} ↗</small>
                </a>
              ))}
            </div>
          </section>

          <section
            className={`${styles.section} ${styles.notesSection}`}
            id="field-notes"
            aria-labelledby="notes-title"
          >
            <div className={styles.sectionHeading}>
              <p>Section 03</p>
              <h2 id="notes-title">Field notes</h2>
              <Link href="/blog">Complete index ↗</Link>
            </div>

            <div className={styles.notesGrid}>
              {posts.map((post) => (
                <article className={styles.note} key={post.slug}>
                  <div>
                    <span>FN–{post.file}</span>
                    <time dateTime={post.publishedAt}>{post.dateLabel}</time>
                  </div>
                  <p>{post.category}</p>
                  <h3>
                    <Link href={postPath(post.slug)}>{post.title}</Link>
                  </h3>
                  <p>{post.deck}</p>
                  <small>{post.readingMinutes} MIN READ / PUBLISHED</small>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.archive} aria-label="Background and credentials">
            <div className={styles.archiveColumn}>
              <div className={styles.sectionHeading}>
                <p>Section 04</p>
                <h2>Service record</h2>
                <span>06+ years</span>
              </div>
              <ol className={styles.serviceList}>
                {experience.map((item) => (
                  <li key={`${item.period}-${item.organization}`}>
                    <details>
                      <summary>
                        <time>{item.period}</time>
                        <span className={styles.serviceIdentity}>
                          <strong>{item.organization}</strong>
                          <span>{item.role}</span>
                        </span>
                        <span className={styles.disclosureIcon} aria-hidden="true">
                          +
                        </span>
                      </summary>
                      <ul>
                        {item.responsibilities.map((responsibility) => (
                          <li key={responsibility}>{responsibility}</li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.archiveColumn}>
              <div className={styles.sectionHeading}>
                <p>Section 05</p>
                <h2>Capabilities</h2>
                <span>Working set</span>
              </div>
              <dl className={styles.capabilityList}>
                {capabilities.map((capability) => (
                  <div key={capability.label}>
                    <dt>{capability.label}</dt>
                    <dd>{capability.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className={styles.references} aria-labelledby="references-title">
            <div className={styles.sectionHeading}>
              <p>Section 06</p>
              <h2 id="references-title">Selected record</h2>
              <span>Publications / Talks</span>
            </div>
            <div className={styles.referenceGrid}>
              <ol>
                {publications.map((publication, index) => (
                  <li key={publication}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {publication}
                  </li>
                ))}
              </ol>
              <div className={styles.talks}>
                {talks.map((talk) => (
                  <article key={talk.title}>
                    <span>{talk.label}</span>
                    <h3>{talk.title}</h3>
                    <p>{talk.meta}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <footer className={styles.dossierFooter}>
            <p>
              <strong>End of public record.</strong> Research responsibly.
            </p>
            <div aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <a href="mailto:adithyan@adithyanak.com">
              adithyan@adithyanak.com
            </a>
          </footer>
        </article>
      </main>
    </div>
  );
}
