import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const posts = [
  "context-level-secret-isolation-for-ai-coding-agents-with-agentmask",
  "ragas-v0214-arbitrary-file-read-vulnerability",
  "stealthy-powershell-shellcode-execution-diskless-techniques-with-unsafenativemethods",
  "bypassing-antivirus-detection-with-unusual-windows-apis-delayed-timers-and-encryption",
];

function exported(path) {
  return readFileSync(new URL(`../out/${path}`, import.meta.url), "utf8");
}

test("exports the canonical declassified dossier", () => {
  const html = exported("index.html");

  assert.match(html, /Adithyan Arun Kumar/);
  assert.match(html, /Agentic Security Researcher/i);
  assert.match(html, /AgentHound/);
  assert.match(html, /Public advisory ledger/i);
  assert.match(html, /Service record/i);
  assert.match(html, /Context-Level Secret Isolation/i);
  assert.doesNotMatch(
    html,
    /Operator Console|Signal Index|Blacksite Blueprint|Security Bulletin/i,
  );
});

test("exports the field-note index with root-level article links", () => {
  const html = exported("blog/index.html");

  assert.match(html, /Field Notes/i);
  assert.match(html, /Entries<\/span>\s*(?:<!-- -->)?04/);
  for (const slug of posts) {
    assert.match(html, new RegExp(`href="/${slug}/"`));
    assert.doesNotMatch(html, new RegExp(`href="/blog/${slug}`));
  }
});

test("every article has inherited SEO, structured data, and rendered Markdown", () => {
  for (const slug of posts) {
    const html = exported(`${slug}/index.html`);

    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://adithyanak\\.com/${slug}/"`),
    );
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /<meta property="og:type" content="article"/);
    assert.match(html, /<meta property="article:published_time"/);
    assert.match(
      html,
      /<link rel="alternate" type="application\/rss\+xml" href="https:\/\/adithyanak\.com\/rss\.xml" title="Adithyan Arun Kumar — Field Notes"/,
    );
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.match(html, /class="[^"]*prose[^"]*"/);
    assert.match(html, /<h2 id="[^"]+" data-section="01">/);
    assert.match(html, /href="#[^"]+"/);
  }
});

test("keeps migrated content and media independent from Hashnode", () => {
  const agentmask = exported(`${posts[0]}/index.html`);
  const ragas = exported(`${posts[1]}/index.html`);

  assert.match(agentmask, /Once a secret enters the agent/i);
  assert.match(agentmask, /agentmask-demo\.gif/);
  assert.match(ragas, /CVE-2025-45691/);
  assert.match(ragas, /ragas-exploit-output\.png/);

  for (const slug of posts) {
    const source = readFileSync(
      new URL(`../content/posts/${slug}.md`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(source, /cdn\.hashnode\.com/);
  }
});

test("exports RSS, robots, sitemap, CNAME, and 404 artifacts", () => {
  const rss = exported("rss.xml");
  const sitemap = exported("sitemap.xml");

  assert.match(rss, /<rss version="2.0"/);
  assert.match(rss, /<atom:link/);
  assert.match(rss, /Agentmask:|Context-Level Secret Isolation/);
  for (const slug of posts) {
    assert.match(sitemap, new RegExp(`https://adithyanak\\.com/${slug}`));
    assert.doesNotMatch(sitemap, new RegExp(`/blog/${slug}`));
    assert.ok(existsSync(new URL(`../out/${slug}/index.html`, import.meta.url)));
  }
  assert.equal(exported("CNAME").trim(), "adithyanak.com");
  assert.ok(existsSync(new URL("../out/robots.txt", import.meta.url)));
  assert.ok(existsSync(new URL("../out/404.html", import.meta.url)));
  assert.ok(existsSync(new URL("../content/posts/_template.md", import.meta.url)));
});

test("does not export prototype or legacy concept routes", () => {
  assert.equal(
    existsSync(new URL("../out/blog/from-prompts-to-privileges/", import.meta.url)),
    false,
  );
  assert.equal(
    existsSync(new URL("../out/concepts/index.html", import.meta.url)),
    false,
  );
});
