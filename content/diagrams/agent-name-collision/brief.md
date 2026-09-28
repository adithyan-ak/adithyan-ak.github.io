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

1. Routing comparison: name-based lookup versus an origin-bound stable ID selecting the intended endpoint.
2. Implementation patterns: agent-tree lookup, tool identity, client-map replacement, and broker naming collapse.
3. Defense lifecycle: enroll identity, describe with a name, resolve by stable ID, and preserve the binding at dispatch.

The five attack conditions are a checklist in the article: they must hold together and are not sequential steps. The evidence boundary is an HTML table distinguishing demonstrated results from conditional outcomes. There is no separate cover diagram because it duplicated the routing comparison.

## Sources

- Paper: https://arxiv.org/abs/2609.27624
- Research artifacts: https://github.com/adithyan-ak/agent-name-collision-attacks
- Historical A2A specification revision: https://github.com/a2aproject/A2A/commit/98853be376c88df25e1704771cd3ea9ef8823a96
- A2A Agent Card identifier proposal: https://github.com/a2aproject/A2A/issues/1014
- CWE-706: https://cwe.mitre.org/data/definitions/706.html

## Production

The three landscape Mermaid flowcharts reuse the exact `mermaid-config.json` from `content/diagrams/hermes-mnemosyne`, including classic boxes, curved connectors, the monospace font stack, cream background, and muted colors. Each image contains only the flowchart; explanatory prose stays in the article.

Editable sources are the three `agent-name-collision-*.mmd` files. The renderer writes matching SVGs and production PNGs.

Render with `node scripts/render-agent-name-collision.mjs` using Mermaid CLI 11.4.2 and Puppeteer 23. Module paths can be supplied through `MERMAID_CLI_MODULE` and `PUPPETEER_MODULE`; `MERMAID_CHROME` optionally selects the browser executable.
