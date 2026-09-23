# A2A Loopjacking field note: scope and visual content map

Audience: A2A implementers, agent-platform engineers, and security reviewers.

## Claim boundary

- Historical A2A text let an authorization-pending Task receive same-Task messages and permitted continuation after an out-of-band credential. It did not expressly allocate operation-level approval scope. This was a specification clarity gap, not proof that A2A core granted or misused human approval.
- PR #2081, merged to `main` on July 30, 2026, added section 7.6.4. It calls `TASK_STATE_AUTH_REQUIRED` a coordination signal and assigns operation identification and verification to the implementation, issuer, or extension. The release page still listed v1.0.1 as latest when checked September 22, 2026.
- The native A2A-connected product evidence is the conditional LangGraph Agent Server in-memory composition: a supported custom Auth policy let a maker update shared pending state through the shipped A2A `message.command.update` route but denied the maker approval/resume and wire execution. A separate approver saw A and then resumed without rereading after the update. The released product path executed B at the mock sink. Twelve sampled versions through 0.14.0 were native positives; a deny-update policy on 0.13.2 blocked B and preserved A. No default-deployment, production Postgres, prevalence, or vendor-fixed-release claim follows.
- The LangGraph test is not a runtime test of the specification's §7.6 credential flow, and the historical spec wording is not established as the cause of the LangGraph result.
- Defense: prevent unauthorized mutation where roles permit; bind human approval to the full canonical executable operation and validate current scope, policy, status, expiry, and operation at use time. Queue the exact validated operation rather than rebuilding mutable task state after checking.

## Visuals

1. Cover: the Task carries a changed operation while the human decision remains bound to A. Editorial illustration; schematic, not product UI.
2. Specification boundary: A2A coordination events in one lane; application/issuer approval obligations in a separate lane. No arrow should imply A2A grants approval.
3. LangGraph trace: observed test sequence and control. Label the in-memory Auth-policy prerequisite and mock sink.
4. Defense: the observed deny-update control and the generalized exact-action binding design. Label their distinct evidence status.

## Public sources

- Pre-clarification specification: https://github.com/a2aproject/A2A/blob/0ef1b02547e959d770ebf3460d058f5c3421641c/docs/specification.md
- Clarification: https://github.com/a2aproject/A2A/pull/2081
- Current specification: https://github.com/a2aproject/A2A/blob/main/docs/specification.md
- Release status: https://github.com/a2aproject/A2A/releases
- Product evidence: https://github.com/adithyan-ak/loopjacking/blob/main/EVIDENCE.md
- Implementation design example: https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/adr/0030-action-bound-approval-protocol.md

The text and figures were checked against the current Loopjacking manuscript and admitted LangGraph Agent Server evidence bundles. The local evidence verifier passed with no failures on September 22, 2026 (local time).
