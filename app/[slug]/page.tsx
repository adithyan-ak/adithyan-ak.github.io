import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateLabel, getAllPosts, getPostBySlug } from "@/lib/posts";
import { postJsonLd, postMetadata, serializeJsonLd } from "@/lib/seo";
import { postPath } from "@/lib/site";
import styles from "../blog/dossier-blog.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return post ? postMetadata(post) : {};
}

export default async function DossierFieldNote({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = getAllPosts();
  const postIndex = posts.findIndex((entry) => entry.slug === slug);
  const post = posts[postIndex];

  if (!post) notFound();

  const nextPost = posts[(postIndex + 1) % posts.length];
  const contents = post.tableOfContents.filter((item) => item.depth === 2);
  const wasUpdated = post.updatedAt !== post.publishedAt;

  return (
    <div className={styles.scene}>
      <a className={styles.skipLink} href="#field-note">
        Skip to field note
      </a>

      <header className={`${styles.utility} ${styles.articleUtility}`}>
        <p>
          FN–{post.file} <span aria-hidden="true">/</span> Declassified
        </p>
        <Link href="/blog">
          <span className={styles.desktopLabel}>Field note </span>index ↗
        </Link>
      </header>

      <main className={`${styles.frame} ${styles.articleFrame}`} id="field-note">
        <article className={`${styles.paper} ${styles.articlePaper}`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(postJsonLd(post)),
            }}
          />

          <div className={styles.folderTab}>
            FN–{post.file} / {post.category}
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
                <span>Read</span> {post.readingMinutes} min
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
                <span>Discipline</span> {post.category}
              </p>
              <div className={styles.declassifiedStamp} aria-hidden="true">
                Declassified
              </div>
            </div>
          </header>

          <div className={styles.articleGrid}>
            <aside className={styles.marginFile} aria-label="File contents">
              <p>Contents</p>
              <ol>
                {contents.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>
                      <span>{item.index}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
              <dl>
                <div>
                  <dt>File</dt>
                  <dd>AK–FN–{post.file}</dd>
                </div>
                <div>
                  <dt>Words</dt>
                  <dd>{post.wordCount.toLocaleString("en-US")}</dd>
                </div>
                {wasUpdated ? (
                  <div>
                    <dt>Revised</dt>
                    <dd>{formatDateLabel(post.updatedAt)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Distribution</dt>
                  <dd>Public</dd>
                </div>
              </dl>
              <ul className={styles.tagList} aria-label="Topics">
                {post.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </aside>

            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </div>

          <nav className={styles.nextFile} aria-label="Next field note">
            <div>
              <span>Next public file</span>
              <small>FN–{nextPost.file}</small>
            </div>
            <Link href={postPath(nextPost.slug)}>
              <strong>{nextPost.title}</strong>
              <span aria-hidden="true">→</span>
            </Link>
          </nav>

          <footer className={styles.footer}>
            <Link href="/">AK–AIS–2026 / Main dossier</Link>
            <span>End of file FN–{post.file}</span>
          </footer>
        </article>
      </main>
    </div>
  );
}
