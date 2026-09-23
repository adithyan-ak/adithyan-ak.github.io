---
title: "What Is Loopjacking?"
seoTitle: "What Is Loopjacking? Approval Hijacking in AI Agents"
description: "Loopjacking reuses human approval for one action to release another. Learn both attack paths, A2A's role, tested product cases, and exact-action defenses."
deck: "A person approves one action; an agent system releases another. This field note shows where the mismatch occurs, how A2A can carry it, and how to stop it."
slug: "what-is-loopjacking"
file: "09"
publishedAt: "2026-09-23T00:50:00.000Z"
updatedAt: "2026-09-23T01:03:00.000Z"
category: "Agentic Security Research"
tags:
  - "Loopjacking"
  - "AI Agent Security"
  - "Human-in-the-Loop"
  - "A2A"
  - "Authorization"
coverImage: "/images/posts/loopjacking-cover.webp"
coverImageAlt: "A human approves operation A, but a broken approval binding releases operation B"
coverImageWidth: 1672
coverImageHeight: 941
status: "Published"
draft: false
---

Loopjacking is an approval-binding failure: a person approves operation A, but implementation-owned logic uses that decision to authorize or release materially different operation B. The approval is real. The link between the reviewed action and the executed action is broken.

B may already be present in the full request but missing from the approval view. It may enter later through mutable task state. Replay, scope drift, or inconsistent interpretation can create the same mismatch. In each case, B inherits authority the human granted only to A.

## A transfer changes after approval

Consider a hypothetical agent that can initiate financial operations but needs administrator approval before a high-impact transfer executes. These amounts and destinations are illustrative, not reported losses.

1. A lower-privileged operator proposes `transfer(amount=20, destination=approved_vendor)`.
2. An administrator sees those exact parameters and approves them.
3. While the workflow is paused or resuming, attacker-influenced state changes the operation to `transfer(amount=2000, destination=attacker_account)`.
4. The executor sees an approved task and releases the changed transfer.

The operator may still be unable to approve or directly execute the protected transfer. That access control can work as designed. The failure occurs when the executor treats “this workflow was approved” as equivalent to “this exact operation is still approved.”

At execution, the runtime must compare the pending transfer with the one the administrator approved.

## What the approval must cover

> A human approval may authorize an operation only when the complete security-relevant operation shown to the human is canonically equivalent to the operation released at use time.

A Loopjacking trace needs six conditions:

1. A real human approves an operation or representation understood as A.
2. That decision does not authorize materially different B.
3. An attacker can induce the representation, state, scope, replay, or interpretation mismatch.
4. Product-owned logic consumes the decision for A when authorizing or releasing B.
5. B reaches a consequential sink such as a tool, shell, transaction, deployment, message, or data-access operation.
6. The attacker could not obtain the same effect through an equivalent direct path.

The final condition separates approval hijacking from a simpler authorization failure. If the attacker can already execute B, the approval did not enable the effect.

## Where the approved and executed operations diverge

![Two Loopjacking paths: B is hidden from the approval view before review, or substitutes for A after approval](/images/posts/loopjacking-two-approval-paths.webp "B can be hidden before approval or substituted afterward. Both paths reuse approval for A to release B.")

### The request already contains B

Representation-based Loopjacking begins before review. The full request encodes B, but the product omits, truncates, transforms, ambiguously renders, or differently canonicalizes security-relevant fields in the view shown to the human.

A shell wrapper provides a clear example. An approval dialog may render the inline command but omit positional arguments that the execution path later appends. The visible command looks safe; the complete `argv` is not.

This is different from persuading a person to approve a visibly harmful command. The product-owned representation fails to describe the effect that will execute.

### B enters after approval

In post-approval state-substitution Loopjacking, the reviewer sees accurate parameters for A. A later task, thread, session, or continuation update changes the executable operation, while the runtime continues to treat the earlier decision as valid.

Resumable workflows create several places for that divergence. A task can pause for authorization, survive a process boundary, accept new input, merge state, call another agent, reload a checkpoint, and finally execute. Representation mismatch and state substitution take different paths, but both break the binding between decision and effect.

## One operation passes through many representations

An agent workflow may carry a proposed action through several representations before a tool runs:

- natural-language intent;
- a structured tool call;
- task or thread state;
- a serialized checkpoint;
- a human-facing approval card;
- policy-engine input;
- a continuation payload;
- an executor-specific command or API request.

Different components often own those representations. An LLM selects a tool. A framework serializes the call. A server renders an approval. A protocol transports continuation. A reducer merges state. A worker reconstructs the call. A wrapper finally executes it.

The approval boundary depends on those components agreeing about what was approved.

None of these identifiers binds an approval to an exact action by itself:

- A task ID correlates activity; it does not identify the approved effect.
- A call ID identifies a record; it does not prove its arguments are unchanged.
- A credential proves possession or authority; it does not necessarily define operation scope.
- An `approved=true` flag records a decision; it does not bind the decision to a canonical action.
- A second dialog adds friction; it does not help if the dialog and executor interpret the request differently.

## What A2A carries across the pause

![A2A carries task, pause, message, and resume; the implementation presents and verifies the approved action](/images/posts/loopjacking-a2a-approval-boundary.webp "The protocol can resume the Task; the implementation must check whether the current operation is still the one approved.")

The Agent2Agent protocol, or A2A, matters here because it supports long-lived work that can pause, receive more input, and continue. Those mechanics can carry post-approval state substitution. They do not make A2A intrinsically vulnerable.

Historically, A2A's in-task authorization flow allowed a Task to enter `TASK_STATE_AUTH_REQUIRED`, remain nonterminal, receive another message on the same Task, and continue after a credential became available. Core A2A did not define the human approver, approval artifact, canonical operation, credential scope, or application sink.

An unsafe composition adds implementation-owned approval logic: a same-Task writer can supply B after the human approves A, and the implementation may select that current operation without comparing it with the approved operation.

A2A transports task state and continuation in this model. The implementation defines the approval semantics and decides which operation the approval releases. The path qualifies as Loopjacking only when that implementation consumes A's approval for B.

The public specification history now states this boundary more directly. [A2A issue #2080](https://github.com/a2aproject/A2A/issues/2080) requested clearer in-task authorization scope. [PR #2081](https://github.com/a2aproject/A2A/pull/2081), merged into `main` on July 30, 2026, added section 7.6.4: `TASK_STATE_AUTH_REQUIRED` is a coordination signal rather than an authorization grant, while operation identification and verification belong to the implementation, issuer, or extension.

The same continuation mechanics are safe when the implementation pins A and compares the reconstructed operation at use time. A2A can carry a Loopjacking composition; continuation alone does not create one.

## The cases and their limits

The [Loopjacking paper](https://arxiv.org/abs/2609.21081) and its public [evidence index](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md) document controlled runs through loopback services, synthetic principals, deterministic local components, and harmless recording sinks. The cases were selected to compare different approval paths, not to estimate how common Loopjacking is.

| Product path | Recorded result | Claim boundary |
| --- | --- | --- |
| Agno AgentOS regular-Agent approval | Post-approval substitution reproduced on seven tested releases: 2.5.6, 2.9.0, 3.0.1, 3.0.2, 3.0.3, 3.0.6, and 3.0.9 | Exact tested configuration; no every-patch range or fixed Agno release established |
| LangGraph Agent Server | Post-approval substitution reproduced on 12 sampled in-memory releases ending at 0.14.0 | Conditional on an authorization policy that lets a non-approver update shared pending state; a supported deny-update policy prevented B |
| OpenClaw shell-wrapper approval | Representation mismatch reproduced on 2026.2.23; 2026.2.24 rejected the same mismatch | Affected and fixed product boundary; not post-approval task mutation |
| OpenAI Agents SDK | Same-call-ID mutation rejected on 0.22.0 and 0.22.2 while unchanged A executed | Negative control showing that continuation and serialization alone are insufficient |

The [OpenClaw advisory](https://github.com/openclaw/openclaw/security/advisories/GHSA-6rcp-vxwf-3mfp) illustrates the representation variant cleanly. The approval text could omit positional arguments that execution still consumed. The fix bound approval and display handling to the complete argument context.

The tested product paths show both mismatch mechanisms, while the OpenAI Agents control shows that continuation can preserve exact binding. These results do not establish ecosystem prevalence, a universal affected range, or one severity score for Loopjacking. One researcher operated the recorded runs; independent reproduction is not claimed.

## Where an attacker can intervene

Post-approval substitution needs an attacker-controlled edge between review and execution. Total control of the state store is unnecessary. A narrower capability may be enough:

- writing to a shared task or thread without approval authority;
- sending a supported continuation message;
- updating a pending tool request;
- changing a repository-backed agent configuration after it was trusted;
- influencing an upstream agent whose output is merged into the task;
- supplying arguments that one layer hides but another executes;
- replaying an approval whose scope is broader than the reviewed operation.

A useful threat model separates the principals:

| Actor | Capability | Missing authority |
| --- | --- | --- |
| Proposer or task writer | Can propose A and influence pending state | Cannot approve or directly execute protected B |
| Approver | Can authorize the reviewed operation | Does not intend to authorize B |
| Runtime or executor | Can perform the protected effect | Should release only the approved operation |
| Attacker-controlled input | Can introduce or expose B | Should not inherit the approver's authority |

If the runtime reduces this model to “task approved,” the attacker can target the gap between the container and the operation inside it.

<span id="trace-the-authorization-lineage"></span>

## Follow approval through to execution

![Approval lineage comparing the full request with the human-visible view, then the approved action with the use-time action](/images/posts/loopjacking-approval-lineage.svg "Before approval, the full request must match the human-visible view. At execution, the approved operation must match the current operation; a mismatch stops the request or blocks B.")

Start with the authorization lineage, not the chat transcript. Capture five artifacts for every approval-mediated operation:

1. **Full request:** every security-relevant field before presentation.
2. **Human-visible view:** the exact text, arguments, targets, and modifiers shown to the approver.
3. **Approval binding:** the canonical operation, digest, scope, identity, validity, and lineage stored with the decision.
4. **Use-time operation:** the operation reconstructed after wrappers, reducers, continuation input, retries, delegation, and state reload.
5. **Sink effect:** the exact tool name, command, API request, principal, and side effect that occurred.

Map the transitions from proposal and persistence through presentation, approval, mutation or resume, verification, and execution. For each transition, record the principal that controls it and the security-relevant fields that can change.

A defensible test matrix includes positive and negative controls:

- unchanged A is displayed, approved, and executed;
- denial produces no effect;
- direct B is denied to the attacker;
- the A-to-B mismatch reaches the real product-owned sink;
- the wrong principal, task, thread, or context cannot consume the decision;
- consumed or expired approval cannot be replayed where the product supports those semantics;
- a safe or fixed path rejects B while still allowing unchanged A.

Instrument the sink. A model saying “done” is not execution evidence. A pending-state record containing B is also insufficient if the dispatcher never uses it. The oracle must observe the exact operation and arguments crossing the final enforcement boundary.

## The human-approval boundary

Several neighboring failures can supply B without hijacking a genuine approval for A.

| Neighbor | Why it is different |
| --- | --- |
| Prompt injection or goal hijacking | May cause an agent to choose B, but does not require reuse of approval for A. It can be an input vector into Loopjacking. |
| Agent session smuggling | Injects covert instructions into a stateful agent session; action-specific human approval is not required. |
| Generic misleading dialog | Qualifies only when product-owned representation or binding causes A's approval to release B. Persuading a human to knowingly approve visible B is social engineering. |
| Approval bypass | Skips or forges the gate; it does not hijack a genuine human decision for A. |
| Validation bypass | Avoids a guardrail or validator without consuming human approval. |
| Task ownership bug | Lets the wrong user access or resume a task. It becomes Loopjacking only if the path reuses A's human approval for B. |
| Mutable continuation | Creates an opportunity for mismatch, but a correct use-time comparison keeps it safe. |

Session isolation will not repair an incomplete approval rendering. Strong authentication will not repair stale action binding. Immutable task state may block state substitution while leaving representation mismatch untouched.

## Recheck the operation just before execution

![Five-step defense: canonicalize the action, present it, bind approval, revalidate at use time, then consume and audit](/images/posts/loopjacking-exact-action-binding.webp "Matching A executes. A changed operation B is blocked or sent for fresh approval.")

The approval object must describe the complete executable operation, not merely the task that contains it.

```text
approved_operation = canonicalize(
    operation,
    arguments,
    target_resource,
    requesting_principal,
    acting_agent,
    task_or_thread,
    relevant_execution_context
)

decision = {
    operation_digest: hash(approved_operation),
    approver_identity,
    requesting_principal,
    task_or_thread,
    policy_version,
    scope,
    expires_at,
    nonce
}

current_operation = canonicalize(reconstruct_at_use_time())

if not valid_for(decision, requesting_principal, task_or_thread, policy_version, now):
    reject()

if hash(current_operation) != decision.operation_digest:
    reject_or_request_fresh_approval()

execute_once_with_atomic_approval_consumption(decision, current_operation)
```

For an external effect, approval consumption and dispatch need a shared transaction or idempotency boundary. Flipping a flag before a separate tool call does not, by itself, prevent two workers from using the same approval.

Five rules follow from that design:

1. **Render the complete effect.** Show every material argument, target, delegated capability, privilege, environment modifier, and wrapper-supplied field that execution will consume.
2. **Use one canonical operation model.** Presentation, policy, persistence, continuation, and execution must agree on the same fields and normalization rules.
3. **Revalidate after the last attacker-influenced transformation.** A comparison before reducers, wrappers, retries, or continuation parsing is too early.
4. **Scope and expire the decision.** Bind it to the approver, requester, resource, task lineage, policy version, intended number of uses, and validity window.
5. **Fail closed on mismatch.** Reject the operation or create a fresh approval request instead of adapting an old approval to new state.

Microsoft's public [Action-Bound Approval Protocol](https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/adr/0030-action-bound-approval-protocol.md) describes one design. It specifies a digest of the executable request, authenticated approval-chain data, and a fresh action comparison immediately before execution.

## Questions to ask during a security review

- What exact object does the human approve?
- Is the approval view generated from the same canonical object the executor consumes?
- Which fields can change while the operation is pending?
- Can a non-approver update the same task, thread, checkpoint, or configuration?
- Does continuation reconstruct the action from current state or from an immutable approved snapshot?
- Does the runtime compare the current operation with the approved operation after all transformations?
- Are target, arguments, principal, policy version, task lineage, expiry, and replay semantics part of the binding?
- Can one approval release more than one effect?
- Do logs preserve the human-visible view, canonical operation, decision, mutation history, use-time comparison, and final sink effect?
- Does the safe path still allow unchanged A?

The last question catches a common testing mistake. A defense that blocks every continuation does not demonstrate correct approval binding; it breaks the feature. Keep unchanged A as a positive control so the test proves that the runtime refuses unauthorized change while preserving legitimate resumability.

## Sources and further reading

- [Loopjacking: Hijacking Human-in-the-Loop Approval (arXiv:2609.21081)](https://arxiv.org/abs/2609.21081)
- [Loopjacking research and public evidence archive](https://github.com/adithyan-ak/loopjacking)
- [Loopjacking experiment evidence index](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md)
- [A2A issue #2080: Clarify in-task authorization scope](https://github.com/a2aproject/A2A/issues/2080)
- [A2A PR #2081: Clarify in-task authorization scope semantics](https://github.com/a2aproject/A2A/pull/2081)
- [A2A specification before section 7.6.4](https://github.com/a2aproject/A2A/blob/0ef1b02547e959d770ebf3460d058f5c3421641c/docs/specification.md)
- [OpenClaw GHSA-6rcp-vxwf-3mfp](https://github.com/openclaw/openclaw/security/advisories/GHSA-6rcp-vxwf-3mfp)
- [Microsoft ADR 0030: Action-Bound Approval Protocol](https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/adr/0030-action-bound-approval-protocol.md)

*Public-source status checked September 22, 2026. The research archive's admitted experiment evidence is frozen at its recorded September 10, 2026 cutoff. Product results are configuration- and version-specific; this article makes no prevalence claim.*
