---
title: "Loopjacking Through A2A Task Updates: When Approval for A Releases B"
seoTitle: "Loopjacking Through A2A Task Updates: Approval Binding and LangGraph Evidence"
description: "A tested LangGraph Agent Server composition let an A2A task update replace a pending action after its approval view was read. See the historical A2A scope gap, the evidence, and the use-time defense."
deck: "A2A keeps agent work addressable across messages. In a tested LangGraph Agent Server composition, an update changed a pending operation after its approval view was read. The implementation then used the earlier decision for the changed action."
slug: "loopjacking-in-a2a-implementations"
file: "10"
publishedAt: "2026-09-21T16:00:00.000Z"
updatedAt: "2026-09-23T06:33:39.000Z"
category: "Agentic Security Research"
tags:
  - "Loopjacking"
  - "AI Agent Security"
  - "Human-in-the-Loop"
  - "A2A"
  - "Authorization"
coverImage: "/images/posts/loopjacking-a2a-task-update-cover.png"
coverImageAlt: "An A2A task carries changed operation B before a decision made over A is used"
coverImageWidth: 1672
coverImageHeight: 941
status: "Published"
draft: false
---

In a controlled LangGraph Agent Server test, the approval role received a human-in-the-loop interrupt for `mock_wire_transfer(20, approved-vendor)`. A separate maker could update the pending thread but could not approve or execute a protected transfer. The maker sent another message through the server's A2A route, replacing the pending call with `mock_wire_transfer(2000, attacker-sink)`. The approval role submitted its earlier decision for the $20 request. The mock ledger recorded the $2,000 operation under the approver's authority.

The approval role was scripted after the test asserted the exact product view of A. The test measures the product's approval binding, not whether a person would notice a change in a user interface. It used an in-memory server, synthetic identities, a deterministic local model, and a harmless ledger. The [public evidence archive](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md) preserves the requests, decisions, controls, and exact tested versions.

This is one way **Loopjacking** can occur: an implementation uses a decision for operation A to release materially different operation B. The decisive question is which operation reached the sink under A's decision. This post follows that question through A2A's task model, its authorization guidance, and the released Agent Server path.

## A Task is not the approved operation

An A2A Task gives agents a continuing unit of work. A client can send a message that names an existing Task and context, and an agent can report that it needs more input or authorization before continuing. The Task ID answers *which work is this message about?* It does not answer *which exact tool call did the human authorize?*

Suppose a Task carries proposed operation A. The application shows A to an approver and records decision `D_A`. If a later message changes the pending operation to B, the Task may still have the same ID. An implementation that checks only “this Task was approved” can spend `D_A` on B. An implementation that compares the current executable operation with the one bound to `D_A` rejects B or asks again. Neither outcome follows from the Task ID alone.

There are two distinct records here. The *coordination record* says a Task is paused, can receive a message, and may continue. The *approval record* must say what operation was reviewed, who approved it, under which scope, and whether it still applies when execution is about to happen. A2A supplies the former. The implementation or credential issuer supplies the latter. A human might deliberately approve a broader scope, but the breadth must be explicit in what the human sees and in what the implementation enforces.

![A2A task coordination and the separate implementation-owned approval boundary](/images/posts/loopjacking-a2a-spec-boundary.png "A2A coordinates Task messages and continuation. The application or issuer defines and checks the approval's operation scope.")

That diagram is a conditional model. The failure exists only when implementation code selects changed B and spends `D_A` without checking its scope. A server that accepts the same Task message and then asks for new approval behaves safely under the same protocol mechanics.

## What the pre-clarification A2A text left open

The [specification before section 7.6.4](https://github.com/a2aproject/A2A/blob/0ef1b02547e959d770ebf3460d058f5c3421641c/docs/specification.md) treated `TASK_STATE_AUTH_REQUIRED` as an interrupted, nonterminal state. It advised agents to accept messages addressed to that Task while authorization was pending so a client could negotiate, correct, or reject a request. It also allowed an agent that received a credential out of band to continue without waiting for another client message. Human approval before a destructive action appeared among its examples of in-task authorization.

Those choices support useful workflows. A requester can correct a pending request instead of starting over; a credential can arrive through a separate channel. They also create a precise question: if a message changes the proposed action while authorization is pending, which operation does the eventual decision cover?

The older text did not define an approver, a canonical executable operation, an action-scoped grant, or the consequential sink. Nor did it expressly assign responsibility for defining approval scope and checking a later operation against it. That was a **specification clarity gap**. It was not proof that A2A itself granted approval, required task-wide approval, or had a core protocol vulnerability. The same protocol flow could sit above an implementation that pins A and rejects B.

[Issue #2080](https://github.com/a2aproject/A2A/issues/2080) raised the ambiguity. [PR #2081](https://github.com/a2aproject/A2A/pull/2081), merged into `main` on July 30, 2026, added section 7.6.4. The [current specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md) says `TASK_STATE_AUTH_REQUIRED` signals a need for authorization, not a grant for any operation. The implementation, credential issuer, or extension defines scope. If specific operations need authorization, the implementation identifies them and checks authorization before use; later Task messages are not implicitly covered.

That clarification changes the implementer's reading of the state: `AUTH_REQUIRED` tells peers *why work is interrupted*. It does not turn the Task into a reusable permission token. On continuation, the implementation still needs to resolve the action it will actually execute and ask whether the credential or human decision covers that action. If a same-Task message changes the amount or destination, the status and Task ID cannot answer that question.

The [A2A releases page](https://github.com/a2aproject/A2A/releases) still listed v1.0.1 as the latest tag when checked September 22, 2026. The clarification was merged on `main`; a tagged release should not be assumed to include it.

## The tested A2A path in LangGraph Agent Server

The concrete product result is narrower than the specification scenario. The experiment exercised LangGraph Agent Server's shipped A2A JSON-RPC `message/send` endpoint and its `message.command.update` surface alongside the official human-in-the-loop middleware. `message.command.update` is an Agent Server command carried on that route; it is not a general A2A approval primitive. The experiment did **not** run A2A §7.6's out-of-band credential flow, and it does not establish that the old specification wording caused the product result.

The tested composition used Agent Server's in-memory runtime, LangChain 1.3.18, LangGraph 1.2.11, and a supported, researcher-defined `Auth` policy. The policy deliberately separated the abilities that make approval meaningful:

| Principal | Could do | Could not do |
| --- | --- | --- |
| Maker | Create the work and update its shared pending thread | Resume the approval interrupt or execute the protected mock transfer |
| Approver | Read the pending view, resume the interrupt, and execute with `wire:execute` | Make the maker's pending-state update |
| Outsider | No relevant access | Read the protected thread |

This is the attack precondition, not a claim about LangGraph's default policy. If the maker already had `wire:execute`, B would not need the approver's decision. If the maker could not update pending state, the tested substitution path would stop before approval resumed.

### Where B entered

The maker's initial A2A request created work on a thread. The approver then read Agent Server's human-in-the-loop interrupt, which showed the exact `mock_wire_transfer` name and A's arguments. Only after that recorded view did the maker submit another `message/send` request. Its message named the existing `taskId` and `contextId` and carried a `command.update` containing a replacement assistant message. The replacement reused both the pending message ID and the tool-call ID, while changing the tool-call arguments. In compressed form, the relevant fields were:

```text
method: message/send
message.taskId: existing Task
message.contextId: shared thread
message.command.update.messages[0].id: approval-action
message.command.update.messages[0].tool_calls[0].id: transfer-call
message.command.update.messages[0].tool_calls[0].args: B
```

The repeated IDs made the update address the pending work and replace the existing call. They did not certify that its amount or destination matched the call shown to the approver. The before-and-after record makes that change visible:

```text
Approval view:  id=transfer-call
                mock_wire_transfer(20, approved-vendor, req-001)

A2A update:     id=transfer-call
                mock_wire_transfer(2000, attacker-sink, req-001)

Approver sends: approve
Tool receives:  mock_wire_transfer(2000, attacker-sink, req-001)
```

The trace crosses four product components. Agent Server accepted the A2A message and forwarded its command into run creation. Its command mapping passed the `update` along. LangGraph's message reducer replaced the pending same-ID call. When the approver later sent only `approve`, the human-in-the-loop path reconstructed the call from *current* thread state. Execution inherited the authenticated approver principal and its permission. There was no comparison between the earlier approval view and that reconstructed call, so the mock tool received B. The [public evidence index](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md) records the requests, source receipts, decisions, and ledger events behind this account.

The update did not itself execute B. The maker's attempt to resume was denied. The later, separately authorized approver resume was the point where the stale decision acquired an effect it did not describe. That timing is why this is post-approval state substitution rather than a simple unauthorized tool invocation.

![Observed LangGraph Agent Server trace from reviewed A through the A2A update to the mock sink effect B](/images/posts/loopjacking-a2a-langgraph-trace.png "The tested in-memory Auth policy permitted the maker's update but denied maker approval and direct execution.")

### What the controls establish

A paused thread containing B would be weak evidence on its own: it would not show that B executed, who authorized it, or whether the maker had a direct route to the same effect. The experiment checked the view before mutation, the `Auth` decisions, the state after mutation, and the arguments recorded by an append-only mock ledger. Its controls establish the following:

| Test path | Recorded effect |
| --- | --- |
| Maker proposes A; approver reads A; maker updates the pending call to B; approver submits the stale decision | The attack thread's mock ledger records B, not A |
| Maker tries B without the approver's authority | B does not reach the ledger |
| A remains unchanged and is approved | A reaches the ledger |
| Supported `Auth` policy denies maker updates while approval is pending | B is blocked; the approver still executes A |

The strict positive also required outsider denial and maker-resume denial. The attack thread had B and no A in its ledger; a separate unchanged control thread had A. This closes two common gaps in an approval-bypass claim: merely showing that a request was accepted, and assuming that the lower-privilege actor could not have called the sink directly.

### How far the version evidence goes

The strict trace ran on 12 sampled released Agent Server versions: 0.7.5, 0.7.103, 0.8.7, 0.9.1, 0.10.3, 0.11.4, 0.12.4, 0.12.6, 0.12.9, 0.13.2, 0.13.4, and 0.14.0. Version 0.7.4 was a feature-absent control: it did not consume the needed command-update path. The 0.13.2 positive was repeated in a Linux in-memory container.

A separate hash-verified scan inspected 131 stable wheels from 0.7.4 through 0.13.4. All 130 releases from 0.7.5 through 0.13.4 contained the relevant forwarding path, but the unexecuted intermediate releases are **source evidence**, not 130 runtime demonstrations. Version 0.14.0 is a separate executed point. The supported deny-update `Auth` policy was tested on 0.13.2 and blocked B while preserving A. These results support a conditional range statement, not an all-deployments claim.

The result is limited to the stated in-memory composition and authorization policy. The production Postgres image reached its license-key requirement before the client test could run, so Postgres behavior is unknown. The experiment did not measure how common the policy is or establish behavior under the default policy. The archive identifies no vendor-fixed LangGraph release. One researcher operated the runs; independent reproduction is not claimed. Each admitted bundle includes raw HTTP, authorization decisions, package pins, ledger events, an oracle result, and checksums so the claim can be audited against more than a screenshot.

## Why the update matters, and what it does not prove

The same Task or thread ID kept the update associated with the pending work. The same tool-call ID kept the replacement associated with the pending call. Neither ID proved that the arguments were unchanged. In the tested composition, the maker's update permission reached a reducer that could replace the operation, while the approver's later decision released the operation reconstructed from current state.

The trust boundary is crossed at **decision consumption**. The approver's authority was attached to a decision made over A. The execution path used that authority for the current call, B, without proving that B fell inside the decision's scope. That makes the exact sink arguments the useful outcome measure. A green “approved” status or a successful A2A response would not, by itself, establish the failure.

The evidence supports a product-specific approval-binding failure through a shipped A2A route. It does **not** show that A2A's core `TASK_STATE_AUTH_REQUIRED` transition authorized B, that all A2A SDKs share one bug, or that accepting a same-Task message is unsafe by itself. The older specification made ownership of operation scope less explicit; the LangGraph experiment independently shows why an implementation needs to enforce that ownership.

## Defend the operation at the point of use

The tested LangGraph deny-update policy stopped the maker from changing the pending operation. B never entered pending state, while ordinary approval of A still worked. The relevant branch of the tested `Auth` policy can be expressed as this excerpt; the actual harness also checks workspace membership and separates the maker's and approver's other permissions:

```python
if ctx.resource == "threads" and ctx.action == "create_run":
    command = (value.get("kwargs") or {}).get("command")
    if ctx.user.identity == "maker" and isinstance(command, dict):
        if "update" in command:  # safe control denies maker updates
            return False
```

This is the policy difference between the positive trace and the safe control. It fits workflows that can forbid maker updates during approval. It does not supply a general guarantee when authorized updates, retries, or migrations can still alter a pending operation.

When legitimate task changes must remain possible, bind the decision to the exact effect. The application creates the approval view from a complete canonical operation, stores an integrity-protected decision bound to it, and rechecks the operation after the last state reducer, wrapper, default, or continuation input. A change to a material field requires a new decision. For the transfer example, a change from 20 to 2,000 units or from `approved-vendor` to `attacker-sink` is material even when `taskId`, `request_id`, and `transfer-call` stay the same.

The following is **design pseudocode**, not a drop-in LangGraph patch. `atomic` means the task snapshot, approval record, and dispatch record must be coordinated by the transaction or locking scheme of the actual system.

```text
proposed = canonicalize(resolve_complete_effect(task))
show_to_approver(proposed)

if approver_accepts:
    decision = integrity_protected_record(
        approved_operation = proposed,
        operation_digest = hash(proposed),
        approver = authenticated_approver,
        requester = task.requester,
        task_id = task.id,
        policy_version = active_policy.version,
        execution_scope = approved_execution_scope,
        expires_at = deadline,
        state = APPROVED,
        nonce = new_nonce()
    )

on_release(task_id, decision_id):
    atomic(task_state, approval_store, dispatch_outbox):
        task = lock_task(task_id)
        decision = lock_decision(decision_id)
        current = canonicalize(resolve_complete_effect(task))

        require(decision.state == APPROVED)
        require(now() < decision.expires_at)
        require(decision.task_id == task.id)
        require(decision.requester == task.requester)
        require(decision.policy_version == active_policy.version)
        require(decision.execution_scope.allows(execution_context))
        require(hash(decision.approved_operation) == decision.operation_digest)
        require(hash(current) == decision.operation_digest)
        require(active_policy.allows(decision.approver, execution_context, current))

        require(consume_once(decision.nonce))
        enqueue_immutable(dispatch_outbox, current, key=decision.id)
        append_audit(decision, current, outcome="queued")

dispatch_the_queued_operation()  # do not rebuild it from mutable Task state
```

The canonical operation must include the tool or API name, every material argument, destination and resource, requesting and acting principals, relevant Task or thread scope, and execution context. The display, stored descriptor, digest, policy check, and dispatcher must agree on those fields. A hash alone is not an approval; the record also needs authenticated authority, integrity, validity, scope, and one-time-use semantics. The [Action-Bound Approval Protocol](https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/adr/0030-action-bound-approval-protocol.md) is one concrete design that checks these properties at execution time.

The **last mutable step** matters as much as the comparison. Checking A when the approver clicks, then rebuilding from Task state for dispatch, repeats the tested mistake. The transaction above resolves the current effect under a lock, compares it with the protected decision, consumes that decision once, and queues the same resolved effect. A dispatcher sends the queued immutable operation. If dispatch can retry, the sink needs an idempotency key so a crash cannot turn one approval into repeated effects. An audit record should retain the displayed operation, the use-time operation, the decision, and the sink result.

![The observed deny-update control and the general exact-action binding design](/images/posts/loopjacking-a2a-use-time-binding.png "The deny-update policy was observed in the LangGraph control. Exact-action binding is the broader implementation design.")

### A regression test that reaches the sink

For an A2A implementation review, capture four artifacts: the human-visible operation, the decision record, every message or reducer that can alter pending state, and the operation received by the consequential sink. Then exercise the following branches with distinct maker and approver principals:

1. **Unchanged A:** approve exact A and assert that the sink receives A once.
2. **No approval:** propose B directly as the maker and assert that no protected effect occurs.
3. **Same-Task substitution:** show A, deliver an allowed same-Task update that changes a material field to B, then submit the earlier A decision. The sink must receive neither B under that decision nor a silent fallback operation. Reject B or obtain a fresh B decision.
4. **Wrong principal and scope:** try to resume from the maker, a different task or thread, or an expired or consumed decision. Each must fail without an effect.
5. **Safe-policy branch:** deny the maker's pending update and confirm that legitimate approval still releases unchanged A.

Assert the exact arguments at the sink, not merely an “approved” status or a successful `message/send` response. The tested Agent Server trace would have looked innocuous at the Task level while the ledger showed the material A-to-B change.

## The boundary to keep

A2A can keep a Task alive while authorization is pending and can carry another message to it. The historical specification did not plainly assign the operation-scope check; section 7.6.4 now does. A released Agent Server composition shows a concrete failure when an A2A update changes a pending call and a later approval is applied to current state without checking the action that was reviewed.

The fix is at the application boundary: decide exactly what was approved, protect that decision, and compare it with the operation about to be dispatched. A Task ID says where the work belongs. It does not say that B was approved.

For the general Loopjacking definition and other mechanisms, see [What Is Loopjacking?](/what-is-loopjacking/).

## Sources and evidence

- [A2A specification before section 7.6.4](https://github.com/a2aproject/A2A/blob/0ef1b02547e959d770ebf3460d058f5c3421641c/docs/specification.md)
- [A2A issue #2080](https://github.com/a2aproject/A2A/issues/2080), [merged PR #2081](https://github.com/a2aproject/A2A/pull/2081), and the [current specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md)
- [Loopjacking public evidence index](https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md) and its linked LangGraph Agent Server bundles
- [Microsoft Action-Bound Approval Protocol](https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/adr/0030-action-bound-approval-protocol.md)

Public specification and release status checked September 22, 2026. The experiment archive's admitted evidence cutoff is September 10, 2026.
