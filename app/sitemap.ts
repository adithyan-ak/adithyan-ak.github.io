import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { absoluteUrl, postPath } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latestUpdate = posts.reduce(
    (latest, post) =>
      Date.parse(post.updatedAt) > Date.parse(latest) ? post.updatedAt : latest,
    posts[0]?.updatedAt ?? new Date().toISOString(),
  );

  return [
    {
      url: absoluteUrl(),
      lastModified: new Date(latestUpdate),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date(latestUpdate),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(postPath(post.slug)),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
