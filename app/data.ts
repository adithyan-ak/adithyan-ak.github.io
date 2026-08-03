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
