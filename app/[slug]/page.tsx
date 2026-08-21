import type { Metadata } from "next";
import Image from "next/image";
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

  return (
    <div className={styles.scene}>
      <a className={styles.skipLink} href="#field-note">
        Skip to field note
      </a>

      <header className={`${styles.utility} ${styles.articleUtility}`}>
        <p>
          FN-{post.file} <span aria-hidden="true">/</span> Field note
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
            FN-{post.file} / {post.category}
          </div>

          <header className={styles.articleHeader}>
            <div className={styles.filingLine}>
              <p>
                <span>Filed</span> {post.dateLabel}
              </p>
              <p>
                <span>Revised</span> {formatDateLabel(post.updatedAt)}
              </p>
              <p>
                <span>Read</span> {post.readingMinutes} min
              </p>
            </div>

            <p className={styles.kicker}>Independent research field note</p>
            <h1>{post.title}</h1>
            <p className={styles.articleDeck}>{post.deck}</p>

            {post.coverImage ? (
              <figure className={styles.articleCover}>
                <Image
                  src={post.coverImage}
                  alt={post.coverImageAlt ?? post.title}
                  width={post.coverImageWidth ?? 1600}
                  height={post.coverImageHeight ?? 900}
                  priority
                  fetchPriority="high"
                />
              </figure>
            ) : null}

            <div className={styles.byline}>
              <p>
                <span>Author</span> Adithyan Arun Kumar
              </p>
              <p>
                <span>Discipline</span> {post.category}
              </p>
              <div className={styles.topicBlock}>
                <ul className={styles.tagList} aria-label="Topics">
                  {post.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </div>
          </header>

          <div className={styles.articleBody}>
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </div>

          <nav className={styles.nextFile} aria-label="Next field note">
            <div>
              <span>Next public file</span>
              <small>FN-{nextPost.file}</small>
            </div>
            <Link href={postPath(nextPost.slug)}>
              <strong>{nextPost.title}</strong>
              <span aria-hidden="true">→</span>
            </Link>
          </nav>

          <footer className={styles.footer}>
            <Link href="/">AK-AIS-2026 / Main dossier</Link>
            <span>End of file FN-{post.file}</span>
          </footer>
        </article>
      </main>
    </div>
  );
}
