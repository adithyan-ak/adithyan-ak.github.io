import type { Metadata } from "next";
import type { Post } from "./posts";
import { absoluteUrl, postPath, SITE } from "./site";

export function pageAlternates(canonical: string): Metadata["alternates"] {
  return {
    canonical,
    types: {
      "application/rss+xml": [
        {
          url: "/rss.xml",
          title: `${SITE.name} — Field Notes`,
        },
      ],
    },
  };
}

export function postMetadata(post: Post): Metadata {
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.description;
  const canonicalPath = postPath(post.slug);
  const image = post.coverImage ?? "/og-dossier.png";

  return {
    title,
    description,
    keywords: post.tags,
    authors: [{ name: SITE.name, url: SITE.url }],
    creator: SITE.name,
    alternates: pageAlternates(canonicalPath),
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: SITE.locale,
      siteName: SITE.name,
      url: canonicalPath,
      title,
      description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [SITE.url],
      tags: post.tags,
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: post.title }],
    },
  };
}

export function postJsonLd(post: Post) {
  const url = absoluteUrl(postPath(post.slug));
  const image = absoluteUrl(post.coverImage ?? "/og-dossier.png");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.seoDescription ?? post.description,
        image: [image],
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        wordCount: post.wordCount,
        inLanguage: SITE.language,
        keywords: post.tags.join(", "),
        author: {
          "@type": "Person",
          name: SITE.name,
          url: SITE.url,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        isPartOf: {
          "@type": "Blog",
          "@id": `${absoluteUrl("/blog")}#blog`,
          name: `${SITE.name} — Field Notes`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Research dossier",
            item: SITE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Field notes",
            item: absoluteUrl("/blog"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: url,
          },
        ],
      },
    ],
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</gu, "\\u003c");
}
