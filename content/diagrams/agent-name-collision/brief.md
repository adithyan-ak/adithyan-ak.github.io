# Agent Name Collision field note: visual source map

Audience: A2A implementers, multi-agent platform engineers, framework maintainers, and security reviewers.

## Claim boundaries

- The paper evaluates seven pinned open-source implementation paths across six organizations. It is a purposive corpus, not a count of vulnerable deployments.
- Six client-style integrations dispatched an A-selected request to B's client or loopback endpoint. One broker path collapsed peers onto a shared name-derived route; delivery to B depends on queue mode, ACLs, and binding state.
- The demonstrated common impact is wrong-peer dispatch. The tested client bindings did not demonstrate transfer of A-specific credentials or A-owned in-process tools.
- The broker path conditionally forwards caller configuration; whether B receives usable delegated context is deployment-specific.
- Two paths demonstrated a later model-mediated dataflow to a host tool. This is a separate compound decision path, not direct authority inheritance.
- The historical A2A revision analysed by the paper required a human-readable card name but had no stable Agent Card identifier or collision semantics. The protocol did not require implementations to route by card name.
- The findings concern exact pinned revisions and do not claim present-day vulnerability status for every framework or deployment.

## Visuals

1. Cover: a trusted peer and a lower-trust peer converge on the same display name; an unsafe route dispatches to B.
2. Routing comparison: separate unsafe and safe lanes. The safe lane shows an origin-bound stable ID selecting the intended endpoint.
3. Conditions: five prerequisites for a duplicate name to become a confidentiality or integrity path.
4. Implementation shapes: agent-tree lookup, tool identity, client-map replacement, and broker naming collapse.
5. Authority boundary: proven wrong-peer dispatch versus conditional delegated context and non-demonstrated direct credential/tool transfer.
6. Defense lifecycle: enroll identity, describe with a name, resolve by stable ID, and carry the ID to tools, workflows, and broker routes.

## Sources

- Paper: https://arxiv.org/abs/2609.27624
- Research artifacts: https://github.com/adithyan-ak/agent-name-collision-attacks
- Historical A2A specification revision: https://github.com/a2aproject/A2A/commit/98853be376c88df25e1704771cd3ea9ef8823a96
- A2A Agent Card identifier proposal: https://github.com/a2aproject/A2A/issues/1014
- CWE-706: https://cwe.mitre.org/data/definitions/706.html
