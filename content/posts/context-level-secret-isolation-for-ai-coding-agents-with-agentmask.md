---
title: "Context-Level Secret Isolation for AI Coding Agents with Agentmask"
seoTitle: "Agentmask: Secret Isolation for AI Coding Agents"
description: "How Agentmask blocks secrets before they enter AI coding-agent context using hooks, redacted MCP tools, and layered detection."
deck: "A practical architecture for keeping credentials outside AI coding-agent context, even when tools and external content cannot be trusted."
slug: "context-level-secret-isolation-for-ai-coding-agents-with-agentmask"
file: "01"
publishedAt: "2026-04-06T19:41:20.418Z"
updatedAt: "2026-08-20T16:00:00.000Z"
category: "Agent Security"
tags:
  - "Agentmask"
  - "AI Coding Agents"
  - "Secrets Management"
  - "MCP"
coverImage: "/images/posts/agentmask-cover.png"
coverImageAlt: "AgentMask cover graphic showing a masked AI coding agent beside isolated secret tokens"
coverImageWidth: 1536
coverImageHeight: 1024
status: "Published"
draft: false
---
Once a secret enters the agent's context window, several things can expose it:

* A compromised MCP server, malicious package README, or crafted API response can instruct the agent to disclose secrets it has already read.

* The agent can place a secret in a Write, Edit, or Bash call, which may leave it in source code, a commit message, or stdout.

* Later responses, web searches, or generated error reports can repeat a secret that remains in context.

* An injected prompt can ask the agent to send an HTTP request, post to a webhook, or write the value to a synced file.

These paths all depend on the agent seeing the secret. [Agentmask](https://github.com/adithyan-ak/agentmask) blocks it before that happens.

![Agentmask blocking and redacting secrets during an AI coding-agent workflow](/images/posts/agentmask-demo.gif)

## How it works

[Agentmask](https://github.com/adithyan-ak/agentmask) is a secrets firewall for AI coding agents. It hooks into Claude Code's tool execution pipeline and uses three layers:

* PreToolUse hooks intercept Read, Write, Bash, and Edit calls. They reject files on the blocklist or matching static patterns such as `.env`, `*.pem`, and `id_rsa` in under 5 ms. They scan content being written in about 200 ms.

* A blocked read directs the agent to MCP tools that return redacted content, so it can continue without the raw values.

* Rules in `.claude/rules/agentmask.md` tell the agent to prefer the safe tools and avoid printing secret values.

The layers cover different failure points. A hook blocks the operation, the MCP tool supplies usable redacted data, and the rules steer the agent toward that route.

![Agentmask intercepting a blocked secret file read](/images/posts/agentmask-read-blocked.png)

## Setup

```bash
npm install -g agentmask
cd your-project
agentmask init
```

`init` scans the repository with [gitleaks](https://github.com/gitleaks/gitleaks), which has more than 150 provider-specific rules, and Agentmask's scanner for password fields, connection strings, and webhook secrets. It adds files containing detected secrets to the blocklist, then installs the hooks, MCP server, and behavioral rules.

![Agentmask returning a redacted view of a secret-bearing file](/images/posts/agentmask-redacted-read.png)

The default setup does not require a hand-written configuration file or CI changes.

## How the hooks work

Four hooks run on every tool call:

| Hook | Trigger | What it does | Latency |
| --- | --- | --- | --- |
| `pre-read` | Read | Checks blocklist + static patterns | < 5ms |
| `pre-write` | Write, Edit | Scans content for secrets | ~200ms |
| `pre-bash` | Bash | Filters commands + scans staged files on `git commit` | ~200ms |
| `post-scan` | Read, Bash | Scans tool output, auto-blocklists new secret files | ~200ms |

`pre-read` performs an in-memory blocklist lookup without starting a subprocess or scanning the file again.

When a read is blocked, the agent receives an error message pointing it to `safe_read`. Claude Code follows the redirect automatically.

## MCP tools

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

Non-secret values pass through. The agent can still inspect the file structure, reference variable names, and write code that uses `process.env.DATABASE_URL` without seeing the connection string.

## Detection

Every scan runs two detectors in parallel.

Gitleaks supplies more than 150 rules for AWS, GitHub, Stripe, Google Cloud, OpenAI, Anthropic, Slack, Twilio, GitLab, JWTs, and PEM keys. It also checks high-entropy values assigned to variables containing `key`, `token`, `secret`, `api`, `auth`, or `client`. Agentmask downloads gitleaks if it is not installed.

Agentmask adds a TypeScript regex pass for patterns that gitleaks deliberately excludes:

* `password`, `passwd`, and `pwd` field assignments

* SQL `PASSWORD 'value'` statements

* Connection strings with embedded credentials, including `postgres://`, `mysql://`, and `mongodb://`

* `whsec_` webhook signing secrets

* `GOCSPX-` Google OAuth client secrets


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

* The first read of a new secret file leaks. The post-scan hook catches it and blocks later reads. Preventing the first read would require scanning every file in advance.

* Bash coverage is incomplete. `cat .env` is caught, but `node -e "require('fs').readFileSync('.env')"` is not.

* The hooks cover tool calls, not the agent's chat responses.

* If a hook crashes or reaches the four-second timeout, Agentmask allows the operation to proceed.


## Command reference

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
