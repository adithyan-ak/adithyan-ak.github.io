import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Factual content map: content/diagrams/loopjacking-a2a-case/brief.md.
// These diagrams distinguish A2A coordination, a conditional model, an observed
// LangGraph Agent Server trace, and controls. They are not product screenshots.

const root = process.cwd();
const source = path.join(root, "content/diagrams/loopjacking-a2a-case");
const output = path.join(root, "public/images/posts");
const C = {
  bg: "#0b0b0b", panel: "#191816", panel2: "#23201c",
  cream: "#f2eadc", muted: "#b4aaa0", dim: "#6b655e",
  red: "#e44839", gold: "#ddb46b", green: "#b7c9ac",
};

function esc(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function rect(x,y,w,h,fill,stroke="none",sw=0,extra="") {
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" '+extra+'/>';
}
function line(x1,y1,x2,y2,color=C.cream,sw=2,extra="") {
  return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+sw+'" '+extra+'/>';
}
function txt(x,y,s,size,color=C.cream,kind="mono",anchor="start") {
  return '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'" class="'+kind+'" text-anchor="'+anchor+'">'+esc(s)+'</text>';
}
function mono(x,y,s,size=22,color=C.cream,anchor="start") { return txt(x,y,s,size,color,"mono",anchor); }
function big(x,y,s,size=80,color=C.cream,anchor="start") { return txt(x,y,s,size,color,"display",anchor); }
function arrow(x1,x2,y,color=C.cream) {
  return line(x1,y,x2-14,y,color,4)+
    '<polygon points="'+x2+','+y+' '+(x2-15)+','+(y-8)+' '+(x2-15)+','+(y+8)+'" fill="'+color+'"/>';
}
function downArrow(x,y1,y2,color=C.cream) {
  return line(x,y1,x,y2-12,color,3)+
    '<polygon points="'+x+','+y2+' '+(x-8)+','+(y2-13)+' '+(x+8)+','+(y2-13)+'" fill="'+color+'"/>';
}
function texture(w,h,seed) {
  let v=seed>>>0, s="";
  for(let i=0;i<Math.round(w*h/1500);i++){
    v=(v*1664525+1013904223)>>>0; const x=v%w;
    v=(v*1664525+1013904223)>>>0; const y=v%h;
    s+='<circle cx="'+x+'" cy="'+y+'" r=".7" fill="'+C.cream+'" opacity=".07"/>';
  }
  return s;
}
function svg(w,h,seed,body) {
  return '<?xml version="1.0" encoding="UTF-8"?>'+
    '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+
    '<style>.display{font-family:Impact,"DIN Condensed",sans-serif;font-weight:900;letter-spacing:1px}.mono{font-family:Menlo,Monaco,monospace;font-weight:600;letter-spacing:1px}</style>'+
    rect(0,0,w,h,C.bg)+texture(w,h,seed)+body.join("")+'</svg>';
}
function panel(x,y,w,h,stroke=C.cream,fill=C.panel) {
  return rect(x,y,w,h,fill,stroke,3);
}

function specBoundary() {
  const w=1600,h=900,s=[];
  s.push(mono(72,59,"01 / THE SPECIFICATION BOUNDARY",22,C.red));
  s.push(big(70,147,"A2A MOVES TASK STATE.",86));
  s.push(big(70,224,"THE APP DEFINES APPROVAL.",77,C.red));
  s.push(line(72,247,1528,247,C.dim,2));
  s.push(panel(72,276,1456,238));
  s.push(mono(104,316,"A2A / COORDINATION",26));
  s.push(mono(1494,316,"NO OPERATION GRANT",25,C.muted,"end"));
  s.push(line(104,337,1494,337,C.dim,2));
  const top=[
    {x:104,title:"AUTH REQUIRED",note:"nonterminal Task"},
    {x:580,title:"MESSAGE ON TASK",note:"new input may arrive"},
    {x:1056,title:"CONTINUE",note:"credential may arrive"},
  ];
  for(const q of top){
    s.push(panel(q.x,359,438,129,C.cream,C.bg));
    s.push(big(q.x+20,417,q.title,q.title.length>14?38:43));
    s.push(mono(q.x+20,461,q.note,26,C.muted));
  }
  s.push(arrow(547,573,424)); s.push(arrow(1023,1049,424));
  s.push(line(72,551,1528,551,C.red,3,'stroke-dasharray="13 11"'));
  s.push(rect(96,530,426,39,C.bg));
  s.push(mono(104,558,"APPLICATION SECURITY BOUNDARY",23,C.red));
  s.push(panel(72,592,1456,232,C.gold,C.panel2));
  s.push(mono(104,633,"IMPLEMENTATION OR CREDENTIAL ISSUER / APPROVAL SEMANTICS",25));
  s.push(line(104,653,1494,653,C.dim,2));
  const low=[
    {x:104,title:"SHOW EXACT A",note:"tool · args · target",c:C.cream},
    {x:580,title:"BIND DECISION",note:"scope and validity",c:C.gold},
    {x:1056,title:"CHECK AT USE",note:"current operation vs A",c:C.green},
  ];
  for(const q of low){
    s.push(panel(q.x,675,438,122,q.c,C.bg));
    s.push(big(q.x+20,727,q.title,40,q.c));
    s.push(mono(q.x+20,771,q.note,25,C.muted));
  }
  s.push(arrow(547,573,736,C.gold)); s.push(arrow(1023,1049,736,C.gold));
  s.push(mono(72,866,"SECTION 7.6.4 MAKES THE LOWER-LANE RESPONSIBILITY EXPLICIT.",21,C.muted));
  s.push(mono(1528,866,"CONDITIONAL MODEL / NOT PRODUCT UI",18,C.dim,"end"));
  return svg(w,h,71,s);
}

function caseCard(x,title,mark,details,note,color) {
  const s=[];
  s.push(panel(x,381,314,382,color,C.panel2));
  s.push(mono(x+20,420,title,22,color));
  s.push(line(x+20,442,x+294,442,C.dim,2));
  s.push(big(x+157,563,mark,mark.length>4?68:108,color,"middle"));
  s.push(line(x+20,585,x+294,585,C.dim,2));
  s.push(mono(x+20,629,details[0],24));
  s.push(mono(x+20,660,details[1],24));
  s.push(mono(x+20,730,note,21,C.muted));
  return s.join("");
}
function caseTrace() {
  const w=1600,h=1000,s=[];
  s.push(mono(72,60,"02 / RELEASED PRODUCT TRACE",22,C.red));
  s.push(big(70,151,"THE CALL ID STAYED.",88));
  s.push(big(70,230,"THE ARGUMENTS CHANGED.",81,C.red));
  s.push(line(72,255,1528,255,C.dim,2));
  s.push(panel(72,275,1456,75,C.dim,C.panel));
  s.push(mono(97,322,"TESTED: IN-MEMORY AGENT SERVER + SUPPORTED AUTH POLICY",23));
  s.push(mono(1504,322,"MOCK SINK",21,C.muted,"end"));
  s.push(caseCard(72,"01 / APPROVAL VIEW","A",["20 units","approved-vendor"],"exact A reviewed",C.cream));
  s.push(caseCard(453,"02 / A2A UPDATE","B",["2,000 units","attacker-sink"],"maker: update only",C.red));
  s.push(caseCard(834,"03 / STALE DECISION","YES",["approve A","without reread"],"approver resumes",C.gold));
  s.push(caseCard(1215,"04 / MOCK SINK","B",["2,000 units","attacker-sink"],"approver authority",C.red));
  s.push(arrow(392,446,566)); s.push(arrow(773,827,566)); s.push(arrow(1154,1208,566));
  const controls=[
    {x:72,t:"DIRECT B",v:"NO EFFECT",c:C.cream},
    {x:571,t:"UNCHANGED A",v:"A EXECUTES",c:C.green},
    {x:1070,t:"DENY UPDATE",v:"B BLOCKED",c:C.green},
  ];
  for(const q of controls){
    s.push(panel(q.x,812,458,119,q.c,C.panel));
    s.push(mono(q.x+20,849,q.t,24,C.muted));
    s.push(big(q.x+20,906,q.v,43,q.c));
  }
  s.push(mono(72,970,"SHIPPED A2A MESSAGE COMMAND + HITL MIDDLEWARE",21,C.muted));
  s.push(mono(1528,970,"NOT A SECTION 7.6 CREDENTIAL TEST",20,C.muted,"end"));
  return svg(w,h,89,s);
}

function defenseRow(x,y,w,title,note,color) {
  return panel(x,y,w,99,color,C.bg)+big(x+20,y+46,title,37,color)+mono(x+20,y+78,note,24,C.muted);
}
function defense() {
  const w=1600,h=930,s=[];
  s.push(mono(72,59,"03 / TWO WAYS TO KEEP A BOUND",22,C.red));
  s.push(big(70,151,"TWO GATES. SAME GOAL.",91));
  s.push(mono(73,198,"APPROVAL FOR A MUST NOT RELEASE B.",24,C.muted));
  s.push(line(72,223,1528,223,C.dim,2));
  s.push(panel(72,269,695,563,C.green,C.panel2));
  s.push(panel(833,269,695,563,C.gold,C.panel2));
  s.push(mono(101,313,"OBSERVED LANGGRAPH CONTROL",23,C.green));
  s.push(mono(862,313,"GENERAL IMPLEMENTATION DESIGN",23,C.gold));
  s.push(line(101,334,738,334,C.dim,2));
  s.push(line(862,334,1499,334,C.dim,2));
  s.push(defenseRow(101,359,637,"PENDING A","approver has reviewed exact A",C.cream));
  s.push(defenseRow(101,528,637,"DENY MAKER UPDATE","supported Auth policy blocks B",C.green));
  s.push(defenseRow(101,697,637,"EXECUTE A","unchanged control still succeeds",C.green));
  s.push(downArrow(420,461,520,C.green)); s.push(downArrow(420,630,689,C.green));
  s.push(defenseRow(862,359,637,"SEAL EXACT A","complete effect + scope + expiry",C.gold));
  s.push(defenseRow(862,528,637,"REBUILD CURRENT B","after the last mutable step",C.red));
  s.push(defenseRow(862,697,637,"BLOCK OR REAPPROVE","digest and scope mismatch",C.red));
  s.push(downArrow(1180,461,520,C.gold)); s.push(downArrow(1180,630,689,C.red));
  s.push(mono(72,875,"LEFT: TESTED SAFE POLICY. RIGHT: ACTION-BINDING DESIGN, NOT A LANGGRAPH PRODUCT FIX.",21,C.muted));
  s.push(mono(72,904,"DISPATCH THE VERIFIED IMMUTABLE OPERATION; DO NOT REBUILD IT FROM TASK STATE.",21,C.muted));
  return svg(w,h,103,s);
}

function coverOverlay() {
  const s=[];
  s.push(rect(0,0,1672,341,C.bg,"none",0,'opacity=".44"'));
  s.push(mono(70,54,"FN—10 / AGENTIC SECURITY RESEARCH",21));
  s.push(mono(1600,54,"LOOPJACKING / A2A",21,C.cream,"end"));
  s.push(line(70,75,1600,75,C.dim,2));
  s.push(big(66,201,"SAME TASK.",150));
  s.push(big(70,310,"DIFFERENT ACTION.",113,C.red));
  s.push(line(70,332,1600,332,C.cream,2));
  s.push(rect(0,833,1672,108,C.bg,"none",0,'opacity=".94"'));
  s.push(line(70,834,1600,834,C.dim,2));
  s.push(mono(72,880,"A SHOWN FOR APPROVAL",20));
  s.push(line(509,854,509,907,C.dim,2));
  s.push(mono(555,880,"A2A UPDATE CARRIES B",20));
  s.push(line(1050,854,1050,907,C.dim,2));
  s.push(mono(1090,880,"APP RELEASES CURRENT B",20,C.red));
  s.push(mono(1600,918,"ADITHYAN ARUN KUMAR",16,C.muted,"end"));
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941">'+
    '<style>.display{font-family:Impact,"DIN Condensed",sans-serif;font-weight:900;letter-spacing:1px}.mono{font-family:Menlo,Monaco,monospace;font-weight:600;letter-spacing:1px}</style>'+
    s.join("")+'</svg>';
}

await mkdir(source,{recursive:true});
await mkdir(output,{recursive:true});
const base=await readFile(path.join(source,"cover-illustration.png"));
const cover=coverOverlay();
await writeFile(path.join(source,"cover-overlay.svg"),cover);
await sharp(base).composite([{input:Buffer.from(cover),top:0,left:0}])
  .png({compressionLevel:9}).toFile(path.join(output,"loopjacking-a2a-task-update-cover.png"));
console.log("loopjacking-a2a-task-update-cover.png: 1672x941");
for(const [name,png,markup] of [
  ["spec-boundary.svg","loopjacking-a2a-spec-boundary.png",specBoundary()],
  ["langgraph-trace.svg","loopjacking-a2a-langgraph-trace.png",caseTrace()],
  ["use-time-binding.svg","loopjacking-a2a-use-time-binding.png",defense()],
]){
  await writeFile(path.join(source,name),markup);
  await sharp(Buffer.from(markup)).png({compressionLevel:9}).toFile(path.join(output,png));
  const m=await sharp(path.join(output,png)).metadata();
  console.log(png+": "+m.width+"x"+m.height);
}
