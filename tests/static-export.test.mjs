import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const posts = [
  "agent-name-collision-attacks-multi-agent-systems",
  "what-is-loopjacking",
  "loopjacking-in-a2a-implementations",
  "optimal-hermes-mnemosyne-memory-architecture",
  "build-ai-agent-attack-graph-agenthound",
  "prompt-injection-ai-agent-attack-paths-agenthound",
  "mcp-tool-poisoning-detect-reverse-agenthound",
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

  assert.match(html, /<title>Adithyan Arun Kumar<\/title>/);
  assert.match(
    html,
    /<meta property="og:title" content="Adithyan Arun Kumar"/,
  );
  assert.match(
    html,
    /<meta name="twitter:title" content="Adithyan Arun Kumar"/,
  );
  assert.match(html, /Adithyan Arun Kumar/);
  assert.match(html, /Agentic Security Researcher/i);
  assert.match(html, /AgentHound/);
  assert.match(html, /Public advisory ledger/i);
  assert.match(html, /08(?:<!-- -->)? records/i);
  assert.match(html, /CVE-2019-7564/);
  assert.match(html, /CVE-2019-6441/);
  assert.match(html, /GHSA-mcfc-hp25-cjv7/);
  assert.match(html, /GHSA-rxqh-5572-8m77/);
  assert.match(html, /GHSA-7x7g-w3q4-fv98/);
  assert.match(html, /GHSA-f5hv-jrwp-gh59/);
  assert.match(html, /<link rel="icon" href="\/icon\.svg\?[^\"]+"/);
  assert.match(html, /Service record/i);
  assert.match(html, /Hermes and Mnemosyne Memory Architecture/i);
  assert.doesNotMatch(html, /[—–]/);
  assert.doesNotMatch(
    html,
    /Operator Console|Signal Index|Blacksite Blueprint|Security Bulletin/i,
  );
});

test("exports the field-note index with root-level article links", () => {
  const html = exported("blog/index.html");

  assert.match(html, /<title>Adithyan Arun Kumar<\/title>/);
  assert.match(
    html,
    /<meta property="og:title" content="Adithyan Arun Kumar"/,
  );
  assert.match(
    html,
    /<meta name="twitter:title" content="Adithyan Arun Kumar"/,
  );
  assert.match(html, /Field Notes/i);
  assert.match(html, /Entries<\/span>\s*(?:<!-- -->)?11/);
  assert.doesNotMatch(html, /[—–]/);
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
    const hasCover = slug !== "agent-name-collision-attacks-multi-agent-systems";
    if (hasCover) {
      assert.match(html, /<meta property="og:image" content="https:\/\/adithyanak\.com\/images\/posts\/[^\"]+"/);
      assert.match(html, /<meta property="og:image:width" content="\d+"/);
      assert.match(html, /<meta property="og:image:height" content="\d+"/);
      assert.match(html, /<figure class="[^"]*articleCover[^"]*"/);
    } else {
      assert.match(html, /<meta property="og:image" content="https:\/\/adithyanak\.com\/images\/posts\/agent-name-collision-routing-comparison\.png"/);
      assert.doesNotMatch(html, /<figure class="[^"]*articleCover[^"]*"/);
    }
    assert.match(html, /<meta property="og:image:alt" content="[^\"]+"/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
    assert.match(html, /<meta property="article:published_time"/);
    assert.match(
      html,
      /<link rel="alternate" type="application\/rss\+xml" href="https:\/\/adithyanak\.com\/rss\.xml" title="Adithyan Arun Kumar Field Notes"/,
    );
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /"@type":"ImageObject"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.match(html, /class="[^"]*prose[^"]*"/);
    assert.match(html, /<h2 id="[^"]+" data-section="01">/);
    assert.doesNotMatch(html, /[—–]/);
    assert.doesNotMatch(html, /Declassified field note|>Declassified<|\/ Declassified/);
    assert.doesNotMatch(html, /<span>Status<\/span>\s*(?:<!-- -->)?Published/);
  }
});

test("keeps article chrome lean without contents or redundant metadata", () => {
  const tutorial = exported("build-ai-agent-attack-graph-agenthound/index.html");
  const dataFlow = exported(
    "prompt-injection-ai-agent-attack-paths-agenthound/index.html",
  );
  const archive = exported("blog/index.html");

  assert.doesNotMatch(tutorial, /contentsPanel|<summary><span>Contents<\/span>/);
  assert.doesNotMatch(tutorial, /<dt>Words<\/dt>|<dt>Distribution<\/dt>|<dt>File<\/dt>/);
  assert.match(tutorial, /<span>Filed<\/span>/);
  assert.match(tutorial, /<span>Revised<\/span>/);
  assert.match(tutorial, /<span>Read<\/span>/);
  assert.doesNotMatch(tutorial, /<span>Sections<\/span>/);
  assert.match(
    dataFlow,
    /class="article-table-scroll" role="region" aria-label="Scrollable data table" tabindex="0"><table>/,
  );
  assert.match(archive, /Independent research notes/);
  assert.doesNotMatch(archive, /Declassified research notes/);
});

test("exports the agent-name collision field note with its local visual record", () => {
  const html = exported("agent-name-collision-attacks-multi-agent-systems/index.html");

  assert.match(
    html,
    /Hijacking A2A Tasks with Agent Name Collision Attacks/,
  );
  assert.match(html, /wrong-peer dispatch/i);
  for (const asset of [
    "agent-name-collision-routing-comparison.png",
    "agent-name-collision-implementation-patterns.png",
    "agent-name-collision-defense-lifecycle.png",
  ]) {
    assert.match(html, new RegExp(`/images/posts/${asset}`));
    assert.ok(existsSync(new URL(`../out/images/posts/${asset}`, import.meta.url)));
  }
  assert.doesNotMatch(html, /agent-name-collision-(attacks-cover|attack-conditions|authority-boundary)\.png/);
  assert.match(html, /All five conditions must hold/);
  assert.match(html, /<th>What the study establishes<\/th>/);
  const title = "Hijacking A2A Tasks with Agent Name Collision Attacks";
  assert.ok(html.includes(`<h1>${title}</h1>`));
  assert.ok(html.includes(`<title>${title}</title>`));
  assert.ok(html.includes(`<meta property="og:title" content="${title}"`));
  assert.ok(html.includes(`<meta name="twitter:title" content="${title}"`));
  const description = "How agent name collisions in A2A systems can divert tasks to the wrong peer, what the research proves, and how stable identities prevent unsafe routing.";
  assert.ok(html.includes(`<meta name="description" content="${description}"`));
  assert.ok(html.includes(`<meta property="og:description" content="${description}"`));
  assert.ok(html.includes(`<meta name="twitter:description" content="${description}"`));
  const socialImage = "https://adithyanak.com/images/posts/agent-name-collision-routing-comparison.png";
  assert.ok(html.includes(`<meta name="twitter:image" content="${socialImage}"`));
  assert.match(html, /<meta property="og:image:width" content="1782"/);
  assert.match(html, /<meta property="og:image:height" content="586"/);
  const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const article = jsonLd["@graph"].find((item) => item["@type"] === "Article");
  assert.equal(article.headline, title);
  assert.equal(article.description, description);
  assert.equal(article.image.url, socialImage);
  assert.equal(article.image.width, 1782);
  assert.equal(article.image.height, 586);
  assert.ok(exported("blog/index.html").includes(title));
  assert.ok(exported("rss.xml").includes(title));
});

test("keeps migrated content and media independent from Hashnode", () => {
  const agentmask = exported(
    "context-level-secret-isolation-for-ai-coding-agents-with-agentmask/index.html",
  );
  const ragas = exported(
    "ragas-v0214-arbitrary-file-read-vulnerability/index.html",
  );

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

test("exports the AgentHound research series with evidence and internal links", () => {
  const tutorial = exported("build-ai-agent-attack-graph-agenthound/index.html");
  const promptInjection = exported(
    "prompt-injection-ai-agent-attack-paths-agenthound/index.html",
  );
  const poisoning = exported(
    "mcp-tool-poisoning-detect-reverse-agenthound/index.html",
  );

  assert.match(tutorial, /one autonomous scan/i);
  assert.match(tutorial, /agenthound-dashboard-attack-surface\.png/);
  assert.match(promptInjection, /POISONED_INSTRUCTIONS/);
  assert.match(promptInjection, /agenthound-poisoning-data-flow-graph\.png/);
  assert.match(poisoning, /mcp\.description\.roundtrip/);
  assert.match(poisoning, /mutation_observed_restored/);

  assert.match(
    tutorial,
    /href="\/prompt-injection-ai-agent-attack-paths-agenthound\/"/,
  );
  assert.match(tutorial, /href="\/mcp-tool-poisoning-detect-reverse-agenthound\/"/);
  assert.match(promptInjection, /href="\/build-ai-agent-attack-graph-agenthound\/"/);
  assert.match(
    promptInjection,
    /href="\/mcp-tool-poisoning-detect-reverse-agenthound\/"/,
  );
  assert.match(poisoning, /href="\/build-ai-agent-attack-graph-agenthound\/"/);
  assert.match(
    poisoning,
    /href="\/prompt-injection-ai-agent-attack-paths-agenthound\/"/,
  );
});

test("exports RSS, robots, sitemap, CNAME, and 404 artifacts", () => {
  const rss = exported("rss.xml");
  const sitemap = exported("sitemap.xml");

  assert.match(rss, /<rss version="2.0"/);
  assert.match(rss, /<atom:link/);
  assert.match(rss, /Agentmask:|Context-Level Secret Isolation/);
  for (const slug of posts) {
    assert.match(sitemap, new RegExp(`<loc>https://adithyanak\\.com/${slug}/<\\/loc>`));
    assert.doesNotMatch(sitemap, new RegExp(`/blog/${slug}`));
    assert.ok(existsSync(new URL(`../out/${slug}/index.html`, import.meta.url)));
  }
  assert.equal(exported("CNAME").trim(), "adithyanak.com");
  assert.ok(existsSync(new URL("../out/robots.txt", import.meta.url)));
  assert.ok(existsSync(new URL("../out/icon.svg", import.meta.url)));
  assert.ok(existsSync(new URL("../out/404.html", import.meta.url)));
  assert.ok(existsSync(new URL("../content/posts/_template.md", import.meta.url)));
});

test("Loopjacking export uses one canonical URL across SEO surfaces", () => {
  const slug = "what-is-loopjacking";
  const url = `https://adithyanak.com/${slug}/`;
  const image = "https://adithyanak.com/images/posts/loopjacking-cover.webp";
  const html = exported(`${slug}/index.html`);
  const sitemap = exported("sitemap.xml");
  const rss = exported("rss.xml");
  const robots = exported("robots.txt");
  const jsonLdSource = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];

  assert.ok(jsonLdSource, "article JSON-LD is present");
  const article = JSON.parse(jsonLdSource)["@graph"].find(
    (entry) => entry["@type"] === "Article",
  );

  assert.match(html, /<title>What Is Loopjacking\? Approval Hijacking in AI Agents<\/title>/);
  assert.match(html, /<h1>What Is Loopjacking\?<\/h1>/);
  assert.ok(html.includes(`<link rel="canonical" href="${url}"`));
  assert.ok(html.includes(`<meta property="og:url" content="${url}"`));
  assert.ok(html.includes(`<meta property="og:image" content="${image}"`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
  assert.doesNotMatch(html, /<p><figure>/);
  assert.match(html, /<figure><img src="\/images\/posts\/loopjacking-two-approval-paths\.webp"/);
  assert.equal(article.url, url);
  assert.equal(article.mainEntityOfPage["@id"], url);
  assert.equal(article.image.url, image);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`));
  assert.ok(rss.includes(`<link>${url}</link>`));
  assert.match(robots, /Sitemap: https:\/\/adithyanak\.com\/sitemap\.xml/);
  assert.ok(existsSync(new URL("../out/images/posts/loopjacking-cover.webp", import.meta.url)));
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
