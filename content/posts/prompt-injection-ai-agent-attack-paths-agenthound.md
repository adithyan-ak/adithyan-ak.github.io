---
title: "Prompt Injection Is a Data-Flow Problem: Mapping AI Agent Attack Paths with AgentHound"
description: "Model prompt injection as untrusted data flow through AI agent tools, resources, and privileged sinks, then map those paths with AgentHound."
deck: "Prompt injection becomes an engineering problem when you trace attacker-controlled input from its source, through the agent context, to a capability that can cause harm."
slug: "prompt-injection-ai-agent-attack-paths-agenthound"
file: "06"
publishedAt: "2026-08-03T15:00:00.000Z"
updatedAt: "2026-08-03T15:00:00.000Z"
category: "Agentic Security Research"
tags:
  - "Prompt Injection"
  - "AI Agent Security"
  - "Data Flow"
  - "MCP"
  - "AgentHound"
coverImage: "/images/posts/agenthound-prompt-injection-data-flow-hero.jpg"
coverImageAlt: "Engraved hound and AI agent diagram showing a red path from untrusted input through agent context to credential and shell execution sinks"
coverImageWidth: 1536
coverImageHeight: 1024
status: "Published"
draft: false
---

Prompt injection is often discussed as a bad string entering a model. That framing stops too early.

The security question is not only whether the model reads hostile instructions. It is whether attacker-controlled data can cross a trust boundary, influence a decision, and reach a tool or resource with enough authority to create impact.

That is a data-flow problem:

```text
untrusted source -> agent-readable context -> model decision -> privileged sink
```

The model sits in the path, but the vulnerability depends on the whole system around it. A harmless summarizer and a credential-reading tool can have very different risk even when they receive the same poisoned input.

## Define the source before detecting the prompt

A useful analysis begins with the input boundary. Examples include user-submitted support tickets, issue bodies, retrieved web pages, uploaded documents, emails, and tool output returned by another service.

Labeling a source as untrusted should come from system evidence, not intuition. Who can write the data? Is it authenticated? Does it cross tenants? Can a remote service alter it after review? Does the agent receive the raw value or a constrained representation?

This source-first method matches established taint analysis. Recent agentic-workflow research also models attacker-controlled inputs, AI-facing prompt interfaces, downstream sinks, and guards as a flow rather than a single classifier result. The [TaintAWI paper](https://arxiv.org/html/2605.07135v1) applies that structure to agentic GitHub Actions. AgentHound applies a related source-and-sink discipline to agent infrastructure graphs.

## Map propagation through the agent context

AgentHound uses several relationships for different forms of propagation:

| Relationship | What it represents | Important boundary |
| --- | --- | --- |
| `INGESTS_UNTRUSTED` | A tool accepts input classified as untrusted | A source label, not proof of exploitation |
| `TAINTS` | An untrusted-input tool shares at least two input-schema keys with a tool on another server | A cross-server compatibility signal |
| `IFC_VIOLATION` | An untrusted source and a high-impact sink share a resource path within three access hops | A potential information-flow-control violation |
| `POISONED_DESCRIPTION` | A tool description contains injection markers | A suspicious self-edge on that tool |
| `POISONS_CONTEXT` | An injection-bearing tool shares an agent context with a high-capability sibling | Scoped to tools loaded by the same agent |

These relationships should not be treated as synonyms. `TAINTS` says that compatible data could flow across server boundaries. `IFC_VIOLATION` adds a shared resource and a high-impact sink. `POISONS_CONTEXT` models the context an agent constructs from sibling tools.

The [AgentHound attack-path model](https://docs.agenthound.io/operator/attack-paths/) documents the exact processor conditions. Keeping those conditions visible makes the finding falsifiable.

## Identify the sink by capability, not by name

Tool names are weak evidence. A tool called `lookup` might read a public catalog or retrieve a credential-bearing support record. A tool called `run` might start a harmless job or execute a shell command.

AgentHound therefore uses capability and resource evidence. High-impact data-flow sinks include credential access, file writes, and email sends. Context-poisoning sinks also include shell access and code execution.

For every sink, ask:

1. What operation can the tool actually perform?
2. Which identity and credentials does it use?
3. Is approval required at invocation time?
4. What resource is shared with the source?
5. Can policy constrain the specific arguments, not only the tool name?

This is also where MCP implementation security matters. The official [MCP security best-practices document](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices) covers authorization failures such as confused deputy behavior, token passthrough, SSRF, and local server compromise. Prompt injection can become more serious when those surrounding controls are already weak.

## Reproduce the path in a deterministic fixture

To exercise the composite detectors without pretending a public service was vulnerable, I loaded AgentHound's deterministic regression fixture into a disposable analysis database. Before the fixture, the database contained live observations from isolated MCP, A2A, Ollama, Qdrant, MLflow, Jupyter, Open WebUI, and vLLM test services. The fixture then added known source, sink, and poisoned-description conditions.

After processing, the disposable graph contained 221 nodes, 231 edges, and 34 findings. The relevant composite relationships were:

| Relationship | Count |
| --- | ---: |
| `TAINTS` | 1 |
| `IFC_VIOLATION` | 1 |
| `POISONS_CONTEXT` | 2 |
| `POISONED_DESCRIPTION` | 1 |
| `CONFUSED_DEPUTY` | 1 |

These counts are regression evidence, not prevalence data. The fixture is designed to make specific processors fire. It does not show that one in every five real agents has a poisoning path.

![AgentHound poisoning graph showing an untrusted ingestor connected to taint and high-impact sinks](/images/posts/agenthound-poisoning-data-flow-graph.png "A deterministic regression fixture rendered in the Poisoning lens. The left cluster exercises untrusted-source and sink relationships; the right cluster exercises tool shadowing.")

The graph is useful because it preserves the route. The analyst can inspect the untrusted source, the shared schema or resource, the agent trust relationship, and the sink capability instead of receiving only a severity label.

## Read a finding as a claim with conditions

The findings view presents the detector output, but the title is not the conclusion. Expand the record and verify its conditions.

![AgentHound findings list showing a suspicious tool description, confused deputy path, and context poisoning findings](/images/posts/agenthound-prompt-injection-findings.png "The findings list after the deterministic fixture was ingested. Each row is a graph-derived claim whose source, sink, scope, and supporting evidence still need review.")

For a `POISONS_CONTEXT` finding, a defensible analyst note looks like this:

> The same agent loads one tool whose description contains injection markers and a sibling tool with a high-impact capability. This establishes a risky shared context. It does not establish that the model followed the instruction or invoked the sink.

For an `IFC_VIOLATION`, the note should name the shared resource and each access hop. If the resource path is generic, stale, or inferred from incomplete configuration, lower the confidence or collect better evidence.

## Use a four-part validation test

A practical prompt-injection review can be reduced to four checks:

### Source control

Prove that an attacker or lower-trust principal can influence the input. A detector that cannot name the writer is describing suspicious content, not attacker reachability.

### Propagation

Show how the value becomes model-readable and how model output influences the next operation. This is where schema compatibility, resource sharing, and shared agent context matter.

### Sink authority

Record the concrete operation, execution identity, and resource boundary. A tool with a dangerous description but no meaningful authority is lower risk than a plain-looking tool that can read credentials or execute code.

### Missing guard

Look for allowlists, per-operation approval, argument validation, content isolation, output encoding, least-privilege credentials, and resource-level policy. A path becomes actionable when the control that should stop it is absent or bypassable.

## Fix the path at system boundaries

Prompt filtering can help, but it is not the primary control for a privileged agent. Durable mitigations break the flow:

1. Keep untrusted content in a typed data channel instead of mixing it into instructions.
2. Give the agent only the tools required for the current task.
3. Separate read-only retrieval from state-changing actions.
4. Validate tool arguments against the original trusted request.
5. Require approval for credential access, code execution, external communication, and destructive writes.
6. Use distinct identities and scopes for distinct tools and tenants.
7. Log the source content, decision, tool call, and authorization result as separate events.
8. Recompute the graph after the control change and confirm the path is removed or constrained.

The goal is not to make the model incapable of reading hostile text. In many applications, reading hostile text is the job. The goal is to make that text unable to silently acquire authority.

## What the graph does not prove

A path is not a successful exploit. AgentHound does not claim that the model obeyed a payload, that a sink accepted a generated argument, or that data left the environment unless the collected evidence supports those events.

Coverage also matters. Incomplete collection can support a positive statement such as "this agent trusts this server." It cannot safely support a negative statement such as "this agent has no other privileged tools."

Use the graph to rank validation work, document trust boundaries, and measure whether a remediation removed the risky relationship. Keep exploit claims for controlled tests that observe the model and the sink.

## Continue the investigation

If you need to assemble the base graph first, [How to Build an AI Agent Attack Graph with AgentHound](/build-ai-agent-attack-graph-agenthound/) covers collection, ingestion, provenance, and coverage.

If suspicious tool metadata is part of the path, [MCP Tool Poisoning: How to Detect and Reverse It with AgentHound](/mcp-tool-poisoning-detect-reverse-agenthound/) separates passive detection from an authorized, provider-specific mutation and verified restore.

The key shift is from asking, "Can this prompt fool the model?" to asking, "What untrusted data can reach which authority, through which agent, under which controls?" That question produces findings an engineer can reproduce and fix.
