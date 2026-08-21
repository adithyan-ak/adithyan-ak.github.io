---
title: "How to Build an AI Agent Attack Graph with AgentHound"
description: "Run one autonomous AgentHound scan from a foothold, preserve the evidence in a local artifact, and turn it into an AI agent attack graph."
deck: "A practical guide to mapping agent clients, credentials, MCP, A2A, and AI services while keeping observed facts, inferred paths, and same-scan proof distinct."
slug: "build-ai-agent-attack-graph-agenthound"
file: "05"
publishedAt: "2026-08-03T16:00:00.000Z"
updatedAt: "2026-08-20T16:00:00.000Z"
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

An attack graph shows the relationships that a flat inventory misses. You can see which agent trusts the server that exposes a risky tool, which host runs that agent, which concrete credentials connect other services, and whether the path reaches sensitive data or an outbound channel.

[AgentHound](https://github.com/adithyan-ak/agenthound) builds this graph from one autonomous collection workflow. The collector runs without a database or analysis server on the foothold, continuously preserves its evidence in one JSON artifact, and leaves ingestion under the operator's control.

## What the graph represents

AgentHound models MCP servers, tools, resources and prompts; A2A agents and skills; local agent instances, configuration and instruction files; credentials and identities; hosts; and supported AI services such as LiteLLM, Open WebUI, Ollama, vLLM, Qdrant, MLflow, Jupyter, and LangServe.

Raw edges record observations such as an agent trusting an MCP server or a server providing a tool. Server-side processors rebuild higher-level relationships such as `CAN_REACH`, `CAN_EXECUTE`, `CAN_EXFILTRATE_VIA`, credential chains, poisoning, tainted data flow, and cross-protocol paths.

The evidence state tells you how strongly to read each result:

| Evidence state | What it means |
| --- | --- |
| Observed signal | The collector directly observed the fact represented by the finding |
| Inferred | Current graph evidence satisfies a deterministic analysis path |
| Verified | The scan proved that one exact credential could read one exact MCP resource after the anonymous control was denied |
| Hypothesis | A bounded correlation, such as host co-location across protocols, still needs operator validation |
| Reference only | A masked, hashed, or unresolved value is useful context but not executable credential material |

These edges describe evidence and testable paths. They do not claim that an agent traversed each one.

## Install the collector on the foothold

Install the pinned 1.1 release and verify it:

```bash
curl -sSfL https://raw.githubusercontent.com/adithyan-ak/agenthound/1.1.0/install.sh \
  | AGENTHOUND_VERSION=1.1.0 sh
export PATH="$HOME/.local/bin:$PATH"
agenthound version
```

The collector is a static binary. It does not need Neo4j, PostgreSQL, Node.js, or a connection to the AgentHound server.

An ordinary scan is active: when prerequisites are present, the planner can reuse compatible credentials, perform differential MCP resource reads, and run a reversible ContextForge description round trip. Use it only on systems you own or are authorized to assess. If the operation must stay read-only, use `--stealth`.

## Run one autonomous scan

The fastest useful starting point is a targetless scan:

```bash
agenthound scan --output foothold.json
```

Local configuration, instruction, and credential collection always runs. Without a positional target, AgentHound also seeds loopback, active local interfaces, configured MCP endpoints, and the standard ports of supported AI services.

The planner then turns new observations into more work. It fingerprints responding services, runs the applicable MCP, A2A, gateway, model, vector, MLOps, notebook, and web-interface collectors, and reuses only concrete credentials supported by the destination adapter. Newly collected targets and credentials can unlock more candidates during the same scan.

Use `--deep` when recursive instruction discovery, Qdrant payload samples, more expensive probes, and bounded Ollama embedding verification are in scope:

```bash
agenthound scan --deep --output foothold-deep.json
```

For anonymous and exact configured read-only collection:

```bash
agenthound scan --stealth --output foothold-stealth.json
```

Stealth mode disables cross-target credential reuse, model and tool invocation, and mutation. `--stealth --deep` expands read-only filesystem and payload collection without enabling those actions.

## Add bounded network scope

One hostname, IP, CIDR, or targets file can be added without disabling local collection:

```bash
agenthound scan 10.20.0.0/24 \
  --exclude 10.20.0.15 \
  --output subnet.json

agenthound scan @targets.txt --deep --output estate.json
```

`--exclude` is repeatable. Its contact policy applies to exact hostnames, IPs, CIDRs, DNS results, redirects, derived management and cleanup URLs, remote JWKS locations, and the final socket dial. An excluded endpoint found in local configuration can remain graph evidence without being contacted.

Explicit public targets are accepted, so authorization and scope are the operator's responsibility. Avoid broad ranges when a smaller hostname, IP, or targets file answers the question.

## Preserve the artifact as sensitive evidence

AgentHound creates an ingest-valid artifact before collection and replaces it with a complete checkpoint after every meaningful collection result, action transition, and recovery transition. The final file contains the graph, scan mode, exclusions, action outcomes, recovery records, returned content, and concrete credential values.

On an unstable foothold, independent collector failures remain in the evidence while unrelated work continues. A lost connection does not force the operator to reconstruct the scan from a server-side session.

Treat the file like credential material. The collector uses restrictive file permissions where supported, but the JSON is intentionally usable and can contain raw secrets.

If the final summary reports unresolved cleanup, preserve the same artifact and retry recovery:

```bash
agenthound revert foothold.json
```

`revert` processes unresolved records newest-first, observes current state before writing, and refuses to overwrite a conflicting third-party change.

## Start the analysis stack and ingest manually

Deploy the optional server on the analysis system, not the foothold:

```bash
curl -sSfL \
  https://raw.githubusercontent.com/adithyan-ak/agenthound/1.1.0/docker/docker-compose.public.yml \
  -o agenthound-compose.yml
docker compose -f agenthound-compose.yml -p agenthound up -d --wait
```

Move the completed artifact to that system and ingest it:

```bash
docker compose -f agenthound-compose.yml -p agenthound exec -T agenthound \
  agenthound-server ingest - < foothold.json
```

If the server is installed directly, use `agenthound-server ingest foothold.json`. Open `http://127.0.0.1:8080` to inspect the dashboard. AgentHound is a single-user application bound to loopback by default; use an SSH tunnel, private network controls, or an authenticated reverse proxy for remote access.

![AgentHound dashboard showing the collected agent, MCP, A2A, tool, credential, and exposure totals](/images/posts/agenthound-dashboard-attack-surface.png "The dashboard summarizes the published graph. Coverage state is as important as the totals because partial evidence cannot support a clean absence claim.")

## Read the attack graph without fooling yourself

Start with the graph lens that matches the question. The attack-surface view reduces visual noise around credentials, resources, protocols, and reachability relationships.

![AgentHound attack-surface graph connecting agents, tools, credentials, resources, and services](/images/posts/agenthound-attack-surface-graph.png "An edge is an observation, a deterministic inference, or a bounded hypothesis. Only an exact same-scan credential-to-resource read receives verified confidence.")

Trace a path from a plausible attacker-controlled source toward a meaningful sink:

1. Identify the source and the evidence that makes it untrusted.
2. Check the raw relationships, collection scope, and timestamp supporting each composite edge.
3. Distinguish observed, inferred, verified, and hypothesis evidence.
4. Verify the sink's capability instead of trusting its name.
5. Record missing preconditions before describing the path as exploitable.

For same-scan MCP proof, AgentHound first reads an eligible resource anonymously. If that succeeds, it records `PUBLIC_ACCESS_OBSERVED` without presenting a credential. Otherwise, an anonymous denial followed by a successful credentialed read records `CREDENTIAL_ACCESS_OBSERVED`. During ingest, only an existing `CAN_REACH` path containing that exact credential and resource is upgraded to **Verified During Scan**.

## Query findings and paths reproducibly

The server CLI exposes the same published projection used by the dashboard:

```bash
agenthound-server query --prebuilt agents-shell-access
agenthound-server query --prebuilt credential-chain
agenthound-server query --prebuilt exfiltration-routes
agenthound-server query --prebuilt cross-protocol-paths
agenthound-server query --findings --severity high --format json
```

For each result, preserve four pieces of context:

| Field | Question to answer |
| --- | --- |
| Scope | Which collector domains were complete, partial, failed, or absent? |
| Provenance | Which scan and source collector produced the supporting evidence? |
| Derivation | Which processor or rule created the finding? |
| Validation | What authorized test would confirm or refute the remaining inference? |

Finding detail includes the exact evidence subgraph captured when that revision was published. A later graph change therefore does not silently rewrite the explanation attached to an existing finding.

## Repeat the scan after changes

1. Run the same bounded scope after agent configuration, MCP, A2A, or service changes.
2. Compare findings and high-impact paths instead of relying on node counts.
3. Treat new credential joins, verified access, and cross-protocol correlations as review triggers.
4. Keep incomplete coverage and unknown risk factors visible.
5. Validate the highest-value remaining hypothesis in a disposable or explicitly authorized environment.

Do not put raw scan artifacts or revealed credential values in screenshots, tickets, or public research. A `value_hash` can join repeated observations, but masked, hashed, and unresolved references remain non-executable evidence.

## Where to go next

[Prompt Injection Is a Data-Flow Problem: Mapping AI Agent Attack Paths with AgentHound](/prompt-injection-ai-agent-attack-paths-agenthound/) explains `POISONED_INSTRUCTIONS`, `POISONED_DESCRIPTION`, `TAINTS`, `IFC_VIOLATION`, and `POISONS_CONTEXT` as distinct source-to-sink claims.

[MCP Tool Poisoning: Detect and Safely Validate It with AgentHound](/mcp-tool-poisoning-detect-reverse-agenthound/) covers passive detection, the eligible ContextForge round trip inside an active scan, the execution journal, and artifact-based recovery.
