export type FieldNote = {
  slug: string;
  index: string;
  title: string;
  deck: string;
  date: string;
  dateLabel: string;
  readTime: string;
  category: string;
  status: "Prototype";
  sections: Array<{
    heading: string;
    paragraphs: string[];
    callout?: string;
  }>;
};

export const fieldNotes: FieldNote[] = [
  {
    slug: "from-prompts-to-privileges",
    index: "01",
    title: "From Prompts to Privileges",
    deck: "Why AI agent security needs attack-path analysis across protocols, tools, credentials, and infrastructure.",
    date: "2026-07-28",
    dateLabel: "28 JUL 2026",
    readTime: "6 MIN",
    category: "AGENTHOUND",
    status: "Prototype",
    sections: [
      {
        heading: "The graph is the system",
        paragraphs: [
          "An agent is rarely a single model behind a prompt box. It is an identity moving through protocols, tools, credentials, runtimes, and approval boundaries. Looking at any one component in isolation hides the paths that matter.",
          "Attack-path analysis treats those components as a connected system. A low-severity configuration issue can become consequential when it sits beside a reusable credential, an exposed tool, or a permissive execution boundary.",
        ],
        callout:
          "The question is not only “what is vulnerable?” It is “what can reach what, with whose authority?”",
      },
      {
        heading: "Evidence before severity",
        paragraphs: [
          "A useful graph must be grounded in observed infrastructure rather than an imagined architecture diagram. Collectors establish what exists. Analysis connects the evidence. Queries explain how an attacker can move.",
          "That separation matters because it keeps the model inspectable. Every derived relationship should be traceable to the raw observations that produced it.",
        ],
      },
      {
        heading: "A living research surface",
        paragraphs: [
          "AgentHound is designed as an offensive security framework for this execution plane. Its purpose is to make agent infrastructure review repeatable: discover the stack, validate exposure, and connect weaknesses into complete paths.",
          "This field note is prototype copy for the portfolio theme. The final article will link methodology, a reproducible lab, and the relevant project release.",
        ],
      },
    ],
  },
  {
    slug: "when-a-url-becomes-a-file-read",
    index: "02",
    title: "When a URL Becomes a File Read",
    deck: "Engineering lessons from unsafe resource handling at the boundary of AI application infrastructure.",
    date: "2026-06-18",
    dateLabel: "18 JUN 2026",
    readTime: "5 MIN",
    category: "CVE-2025-45691",
    status: "Prototype",
    sections: [
      {
        heading: "One input, two trust domains",
        paragraphs: [
          "A parameter that appears to represent a remote resource can quietly cross into local filesystem semantics. Once the implementation accepts both forms without a strict policy boundary, attacker-controlled input can reach data the caller never intended to expose.",
          "The security problem is not the URL parser alone. It is the implicit expansion of authority between network retrieval and local file access.",
        ],
      },
      {
        heading: "Design the boundary first",
        paragraphs: [
          "Resource loaders should make allowed schemes explicit, separate remote and local code paths, and fail closed when the caller has not opted into filesystem access.",
          "Tests should cover alternate encodings, platform-specific paths, redirects, and every transformation between user input and the eventual read operation.",
        ],
        callout:
          "Convenient polymorphism at an input boundary often becomes ambiguous authority at a security boundary.",
      },
    ],
  },
  {
    slug: "ssrf-at-the-agent-boundary",
    index: "03",
    title: "SSRF at the Agent Boundary",
    deck: "What outbound network trust reveals about the authority delegated to agent runtimes.",
    date: "2026-05-30",
    dateLabel: "30 MAY 2026",
    readTime: "4 MIN",
    category: "CVE-2026-41914",
    status: "Prototype",
    sections: [
      {
        heading: "Outbound access is a capability",
        paragraphs: [
          "When an agent runtime can fetch arbitrary locations, the network becomes part of its delegated authority. Internal services, metadata endpoints, and loopback interfaces are no longer merely deployment details.",
          "SSRF defenses therefore belong in the runtime’s capability model—not only in a URL validation helper.",
        ],
      },
      {
        heading: "Constrain, resolve, verify",
        paragraphs: [
          "A robust design combines explicit destinations, DNS and IP validation, redirect re-evaluation, protocol restrictions, and network-layer egress controls.",
          "The important property is continuity: the destination that was approved must remain the destination that is reached.",
        ],
      },
    ],
  },
  {
    slug: "keeping-secrets-outside-model-context",
    index: "04",
    title: "Keeping Secrets Outside Model Context",
    deck: "The architecture behind context-level controls for AI coding agents.",
    date: "2026-04-14",
    dateLabel: "14 APR 2026",
    readTime: "5 MIN",
    category: "AGENTMASK",
    status: "Prototype",
    sections: [
      {
        heading: "Context is an exposure surface",
        paragraphs: [
          "A coding agent often sees far more of a development environment than the task requires. Secrets can enter context through file reads, tool output, terminal commands, or copied configuration.",
          "Redaction after the fact is weaker than controlling the boundary where data enters model-visible context.",
        ],
      },
      {
        heading: "Controls need behavior",
        paragraphs: [
          "Useful isolation combines detection with enforceable behavior: intercept the operation, substitute a safe representation, preserve the developer workflow, and record enough evidence to explain the decision.",
          "The control should degrade predictably when it cannot classify an input. Silent failure is not a security policy.",
        ],
      },
    ],
  },
];

export const selectedSystems = [
  {
    index: "01",
    name: "AgentHound",
    label: "FLAGSHIP / OPEN SOURCE",
    description:
      "Offensive security for AI agent infrastructure. Discover the stack, validate exposure, and connect isolated weaknesses into complete attack paths.",
    meta: ["GO", "MCP", "A2A", "ATTACK-PATH ANALYSIS"],
    href: "https://github.com/adithyan-ak/AgentHound",
  },
  {
    index: "02",
    name: "AgentMask",
    label: "OPEN SOURCE / DEFENSIVE CONTROL",
    description:
      "Context-level secret isolation for AI coding agents, enforced where tools, files, and model context meet.",
    meta: ["TYPESCRIPT", "MCP", "CONTEXT SECURITY"],
    href: "https://github.com/adithyan-ak/AgentMask",
  },
];

export const advisories = [
  {
    id: "CVE-2025-45691",
    project: "RAGAS",
    finding: "ARBITRARY FILE READ",
    status: "PUBLIC",
    href: "https://github.com/advisories/GHSA-v2xr-wvrv-p969",
  },
  {
    id: "CVE-2026-41914",
    project: "OPENCLAW",
    finding: "SERVER-SIDE REQUEST FORGERY",
    status: "PUBLIC",
    href: "https://github.com/advisories/GHSA-3fv3-6p2v-gxwj",
  },
];

export const experience = [
  {
    period: "2023—NOW",
    organization: "SALESFORCE",
    role: "SENIOR SECURITY ENGINEER — AI",
    responsibilities: [
      "Lead threat modeling, secure design reviews, and adversarial testing for AI components across the Agentforce ecosystem.",
      "Review MCP and A2A implementations and define safer inter-agent communication patterns across product lines.",
      "Red-team production AI systems across prompt injection, jailbreak, data poisoning, and model-evasion scenarios.",
      "Drive remediation across bug-bounty findings and third-party Data Cloud integrations.",
    ],
  },
  {
    period: "2022",
    organization: "SALESFORCE",
    role: "SECURITY ENGINEER INTERN",
    responsibilities: [
      "Built an automated threat-modeling framework that reduced security review cycle time by 66 percent.",
      "Supported full-scope cloud red-team engagements that surfaced more than 15 high-severity findings.",
    ],
  },
  {
    period: "2021",
    organization: "MOBILE PREMIER LEAGUE",
    role: "SECURITY ANALYST",
    responsibilities: [
      "Performed iOS, Android, and web penetration testing across an esports platform serving more than 90 million users.",
      "Discovered high-impact abuse paths that prevented an estimated $60M+ in potential financial and revenue loss.",
    ],
  },
  {
    period: "2020—2021",
    organization: "PRIMEFORT",
    role: "OFFENSIVE SECURITY ENGINEER",
    responsibilities: [
      "Executed web, mobile, network, social-engineering, and red-team assessments across more than 20 client engagements.",
      "Built offensive tooling and reusable methodologies that reduced assessment delivery time by 25 percent.",
    ],
  },
];

export const publications = [
  "Reverse Engineering and Backdooring Router Firmwares",
  "LSAF: A Novel Comprehensive Application and Network Security Framework for Linux",
  "Diminishing Popularity of Encoder-Only Architectures in Machine Learning Models",
  "A Comprehensive Approach for Enhancing OSINT through Leveraging LLMs",
];

export const talks = [
  {
    label: "UPCOMING",
    title: "DEF CON 34 Red Team Village",
    meta: "2026",
  },
  {
    label: "TALK",
    title: "Reverse Engineering Router Firmware",
    meta: "DEF CON TRIVANDRUM / 2019",
  },
];

export const capabilities = [
  {
    label: "AGENT SECURITY",
    value: "MCP · A2A · AGENT RED TEAMING · RAG · THREAT MODELING",
  },
  {
    label: "OFFENSIVE",
    value: "RED TEAMING · REVERSE ENGINEERING · EXPLOIT DEVELOPMENT",
  },
  {
    label: "ENGINEERING",
    value: "GO · PYTHON · BASH · JAVASCRIPT",
  },
  {
    label: "INFRASTRUCTURE",
    value: "AWS · GCP · AZURE · DOCKER · KUBERNETES · TERRAFORM",
  },
];
