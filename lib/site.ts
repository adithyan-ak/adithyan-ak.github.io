export const SITE = {
  name: "Adithyan Arun Kumar",
  title: "Adithyan Arun Kumar — Agentic Security Researcher",
  description:
    "Agentic security research, open-source systems, public advisories, and technical field notes by Adithyan Arun Kumar.",
  url: "https://adithyanak.com",
  locale: "en_US",
  language: "en-US",
  email: "adithyan@adithyanak.com",
  github: "https://github.com/adithyan-ak",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE.url).toString();
}

export function postPath(slug: string) {
  return `/${slug}`;
}
