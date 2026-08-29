---
title: "The Hermes and Mnemosyne Memory Architecture I Trust in Production"
seoTitle: "Optimal Hermes and Mnemosyne Memory Architecture"
description: "A production architecture for Hermes Agent and Mnemosyne with project-isolated recall, verified execution memory, safe writes, and rollback."
deck: "How to combine Hermes Agent and Mnemosyne without transcript pollution, cross-project leaks, duplicate truth stores, or an agent training itself on its own claims."
slug: "optimal-hermes-mnemosyne-memory-architecture"
file: "08"
publishedAt: "2026-08-29T03:10:16.000Z"
updatedAt: "2026-08-29T03:19:40.000Z"
category: "AI Agent Infrastructure"
tags:
  - "Hermes Agent"
  - "Mnemosyne"
  - "AI Agent Memory"
  - "Long-Term Memory"
  - "Agent Architecture"
coverImage: "/images/posts/hermes-mnemosyne-memory-architecture.png"
coverImageAlt: "Blueprint diagram connecting a Hermes helmet to a memory database through a narrow verified-evidence bridge"
coverImageWidth: 1672
coverImageHeight: 941
status: "Published"
draft: false
---

Giving an AI agent long-term memory sounds simple: save conversations, embed them, and retrieve the nearest matches later. That design fails when the agent records a failed command as a solution, leaks context across projects, keeps both sides of a correction, or treats its own confident prose as verified truth.

Hermes Agent and Mnemosyne already have most of the machinery needed to avoid those failures. Hermes has exact session history, tools, lifecycle hooks, skills, profiles, and provider plugins. Mnemosyne provides local SQLite-backed durable memory, hybrid retrieval, canonical facts, provenance, and consolidation. Hermes's provider contract can pass the completed turn, including tool calls and tool results, to `sync_turn(..., messages=...)`.[1] Mnemosyne can run locally in one SQLite database without requiring an external memory service.[4]

The missing piece is ownership. Each system needs a narrow job, and the bridge between them must distrust anything that has not been verified.

> **Deployment note, accurate August 29, 2026:** This is the design behind a running custom `mnemosyne_learning_bridge` provider on Hermes Agent 0.20.5, Python 3.11, `mnemosyne-memory` 3.15.1, and `mnemosyne-hermes` 0.7.0. Before cutover, it passed clean-wheel loading, same-project recall, foreign-project exclusion, mutation-policy, canary-cleanup, SQLite-integrity, and rollback tests. The stock integration remains the simpler option for ordinary personal memory. The custom bridge adds evidence extraction, project isolation, and fail-closed mutation policy.

## The architecture in one diagram

```text
Authoritative policy
  SOUL.md / AGENTS.md / Hermes configuration
                         |
                         v
Hermes Agent
  sessions, tools, tasks, skills, approvals, orchestration
                         |
                         | completed tool trajectory
                         v
Thin learning bridge
  project binding -> evidence extraction -> safety gates -> deduplication
                         |
                         | at most one compact episode
                         v
Mnemosyne
  facts, preferences, corrections, canonical values,
  provenance, project-filtered execution episodes
```

The ownership rules are strict:

| Information | Authoritative home |
| --- | --- |
| Agent behavior and policy | Profile instructions and Hermes configuration |
| Project truth | Repository files, Git, plans, tests, and documentation |
| Exact conversation history | Hermes session database and `session_search` |
| Durable facts and preferences | Mnemosyne |
| Reusable verified experience | Mnemosyne execution episodes |
| Procedures | Hermes skills |
| Commitments and current progress | Task system or project tracker |
| Temporary working notes | Session todo or scratchpad |
| Credentials | Secret manager or environment, never memory |

This separation matters more than the embedding model. A better retriever cannot repair a system that stores the wrong material or assigns authority to the wrong layer.

## Why raw transcript memory is the wrong default

The easiest integration is to save every user and assistant turn. I disabled it.

```bash
hermes config set memory.mnemosyne.sync_roles '[]'
```

Raw transcripts contain setup chatter, abandoned ideas, copied logs, test canaries, prompt injections, stale task state, and sometimes secrets. They are also poor memory units. A 4,000-word debugging turn may contain one useful fact: a particular failure had a particular cause, and one change fixed it.

Hermes already keeps exact session messages in SQLite with FTS5 search.[2] Duplicating those messages in Mnemosyne adds noise without adding evidence. Durable memory should hold compact facts and outcomes. Session history should preserve the full record.

Disabling transcript capture does create one gap. A durable no-tool statement such as:

```text
I now prefer Python over TypeScript for backend services.
```

must not disappear because no tool trajectory occurred. The operating rule is narrow:

```text
Direct durable user assertion or correction
  -> explicit foreground Mnemosyne write
  -> veracity="stated"
  -> canonical or global only when appropriate
  -> immediate read-back
```

This is intentional capture, not transcript ingestion. If the statement is ambiguous, temporary, or inferred, the agent should stage it or omit it.

## Make Mnemosyne the only durable fact store

Running two general-purpose memory stores produces duplicate and eventually contradictory truth. After migration and recall verification, disable Hermes's built-in fact and profile files while keeping the memory toolset enabled:

```bash
hermes config set memory.memory_enabled false
hermes config set memory.user_profile_enabled false
hermes config set memory.mnemosyne.profile_isolation true
```

Do not run this during initial installation without a rollback. The safer sequence is:

1. Back up the existing `MEMORY.md`, `USER.md`, and Mnemosyne database.
2. Move stable one-current-value facts into canonical slots.
3. Move other curated durable facts into ordinary memory.
4. Verify recall from a fresh Hermes process using paraphrased queries.
5. Disable the legacy stores only after the new path works.

Keep the Hermes memory toolset enabled. Mnemosyne's Hermes guide notes that disabling the memory toolset also removes provider tools.[3]

## The bridge should learn from evidence, not prose

Hermes can give a memory provider the full completed turn: user message, assistant tool calls, tool results, and final response.[1] The bridge inspects that trajectory after the turn finishes and creates no more than one episode.

A turn is worth keeping when it contains at least one of these:

- a failure with a discovered cause;
- a fix followed by verification;
- a user correction;
- an architectural decision;
- a reusable constraint;
- a materially verified outcome.

Routine navigation, file listing, status chatter, and unverified success claims are discarded.

A compact episode can use this shape:

```json
{
  "task": "Run the provider acceptance suite",
  "context": "Hermes memory-provider extension on Python 3.11",
  "observation": "The clean-wheel test could not import the entry point",
  "decision": "Declare the provider under hermes_agent.memory_providers",
  "action": "Added the package entry point and rebuilt the wheel",
  "outcome": "The clean environment loaded the provider",
  "verification": {
    "type": "process_exit",
    "command": "pytest -q",
    "exit_code": 0
  },
  "applicability": "Packaged Hermes memory providers",
  "metadata": {
    "project_id": "git:sha256:...",
    "source_session": "...",
    "source_turn": "...",
    "veracity": "tool",
    "verified": true,
    "fingerprint": "sha256:..."
  }
}
```

The bridge may summarize deterministic evidence, but it may not promote its own summary to truth. `verified=true` is allowed only when the trajectory contains evidence such as:

- a process exit status;
- a test assertion or test result;
- an exact file read-back;
- an authoritative API response.

A model saying "the deployment succeeded" is not verification. A subagent saying "all tests pass" is not verification either. The parent must inspect the actual result.

## Project isolation has to survive new sessions

Plain session scope is too narrow for reusable experience. A lesson from today's repository should help tomorrow's session in the same repository. Global scope without filtering is too broad because it can inject one project's commands and assumptions into another.

The workable design is:

```text
Reusable execution episode
  -> global storage
  -> mandatory normalized project_id metadata
  -> project-aware filtering on explicit recall
  -> project-aware filtering on silent prefetch
```

The project identity must come from trusted initialization context, not from model-controlled tool arguments. For a Git repository, a stable identifier can be derived from the exact remote identity:

```python
from hashlib import sha256


def project_id(remote_bytes: bytes) -> str:
    digest = sha256(b"git-remote\0" + remote_bytes).hexdigest()
    return f"git:sha256:{digest}"
```

Bind it once when the provider initializes. Do not rebind the active project because a later shell command happens to contain another path. If no trusted project root or repository identity exists, leave the session unbound and skip project episode creation.

Every retrieval path must enforce the same filter. Protecting silent prefetch while leaving explicit recall unfiltered still leaks memories. Filtering only the first line of a multiline result still leaks memories. The tests need same-project recall and foreign-project exclusion for both paths.

Ordinary user facts are different. A communication preference may be globally relevant and should remain recallable across projects. Project filtering applies to execution episodes, not every global memory.

## Corrections need replacement semantics

Append-only memory fails when facts change. If a user corrects a consulate preference, project milestone, dependency version, or deployment state, the old value should not remain equally current.

Use canonical slots for facts that should have exactly one live value:

```text
preference.communication
professional.active_project
professional.current_milestone
```

Keep values that change at different rates in different slots. Updating a milestone should not rewrite the identity of the project itself.

A correction flow should:

1. Read the current target.
2. Confirm the user's exact correction.
3. Write the replacement with `veracity="stated"` and provenance.
4. Supersede or invalidate the old current value.
5. Read the new value back.

Do not append a contradictory memory and hope vector ranking chooses the newer one.

## Durable mutation must fail closed

A generic "write approval" switch is unsafe if it covers `remember` but misses canonical updates, invalidation, deletion, triples, shared memory, or pending-write application. Inventory every mutation route before claiming approval coverage.

The policy I use is:

| Mutation | Default policy |
| --- | --- |
| Raw conversation autosave | Disabled |
| Verified project episode | Automatic after evidence, secret, scope, and dedup gates |
| Direct durable user fact | Foreground write with read-back |
| Inferred global or canonical fact | Stage |
| Canonical supersession | Exact foreground request or stage |
| Update, invalidate, or forget | Read target first; exact foreground approval |
| Shared-memory write | Disabled |
| Skill modification | Report and staged diff only |
| Secret-bearing content | Reject |

Pending approvals should be owner-only, content-addressed, expiring, and single-use. The approval command should bind to an exact ID:

```text
APPLY <pending_id>
REJECT <pending_id>
```

The apply path must rerun validation and read the target back. Approval should not bypass the checks that staged the mutation.

## Block recursive memory and skill corruption

An agent creates a feedback loop when it stores recalled memory, summarizes the copy, and later treats the result as independent evidence. The bridge must reject:

- injected memory blocks;
- system prompts;
- full assistant prose;
- private reasoning;
- raw logs;
- pending approval payloads;
- memory tool output being stored as a new episode.

Apply the same boundary to skill learning:

```text
Verified episodes
  -> bounded read-only evidence set
  -> report and suggested diff
  -> human approval
  -> skill change
```

One successful episode should not rewrite a procedure. For ordinary procedures, require at least two independent verified episodes or an explicit user request. Use a higher threshold for security-sensitive workflows. Hub, external, manually maintained, and pinned skills should never be changed autonomously.

## Retrieval should be conservative by default

Because silent prefetch changes model context without showing a search step, it needs stricter thresholds than explicit recall.

A practical policy is:

- require more than one distinctive lexical signal;
- combine lexical and semantic relevance;
- cap the number and size of injected memories;
- filter project episodes before ranking or rendering them;
- use explicit recall for broad or indirect questions;
- let fresh files, Git, tests, APIs, and task systems override recalled state.

Do not lower global thresholds because one oddly worded query missed. Add a truthful retrieval alias to the relevant fact or use explicit recall.

## Leave consolidation off until the data justifies it

Mnemosyne can consolidate working memories into episodic memory, but automatic consolidation is not automatically an improvement. Early in a deployment, there may be too little real data to measure whether summarization helps or erases useful distinctions.

```bash
hermes config set memory.mnemosyne.auto_sleep false
```

Enable it only after a representative benchmark measures:

- top-1 and top-5 recall;
- unrelated injection rate;
- cross-project leakage;
- duplicate and stale-memory rates;
- correction and supersession behavior;
- the languages users actually write in;
- average injected characters.

Changing the embedding model should be a separate backed-up reindex project, not an incidental tuning step.

## Back up the database as a database

Copying a live SQLite file can miss WAL state. Use SQLite's online backup API, then restore the result into a temporary location and run both integrity checks:

```python
import sqlite3

source = sqlite3.connect("file:mnemosyne.db?mode=ro", uri=True)
destination = sqlite3.connect("mnemosyne-backup.db")
source.backup(destination)

assert destination.execute("PRAGMA quick_check").fetchone()[0] == "ok"
assert destination.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
```

A minimal recovery package should contain:

- the compressed database backup;
- the memory-related configuration only;
- the profile policy file;
- the bridge source commit and wheel checksum;
- dependency versions;
- restore instructions.

Exclude `.env`, authentication files, tokens, transcripts, logs, and caches. Run the backup as a script-only scheduled job. An LLM does not need to spend tokens copying a database.

## Acceptance tests that catch real failures

An installation is not complete when imports succeed. I treated this architecture as production-ready only after these tests passed:

1. Store a non-sensitive canary and recall it from a fresh process using a paraphrase.
2. Delete the canary and verify that working, episodic, FTS, and vector references are gone.
3. Recall one execution episode from a new session in the same project.
4. Prove that another project cannot retrieve or prefetch it.
5. Confirm that an LLM-only success claim remains `verified=false`.
6. Replay the same turn and confirm that the fingerprint prevents a duplicate.
7. Put secret-like material in a fixture and confirm it is absent from the database, logs, export, and pending files.
8. Force provider initialization failure in a disposable profile and require a visible fail-closed error.
9. Restart the real runtime and read back the active provider and database path.
10. Restore a backup, run integrity checks, and execute representative recalls.
11. Roll back to the base Mnemosyne provider without deleting bridge-created episodes.

The hard bugs tend to appear around boundaries: project identity, retries, multiline filtering, pending approvals, cleanup, and rollback. Unit tests for `remember()` alone will not find them.

## Baseline setup versus the hardened design

If you only need personal preferences across a few chats, the standard Hermes and Mnemosyne integration may be enough. Follow the current Mnemosyne integration guide rather than copying old version pins.[3]

The hardened bridge is justified when the agent:

- works across multiple repositories;
- executes commands and edits files;
- needs to reuse verified debugging or deployment experience;
- runs unattended workflows;
- handles mutable canonical facts;
- can propose skill changes;
- operates where a cross-project leak would be costly.

Keep the bridge thin. Hermes already provides the provider lifecycle and the completed tool trajectory.[1] Mnemosyne already provides durable storage and retrieval.[4] The bridge should only bind trusted project identity, extract deterministic evidence, enforce policy, and emit one safe episode.

That is the useful synergy: Hermes knows what happened, Mnemosyne remembers what matters, and neither system gets to invent the proof.

## Sources

[1] [Hermes Memory Provider Plugins](https://hermes-agent.nousresearch.com/docs/developer-guide/memory-provider-plugin)
[2] [Hermes Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)
[3] [Using Mnemosyne with Hermes](https://docs.mnemosyne.site/integration/hermes)
[4] [Mnemosyne GitHub Repository](https://github.com/mnemosyne-oss/mnemosyne)
