---
title: "Prompt Injection Is a Data-Flow Problem: Mapping AI Agent Attack Paths with AgentHound"
description: "Trace untrusted data and poisoned instructions through AI agent context to high-impact tools and resources with AgentHound."
deck: "Prompt injection becomes an engineering problem when you connect the input source, the agent's instructions and tools, the propagation path, and the authority at the sink."
slug: "prompt-injection-ai-agent-attack-paths-agenthound"
file: "06"
publishedAt: "2026-08-03T15:00:00.000Z"
updatedAt: "2026-08-20T16:00:00.000Z"
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

The security question is whether attacker-controlled data can cross a trust boundary, influence a model decision, and reach a tool or resource with enough authority to cause harm.

That is a data-flow problem:

```text
untrusted source -> agent-readable context -> model decision -> privileged sink
```

The model sits in the path, but the vulnerability depends on the system around it. A harmless summarizer and a credential-reading tool can have very different risk even when they receive the same poisoned input.

## Define the source before detecting the prompt

A useful analysis begins with the input boundary. Examples include user-submitted support tickets, issue bodies, retrieved web pages, uploaded documents, emails, tool output returned by another service, and repository instruction files that a lower-trust contributor can edit.

Labeling a source as untrusted should come from evidence, not intuition. Who can write it? Is the writer authenticated? Does the data cross tenants? Can a remote service alter it after review? Does the agent receive the raw value or a typed representation? Which configuration proves that the agent loads the instruction or trusts the server?

This source-first method matches established taint analysis. Recent agentic-workflow research also models attacker-controlled inputs, AI-facing prompt interfaces, downstream sinks, and guards as a flow rather than a single classifier result. The [TaintAWI paper](https://arxiv.org/html/2605.07135v1) applies that structure to agentic GitHub Actions. AgentHound applies a related source-and-sink discipline to agent infrastructure graphs.

## Collect tools and instructions in one scan

AgentHound's targetless scan always collects supported local agent configurations, known instruction surfaces, credentials, configured endpoints, loopback, and active local interfaces. Deep mode adds bounded recursive instruction discovery and higher-cost service evidence:

```bash
agenthound scan --deep --output injection-review.json
```

Use `--stealth --deep` when the review must remain read-only. Stealth mode keeps anonymous and exact configured collection but disables cross-target credential reuse, compute and tool invocation, and mutation.

The artifact is continuously checkpointed and can contain raw credentials and collected content. Move it to the analysis system and ingest it only when operational timing allows:

```bash
agenthound-server ingest injection-review.json
```

## Map the different forms of propagation

AgentHound uses separate relationships because each one makes a different claim:

| Relationship | What it represents | Important boundary |
| --- | --- | --- |
| `LOADS_INSTRUCTIONS` | An agent loads an observed instruction file | The trust relationship needed to scope instruction risk |
| `POISONED_INSTRUCTIONS` | Instruction content contains model-steering or prompt-injection signals | Suspicious content, not proof that the agent followed it |
| `INGESTS_UNTRUSTED` | A tool accepts input classified as untrusted | A source label, not proof of exploitation |
| `POISONED_DESCRIPTION` | An MCP tool description contains injection signals | Suspicious metadata, not proof of model behavior |
| `POISONS_CONTEXT` | An injection-bearing tool shares an agent context with a high-impact sibling | Scoped through the agent's trusted MCP servers |
| `TAINTS` | An untrusted-input tool shares at least two input-schema keys with a tool on another server | A cross-server compatibility signal |
| `IFC_VIOLATION` | An untrusted source and a high-impact sink share a resource path within the processor's bounded traversal | A potential information-flow-control violation |

These are not synonyms. `POISONED_INSTRUCTIONS` and `POISONED_DESCRIPTION` identify suspicious content. `POISONS_CONTEXT` adds shared agent context and a high-impact sibling. `TAINTS` describes compatible cross-server flow. `IFC_VIOLATION` adds a shared resource path and an impact-bearing sink.

The [AgentHound attack-path documentation](https://docs.agenthound.io/operator/attack-paths/) describes the evidence states and path families. Keeping each condition visible makes a finding falsifiable.

## Identify the sink by capability, not by name

Tool names are weak evidence. A tool called `lookup` might read a public catalog or retrieve a credential-bearing support record. A tool called `run` might start a harmless job or execute a shell command.

AgentHound classifies capabilities from collected descriptions, schemas, and protocol evidence. Its capability surface includes shell and code execution, credential and database access, file reads and writes, outbound network access, and email sending. Resource sensitivity rules separately identify production databases, object stores, credentials, keys, system files, logs, and general remote resources.

For every sink, ask:

1. What operation can the tool actually perform?
2. Which identity and credentials does it use?
3. Is approval required at invocation time?
4. Which resource joins the source and sink?
5. Can policy constrain the arguments as well as the tool name?

This is also where MCP implementation security matters. The official [MCP security best-practices document](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices) covers authorization failures such as confused deputy behavior, token passthrough, SSRF, and local server compromise. Prompt injection becomes more serious when those surrounding controls are weak.

## Query the current poisoning evidence

The server's prebuilt queries and findings output make the review repeatable:

```bash
agenthound-server query --prebuilt instruction-poisoning
agenthound-server query --prebuilt poisoned-tools
agenthound-server query --findings --severity high --format json
```

Open each finding and inspect the persisted evidence subgraph, source collector, confidence, evidence state, affected endpoints, and coverage that existed when the revision was published. The title alone is not enough.

![AgentHound poisoning graph showing an untrusted ingestor connected to taint and high-impact sinks](/images/posts/agenthound-poisoning-data-flow-graph.png "The Poisoning lens keeps the source, compatible flow, shared context, and high-impact sink visible instead of reducing the path to one severity label.")

![AgentHound findings list showing a suspicious tool description, confused deputy path, and context poisoning findings](/images/posts/agenthound-prompt-injection-findings.png "Each row is a graph-derived claim whose source, sink, scope, evidence state, and supporting subgraph still need review.")

For a `POISONS_CONTEXT` finding, a defensible analyst note looks like this:

> The same agent trusts servers that expose one tool with injection-bearing metadata and a sibling tool with a high-impact capability. This establishes a risky shared context. It does not establish that the model followed the instruction or invoked the sink.

For an `IFC_VIOLATION`, name the source, shared resource, sink, and each access hop. If the path depends on generic, stale, partial, or hypothesis evidence, say so and collect better evidence before raising the claim.

## Grade the evidence correctly

AgentHound distinguishes direct observations from deterministic inference and bounded hypotheses. One current path can also receive stronger proof: an anonymous-denied and credentialed-allowed read of the exact MCP resource records `CREDENTIAL_ACCESS_OBSERVED`. During ingest, only the matching `CAN_REACH` path containing that credential and resource becomes **Verified During Scan**.

That verified state proves credential-gated resource access. It does not prove that a poisoned prompt caused the read, that the model chose the tool, or that downstream impact occurred. Likewise, a successful ContextForge description round trip is stored in the scan execution journal; it does not create a poisoning finding or add risk by itself.

## Use a four-part validation test

A practical prompt-injection review can be reduced to four checks.

### Source control

Prove that an attacker or lower-trust principal can influence the input. A detector that cannot name the writer is describing suspicious content, not attacker reachability.

### Propagation

Show how the value becomes model-readable and how model output can influence the next operation. This is where instruction loading, schema compatibility, resource sharing, and shared agent context matter.

### Sink authority

Record the concrete operation, execution identity, and resource boundary. A tool with dangerous-looking text but no meaningful authority is lower risk than a plain-looking tool that can read credentials or execute code.

### Missing guard

Look for allowlists, per-operation approval, argument validation, content isolation, output encoding, least-privilege credentials, and resource-level policy. A path becomes actionable when the control that should stop it is absent or bypassable.

## Fix the path at system boundaries

Prompt filtering can help, but it is not the primary control for a privileged agent. Durable mitigations break the flow:

1. Keep untrusted content in a typed data channel instead of mixing it into instructions.
2. Give the agent only the tools required for the current task.
3. Separate read-only retrieval from state-changing actions.
4. Validate tool arguments against the original trusted request.
5. Require approval for credential access, code execution, external communication, and destructive writes.
6. Use distinct identities and scopes for different tools and tenants.
7. Review and pin instruction files and MCP metadata like code where possible.
8. Log the source content, decision, tool call, and authorization result as separate events.
9. Rescan after the control change and confirm that the risky relationship is removed or constrained.

Many applications need models to read hostile text. The surrounding controls must stop that text from silently acquiring authority.

## What the graph does not prove

A path is not a successful exploit. AgentHound does not claim that the model obeyed a payload, that a sink accepted generated arguments, or that data left the environment unless the collected evidence supports those events.

Coverage also matters. Incomplete collection can support a positive statement such as "this agent trusts this server." It cannot safely support a negative statement such as "this agent has no other privileged tools." Unknown evidence remains unknown rather than becoming a clean zero.

Use the graph to rank validation work, document trust boundaries, and measure whether remediation removed a risky relationship. Reserve exploit claims for controlled tests that observe the model, the authorization decision, and the sink.

## Continue the investigation

[How to Build an AI Agent Attack Graph with AgentHound](/build-ai-agent-attack-graph-agenthound/) covers the autonomous scan, artifact handling, manual ingestion, provenance, and coverage.

[MCP Tool Poisoning: Detect and Safely Validate It with AgentHound](/mcp-tool-poisoning-detect-reverse-agenthound/) explains how passive description findings differ from the eligible ContextForge marker round trip and artifact-based recovery.

Ask which untrusted data can reach a specific authority, through which agent, and under which controls. That produces a finding an engineer can reproduce and fix.
