export const selectedSystems = [
  {
    index: "01",
    name: "AgentHound",
    label: "FLAGSHIP / OPEN SOURCE",
    description:
      "AgentHound maps AI agent infrastructure from a foothold and tests which credentials, services, and tools form usable attack paths.",
    meta: ["GO", "MCP", "A2A", "ATTACK-PATH ANALYSIS"],
    href: "https://github.com/adithyan-ak/AgentHound",
  },
  {
    index: "02",
    name: "AgentMask",
    label: "OPEN SOURCE / DEFENSIVE CONTROL",
    description:
      "AgentMask intercepts coding-agent tool calls and returns redacted files before secrets can enter model context.",
    meta: ["TYPESCRIPT", "MCP", "CONTEXT SECURITY"],
    href: "https://github.com/adithyan-ak/AgentMask",
  },
];

export const advisories = [
  {
    id: "GHSA-mcfc-hp25-cjv7",
    project: "HERMES AGENT",
    finding: "UNAUTHENTICATED PLUGIN CODE EXECUTION",
    status: "PUBLIC REPORT",
    href: "https://github.com/NousResearch/hermes-agent/issues/46435",
  },
  {
    id: "GHSA-7x7g-w3q4-fv98",
    project: "PROMPTFOO",
    finding: "SECOND-ORDER TEMPLATE INJECTION TO RCE",
    status: "PUBLIC FIX",
    href: "https://github.com/promptfoo/promptfoo/pull/9693",
  },
  {
    id: "GHSA-f5hv-jrwp-gh59",
    project: "PROMPTFOO",
    finding: "STORED OUTPUT DYNAMIC IMPORT RCE",
    status: "PUBLIC FIX",
    href: "https://github.com/promptfoo/promptfoo/pull/9693",
  },
  {
    id: "GHSA-rxqh-5572-8m77",
    project: "HERMES AGENT",
    finding: "EMAIL GATEWAY AUTHORIZATION BYPASS",
    status: "PUBLIC REPORT",
    href: "https://github.com/NousResearch/hermes-agent/issues/46434",
  },
  {
    id: "CVE-2026-41914",
    project: "OPENCLAW",
    finding: "SERVER-SIDE REQUEST FORGERY",
    status: "CVE / GHSA",
    href: "https://github.com/advisories/GHSA-3fv3-6p2v-gxwj",
  },
  {
    id: "CVE-2025-45691",
    project: "RAGAS",
    finding: "ARBITRARY FILE READ",
    status: "CVE / GHSA",
    href: "https://github.com/advisories/GHSA-v2xr-wvrv-p969",
  },
  {
    id: "CVE-2019-7564",
    project: "COSHIP ROUTER",
    finding: "UNAUTHENTICATED WI-FI PASSWORD RESET",
    status: "NVD RECORD",
    href: "https://nvd.nist.gov/vuln/detail/CVE-2019-7564",
  },
  {
    id: "CVE-2019-6441",
    project: "COSHIP ROUTER",
    finding: "UNAUTHENTICATED ADMIN CREDENTIAL RESET",
    status: "NVD RECORD",
    href: "https://nvd.nist.gov/vuln/detail/CVE-2019-6441",
  },
];

export const experience = [
  {
    period: "2023 TO PRESENT",
    organization: "SALESFORCE",
    role: "SENIOR SECURITY ENGINEER, AI",
    responsibilities: [
      "Lead threat modeling, secure design reviews, and adversarial testing for AI components across the Agentforce ecosystem.",
      "Review MCP and A2A implementations and define safer inter-agent communication patterns across product lines.",
      "Red-team production AI systems across prompt injection, jailbreak, data poisoning, and model-evasion scenarios.",
      "Coordinate remediation for bug-bounty findings and third-party Data Cloud integrations.",
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
    period: "2020 TO 2021",
    organization: "PRIMEFORT",
    role: "OFFENSIVE SECURITY ENGINEER",
    responsibilities: [
      "Executed web, mobile, network, social-engineering, and red-team assessments across more than 20 client engagements.",
      "Built offensive tooling that reduced assessment delivery time by 25 percent.",
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
