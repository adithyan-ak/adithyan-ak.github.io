---
title: "Context-Level Secret Isolation for AI Coding Agents with Agentmask"
seoTitle: "Agentmask: Secret Isolation for AI Coding Agents"
description: "How Agentmask blocks secrets before they enter AI coding-agent context using hooks, redacted MCP tools, and layered detection."
deck: "A practical architecture for keeping credentials outside AI coding-agent context, even when tools and external content cannot be trusted."
slug: "context-level-secret-isolation-for-ai-coding-agents-with-agentmask"
file: "01"
publishedAt: "2026-04-06T19:41:20.418Z"
updatedAt: "2026-08-02T00:00:00.000Z"
category: "Agent Security"
tags:
  - "Agentmask"
  - "AI Coding Agents"
  - "Secrets Management"
  - "MCP"
coverImage: "/images/posts/agentmask-cover.png"
status: "Published"
draft: false
---
Once a secret enters the agent's context window, the attack surface is wide open:

*   **Prompt injection via external tools** - a compromised MCP server, a malicious package README, or a crafted API response can instruct the agent to exfiltrate secrets it has already read

*   **Tool call leakage** - the agent references a secret in a Write, Edit, or Bash call. It ends up in source code, a commit message, or piped to stdout

*   **Context persistence** - secrets in context can be echoed back in any subsequent response, fed into web searches, or included in error reports the agent generates

*   **Indirect exfiltration** - an injected prompt tells the agent to make an HTTP request, post to a webhook, or write secrets to a file that gets synced elsewhere


The root cause is the same in every case: **the secret was in context to begin with.** Block it from entering context and every downstream vector disappears.

[Agentmask](https://github.com/adithyan-ak/agentmask) does exactly that.

![Agentmask blocking and redacting secrets during an AI coding-agent workflow](/images/posts/agentmask-demo.gif)

## What It Is

[Agentmask](https://github.com/adithyan-ak/agentmask) is a secrets firewall for AI coding agents. It hooks into Claude Code's tool execution pipeline and blocks secrets before they reach the context window. Three reinforcing layers:

**Block** - PreToolUse hooks intercept every Read, Write, Bash, and Edit call. Files in the blocklist or matching static patterns (`.env`, `*.pem`, `id_rsa`, etc.) are rejected in under 5ms. Content being written is scanned for secrets in ~200ms.

**Redirect** - When a read is blocked, the agent is directed to MCP tools that return redacted content. The agent keeps working — it just never sees the raw values.

**Instruct** - Behavioral rules in `.claude/rules/agentmask.md` tell the agent to prefer safe tools and never output secret values.

Any single layer can fail. All three failing simultaneously on the same secret is unlikely.

![Agentmask intercepting a blocked secret file read](/images/posts/agentmask-read-blocked.png)

## Setup

```bash
npm install -g agentmask
cd your-project
agentmask init
```

`init` scans your repo with [gitleaks](https://github.com/gitleaks/gitleaks) (150+ provider-specific rules) plus agentmask's own scanner (password fields, connection strings, webhook secrets). Every file containing a detected secret goes into a blocklist. Hooks, MCP server, and behavioral rules are installed automatically.

![Agentmask returning a redacted view of a secret-bearing file](/images/posts/agentmask-redacted-read.png)

That's the entire setup. No config files to write, no CI to configure, no workflow changes.

## How the Hooks Work

Four hooks run on every tool call:

| Hook | Trigger | What it does | Latency |
| --- | --- | --- | --- |
| `pre-read` | Read | Checks blocklist + static patterns | < 5ms |
| `pre-write` | Write, Edit | Scans content for secrets | ~200ms |
| `pre-bash` | Bash | Filters commands + scans staged files on `git commit` | ~200ms |
| `post-scan` | Read, Bash | Scans tool output, auto-blocklists new secret files | ~200ms |

`pre-read` is the hot path, pure in-memory blocklist lookup, no subprocess, no scanning. The agent doesn't notice it.

When a read is blocked, the agent receives an error message pointing it to `safe_read`. Claude Code follows the redirect automatically.

## MCP Tools

When the MCP server is running, the agent has four tools available:

![Agentmask blocking secret content from being written by an AI coding agent](/images/posts/agentmask-write-blocked.png)

| Tool | Purpose |
| --- | --- |
| `safe_read` | Returns file content with secrets replaced by `[REDACTED:rule-id]` |
| `env_names` | Lists `.env` variable names and types without values |
| `scan_file` | On-demand secret scan of any file |
| `scan_staged` | Scans git staging area before a commit |

`safe_read` output looks like this:

```plaintext
DATABASE_URL=[REDACTED:generic-api-key]
STRIPE_SECRET_KEY=[REDACTED:stripe-access-token]
DEBUG=true
PORT=3000
```

Non-secret values pass through. The agent can still reason about the file structure, reference variable names, and write code that uses `process.env.DATABASE_URL` — without ever seeing the actual connection string.

## Detection

Two scanners run in parallel on every scan:

**gitleaks** — 150+ rules covering AWS, GitHub, Stripe, Google Cloud, OpenAI, Anthropic, Slack, Twilio, GitLab, JWTs, PEM keys, and a generic high-entropy rule for anything assigned to `key`/`token`/`secret`/`api`/`auth`/`client` variables. Auto-downloaded if not on your system.

**agentmask scanner** — TypeScript regex pass for patterns gitleaks deliberately excludes:

*   `password` / `passwd` / `pwd` field assignments

*   SQL `PASSWORD 'value'` statements

*   Connection strings with embedded credentials (`postgres://`, `mysql://`, `mongodb://`, etc.)

*   `whsec_` webhook signing secrets

*   `GOCSPX-` Google OAuth client secrets


Both scanners merge into a single findings list. Common placeholders (`changeme`, `${VAR}`, `<password>`) are skipped to keep false positives low.

## Configuration

Allowlist paths or values when the scanner flags something it shouldn't:

```bash
agentmask allow-path "tests/**"
agentmask allow-value "EXAMPLE_KEY_12345"
```

Or configure `.agentmask.toml` directly:

```toml
[scan]
blocked_paths = [".env.custom"]

[[allowlists]]
paths = ["tests/**", "fixtures/**"]
description = "Test files with dummy secrets"
```

For teams, use `agentmask init --team` to write hooks to `.claude/settings.json` (committed to git) instead of `.claude/settings.local.json` (gitignored).

## Limitations

*   **First read of a new secret file leaks.** Post-scan catches it and blocklists it for every subsequent read. Unavoidable without pre-reading every file.

*   **Not every bash invocation is covered.** `cat .env` is caught. `node -e "require('fs').readFileSync('.env')"` is not.

*   **Chat output isn't filtered.** Hooks cover tool calls, not the agent's text responses.

*   **Graceful degradation.** If a hook crashes or hits the 4-second timeout, the operation proceeds. agentmask never blocks your work due to its own bugs.


## Commands Reference

```bash
agentmask init              # Scan, blocklist, install hooks + MCP + rules
agentmask init --team       # Same, but writes to shared settings.json
agentmask remove            # Clean uninstall
agentmask scan [path]       # Scan for secrets (report only)
agentmask scan --staged     # Scan git staged files
agentmask scan --json       # JSON output for CI/CD
agentmask allow-path "p"    # Allowlist a path pattern
agentmask allow-value "v"   # Allowlist a specific value
agentmask serve             # Start MCP server (called automatically)
```

## Install

```bash
npm install -g agentmask
agentmask init
```
