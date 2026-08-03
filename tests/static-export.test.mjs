import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function exported(path) {
  return readFileSync(new URL(`../out/${path}`, import.meta.url), "utf8");
}

test("exports the canonical declassified dossier", () => {
  const html = exported("index.html");

  assert.match(html, /Adithyan Arun Kumar/);
  assert.match(html, /Agentic Security Researcher/i);
  assert.match(html, /Declassified/i);
  assert.match(html, /AgentHound/);
  assert.match(html, /Public advisory ledger/i);
  assert.match(html, /Service record/i);
  assert.match(html, /Lead threat modeling/i);
  assert.doesNotMatch(
    html,
    /Operator Console|Signal Index|Blacksite Blueprint|Security Bulletin/i,
  );
});

test("exports the field-note index and articles", () => {
  const indexHtml = exported("blog/index.html");
  const articleHtml = exported("blog/from-prompts-to-privileges/index.html");

  assert.match(indexHtml, /Field Notes/i);
  assert.match(indexHtml, /AK–FN–2026/i);
  assert.match(articleHtml, /Declassified field note/i);
  assert.match(articleHtml, /The graph is the system/i);
});

test("exports valid RSS, robots, sitemap, CNAME, and 404 artifacts", () => {
  const rss = exported("rss.xml");

  assert.match(rss, /<rss version="2.0">/);
  assert.match(rss, /From Prompts to Privileges/);
  assert.equal(exported("CNAME").trim(), "adithyanak.com");
  assert.ok(existsSync(new URL("../out/robots.txt", import.meta.url)));
  assert.ok(existsSync(new URL("../out/sitemap.xml", import.meta.url)));
  assert.ok(existsSync(new URL("../out/404.html", import.meta.url)));
});

test("does not export legacy concept routes", () => {
  assert.equal(
    existsSync(new URL("../out/concepts/index.html", import.meta.url)),
    false,
  );
});
