---
title: "MCP Tool Poisoning: Detect and Safely Validate It with AgentHound"
description: "Detect suspicious MCP tool descriptions, map their reach to privileged capabilities, and inspect AgentHound's reversible ContextForge validation."
deck: "AgentHound separates suspicious metadata, shared agent context, reversible provider validation, and recovery into evidence you can audit from one scan artifact."
slug: "mcp-tool-poisoning-detect-reverse-agenthound"
file: "07"
publishedAt: "2026-08-03T14:00:00.000Z"
updatedAt: "2026-08-20T16:00:00.000Z"
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

A rigorous assessment separates four claims:

1. The description contains an injection signal.
2. An agent loads the tool into a context that also contains high-impact capabilities.
3. The provider permits an authorized description change.
4. The exact original state can be restored and verified.

AgentHound represents these claims separately. Passive collection and server-side processors handle the first two. When an active scan finds an eligible ContextForge-managed tool and an associated bearer credential, the autonomous planner can test the last two with a scan-specific marker and immediate recovery.

## Start with a current scan

Put the in-scope ContextForge MCP endpoint in a supported local agent configuration, along with the authorized credential the client uses. AgentHound always collects local configurations and configured endpoints, so no protocol-specific collector flag is required:

```bash
agenthound scan --output contextforge-scan.json
```

If a hostname or network range must be added to the scope, pass one positional target without disabling local collection:

```bash
agenthound scan gateway.example \
  --exclude admin.gateway.example \
  --output contextforge-scan.json
```

The normal scan is active. It can reuse compatible credentials, verify MCP resource access, and run eligible reversible ContextForge probes. Run it only in an environment you own or are explicitly authorized to assess.

For detection without cross-target credential reuse, tool or model invocation, or mutation, use stealth mode:

```bash
agenthound scan --stealth --output contextforge-readonly.json
```

Stealth still performs anonymous and exact configured read-only collection. Protocol operations may use POST where MCP requires it, but the workflow does not invoke tools or change their metadata.

## Detect suspicious tool descriptions

During MCP enumeration, AgentHound evaluates tool descriptions with its compiled detection rules. Signals include override language, instructions to ignore other guidance, exfiltration-oriented text, hidden Unicode, embedded URLs, and encoded payload indicators.

After moving the artifact to the analysis system, ingest and query the published projection:

```bash
agenthound-server ingest contextforge-scan.json
agenthound-server query --prebuilt poisoned-tools
```

A matching tool receives a `POISONED_DESCRIPTION` relationship. This means its description matched a detection condition. It does not mean a model read the description, followed it, or invoked another tool.

## Map the poisoned context to capability

The next question is whether an agent trusts both the server exposing the injection-bearing tool and a server exposing a high-impact sibling. AgentHound's `POISONS_CONTEXT` processor scopes the relationship through those `TRUSTS_SERVER` edges.

```text
injection-bearing tool
        |
        | shared agent context
        v
shell, code, credential, or email capability
```

That scope avoids treating every suspicious tool as if it could influence every capability in the environment. Review the finding's persisted evidence subgraph, confidence, source collector, and coverage before describing the path as reachable.

The graph evidence is enough to prioritize remediation. It is not proof that a model executed the sink.

## Understand when the active round trip is eligible

MCP standardizes tool discovery and invocation, not a universal API for rewriting tool metadata. AgentHound therefore limits active description validation to a concrete ContextForge management contract.

The planner requires all of the following before it creates a round-trip candidate:

| Requirement | Why it matters |
| --- | --- |
| An HTTP MCP server with the supported ContextForge server-scoped endpoint | Binds the MCP observation to the provider's management object |
| At least one tool observed from that server | Selects an exact tool name and graph identity |
| Concrete bearer material associated with the server | Prevents masked, hashed, unresolved, or arbitrary strings from becoming credentials |
| Active mode and an admitted endpoint | Honors `--stealth` and the scan's hard exclusions |
| Provider identity and authorization checks | Prevents the adapter from treating a generic MCP server as a writable ContextForge target |

If the MCP and management surfaces require different authorized bearer tokens, AgentHound supports these environment overrides:

```bash
export AGENTHOUND_MCP_TOKEN='<authorized MCP bearer token>'
export AGENTHOUND_CONTEXTFORGE_TOKEN='<authorized management bearer token>'
agenthound scan --output contextforge-scan.json
```

Avoid putting real tokens in command history. The resulting artifact contains concrete credentials and recovery material, so protect it accordingly. Keep the management token available if unresolved cleanup later requires `revert`.

## Follow the automatic mutation and recovery sequence

For each eligible candidate, the active planner performs one bounded, exclusive sequence:

1. Resolve the exact ContextForge server and tool through MCP and management state.
2. Persist the original description and typed recovery state in the scan artifact before the first write.
3. Append a unique `agenthound:<scan-id>:<uuid>` marker.
4. Observe the changed description through MCP.
5. Restore the original immediately under a separate bounded cleanup context.
6. Confirm the original state and checkpoint the recovery record as restored.

Collection and other actions are drained before the mutation. Nothing else starts until restoration is confirmed. If the main scan is interrupted after a write may have occurred, cleanup receives its own bounded context instead of inheriting the cancellation.

The marker tests whether the exact metadata path can be changed, observed, and restored. It does not ask a model to obey a malicious instruction.

## Inspect the execution journal

Action and recovery state live under `meta.extra.scan_execution` in the same JSON artifact as the graph. This query extracts the relevant summary without printing the embedded credential or full recovery contract:

```bash
jq '.meta.extra.scan_execution | {
  status,
  summary,
  roundtrips: [
    .actions[]
    | select(.action == "mcp.description.roundtrip")
    | {status, outcome, recovery_id}
  ],
  recovery: [
    .recovery[]
    | select(.action == "mcp.description.roundtrip")
    | {id, status, error}
  ]
}' contextforge-scan.json
```

A fully successful validation records the action outcome `mutation_observed_restored` and the linked recovery status `restored`. An empty `roundtrips` array means the planner did not find an eligible candidate; it is not evidence that the provider is immutable or safe.

The ContextForge round-trip status remains execution-journal evidence. It does not create a graph edge, a poisoning finding, or an additional risk score. Detection still comes from the collected description and the server's analysis rules.

## Recover from unresolved cleanup

If the final scan summary reports unresolved cleanup, preserve the artifact and run:

```bash
agenthound revert contextforge-scan.json
```

`revert` reads the target, TLS setting, exclusions, credential references, and typed recovery state from that file. It retries unresolved records newest-first, observes current state before writing, skips records already marked restored, and checkpoints each attempt.

The recovery path fails closed on conflicting third-party changes instead of silently overwriting them. It can still be blocked by target deletion, access loss, provider-policy drift, or an unreachable endpoint. A recovery implementation cannot force an external provider to accept a restore, which is why the original state is stored before mutation and the final summary must be checked.

## Keep proof boundaries explicit

The three most useful AgentHound results answer different questions:

| Result | What it proves |
| --- | --- |
| `POISONED_DESCRIPTION` | Current tool metadata matched an injection rule |
| `POISONS_CONTEXT` | That tool shares an agent context with a high-impact capability under the processor's conditions |
| `mutation_observed_restored` | The authorized ContextForge metadata path accepted a unique marker, exposed it through MCP, and returned to the original state |

None of them alone proves that a model followed the text or invoked a privileged tool. A model-behavior claim requires a separate authorized test that observes the prompt, decision, tool call, authorization result, and downstream effect.

## Remediate without running active validation

You do not need to mutate production metadata to fix a suspicious path. Defenders can:

1. Remove hidden, encoded, or imperative instructions from tool descriptions.
2. Review description changes like code changes, with clear ownership and provenance.
3. Pin or attest server and tool metadata where the platform permits it.
4. Separate untrusted retrieval tools from credential, shell, code, and email capabilities.
5. Require user confirmation for high-impact calls and show the exact arguments.
6. Apply least-privilege identities at the tool and downstream resource layers.
7. Alert on unexpected description, schema, version, owner, or attribution changes.
8. Rescan and confirm that `POISONED_DESCRIPTION` and `POISONS_CONTEXT` findings are gone or constrained.

The official [MCP security best-practices document](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices) covers related authorization, token-handling, SSRF, and local-server risks. Metadata integrity belongs alongside those controls.

## Continue from metadata to the wider graph

[How to Build an AI Agent Attack Graph with AgentHound](/build-ai-agent-attack-graph-agenthound/) covers the autonomous collector, manual ingestion, evidence states, and attack-path queries.

[Prompt Injection Is a Data-Flow Problem: Mapping AI Agent Attack Paths with AgentHound](/prompt-injection-ai-agent-attack-paths-agenthound/) connects poisoned descriptions and instruction files to untrusted sources, shared resources, and high-impact sinks.
