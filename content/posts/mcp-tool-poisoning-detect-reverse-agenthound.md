---
title: "MCP Tool Poisoning: How to Detect and Reverse It with AgentHound"
description: "Detect suspicious MCP tool descriptions, map their reach to privileged tools, and safely validate a reversible ContextForge mutation with AgentHound."
deck: "A tool-poisoning workflow should separate observation, graph analysis, authorized mutation, and verified recovery. This guide shows each boundary."
slug: "mcp-tool-poisoning-detect-reverse-agenthound"
file: "07"
publishedAt: "2026-08-03T14:00:00.000Z"
updatedAt: "2026-08-03T14:00:00.000Z"
category: "Agentic Security Research"
tags:
  - "MCP Security"
  - "Tool Poisoning"
  - "AgentHound"
  - "ContextForge"
  - "AI Agent Security"
coverImage: "/images/posts/agenthound-mcp-tool-poisoning-hero.jpg"
coverImageAlt: "Engraved MCP tool card with a red poisoned description path leading toward credential and shell capability nodes before a verified restore loop"
coverImageWidth: 1536
coverImageHeight: 1024
status: "Published"
draft: false
---

MCP tool descriptions are part of the model's decision surface. A description can explain when a tool should be used, what data it expects, and how its output should be interpreted. If that metadata contains hidden or adversarial instructions, it can steer the agent before any tool is invoked.

Finding suspicious metadata is only the first step. A rigorous tool-poisoning assessment separates four claims:

1. The description contains injection markers.
2. An agent actually loads the tool into its context.
3. The same context exposes a capability that can create impact.
4. An authorized provider-specific mutation can be applied and restored.

AgentHound supports all four forms of evidence, but it does not collapse them into one exploit claim.

## Detect suspicious tool descriptions

Start with collection. Scan the in-scope MCP endpoint and ingest the result into the local analysis server:

```bash
agenthound scan --mcp --url https://mcp.example.test/mcp \
  --ingest http://127.0.0.1:8080
```

The MCP collector inspects tool descriptions for signals such as imperative injection language, encoded blobs, hidden Unicode, and instructions that attempt to override safety constraints. A matching tool receives a `POISONED_DESCRIPTION` self-edge.

That edge means the description matched a detection condition. It does not mean a model read the description, followed it, or invoked another tool.

## Map the poisoned context to capability

The higher-value question is whether the same agent loads both the suspicious tool and a high-capability sibling. AgentHound's `POISONS_CONTEXT` processor scopes this relationship through the agent's trusted MCP servers.

```text
injection-bearing tool
        |
        | same agent context
        v
shell, code, credential, or email capability
```

The scope avoids treating every poisoned tool as if it could affect every tool in the environment. The current high-capability sinks include shell access, code execution, credential access, and email sending. Review the exact conditions in the [AgentHound attack-path documentation](https://docs.agenthound.io/operator/attack-paths/).

This graph evidence is enough to prioritize the agent for remediation. It is not enough to say that the model executed the sink.

## Keep detection separate from mutation

MCP standardizes tool observation and invocation, not a universal management API for rewriting tool metadata. A generic "poison any MCP server" command would therefore be misleading and unsafe.

AgentHound implements one explicit management contract for ContextForge. The adapter observes the server through MCP, resolves the matching ContextForge management object, verifies provider identity and authorization, and mutates only the selected tool description.

The distinction is important:

| Stage | Changes target state? | Result |
| --- | --- | --- |
| Scan | No | Observed tools and detection signals |
| Graph analysis | No | Derived context and attack-path relationships |
| Poison dry run | No | Validated plan and provider preconditions |
| Poison commit | Yes | One attributed description update plus a recovery receipt |
| Revert | Yes | Conflict-aware restore followed by verification |

Run mutation tests only in an environment you own or have explicit authorization to assess.

## Dry-run the ContextForge adapter

The target URL must use the ContextForge server-scoped MCP form. The adapter derives the server identity and management root from that URL:

```bash
echo "AUTHORIZED" | agenthound poison \
  https://gateway.example/servers/<server-uuid>/mcp \
  --type mcp.tool.description \
  --adapter contextforge \
  --target-id support-lookup \
  --inject-file ./authorized-test-description.txt \
  --engagement-id LAB-TOOL-POISON
```

Without `--commit`, this is a dry run. The first invocation requires an explicit `AUTHORIZED` acknowledgement, and the engagement ID binds mutation state to its receipts.

The ContextForge contract requires an identity with the exact read and update permissions needed for the selected server and tool. It does not mint or elevate credentials. The full provider, token, endpoint, and failure conditions are documented in [Offensive actions and recovery](https://docs.agenthound.io/operator/offensive-actions/).

## Commit one mutation and keep the receipt

After reviewing the plan and recovery conditions, add `--commit`:

```bash
agenthound poison \
  https://gateway.example/servers/<server-uuid>/mcp \
  --type mcp.tool.description \
  --adapter contextforge \
  --target-id support-lookup \
  --inject-file ./authorized-test-description.txt \
  --engagement-id LAB-TOOL-POISON \
  --commit
```

AgentHound persists a typed recovery receipt before reporting the mutation as applied. The receipt includes the target identity, provider contract, original and updated descriptions, versions, and provider attribution needed for recovery. It does not store management credentials or raw authentication tokens.

The forward write is not blindly retried. If the write response is lost, the adapter reconciles state with bounded read-only observations. This avoids turning a transient response failure into repeated mutation.

## Revert and verify the original state

Restore the engagement by ID:

```bash
agenthound revert LAB-TOOL-POISON
```

The adapter checks the exact object, version, and AgentHound operation attribution before it writes. A conflicting third-party change fails closed instead of being silently overwritten. After the restore, AgentHound verifies the original description through management state and, when the server association is still intact, through MCP observation.

In my isolated ContextForge lab, the direct poison-and-revert scenario recorded this result:

```json
{
  "ok": true,
  "engagement_id": "RTV-POISON-MCP",
  "mutated": true,
  "reverted": true,
  "before": "Look up a customer support case by case ID.",
  "after": "TAMPERED-BY-AGENTHOUND-OFFLINE-HARNESS",
  "restored": "Look up a customer support case by case ID."
}
```

This proves that the disposable target accepted one attributed metadata change and that AgentHound restored the original value. It does not prove that an AI model obeyed the changed text or that a privileged tool was invoked.

## Validate the complete round trip as a campaign

AgentHound also provides a bounded `mcp-poison-roundtrip` campaign. It generates a benign run marker, applies it once, observes the changed value, restores the original, and confirms the postcondition:

```bash
agenthound campaign \
  https://gateway.example/servers/<server-uuid>/mcp \
  --scenario mcp-poison-roundtrip \
  --adapter contextforge \
  --target-id support-lookup \
  --engagement-id LAB-MCP-ROUNDTRIP \
  --commit
```

The integration run produced five ordered observations:

| Step | Observation |
| ---: | --- |
| 1 | Authorization accepted |
| 2 | Mutation applied |
| 3 | Injected marker verified |
| 4 | Original description restored |
| 5 | Original postcondition confirmed |

The final run report recorded 32 of 64 allowed requests, one of two allowed mutations, an oracle outcome of `mutation_verified`, and cleanup status `restored` with `original_confirmed`.

This campaign is standalone target-mutation validation. It creates no graph finding and makes no claim about a predicted credential or execution path. That boundary is a feature, not a caveat hidden in the output.

## Understand the recovery limit

ContextForge v1.0.5 does not expose a conditional update primitive that the adapter can use for compare-and-swap. AgentHound compensates with exact object identity, version checks, unique operation attribution, one forward write, and post-write verification.

Those controls provide strong evidence and conflict detection, but they cannot remove the read-to-write race entirely. A third party can still edit the same row between the final check and the update. Run the adapter in an exclusive operation window. Strict atomic conflict safety requires server-side conditional updates.

Recovery can also fail if provider validation policy changes and the original description is no longer accepted. A compile-time reverter guarantees that the module has a recovery implementation. It cannot force an external provider to accept a restore after policy drift, deletion, access loss, or conflicting edits.

## Remediate without running the mutation test

You do not need to mutate production metadata to fix a suspicious path. Defenders can:

1. Remove hidden or imperative instructions from tool descriptions.
2. Review description changes like code changes, with ownership and provenance.
3. Pin or attest trusted server and tool metadata where the platform permits it.
4. Separate untrusted retrieval tools from credential, shell, code, and email capabilities.
5. Require user confirmation for high-impact calls and show the exact arguments.
6. Apply least-privilege identities at the tool and downstream resource layers.
7. Alert on unexpected description, version, owner, or attribution changes.
8. Rescan and confirm that `POISONED_DESCRIPTION` and `POISONS_CONTEXT` paths are gone.

The official [MCP security best-practices document](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices) focuses on surrounding protocol risks such as authorization, token handling, SSRF, and local server compromise. Tool metadata review should sit alongside those controls, not replace them.

## Continue from graph to data flow

If the environment has not been mapped yet, begin with [How to Build an AI Agent Attack Graph with AgentHound](/build-ai-agent-attack-graph-agenthound/).

To analyze how a poisoned description or untrusted tool output could reach a privileged capability, continue with [Prompt Injection Is a Data-Flow Problem: Mapping AI Agent Attack Paths with AgentHound](/prompt-injection-ai-agent-attack-paths-agenthound/).

The safe sequence is observation, graph analysis, authorization, one controlled mutation, and verified recovery. Skipping those boundaries turns a useful security test into an unauditable state change.
