---
title: "How to Build an AI Agent Attack Graph with AgentHound"
description: "Build an AI agent attack graph from MCP, A2A, host, credential, and runtime evidence with AgentHound, then investigate the paths it reveals."
deck: "A practical, evidence-led guide to collecting an agentic environment, turning it into a graph, and separating observed facts from attack-path hypotheses."
slug: "build-ai-agent-attack-graph-agenthound"
file: "05"
publishedAt: "2026-08-03T16:00:00.000Z"
updatedAt: "2026-08-03T16:00:00.000Z"
category: "Agentic Security Research"
tags:
  - "AgentHound"
  - "AI Agent Security"
  - "Attack Graphs"
  - "MCP"
  - "A2A"
coverImage: "/images/posts/agenthound-ai-agent-attack-graph-hero.jpg"
coverImageAlt: "Engraved three-headed hound surrounded by AI agent, MCP, A2A, host, tool, and credential nodes connected by a red attack path"
coverImageWidth: 1536
coverImageHeight: 1024
status: "Published"
draft: false
---

Most AI agent security reviews start with a list: models, tools, servers, credentials, and policies. The list is useful, but it hides the relationships that decide whether a weakness is reachable.

An attack graph changes the question. Instead of asking whether a risky tool exists, you can ask which agent trusts the server that exposes it, which host runs that agent, which credentials are present, and what else becomes reachable from the same trust boundary.

This guide builds that graph with [AgentHound](https://github.com/adithyan-ak/agenthound). The procedure is intentionally narrow: collect evidence, ingest it, inspect the graph, and grade every conclusion by what the evidence actually proves.

## What the graph represents

AgentHound models the operational parts of an agentic stack as nodes and edges. Typical nodes include agent instances, MCP servers, A2A agents, tools, hosts, resources, and credential references. Raw edges describe observed relationships such as an agent trusting an MCP server or a server providing a tool. Post-processors then derive higher-level edges such as reachability, context poisoning, or cross-protocol paths.

That distinction matters:

| Evidence class | Example | What it supports |
| --- | --- | --- |
| Observed fact | An MCP server returned a tool through protocol discovery | The tool was visible at collection time |
| Derived inference | A credential-bearing host can reach a server that exposes a high-impact tool | The relationship is worth investigating |
| Hypothesis | An attacker can turn that path into code execution | A claim that still needs controlled validation |

The graph is a map of evidence and testable paths. It is not a transcript of an agent taking every edge.

## Start the local analysis server

AgentHound uses a lean collector and a local analysis server. The server bundles the web interface and uses Neo4j plus PostgreSQL for graph and application state.

Start the published local stack:

```bash
curl -sSfL https://raw.githubusercontent.com/adithyan-ak/agenthound/main/docker/docker-compose.public.yml \
  | docker compose -f - -p agenthound up -d --wait
```

The interface binds to `127.0.0.1:8080`. It is intended as a single-user, localhost service, not a shared internet-facing console. The [AgentHound quickstart](https://docs.agenthound.io/getting-started/quickstart/) is the canonical source for current install and startup commands.

Install the collector and confirm the binary:

```bash
curl -sSfL https://raw.githubusercontent.com/adithyan-ak/agenthound/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
agenthound --version
```

Pinning a release in automation is preferable to executing a moving installer. The one-line command is convenient for an isolated lab; production workflows should review and pin the artifact they deploy.

## Collect the first layer from configuration

The fastest useful starting point is a local configuration scan:

```bash
agenthound scan --config --ingest http://127.0.0.1:8080
```

This inventories supported agent and MCP client configurations, preserves a local scan artifact, and sends the same graph data to the analysis server. Use deep collection only when the additional local inspection is in scope:

```bash
agenthound scan --config --deep --ingest http://127.0.0.1:8080
```

A configuration scan is evidence of declared trust and locally visible material. It is not proof that every declared endpoint is live. That is why the next layer uses protocol and network observations.

## Add MCP, A2A, and network evidence

Scan known protocol endpoints or bounded network ranges that you are authorized to test. Discovery is deliberately separate from a deeper scan:

```bash
agenthound discover 10.0.0.0/24 --mcp
agenthound discover 10.0.0.0/24 --a2a
agenthound scan 10.0.0.0/24 --ingest http://127.0.0.1:8080
```

Public targets require an explicit opt-in and interactive authorization. Do not use broad discovery as a substitute for a defined scope.

In my isolated integration lab, the same test run exercised configuration, MCP, A2A, network, and service-specific collectors against disposable upstreams. The primary run finished with 24 of 24 planned scenarios passing. A few representative artifacts were:

| Collector artifact | Nodes | Edges |
| --- | ---: | ---: |
| Configuration scan | 85 | 66 |
| MCP scan | 29 | 28 |
| A2A scan | 19 | 14 |
| Network scan | 9 | Not reported as a separate total |

These counts describe that lab, not a benchmark or a promised result for another environment. They are included to make the screenshots and conclusions auditable.

![AgentHound dashboard showing the collected agent, MCP, A2A, tool, credential, and exposure totals](/images/posts/agenthound-dashboard-attack-surface.png "A disposable lab after ingesting real configuration, protocol, network, and service evidence. The coverage warning is intentional because several evidence scopes are partial.")

The coverage warning is useful. A partial scan can establish that a relationship exists, but it usually cannot establish that no other relationship exists. Positive evidence and absence claims need different standards.

## Read the attack graph without fooling yourself

Open the graph and begin with a lens that matches the question. For an initial review, the attack-surface lens is usually more useful than an unrestricted graph because it reduces visual noise around credential, resource, protocol, and reachability relationships.

![AgentHound attack-surface graph connecting agents, tools, credentials, resources, and services](/images/posts/agenthound-attack-surface-graph.png "The attack-surface lens narrows the graph to security-relevant relationships. An edge is evidence or a derived path, not proof that an exploit was executed.")

Trace paths from a source with a plausible attacker influence toward a sink with meaningful impact:

1. Identify the source and why it is attacker-controlled or untrusted.
2. Check each raw relationship against its collector and timestamp.
3. Note which edges were derived by a post-processor.
4. Verify the sink capability instead of trusting a tool name alone.
5. Record the missing preconditions before calling the path exploitable.

AgentHound groups useful path families in its [attack-path documentation](https://docs.agenthound.io/operator/attack-paths/): reachability, poisoning, untrusted-input data flow, credential chains, impersonation, and cross-protocol movement. Each family answers a different question. Collapsing them into one generic risk score loses the information needed to validate the path.

## Query findings and prebuilt paths

The web interface is the fastest way to explore, but the API makes investigations reproducible. These examples query two prebuilt paths and then filter findings by severity:

```bash
curl http://127.0.0.1:8080/api/v1/analysis/prebuilt/agents-shell-access
curl http://127.0.0.1:8080/api/v1/analysis/prebuilt/cross-protocol-paths
curl 'http://127.0.0.1:8080/api/v1/analysis/findings?severity=critical'
```

For each result, preserve four pieces of context in the ticket or research note:

| Field | Question to answer |
| --- | --- |
| Scope | Which collector domains were complete, partial, or absent? |
| Provenance | Which raw scan and source collector created the supporting nodes? |
| Derivation | Which processor or rule created the finding? |
| Validation | What safe test would confirm or refute the remaining hypothesis? |

This is the difference between a graph that produces screenshots and a graph that supports engineering decisions.

## Turn one scan into a repeatable security control

A useful operating rhythm is small and explicit:

1. Run configuration collection after agent or MCP client changes.
2. Run protocol collection after server, tool, or A2A card changes.
3. Compare high-impact paths, not only node counts.
4. Treat new credential joins and new cross-protocol edges as review triggers.
5. Keep incomplete coverage visible in reports.
6. Validate the highest-value hypothesis in a disposable or authorized environment.

Do not store raw secrets in screenshots or public artifacts. AgentHound uses credential evidence and stable hashes to join observations where possible, but a matched reference is not a usable secret and should not be described as one.

## Where to go next

The graph becomes more valuable when it can express how untrusted content reaches privileged capabilities. [Prompt Injection Is a Data-Flow Problem: Mapping AI Agent Attack Paths with AgentHound](/prompt-injection-ai-agent-attack-paths-agenthound/) explains the source-to-sink model and the `TAINTS`, `IFC_VIOLATION`, and `POISONS_CONTEXT` relationships.

If you need to validate whether an authorized ContextForge tool description can be changed and safely restored, [MCP Tool Poisoning: How to Detect and Reverse It with AgentHound](/mcp-tool-poisoning-detect-reverse-agenthound/) covers the detection and reversible mutation workflow. It also explains the important gap between finding suspicious metadata and proving a provider-specific mutation round trip.

The durable lesson is simple: inventory tells you what exists. A well-scoped attack graph tells you what is connected, why the connection matters, and which assumption to test next.
