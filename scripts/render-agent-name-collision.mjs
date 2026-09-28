import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const out = path.join(root, "public", "images", "posts");
const source = path.join(root, "content", "diagrams", "agent-name-collision");
await mkdir(out, { recursive: true });

const C = {
  bg: "#0d0c0a", panel: "#1b1814", panel2: "#242019", cream: "#f2eadc",
  muted: "#b5ab9f", dim: "#6b655e", red: "#df6550", gold: "#e4bf52",
  cyan: "#71b7c5", green: "#9fc5a7", rule: "#51493c",
};
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const rect = (x, y, w, h, fill, stroke = "none", sw = 0, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const line = (x1, y1, x2, y2, color = C.cream, sw = 2, extra = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" ${extra}/>`;
const txt = (x, y, value, size, color = C.cream, kind = "mono", anchor = "start") => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" class="${kind}" text-anchor="${anchor}">${esc(value)}</text>`;
const mono = (x, y, value, size = 22, color = C.cream, anchor = "start") => txt(x, y, value, size, color, "mono", anchor);
const display = (x, y, value, size = 76, color = C.cream, anchor = "start") => txt(x, y, value, size, color, "display", anchor);
const arrow = (x1, x2, y, color = C.cream) => `${line(x1, y, x2 - 16, y, color, 4)}<polygon points="${x2},${y} ${x2 - 16},${y - 9} ${x2 - 16},${y + 9}" fill="${color}"/>`;
function texture(w, h, seed) {
  let v = seed >>> 0; let dots = "";
  for (let i = 0; i < Math.round((w * h) / 2400); i += 1) {
    v = (v * 1664525 + 1013904223) >>> 0; const x = v % w;
    v = (v * 1664525 + 1013904223) >>> 0; const y = v % h;
    dots += `<circle cx="${x}" cy="${y}" r=".65" fill="${C.cream}" opacity=".055"/>`;
  }
  return dots;
}
function svg(w, h, seed, content) {
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>.display{font-family:Impact,"DIN Condensed",sans-serif;font-weight:900;letter-spacing:1px}.mono{font-family:Menlo,Monaco,monospace;font-weight:600;letter-spacing:1px}</style>${rect(0, 0, w, h, C.bg)}${texture(w, h, seed)}${content.join("")}</svg>`;
}
function header(s, index, title, kicker) {
  s.push(mono(70, 58, `${index} / ${kicker}`, 21, C.red));
  s.push(display(70, 145, title, 72));
  s.push(line(70, 172, 1530, 172, C.dim, 2));
}
function box(s, x, y, w, h, title, note, color = C.cream, fill = C.panel) {
  s.push(rect(x, y, w, h, fill, color, 3));
  s.push(mono(x + 20, y + 41, title, 24, color));
  s.push(line(x + 20, y + 58, x + w - 20, y + 58, C.dim, 2));
  s.push(mono(x + 20, y + 96, note, 20, C.muted));
}
function cover() {
  const s = []; header(s, "FN-11", "A NAME IS NOT", "AGENTIC SECURITY RESEARCH");
  s.push(display(70, 230, "AN IDENTITY SYSTEM.", 77, C.red));
  s.push(mono(72, 274, "TWO ADMITTED PEERS. ONE DISPLAY NAME. THE WRONG ROUTE.", 22, C.muted));
  box(s, 72, 349, 340, 155, "TRUSTED A", "origin / endpoint A", C.cream, C.panel);
  box(s, 72, 585, 340, 155, "LOWER-TRUST B", "also claims: payments", C.red, "#281a17");
  box(s, 600, 458, 410, 160, "routes[payments]", "first / last / normalized winner", C.gold, "#211c14");
  box(s, 1190, 458, 338, 160, "DISPATCH TO B", "wrong peer", C.red, "#281a17");
  s.push(arrow(412, 572, 426, C.gold)); s.push(arrow(412, 572, 662, C.red)); s.push(arrow(1010, 1163, 538, C.red));
  s.push(line(72, 796, 1528, 796, C.rule, 2));
  s.push(mono(72, 846, "THE FAILURE: REMOTE PRESENTATION METADATA SELECTS A SECURITY PRINCIPAL.", 22, C.cream));
  s.push(mono(72, 883, "THE CONTROL: KEEP THE ENROLLED, ORIGIN-BOUND ID ATTACHED TO THE DISPATCH TARGET.", 20, C.muted));
  return svg(1600, 940, 211, s);
}
function routing() {
  const s = []; header(s, "01", "ONE COLLISION.", "ROUTING COMPARISON"); s.push(display(70, 224, "TWO VERY DIFFERENT ROUTES.", 67, C.red));
  s.push(rect(70, 281, 1460, 226, "#1d1710", "#735d28", 3)); s.push(mono(100, 322, "UNSAFE / DISPLAY NAME SELECTS THE ROUTE", 22, C.gold));
  box(s, 100, 359, 272, 104, "TRUSTED A", "endpoint A", C.cream); box(s, 595, 359, 360, 104, "NAME RESOLVER", "first / last / normalized", C.gold, "#211c14"); box(s, 1178, 359, 280, 104, "DISPATCH B", "wrong peer", C.red, "#281a17");
  s.push(arrow(372, 554, 410, C.gold)); s.push(arrow(955, 1137, 410, C.red)); s.push(mono(100, 490, "B publishes the same display name and wins the local ambiguous lookup.", 19, C.muted));
  s.push(rect(70, 573, 1460, 226, "#111a1b", "#44767d", 3)); s.push(mono(100, 614, "SAFE / ORIGIN-BOUND ID SELECTS THE ROUTE", 22, C.cyan));
  box(s, 100, 651, 272, 104, "TRUSTED A", "endpoint A", C.cream); box(s, 595, 651, 360, 104, "STABLE ID", "agent:8f2c… bound to A", C.cyan, "#142124"); box(s, 1178, 651, 280, 104, "DISPATCH A", "intended peer", C.green, "#15231b");
  s.push(arrow(372, 554, 702, C.cyan)); s.push(arrow(955, 1137, 702, C.cyan)); s.push(mono(100, 782, "B can still use the label payments; it cannot change the selected transport.", 19, C.muted));
  s.push(mono(70, 868, "NAMES ARE FOR PEOPLE AND PRESENTATION. ENROLLED IDENTITY IS FOR ROUTING AND AUTHORITY.", 20, C.muted));
  return svg(1600, 920, 223, s);
}
function conditions() {
  const s = []; header(s, "02", "A DUPLICATE NAME", "THREAT MODEL"); s.push(display(70, 224, "IS NOT THE WHOLE ATTACK PATH.", 61, C.red));
  const items = [
    ["01", ["SHARED", "DOMAIN"], "A and B share a host, registry, tool set, workflow, or broker namespace."],
    ["02", ["NAME", "CONTROL"], "B can publish or refresh its own card, or an admitted B has been compromised."],
    ["03", ["COLLISION", "PRECEDENCE"], "B wins through order, replacement, normalization, or binding state."],
    ["04", ["NAME-DERIVED", "USE"], "A caller, workflow, or model later selects the ambiguous local name."],
    ["05", ["TRUST", "DIFFERENCE"], "A carries data or authority that B is not otherwise allowed to receive."],
  ];
  items.forEach((item, i) => { const x = 70 + i * 295; s.push(rect(x, 314, 260, 426, C.panel, C.rule, 3)); s.push(mono(x + 20, 360, item[0], 21, C.gold)); s.push(line(x + 20, 381, x + 240, 381, C.dim, 2)); s.push(display(x + 20, 438, item[1][0], 29)); s.push(display(x + 20, 479, item[1][1], 29)); const words = item[2].match(/.{1,27}(?:\s|$)/g) ?? [item[2]]; words.forEach((row, j) => s.push(mono(x + 20, 564 + j * 34, row.trim(), 18, C.muted))); });
  s.push(mono(70, 837, "REMOVE ANY ONE CONDITION AND THE NAME DUPLICATE MAY BE HARMLESS, UNREACHABLE, OR LOW IMPACT.", 20, C.muted));
  return svg(1600, 890, 227, s);
}
function patterns() {
  const s = []; header(s, "03", "ONE BROKEN INVARIANT.", "IMPLEMENTATION PATTERNS"); s.push(display(70, 224, "FOUR IMPLEMENTATION SHAPES.", 67, C.red));
  const cards = [
    [70, 305, "A→?", "AGENT-TREE AMBIGUITY", "Duplicate local names resolve to the first matching sub-agent."],
    [815, 305, "ƒ()", "TOOL IDENTITY COLLAPSE", "Card names become tool or handoff selectors; one duplicate wins."],
    [70, 584, "{ }", "CLIENT-MAP REPLACEMENT", "A later card overwrites a connection object stored under the same name."],
    [815, 584, "◉", "BROKER IDENTITY COLLAPSE", "The same name becomes a topic, queue, or consumer identity."],
  ];
  cards.forEach(([x, y, icon, title, note]) => { s.push(rect(x, y, 715, 220, C.panel, C.rule, 3)); s.push(display(x + 26, y + 88, icon, 58, C.gold)); s.push(mono(x + 168, y + 58, title, 24, C.cream)); s.push(line(x + 168, y + 78, x + 680, y + 78, C.dim, 2)); const rows = note.match(/.{1,49}(?:\s|$)/g) ?? [note]; rows.forEach((row, j) => s.push(mono(x + 168, y + 124 + j * 30, row.trim(), 19, C.muted))); });
  s.push(mono(70, 858, "THE DATA STRUCTURE IS INCIDENTAL. THE FAILING BINDING IS FROM ADMITTED IDENTITY TO FINAL TARGET.", 20, C.muted));
  return svg(1600, 910, 229, s);
}
function impact() {
  const s = []; header(s, "04", "WHAT THE RESULTS", "AUTHORITY BOUNDARY"); s.push(display(70, 224, "PROVE — AND DO NOT PROVE.", 67, C.red));
  const rows = [
    ["PROVEN COMMON RESULT", "WRONG-PEER DISPATCH", "Six client-style paths selected B’s client or loopback endpoint for an A-selected request.", C.gold],
    ["CONDITIONAL", "DELEGATED CONTEXT AT A BROKER", "Only if deployment configuration attaches it and B can consume the collided route.", C.cyan],
    ["NOT SHOWN AS DIRECT TRANSFER", "A-SPECIFIC CREDENTIALS OR A-OWNED TOOLS", "Not transferred in the tested client bindings; later model decisions are separate compound paths.", C.red],
  ];
  rows.forEach((row, i) => { const y = 312 + i * 169; s.push(rect(70, y, 1460, 130, C.panel, row[3], 3)); s.push(rect(70, y, 345, 130, "#201d18", row[3], 0)); s.push(mono(95, y + 47, row[0], 18, row[3])); s.push(mono(447, y + 49, row[1], 25, C.cream)); const lines = row[2].match(/.{1,82}(?:\s|$)/g) ?? [row[2]]; lines.forEach((lineItem, j) => s.push(mono(447, y + 86 + j * 26, lineItem.trim(), 18, C.muted))); });
  s.push(mono(70, 856, "SCORE THE CONCRETE DEPLOYMENT PATH. DO NOT ASSIGN ONE ABSTRACT SEVERITY TO EVERY NAME COLLISION.", 20, C.muted));
  return svg(1600, 910, 233, s);
}
function defense() {
  const s = []; header(s, "05", "CARRY IDENTITY", "DEFENSE LIFECYCLE"); s.push(display(70, 224, "ALL THE WAY TO THE SINK.", 67, C.red));
  const steps = [
    ["01", "ENROLL", "Bind a stable ID to a trusted origin or authenticated subject."],
    ["02", "DESCRIBE", "Keep display names useful, but presentational."],
    ["03", "RESOLVE", "Select endpoint and authority by stable ID."],
    ["04", "DISPATCH", "Carry that same ID into tools, workflows, topics, and queues."],
  ];
  steps.forEach((step, i) => { const x = 70 + i * 370; s.push(rect(x, 346, 315, 318, "#142124", C.cyan, 3)); s.push(mono(x + 20, 389, step[0], 20, C.cyan)); s.push(display(x + 20, 475, step[1], 43)); s.push(line(x + 20, 497, x + 295, 497, C.dim, 2)); const rows = step[2].match(/.{1,28}(?:\s|$)/g) ?? [step[2]]; rows.forEach((row, j) => s.push(mono(x + 20, 549 + j * 31, row.trim(), 18, C.muted))); if (i < 3) s.push(arrow(x + 315, x + 355, 505, C.cyan)); });
  s.push(rect(70, 728, 1460, 83, "#1d1710", C.gold, 3)); s.push(mono(97, 779, "FAIL CLOSED ON EXACT AND NORMALIZATION-EQUIVALENT ALIASES. A WARNING IS NOT A SECURITY CONTROL.", 20, C.gold));
  s.push(mono(70, 865, "TEST THE FINAL CONSEQUENTAL BOUNDARY: CLIENT, ENDPOINT, TOOL CLOSURE, BROKER ROUTE, OR BUSINESS-ACTION SINK.", 20, C.muted));
  return svg(1600, 910, 239, s);
}

const assets = [
  ["agent-name-collision-attacks-cover.png", cover()],
  ["agent-name-collision-routing-comparison.png", routing()],
  ["agent-name-collision-attack-conditions.png", conditions()],
  ["agent-name-collision-implementation-patterns.png", patterns()],
  ["agent-name-collision-authority-boundary.png", impact()],
  ["agent-name-collision-defense-lifecycle.png", defense()],
];
for (const [name, markup] of assets) {
  await writeFile(path.join(source, name.replace(/\.png$/u, ".svg")), markup);
  await sharp(Buffer.from(markup)).png({ compressionLevel: 9 }).toFile(path.join(out, name));
  const meta = await sharp(path.join(out, name)).metadata();
  console.log(`${name}: ${meta.width}x${meta.height}`);
}
