---
title: "Hijacking A2A Tasks with Agent Name Collision Attacks"
seoTitle: "Hijacking A2A Tasks with Agent Name Collision Attacks"
description: "How agent name collisions in A2A systems can divert tasks to the wrong peer, what the research proves, and how stable identities prevent unsafe routing."
deck: "A multi-agent host can admit two distinct peers, then send work intended for the trusted one to the other because it promoted a remote display name into an authority-bearing local identifier."
slug: "agent-name-collision-attacks-multi-agent-systems"
file: "11"
publishedAt: "2026-09-28T16:00:00.000Z"
updatedAt: "2026-09-28T16:00:00.000Z"
category: "Agentic Security Research"
tags:
  - "AI Agent Security"
  - "A2A"
  - "Agent Identity"
  - "Multi-Agent Systems"
  - "Attack Paths"
  - "Agent Name Collision Attacks"
  - "Task Hijacking"
socialImage: "/images/posts/agent-name-collision-routing-comparison.png"
socialImageAlt: "A2A routing comparison: a colliding display name selects the wrong peer, while an origin-bound stable ID preserves the intended endpoint."
socialImageWidth: 1782
socialImageHeight: 586
status: "Published"
draft: false
---

A multi-agent host can accept two distinct agents, preserve both endpoints long enough to discover their cards, and still send work intended for the trusted one to the other. It does not need a forged signing key, a stolen credential, or a broken transport. The failure begins when the host promotes a remote agent's display name into an authority-bearing local identifier.

That is the result of my paper, [Agent Name Collision Attacks in Multi-Agent Systems](https://arxiv.org/abs/2609.27624). The study follows a peer-controlled `AgentCard.name` as it becomes a local selector: an agent lookup, generated tool name, workflow target, client-map key, broker topic, or queue identity. If two admitted peers share that name and the host resolves the ambiguity by order, replacement, or normalization, a later request for the trusted agent can reach the attacker-controlled peer instead.

A collision is easy to overread. It is not automatically a credential-theft bug, a remote enrollment bypass, or a universal A2A exploit. The common result demonstrated in the paper is **wrong-peer dispatch**. Stronger consequences depend on what a deployment attaches after routing and what happens after the wrong peer responds.

The useful review question is not whether a name is duplicated. It is whether a remote card field can change the principal and transport that a host already chose. This field note follows that question from admission to dispatch, then separates the result from stronger claims the experiments do not support.

## The failure is not in the name. It is in the binding.

A host that talks to a remote agent starts with some concrete way to find or admit it: a configured endpoint, a registry entry, an authenticated subject, a workload identity, or a broker principal. That is the security-relevant relationship. The host should preserve it until it dispatches the task.

Agent Cards serve another job. They describe an agent to people and software: a name, a description, skills, interfaces, and capabilities. In the historical A2A revision analysed by the paper, the card's `name` was required and human-readable, but the specification provided neither a stable agent identifier nor collision semantics. That gap makes unsafe designs possible. It does not require implementations to route by name. The [pinned A2A specification revision](https://github.com/a2aproject/A2A/commit/98853be376c88df25e1704771cd3ea9ef8823a96) did not tell an implementation to build `routes[card.name]`.

The failure begins when an implementation does exactly that.

Imagine a host that has already admitted two peers:

- Agent A is the intended `payments` agent at a trusted endpoint.
- Agent B is a lower-trust peer at a different endpoint.
- B publishes or refreshes a card whose display name is also `payments`.

If the host uses the card name as the key for a local lookup, B can silently displace A. A first-match lookup may return B because it appears first. A map may replace A because B registered later. A tool registry may normalize two names to the same identifier. A brokered system may collapse both peers into one topic or queue name.

The instruction “send this task to payments” still looks like it preserves the operator's choice. It does not. The resolver has changed what `payments` means. The user-selected label now points at another principal and transport.

This is the agent-specific form of [CWE-706: use of an incorrectly resolved name or reference](https://cwe.mitre.org/data/definitions/706.html). The problem is not duplicate metadata alone. It is a remote presentation field displacing an enrolled identity at a consequential routing boundary.

> The identity admitted at discovery must remain bound to the transport, workflow target, tool closure, or broker route used at dispatch.

![Unsafe name-derived routing compared with origin-bound stable-ID routing](/images/posts/agent-name-collision-routing-comparison.png "The display name can remain useful to people. It must not choose the principal or endpoint that receives work.")

## When a collision becomes an attack path

A duplicate name is not sufficient on its own. The paper uses a conjunctive model because treating every duplicate as a critical vulnerability would hide the real boundary. All five conditions must hold for a confidentiality or integrity path:

- **Shared routing domain.** A and B share the same host, registry, tool set, workflow namespace, or broker mesh. The collision does not independently enroll B.
- **Control of B's name.** An admitted B can publish or refresh its own card, or has been compromised. The attacker operates inside the admission boundary; this is not an unauthenticated Internet attacker.
- **B wins the collision.** List order, last-write-wins replacement, identifier normalization, or broker binding determines which peer the resolver selects.
- **Use of the ambiguous name.** A caller, workflow, or model later selects that local name. A client that always sends directly to a fixed endpoint has no collision surface here.
- **A consequential trust difference.** Substituting B for A changes who may receive the task or supply its response. If the peers are interchangeable for every routed task, the result may be correctness or availability rather than disclosure or response-integrity loss.

The data structure does not define the weakness. A list, dictionary, generated function tool, graph node, request topic, and queue can all fail the same invariant if an untrusted display field becomes the final selector for another principal.

## Seven paths, four implementation patterns

The research evaluated seven pinned open-source implementation paths across six organisations: Google ADK for Python and TypeScript, UiPath LangChain, BeeAI Framework, Solace Agent Mesh, Mozilla Any-Agent, and AutoDev. This was a purposive corpus, not a prevalence survey. It demonstrates breadth across independently implemented sinks; it does not estimate how many deployed systems are exposed.

The tests used synthetic or loopback peers and recording clients. Trusted A and lower-trust B advertised the same target name. Each test invoked the framework's selected agent or tool and recorded which client or endpoint received the request. The [public research artifact repository](https://github.com/adithyan-ak/agent-name-collision-attacks) contains the manuscript source, pinned source maps, focused reproducer patches, normalized results, and integrity checks.

Six client-style integrations selected B's client or loopback endpoint for a request addressed to A's name. The seventh was brokered: it collapsed A and B onto a name-derived route, while final delivery depended on queue configuration, access controls, and binding state.

![Four implementation patterns that lose the binding between admitted identity and final target](/images/posts/agent-name-collision-implementation-patterns.png "The same vulnerability class appears in agent-tree lookup, tool identity, client maps, and broker routing.")

### Agent-tree ambiguity

Google ADK can retain duplicate local names and return the first matching sub-agent. In the controlled test, the selected client was B's. The paper treats this result carefully: it proves unsafe duplicate resolution and wrong selected-client dispatch, but not that a low-privilege remote agent can necessarily create or refresh the required entry in a deployed Google Cloud project. Direct construction with duplicate local names can also be operator error. The result is a vulnerable routing primitive with conditional attacker reachability, not an end-to-end claim of a remotely exploitable Google ADK zero-day.

### Tool identity collapse

UiPath, BeeAI, and Any-Agent derive tool, handoff, or related identifiers from Agent Card names. The local graph or backend then chooses one duplicate. A model-facing tool name may sound like a convenience layer, but it becomes routing identity when calling it selects a remote endpoint or client closure.

### Client-map replacement

AutoDev and multiple first-party samples fetch cards from configured addresses, then store the connection object under `card.name`. When a later card produces the same key, it can replace both the old card and the transport object. The next lookup resolves to B even though the host originally held a distinct endpoint for A.

### Broker identity collapse

Solace Agent Mesh uses the name across discovery, registry lookup, request topics, and queue identity. The production publish path reached a shared, name-derived route. Whether B receives the message, becomes an active or standby consumer, or instead causes denial of service depends on exclusive versus non-exclusive queue behavior, ACLs, and bind order.

A local stable-ID registry does not solve the problem if the message broker still derives the consequential route from the colliding display name.

## Wrong-peer dispatch is the proven common impact

The paper separates four outcomes that are often merged in vulnerability descriptions:

- **Message diversion:** B receives task material or caller context intended for A and can respond on the selected path.
- **Credential transfer:** A-specific secret material appears at B's request boundary.
- **Authority transfer:** B receives a delegated identity, token, A-owned tool object, or equivalent direct capability.
- **Secondary execution:** B's response later influences a model or policy decision that may invoke a host tool.

Only the first follows directly from client-side routing substitution. That is still material. A diverted request can contain prompts, document fragments, task metadata, conversation state, or caller context. If A and B have different authorization for that information, disclosure has already occurred. If B can answer in place of A, response integrity is already broken.

Across the tested Google ADK Python and TypeScript, BeeAI, Any-Agent, and AutoDev bindings, an A-only synthetic transport credential did not appear at B's request boundary. UiPath exposed a shared host authentication bearer at a managed-proxy client boundary, not an A-specific credential, and downstream delivery to B was not demonstrated. The number of demonstrated direct A-specific credential transfers in those client bindings was zero.

No tested target transferred an A-owned in-process tool object to B or deterministically executed a privileged A or host action solely because of the collision. UiPath and BeeAI did demonstrate two second-stage dataflows: B-controlled output reached a model context where a host-only tool was available, and a scripted model selected that tool. That confirms reachability to another decision point. It is a compound prompt-injection path, not direct authority inheritance, and it does not estimate production-model reliability.

The evidence has different boundaries for each outcome:

| Outcome | What the study establishes |
| --- | --- |
| Wrong-peer dispatch | Demonstrated in six client-style paths: an A-selected request reached B's client or loopback endpoint. |
| Brokered delegated context | Conditional on the deployment attaching useful context and B being able to consume the collided route. |
| Later host-tool action | Two controlled paths reached a model context with a host tool, which a scripted model selected. This does not establish production-model reliability or direct authority inheritance. |
| Direct credential or tool transfer | No direct A-specific credential transfer or transfer of an A-owned in-process tool was demonstrated in the tested client bindings. |

The broker path has a different conditional authority boundary. Its publish path forwards an `a2aUserConfig` object to the name-derived route. That object may contain caller identity, scopes, or delegated tokens. B receives useful authority only if the deployment populated it and B can consume the collided route. The right finding is one conditional delegated-context case, not a universal token leak.

## A protocol gap does not remove implementation responsibility

At the revision examined, A2A had a human-readable card name but no standard stable agent identifier and no collision semantics. That is an identity-semantics gap: interoperable discovery lacks a standard field and rule for the identity that should survive registration, refresh, selection, and dispatch. The open [A2A proposal for a unique Agent Card identifier](https://github.com/a2aproject/A2A/issues/1014) says directly that `agent_card.name` is neither guaranteed unique nor stable under branding changes.

The protocol does not compel a host to discard its endpoint, registry, or authenticated-subject distinction. Safe conforming implementations exist. The affected frameworks own the point where they accept ambiguity and dispatch through it. Deployments separately own admission: who may enter a routing domain, refresh a card, bind a queue, or receive sensitive tasks.

That is why the paper describes a **protocol-enabled implementation vulnerability class**. Calling it only a deployer misconfiguration ignores framework code that silently turns remote text into a security selector. Calling it a universal A2A vulnerability ignores implementations that never make that substitution.

The same discipline applies to related work on malicious Agent Cards, agent impersonation, capability exaggeration, and model steering. This result is narrower and deterministic: two admitted peers collide on a remote display name, a fail-open resolver chooses one, and a request reaches the wrong transport or broker route without requiring a model to select the attacker.

## The fix: names for people, stable IDs for authority

Renaming the attacker fixes one test case. Reversing registration order changes only who wins. Logging a warning while retaining the ambiguous graph does not remove the routing ambiguity.

The durable fix is to preserve the security-relevant identity across the full lifecycle:

1. **Enroll and route by a stable identifier.** Keep the operator- or registry-controlled identifier associated with the configured endpoint. Do not rekey the object after card retrieval.
2. **Bind the identifier to origin.** Associate the ID with a configured endpoint, authenticated registry subject, workload identity, or expected signing key. A self-asserted ID alone can also be copied or replayed.
3. **Keep names presentational.** Names belong in the interface and, where appropriate, model context. Workflow edges, tool registries, authorization checks, and broker routes should resolve through stable ID.
4. **Fail closed on aliases.** If compatibility requires a name-only API, reject exact and normalization-equivalent duplicates. Never silently choose a first, last, or normalized winner. A trusted caller that needs to choose among candidates should disambiguate by stable ID.
5. **Attach authority after identity resolution.** Select credentials and delegated scopes from the authenticated identity and intended destination, not a card-derived name. Refuse or quarantine a refresh that changes the identity bound to an existing record.
6. **Carry identity into the broker.** Topic, queue, consumer, and ACL identity need the stable principal too. An in-memory stable registry does not help if two peers can bind the same name-derived broker route.
7. **Test the invariant.** Register two distinct origins with identical and normalization-equivalent names. Registration must fail clearly, or stable-ID dispatch must remain bound to the intended endpoint regardless of ordering, refresh, or tool-generation behavior.

![Stable identity carried from enrollment through description, resolution, and final dispatch](/images/posts/agent-name-collision-defense-lifecycle.png "The control is complete only when the stable principal reaches the actual endpoint, tool, workflow, topic, queue, or consequential sink.")

The test should inspect the real consequential boundary: the selected client, HTTP endpoint, tool closure, broker topic, queue consumer, or business-action sink. A green “registered” status does not establish correct binding. A successful response does not establish that the intended peer handled the request.

## What to test during a multi-agent review

In an authorised design review, follow one question from admission to execution:

> Which stable identity did the host admit, and can any remote card field change the principal or transport that receives work under that identity?

Then exercise the boring cases that become security cases later:

- Register two disposable, distinct local or loopback peers with the same display name.
- Repeat with case, whitespace, punctuation, Unicode, and other normalization-equivalent variants the implementation accepts.
- Test first registration, last registration, card refresh, registry reload, tool generation, workflow creation, and broker binding.
- Confirm which peer receives the request at the final transport or sink.
- Confirm credentials and delegated context are selected only after the stable destination is resolved.
- Confirm the system rejects ambiguity rather than logging a warning and continuing.

The research itself used recording doubles, harmless counters, synthetic credentials, and loopback peers. That is enough to prove or disprove the routing invariant without probing third-party agents, production accounts, or real user data.

## Agent Cards are not identity systems

Agent ecosystems need discovery metadata. People need names. Models may need readable descriptions and capabilities. None of that disappears when a system adopts stable routing identities.

The problem starts when a host asks a display name to do the work of an identity system.

A remote card name should never decide which principal receives a confidential task, which endpoint receives an authenticated request, which broker route consumes delegated context, or which tool closure receives authority. Keep the admitted identity bound to the dispatch target. Treat names as names. Reject ambiguity before it reaches an execution boundary.

That separation removes the failure measured across the study without making Agent Cards less useful to people.

## Research record

This field note is based on [Agent Name Collision Attacks in Multi-Agent Systems](https://arxiv.org/abs/2609.27624), submitted to arXiv on September 23, 2026, and its [public reproducibility artifacts](https://github.com/adithyan-ak/agent-name-collision-attacks). The experiments concern exact pinned revisions documented in the paper; they are not claims about the present status of every framework or deployment. The paper also relies on the [historical A2A specification revision](https://github.com/a2aproject/A2A/commit/98853be376c88df25e1704771cd3ea9ef8823a96), the related [A2A Agent Card identifier proposal](https://github.com/a2aproject/A2A/issues/1014), and [CWE-706](https://cwe.mitre.org/data/definitions/706.html).
