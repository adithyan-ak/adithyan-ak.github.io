import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked, Renderer, type Tokens } from "marked";

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "posts");
const WORDS_PER_MINUTE = 220;

export type PostFrontmatter = {
  title: string;
  description: string;
  deck: string;
  slug: string;
  file: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  status: "Published";
  draft: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type TableOfContentsItem = {
  depth: 2 | 3;
  id: string;
  label: string;
  index: string;
};

export type Post = PostFrontmatter & {
  markdown: string;
  html: string;
  tableOfContents: TableOfContentsItem[];
  readingMinutes: number;
  wordCount: number;
  dateLabel: string;
};

export function formatDateLabel(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}`.toUpperCase();
}

function assertString(value: unknown, field: string, filename: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filename}: frontmatter field "${field}" must be a string`);
  }
  return value;
}

function readFrontmatter(data: Record<string, unknown>, filename: string) {
  const tags = data.tags;
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new Error(`${filename}: frontmatter field "tags" must be a string array`);
  }
  if (data.status !== "Published") {
    throw new Error(`${filename}: frontmatter field "status" must be "Published"`);
  }
  if (typeof data.draft !== "boolean") {
    throw new Error(`${filename}: frontmatter field "draft" must be a boolean`);
  }

  const frontmatter: PostFrontmatter = {
    title: assertString(data.title, "title", filename),
    description: assertString(data.description, "description", filename),
    deck: assertString(data.deck, "deck", filename),
    slug: assertString(data.slug, "slug", filename),
    file: assertString(data.file, "file", filename),
    publishedAt: assertString(data.publishedAt, "publishedAt", filename),
    updatedAt: assertString(data.updatedAt, "updatedAt", filename),
    category: assertString(data.category, "category", filename),
    tags,
    coverImage:
      typeof data.coverImage === "string" ? data.coverImage : undefined,
    status: data.status,
    draft: data.draft,
    seoTitle: typeof data.seoTitle === "string" ? data.seoTitle : undefined,
    seoDescription:
      typeof data.seoDescription === "string" ? data.seoDescription : undefined,
  };

  if (!/^\d{2}$/u.test(frontmatter.file)) {
    throw new Error(`${filename}: "file" must be a two-digit identifier`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(frontmatter.slug)) {
    throw new Error(`${filename}: "slug" must be lowercase and hyphen-separated`);
  }
  for (const field of ["publishedAt", "updatedAt"] as const) {
    if (Number.isNaN(Date.parse(frontmatter[field]))) {
      throw new Error(`${filename}: "${field}" must be a valid ISO date`);
    }
  }
  if (Date.parse(frontmatter.updatedAt) < Date.parse(frontmatter.publishedAt)) {
    throw new Error(`${filename}: "updatedAt" cannot precede "publishedAt"`);
  }

  return frontmatter;
}

function assertLocalAsset(assetPath: string, filename: string) {
  if (!assetPath.startsWith("/")) return;
  const localPath = path.join(process.cwd(), "public", assetPath.slice(1));
  if (!existsSync(localPath)) {
    throw new Error(`${filename}: missing local asset "${assetPath}"`);
  }
}

function validateMarkdownImages(markdown: string, filename: string) {
  for (const match of markdown.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/gu)) {
    const [, alt, source] = match;
    if (alt.trim() === "") {
      throw new Error(`${filename}: every image must have descriptive alt text`);
    }
    assertLocalAsset(source, filename);
  }
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/`[^`]*`/gu, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]+>/gu, " ")
    .replace(/[#>*_~|=-]/gu, " ");
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function createHeadingIdFactory() {
  const seen = new Map<string, number>();

  return (heading: string) => {
    const base = slugify(heading) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/"/gu, "&quot;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

function buildTableOfContents(markdown: string) {
  const headingId = createHeadingIdFactory();
  let section = 0;

  return new Marked()
    .lexer(markdown)
    .filter(
      (token): token is Tokens.Heading =>
        token.type === "heading" && (token.depth === 2 || token.depth === 3),
    )
    .map((token) => {
      if (token.depth === 2) section += 1;
      return {
        depth: token.depth as 2 | 3,
        id: headingId(token.text),
        label: token.text.replace(/[*_`]/gu, ""),
        index: String(section).padStart(2, "0"),
      };
    });
}

function renderMarkdown(markdown: string) {
  const headingId = createHeadingIdFactory();
  let section = 0;
  const renderer = new Renderer();

  renderer.heading = function ({ tokens, text, depth }) {
    const id = headingId(text);
    const content = this.parser.parseInline(tokens);
    if (depth === 2) {
      section += 1;
      return `<h2 id="${id}" data-section="${String(section).padStart(2, "0")}">${content}</h2>\n`;
    }
    return `<h${depth} id="${id}">${content}</h${depth}>\n`;
  };

  renderer.image = ({ href, title, text }) => {
    const titleAttribute = title
      ? ` title="${escapeAttribute(title)}"`
      : "";
    const alt = text || "Research figure";
    return `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async"${titleAttribute}>`;
  };

  return new Marked({ gfm: true, renderer }).parse(markdown) as string;
}

function loadPosts() {
  const filenames = readdirSync(POSTS_DIRECTORY)
    .filter((filename) => filename.endsWith(".md") && !filename.startsWith("_"))
    .sort();
  const slugs = new Set<string>();
  const fileIds = new Set<string>();

  const posts = filenames.map((filename) => {
    const source = readFileSync(path.join(POSTS_DIRECTORY, filename), "utf8");
    const { data, content } = matter(source);
    const frontmatter = readFrontmatter(data, filename);

    if (`${frontmatter.slug}.md` !== filename) {
      throw new Error(`${filename}: filename must match the frontmatter slug`);
    }
    if (frontmatter.coverImage) {
      assertLocalAsset(frontmatter.coverImage, filename);
    }
    validateMarkdownImages(content, filename);

    if (slugs.has(frontmatter.slug)) {
      throw new Error(`${filename}: duplicate slug "${frontmatter.slug}"`);
    }
    slugs.add(frontmatter.slug);
    if (fileIds.has(frontmatter.file)) {
      throw new Error(`${filename}: duplicate file identifier "${frontmatter.file}"`);
    }
    fileIds.add(frontmatter.file);

    const wordCount = stripMarkdown(content).trim().split(/\s+/u).filter(Boolean).length;
    return {
      ...frontmatter,
      markdown: content,
      html: renderMarkdown(content),
      tableOfContents: buildTableOfContents(content),
      wordCount,
      readingMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
      dateLabel: formatDateLabel(frontmatter.publishedAt),
    } satisfies Post;
  });

  return posts
    .filter((post) => !post.draft)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

let postCache: Post[] | undefined;

export function getAllPosts() {
  postCache ??= loadPosts();
  return postCache;
}

export function getPostBySlug(slug: string) {
  return getAllPosts().find((post) => post.slug === slug);
}
