import { fieldNotes } from "../data";

export const dynamic = "force-static";

const siteUrl = "https://adithyanak.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = fieldNotes
    .map(
      (post) => `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>${siteUrl}/blog/${post.slug}</link>
        <guid>${siteUrl}/blog/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description>${escapeXml(post.deck)}</description>
      </item>`,
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>Adithyan Arun Kumar — Field Notes</title>
        <link>${siteUrl}/blog</link>
        <description>Research notes on AI agent infrastructure security.</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
