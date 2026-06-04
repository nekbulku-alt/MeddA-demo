/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MeddA — Dental Lab Management Platform                         ║
 * ║  Version: 1.5.0-stable  |  Checkpoint: 2024-03                  ║
 * ║  Stack: React (JSX), inline styles, Google Fonts                ║
 * ║  Author: Νεκτάριος  |  © MeddA 2024                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * STABLE FEATURE SET (κλειδωμένο):
 * - Multi-role login + onboarding (επιλογή ρόλου, κλειδώνει στο email)
 * - Φοιτητικό σημειωματάριο (δωρεάν, αυτόνομο)
 * - FDI Odontogram + 4-step smart form + VITA shades
 * - Workflow tracker + embedded chat + ⏳ await actions
 * - Notifications (auto-generated) + Calendar + Search
 * - Finance + Analytics + Profile επιχείρησης
 * - Τιμολόγιο συνδεδεμένο με Προφίλ (ΑΦΜ/ΔΟΥ/IBAN auto)
 * - Photo annotations (σχόλια πάνω σε φωτό)
 * - Invite γιατρών (QR + link + share)
 * - Αμφίδρομη επεξεργασία εργασίας (απόχρωση/υλικό/μέτρα/σημειώσεις)
 *   με πλήρες ιστορικό αλλαγών, κλείδωμα κρίσιμων αλλαγών (⚠️),
 *   επιβεβαίωση ανάγνωσης (✓✓) & αυτόματες ειδοποιήσεις
 *
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────
 * State lives in <App> and flows down via props.
 * Pages are plain components — no router needed for demo.
 * All data is in-memory (ORDERS_INIT, EXPENSES_INIT, USERS).
 * Theme (DARK/LIGHT) passed as T prop to every component.
 *
 * MODULE MAP
 * ─────────────────────────────────────────────────────────────────
 * CONSTANTS    → theme, status, vita shades, prosth categories
 * DATA         → USERS, ORDERS_INIT, EXPENSES_INIT
 * HELPERS      → netTotal, pct, getStages, toothPath
 * BASE UI      → Logo, Pill, Av, WorkflowTracker, BottomNav
 * ODONTOGRAM   → ToothSVG, Odontogram
 * VITA         → VitaSelector
 * CHAT         → Chat
 * PAGES        → Login, OdontogramPage, Detail, FinancePage,
 *                Analytics, ProfilePage,
 *                LabDash, DoctorDash, TechDash
 * APP          → App (root)
 */

import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const MINT  = "#3ECFB2";
const MINT2 = "#2BB89D";
const MINT3 = "#1A9E85";

const DARK = {
  bg:"#08100E", surface:"#0F1A17", surfaceHi:"#162420",
  border:"rgba(62,207,178,0.12)", borderHi:"rgba(62,207,178,0.3)",
  text:"#E8F5F2", muted:"rgba(200,240,232,0.42)",
  faint:"rgba(62,207,178,0.07)", card:"#111F1B",
};
const LIGHT = {
  bg:"#F2FBF9", surface:"#FFFFFF", surfaceHi:"#F0FDF9",
  border:"rgba(62,207,178,0.18)", borderHi:"rgba(62,207,178,0.4)",
  text:"#0D1F1A", muted:"rgba(30,80,65,0.5)",
  faint:"rgba(62,207,178,0.08)", card:"#FFFFFF",
};

const STATUS = {
  pending:          { label:"Αναμονή",       color:"#F59E0B", bg:"rgba(245,158,11,0.12)"  },
  in_progress:      { label:"Σε Εξέλιξη",   color:MINT,      bg:"rgba(62,207,178,0.12)"  },
  waiting_approval: { label:"Προς Έγκριση", color:"#A78BFA", bg:"rgba(167,139,250,0.12)" },
  approved:         { label:"Εγκρίθηκε",    color:"#34D399", bg:"rgba(52,211,153,0.12)"  },
  delivered:        { label:"Παραδόθηκε",   color:"#94A3B8", bg:"rgba(148,163,184,0.1)"  },
};

const VITA_SHADES = {
  A:  { label:"A — Κοκκινωπό/Καφέ",  color:"#E8D5B0", shades:["A1","A2","A3","A3.5","A4"] },
  B:  { label:"B — Κιτρινωπό",        color:"#EDE0B5", shades:["B1","B2","B3","B4"]         },
  C:  { label:"C — Γκριζωπό",         color:"#D4C9A8", shades:["C1","C2","C3","C4"]         },
  D:  { label:"D — Κοκκινο/Γκρι",    color:"#DCCFAC", shades:["D2","D3","D4"]              },
  BL: { label:"BL — Bleach/Λεύκανση", color:"#F5F0E8", shades:["BL1","BL2","BL3","BL4"]    },
};

const PROSTH_CATS = [
  { id:"fixed",       label:"Ακίνητη Προσθετική", icon:"🦷", desc:"Στεφάνες, Γέφυρες, Εμφυτεύματα, Ενθέματα, Όψεις" },
  { id:"removable",   label:"Κινητή Προσθετική",  icon:"🫧", desc:"Ολικές & Μερικές Οδοντοστοιχίες, Επιδιορθώσεις" },
  { id:"orthodontic", label:"Ορθοδοντικό",         icon:"🔧", desc:"Νάρθηκες, Συσκευές, Retainers" },
];

const FIXED_TYPES     = [
  {label:"Στεφάνη (Crown)",icon:"👑"},{label:"Γέφυρα (Bridge)",icon:"🌉"},
  {label:"Εμφύτευμα (Implant)",icon:"🔩"},{label:"Ένθεμα (Inlay/Onlay)",icon:"◆"},
  {label:"Επικάλυμμα (Veneer)",icon:"✨"},
];
const FIXED_MATS      = ["Ζιρκόνιο (Zirconia)","E-max (Lithium Disilicate)","Μεταλλοκεραμική (PFM)","Ολοκεραμική (All-Ceramic)","PMMA"];
const REMOVABLE_TYPES = [
  {label:"Ολική Οδοντοστοιχία",icon:"🫧",key:"full",subs:null,needsTeeth:false},
  {label:"Μερική Οδοντοστοιχία",icon:"⚙️",key:"partial",needsTeeth:true,
   subs:[{label:"Με μεταλλικό σκελετό",key:"metal"},{label:"Με θερμοπλαστικό υλικό",key:"thermo"}]},
  {label:"Επιδιόρθωση Οδοντοστοιχίας",icon:"🔧",key:"repair",subs:null,needsTeeth:false},
  {label:"Αναγόμωση Βάσης",icon:"🔄",key:"reline",subs:null,needsTeeth:false},
];
const REMOVABLE_MATS  = ["Ακρυλικό (Acrylic)","Θερμοπλαστικό (Thermoplastic)","Μεταλλικός Σκελετός (CoCr)","PMMA"];
const ORTHO_TYPES     = [
  {label:"Νάρθηκας (Splint)",icon:"🛡️"},{label:"Retainer",icon:"🔗"},{label:"Ορθοδοντική Συσκευή",icon:"⚙️"},
];
const ORTHO_MATS      = ["Ακρυλικό (Acrylic)","Θερμοπλαστικό (Thermoplastic)","PMMA"];

const WORKFLOW_STAGES = ["Παραλαβή","CAD Design","Κατασκευή","Αισθητική","Quality Control","Παράδοση"];

const DAYS = ["Δευτέρα","Τρίτη","Τετάρτη","Πέμπτη","Παρασκευή","Σάββατο","Κυριακή"];

const CAT_COLORS = {
  "Ζιρκόνιο":"#3ECFB2","E-max":"#A78BFA","Κεραμικά":"#60A5FA",
  "Αναλώσιμα":"#34D399","Ενοίκιο":"#94A3B8","Λογισμικό":"#FB923C",
  "Γύψος":"#F59E0B","Άλλο":"#6B7280",
};

const ROLE_BADGE = {
  lab:        { label:"ΕΡΓΑΣΤ.",  bg:"rgba(62,207,178,0.15)",  color:MINT      },
  doctor:     { label:"ΓΙΑΤΡΟΣ", bg:"rgba(167,139,250,0.15)", color:"#A78BFA" },
  technician: { label:"ΤΕΧΝΙΤΗΣ",bg:"rgba(96,165,250,0.15)",  color:"#60A5FA" },
  student:    { label:"ΜΑΘΗΤΗΣ", bg:"rgba(251,191,36,0.15)",   color:"#FBBF24" },
};

// FDI odontogram rows
const UPPER_RIGHT = [18,17,16,15,14,13,12,11];
const UPPER_LEFT  = [21,22,23,24,25,26,27,28];
const LOWER_LEFT  = [31,32,33,34,35,36,37,38];
const LOWER_RIGHT = [41,42,43,44,45,46,47,48];

const TOOTH_TYPES = {
  11:"Κεντρικός Τομέας",12:"Πλάγιος Τομέας",13:"Κυνόδοντας",
  14:"1ος Προγόμφιος",15:"2ος Προγόμφιος",16:"1ος Γομφίος",17:"2ος Γομφίος",18:"Φρονιμίτης",
  21:"Κεντρικός Τομέας",22:"Πλάγιος Τομέας",23:"Κυνόδοντας",
  24:"1ος Προγόμφιος",25:"2ος Προγόμφιος",26:"1ος Γομφίος",27:"2ος Γομφίος",28:"Φρονιμίτης",
  31:"Κεντρικός Τομέας",32:"Πλάγιος Τομέας",33:"Κυνόδοντας",
  34:"1ος Προγόμφιος",35:"2ος Προγόμφιος",36:"1ος Γομφίος",37:"2ος Γομφίος",38:"Φρονιμίτης",
  41:"Κεντρικός Τομέας",42:"Πλάγιος Τομέας",43:"Κυνόδοντας",
  44:"1ος Προγόμφιος",45:"2ος Προγόμφιος",46:"1ος Γομφίος",47:"2ος Γομφίος",48:"Φρονιμίτης",
};

// ═══════════════════════════════════════════════════════════════════
// DATA — In-memory seed for demo
// ═══════════════════════════════════════════════════════════════════
const USERS = [
  { id:"u1", name:"Νεκτάριος",             email:"nek@medda.gr",        avatar:"Ν", role:"lab",        lab:"Εργαστήριο Νεκτάριου" },
  { id:"u2", name:"Δρ. Γ. Παπαδόπουλος",  email:"gpap@iatreio.gr",     avatar:"Π", role:"doctor",     clinic:"Ιατρείο Κολωνακίου" },
  { id:"u3", name:"Δρ. Α. Νικολάου",       email:"anik@dentalsmile.gr", avatar:"Α", role:"doctor",     clinic:"Dental Smile Γλυφάδα" },
  { id:"t1", name:"Γ. Μπακαλάκης",         email:"gbak@medda-lab.gr",   avatar:"Γ", role:"technician", lab:"Εργαστήριο Νεκτάριου", labId:"u1", specialty:"CAD Design & Κατασκευή", commission:35 },
  { id:"t2", name:"Μ. Παπαδάκη",           email:"mpap@medda-lab.gr",   avatar:"Μ", role:"technician", lab:"Εργαστήριο Νεκτάριου", labId:"u1", specialty:"Αισθητική & Κεραμικά",   commission:32 },
  { id:"s1", name:"Ε. Δημητρίου",          email:"edim@student.tei.gr", avatar:"Ε", role:"student",    lab:"Εργαστήριο Νεκτάριου", labId:"u1", specialty:"3ο Εξάμηνο — Οδοντοτεχνική" },
];

const CHAT_INIT = [
  { id:1, from:"u2", text:"Καλημέρα! Για το δόντι #21 θέλω απόχρωση A2, όχι A1.", time:"09:14" },
  { id:2, from:"u1", text:"Κατάλαβα! Θα το ενημερώσω. Έτοιμο Παρασκευή.",          time:"09:22" },
  { id:3, from:"u1", text:"Γιατρέ, στέλνω φωτό — η μεσοπαρειακή ακρολοφία δε βγήκε σωστά.",
     time:"10:45", awaitAction:"pending",
     media:[{type:"photo",label:"Αποτύπωμα #21 — πρόβλημα ακρολοφίας"}] },
  { id:4, from:"u2", text:"Προχώρα κανονικά, θα το διορθώσουμε στη δοκιμή. 👍", time:"11:02" },
];

const ORDERS_INIT = [
  {
    id:"MD-041", patient:"Α. Κωνσταντίνου", doctorId:"u2", labId:"u1",
    tooth:"21", workType:"Στεφάνη (Crown)", material:"Ζιρκόνιο (Zirconia)", shade:"A2", category:"fixed",
    type:"Στεφάνη Ζιρκονίου #21", status:"in_progress", delivery:"2024-03-22T10:30:00", workflowStep:2,
    stages:[
      {name:"Λήψη αποτυπώματος",       done:true,  date:"10/03", photos:2, materials:"Alginate Lot#A221", technicianId:"t1"},
      {name:"Ψηφιακός σχεδιασμός (CAD)",done:true,  date:"12/03", photos:1, materials:"",                   technicianId:"t1"},
      {name:"Κατασκευή (Milling)",      done:false, date:"15/03", photos:0, materials:"Zirconia Lot#Z99",   technicianId:null},
      {name:"Αισθητική Φινίρισμα",      done:false, date:"18/03", photos:0, materials:"",                   technicianId:null},
      {name:"Quality Control",          done:false, date:"20/03", photos:0, materials:"",                   technicianId:null},
    ],
    items:[{desc:"Στεφάνη Ζιρκονίου #21",qty:1,price:95},{desc:"CAD Design",qty:1,price:25}],
    notes:"Απόχρωση A2 — επιβεβαιώθηκε από chat.", measurements:"Πάχος τοιχώματος 1.2mm · Επαφή με γειτονικά: ελαφρά", approved:false, doctorComment:"", chat:CHAT_INIT,
    history:[
      {id:"h1", by:"u2", byName:"Δρ. Γ. Παπαδόπουλος", byRole:"doctor", field:"Απόχρωση", from:"A1", to:"A2", time:"χθες 14:20", seenBy:["u2","u1"]},
    ],
  },
  {
    id:"MD-039", patient:"Μ. Τριανταφύλλου", doctorId:"u3", labId:"u1",
    tooth:"16", workType:"Γέφυρα (Bridge)", material:"Μεταλλοκεραμική (PFM)", shade:"B2", category:"fixed",
    type:"Γέφυρα PFM #14-16", status:"approved", delivery:"2024-03-15T09:00:00", workflowStep:5,
    stages:[
      {name:"Λήψη αποτυπώματος",  done:true, date:"05/03", photos:2, materials:"Plaster Lot#P44",  technicianId:"t1"},
      {name:"Ψηφιακός σχεδιασμός",done:true, date:"07/03", photos:1, materials:"",                  technicianId:"t1"},
      {name:"Κατασκευή",           done:true, date:"10/03", photos:2, materials:"Alloy Lot#AL77",    technicianId:"t2"},
      {name:"Αισθητική Φινίρισμα", done:true, date:"12/03", photos:2, materials:"IPS Lot#DS33",      technicianId:"t2"},
      {name:"Quality Control",     done:true, date:"14/03", photos:1, materials:"",                  technicianId:null},
    ],
    items:[{desc:"Γέφυρα PFM 3 μελών",qty:1,price:220},{desc:"Κεραμικό IPS",qty:1,price:45}],
    notes:"", approved:true, doctorComment:"Άριστη δουλειά!",
    chat:[{id:1,from:"u3",text:"Τέλεια εφαρμογή!",time:"14/03"},{id:2,from:"u1",text:"Χαρούμαστε!",time:"14/03"}],
  },
  {
    id:"MD-044", patient:"Σ. Βασιλείου", doctorId:"u2", labId:"u1",
    tooth:"36", workType:"Ένθεμα (Inlay/Onlay)", material:"E-max (Lithium Disilicate)", shade:"A3", category:"fixed",
    type:"E-max Onlay #36", status:"pending", delivery:"2024-03-28T11:00:00", workflowStep:0,
    stages:[
      {name:"Λήψη αποτυπώματος",   done:false,date:"18/03",photos:0,materials:"",technicianId:null},
      {name:"Ψηφιακός σχεδιασμός", done:false,date:"21/03",photos:0,materials:"",technicianId:null},
      {name:"Κατασκευή",            done:false,date:"24/03",photos:0,materials:"",technicianId:null},
      {name:"Αισθητική Φινίρισμα",  done:false,date:"26/03",photos:0,materials:"",technicianId:null},
      {name:"Quality Control",      done:false,date:"27/03",photos:0,materials:"",technicianId:null},
    ],
    items:[{desc:"E-max Onlay #36",qty:1,price:110}],
    notes:"Δεξί χέρι.", approved:false, doctorComment:"", chat:[],
  },
  {
    id:"MD-047", patient:"Κ. Αλεξίου", doctorId:"u2", labId:"u1",
    tooth:"11", workType:"Επικάλυμμα (Veneer)", material:"E-max (Lithium Disilicate)", shade:"A1", category:"fixed",
    type:"E-max Veneer #11", status:"waiting_approval", delivery:"2024-03-25T10:00:00", workflowStep:4,
    stages:[
      {name:"Λήψη αποτυπώματος",   done:true, date:"15/03",photos:3,materials:"Alginate Lot#A330",technicianId:"t1"},
      {name:"Ψηφιακός σχεδιασμός", done:true, date:"17/03",photos:2,materials:"",                  technicianId:"t1"},
      {name:"Κατασκευή",            done:true, date:"20/03",photos:1,materials:"E-max Lot#EM55",    technicianId:"t2"},
      {name:"Αισθητική Φινίρισμα",  done:true, date:"22/03",photos:2,materials:"Glaze Lot#GL12",    technicianId:"t2"},
      {name:"Quality Control",      done:false,date:"24/03",photos:0,materials:"",                  technicianId:null},
    ],
    items:[{desc:"E-max Veneer #11",qty:1,price:130},{desc:"Φινίρισμα Premium",qty:1,price:30}],
    notes:"Να ταιριάζει με γειτονικά δόντια.", approved:false, doctorComment:"", chat:[],
  },
];

const EXPENSES_INIT = [
  {id:"ex1",date:"2026-03-02",category:"Ζιρκόνιο",  description:"Zirconia discs Lot#Z201 x10", amount:320, supplier:"Dental Supply AE"},
  {id:"ex2",date:"2026-03-05",category:"E-max",      description:"IPS e.max CAD HT A2 x20",    amount:180, supplier:"Ivoclar Hellas"},
  {id:"ex3",date:"2026-03-08",category:"Κεραμικά",   description:"IPS Ivocolor Glaze 5g",       amount:65,  supplier:"Ivoclar Hellas"},
  {id:"ex4",date:"2026-03-10",category:"Αναλώσιμα",  description:"Γάντια νιτριλίου x200",       amount:42,  supplier:"Ιατρικά Πανελλήνια"},
  {id:"ex5",date:"2026-03-15",category:"Ενοίκιο",    description:"Ενοίκιο εργαστηρίου Μάρτιος", amount:750, supplier:""},
  {id:"ex6",date:"2026-03-18",category:"Λογισμικό",  description:"Exocad DentalCAD ετήσια",     amount:120, supplier:"Exocad GmbH"},
  {id:"ex7",date:"2026-02-10",category:"Ζιρκόνιο",   description:"Zirconia discs Lot#Z188 x8",  amount:256, supplier:"Dental Supply AE"},
  {id:"ex8",date:"2026-02-15",category:"Ενοίκιο",    description:"Ενοίκιο Φεβρουάριος",         amount:750, supplier:""},
];

const LAB_PROFILE_INIT = {
  businessName:"Οδοντοτεχνικό Εργαστήριο Νεκτάριου",
  ownerName:"Νεκτάριος", vat:"123456789", doy:"ΔΟΥ Αθηνών Α",
  profession:"Οδοντοτεχνίτης", licenseNo:"ΟΤΕ-00421",
  phone:"210 123 4567", mobile:"697 123 4567", email:"nek@medda.gr",
  address:"Πατησίων 42", city:"Αθήνα", postalCode:"10682", prefecture:"Αττική",
  iban:"GR16 0110 1250 0000 0001 2300 695", bank:"Εθνική Τράπεζα",
  notes:"Εξειδίκευση σε ζιρκόνιο και E-max.",
  hours:{
    "Δευτέρα":{open:"08:30",close:"17:00",closed:false},
    "Τρίτη": {open:"08:30",close:"17:00",closed:false},
    "Τετάρτη":{open:"08:30",close:"15:00",closed:false},
    "Πέμπτη": {open:"08:30",close:"17:00",closed:false},
    "Παρασκευή":{open:"08:30",close:"15:00",closed:false},
    "Σάββατο":{open:"",close:"",closed:true},
    "Κυριακή":{open:"",close:"",closed:true},
  },
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const netTotal = items => items.reduce((s, i) => s + i.qty * i.price, 0);
const pct      = stages => Math.round(stages.filter(s => s.done).length / stages.length * 100);

function getStages(category, workType, subType) {
  const e = name => ({ name, done:false, date:"", photos:0, materials:"", technicianId:null });
  if (category === "fixed")
    return [e("Λήψη αποτυπώματος"),e("Ψηφιακός σχεδιασμός (CAD)"),e("Κατασκευή"),e("Αισθητική Φινίρισμα"),e("Quality Control")];
  if (category === "removable") {
    if (workType.includes("Ολική"))       return [e("Ατομικό δοχείο"),e("Τελική αποτύπωση"),e("Σύγκλειση"),e("Δοκιμή σε κερί"),e("Τελική κατασκευή"),e("Παράδοση")];
    if (workType.includes("Μερική") && subType?.includes("μεταλλικό"))
      return [e("Αποτύπωση"),e("Σχεδιασμός σκελετού"),e("Χύτευση"),e("Δοκιμή σκελετού"),e("Δοκιμή σε κερί"),e("Τελική κατασκευή"),e("Παράδοση")];
    if (workType.includes("Μερική"))      return [e("Αποτύπωση"),e("Σχεδιασμός"),e("Δοκιμή σε κερί"),e("Τελική κατασκευή"),e("Παράδοση")];
    if (workType.includes("Επιδιόρθωση")) return [e("Παραλαβή"),e("Επιδιόρθωση"),e("Quality Control"),e("Παράδοση")];
    return [e("Αποτύπωση"),e("Κατασκευή"),e("Παράδοση")];
  }
  return [e("Αποτύπωση"),e("Σχεδιασμός"),e("Κατασκευή"),e("Quality Control"),e("Παράδοση")];
}

function toothPath(num, w, h) {
  const isUp = num <= 28, n = num % 10, cx = w / 2;
  const isI = n===1||n===2, isC = n===3, isP = n===4||n===5;
  if (isUp) {
    const cH=h*.52, rt=h*.97, rn=h*.58;
    if (isI) return `M${cx-w*.38} ${cH} L${cx-w*.36} ${h*.14} Q${cx-w*.28} ${h*.03} ${cx} ${h*.03} Q${cx+w*.28} ${h*.03} ${cx+w*.36} ${h*.14} L${cx+w*.38} ${cH} C${cx+w*.28} ${rn} ${cx+w*.18} ${rt-h*.12} ${cx} ${rt} C${cx-w*.18} ${rt-h*.12} ${cx-w*.28} ${rn} ${cx-w*.38} ${cH} Z`;
    if (isC) return `M${cx-w*.42} ${cH} L${cx-w*.38} ${h*.22} L${cx} ${h*.03} L${cx+w*.38} ${h*.22} L${cx+w*.42} ${cH} C${cx+w*.30} ${rn} ${cx+w*.16} ${rt-h*.1} ${cx} ${rt} C${cx-w*.16} ${rt-h*.1} ${cx-w*.30} ${rn} ${cx-w*.42} ${cH} Z`;
    if (isP) return `M${cx-w*.44} ${cH} L${cx-w*.42} ${h*.26} Q${cx-w*.22} ${h*.04} ${cx-w*.08} ${h*.13} Q${cx} ${h*.06} ${cx+w*.08} ${h*.13} Q${cx+w*.22} ${h*.04} ${cx+w*.42} ${h*.26} L${cx+w*.44} ${cH} C${cx+w*.30} ${rn} ${cx+w*.16} ${rt-h*.12} ${cx} ${rt} C${cx-w*.16} ${rt-h*.12} ${cx-w*.30} ${rn} ${cx-w*.44} ${cH} Z`;
    return `M${cx-w*.46} ${cH} L${cx-w*.44} ${h*.28} Q${cx-w*.30} ${h*.04} ${cx-w*.16} ${h*.16} Q${cx-w*.05} ${h*.04} ${cx+w*.05} ${h*.16} Q${cx+w*.20} ${h*.04} ${cx+w*.34} ${h*.16} Q${cx+w*.44} ${h*.04} ${cx+w*.46} ${h*.28} L${cx+w*.46} ${cH} C${cx+w*.38} ${rt-h*.18} ${cx+w*.20} ${rt-h*.05} ${cx} ${rt-h*.06} C${cx-w*.20} ${rt-h*.05} ${cx-w*.38} ${rt-h*.18} ${cx-w*.46} ${cH} Z`;
  } else {
    const cT=h*.48, cB=h*.97, rt=h*.03, rn=h*.42;
    if (isI) return `M${cx-w*.38} ${cT} C${cx-w*.28} ${rn} ${cx-w*.18} ${rt+h*.12} ${cx} ${rt} C${cx+w*.18} ${rt+h*.12} ${cx+w*.28} ${rn} ${cx+w*.38} ${cT} L${cx+w*.36} ${h*.86} Q${cx+w*.28} ${cB} ${cx} ${cB} Q${cx-w*.28} ${cB} ${cx-w*.36} ${h*.86} Z`;
    if (isC) return `M${cx-w*.42} ${cT} C${cx-w*.30} ${rn} ${cx-w*.16} ${rt+h*.1} ${cx} ${rt} C${cx+w*.16} ${rt+h*.1} ${cx+w*.30} ${rn} ${cx+w*.42} ${cT} L${cx+w*.38} ${h*.78} L${cx} ${cB} L${cx-w*.38} ${h*.78} Z`;
    if (isP) return `M${cx-w*.44} ${cT} C${cx-w*.30} ${rn} ${cx-w*.16} ${rt+h*.12} ${cx} ${rt} C${cx+w*.16} ${rt+h*.12} ${cx+w*.30} ${rn} ${cx+w*.44} ${cT} L${cx+w*.42} ${h*.74} Q${cx+w*.22} ${cB-h*.04} ${cx+w*.08} ${h*.87} Q${cx} ${cB} ${cx-w*.08} ${h*.87} Q${cx-w*.22} ${cB-h*.04} ${cx-w*.42} ${h*.74} Z`;
    return `M${cx-w*.46} ${cT} C${cx-w*.40} ${rn} ${cx-w*.38} ${rt+h*.18} ${cx-w*.20} ${rt+h*.05} C${cx-w*.14} ${rt} ${cx-w*.06} ${rt} ${cx} ${rt+h*.06} C${cx+w*.06} ${rt} ${cx+w*.14} ${rt} ${cx+w*.20} ${rt+h*.05} C${cx+w*.38} ${rt+h*.18} ${cx+w*.40} ${rn} ${cx+w*.46} ${cT} L${cx+w*.44} ${h*.72} Q${cx+w*.20} ${cB-h*.04} ${cx+w*.05} ${h*.84} Q${cx} ${cB} ${cx-w*.05} ${h*.84} Q${cx-w*.20} ${cB-h*.04} ${cx-w*.44} ${h*.72} Z`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BASE UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════
function Logo({ size=28, showText=true, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="11" fill={MINT2}/>
        <circle cx="13" cy="20" r="5" fill="white" opacity="0.95"/>
        <circle cx="27" cy="20" r="5" fill="white" opacity="0.95"/>
        <line x1="18" y1="20" x2="22" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="13" cy="20" r="2" fill={MINT3}/>
        <circle cx="27" cy="20" r="2" fill={MINT3}/>
      </svg>
      {showText && (
        <span style={{fontSize:size*.6,fontWeight:800,letterSpacing:"-0.04em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Medd<span style={{color:MINT}}>A</span>
        </span>
      )}
    </div>
  );
}

function Pill({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:s.bg,color:s.color,fontWeight:700,whiteSpace:"nowrap",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{s.label}</span>;
}

function Av({ user, size=36 }) {
  const bg = user.role==="student"  ? "linear-gradient(135deg,#FBBF24,#F59E0B)"
           : user.role==="technician"? "linear-gradient(135deg,#60A5FA,#3B82F6)"
           : `linear-gradient(135deg,${MINT},${MINT3})`;
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,color:"white",flexShrink:0}}>{user.avatar}</div>;
}

function WorkflowTracker({ step, T }) {
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🏭 Live Production Tracking</div>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",top:14,left:14,right:14,height:2,background:T.border,borderRadius:1}}/>
        <div style={{position:"absolute",top:14,left:14,height:2,
          width:`${(step/Math.max(WORKFLOW_STAGES.length-1,1))*100}%`,maxWidth:"calc(100% - 28px)",
          background:`linear-gradient(90deg,${MINT},${MINT3})`,borderRadius:1,transition:"width .5s"}}/>
        <div style={{display:"flex",justifyContent:"space-between",position:"relative"}}>
          {WORKFLOW_STAGES.map((stage,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:28,height:28,borderRadius:"50%",
                background:i<=step?`linear-gradient(135deg,${MINT},${MINT3})`:T.surface,
                border:i<=step?"none":`1px solid ${T.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,color:i<=step?"white":T.muted,zIndex:1}}>
                {i<step?"✓":i+1}
              </div>
              <div style={{fontSize:8,color:i<=step?MINT:T.muted,textAlign:"center",maxWidth:44,lineHeight:1.2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{stage}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottomNav({ page, setPage, role, T, isDark, badgeCount=0 }) {
  const labItems = [{id:"dashboard",icon:"⊞",label:"Αρχική"},{id:"orders",icon:"≡",label:"Εργασίες"},{id:"odontogram",icon:"🦷",label:"Νέα"},{id:"calendar",icon:"📅",label:"Ημ/γιο"},{id:"finance",icon:"💶",label:"Οικον."}];
  const docItems = [{id:"dashboard",icon:"⊞",label:"Αρχική"},{id:"odontogram",icon:"🦷",label:"Νέα Εντολή"},{id:"orders",icon:"≡",label:"Εργασίες"},{id:"calendar",icon:"📅",label:"Ημ/γιο"},{id:"history",icon:"🕐",label:"Ιστορικό"}];
  const techItems= [{id:"dashboard",icon:"⊞",label:"Αρχική"},{id:"orders",icon:"≡",label:"Εργασίες"},{id:"calendar",icon:"📅",label:"Ημ/γιο"}];
  const stuItems = [{id:"dashboard",icon:"📓",label:"Σημειωματάριο"}];
  const items = role==="lab"?labItems:role==="technician"?techItems:role==="student"?stuItems:docItems;
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:430,margin:"0 auto",
      background:isDark?"rgba(8,16,14,0.96)":"rgba(242,251,249,0.97)",
      backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,
      display:"flex",padding:"8px 0 20px",zIndex:100}}>
      {items.map(it=>{
        const active = page===it.id||(page==="detail"&&it.id==="orders");
        const showBadge = it.id==="orders"&&badgeCount>0;
        return (
          <button key={it.id} onClick={()=>setPage(it.id)}
            style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",position:"relative"}}>
            <span style={{fontSize:17,opacity:active?1:.38}}>{it.icon}</span>
            {showBadge&&<span style={{position:"absolute",top:0,right:"calc(50% - 12px)",width:16,height:16,borderRadius:"50%",background:MINT,color:"white",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{badgeCount}</span>}
            <span style={{fontSize:9,fontWeight:active?700:400,color:active?MINT:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ODONTOGRAM
// ═══════════════════════════════════════════════════════════════════
function ToothSVG({ num, selected, hasOrder, onClick, T }) {
  const n=num%10;
  const w=(n===1||n===2)?17:n===3?16:(n===4||n===5)?16:21;
  const h=num<=28?38:34, isUp=num<=28;
  const color=selected?MINT:hasOrder?"#F59E0B":"#3a5a50";
  const fill =selected?"rgba(62,207,178,0.22)":hasOrder?"rgba(245,158,11,0.15)":"transparent";
  return (
    <div onClick={onClick} title={`${num} — ${TOOTH_TYPES[num]||""}`}
      style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,userSelect:"none"}}>
      {!isUp&&<div style={{fontSize:7,color:selected?MINT:T.muted,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{num}</div>}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
        <path d={toothPath(num,w,h)} fill={fill} stroke={color} strokeWidth={selected?1.8:1.1} strokeLinejoin="round"/>
        {selected&&<circle cx={w/2} cy={isUp?h*.28:h*.72} r={3.5} fill={MINT} opacity={.9}/>}
        {hasOrder&&!selected&&<circle cx={w/2} cy={isUp?h*.28:h*.72} r={3} fill="#F59E0B" opacity={.9}/>}
      </svg>
      {isUp&&<div style={{fontSize:7,color:selected?MINT:T.muted,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{num}</div>}
    </div>
  );
}

function Odontogram({ onSelect, selectedTeeth, orders, T }) {
  const orderTeeth = orders.map(o=>o.tooth.split(",")).flat().map(t=>t.trim());
  const renderRow = teeth => (
    <div style={{display:"flex",gap:1,justifyContent:"center",alignItems:"flex-end"}}>
      {teeth.map(num=>(
        <ToothSVG key={num} num={num}
          selected={selectedTeeth.includes(String(num))}
          hasOrder={orderTeeth.includes(String(num))}
          onClick={()=>onSelect(String(num))} T={T}/>
      ))}
    </div>
  );
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 8px"}}>
      <div style={{fontSize:10,color:T.muted,textAlign:"center",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        Οδοντόγραμμα FDI — Πάτα δόντι{selectedTeeth.length>0?` (${selectedTeeth.length} επιλεγμένα)`:""}
      </div>
      <div style={{marginBottom:2}}><div style={{display:"flex",gap:0,justifyContent:"center"}}>{renderRow(UPPER_RIGHT)}{renderRow(UPPER_LEFT)}</div></div>
      <div style={{height:1,background:T.border,margin:"5px 8px",position:"relative"}}>
        <span style={{position:"absolute",left:"50%",transform:"translateX(-50%)",top:-7,fontSize:8,color:T.muted,background:T.card,padding:"0 5px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Άνω / Κάτω</span>
      </div>
      <div style={{marginTop:2}}><div style={{display:"flex",gap:0,justifyContent:"center"}}>{renderRow(LOWER_LEFT)}{renderRow(LOWER_RIGHT)}</div></div>
      <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:8}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:MINT}}/><span style={{fontSize:9,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Επιλεγμένο</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:"#F59E0B"}}/><span style={{fontSize:9,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Έχει εργασία</span></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VITA SHADE SELECTOR
// ═══════════════════════════════════════════════════════════════════
function VitaSelector({ value, onChange, T }) {
  const [group, setGroup] = useState("A");
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {Object.keys(VITA_SHADES).map(k=>(
          <button key={k} onClick={()=>setGroup(k)}
            style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${group===k?MINT:T.border}`,background:group===k?"rgba(62,207,178,0.12)":"transparent",color:group===k?MINT:T.muted,fontSize:12,fontWeight:group===k?700:400,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{k}</button>
        ))}
      </div>
      <div style={{fontSize:11,color:T.muted,marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{VITA_SHADES[group]?.label}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {VITA_SHADES[group]?.shades.map(shade=>(
          <button key={shade} onClick={()=>onChange(shade)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 10px",borderRadius:10,border:`2px solid ${value===shade?MINT:T.border}`,background:value===shade?"rgba(62,207,178,0.1)":T.surface,cursor:"pointer",minWidth:52}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:VITA_SHADES[group].color,border:"1px solid rgba(0,0,0,0.1)",boxShadow:value===shade?"0 0 0 3px rgba(62,207,178,0.4)":"none"}}/>
            <span style={{fontSize:12,fontWeight:700,color:value===shade?MINT:T.text,fontFamily:"'DM Mono',monospace"}}>{shade}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════
function Chat({ order, user, T }) {
  const [msg, setMsg]           = useState("");
  const [messages, setMessages] = useState(order.chat || []);
  const [showAttach, setShowAttach] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const endRef = useRef(null);
  const isLabSide = user.role==="lab"||user.role==="technician"||user.role==="student";
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[messages]);

  const send = (opts={}) => {
    if (!msg.trim() && attachments.length===0) return;
    setMessages(prev=>[...prev,{
      id:Date.now(), from:user.id,
      text:msg||(attachments.length>0?`📎 ${attachments.length} αρχείο`:""),
      time:new Date().toLocaleTimeString("el",{hour:"2-digit",minute:"2-digit"}),
      media:attachments.length>0?[...attachments]:undefined,
      awaitAction:opts.await?"pending":undefined,
    }]);
    setMsg(""); setAttachments([]); setShowAttach(false);
  };

  const respond = (msgId, action) => {
    setMessages(prev=>prev.map(m=>m.id===msgId?{...m,awaitAction:action}:m));
    setMessages(prev=>[...prev,{id:Date.now(),from:user.id,
      text:action==="proceed"?"✅ Προχώρα κανονικά.":"🔄 Χρειάζεται διόρθωση.",
      time:new Date().toLocaleTimeString("el",{hour:"2-digit",minute:"2-digit"})}]);
  };

  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      <div style={{overflowY:"auto",padding:"10px 0",display:"flex",flexDirection:"column",gap:10,maxHeight:320}}>
        {messages.length===0&&<div style={{textAlign:"center",color:T.muted,fontSize:12,padding:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ξεκινήστε τη συζήτηση! 💬</div>}
        {messages.map(m=>{
          const isMe=m.from===user.id;
          const sender=USERS.find(u=>u.id===m.from);
          return (
            <div key={m.id}>
              <div style={{display:"flex",flexDirection:isMe?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                {!isMe&&<div style={{width:24,height:24,borderRadius:"50%",background:`linear-gradient(135deg,${MINT},${MINT3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"white",flexShrink:0}}>{sender?.avatar}</div>}
                <div style={{maxWidth:"80%"}}>
                  <div style={{background:isMe?`linear-gradient(135deg,${MINT},${MINT3})`:T.card,border:isMe?"none":`1px solid ${T.border}`,borderRadius:isMe?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"8px 12px"}}>
                    <div style={{fontSize:13,color:isMe?"white":T.text,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.5}}>{m.text}</div>
                    {m.media&&m.media.length>0&&(
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                        {m.media.map((med,mi)=>(
                          <div key={mi} style={{width:100,borderRadius:10,overflow:"hidden",border:`1px solid ${isMe?"rgba(255,255,255,0.25)":T.border}`,background:isMe?"rgba(0,0,0,0.15)":T.faint}}>
                            <div style={{height:60,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{med.type==="photo"?"📷":"🎥"}</div>
                            <div style={{padding:"4px 6px",fontSize:9,color:isMe?"rgba(255,255,255,0.8)":T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{med.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.awaitAction==="pending"&&<div style={{marginTop:8,padding:"6px 8px",background:"rgba(245,158,11,0.15)",borderRadius:8}}><div style={{fontSize:10,color:"#F59E0B",fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⏳ Αναμονή απάντησης γιατρού</div></div>}
                    {m.awaitAction==="proceed"&&<div style={{marginTop:8,padding:"6px 8px",background:"rgba(52,211,153,0.15)",borderRadius:8}}><div style={{fontSize:10,color:"#34D399",fontWeight:700}}>✅ Εγκρίθηκε — Προχώρα</div></div>}
                    {m.awaitAction==="fix"&&<div style={{marginTop:8,padding:"6px 8px",background:"rgba(248,113,113,0.15)",borderRadius:8}}><div style={{fontSize:10,color:"#F87171",fontWeight:700}}>🔄 Χρειάζεται διόρθωση</div></div>}
                  </div>
                  <div style={{fontSize:10,color:T.muted,marginTop:3,textAlign:isMe?"right":"left",fontFamily:"'DM Mono',monospace"}}>{m.time}</div>
                </div>
              </div>
              {m.awaitAction==="pending"&&!isMe&&user.role==="doctor"&&(
                <div style={{display:"flex",gap:8,marginTop:6,marginLeft:32}}>
                  <button onClick={()=>respond(m.id,"proceed")} style={{flex:1,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:10,padding:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span>✅</span><span style={{fontSize:12,fontWeight:700,color:"#34D399",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Προχώρα</span>
                  </button>
                  <button onClick={()=>respond(m.id,"fix")} style={{flex:1,background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:10,padding:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span>🔄</span><span style={{fontSize:12,fontWeight:700,color:"#F87171",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Διόρθωσε</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>

      {attachments.length>0&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"8px 0",borderTop:`1px solid ${T.border}`}}>
          {attachments.map((att,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 8px"}}>
              <span style={{fontSize:12}}>{att.type==="photo"?"📷":"🎥"}</span>
              <span style={{fontSize:10,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{att.label}</span>
              <button onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12}}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:6,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,position:"relative"}}>
        <button onClick={()=>setShowAttach(!showAttach)} style={{width:40,height:40,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,flexShrink:0}}>📎</button>
        {showAttach&&(
          <div style={{position:"absolute",bottom:48,left:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:6,display:"flex",flexDirection:"column",gap:2,zIndex:20,boxShadow:"0 8px 30px rgba(0,0,0,0.3)",minWidth:160}}>
            {[{type:"photo",label:"📷 Φωτογραφία"},{type:"video",label:"🎥 Βίντεο"}].map(opt=>(
              <button key={opt.type} onClick={()=>{setAttachments(prev=>[...prev,{type:opt.type,label:`${opt.label.split(" ")[1]} ${prev.length+1}`}]);setShowAttach(false);}}
                style={{background:"none",border:"none",color:T.text,cursor:"pointer",padding:"10px 14px",borderRadius:10,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,textAlign:"left"}}>{opt.label}</button>
            ))}
            <div style={{height:1,background:T.border,margin:"2px 8px"}}/>
            <button onClick={()=>setShowAttach(false)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",padding:"8px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12}}>Ακύρωση</button>
          </div>
        )}
        <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Γράψε μήνυμα…"
          style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
        {isLabSide&&(
          <button onClick={()=>send({await:true})} title="Αποστολή & αναμονή απάντησης"
            style={{width:40,height:40,borderRadius:10,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",cursor:"pointer",fontSize:14,flexShrink:0}}>⏳</button>
        )}
        <button onClick={()=>send()} style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${MINT},${MINT3})`,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROLE SELECTION (Onboarding — πρώτη φορά μόνο)
// ═══════════════════════════════════════════════════════════════════
const ROLE_OPTIONS = [
  { id:"lab",        icon:"🦷", title:"Οδοντοτεχνικό Εργαστήριο", desc:"Διαχείριση εργασιών, τιμολόγια, ομάδα, οικονομικά", perks:["Απεριόριστες εργασίες","Analytics & οικονομικά","Διαχείριση τεχνιτών"], badge:"Συνδρομή PRO", badgeColor:"#3ECFB2" },
  { id:"doctor",     icon:"👨‍⚕️", title:"Οδοντίατρος / Ιατρείο",   desc:"Αποστολή εντολών, παρακολούθηση, έγκριση κοστολογίων", perks:["Νέες εντολές με οδοντόγραμμα","Real-time παρακολούθηση","Ιστορικό ασθενών"], badge:"Συνδρομή PRO", badgeColor:"#A78BFA" },
  { id:"technician", icon:"🔧", title:"Τεχνίτης Εργαστηρίου",      desc:"Καταγραφή σταδίων, παρακολούθηση κομισιόν", perks:["Ανάθεση εργασιών","Καταγραφή σταδίων","Παρακολούθηση κομισιόν"], badge:"Μέσω εργαστηρίου", badgeColor:"#60A5FA" },
  { id:"student",    icon:"🎓", title:"Φοιτητής / Μαθητής",        desc:"Προσωπικό σημειωματάριο προόδου — δωρεάν για πάντα", perks:["Καταγραφή καθημερινής εργασίας","Στατιστικά μάθησης","Δωρεάν πρόσβαση"], badge:"ΔΩΡΕΑΝ", badgeColor:"#FBBF24" },
];

function RoleSelect({ email, onPick, T }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{minHeight:"100vh",background:T.bg,padding:"40px 20px",maxWidth:430,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <Logo size={48} showText={false} T={T}/>
        <div style={{fontSize:22,fontWeight:800,color:T.text,marginTop:14,letterSpacing:"-0.04em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Καλώς ήρθες στο MeddA!</div>
        <div style={{fontSize:13,color:T.muted,marginTop:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Συνδεδεμένο ως <span style={{color:MINT,fontFamily:"'DM Mono',monospace"}}>{email}</span></div>
        <div style={{fontSize:13,color:T.text,marginTop:14,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Τι είσαι; (επιλέγεται μία φορά)</div>
      </div>

      {ROLE_OPTIONS.map(role=>(
        <button key={role.id} onClick={()=>setSelected(role.id)}
          style={{width:"100%",background:selected===role.id?`rgba(62,207,178,0.08)`:T.card,border:`2px solid ${selected===role.id?MINT:T.border}`,borderRadius:16,padding:"16px",marginBottom:10,cursor:"pointer",textAlign:"left",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all .15s"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
            <div style={{width:46,height:46,borderRadius:13,background:`${role.badgeColor}1A`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{role.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                <span style={{fontSize:15,fontWeight:800,color:selected===role.id?MINT:T.text}}>{role.title}</span>
                <span style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:`${role.badgeColor}22`,color:role.badgeColor,fontWeight:800,letterSpacing:"0.03em"}}>{role.badge}</span>
              </div>
              <div style={{fontSize:11,color:T.muted,marginBottom:8,lineHeight:1.4}}>{role.desc}</div>
              {selected===role.id&&(
                <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
                  {role.perks.map((p,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.text}}>
                      <span style={{color:MINT}}>✓</span>{p}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selected===role.id&&<span style={{color:MINT,fontSize:20}}>●</span>}
          </div>
        </button>
      ))}

      <button onClick={()=>selected&&onPick(selected)} disabled={!selected}
        style={{width:"100%",marginTop:8,background:selected?`linear-gradient(135deg,${MINT},${MINT3})`:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:14,padding:15,fontSize:14,fontWeight:800,cursor:selected?"pointer":"default",opacity:selected?1:0.4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        Συνέχεια →
      </button>
      <div style={{textAlign:"center",marginTop:14,fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        Ο ρόλος συνδέεται μόνιμα με το email σου
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STUDENT NOTEBOOK — Δωρεάν progress log (ξεχωριστή εμπειρία)
// ═══════════════════════════════════════════════════════════════════
const STUDENT_CATS = [
  { id:"fixed",       label:"Ακίνητη",     icon:"🦷", color:"#3ECFB2", stages:["Αποτύπωμα","Εκμαγείο","CAD/Wax-up","Κατασκευή","Φινίρισμα"] },
  { id:"removable",   label:"Κινητή",      icon:"🫧", color:"#A78BFA", stages:["Αποτύπωμα","Ατομικό δοχείο","Σύγκλειση","Δοκιμή κερί","Τελική κατασκευή"] },
  { id:"orthodontic", label:"Ορθοδοντική", icon:"🔧", color:"#FBBF24", stages:["Αποτύπωμα","Σχεδιασμός","Κάμψη σύρματος","Συναρμολόγηση","Φινίρισμα"] },
];

function StudentNotebook({ user, T }) {
  const [tab, setTab] = useState("today");
  const [entries, setEntries] = useState([
    { id:"e1", date:new Date().toISOString().split("T")[0], category:"fixed",       stage:"CAD/Wax-up",   note:"Κέρωσα στεφάνη #11, δυσκολεύτηκα στο φύμα", mins:90 },
    { id:"e2", date:new Date(Date.now()-86400000).toISOString().split("T")[0], category:"removable", stage:"Δοκιμή κερί", note:"Ολική άνω — τοποθέτηση δοντιών", mins:120 },
    { id:"e3", date:new Date(Date.now()-86400000).toISOString().split("T")[0], category:"fixed",      stage:"Αποτύπωμα",  note:"Εξάσκηση σε αλγινικό", mins:45 },
    { id:"e4", date:new Date(Date.now()-3*86400000).toISOString().split("T")[0], category:"orthodontic", stage:"Κάμψη σύρματος", note:"Πρώτη φορά clasp — χρειάζεται εξάσκηση", mins:60 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ category:"", stage:"", note:"", mins:"" });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter(e=>e.date===todayStr);
  const catObj = c => STUDENT_CATS.find(x=>x.id===c);

  // Stats
  const totalEntries = entries.length;
  const totalMins = entries.reduce((s,e)=>s+e.mins,0);
  const catCounts = {};
  entries.forEach(e=>{catCounts[e.category]=(catCounts[e.category]||0)+1;});
  const stageCounts = {};
  entries.forEach(e=>{const k=`${e.category}|${e.stage}`;stageCounts[k]=(stageCounts[k]||0)+1;});

  const addEntry = () => {
    if(!draft.category||!draft.stage) return;
    setEntries(prev=>[{id:`e${Date.now()}`,date:todayStr,category:draft.category,stage:draft.stage,note:draft.note,mins:parseInt(draft.mins)||0},...prev]);
    setDraft({category:"",stage:"",note:"",mins:""});
    setShowAdd(false);
  };

  // group by date
  const byDate = {};
  entries.forEach(e=>{if(!byDate[e.date])byDate[e.date]=[];byDate[e.date].push(e);});
  const dates = Object.keys(byDate).sort().reverse();
  const fmtDate = d => {
    if(d===todayStr) return "Σήμερα";
    if(d===new Date(Date.now()-86400000).toISOString().split("T")[0]) return "Χθες";
    return new Date(d).toLocaleDateString("el",{weekday:"long",day:"numeric",month:"long"});
  };

  return (
    <div style={{padding:"20px 16px 110px"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#FBBF24,#F59E0B)",borderRadius:20,padding:"18px",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.12)"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🎓 Σημειωματάριο Μάθησης</div>
          <div style={{fontSize:20,fontWeight:800,color:"white",marginTop:4,letterSpacing:"-0.03em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{user.name}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{user.specialty}</div>
          <div style={{display:"inline-block",marginTop:10,fontSize:10,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.25)",color:"white",fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>ΔΩΡΕΑΝ ΓΙΑ ΦΟΙΤΗΤΕΣ ✨</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:3,background:T.faint,borderRadius:12,padding:4,marginBottom:16}}>
        {[{k:"today",l:"📝 Καταγραφή"},{k:"log",l:"📓 Ημερολόγιο"},{k:"stats",l:"📊 Πρόοδος"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,background:tab===t.k?T.surface:"transparent",border:"none",color:tab===t.k?T.text:T.muted,borderRadius:9,padding:"9px 4px",fontSize:12,fontWeight:tab===t.k?700:400,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{t.l}</button>
        ))}
      </div>

      {/* TAB: TODAY */}
      {tab==="today"&&(
        <div>
          <button onClick={()=>setShowAdd(!showAdd)} style={{width:"100%",background:`linear-gradient(135deg,#FBBF24,#F59E0B)`,border:"none",color:"white",borderRadius:14,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:16,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {showAdd?"✕ Κλείσιμο":"+ Τι έκανα σήμερα;"}
          </button>

          {showAdd&&(
            <div style={{background:T.card,border:`1px solid #FBBF2444`,borderRadius:16,padding:"16px",marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Κατηγορία εργασίας</div>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                {STUDENT_CATS.map(c=>(
                  <button key={c.id} onClick={()=>setDraft(p=>({...p,category:c.id,stage:""}))} style={{flex:1,background:draft.category===c.id?`${c.color}1A`:T.surface,border:`1.5px solid ${draft.category===c.id?c.color:T.border}`,borderRadius:12,padding:"12px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <span style={{fontSize:22}}>{c.icon}</span>
                    <span style={{fontSize:11,fontWeight:700,color:draft.category===c.id?c.color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.label}</span>
                  </button>
                ))}
              </div>

              {draft.category&&(
                <>
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σε ποιο στάδιο;</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                    {catObj(draft.category).stages.map(st=>(
                      <button key={st} onClick={()=>setDraft(p=>({...p,stage:st}))} style={{background:draft.stage===st?`${catObj(draft.category).color}1A`:T.surface,border:`1px solid ${draft.stage===st?catObj(draft.category).color:T.border}`,borderRadius:20,padding:"7px 12px",fontSize:12,fontWeight:draft.stage===st?700:400,color:draft.stage===st?catObj(draft.category).color:T.text,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{st}</button>
                    ))}
                  </div>
                </>
              )}

              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σημείωση (προαιρετικά)</div>
              <textarea value={draft.note} onChange={e=>setDraft(p=>({...p,note:e.target.value}))} placeholder="Τι έμαθα, τι δυσκολεύτηκα…" style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",resize:"none",minHeight:60,marginBottom:12,boxSizing:"border-box"}}/>

              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⏱ Λεπτά:</div>
                <input type="number" value={draft.mins} onChange={e=>setDraft(p=>({...p,mins:e.target.value}))} placeholder="π.χ. 90" style={{width:90,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:13,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
              </div>

              <button onClick={addEntry} disabled={!draft.category||!draft.stage} style={{width:"100%",background:(draft.category&&draft.stage)?`linear-gradient(135deg,#FBBF24,#F59E0B)`:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:12,padding:13,fontSize:13,fontWeight:800,cursor:"pointer",opacity:(draft.category&&draft.stage)?1:0.4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Καταχώριση</button>
            </div>
          )}

          {/* Today's entries */}
          <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σήμερα ({todayEntries.length})</div>
          {todayEntries.length===0&&<div style={{textAlign:"center",padding:30,color:T.muted,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Δεν έχεις καταγράψει τίποτα σήμερα.<br/>Πάτα "+" για να ξεκινήσεις!</div>}
          {todayEntries.map(e=>{
            const c=catObj(e.category);
            return (
              <div key={e.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px 14px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:e.note?8:0}}>
                  <div style={{width:34,height:34,borderRadius:10,background:`${c.color}1A`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{e.stage}</div>
                    <div style={{fontSize:11,color:c.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.label}{e.mins>0&&<span style={{color:T.muted}}> · {e.mins}′</span>}</div>
                  </div>
                </div>
                {e.note&&<div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.5,paddingLeft:44}}>"{e.note}"</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: LOG (full diary) */}
      {tab==="log"&&(
        <div>
          {dates.map(date=>(
            <div key={date} style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:800,color:date===todayStr?MINT:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif",textTransform:"capitalize"}}>{fmtDate(date)}</div>
                <div style={{flex:1,height:1,background:T.border}}/>
                <div style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{byDate[date].reduce((s,e)=>s+e.mins,0)}′</div>
              </div>
              {byDate[date].map(e=>{
                const c=catObj(e.category);
                return (
                  <div key={e.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 13px",marginBottom:6,marginLeft:8,borderLeft:`3px solid ${c.color}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:14}}>{c.icon}</span>
                      <span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{e.stage}</span>
                      <span style={{fontSize:10,color:c.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.label}</span>
                    </div>
                    {e.note&&<div style={{fontSize:11,color:T.muted,marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>"{e.note}"</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* TAB: STATS */}
      {tab==="stats"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <div style={{background:T.card,border:"1px solid rgba(251,191,36,0.25)",borderRadius:16,padding:"16px"}}>
              <div style={{fontSize:10,color:"#FBBF24",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σύνολο Εργασιών</div>
              <div style={{fontSize:30,fontWeight:800,color:T.text,fontFamily:"'DM Mono',monospace"}}>{totalEntries}</div>
            </div>
            <div style={{background:T.card,border:"1px solid rgba(62,207,178,0.25)",borderRadius:16,padding:"16px"}}>
              <div style={{fontSize:10,color:MINT,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ώρες Εξάσκησης</div>
              <div style={{fontSize:30,fontWeight:800,color:MINT,fontFamily:"'DM Mono',monospace"}}>{(totalMins/60).toFixed(1)}</div>
            </div>
          </div>

          {/* Per category */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📊 Εμπειρία ανά Κατηγορία</div>
            {STUDENT_CATS.map(c=>{
              const cnt=catCounts[c.id]||0;
              const max=Math.max(...Object.values(catCounts),1);
              return (
                <div key={c.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.icon} {c.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:c.color,fontFamily:"'DM Mono',monospace"}}>{cnt}×</span>
                  </div>
                  <div style={{height:6,background:T.faint,borderRadius:3}}><div style={{height:"100%",width:`${(cnt/max)*100}%`,background:c.color,borderRadius:3}}/></div>
                </div>
              );
            })}
          </div>

          {/* Per stage */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🎯 Στάδια που έκανα</div>
            {Object.entries(stageCounts).sort((a,b)=>b[1]-a[1]).map(([key,cnt])=>{
              const [cat,stage]=key.split("|");
              const c=catObj(cat);
              return (
                <div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:13}}>{c.icon}</span>
                  <span style={{flex:1,fontSize:12,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{stage}</span>
                  <span style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.label}</span>
                  <span style={{fontSize:12,fontWeight:700,color:c.color,fontFamily:"'DM Mono',monospace",minWidth:24,textAlign:"right"}}>{cnt}×</span>
                </div>
              );
            })}
          </div>

          {/* Upgrade prompt */}
          <div style={{background:"rgba(62,207,178,0.06)",border:"1px solid rgba(62,207,178,0.2)",borderRadius:16,padding:"16px"}}>
            <div style={{fontSize:13,fontWeight:800,color:MINT,marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🚀 Αποφοίτησες;</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Όταν ξεκινήσεις να εργάζεσαι, αναβάθμισε σε επαγγελματικό λογαριασμό και κράτα όλο το ιστορικό σου. Το προφίλ σου μεταφέρεται αυτόματα.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════
function Login({ onLogin, onNewAccount, T, isDark }) {
  const labUsers = USERS.filter(u=>u.role==="lab");
  const docUsers = USERS.filter(u=>u.role==="doctor");

  const UserBtn = ({ u }) => {
    const badge = ROLE_BADGE[u.role]||ROLE_BADGE.doctor;
    const avatarBg = u.role==="student" ? "linear-gradient(135deg,#FBBF24,#F59E0B)"
                   : u.role==="technician"?"linear-gradient(135deg,#60A5FA,#3B82F6)"
                   : `linear-gradient(135deg,${MINT},${MINT3})`;
    const small = u.role==="technician"||u.role==="student";
    return (
      <button onClick={()=>onLogin(u)}
        style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:small?"10px 14px":"14px 16px",marginBottom:small?6:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
        onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
        <div style={{width:small?30:36,height:small?30:36,borderRadius:"50%",background:avatarBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:small?13:16,fontWeight:800,color:"white",flexShrink:0}}>{u.avatar}</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:small?13:14,fontWeight:700,color:T.text}}>{u.name}</div>
          <div style={{fontSize:10,color:T.muted,marginTop:1}}>{u.email}</div>
          {small&&u.specialty&&<div style={{fontSize:9,color:badge.color,marginTop:1}}>{u.specialty}</div>}
        </div>
        <span style={{fontSize:9,padding:"3px 8px",borderRadius:20,background:badge.bg,color:badge.color,fontWeight:700,flexShrink:0}}>{badge.label}</span>
      </button>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:-100,right:-100,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(62,207,178,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <Logo size={60} showText={false} T={T}/>
        <div style={{marginTop:14}}>
          <div style={{fontSize:36,fontWeight:800,letterSpacing:"-0.05em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Medd<span style={{color:MINT}}>A</span></div>
          <div style={{fontSize:13,color:T.muted,marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εργαστήριο · Οδοντίατρος · Σύνδεση</div>
        </div>
      </div>
      <div style={{width:"100%",maxWidth:380}}>
        {labUsers.map(lab=>{
          const techs = USERS.filter(u=>(u.role==="technician"||u.role==="student")&&u.labId===lab.id);
          return (
            <div key={lab.id} style={{marginBottom:16}}>
              <UserBtn u={lab}/>
              {techs.length>0&&(
                <div style={{marginLeft:16,paddingLeft:12,borderLeft:"2px solid rgba(62,207,178,0.2)"}}>
                  <div style={{fontSize:9,color:MINT,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Τεχνίτες & Μαθητές</div>
                  {techs.map(t=><UserBtn key={t.id} u={t}/>)}
                </div>
              )}
            </div>
          );
        })}
        <div style={{height:1,background:T.border,margin:"8px 0 14px"}}/>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Οδοντίατροι</div>
        {docUsers.map(u=><UserBtn key={u.id} u={u}/>)}
        <div style={{height:1,background:T.border,margin:"14px 0"}}/>
        <button onClick={onNewAccount} style={{width:"100%",background:`rgba(62,207,178,0.08)`,border:`1px dashed ${MINT}`,borderRadius:14,padding:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span style={{fontSize:13,fontWeight:700,color:MINT}}>Νέος λογαριασμός με Google →</span>
        </button>
        <div style={{textAlign:"center",marginTop:14,fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Demo mode — δοκίμασε το onboarding με "Νέος λογαριασμός"</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ODONTOGRAM PAGE (4-step smart form)
// ═══════════════════════════════════════════════════════════════════
function OdontogramPage({ user, orders, setOrders, T }) {
  const [step, setStep]             = useState(1);
  const [category, setCategory]     = useState(null);
  const [workType, setWorkType]     = useState("");
  const [subType, setSubType]       = useState("");
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [material, setMaterial]     = useState("");
  const [shade, setShade]           = useState("");
  const [patient, setPatient]       = useState("");
  const [notes, setNotes]           = useState("");
  const [success, setSuccess]       = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [delivDate, setDelivDate]   = useState(()=>{const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split("T")[0];});

  const toggleTooth = t => setSelectedTeeth(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]);
  const mats = category==="fixed"?FIXED_MATS:category==="removable"?REMOVABLE_MATS:ORTHO_MATS;
  const needsTeeth = category==="fixed"||(category==="removable"&&REMOVABLE_TYPES.find(r=>r.label===workType)?.needsTeeth)||category==="orthodontic";
  const canNext = s=>{
    if(s===1) return !!category;
    if(s===2) return !!workType&&(!(REMOVABLE_TYPES.find(r=>r.label===workType)?.subs)||!!subType);
    if(s===3) return !!patient&&(!needsTeeth||selectedTeeth.length>0);
    return !!material;
  };

  const submit = () => {
    const toothStr = selectedTeeth.sort((a,b)=>parseInt(a)-parseInt(b)).join(", ");
    const typeLabel = subType?`${workType} — ${subType}`:workType;
    const newOrder = {
      id:`MD-0${Date.now()%1000}`,patient,doctorId:user.role==="doctor"?user.id:"u2",labId:"u1",
      tooth:toothStr,workType,material,shade,category,
      type:toothStr?`${typeLabel} #${toothStr}`:typeLabel,
      status:"pending",delivery:new Date(delivDate).toISOString(),workflowStep:0,
      stages:getStages(category,workType,subType),
      items:[{desc:`${typeLabel}${material?` — ${material}`:""}${toothStr?` #${toothStr}`:""}`,qty:Math.max(selectedTeeth.length,1),price:95}],
      notes,approved:false,doctorComment:"",chat:[],
    };
    setOrders(prev=>[...prev,newOrder]);
    setStep(1);setCategory(null);setWorkType("");setSubType("");setSelectedTeeth([]);setMaterial("");setShade("");setPatient("");setNotes("");
    const d=new Date();d.setDate(d.getDate()+7);setDelivDate(d.toISOString().split("T")[0]);
    setSuccess(true);setTimeout(()=>setSuccess(false),3000);
  };

  const OptBtn = ({label,icon,selected,onClick,sub}) => (
    <button onClick={onClick}
      style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${selected?MINT:T.border}`,background:selected?"rgba(62,207,178,0.1)":T.card,color:selected?MINT:T.text,fontSize:13,fontWeight:selected?700:400,cursor:"pointer",textAlign:"left",fontFamily:"'Plus Jakarta Sans',sans-serif",width:"100%",boxSizing:"border-box",marginBottom:6}}>
      {icon&&<span style={{fontSize:16,flexShrink:0,width:24,textAlign:"center"}}>{icon}</span>}
      <div style={{flex:1}}>
        <div>{selected?"✓ ":""}{label}</div>
        {sub&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>{sub}</div>}
      </div>
    </button>
  );

  const SL = ({text}) => <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{text}</div>;

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📋 Νέα Εντολή Εργασίας</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:16,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>4 βήματα — Κατηγορία → Τύπος → Δόντια/Ασθενής → Υλικό</div>
      <div style={{display:"flex",gap:3,marginBottom:20}}>
        {[1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:step>=i?MINT:T.border,transition:"background .3s"}}/>)}
      </div>
      {success&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}><span>✅</span><span style={{fontSize:13,fontWeight:700,color:"#34D399",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εντολή καταχωρήθηκε!</span></div>}

      {/* STEP 1 — Category */}
      {step===1&&(
        <div>
          <SL text="Κατηγορία Εργασίας"/>
          {PROSTH_CATS.map(cat=>(
            <button key={cat.id} onClick={()=>{setCategory(cat.id);setWorkType("");setSubType("");}}
              style={{display:"flex",alignItems:"center",gap:14,padding:"16px",borderRadius:14,border:`2px solid ${category===cat.id?MINT:T.border}`,background:category===cat.id?"rgba(62,207,178,0.08)":T.card,cursor:"pointer",textAlign:"left",width:"100%",boxSizing:"border-box",marginBottom:10}}>
              <span style={{fontSize:28}}>{cat.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800,color:category===cat.id?MINT:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cat.label}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cat.desc}</div>
              </div>
              {category===cat.id&&<span style={{color:MINT,fontSize:18}}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* STEP 2 — Work type */}
      {step===2&&category==="fixed"&&(<div><SL text="Τύπος Εργασίας"/>{FIXED_TYPES.map(ft=><OptBtn key={ft.label} label={ft.label} icon={ft.icon} selected={workType===ft.label} onClick={()=>setWorkType(ft.label)}/>)}</div>)}
      {step===2&&category==="removable"&&(
        <div>
          <SL text="Τύπος Κινητής"/>
          {REMOVABLE_TYPES.map(rt=>(
            <div key={rt.key}>
              <OptBtn label={rt.label} icon={rt.icon} selected={workType===rt.label} onClick={()=>{setWorkType(rt.label);setSubType("");}}/>
              {workType===rt.label&&rt.subs&&(
                <div style={{marginLeft:20,borderLeft:"2px solid rgba(62,207,178,0.25)",paddingLeft:12,marginBottom:6}}>
                  {rt.subs.map(st=><OptBtn key={st.key} label={st.label} selected={subType===st.label} onClick={()=>setSubType(st.label)}/>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {step===2&&category==="orthodontic"&&(<div><SL text="Τύπος Ορθοδοντικού"/>{ORTHO_TYPES.map(ot=><OptBtn key={ot.label} label={ot.label} icon={ot.icon} selected={workType===ot.label} onClick={()=>setWorkType(ot.label)}/>)}</div>)}

      {/* STEP 3 — Patient + Teeth + Dates */}
      {step===3&&(
        <div>
          <SL text="Ασθενής"/>
          <input value={patient} onChange={e=>setPatient(e.target.value)} placeholder="Όνομα ασθενή…"
            style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,outline:"none",marginBottom:16,fontFamily:"'Plus Jakarta Sans',sans-serif",boxSizing:"border-box"}}/>
          {needsTeeth&&(
            <>
              <SL text="Επιλογή Δοντιών"/>
              <Odontogram onSelect={toggleTooth} selectedTeeth={selectedTeeth} orders={[]} T={T}/>
              {selectedTeeth.length>0&&(
                <div style={{marginTop:10,background:T.card,border:"1px solid rgba(62,207,178,0.25)",borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{selectedTeeth.length} δόντι{selectedTeeth.length>1?"α":""}</div>
                    <div style={{fontSize:11,color:MINT,fontFamily:"'DM Mono',monospace"}}>#{selectedTeeth.sort((a,b)=>parseInt(a)-parseInt(b)).join(", #")}</div>
                  </div>
                  <button onClick={()=>setSelectedTeeth([])} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"6px 10px",fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Καθαρισμός</button>
                </div>
              )}
            </>
          )}
          <div style={{marginTop:16}}>
            <SL text="Ημερομηνία Παράδοσης"/>
            <input type="date" value={delivDate} onChange={e=>setDelivDate(e.target.value)}
              style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginTop:12}}>
            <SL text="Σημειώσεις"/>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ειδικές οδηγίες…"
              style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",resize:"none",minHeight:60,boxSizing:"border-box"}}/>
          </div>
        </div>
      )}

      {/* STEP 4 — Material + VITA */}
      {step===4&&(
        <div>
          <SL text="Υλικό Κατασκευής"/>
          {mats.map(m=><OptBtn key={m} label={m} selected={material===m} onClick={()=>setMaterial(m)}/>)}
          <div style={{marginTop:16}}><SL text="Χρώμα VITA Classic (προαιρετικά)"/><VitaSelector value={shade} onChange={setShade} T={T}/></div>
          {material&&(
            <div style={{marginTop:16,padding:"14px",background:"rgba(62,207,178,0.06)",border:"1px solid rgba(62,207,178,0.2)",borderRadius:14}}>
              <div style={{fontSize:13,fontWeight:800,color:MINT,marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📋 Σύνοψη</div>
              <div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:2}}>
                Κατηγορία: <span style={{color:T.text,fontWeight:600}}>{PROSTH_CATS.find(c=>c.id===category)?.label}</span><br/>
                Εργασία: <span style={{color:T.text,fontWeight:600}}>{subType?`${workType} — ${subType}`:workType}</span><br/>
                Ασθενής: <span style={{color:T.text,fontWeight:600}}>{patient}</span><br/>
                {selectedTeeth.length>0&&<>Δόντια: <span style={{color:MINT,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>#{selectedTeeth.sort((a,b)=>parseInt(a)-parseInt(b)).join(", #")}</span><br/></>}
                Υλικό: <span style={{color:T.text,fontWeight:600}}>{material}</span><br/>
                {shade&&<>Χρώμα VITA: <span style={{color:T.text,fontWeight:600}}>{shade}</span><br/></>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{display:"flex",gap:10,marginTop:20}}>
        {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:T.faint,border:`1px solid ${T.border}`,color:T.text,borderRadius:12,padding:13,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Πίσω</button>}
        {step<4&&<button onClick={()=>{if(canNext(step))setStep(s=>s+1);}} style={{flex:2,background:canNext(step)?`linear-gradient(135deg,${MINT},${MINT3})`:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:12,padding:13,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:canNext(step)?1:.4}}>Επόμενο →</button>}
        {step===4&&<button onClick={()=>{if(material)submit();}} style={{flex:2,background:material?`linear-gradient(135deg,${MINT},${MINT3})`:"rgba(255,255,255,0.1)",border:"none",color:"white",borderRadius:12,padding:13,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:material?1:.4}}>✓ Ολοκλήρωση</button>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PHOTO ANNOTATIONS — Doctor/lab marks points on a photo with comments
// ═══════════════════════════════════════════════════════════════════
const ANNOT_COLORS = ["#EF4444","#FBBF24","#3ECFB2","#60A5FA","#FFFFFF"];

function PhotoAnnotations({ order, user, setOrders, T }) {
  const [color, setColor] = useState("#EF4444");
  const [pending, setPending] = useState(null);
  const [noteText, setNoteText] = useState("");
  const imgRef = useRef(null);
  const marks = order.annotations || [];

  const addMark = e => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX-rect.left)/rect.width)*100;
    const y = ((e.clientY-rect.top)/rect.height)*100;
    setPending({ x, y, color });
  };
  const saveNote = () => {
    if (noteText.trim()) {
      const mark = { id:Date.now(), ...pending, note:noteText, by:user.id };
      setOrders(prev=>prev.map(o=>o.id===order.id?{...o,annotations:[...(o.annotations||[]),mark]}:o));
    }
    setPending(null); setNoteText("");
  };
  const removeMark = id => setOrders(prev=>prev.map(o=>o.id===order.id?{...o,annotations:(o.annotations||[]).filter(m=>m.id!==id)}:o));

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
        <span style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Χρώμα:</span>
        {ANNOT_COLORS.map(c=>(
          <button key={c} onClick={()=>setColor(c)} style={{width:24,height:24,borderRadius:"50%",background:c,border:color===c?"3px solid "+T.text:"2px solid "+T.border,cursor:"pointer"}}/>
        ))}
      </div>

      <div ref={imgRef} onClick={addMark} style={{position:"relative",width:"100%",aspectRatio:"4/3",borderRadius:16,overflow:"hidden",cursor:"crosshair",background:"linear-gradient(135deg,#2a3f3a,#1a2826)",border:`1px solid ${T.border}`}}>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="120" height="150" viewBox="0 0 120 150">
            <path d="M30 50 Q30 20 60 18 Q90 20 90 50 Q90 100 75 130 Q60 145 45 130 Q30 100 30 50 Z" fill="#f0ebe0" stroke="#d0c8b8" strokeWidth="2"/>
            <path d="M45 45 Q60 40 75 45" stroke="#d8d0c0" strokeWidth="1.5" fill="none" opacity="0.6"/>
          </svg>
        </div>
        <div style={{position:"absolute",bottom:8,left:8,fontSize:9,color:"rgba(255,255,255,0.6)",background:"rgba(0,0,0,0.4)",padding:"3px 8px",borderRadius:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📷 {order.type}</div>
        {marks.map((m,i)=>(
          <div key={m.id} style={{position:"absolute",left:`${m.x}%`,top:`${m.y}%`,transform:"translate(-50%,-50%)"}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,border:"2px solid white",boxShadow:"0 2px 6px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#000"}}>{i+1}</div>
          </div>
        ))}
        {pending&&<div style={{position:"absolute",left:`${pending.x}%`,top:`${pending.y}%`,transform:"translate(-50%,-50%)"}}><div style={{width:20,height:20,borderRadius:"50%",background:pending.color,border:"2px solid white"}}/></div>}
        <div style={{position:"absolute",top:8,right:8,fontSize:9,color:"white",background:"rgba(0,0,0,0.5)",padding:"4px 8px",borderRadius:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>👆 Πάτα για σχόλιο</div>
      </div>

      {pending&&(
        <div style={{background:T.card,border:`1px solid ${pending.color}`,borderRadius:14,padding:"14px",marginTop:12}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8,display:"flex",alignItems:"center",gap:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}><div style={{width:12,height:12,borderRadius:"50%",background:pending.color}}/>Νέο σχόλιο</div>
          <input autoFocus value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveNote()} placeholder="π.χ. Πιο ανοιχτό χρώμα εδώ…" style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,outline:"none",marginBottom:10,boxSizing:"border-box",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setPending(null);setNoteText("");}} style={{flex:1,background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:10,padding:9,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ακύρωση</button>
            <button onClick={saveNote} style={{flex:2,background:`linear-gradient(135deg,${MINT},${MINT3})`,border:"none",color:"white",borderRadius:10,padding:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Προσθήκη</button>
          </div>
        </div>
      )}

      <div style={{marginTop:16}}>
        <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σχόλια ({marks.length})</div>
        {marks.length===0&&<div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Κανένα σχόλιο ακόμα. Πάτα πάνω στη φωτό για να προσθέσεις.</div>}
        {marks.map((m,i)=>{
          const author=USERS.find(u=>u.id===m.by);
          return (
            <div key={m.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#000",flexShrink:0}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{m.note}</div>
                {author&&<div style={{fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>— {author.name}</div>}
              </div>
              <button onClick={()=>removeMark(m.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ORDER DETAIL
// ═══════════════════════════════════════════════════════════════════
function Detail({ user, order, onBack, onApprove, setOrders, profile, T }) {
  const [tab, setTab]       = useState("stages");
  const [comment, setComment] = useState("");
  const doctor = USERS.find(u=>u.id===order.doctorId);
  const lab    = USERS.find(u=>u.id===order.labId);
  const n      = netTotal(order.items);
  const isLab  = user.role==="lab"||user.role==="technician"||user.role==="student";

  const markDone = idx => {
    setOrders(prev=>prev.map(o=>{
      if(o.id!==order.id) return o;
      const newStages = o.stages.map((s,i)=>i===idx?{...s,done:true,date:new Date().toLocaleDateString("el",{day:"2-digit",month:"2-digit"}),technicianId:isLab?user.id:s.technicianId}:s);
      const allDone = newStages.every(s=>s.done);
      return{...o,stages:newStages,workflowStep:newStages.filter(s=>s.done).length,status:allDone?"waiting_approval":o.status};
    }));
  };

  const shadeColor = order.shade ? Object.values(VITA_SHADES).find(v=>v.shades.includes(order.shade))?.color||"#E8D5B0" : null;

  // ── Επεξεργασία στοιχείων + ιστορικό + κλείδωμα κρίσιμων αλλαγών ──
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ shade:order.shade||"", material:order.material||"", measurements:order.measurements||"", notes:order.notes||"" });
  const [confirmCritical, setConfirmCritical] = useState(null);
  const FIELD_LABELS = { shade:"Απόχρωση", material:"Υλικό", measurements:"Μέτρα/Διαστάσεις", notes:"Σημειώσεις" };
  const CRITICAL_FIELDS = ["shade","material"]; // αλλαγές που "κλειδώνουν" αν προχώρησε η δουλειά
  const workStarted = (order.workflowStep||0) >= 2; // έχει ξεκινήσει κατασκευή

  const applyChanges = () => {
    const changes = [];
    Object.keys(draft).forEach(k=>{
      const oldVal = order[k]||"";
      if(draft[k]!==oldVal) changes.push({ field:k, fieldLabel:FIELD_LABELS[k], from:oldVal||"—", to:draft[k]||"—" });
    });
    if(changes.length===0){ setEditing(false); return; }
    // Έλεγχος κρίσιμων αλλαγών όταν η δουλειά έχει προχωρήσει
    const criticalChange = changes.find(c=>CRITICAL_FIELDS.includes(c.field));
    if(criticalChange && workStarted && !confirmCritical){
      setConfirmCritical(changes);
      return;
    }
    commitChanges(changes);
  };

  const commitChanges = changes => {
    const now = new Date().toLocaleString("el",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    const historyEntries = changes.map(c=>({ id:Date.now()+Math.random(), by:user.id, byName:user.name, byRole:user.role, field:c.fieldLabel, from:c.from, to:c.to, time:now, seenBy:[user.id] }));
    setOrders(prev=>prev.map(o=>{
      if(o.id!==order.id) return o;
      const updated = {...o};
      changes.forEach(c=>{ updated[c.field]=draft[c.field]; });
      updated.history = [...historyEntries, ...(o.history||[])];
      updated.lastEditBy = user.id;
      return updated;
    }));
    setEditing(false);
    setConfirmCritical(null);
  };

  // Μαρκάρει το ιστορικό ως "διαβασμένο" από τον τρέχοντα χρήστη
  const markHistorySeen = () => {
    if(!order.history?.length) return;
    const hasUnseen = order.history.some(h=>!h.seenBy?.includes(user.id));
    if(!hasUnseen) return;
    setOrders(prev=>prev.map(o=>o.id===order.id?{...o,history:(o.history||[]).map(h=>h.seenBy?.includes(user.id)?h:{...h,seenBy:[...(h.seenBy||[]),user.id]})}:o));
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,paddingBottom:30}}>
      {/* Sticky header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"14px 16px",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(12px)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:5,padding:0,marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Πίσω
        </button>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(62,207,178,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🦷</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{order.id}</span>
              <Pill status={order.status}/>
              {order.tooth&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(62,207,178,0.1)",color:MINT,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>#{order.tooth}</span>}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:T.text,letterSpacing:"-0.03em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{order.type}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{order.patient} · {isLab?doctor?.name:lab?.lab}</div>
            {order.shade&&(
              <div style={{marginTop:4,display:"flex",gap:6,alignItems:"center"}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:shadeColor,border:"1px solid rgba(0,0,0,0.1)"}}/>
                <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>VITA {order.shade}</span>
                {order.material&&<span style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>· {order.material}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{padding:"14px 16px"}}>
        {order.notes&&<div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"10px 12px",marginBottom:12,fontSize:12,color:"#F59E0B",display:"flex",gap:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}><span>📌</span><span>{order.notes}</span></div>}

        <WorkflowTracker step={order.workflowStep||0} T={T}/>

        {/* Tabs */}
        <div style={{display:"flex",gap:3,background:T.faint,borderRadius:12,padding:4,marginBottom:14,overflowX:"auto"}}>
          {[{k:"stages",l:"📋 Στάδια"},{k:"edit",l:"✏️ Στοιχεία"},{k:"chat",l:"💬 Chat"},{k:"photo",l:"📷 Φωτό"},{k:"invoice",l:"💶 Τιμολόγιο"},{k:"mdr",l:"📄 MDR"}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)}
              style={{flexShrink:0,background:tab===t.k?T.surface:"transparent",border:"none",color:tab===t.k?T.text:T.muted,borderRadius:9,padding:"9px 10px",fontSize:11,fontWeight:tab===t.k?700:400,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",position:"relative"}}>
              {t.l}
              {t.k==="chat"&&order.chat?.length>0&&<span style={{position:"absolute",top:4,right:4,width:6,height:6,borderRadius:"50%",background:MINT}}/>}
            </button>
          ))}
        </div>

        {/* Tab: Stages */}
        {tab==="stages"&&(
          <div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:14}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Πρόοδος</span>
                  <span style={{fontSize:12,color:MINT,fontFamily:"'DM Mono',monospace"}}>{order.stages.filter(s=>s.done).length}/{order.stages.length}</span>
                </div>
                <div style={{height:5,background:T.border,borderRadius:3}}><div style={{height:"100%",width:`${pct(order.stages)}%`,background:`linear-gradient(90deg,${MINT},${MINT3})`,borderRadius:3}}/></div>
              </div>
              <div style={{fontSize:22,fontWeight:800,fontFamily:"'DM Mono',monospace",color:MINT}}>{pct(order.stages)}%</div>
            </div>
            {order.stages.map((stage,i)=>(
              <div key={i} style={{background:T.card,border:`1px solid ${stage.done?"rgba(62,207,178,0.2)":T.border}`,borderRadius:14,padding:"13px 14px",marginBottom:9}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:stage.done?`linear-gradient(135deg,${MINT},${MINT3})`:"rgba(255,255,255,0.05)",border:stage.done?"none":`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:stage.done?"white":T.muted}}>{stage.done?"✓":i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:stage.done?700:400,color:stage.done?T.text:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{stage.name}</div>
                    {stage.done&&<div style={{fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {stage.date}{stage.materials&&` · ${stage.materials}`}
                      {stage.technicianId&&` · ${USERS.find(u=>u.id===stage.technicianId)?.name||""}`}
                    </div>}
                  </div>
                  {isLab&&!stage.done&&i===order.stages.findIndex(s=>!s.done)&&(
                    <button onClick={()=>markDone(i)} style={{background:"rgba(62,207,178,0.12)",color:MINT,border:"1px solid rgba(62,207,178,0.25)",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Ολοκλ.</button>
                  )}
                </div>
                {stage.done&&stage.photos>0&&(
                  <div style={{marginTop:10,marginLeft:42,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                    {Array.from({length:Math.min(stage.photos,3)}).map((_,pi)=>(
                      <div key={pi} style={{aspectRatio:"4/3",borderRadius:8,background:"rgba(62,207,178,0.08)",border:"1px solid rgba(62,207,178,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="1.5" opacity=".7"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    ))}
                    <div style={{aspectRatio:"4/3",borderRadius:8,border:`1px dashed ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:T.muted}}>+ 📸</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Chat */}
        {tab==="chat"&&<Chat order={order} user={user} T={T}/>}

        {/* Tab: Edit fields + change history */}
        {tab==="edit"&&(
          <div>
            {/* Notification hint */}
            <div style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"10px 12px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:16}}>🔔</span>
              <div style={{fontSize:11,color:"#A78BFA",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Κάθε αλλαγή ειδοποιεί αυτόματα τον {isLab?"γιατρό":"τεχνίτη"}</div>
            </div>

            {/* Critical change confirmation */}
            {confirmCritical&&(
              <div style={{background:"rgba(239,68,68,0.08)",border:"2px solid rgba(239,68,68,0.4)",borderRadius:14,padding:"14px",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:800,color:"#EF4444",marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⚠️ Προσοχή — Κρίσιμη αλλαγή</div>
                <div style={{fontSize:12,color:T.text,lineHeight:1.6,marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Η εργασία είναι ήδη στο στάδιο <strong>{WORKFLOW_STAGES[order.workflowStep]||"κατασκευής"}</strong>. Αλλάζεις:</div>
                {confirmCritical.filter(c=>["Απόχρωση","Υλικό"].includes(c.fieldLabel)).map((c,i)=>(
                  <div key={i} style={{fontSize:12,color:T.muted,marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>• {c.fieldLabel}: <span style={{textDecoration:"line-through"}}>{c.from}</span> → <strong style={{color:"#EF4444"}}>{c.to}</strong></div>
                ))}
                <div style={{fontSize:11,color:T.muted,margin:"8px 0 12px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Αυτό μπορεί να σημαίνει επαναλειτουργία ή κόστος. Σίγουρα;</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setConfirmCritical(null)} style={{flex:1,background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:10,padding:11,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ακύρωση</button>
                  <button onClick={()=>commitChanges(confirmCritical)} style={{flex:2,background:"#EF4444",border:"none",color:"white",borderRadius:10,padding:11,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ναι, αλλαγή</button>
                </div>
              </div>
            )}

            {/* Editable card */}
            <div style={{background:T.card,border:`1px solid ${editing?MINT:T.border}`,borderRadius:16,padding:"16px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:800,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📋 Στοιχεία Εργασίας</div>
                {!editing?(
                  <button onClick={()=>{setDraft({shade:order.shade||"",material:order.material||"",measurements:order.measurements||"",notes:order.notes||""});setEditing(true);}} style={{background:"rgba(62,207,178,0.12)",border:"1px solid rgba(62,207,178,0.3)",color:MINT,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✏️ Επεξεργασία</button>
                ):(
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{setEditing(false);setConfirmCritical(null);}} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"6px 10px",fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Άκυρο</button>
                    <button onClick={applyChanges} style={{background:`linear-gradient(135deg,${MINT},${MINT3})`,border:"none",color:"white",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💾 Αποθήκευση</button>
                  </div>
                )}
              </div>

              {/* Απόχρωση */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🎨 Απόχρωση VITA {CRITICAL_FIELDS.includes("shade")&&workStarted&&<span style={{color:"#EF4444"}}>• κρίσιμο</span>}</div>
                {editing?<VitaSelector value={draft.shade} onChange={v=>setDraft(p=>({...p,shade:v}))} T={T}/>:<div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:"'DM Mono',monospace"}}>{order.shade||"—"}</div>}
              </div>

              {/* Υλικό */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🧪 Υλικό {CRITICAL_FIELDS.includes("material")&&workStarted&&<span style={{color:"#EF4444"}}>• κρίσιμο</span>}</div>
                {editing?(
                  <select value={draft.material} onChange={e=>setDraft(p=>({...p,material:e.target.value}))} style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    <option value="">— Επιλογή —</option>
                    {[...FIXED_MATS,...REMOVABLE_MATS].filter((v,i,a)=>a.indexOf(v)===i).map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                ):<div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{order.material||"—"}</div>}
              </div>

              {/* Μέτρα */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📐 Μέτρα / Διαστάσεις</div>
                {editing?<textarea value={draft.measurements} onChange={e=>setDraft(p=>({...p,measurements:e.target.value}))} placeholder="π.χ. πάχος τοιχώματος, επαφές…" style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",resize:"none",minHeight:50,boxSizing:"border-box",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>:<div style={{fontSize:13,color:order.measurements?T.text:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",fontStyle:order.measurements?undefined:"italic"}}>{order.measurements||"Δεν έχουν καταγραφεί"}</div>}
              </div>

              {/* Σημειώσεις */}
              <div>
                <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📝 Σημειώσεις</div>
                {editing?<textarea value={draft.notes} onChange={e=>setDraft(p=>({...p,notes:e.target.value}))} placeholder="Ειδικές οδηγίες…" style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",resize:"none",minHeight:50,boxSizing:"border-box",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>:<div style={{fontSize:13,color:order.notes?T.text:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",fontStyle:order.notes?undefined:"italic"}}>{order.notes||"Δεν υπάρχουν σημειώσεις"}</div>}
              </div>
            </div>

            {/* Change history */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:800,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 Ιστορικό Αλλαγών</div>
                {order.history?.some(h=>!h.seenBy?.includes(user.id))&&<button onClick={markHistorySeen} style={{background:"none",border:"none",color:MINT,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σήμανση ως διαβασμένο ✓</button>}
              </div>
              {(!order.history||order.history.length===0)&&<div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Καμία αλλαγή ακόμα. Πάτα "Επεξεργασία" για να ξεκινήσεις.</div>}
              {(order.history||[]).map(h=>{
                const isDoc = h.byRole==="doctor";
                const seenByOther = h.seenBy?.some(id=>id!==h.by);
                return (
                  <div key={h.id} style={{display:"flex",gap:10,marginBottom:14}}>
                    <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:isDoc?"rgba(167,139,250,0.15)":"rgba(62,207,178,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{isDoc?"👨‍⚕️":"🦷"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}><strong>{h.byName}</strong> <span style={{color:T.muted}}>άλλαξε</span> <strong style={{color:isDoc?"#A78BFA":MINT}}>{h.field}</strong></div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        <span style={{textDecoration:"line-through",opacity:0.6}}>{h.from}</span><span>→</span><span style={{color:T.text,fontWeight:600}}>{h.to}</span>
                      </div>
                      <div style={{fontSize:10,color:T.muted,marginTop:3,display:"flex",alignItems:"center",gap:6,fontFamily:"'DM Mono',monospace"}}>
                        {h.time}
                        {seenByOther?<span style={{color:MINT}}>✓✓ διαβάστηκε</span>:<span style={{color:T.muted}}>✓ στάλθηκε</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Photo annotations */}
        {tab==="photo"&&<PhotoAnnotations order={order} user={user} setOrders={setOrders} T={T}/>}

        {/* Tab: Invoice */}
        {tab==="invoice"&&(
          <div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:`1px solid ${T.border}`}}>
                <div style={{padding:"12px 14px",borderRight:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εκδότης</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{profile?.businessName||lab?.lab}</div>
                  <div style={{fontSize:10,color:T.muted,lineHeight:1.6,marginTop:3,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {profile?.address&&<>{profile.address}, {profile.city} {profile.postalCode}<br/></>}
                    {profile?.vat&&<>ΑΦΜ: {profile.vat}{profile.doy?` · ${profile.doy}`:""}<br/></>}
                    {profile?.phone&&<>Τηλ: {profile.phone}</>}
                  </div>
                </div>
                <div style={{padding:"12px 14px"}}>
                  <div style={{fontSize:9,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Λήπτης</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{doctor?.name}</div>
                  <div style={{fontSize:10,color:T.muted,lineHeight:1.6,marginTop:3,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{doctor?.clinic}</div>
                </div>
              </div>
              <div style={{padding:"8px 14px",borderBottom:`1px solid ${T.border}`,background:T.faint,fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <strong style={{color:T.text}}>Ασθενής:</strong> {order.patient}{order.tooth?<> · <strong style={{color:T.text}}>Δόντι:</strong> #{order.tooth}</>:null}{order.shade?<> · <strong style={{color:T.text}}>VITA:</strong> {order.shade}</>:null}
              </div>
              {order.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{flex:1,fontSize:12,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.desc}</div>
                  <div style={{fontSize:11,color:T.muted,marginRight:10,fontFamily:"'DM Mono',monospace"}}>{item.qty}×€{item.price}</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'DM Mono',monospace"}}>€{(item.qty*item.price).toFixed(2)}</div>
                </div>
              ))}
              <div style={{padding:"12px 14px",background:T.faint}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Υποσύνολο</span><span style={{fontSize:12,color:T.muted,fontFamily:"'DM Mono',monospace"}}>€{n.toFixed(2)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>ΦΠΑ 24%</span><span style={{fontSize:12,color:T.muted,fontFamily:"'DM Mono',monospace"}}>€{(n*.24).toFixed(2)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                  <span style={{fontSize:15,fontWeight:800,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σύνολο</span>
                  <span style={{fontSize:17,fontWeight:800,color:MINT,fontFamily:"'DM Mono',monospace"}}>€{(n*1.24).toFixed(2)}</span>
                </div>
              </div>
              {profile?.iban&&(
                <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  <strong style={{color:T.text}}>Πληρωμή:</strong> <span style={{fontFamily:"'DM Mono',monospace"}}>{profile.iban}</span>{profile.bank?` · ${profile.bank}`:""}
                </div>
              )}
            </div>
            {!isLab&&order.status==="waiting_approval"&&(
              <div style={{background:"rgba(62,207,178,0.06)",border:"1px solid rgba(62,207,178,0.2)",borderRadius:14,padding:"14px",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:MINT,marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✍️ Έγκριση Κοστολογίου</div>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Σχόλιο…"
                  style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",resize:"none",minHeight:60,marginBottom:10,boxSizing:"border-box"}}/>
                <button onClick={()=>onApprove(comment)} style={{width:"100%",background:`linear-gradient(135deg,${MINT},${MINT3})`,border:"none",color:"white",borderRadius:10,padding:12,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✅ Εγκρίνω — €{(n*1.24).toFixed(2)}</button>
              </div>
            )}
            {order.approved&&<div style={{background:"rgba(62,207,178,0.06)",border:"1px solid rgba(62,207,178,0.2)",borderRadius:12,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",marginBottom:12}}><span style={{fontSize:20}}>✅</span><div><div style={{fontSize:13,fontWeight:700,color:MINT,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εγκρίθηκε από {doctor?.name}</div>{order.doctorComment&&<div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>"{order.doctorComment}"</div>}</div></div>}
            {isLab&&<div style={{display:"flex",gap:10,marginTop:4}}><div style={{flex:1,background:T.faint,border:`1px solid ${T.border}`,color:T.muted,borderRadius:12,padding:12,fontSize:12,fontWeight:600,textAlign:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📄 PDF</div><div style={{flex:2,background:"rgba(62,207,178,0.1)",border:"1px solid rgba(62,207,178,0.25)",color:MINT,borderRadius:12,padding:12,fontSize:13,fontWeight:800,textAlign:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📨 Αποστολή</div></div>}
          </div>
        )}

        {/* Tab: MDR */}
        {tab==="mdr"&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px"}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📄 MDR Compliance</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>EU MDR 2017/745 — Statement of Conformity</div>
            {order.stages.filter(s=>s.done&&s.materials).map((stage,i)=>(
              <div key={i} style={{padding:"10px 12px",background:T.faint,borderRadius:10,marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:3,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{stage.name}</div>
                <div style={{fontSize:11,color:MINT,fontFamily:"'DM Mono',monospace"}}>{stage.materials}</div>
              </div>
            ))}
            {order.stages.filter(s=>s.done&&s.materials).length===0&&<div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Δεν υπάρχουν καταγεγραμμένα υλικά ακόμα.</div>}
            <button style={{width:"100%",background:"rgba(62,207,178,0.1)",border:"1px solid rgba(62,207,178,0.2)",color:MINT,borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",marginTop:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📥 Λήψη PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FINANCE PAGE
// ═══════════════════════════════════════════════════════════════════
function FinancePage({ orders, expenses, setExpenses, T }) {
  const [tab, setTab]     = useState("expenses");
  const [showAdd, setShowAdd] = useState(false);
  const [selMonth, setSelMonth] = useState(()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [newExp, setNewExp] = useState({date:new Date().toISOString().split("T")[0],category:"",description:"",amount:"",supplier:""});
  const MONTHS={"01":"Ιαν","02":"Φεβ","03":"Μαρ","04":"Απρ","05":"Μαι","06":"Ιουν","07":"Ιουλ","08":"Αυγ","09":"Σεπ","10":"Οκτ","11":"Νοε","12":"Δεκ"};
  const fmtM=m=>{const[y,mo]=m.split("-");return`${MONTHS[mo]} ${y}`;};
  const months=[...new Set([...expenses.map(e=>e.date.slice(0,7)),selMonth])].sort().reverse();
  const mExp=expenses.filter(e=>e.date.startsWith(selMonth));
  const totalExp=mExp.reduce((s,e)=>s+e.amount,0);
  const mOrders=orders.filter(o=>{const d=new Date(o.delivery);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`===selMonth&&(o.status==="approved"||o.status==="delivered");});
  const totalRev=mOrders.reduce((s,o)=>s+netTotal(o.items)*1.24,0);
  const profit=totalRev-totalExp;
  const catTotals=Object.keys(CAT_COLORS).map(cat=>({cat,total:mExp.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const addExp=()=>{
    if(!newExp.category||!newExp.description||!newExp.amount) return;
    setExpenses(prev=>[{id:`ex${Date.now()}`,date:newExp.date,category:newExp.category,description:newExp.description,amount:parseFloat(newExp.amount),supplier:newExp.supplier},...prev]);
    setNewExp({date:new Date().toISOString().split("T")[0],category:"",description:"",amount:"",supplier:""});
    setShowAdd(false);
  };

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💶 Οικονομικά</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Υλικά, έξοδα & μηνιαία σύνοψη</div>
      <div style={{display:"flex",gap:3,background:T.faint,borderRadius:12,padding:4,marginBottom:16}}>
        {[{k:"expenses",l:"📦 Έξοδα"},{k:"summary",l:"📊 Σύνοψη"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,background:tab===t.k?T.surface:"transparent",border:"none",color:tab===t.k?T.text:T.muted,borderRadius:9,padding:"9px 6px",fontSize:12,fontWeight:tab===t.k?700:400,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{t.l}</button>
        ))}
      </div>

      {tab==="expenses"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"7px 12px",color:T.text,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}}>
              {months.map(m=><option key={m} value={m}>{fmtM(m)}</option>)}
            </select>
            <button onClick={()=>setShowAdd(true)} style={{background:`linear-gradient(135deg,${MINT},${MINT2})`,border:"none",color:"white",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Προσθήκη</button>
          </div>

          {showAdd&&(
            <div style={{background:T.card,border:`1px solid ${MINT}44`,borderRadius:16,padding:"16px",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Νέο Έξοδο</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input type="date" value={newExp.date} onChange={e=>setNewExp(p=>({...p,date:e.target.value}))} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",color:T.text,fontSize:12,outline:"none"}}/>
                <input type="number" placeholder="€" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} style={{width:90,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",color:T.text,fontSize:12,outline:"none"}}/>
              </div>
              <select value={newExp.category} onChange={e=>setNewExp(p=>({...p,category:e.target.value}))} style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",color:T.text,fontSize:12,outline:"none",marginBottom:8,boxSizing:"border-box"}}>
                <option value="">— Κατηγορία —</option>
                {Object.keys(CAT_COLORS).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Περιγραφή…" value={newExp.description} onChange={e=>setNewExp(p=>({...p,description:e.target.value}))} style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",color:T.text,fontSize:12,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
              <input placeholder="Προμηθευτής (προαιρετικό)" value={newExp.supplier} onChange={e=>setNewExp(p=>({...p,supplier:e.target.value}))} style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",color:T.text,fontSize:12,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setShowAdd(false)} style={{flex:1,background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:10,fontSize:12,cursor:"pointer"}}>Ακύρωση</button>
                <button onClick={addExp} style={{flex:2,background:`linear-gradient(135deg,${MINT},${MINT3})`,border:"none",color:"white",borderRadius:8,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ Καταχώριση</button>
              </div>
            </div>
          )}

          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σύνολο {fmtM(selMonth)}</div><div style={{fontSize:22,fontWeight:800,color:"#F87171",fontFamily:"'DM Mono',monospace"}}>€{totalExp.toFixed(2)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εγγραφές</div><div style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:"'DM Mono',monospace"}}>{mExp.length}</div></div>
          </div>

          {mExp.sort((a,b)=>b.date.localeCompare(a.date)).map(exp=>(
            <div key={exp.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${CAT_COLORS[exp.category]||"#6B7280"}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:10,height:10,borderRadius:"50%",background:CAT_COLORS[exp.category]||"#6B7280"}}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{exp.description}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}><span style={{color:CAT_COLORS[exp.category]||T.muted,fontWeight:600}}>{exp.category}</span>{exp.supplier&&` · ${exp.supplier}`}{` · ${exp.date.split("-").reverse().slice(0,2).join("/")}`}</div>
              </div>
              <div style={{fontSize:15,fontWeight:800,color:"#F87171",fontFamily:"'DM Mono',monospace",flexShrink:0}}>−€{exp.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {tab==="summary"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12,gap:6}}>
            {months.slice(0,3).map(m=>(
              <button key={m} onClick={()=>setSelMonth(m)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${selMonth===m?MINT:T.border}`,background:selMonth===m?"rgba(62,207,178,0.12)":"transparent",color:selMonth===m?MINT:T.muted,fontSize:10,fontWeight:selMonth===m?700:400,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{fmtM(m)}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{label:"Έσοδα",value:`€${totalRev.toFixed(0)}`,color:"#34D399"},{label:"Έξοδα",value:`€${totalExp.toFixed(0)}`,color:"#F87171"},{label:"Κέρδος",value:`${profit>=0?"+":""}€${profit.toFixed(0)}`,color:profit>=0?MINT:"#F87171"}].map((k,i)=>(
              <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:k.color,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{k.label}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.color,fontFamily:"'DM Mono',monospace"}}>{k.value}</div>
              </div>
            ))}
          </div>
          {totalRev>0&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Μικτό Περιθώριο</div>
              <div style={{height:8,background:T.faint,borderRadius:4,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${Math.max(0,Math.min(100,(profit/totalRev)*100))}%`,background:profit>=0?`linear-gradient(90deg,${MINT},${MINT3})`:"#F87171",borderRadius:4}}/>
              </div>
              <div style={{fontSize:12,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{((profit/totalRev)*100).toFixed(1)}% περιθώριο κέρδους</div>
            </div>
          )}
          {catTotals.length>0&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ανάλυση ανά Κατηγορία</div>
              {catTotals.map(({cat,total})=>(
                <div key={cat} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cat}</span><span style={{fontSize:11,color:CAT_COLORS[cat]||T.muted,fontFamily:"'DM Mono',monospace",fontWeight:700}}>€{total.toFixed(2)}</span></div>
                  <div style={{height:5,background:T.faint,borderRadius:3}}><div style={{height:"100%",width:totalExp>0?`${(total/totalExp)*100}%`:"0%",background:CAT_COLORS[cat]||"#6B7280",borderRadius:3,opacity:.8}}/></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS — Generator + Page (modular, derives from orders)
// ═══════════════════════════════════════════════════════════════════
// Παράγει ειδοποιήσεις δυναμικά από την κατάσταση των εργασιών.
// Σε production: αυτές θα έρχονται από τη βάση (Supabase) + push.
function buildNotifications(orders, user) {
  if (!user) return [];
  const mine = orders.filter(o =>
    user.role==="lab" ? o.labId===user.id
    : (user.role==="technician"||user.role==="student") ? o.labId===user.labId
    : o.doctorId===user.id
  );
  const list = [];

  mine.forEach(o => {
    // 🚨 Επείγον — αναμονή απάντησης γιατρού σε ⏳ μήνυμα
    const pendingMsg = o.chat?.find(m=>m.awaitAction==="pending");
    if (pendingMsg) {
      list.push({
        id:`${o.id}-urgent`, orderId:o.id, type:"urgent", icon:"🚨", color:"#EF4444",
        title: user.role==="doctor" ? "Επείγον! Αναμένεται απάντησή σας" : "Αναμονή απάντησης γιατρού",
        sub:`${o.type} · ${o.patient}`, time:"πριν λίγο", unread:true,
        action: user.role==="doctor" ? "Απάντηση τώρα →" : "Δείτε →",
      });
    }

    // ✅ Εγκρίθηκε
    if (o.status==="approved") {
      list.push({
        id:`${o.id}-approved`, orderId:o.id, type:"approval", icon:"✅", color:"#34D399",
        title:"Εγκρίθηκε κοστολόγιο!", sub:`${o.type} · ${o.patient} · €${(o.items.reduce((s,i)=>s+i.qty*i.price,0)*1.24).toFixed(2)}`,
        time:"πρόσφατα", unread:false, action:"Δείτε →",
      });
    }

    // 🔔 Αναμονή έγκρισης
    if (o.status==="waiting_approval") {
      list.push({
        id:`${o.id}-wait`, orderId:o.id, type:"approval-pending", icon:"🔔", color:"#A78BFA",
        title: user.role==="doctor" ? "Αναμένεται η έγκρισή σας" : "Στάλθηκε για έγκριση",
        sub:`${o.type} · €${(o.items.reduce((s,i)=>s+i.qty*i.price,0)*1.24).toFixed(2)} με ΦΠΑ`,
        time:"πριν 2 ώρες", unread: user.role==="doctor", action: user.role==="doctor" ? "Έγκριση →" : "Δείτε →",
      });
    }

    // ⚡ Στάδια που ολοκληρώθηκαν (το τελευταίο done)
    const doneStages = o.stages.filter(s=>s.done);
    if (doneStages.length>0 && o.status==="in_progress") {
      const last = doneStages[doneStages.length-1];
      const tech = USERS.find(u=>u.id===last.technicianId);
      list.push({
        id:`${o.id}-stage`, orderId:o.id, type:"stage", icon:"⚡", color:MINT,
        title:"Στάδιο ολοκληρώθηκε", sub:`${o.type} — ${last.name} (${doneStages.length}/${o.stages.length})`,
        time: last.date || "σήμερα", unread:false, by: tech?.name,
      });
    }

    // 📅 Παραδόσεις κοντά
    const del = new Date(o.delivery);
    const diff = Math.ceil((del.getTime()-Date.now())/86400000);
    if (diff>=0 && diff<=2 && o.status!=="delivered" && o.status!=="approved") {
      list.push({
        id:`${o.id}-deliv`, orderId:o.id, type:"delivery", icon:"📅", color:"#F59E0B",
        title: diff===0 ? "Παράδοση ΣΗΜΕΡΑ" : `Παράδοση σε ${diff} μέρ${diff>1?"ες":"α"}`,
        sub:`${o.type} · ${o.patient}`, time: diff===0?"σήμερα":`σε ${diff}d`, unread:false, action:"Δείτε →",
      });
    }

    // 💬 Νέο μήνυμα (τελευταίο μη-δικό μου)
    const lastMsg = o.chat?.[o.chat.length-1];
    if (lastMsg && lastMsg.from!==user.id && !lastMsg.awaitAction) {
      const sender = USERS.find(u=>u.id===lastMsg.from);
      list.push({
        id:`${o.id}-chat`, orderId:o.id, type:"chat", icon:"💬", color:"#60A5FA",
        title:"Νέο μήνυμα", sub:`${sender?.name||""}: "${lastMsg.text.slice(0,40)}${lastMsg.text.length>40?"…":""}"`,
        time:"πρόσφατα", unread:false, action:"Άνοιγμα →",
      });
    }

    // ✏️ Αλλαγές στοιχείων από τον άλλον (που δεν τις έχω δει)
    (o.history||[]).forEach(h=>{
      if (h.by!==user.id && !h.seenBy?.includes(user.id)) {
        list.push({
          id:`${o.id}-edit-${h.id}`, orderId:o.id, type:"edit", icon:"✏️", color:"#F59E0B",
          title:`${h.byName} άλλαξε: ${h.field}`,
          sub:`${o.type} · ${h.from} → ${h.to}`,
          time:h.time||"πρόσφατα", unread:true, action:"Δείτε →",
        });
      }
    });
  });

  // Σειρά προτεραιότητας: urgent πρώτα
  const order = {urgent:0,edit:1,"approval-pending":2,approval:3,stage:4,delivery:5,chat:6};
  return list.sort((a,b)=>(order[a.type]??9)-(order[b.type]??9));
}

function NotificationsPage({ orders, user, openDetail, readIds, setReadIds, T }) {
  const [filter, setFilter] = useState("all");
  const all = buildNotifications(orders, user).map(n => ({...n, unread: n.unread && !readIds.includes(n.id)}));

  const counts = {
    all: all.length,
    unread: all.filter(n=>n.unread).length,
    urgent: all.filter(n=>n.type==="urgent").length,
    today: all.filter(n=>n.time.includes("πριν")||n.time.includes("σήμερα")||n.time.includes("λίγο")).length,
  };
  const FILTERS = [
    {k:"all",l:"Όλες",cnt:counts.all},
    {k:"unread",l:"Αδιάβαστες",cnt:counts.unread},
    {k:"urgent",l:"🚨 Επείγον",cnt:counts.urgent},
    {k:"today",l:"Σήμερα",cnt:counts.today},
  ];
  const filtered = all.filter(n=>{
    if(filter==="all") return true;
    if(filter==="unread") return n.unread;
    if(filter==="urgent") return n.type==="urgent";
    if(filter==="today") return n.time.includes("πριν")||n.time.includes("σήμερα")||n.time.includes("λίγο");
    return true;
  });
  const markAllRead = () => setReadIds(all.map(n=>n.id));

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🔔 Ειδοποιήσεις</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{counts.unread>0?`${counts.unread} αδιάβαστες`:"Είσαι ενημερωμένος!"}</div>
        </div>
        {counts.unread>0&&<button onClick={markAllRead} style={{background:"none",border:"none",color:MINT,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Όλα διαβασμένα ✓</button>}
      </div>

      <div style={{display:"flex",gap:6,overflowX:"auto",marginTop:14,marginBottom:18,paddingBottom:4}}>
        {FILTERS.map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f.k?MINT:T.border}`,background:filter===f.k?"rgba(62,207,178,0.12)":"transparent",color:filter===f.k?MINT:T.muted,fontSize:12,fontWeight:filter===f.k?700:500,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
            {f.l}
            <span style={{fontSize:10,padding:"1px 6px",borderRadius:10,background:filter===f.k?MINT:T.faint,color:filter===f.k?"white":T.muted,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{f.cnt}</span>
          </button>
        ))}
      </div>

      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🎉<br/>Δεν υπάρχουν ειδοποιήσεις<br/>σε αυτήν την κατηγορία</div>
      )}

      {filtered.map(n=>(
        <div key={n.id} onClick={()=>{setReadIds(prev=>[...new Set([...prev,n.id])]);openDetail(n.orderId);}}
          style={{background:n.unread?`${n.color}08`:T.card,border:`1px solid ${n.unread?`${n.color}33`:T.border}`,borderRadius:14,padding:"14px",marginBottom:8,cursor:"pointer",position:"relative"}}>
          {n.unread&&<div style={{position:"absolute",top:14,right:14,width:8,height:8,borderRadius:"50%",background:n.color}}/>}
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:38,height:38,borderRadius:11,background:`${n.color}1A`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{n.icon}</div>
            <div style={{flex:1,minWidth:0,paddingRight:n.unread?14:0}}>
              <div style={{fontSize:13,fontWeight:700,color:n.unread?n.color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.3,marginBottom:3}}>{n.title}</div>
              <div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.5}}>{n.sub}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,gap:8}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{n.time}</span>
                  {n.by&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"rgba(96,165,250,0.12)",color:"#60A5FA",fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>👤 {n.by}</span>}
                </div>
                {n.action&&<span style={{fontSize:11,fontWeight:700,color:n.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{n.action}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CALENDAR PAGE — Week & Month views of delivery dates
// ═══════════════════════════════════════════════════════════════════
const CAL_DAYS = ["Κυρ","Δευ","Τρι","Τετ","Πεμ","Παρ","Σαβ"];
const CAL_MONTHS = ["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"];

function CalendarPage({ orders, openDetail, T }) {
  const [view, setView] = useState("week");
  const [monthOff, setMonthOff] = useState(0);
  const today = new Date();
  const sameDay = (a,b) => a.toDateString()===b.toDateString();
  const ordersOn = date => orders.filter(o => sameDay(new Date(o.delivery), date));

  // Week: next 14 days that have deliveries
  const days14 = [];
  for (let i=0;i<14;i++){ const dd=new Date(today); dd.setDate(today.getDate()+i); const os=ordersOn(dd); if(os.length>0) days14.push({date:dd,orders:os}); }

  const vMonth = new Date(today.getFullYear(), today.getMonth()+monthOff, 1);
  const daysInMonth = new Date(vMonth.getFullYear(), vMonth.getMonth()+1, 0).getDate();
  const firstDow = (vMonth.getDay()+6)%7; // Monday-first

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📅 Ημερολόγιο</div>
        <div style={{display:"flex",gap:3,background:T.faint,borderRadius:10,padding:3}}>
          {[["week","Εβδομάδα"],["month","Μήνας"]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)} style={{padding:"5px 14px",borderRadius:8,border:"none",background:view===k?T.surface:"transparent",color:view===k?T.text:T.muted,fontSize:11,fontWeight:view===k?700:400,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</button>
          ))}
        </div>
      </div>

      {view==="week"&&(
        <>
          <div style={{fontSize:12,color:T.muted,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Επόμενες παραδόσεις (14 μέρες)</div>
          {days14.length===0&&<div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Δεν υπάρχουν παραδόσεις τις επόμενες 14 μέρες</div>}
          {days14.map(({date,orders:dayOrders})=>(
            <div key={date.toDateString()} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{textAlign:"center",background:sameDay(date,today)?MINT:T.card,border:`1px solid ${sameDay(date,today)?MINT:T.border}`,borderRadius:10,padding:"6px 10px",minWidth:50}}>
                  <div style={{fontSize:9,color:sameDay(date,today)?"white":T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{CAL_DAYS[date.getDay()]}</div>
                  <div style={{fontSize:18,fontWeight:800,color:sameDay(date,today)?"white":T.text,fontFamily:"'DM Mono',monospace"}}>{date.getDate()}</div>
                </div>
                <div style={{flex:1,height:1,background:T.border}}/>
                {sameDay(date,today)&&<span style={{fontSize:10,color:MINT,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>ΣΗΜΕΡΑ</span>}
              </div>
              {dayOrders.map(o=>{
                const tm=new Date(o.delivery).toLocaleTimeString("el",{hour:"2-digit",minute:"2-digit"});
                return (
                  <div key={o.id} onClick={()=>openDetail(o.id)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 14px",marginBottom:8,marginLeft:60,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:11,color:MINT,fontFamily:"'DM Mono',monospace",fontWeight:700,minWidth:42}}>{tm}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</div>
                      <div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.patient}</div>
                    </div>
                    <Pill status={o.status}/>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}

      {view==="month"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <button onClick={()=>setMonthOff(p=>p-1)} style={{background:T.faint,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:14}}>←</button>
            <div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{CAL_MONTHS[vMonth.getMonth()]} {vMonth.getFullYear()}</div>
            <button onClick={()=>setMonthOff(p=>p+1)} style={{background:T.faint,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:14}}>→</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:8}}>
            {CAL_DAYS.map(dn=><div key={dn} style={{textAlign:"center",fontSize:9,color:T.muted,padding:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{dn}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {Array.from({length:firstDow}).map((_,i)=><div key={"e"+i}/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1;
              const cellDate=new Date(vMonth.getFullYear(),vMonth.getMonth(),day);
              const os=ordersOn(cellDate);
              const isToday=sameDay(cellDate,today);
              return (
                <div key={day} onClick={()=>os.length>0&&openDetail(os[0].id)} style={{background:isToday?"rgba(62,207,178,0.15)":os.length>0?T.card:"transparent",border:`1px solid ${isToday?MINT:os.length>0?T.border:"transparent"}`,borderRadius:8,padding:"5px 3px",minHeight:48,cursor:os.length>0?"pointer":"default"}}>
                  <div style={{fontSize:11,fontWeight:isToday?800:400,color:isToday?MINT:T.text,fontFamily:"'DM Mono',monospace",textAlign:"center"}}>{day}</div>
                  {os.slice(0,2).map(o=>(
                    <div key={o.id} style={{fontSize:7,background:(STATUS[o.status]||STATUS.pending).bg,color:(STATUS[o.status]||STATUS.pending).color,borderRadius:3,padding:"1px 3px",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.patient.split(" ")[0]}</div>
                  ))}
                  {os.length>2&&<div style={{fontSize:7,color:T.muted,textAlign:"center",marginTop:1}}>+{os.length-2}</div>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>
            {Object.entries(STATUS).map(([k,s])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:2,background:s.color}}/><span style={{fontSize:9,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{s.label}</span></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH PAGE — Global search across patients/work/material/doctor
// ═══════════════════════════════════════════════════════════════════
function SearchPage({ orders, user, openDetail, T }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState(["E-max","Ζιρκόνιο","Κωνσταντίνου"]);

  const myOrders = orders.filter(o =>
    user.role==="lab" ? o.labId===user.id
    : (user.role==="technician"||user.role==="student") ? o.labId===user.labId
    : o.doctorId===user.id
  );

  const results = q.trim() ? myOrders.filter(o => {
    const doc = USERS.find(u=>u.id===o.doctorId);
    const hay = `${o.patient} ${o.type} ${o.material} ${o.shade} ${o.id} ${doc?.name||""} ${(STATUS[o.status]||{}).label||""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }) : [];

  const groups = {};
  results.forEach(o=>{ if(!groups[o.patient]) groups[o.patient]=[]; groups[o.patient].push(o); });

  const hl = text => {
    if(!q.trim()) return text;
    const i=text.toLowerCase().indexOf(q.toLowerCase());
    if(i<0) return text;
    return (<>{text.slice(0,i)}<span style={{background:"rgba(62,207,178,0.3)",color:MINT,borderRadius:3,padding:"0 2px"}}>{text.slice(i,i+q.length)}</span>{text.slice(i+q.length)}</>);
  };

  const runSearch = term => {
    setQ(term);
    if(term.trim() && !recent.includes(term)) setRecent(prev=>[term,...prev].slice(0,5));
  };

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🔍 Αναζήτηση</div>

      <div style={{position:"relative",marginBottom:18}}>
        <svg style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={q?MINT:T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Ασθενής, εργασία, υλικό, γιατρός, χρώμα…" style={{width:"100%",background:T.card,border:`1.5px solid ${q?MINT:T.border}`,borderRadius:14,padding:"13px 14px 13px 40px",color:T.text,fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",boxSizing:"border-box"}}/>
        {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:T.faint,border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",color:T.muted,fontSize:12}}>✕</button>}
      </div>

      {!q.trim()&&(
        <>
          <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Πρόσφατες αναζητήσεις</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
            {recent.map(r=>(
              <button key={r} onClick={()=>runSearch(r)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"7px 14px",fontSize:12,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 {r}</button>
            ))}
          </div>
          <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Γρήγορα φίλτρα</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["🦷 Ζιρκόνιο","Ζιρκόνιο"],["✨ E-max","E-max"],["⏳ Σε εξέλιξη","Σε Εξέλιξη"],["✅ Εγκεκριμένες","Εγκρίθηκε"]].map(([l,val])=>(
              <button key={l} onClick={()=>runSearch(val)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px",fontSize:12,color:T.text,cursor:"pointer",textAlign:"left",fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</button>
            ))}
          </div>
        </>
      )}

      {q.trim()&&(
        <>
          <div style={{fontSize:12,color:T.muted,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{results.length} αποτελέσματα για "<span style={{color:MINT,fontWeight:700}}>{q}</span>"</div>
          {results.length===0&&<div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🔍<br/>Δεν βρέθηκε τίποτα<br/>Δοκίμασε άλλον όρο</div>}
          {Object.entries(groups).map(([patient,os])=>(
            <div key={patient} style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${MINT},${MINT3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"white"}}>{patient.split(" ").pop().charAt(0)}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hl(patient)}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{os.length} εργασί{os.length>1?"ες":"α"}</div></div>
              </div>
              {os.map(o=>{
                const doc=USERS.find(u=>u.id===o.doctorId);
                return (
                  <div key={o.id} onClick={()=>openDetail(o.id)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"11px 14px",marginBottom:6,marginLeft:44,cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:14}}>🦷</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hl(o.type)}</div>
                      <div style={{fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hl(o.material)}{o.shade&&` · VITA ${o.shade}`}{doc&&` · ${doc.name}`}</div>
                    </div>
                    <Pill status={o.status}/>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════
function Analytics({ orders, T }) {
  const mine = orders.filter(o=>o.labId==="u1");
  const totalRev = mine.reduce((s,o)=>s+netTotal(o.items),0);
  const matCounts = {};
  mine.forEach(o=>{if(o.material) matCounts[o.material]=(matCounts[o.material]||0)+1;});
  const topMats = Object.entries(matCounts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const maxMat  = Math.max(...topMats.map(m=>m[1]),1);
  const maxRev  = Math.max(...USERS.filter(u=>u.role==="doctor").map(doc=>mine.filter(o=>o.doctorId===doc.id).reduce((s,o)=>s+netTotal(o.items),0)),1);

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,marginBottom:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📊 Analytics</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{label:"Εργασίες",value:mine.length,icon:"📋",color:MINT},{label:"Μέση αξία",value:`€${mine.length?Math.round(totalRev/mine.length):0}`,icon:"💎",color:"#A78BFA"},{label:"Εγκρίσεις",value:`${mine.length?Math.round((mine.filter(o=>o.approved||o.status==="approved"||o.status==="delivered").length/mine.length)*100):0}%`,icon:"✅",color:"#34D399"},{label:"Σύνολο",value:`€${totalRev}`,icon:"💰",color:"#F59E0B"}].map((k,i)=>(
          <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px"}}>
            <div style={{fontSize:20,marginBottom:6}}>{k.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.color,fontFamily:"'DM Mono',monospace"}}>{k.value}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💰 Έσοδα ανά Γιατρό</div>
        {USERS.filter(u=>u.role==="doctor").map(doc=>{
          const rev=mine.filter(o=>o.doctorId===doc.id).reduce((s,o)=>s+netTotal(o.items),0);
          return (
            <div key={doc.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{doc.name}</span><span style={{fontSize:12,fontWeight:700,color:MINT,fontFamily:"'DM Mono',monospace"}}>€{rev}</span></div>
              <div style={{height:6,background:T.border,borderRadius:3}}><div style={{height:"100%",width:`${(rev/maxRev)*100}%`,background:`linear-gradient(90deg,${MINT},${MINT3})`,borderRadius:3}}/></div>
            </div>
          );
        })}
      </div>
      {topMats.length>0&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🧪 Δημοφιλή Υλικά</div>
          {topMats.map(([mat,count])=>(
            <div key={mat} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{mat}</span><span style={{fontSize:11,fontWeight:700,color:"#F472B6",fontFamily:"'DM Mono',monospace"}}>{count}×</span></div>
              <div style={{height:5,background:T.border,borderRadius:3}}><div style={{height:"100%",width:`${(count/maxMat)*100}%`,background:"linear-gradient(90deg,#F472B6,#EC4899)",borderRadius:3}}/></div>
            </div>
          ))}
        </div>
      )}
      <div style={{background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:14,padding:"14px",display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:22}}>🏛️</span>
        <div><div style={{fontSize:13,fontWeight:700,color:"#60A5FA",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>myDATA Integration</div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Αυτόματη αποστολή ΑΑΔΕ — Φάση 2</div></div>
        <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:"rgba(96,165,250,0.12)",color:"#60A5FA",fontWeight:700,marginLeft:"auto",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σύντομα</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════
function ProfilePage({ profile, setProfile, T }) {
  const [editing, setEditing] = useState(false);
  const [data, setData]       = useState(profile);
  const [saved, setSaved]     = useState(false);

  const set    = (k,v) => setData(p=>({...p,[k]:v}));
  const setHrs = (day,v)=> setData(p=>({...p,hours:{...p.hours,[day]:v}}));

  const save = () => {
    setEditing(false); setProfile(data);
    setSaved(true); setTimeout(()=>setSaved(false),2500);
  };

  const EF = ({label,field,icon,mono=false,placeholder=""}) => (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{icon&&<span style={{marginRight:5}}>{icon}</span>}{label}</div>
      {editing
        ? <input value={data[field]||""} onChange={e=>set(field,e.target.value)} placeholder={placeholder||label} style={{width:"100%",background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:mono?"'DM Mono',monospace":"'Plus Jakarta Sans',sans-serif",boxSizing:"border-box"}}/>
        : <div style={{fontSize:14,fontWeight:600,color:data[field]?T.text:T.muted,fontFamily:mono?"'DM Mono',monospace":"'Plus Jakarta Sans',sans-serif"}}>{data[field]||<span style={{fontStyle:"italic",fontSize:12}}>—</span>}</div>
      }
    </div>
  );

  return (
    <div style={{padding:"20px 16px 110px"}}>
      {/* Header card */}
      <div style={{background:`linear-gradient(135deg,${MINT3},${MINT2})`,borderRadius:20,padding:"20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
        <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative"}}>
          <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🦷</div>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:800,color:"white",letterSpacing:"-0.03em",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.2}}>{data.businessName}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{data.ownerName}</div>
            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:"rgba(255,255,255,0.2)",color:"white",fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>ΕΡΓΑΣΤΗΡΙΟ</span>
              {data.licenseNo&&<span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:"rgba(255,255,255,0.15)",color:"white",fontFamily:"'DM Mono',monospace"}}>{data.licenseNo}</span>}
            </div>
          </div>
        </div>
      </div>

      {saved&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}><span>✅</span><span style={{fontSize:13,fontWeight:700,color:"#34D399",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Αποθηκεύτηκε!</span></div>}

      <button onClick={()=>editing?save():setEditing(true)} style={{width:"100%",background:editing?`linear-gradient(135deg,${MINT},${MINT3})`:"rgba(62,207,178,0.1)",border:`1px solid ${editing?MINT:"rgba(62,207,178,0.25)"}`,color:editing?"white":MINT,borderRadius:12,padding:"11px",fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {editing?"💾 Αποθήκευση αλλαγών":"✏️ Επεξεργασία προφίλ"}
      </button>
      {editing&&<button onClick={()=>setEditing(false)} style={{width:"100%",background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:12,padding:"10px",fontSize:12,cursor:"pointer",marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ακύρωση</button>}

      {/* Section helper */}
      {[
        {title:"Στοιχεία Επιχείρησης",icon:"🏢",content:<><EF label="Επωνυμία" field="businessName" icon="🏷️"/><EF label="Ονοματεπώνυμο Δικαιούχου" field="ownerName" icon="👤"/><EF label="Ιδιότητα" field="profession" icon="🎓"/><EF label="Αριθμός Άδειας" field="licenseNo" icon="📜" mono/></>},
        {title:"Φορολογικά Στοιχεία",icon:"🏛️",content:
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>ΑΦΜ</div>
              {editing?<input value={data.vat||""} onChange={e=>set("vat",e.target.value)} style={{width:"100%",background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"'DM Mono',monospace",boxSizing:"border-box"}}/>:<div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"'DM Mono',monospace"}}>{data.vat||"—"}</div>}
            </div>
            <div>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>ΔΟΥ</div>
              {editing?<input value={data.doy||""} onChange={e=>set("doy",e.target.value)} style={{width:"100%",background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",boxSizing:"border-box"}}/>:<div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{data.doy||"—"}</div>}
            </div>
          </div>
        },
        {title:"Επικοινωνία",icon:"📞",content:<><EF label="Τηλέφωνο" field="phone" icon="📞" mono/><EF label="Κινητό" field="mobile" icon="📱" mono/><EF label="Email" field="email" icon="✉️" mono/></>},
        {title:"Έδρα",icon:"📍",content:
          <><EF label="Διεύθυνση" field="address" icon="🏠"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[{f:"city",l:"Πόλη"},{f:"postalCode",l:"ΤΚ",mono:true}].map(({f,l,mono})=>(
              <div key={f}>
                <div style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div>
                {editing?<input value={data[f]||""} onChange={e=>set(f,e.target.value)} style={{width:"100%",background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:mono?"'DM Mono',monospace":"'Plus Jakarta Sans',sans-serif",boxSizing:"border-box"}}/>:<div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:mono?"'DM Mono',monospace":"'Plus Jakarta Sans',sans-serif"}}>{data[f]||"—"}</div>}
              </div>
            ))}
          </div>
          <EF label="Νομός / Περιφέρεια" field="prefecture" icon="🗺️"/></>
        },
        {title:"Ώρες Λειτουργίας",icon:"🕐",content:
          <div>
            {DAYS.map(day=>{
              const h=data.hours[day]||{open:"",close:"",closed:true};
              const isOpen=!h.closed;
              const isToday=DAYS[new Date().getDay()===0?6:new Date().getDay()-1]===day;
              return(
                <div key={day} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{width:80,fontSize:12,fontWeight:isToday?800:500,color:isToday?MINT:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{day}{isToday&&<span style={{fontSize:9,color:MINT,marginLeft:4}}>●</span>}</div>
                  {editing?(
                    <>
                      <button onClick={()=>setHrs(day,{...h,closed:!h.closed})} style={{width:44,height:22,borderRadius:11,background:isOpen?MINT:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",position:"relative",flexShrink:0,transition:"background .2s"}}>
                        <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:2,left:isOpen?"calc(100% - 20px)":2,transition:"left .2s"}}/>
                      </button>
                      {isOpen
                        ?<div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                          <input type="time" value={h.open} onChange={e=>setHrs(day,{...h,open:e.target.value})} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 8px",color:T.text,fontSize:12,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
                          <span style={{fontSize:11,color:T.muted}}>—</span>
                          <input type="time" value={h.close} onChange={e=>setHrs(day,{...h,close:e.target.value})} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 8px",color:T.text,fontSize:12,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
                        </div>
                        :<div style={{fontSize:12,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",flex:1}}>Κλειστά</div>
                      }
                    </>
                  ):<div style={{flex:1,fontSize:12,fontFamily:"'DM Mono',monospace",color:isOpen?T.text:T.muted}}>{isOpen?`${h.open} — ${h.close}`:"Κλειστά"}</div>}
                </div>
              );
            })}
          </div>
        },
        {title:"Τραπεζικά Στοιχεία",icon:"💳",content:
          <><div style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#F59E0B",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⚠️ Εμφανίζονται μόνο σε εγκεκριμένες συναλλαγές</div><EF label="Τράπεζα" field="bank" icon="🏦"/><EF label="IBAN" field="iban" icon="💳" mono/></>
        },
        {title:"Σημειώσεις",icon:"📝",content:
          editing
          ?<textarea value={data.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Ειδικότητα, τύποι εργασιών…" style={{width:"100%",background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",resize:"none",minHeight:80,boxSizing:"border-box"}}/>
          :<div style={{fontSize:13,color:data.notes?T.text:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.6,fontStyle:data.notes?undefined:"italic"}}>{data.notes||"Δεν υπάρχουν σημειώσεις"}</div>
        },
      ].map(({title,icon,content})=>(
        <div key={title} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:14,display:"flex",alignItems:"center",gap:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}><span style={{fontSize:18}}>{icon}</span>{title}</div>
          {content}
        </div>
      ))}

      <div style={{background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:14,padding:"14px",display:"flex",gap:12,alignItems:"center"}}>
        <span style={{fontSize:22}}>📄</span>
        <div><div style={{fontSize:13,fontWeight:700,color:"#60A5FA",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>MDR — Στοιχεία Κατασκευαστή</div><div style={{fontSize:11,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Χρησιμοποιούνται αυτόματα στο Statement of Conformity (EU MDR 2017/745)</div></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARDS
// ═══════════════════════════════════════════════════════════════════
function LabDash({ user, orders, openDetail, setPage, T }) {
  const mine    = orders.filter(o=>o.labId===user.id);
  const active  = mine.filter(o=>o.status==="in_progress").length;
  const awaiting= mine.filter(o=>o.status==="waiting_approval").length;
  const rev     = mine.filter(o=>["approved","delivered"].includes(o.status)).reduce((s,o)=>s+netTotal(o.items),0);

  const OrderCard = ({o}) => (
    <div onClick={()=>openDetail(o.id)}
      style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"13px 16px",marginBottom:10,cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:11,background:"rgba(62,207,178,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🦷</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</span><Pill status={o.status}/></div>
          <div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.patient}{o.shade&&<span style={{color:MINT,fontFamily:"'DM Mono',monospace"}}> · VITA {o.shade}</span>}</div>
          <div style={{marginTop:6,height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${pct(o.stages)}%`,background:`linear-gradient(90deg,${MINT},${MINT3})`,borderRadius:2}}/></div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:800,color:MINT,fontFamily:"'DM Mono',monospace"}}>€{netTotal(o.items)}</div>
          {o.chat?.length>0&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>💬 {o.chat.length}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Καλημέρα, {user.name} 👋</div>
        <div style={{fontSize:12,color:T.muted,marginTop:3,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{user.lab}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[{label:"Ενεργές",value:active,icon:"⚡",color:MINT},{label:"Αναμένουν",value:awaiting,icon:"🔔",color:"#A78BFA"},{label:"Τζίρος",value:`€${rev}`,icon:"📈",color:"#34D399"},{label:"Σύνολο",value:mine.length,icon:"📋",color:"#F59E0B"}].map((k,i)=>(
          <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px"}}>
            <div style={{fontSize:20,marginBottom:6}}>{k.icon}</div>
            <div style={{fontSize:24,fontWeight:800,color:k.color,fontFamily:"'DM Mono',monospace"}}>{k.value}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{k.label}</div>
          </div>
        ))}
      </div>
      {awaiting>0&&<div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:14,padding:"12px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:20}}>🔔</span><div><div style={{fontSize:13,fontWeight:700,color:"#A78BFA",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Αναμένεται έγκριση</div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{awaiting} κοστολόγιο{awaiting>1?"α":""}</div></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[{id:"analytics",icon:"📊",label:"Stats",color:"#A78BFA"},{id:"connect",icon:"🔗",label:"Γιατροί",color:MINT},{id:"finance",icon:"💶",label:"Οικον.",color:"#34D399"},{id:"profile",icon:"🏢",label:"Προφίλ",color:"#60A5FA"}].map(item=>(
          <button key={item.id} onClick={()=>setPage(item.id)} style={{background:`${item.color}11`,border:`1px solid ${item.color}33`,borderRadius:12,padding:"10px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:17}}>{item.icon}</span>
            <span style={{fontSize:9,fontWeight:600,color:item.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.label}</span>
          </button>
        ))}
      </div>
      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Πρόσφατες Εργασίες</div>
      {mine.slice(0,5).map(o=><OrderCard key={o.id} o={o}/>)}
    </div>
  );
}

function DoctorDash({ user, orders, openDetail, T }) {
  const mine        = orders.filter(o=>o.doctorId===user.id);
  const needApproval= mine.filter(o=>o.status==="waiting_approval");
  const urgentChat  = mine.filter(o=>o.chat?.some(m=>m.awaitAction==="pending"));

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Καλημέρα 👋</div>
        <div style={{fontSize:12,color:T.muted,marginTop:3,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{user.name} · {user.clinic}</div>
      </div>
      {urgentChat.length>0&&(
        <div style={{background:"rgba(239,68,68,0.08)",border:"2px solid rgba(239,68,68,0.4)",borderRadius:16,padding:"14px",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:"#EF4444",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🚨 Επείγον — Αναμονή Απάντησής Σας</div>
          {urgentChat.map(o=>(
            <div key={o.id} onClick={()=>openDetail(o.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(239,68,68,0.06)",borderRadius:12,cursor:"pointer",marginBottom:6}}>
              <span>🦷</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type} · {o.patient}</div></div>
              <span style={{fontSize:11,fontWeight:800,color:"#EF4444",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Δείτε →</span>
            </div>
          ))}
        </div>
      )}
      {needApproval.length>0&&(
        <div style={{background:"rgba(62,207,178,0.06)",border:"1px solid rgba(62,207,178,0.2)",borderRadius:16,padding:"14px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:MINT,marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⚡ Αναμένεται έγκρισή σας</div>
          {needApproval.map(o=>(
            <div key={o.id} onClick={()=>openDetail(o.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px",background:"rgba(255,255,255,0.03)",borderRadius:10,cursor:"pointer",marginBottom:6}}>
              <span>🦷</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.patient} · €{(netTotal(o.items)*1.24).toFixed(2)} με ΦΠΑ</div></div>
              <span style={{fontSize:11,fontWeight:700,color:MINT,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Δείτε →</span>
            </div>
          ))}
        </div>
      )}
      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Οι Εργασίες μου</div>
      {mine.map(o=>(
        <div key={o.id} onClick={()=>openDetail(o.id)}
          style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"13px 16px",marginBottom:10,cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:"rgba(62,207,178,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🦷</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</span><Pill status={o.status}/></div>
              <div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.patient}{o.shade&&<span style={{color:MINT,fontFamily:"'DM Mono',monospace"}}> · VITA {o.shade}</span>}</div>
              <div style={{marginTop:6,height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${pct(o.stages)}%`,background:`linear-gradient(90deg,${MINT},${MINT3})`,borderRadius:2}}/></div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:14,fontWeight:800,color:MINT,fontFamily:"'DM Mono',monospace"}}>€{(netTotal(o.items)*1.24).toFixed(0)}</div>
              <div style={{fontSize:9,color:T.muted}}>με ΦΠΑ</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TechDash({ user, orders, openDetail, T }) {
  const labOrders = orders.filter(o=>o.labId===user.labId);
  const myStages  = labOrders.flatMap(o=>o.stages.filter(s=>s.done&&s.technicianId===user.id).map(s=>({stage:s,order:o})));
  const commission= myStages.reduce((sum,{order:o})=>sum+netTotal(o.items)/o.stages.length,0)*((user.commission||0)/100);
  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em",color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Καλημέρα, {user.name.split(" ")[0]}!</div>
        <div style={{fontSize:12,color:"#60A5FA",marginTop:3,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{user.specialty} · {user.commission}% κομισιόν</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{background:T.card,border:"1px solid rgba(96,165,250,0.25)",borderRadius:16,padding:"14px"}}>
          <div style={{fontSize:10,color:"#60A5FA",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Στάδια Μήνα</div>
          <div style={{fontSize:28,fontWeight:800,color:T.text,fontFamily:"'DM Mono',monospace"}}>{myStages.length}</div>
        </div>
        <div style={{background:T.card,border:"1px solid rgba(52,211,153,0.25)",borderRadius:16,padding:"14px"}}>
          <div style={{fontSize:10,color:"#34D399",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Κομισιόν</div>
          <div style={{fontSize:28,fontWeight:800,color:"#34D399",fontFamily:"'DM Mono',monospace"}}>€{commission.toFixed(0)}</div>
        </div>
      </div>
      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ενεργές Εργασίες</div>
      {labOrders.filter(o=>["in_progress","pending"].includes(o.status)).map(o=>(
        <div key={o.id} onClick={()=>openDetail(o.id)}
          style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"13px 16px",marginBottom:10,cursor:"pointer"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(96,165,250,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🦷</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.patient}</div></div>
            <Pill status={o.status}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INVITE PARTNERS — QR + link + share, list connected/pending doctors
// ═══════════════════════════════════════════════════════════════════
function InviteQR() {
  const cells = [];
  for (let i=0;i<11;i++) for (let j=0;j<11;j++) {
    const on = (i+j*3+i*j)%3===0 || ((i<3||i>7)&&(j<3||j>7)&&(i+j)%2===0);
    if (on) cells.push(<rect key={i+"-"+j} x={j*9+3} y={i*9+3} width="8" height="8" fill="#0D1F1A"/>);
  }
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{background:"white",borderRadius:12,padding:4}}>
      {cells}
      <rect x="3" y="3" width="26" height="26" fill="none" stroke="#0D1F1A" strokeWidth="4"/>
      <rect x="81" y="3" width="26" height="26" fill="none" stroke="#0D1F1A" strokeWidth="4"/>
      <rect x="3" y="81" width="26" height="26" fill="none" stroke="#0D1F1A" strokeWidth="4"/>
    </svg>
  );
}

function InvitePartners({ orders, user, T }) {
  const [copied, setCopied] = useState(false);
  const link = "medda.gr/join/lab-nektarios-x7k2";
  const connected = USERS.filter(u=>u.role==="doctor").map(d=>({
    ...d, orders: orders.filter(o=>o.doctorId===d.id).length
  }));
  const pending = [{name:"Δρ. Μ. Ιωάννου",clinic:"στάλθηκε 2 μέρες πριν"}];

  return (
    <div style={{padding:"20px 16px 110px"}}>
      <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.04em",color:T.text,marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🔗 Συνεργάτες Γιατροί</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:18,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Προσκάλεσε τους γιατρούς σου να συνδεθούν</div>

      <div style={{background:`linear-gradient(135deg,rgba(62,207,178,0.1),rgba(96,165,250,0.08))`,border:"1px solid rgba(62,207,178,0.25)",borderRadius:20,padding:"20px",marginBottom:20,textAlign:"center"}}>
        <InviteQR/>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginTop:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Σκάναρε για σύνδεση</div>
        <div style={{fontSize:11,color:T.muted,marginTop:2,marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ο γιατρός σκανάρει & συνδέεται αυτόματα μαζί σου</div>
        <div style={{display:"flex",gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"4px 4px 4px 12px",alignItems:"center"}}>
          <span style={{flex:1,fontSize:11,color:MINT,fontFamily:"'DM Mono',monospace",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</span>
          <button onClick={()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:copied?"#34D399":`linear-gradient(135deg,${MINT},${MINT3})`,border:"none",color:"white",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{copied?"✓ Αντιγρ.":"Αντιγραφή"}</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📧 Email</button>
          <button style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,color:"#25D366",borderRadius:10,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💬 WhatsApp</button>
          <button style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📲 SMS</button>
        </div>
      </div>

      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Συνδεδεμένοι ({connected.length})</div>
      {connected.map(d=>(
        <div key={d.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"center"}}>
          <Av user={d} size={40}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.name}</div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.clinic} · {d.orders} εργασίες</div></div>
          <span style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"rgba(52,211,153,0.12)",color:"#34D399",fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>● Ενεργός</span>
        </div>
      ))}

      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,marginTop:16,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εκκρεμείς προσκλήσεις ({pending.length})</div>
      {pending.map((d,i)=>(
        <div key={i} style={{background:T.card,border:`1px dashed ${T.border}`,borderRadius:14,padding:"13px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"center",opacity:0.85}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:T.faint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⏳</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.name}</div><div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d.clinic}</div></div>
          <button style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:T.faint,border:`1px solid ${T.border}`,color:MINT,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ξανά</button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [isDark, setIsDark]     = useState(true);
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState("dashboard");
  const [orders, setOrders]     = useState(ORDERS_INIT);
  const [expenses, setExpenses] = useState(EXPENSES_INIT);
  const [profile, setProfile]   = useState(LAB_PROFILE_INIT);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingUser, setPendingUser] = useState(null); // χρήστης που συνδέθηκε αλλά δεν έχει διαλέξει ρόλο
  const [readIds, setReadIds] = useState([]); // ids ειδοποιήσεων που διαβάστηκαν

  const T       = isDark ? DARK : LIGHT;
  const order   = orders.find(o=>o.id===selectedId);
  const openDetail = id => { setSelectedId(id); setPage("detail"); };
  const handleApprove = comment => {
    setOrders(prev=>prev.map(o=>o.id===selectedId?{...o,status:"approved",approved:true,doctorComment:comment}:o));
  };

  const myOrders = user ? orders.filter(o=>
    user.role==="lab"         ? o.labId===user.id
    : (user.role==="technician"||user.role==="student") ? o.labId===user.labId
    : o.doctorId===user.id
  ) : [];

  const badgeCount = user
    ? orders.filter(o=>(user.role==="lab"?o.labId===user.id:o.doctorId===user.id)&&o.status==="waiting_approval").length
    : 0;
  const notifUnread = user
    ? buildNotifications(orders, user).filter(n=>n.unread && !readIds.includes(n.id)).length
    : 0;

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        textarea, input, button, select { font-family: 'Plus Jakarta Sans', sans-serif; }
        input[type="date"], input[type="time"] { color-scheme: dark; }
      `}</style>

      {/* ── LOGIN → ONBOARDING → APP ── */}
      {!user && !pendingUser ? (
        <Login
          onLogin={(u)=>{
            // Demo users already have a role → enter directly.
            // A fresh sign-in (no role) would go to RoleSelect first.
            if (u.role) setUser(u);
            else setPendingUser(u);
          }}
          onNewAccount={()=>setPendingUser({ id:"new", name:"Νέος Χρήστης", email:"new.user@gmail.com", avatar:"?", role:null })}
          T={T} isDark={isDark}
        />
      ) : pendingUser ? (
        <RoleSelect
          email={pendingUser.email}
          T={T}
          onPick={(role)=>{
            // Κλειδώνει τον ρόλο στον χρήστη (σε production: γράφεται στη βάση δίπλα στο email)
            const finalUser = role==="lab"
              ? { ...pendingUser, role:"lab", name:pendingUser.name==="Νέος Χρήστης"?"Νεκτάριος":pendingUser.name, lab:"Εργαστήριο Νεκτάριου", id:"u1" }
              : role==="doctor"
              ? { ...pendingUser, role:"doctor", clinic:"Νέο Ιατρείο", id:"u2" }
              : role==="technician"
              ? { ...pendingUser, role:"technician", lab:"Εργαστήριο Νεκτάριου", labId:"u1", specialty:"Νέος τεχνίτης", commission:30 }
              : { ...pendingUser, role:"student", lab:"Σχολή", labId:"u1", specialty:"Φοιτητής Οδοντοτεχνικής" };
            setUser(finalUser);
            setPendingUser(null);
            setPage("dashboard");
          }}
        />
      ) : (
        <>
          {/* ── TOP BAR ── */}
          {page!=="detail"&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 16px 8px",background:T.bg,position:"sticky",top:0,zIndex:50,backdropFilter:"blur(10px)"}}>
              <Logo size={32} T={T}/>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setPage("search")} style={{background:T.faint,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",fontSize:14}}>🔍</button>
                <button onClick={()=>setPage("notifications")} style={{background:T.faint,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",fontSize:14,position:"relative"}}>
                  🔔
                  {notifUnread>0&&<span style={{position:"absolute",top:-3,right:-3,minWidth:16,height:16,padding:"0 4px",borderRadius:8,background:"#EF4444",color:"white",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.bg}`}}>{notifUnread}</span>}
                </button>
                <button onClick={()=>setIsDark(!isDark)} style={{background:T.faint,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",fontSize:14}}>{isDark?"☀️":"🌙"}</button>
                <button onClick={()=>{setUser(null);setPendingUser(null);setPage("dashboard");}} style={{background:"none",border:"none",cursor:"pointer"}}><Av user={user} size={32}/></button>
              </div>
            </div>
          )}

          {/* ── PAGES ── */}
          {page==="dashboard"&&user.role==="lab"        &&<LabDash    user={user} orders={orders} openDetail={openDetail} setPage={setPage} T={T}/>}
          {page==="dashboard"&&user.role==="doctor"     &&<DoctorDash user={user} orders={orders} openDetail={openDetail} T={T}/>}
          {page==="dashboard"&&user.role==="technician"&&<TechDash user={user} orders={orders} openDetail={openDetail} T={T}/>}
          {page==="dashboard"&&user.role==="student"&&<StudentNotebook user={user} T={T}/>}

          {page==="orders"&&(
            <div style={{padding:"20px 16px 110px"}}>
              <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:16,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Εργασίες</div>
              {myOrders.map(o=>(
                <div key={o.id} onClick={()=>openDetail(o.id)}
                  style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"13px 16px",marginBottom:10,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:40,height:40,borderRadius:11,background:"rgba(62,207,178,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🦷</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</span><Pill status={o.status}/></div>
                      <div style={{fontSize:11,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.patient}{o.shade&&<span style={{color:MINT,fontFamily:"'DM Mono',monospace"}}> · VITA {o.shade}</span>}</div>
                      <div style={{marginTop:5,height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${pct(o.stages)}%`,background:`linear-gradient(90deg,${MINT},${MINT3})`,borderRadius:2}}/></div>
                    </div>
                    {user.role!=="student"&&<div style={{fontSize:14,fontWeight:800,color:MINT,fontFamily:"'DM Mono',monospace"}}>€{netTotal(o.items)}</div>}
                  </div>
                </div>
              ))}
              {myOrders.length===0&&<div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Δεν υπάρχουν εργασίες ακόμα</div>}
            </div>
          )}

          {page==="odontogram" &&<OdontogramPage user={user} orders={orders} setOrders={setOrders} T={T}/>}
          {page==="finance"    &&user.role==="lab"&&<FinancePage orders={orders} expenses={expenses} setExpenses={setExpenses} T={T}/>}
          {page==="analytics"  &&<Analytics orders={orders} T={T}/>}
          {page==="profile"    &&<ProfilePage profile={profile} setProfile={setProfile} T={T}/>}
          {page==="notifications"&&<NotificationsPage orders={orders} user={user} openDetail={openDetail} readIds={readIds} setReadIds={setReadIds} T={T}/>}
          {page==="calendar"&&<CalendarPage orders={myOrders} openDetail={openDetail} T={T}/>}
          {page==="search"&&<SearchPage orders={orders} user={user} openDetail={openDetail} T={T}/>}

          {page==="history"&&(()=>{
            const groups={};
            myOrders.forEach(o=>{if(!groups[o.patient])groups[o.patient]=[];groups[o.patient].push(o);});
            return(
              <div style={{padding:"20px 16px 110px"}}>
                <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:16,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 Ιστορικό Ασθενών</div>
                {Object.entries(groups).map(([patient,pOrders])=>(
                  <div key={patient} style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${MINT},${MINT3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"white"}}>{patient.charAt(0)}</div>
                      <div><div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{patient}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{pOrders.length} εργασί{pOrders.length>1?"ες":"α"}</div></div>
                    </div>
                    {pOrders.map(o=>(
                      <div key={o.id} onClick={()=>openDetail(o.id)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"11px 14px",marginBottom:6,marginLeft:46,cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                        <span>🦷</span>
                        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.type}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{o.material&&<span style={{color:MINT}}>{o.material} </span>}{o.shade&&`VITA ${o.shade}`}</div></div>
                        <Pill status={o.status}/>
                      </div>
                    ))}
                  </div>
                ))}
                {Object.keys(groups).length===0&&<div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Δεν υπάρχουν ασθενείς</div>}
              </div>
            );
          })()}

          {page==="connect"&&<InvitePartners orders={orders} user={user} T={T}/>}

          {/* ── DETAIL ── */}
          {page==="detail"&&order&&(
            <Detail user={user} order={order} onBack={()=>setPage("orders")} onApprove={handleApprove} setOrders={setOrders} profile={profile} T={T}/>
          )}

          {/* ── BOTTOM NAV ── */}
          {page!=="detail"&&(
            <BottomNav page={page} setPage={setPage} role={user.role} T={T} isDark={isDark} badgeCount={badgeCount}/>
          )}
        </>
      )}
    </div>
  );
}
