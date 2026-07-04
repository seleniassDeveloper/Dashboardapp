const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const VIOLET="5B21B6", VIOLET2="7C3AED", BLUE="3B82F6", TEAL="10B981", INK="0F172A",
      MUTED="64748B", CREAMLINE="E5E7EB", DARKBG="0E1526", CARD="FFFFFF",
      ORANGE="C2410C", LIGHTBG="F6F7FB";
const HEAD="Georgia", BODY="Arial";

const P = {
  chart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  award:'<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  package:'<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  cpu:'<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  percent:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  gift:'<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
};
const cache={};
async function icon(name){
  if(cache[name]) return cache[name];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B21B6"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs>
    <rect width="256" height="256" rx="58" fill="url(#g)"/>
    <g transform="translate(64,64) scale(5.333)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name]}</g>
  </svg>`;
  const buf=await sharp(Buffer.from(svg)).png().toBuffer();
  return cache[name]="image/png;base64,"+buf.toString("base64");
}

(async ()=>{
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "AuraDash";
p.title = "AuraDash — System Presentation";
const mkShadow = () => ({ type:"outer", color:"000000", blur:9, offset:3, angle:90, opacity:0.10 });
const darkBg=s=>s.background={color:DARKBG};
const lightBg=s=>s.background={color:LIGHTBG};
const kicker=(s,txt,color,x=0.9,y=0.7)=>s.addText(txt.toUpperCase(),{x,y,w:11,h:0.35,fontFace:BODY,fontSize:12,bold:true,color,charSpacing:3,margin:0});
async function brand(s,x=0.9,y=0.6){
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y,w:0.55,h:0.55,rectRadius:0.12,fill:{color:BLUE}});
  s.addText("A",{x,y,w:0.55,h:0.55,align:"center",valign:"middle",fontFace:HEAD,fontSize:26,bold:true,color:"FFFFFF",margin:0});
  s.addText("AuraDash",{x:x+0.7,y,w:4,h:0.55,valign:"middle",fontFace:HEAD,fontSize:22,bold:true,color:"FFFFFF",margin:0});
}

// 1 COVER
let s=p.addSlide(); darkBg(s); await brand(s);
kicker(s,"System presentation","C9B6FF",0.9,1.9);
s.addText([{text:"The ",options:{color:"FFFFFF"}},{text:"operating system",options:{color:TEAL}},{text:" for your salon.",options:{color:"FFFFFF"}}],
  {x:0.9,y:2.3,w:11.5,h:1.6,fontFace:HEAD,fontSize:48,bold:true,margin:0});
s.addText("Not a calendar. Not a spreadsheet. A platform where every module works connected to the rest. I'll show you everything it does — and, at the end, how much it puts back in your pocket.",
  {x:0.9,y:4.1,w:10.5,h:1.2,fontFace:BODY,fontSize:18,color:"9FB2D4",margin:0});

// 2 PROBLEM
s=p.addSlide(); lightBg(s);
kicker(s,"Where you are today",VIOLET);
s.addText([{text:"Your business is scattered across ",options:{color:INK}},{text:"5 different places.",options:{color:VIOLET2}}],
  {x:0.9,y:1.3,w:11.5,h:1.6,fontFace:HEAD,fontSize:40,bold:true,margin:0});
s.addText("The calendar in a notebook or WhatsApp. Payments in a spreadsheet. Stock in your head. Commissions on a calculator. Reminders sent one by one. Nothing talks to anything else — and everything that slips through is money you never see.",
  {x:0.9,y:3.1,w:10.8,h:2,fontFace:BODY,fontSize:19,color:MUTED,margin:0,lineSpacingMultiple:1.15});

// 3 TOOLS STACK
s=p.addSlide(); darkBg(s);
kicker(s,"What you're already paying for","C9B6FF");
s.addText([{text:"What a salon ",options:{color:"FFFFFF"}},{text:"typically pays for",options:{color:TEAL}}],
  {x:0.9,y:1.15,w:11.8,h:0.9,fontFace:HEAD,fontSize:30,bold:true,margin:0});
const toolRows=[
  [{text:"Need",options:{bold:true,color:"C9B6FF"}},{text:"Apps typically used",options:{bold:true,color:"C9B6FF"}},{text:"Approx. price (2026)",options:{bold:true,color:"C9B6FF"}}],
  ["Scheduling","Fresha · Booksy · AgendaPro · Square","AgendaPro US$19–59/mo · Fresha \"free\" but ~20% new-client marketplace fee + 2.19% online payment"],
  ["Payments / POS","Square · Stripe · Mercado Pago","~2.6–3.5% + fixed fee per transaction"],
  ["CRM / client records","Zoho CRM · HubSpot Starter","US$20–25/mo"],
  ["WhatsApp / SMS marketing","WATI · ManyChat","US$30–60/mo"],
  ["Inventory + invoicing","Zoho Inventory · inFlow","US$39–79/mo"],
  ["Reports","Excel · Google Sheets · Looker","your time building them by hand"],
];
s.addTable(toolRows,{x:0.9,y:2.15,w:11.5,colW:[2.7,4.0,4.8],fontFace:BODY,fontSize:12.5,color:"DBE4F5",valign:"middle",
  border:{type:"solid",pt:0.5,color:"27324B"},fill:{color:DARKBG},rowH:0.5,margin:[3,6,3,6]});
s.addText([{text:"Each need ends up in a different app — and ",options:{color:"9FB2D4"}},{text:"none of them talk to each other.",options:{color:"FFFFFF",bold:true}}],
  {x:0.9,y:6.75,w:11.5,h:0.5,fontFace:BODY,fontSize:15,margin:0});

// 4 THE REAL COST
s=p.addSlide(); darkBg(s);
kicker(s,"The real cost","C9B6FF");
s.addText([{text:"The real cost ",options:{color:"FFFFFF"}},{text:"isn't the money.",options:{color:TEAL}}],
  {x:0.9,y:1.15,w:11.5,h:0.9,fontFace:HEAD,fontSize:34,bold:true,margin:0});
s.addText([{text:"Most people think: “I pay for several apps.” The real problem is ",options:{color:"9FB2D4"}},{text:"double data entry",options:{color:"FFFFFF",bold:true}},{text:" — the same info, typed in over and over, by hand.",options:{color:"9FB2D4"}}],
  {x:0.9,y:2.05,w:11.3,h:0.8,fontFace:BODY,fontSize:17,margin:0});
const steps=[["1","The client books"],["2","You copy it into the calendar"],["3","Charge for the service"],["4","Log the sale in the register"],["5","Deduct the product from stock"],["6","Update the client's history"]];
let cy=3.05;
steps.forEach(([n,t])=>{
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.9,y:cy,w:6.6,h:0.52,rectRadius:0.08,fill:{color:"18213A"},line:{color:"2A3654",width:1}});
  s.addShape(p.shapes.OVAL,{x:1.02,y:cy+0.1,w:0.32,h:0.32,fill:{color:VIOLET2}});
  s.addText(n,{x:1.02,y:cy+0.1,w:0.32,h:0.32,align:"center",valign:"middle",fontFace:BODY,fontSize:13,bold:true,color:"FFFFFF",margin:0});
  s.addText(t,{x:1.5,y:cy,w:5.8,h:0.52,valign:"middle",fontFace:BODY,fontSize:14,color:"FFFFFF",margin:0});
  cy+=0.62;
});
s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:8.0,y:3.4,w:4.4,h:2.3,rectRadius:0.12,fill:{color:"3A1620"},line:{color:"7F3B4A",width:1}});
s.addText("6 manual steps",{x:8.2,y:3.7,w:4.0,h:0.6,fontFace:HEAD,fontSize:26,bold:true,color:"FECACA",margin:0});
s.addText("6 places to lose info or make a mistake — on every appointment, every day.",
  {x:8.2,y:4.4,w:4.0,h:1.1,fontFace:BODY,fontSize:15,color:"F3C6CE",margin:0});

// 5 SOLUTION
s=p.addSlide(); darkBg(s);
kicker(s,"The solution","C9B6FF");
s.addText([{text:"10 modules. ",options:{color:"FFFFFF"}},{text:"One screen.",options:{color:TEAL}}],
  {x:0.9,y:1.5,w:11.5,h:1.3,fontFace:HEAD,fontSize:44,bold:true,margin:0});
s.addText("AuraDash brings together everything you have scattered today and connects it. When something happens in one module, the rest update on their own. Let's go module by module.",
  {x:0.9,y:3.1,w:10.5,h:1.2,fontFace:BODY,fontSize:18,color:"9FB2D4",margin:0});

// 6 MODULES GRID
s=p.addSlide(); lightBg(s);
kicker(s,"The modules",VIOLET);
s.addText("Everything AuraDash does",{x:0.9,y:1.1,w:11,h:0.7,fontFace:HEAD,fontSize:30,bold:true,color:INK,margin:0});
const mods=[
  ["chart","Control Panel","Live business numbers: revenue, net profit, occupancy."],
  ["calendar","Smart Calendar","24/7 online booking, WhatsApp reminders and AI waitlist."],
  ["users","Clients (CRM)","Record with history, formulas, photos and at-risk detection."],
  ["scissors","Service Catalog","Price, duration and the supplies each service consumes."],
  ["award","Team & Payouts","Automatic commissions, schedules and performance by staff."],
  ["dollar","Finance & Register","Daily register with reconciliation, income by method, real profit."],
  ["package","Inventory (ERP)","Auto stock deduction, expiry (FIFO) and low-stock alerts."],
  ["cpu","AI Copilot + Automation","Smart suggestions and workflows that run 24/7."],
  ["link","Sync + Roles","Import your base in minutes and role-based permissions."],
];
const gx=0.9, gy=1.95, cw=3.9, ch=1.55, hgap=0.15, vgap=0.15;
for(let i=0;i<mods.length;i++){
  const m=mods[i], col=i%3, row=Math.floor(i/3);
  const x=gx+col*(cw+hgap), y=gy+row*(ch+vgap);
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y,w:cw,h:ch,rectRadius:0.08,fill:{color:CARD},line:{color:CREAMLINE,width:1},shadow:mkShadow()});
  s.addImage({data:await icon(m[0]),x:x+0.2,y:y+0.2,w:0.5,h:0.5});
  s.addText(m[1],{x:x+0.82,y:y+0.2,w:cw-1.0,h:0.5,valign:"middle",fontFace:BODY,fontSize:13.5,bold:true,color:INK,margin:0});
  s.addText(m[2],{x:x+0.2,y:y+0.78,w:cw-0.4,h:0.7,fontFace:BODY,fontSize:11.5,color:MUTED,margin:0,lineSpacingMultiple:1.05});
}

// 7 EVIDENCE intro
s=p.addSlide(); darkBg(s);
kicker(s,"The evidence","C9B6FF");
s.addText([{text:"And this — ",options:{color:"FFFFFF"}},{text:"why does it pay off?",options:{color:TEAL}}],
  {x:0.9,y:1.6,w:11.5,h:1.2,fontFace:HEAD,fontSize:42,bold:true,margin:0});
s.addText("It's not just convenience. Every feature attacks a concrete leak of money or clients. The numbers make it clear.",
  {x:0.9,y:3.1,w:10.5,h:1,fontFace:BODY,fontSize:18,color:"9FB2D4",margin:0});

function evidence(kick, titleRuns, stats, badTitle, bad, goodTitle, good, pitch){
  let s=p.addSlide(); lightBg(s);
  kicker(s,kick,VIOLET);
  s.addText(titleRuns,{x:0.9,y:1.05,w:11.6,h:0.8,fontFace:HEAD,fontSize:28,bold:true,margin:0});
  let topY=1.95;
  if(stats){
    let sx=0.9; const sw=(11.5-(stats.length-1)*0.2)/stats.length;
    stats.forEach(st=>{
      s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:sx,y:topY,w:sw,h:1.15,rectRadius:0.08,fill:{color:"F5F3FF"},line:{color:"DDD6FE",width:1}});
      s.addText(st[0],{x:sx+0.2,y:topY+0.12,w:sw-0.4,h:0.55,fontFace:HEAD,fontSize:26,bold:true,color:VIOLET,margin:0});
      s.addText(st[1],{x:sx+0.2,y:topY+0.66,w:sw-0.4,h:0.42,fontFace:BODY,fontSize:11.5,color:"334155",margin:0});
      sx+=sw+0.2;
    });
    topY+=1.4;
  }
  const colW=5.65, colH= stats? 2.55 : 3.7, cyy=topY;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.9,y:cyy,w:colW,h:colH,rectRadius:0.08,fill:{color:"FFF7ED"},line:{color:"FED7AA",width:1}});
  s.addText(badTitle.toUpperCase(),{x:1.1,y:cyy+0.16,w:colW-0.4,h:0.35,fontFace:BODY,fontSize:11.5,bold:true,color:ORANGE,charSpacing:1,margin:0});
  s.addText(bad.map((t)=>({text:t,options:{bullet:true,breakLine:true,color:"334155"}})),
    {x:1.1,y:cyy+0.6,w:colW-0.5,h:colH-0.8,fontFace:BODY,fontSize:13,margin:0,paraSpaceAfter:6});
  const gx2=0.9+colW+0.2;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:gx2,y:cyy,w:colW,h:colH,rectRadius:0.08,fill:{color:"ECFDF5"},line:{color:"BBF7D0",width:1}});
  s.addText(goodTitle.toUpperCase(),{x:gx2+0.2,y:cyy+0.16,w:colW-0.4,h:0.35,fontFace:BODY,fontSize:11.5,bold:true,color:"047857",charSpacing:1,margin:0});
  s.addText(good.map((t)=>({text:t,options:{bullet:true,breakLine:true,color:"334155"}})),
    {x:gx2+0.2,y:cyy+0.6,w:colW-0.5,h:colH-0.8,fontFace:BODY,fontSize:13,margin:0,paraSpaceAfter:6});
  if(pitch){
    s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.9,y:6.55,w:11.5,h:0.62,rectRadius:0.08,fill:{color:VIOLET}});
    s.addText(pitch,{x:1.1,y:6.55,w:11.1,h:0.62,valign:"middle",italic:true,fontFace:BODY,fontSize:13.5,color:"FFFFFF",margin:0});
  }
}

evidence("Appointments",
  [{text:"Google Calendar just notes it. ",options:{color:INK}},{text:"AuraDash runs it.",options:{color:VIOLET2}}],
  null,"With Calendar / notebook / WhatsApp",
  ["No real online booking: the client messages and waits.","No reminders: you type them one by one.","The appointment doesn't connect to register, stock or history.","No waitlist: a cancellation leaves an empty slot."],
  "With AuraDash",
  ["24/7 booking with a link, on its own.","Automatic WhatsApp reminder.","One click triggers register, commission and stock.","AI waitlist that fills the empty slot."],
  "Calendar notes the appointment. AuraDash runs the business around it.");

evidence("Client record · retention",
  [{text:"The record is why she ",options:{color:INK}},{text:"comes back and spends more.",options:{color:VIOLET2}}],
  [["60–70%","chance of selling to a client who already knows you"],["5–20%","chance with a brand-new client"],["+31%","loyal clients spend more"]],
  "Without a record",["Every visit starts from scratch: “what color did we use?”","If the stylist leaves, she takes the clients in her head."],
  "With AuraDash's record",["History, formulas, before/after photos and average ticket.","Automatically flags clients at risk of leaving."],null);

evidence("WhatsApp",
  [{text:"The channel that gets opened ",options:{color:INK}},{text:"almost every time.",options:{color:VIOLET2}}],
  [["98%","open rate (vs. ~21% for email)"],["−38% to −70%","no-shows with reminders 24–48h ahead"],["20–30%","conversion on reactivation"]],
  "What happens today",["No-shows are 20–30% of appointments.","Without reminders, that percentage is lost outright.","When a client stops coming, no one reaches out."],
  "With AuraDash",["Reminder 24h before via WhatsApp (opened almost always).","Automatic reactivation of dormant clients.","You message someone who already knows you = converts far more."],
  "A reminder opened 98% of the time that cuts your no-shows by up to 70%. That alone pays for the system.");

evidence("Payments",
  [{text:"Keep charging how you like. ",options:{color:INK}},{text:"It organizes itself.",options:{color:VIOLET2}}],
  null,"Today (cash · transfer · card / Square)",
  ["You charge, then log the sale in a spreadsheet.","You calculate the commission by hand.","At close, you fight to make the register balance."],
  "With AuraDash",["You record the payment by any method.","In the same click: sale + commission + stock.","The register balances itself and you see income by method."],
  "AuraDash doesn't replace your payment app: it organizes it. You never re-enter that payment anywhere again.");

evidence("Stock & spend",
  [{text:"Uncontrolled stock is ",options:{color:INK}},{text:"money frozen or thrown away.",options:{color:VIOLET2}}],
  null,"Without control",
  ["You overbuy “just in case”: money frozen on the shelf.","A product runs out mid-appointment.","Whatever expires gets thrown out."],
  "With AuraDash Inventory",["Each service deducts exactly what it used.","Low-stock alerts and expiry control (FIFO).","You know the real cost per service → what you truly earn."],
  "It tells you, service by service, what it costs you and what it leaves you.");

evidence("Reports",
  [{text:"Decide with data, ",options:{color:INK}},{text:"not by gut feel.",options:{color:VIOLET2}}],
  null,"Without reports",
  ["You bill, but you don't know if you're profitable.","You don't know which service pays best, or which day to boost.","The important decisions arrive too late."],
  "With AuraDash",["Real net profit, most profitable services, strong and slow days.","Performance by staff and clients at risk.","All in seconds, without building a spreadsheet."],
  "Without data, every decision is a bet. With AuraDash you know where you win and where you lose — and act in time.");

// UN CLIC
s=p.addSlide(); darkBg(s);
kicker(s,"How it all connects","C9B6FF");
s.addText([{text:"One click. ",options:{color:"FFFFFF"}},{text:"Three things",options:{color:TEAL}},{text:" happen on their own.",options:{color:"FFFFFF"}}],
  {x:0.9,y:1.2,w:11.5,h:1,fontFace:HEAD,fontSize:38,bold:true,margin:0});
s.addText("When you charge for an appointment, with a single tap:",{x:0.9,y:2.3,w:10,h:0.5,fontFace:BODY,fontSize:17,color:"9FB2D4",margin:0});
const ocs=[["dollar","The sale is logged","in Finance"],["percent","The commission is calculated","for the staff member"],["package","The supply is deducted","from stock"]];
for(let i=0;i<ocs.length;i++){const o=ocs[i], x=0.9+i*3.95;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:3.05,w:3.7,h:2.1,rectRadius:0.1,fill:{color:"18213A"},line:{color:"2A3654",width:1}});
  s.addImage({data:await icon(o[0]),x:x+0.28,y:3.32,w:0.6,h:0.6});
  s.addText(o[1],{x:x+0.28,y:4.1,w:3.15,h:0.5,fontFace:BODY,fontSize:15.5,bold:true,color:"FFFFFF",margin:0});
  s.addText(o[2],{x:x+0.28,y:4.6,w:3.15,h:0.4,fontFace:BODY,fontSize:13,color:"9FB2D4",margin:0});
}
s.addText([{text:"That's what no spreadsheet does: the modules ",options:{color:"9FB2D4"}},{text:"talk to each other.",options:{color:"6EE7C7",bold:true}}],
  {x:0.9,y:5.5,w:11.5,h:0.6,fontFace:BODY,fontSize:16,margin:0});

// AUDIT summary
s=p.addSlide(); darkBg(s);
kicker(s,"The audit — the return","C9B6FF");
s.addText([{text:"All of this, in ",options:{color:"FFFFFF"}},{text:"your pocket.",options:{color:TEAL}}],
  {x:0.9,y:1.15,w:11.5,h:0.9,fontFace:HEAD,fontSize:34,bold:true,margin:0});
s.addText("Adding up what each module saves you and earns you (adjustable with your real numbers):",
  {x:0.9,y:2.05,w:11,h:0.5,fontFace:BODY,fontSize:16,color:"9FB2D4",margin:0});
const au=[["+$4,300","extra profit per month"],["65 hrs","saved per month"],["32×","return vs. its cost"]];
au.forEach((a,i)=>{const x=0.9+i*3.95;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:2.75,w:3.7,h:1.75,rectRadius:0.1,fill:{color:"18213A"},line:{color:"2A3654",width:1}});
  s.addText(a[0],{x:x+0.2,y:2.95,w:3.3,h:0.9,align:"center",fontFace:HEAD,fontSize:32,bold:true,color:"FFFFFF",margin:0});
  s.addText(a[1],{x:x+0.2,y:3.85,w:3.3,h:0.5,align:"center",fontFace:BODY,fontSize:13,color:"9FB2D4",margin:0});
});
s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.9,y:4.8,w:11.5,h:1.2,rectRadius:0.1,fill:{color:"14251C"},line:{color:"1E6E4C",width:1}});
s.addText("Plus: one tool instead of many",{x:1.15,y:4.95,w:11,h:0.4,fontFace:BODY,fontSize:14,bold:true,color:"6EE7C7",margin:0});
s.addText("What you pay for separately today (scheduling + CRM + WhatsApp + inventory + reports) is unified in AuraDash — direct savings on licenses, and everything connected.",
  {x:1.15,y:5.35,w:11,h:0.6,fontFace:BODY,fontSize:13.5,color:"CDE9DC",margin:0});
s.addText([{text:"It pays for itself by recovering ",options:{color:"9FB2D4"}},{text:"3 appointments a month.",options:{color:"6EE7C7",bold:true}},{text:" Everything else is clean profit.",options:{color:"9FB2D4"}}],
  {x:0.9,y:6.25,w:11.5,h:0.5,fontFace:BODY,fontSize:15,margin:0});

// OFFER
s=p.addSlide(); darkBg(s);
kicker(s,"The offer","C9B6FF");
s.addText([{text:"You join as a ",options:{color:"FFFFFF"}},{text:"Founder.",options:{color:TEAL}}],
  {x:0.9,y:1.3,w:11.5,h:1,fontFace:HEAD,fontSize:40,bold:true,margin:0});
const offs=[["gift","30 days of setup FREE — I migrate your data and support you."],["lock","Price locked in for life."],["phone","Direct support with me."],["star","Priority to request new features."]];
let oy=2.75;
for(let i=0;i<offs.length;i++){const o=offs[i];
  s.addImage({data:await icon(o[0]),x:0.95,y:oy,w:0.42,h:0.42});
  s.addText(o[1],{x:1.55,y:oy-0.05,w:10.7,h:0.5,valign:"middle",fontFace:BODY,fontSize:17,color:"EAF0FB",margin:0});
  oy+=0.78;
}
s.addText("You only start paying once the system is running and you feel comfortable.",
  {x:0.9,y:6.15,w:11,h:0.5,fontFace:BODY,fontSize:16,italic:true,color:"C9B6FF",margin:0});

// CLOSE
s=p.addSlide(); darkBg(s); await brand(s);
s.addText([{text:"Shall we ",options:{color:"FFFFFF"}},{text:"get started",options:{color:TEAL}},{text:" with your salon?",options:{color:"FFFFFF"}}],
  {x:0.9,y:2.4,w:11.5,h:1.3,fontFace:HEAD,fontSize:46,bold:true,margin:0});
s.addImage({data:await icon("phone"),x:0.95,y:3.95,w:0.42,h:0.42});
s.addText("+54 9 11 6139 3922",{x:1.55,y:3.9,w:10,h:0.55,valign:"middle",fontFace:BODY,fontSize:22,bold:true,color:"FFFFFF",margin:0});
s.addImage({data:await icon("globe"),x:0.95,y:4.68,w:0.4,h:0.4});
s.addText("auradash.digital  ·  Your whole business, on one screen.",
  {x:1.55,y:4.63,w:11,h:0.5,valign:"middle",fontFace:BODY,fontSize:16,color:"C9B6FF",margin:0});

await p.writeFile({fileName:"AuraDash_Presentation_EN.pptx"});
console.log("WROTE");
})();
