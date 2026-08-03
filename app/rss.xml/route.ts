import { getAllPosts } from "@/lib/posts";
import { absoluteUrl, postPath, SITE } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const posts = getAllPosts();
  const items = posts
    .map(
      (post) => `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>${absoluteUrl(postPath(post.slug))}</link>
        <guid isPermaLink="true">${absoluteUrl(postPath(post.slug))}</guid>
        <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        <category>${escapeXml(post.category)}</category>
        <description>${escapeXml(post.description)}</description>
      </item>`,
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Adithyan Arun Kumar — Field Notes</title>
        <link>${absoluteUrl("/blog")}</link>
        <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
        <description>${escapeXml(SITE.description)}</description>
        <language>${SITE.language}</language>
        <lastBuildDate>${new Date(posts[0]?.updatedAt ?? Date.now()).toUTCString()}</lastBuildDate>
        ${items}
      </channel>
    </rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
