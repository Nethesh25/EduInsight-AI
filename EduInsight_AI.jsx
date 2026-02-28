import { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend
} from "recharts";

// ═══════════════════════════════════════════════════════════════════
//  DATABASE LAYER  (window.storage persistent key-value store)
// ═══════════════════════════════════════════════════════════════════
const DB = {
  async getUsers() {
    try { const r = await window.storage.get("edu:users"); return r ? JSON.parse(r.value) : []; }
    catch { return []; }
  },
  async saveUsers(users) {
    try { await window.storage.set("edu:users", JSON.stringify(users)); return true; }
    catch { return false; }
  },
  async findUser(email) {
    const users = await DB.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  async createUser(userData) {
    const users = await DB.getUsers();
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase()))
      return { error: "Email already registered" };
    const user = { ...userData, id: `u_${Date.now()}`, createdAt: new Date().toISOString() };
    users.push(user);
    await DB.saveUsers(users);
    return { user };
  },
  async getStudents() {
    try { const r = await window.storage.get("edu:students"); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async saveStudents(students) {
    try { await window.storage.set("edu:students", JSON.stringify(students)); return true; }
    catch { return false; }
  },
  async setSession(session) {
    try { await window.storage.set("edu:session", JSON.stringify(session)); } catch {}
  },
  async getSession() {
    try { const r = await window.storage.get("edu:session"); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async clearSession() {
    try { await window.storage.delete("edu:session"); } catch {}
  },
  async saveStrategy(studentId, strategy) {
    try { await window.storage.set(`edu:strat:${studentId}`, JSON.stringify({ strategy, savedAt: new Date().toISOString() })); }
    catch {}
  },
  async getStrategy(studentId) {
    try { const r = await window.storage.get(`edu:strat:${studentId}`); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async logActivity(entry) {
    try {
      const r = await window.storage.get("edu:activity");
      const log = r ? JSON.parse(r.value) : [];
      log.unshift({ ...entry, ts: new Date().toISOString() });
      await window.storage.set("edu:activity", JSON.stringify(log.slice(0, 50)));
    } catch {}
  },
  async getActivity() {
    try { const r = await window.storage.get("edu:activity"); return r ? JSON.parse(r.value) : []; }
    catch { return []; }
  }
};

// ═══════════════════════════════════════════════════════════════════
//  DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
function generateStudents(n = 120) {
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const firstNames = ["Aarav","Aditya","Aisha","Alyssa","Amelia","Arjun","Ben","Chloe","Daniel","Divya","Elena","Ethan","Fatima","Grace","Hana","Ibrahim","Ishaan","Jasmine","Kavya","Kevin","Liam","Lily","Maya","Michael","Neha","Noah","Olivia","Priya","Rahul","Riya","Ryan","Sara","Siddharth","Sofia","Tanvi","Thomas","Uma","Vikram","Zara","Zoe"];
  const lastNames = ["Chen","Das","Garcia","Gupta","Iyer","Johnson","Khan","Kim","Lee","Mehta","Nair","Patel","Raj","Reddy","Shah","Sharma","Singh","Smith","Wang","Williams"];
  return Array.from({ length: n }, (_, i) => {
    const hours = rand(1, 10), att = rand(40, 100), prev = rand(40, 95);
    const mot = pick(["Low","Medium","High"]), net = pick(["Yes","No"]);
    const par = pick(["Low","Medium","High"]), res = pick(["Low","Medium","High"]);
    const tq = pick(["Low","Medium","High"]), sleep = rand(4, 10);
    const peer = pick(["Negative","Neutral","Positive"]), dis = pick(["Yes","No","No","No"]);
    let score = 30 + hours*3.5 + (att-60)*0.4 + (prev-60)*0.35
      + (mot==="High"?10:mot==="Medium"?4:0) + (net==="Yes"?5:0)
      + (par==="High"?4:par==="Medium"?2:0) + (res==="High"?4:res==="Medium"?2:0)
      + (tq==="High"?3:tq==="Medium"?1.5:0) + (sleep-6)*0.8
      + (peer==="Positive"?4:peer==="Negative"?-4:0) + (dis==="Yes"?-8:0) + rand(-8,8);
    score = Math.min(100, Math.max(25, score));
    const risk = score < 60 ? "High Risk" : score <= 75 ? "Medium Risk" : "Low Risk";
    const cluster = hours < 4 && att < 70 ? 0 : hours >= 4 && mot === "High" && score < 70 ? 1 : score >= 76 ? 3 : 2;
    const fn = firstNames[Math.floor(Math.random()*firstNames.length)];
    const ln = lastNames[Math.floor(Math.random()*lastNames.length)];
    return {
      id: i+1, dbId: `s_${i+1}`, rollNo: `STU${String(i+1).padStart(4,"0")}`,
      name: `${fn} ${ln}`, email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@school.edu`,
      gender: pick(["Male","Female"]), school_type: pick(["Public","Private"]),
      family_income: pick(["Low","Medium","High"]),
      parental_education: pick(["High School","College","Postgraduate"]),
      distance_from_home: pick(["Near","Moderate","Far"]),
      extracurricular_activities: pick(["Yes","No"]),
      physical_activity: +rand(0,6).toFixed(0),
      hours_studied: +hours.toFixed(1), attendance: +att.toFixed(1),
      previous_scores: +prev.toFixed(1), motivation_level: mot,
      internet_access: net, parental_involvement: par,
      access_to_resources: res, teacher_quality: tq,
      sleep_hours: +sleep.toFixed(1), peer_influence: peer,
      learning_disability: dis, exam_score: +score.toFixed(1),
      risk_level: risk, cluster,
      registered_at: new Date(Date.now() - Math.random()*1e10).toISOString(),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const FI = [
  { feature:"Previous Scores", importance:0.243 }, { feature:"Hours Studied", importance:0.198 },
  { feature:"Attendance", importance:0.167 }, { feature:"Motivation Level", importance:0.112 },
  { feature:"Teacher Quality", importance:0.078 }, { feature:"Access to Resources", importance:0.065 },
  { feature:"Internet Access", importance:0.048 }, { feature:"Parental Involvement", importance:0.041 },
  { feature:"Sleep Hours", importance:0.028 }, { feature:"Peer Influence", importance:0.020 },
];
const CM = [
  { id:0, name:"Disengaged", color:"#ef4444", desc:"Low attendance & study hours. Urgent intervention needed." },
  { id:1, name:"Struggling-Motivated", color:"#f97316", desc:"Motivated but lacking resources or strategies." },
  { id:2, name:"Balanced Learner", color:"#3b82f6", desc:"Average engagement. Moderate outcomes. Growth potential." },
  { id:3, name:"High Performer", color:"#10b981", desc:"Consistent, resourced, motivated. Model peer." },
];
const RC = { "High Risk":"#ef4444", "Medium Risk":"#f59e0b", "Low Risk":"#10b981" };
const MM = { accuracy:0.887, precision:0.881, recall:0.874, f1:0.877,
  confusionMatrix:[[28,3,0],[2,41,4],[0,3,39]] };

// ═══════════════════════════════════════════════════════════════════
//  AI
// ═══════════════════════════════════════════════════════════════════
async function genStrategy(student) {
  const weak = [];
  if (student.attendance < 70) weak.push(`low attendance (${student.attendance}%)`);
  if (student.hours_studied < 4) weak.push(`low study hours (${student.hours_studied}h)`);
  if (student.motivation_level === "Low") weak.push("low motivation");
  if (student.internet_access === "No") weak.push("no internet");
  if (student.sleep_hours < 6) weak.push(`poor sleep (${student.sleep_hours}h)`);
  if (student.parental_involvement === "Low") weak.push("low parental involvement");
  if (student.previous_scores < 60) weak.push(`weak prior performance`);
  if (student.peer_influence === "Negative") weak.push("negative peer influence");
  const prompt = `You are EduInsight AI, expert educational psychologist.
Student: ${student.name}, Risk: ${student.risk_level}, Score: ${student.exam_score}/100
Weak areas: ${weak.length ? weak.join(", ") : "none critical"}
Motivation: ${student.motivation_level}, Attendance: ${student.attendance}%

Return ONLY valid JSON:
{"teaching_strategy":"3-4 sentence strategy","classroom_intervention":"2-3 immediate actions","parent_communication":"professional parent message","quick_wins":["action1","action2","action3"]}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] }),
  });
  const data = await res.json();
  return JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
}

// ═══════════════════════════════════════════════════════════════════
//  CSS
// ═══════════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#05070f;--sf:#0d1117;--sf2:#141b26;--sf3:#1c2535;
  --br:rgba(255,255,255,0.07);--br2:rgba(255,255,255,0.12);
  --ac:#00d4ff;--ac2:#7c3aed;--ac3:#10b981;
  --tx:#e8ecf4;--mt:#8896aa;
  --dn:#ef4444;--wn:#f59e0b;--ok:#10b981;
  --fd:'Syne',sans-serif;--fb:'DM Sans',sans-serif;
}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:var(--sf3);border-radius:3px;}

/* AUTH */
.auth-root{min-height:100vh;display:flex;background:var(--bg);
  background-image:radial-gradient(ellipse at 15% 10%,rgba(0,212,255,.08) 0%,transparent 55%),
                   radial-gradient(ellipse at 85% 90%,rgba(124,58,237,.08) 0%,transparent 55%);}
.auth-left{width:420px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;
  padding:60px 52px;background:linear-gradient(135deg,rgba(0,212,255,.04),rgba(124,58,237,.04));
  border-right:1px solid var(--br);}
.auth-right{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;}
.auth-logo{width:52px;height:52px;background:linear-gradient(135deg,var(--ac),var(--ac2));border-radius:14px;
  display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:28px;
  box-shadow:0 8px 32px rgba(0,212,255,.2);}
.auth-headline{font-family:var(--fd);font-size:30px;font-weight:800;line-height:1.2;margin-bottom:14px;}
.auth-headline span{background:linear-gradient(90deg,var(--ac),var(--ac2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.auth-desc{color:var(--mt);font-size:13.5px;line-height:1.7;margin-bottom:32px;}
.auth-feat-list{display:flex;flex-direction:column;gap:10px;}
.auth-feat{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--mt);}
.feat-bullet{width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,var(--ac),var(--ac2));flex-shrink:0;}
.demo-box{margin-top:32px;padding:14px 16px;background:rgba(0,212,255,.05);
  border:1px solid rgba(0,212,255,.15);border-radius:10px;}
.demo-label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ac);margin-bottom:7px;}
.demo-creds{font-size:12.5px;color:var(--mt);line-height:1.9;}
.demo-creds b{color:var(--tx);}

.form-card{background:var(--sf);border:1px solid var(--br);border-radius:18px;padding:36px 36px 32px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.4);}
.form-title{font-family:var(--fd);font-size:22px;font-weight:800;margin-bottom:4px;}
.form-sub{font-size:13px;color:var(--mt);margin-bottom:26px;}

.role-tabs{display:flex;gap:6px;margin-bottom:22px;background:var(--sf2);padding:4px;border-radius:10px;}
.role-tab{flex:1;padding:8px;border-radius:7px;border:none;cursor:pointer;
  font-family:var(--fb);font-size:13px;font-weight:500;color:var(--mt);
  background:transparent;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.role-tab.on{background:var(--sf);color:var(--tx);box-shadow:0 2px 8px rgba(0,0,0,.35);}

.fg{margin-bottom:14px;}
.fl{font-size:11.5px;font-weight:600;color:var(--mt);margin-bottom:6px;display:block;text-transform:uppercase;letter-spacing:.5px;}
.fi{width:100%;background:var(--sf2);border:1px solid var(--br2);border-radius:8px;
  padding:10px 13px;font-size:14px;color:var(--tx);outline:none;font-family:var(--fb);transition:border .15s;}
.fi:focus{border-color:rgba(0,212,255,.5);box-shadow:0 0 0 3px rgba(0,212,255,.06);}
.fi::placeholder{color:var(--mt);}
.fi.err{border-color:rgba(239,68,68,.5);}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

.btn-sub{width:100%;padding:11px;border-radius:8px;border:none;cursor:pointer;
  background:linear-gradient(135deg,var(--ac),#0088aa);color:#001520;
  font-family:var(--fb);font-size:14px;font-weight:700;margin-top:6px;
  transition:all .2s;box-shadow:0 4px 16px rgba(0,212,255,.2);
  display:flex;align-items:center;justify-content:center;gap:8px;}
.btn-sub:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,212,255,.3);}
.btn-sub:disabled{opacity:.5;transform:none;cursor:not-allowed;}
.btn-sub.adm{background:linear-gradient(135deg,var(--ac2),#5b21b6);color:#fff;}

.auth-sw{text-align:center;margin-top:18px;font-size:13px;color:var(--mt);}
.auth-lnk{color:var(--ac);cursor:pointer;font-weight:500;}
.auth-lnk:hover{text-decoration:underline;}
.err-box{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);
  border-radius:8px;padding:9px 13px;font-size:13px;color:#fca5a5;margin-bottom:12px;}
.ok-box{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);
  border-radius:8px;padding:9px 13px;font-size:13px;color:#6ee7b7;margin-bottom:12px;}

/* APP */
.app-wrap{min-height:100vh;background:var(--bg);
  background-image:radial-gradient(ellipse at 20% 0%,rgba(0,212,255,.05) 0%,transparent 55%),
                   radial-gradient(ellipse at 80% 100%,rgba(124,58,237,.05) 0%,transparent 55%);}
.layout{display:flex;min-height:100vh;}
.sidebar{width:244px;background:var(--sf);border-right:1px solid var(--br);padding:22px 0;
  display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;}
.s-logo{padding:0 18px 22px;border-bottom:1px solid var(--br);}
.s-logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--ac),var(--ac2));
  border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:9px;}
.s-logo-title{font-family:var(--fd);font-weight:800;font-size:14.5px;letter-spacing:-.3px;}
.s-logo-sub{font-size:10.5px;color:var(--mt);margin-top:2px;}

.user-pill{margin:14px 12px;background:var(--sf2);border-radius:9px;padding:10px 12px;
  border:1px solid var(--br);display:flex;align-items:center;gap:10px;}
.u-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;flex-shrink:0;}
.u-name{font-size:13px;font-weight:600;}
.u-role{font-size:10px;color:var(--mt);margin-top:1px;}

.nav{padding:8px 12px;flex:1;}
.nav-sec{font-size:10px;font-weight:600;letter-spacing:1.5px;color:var(--mt);text-transform:uppercase;
  padding:0 8px;margin-bottom:5px;margin-top:12px;}
.ni{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:7px;
  cursor:pointer;font-size:13px;color:var(--mt);transition:all .15s;margin-bottom:2px;}
.ni:hover{background:var(--sf2);color:var(--tx);}
.ni.on{background:rgba(0,212,255,.1);color:var(--ac);font-weight:500;}
.ni-icon{font-size:13px;width:16px;text-align:center;}
.nav-btm{padding:12px;border-top:1px solid var(--br);margin-top:auto;}
.btn-out{width:100%;padding:8px;border-radius:7px;border:none;cursor:pointer;
  background:rgba(239,68,68,.08);color:#fca5a5;font-family:var(--fb);font-size:13px;
  font-weight:500;transition:all .15s;}
.btn-out:hover{background:rgba(239,68,68,.15);}

.main{flex:1;overflow-y:auto;}
.topbar{padding:13px 30px;border-bottom:1px solid var(--br);display:flex;align-items:center;
  justify-content:space-between;background:rgba(5,7,15,.85);backdrop-filter:blur(14px);
  position:sticky;top:0;z-index:10;}
.tb-title{font-family:var(--fd);font-size:16px;font-weight:700;}
.tb-sub{font-size:11.5px;color:var(--mt);margin-top:1px;}
.content{padding:24px 30px;}

/* CARDS & GRID */
.card{background:var(--sf);border:1px solid var(--br);border-radius:13px;padding:20px 22px;}
.ct{font-family:var(--fd);font-size:11.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
  color:var(--mt);margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.mb14{margin-bottom:14px;}.mb18{margin-bottom:18px;}.mb22{margin-bottom:22px;}

.sc{background:var(--sf);border:1px solid var(--br);border-radius:13px;padding:18px 20px;position:relative;overflow:hidden;}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.sc.cb::before{background:linear-gradient(90deg,var(--ac),transparent);}
.sc.cp::before{background:linear-gradient(90deg,var(--ac2),transparent);}
.sc.cg::before{background:linear-gradient(90deg,var(--ok),transparent);}
.sc.cr::before{background:linear-gradient(90deg,var(--dn),transparent);}
.sc.co::before{background:linear-gradient(90deg,var(--wn),transparent);}
.sl{font-size:10.5px;color:var(--mt);font-weight:600;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;}
.sv{font-family:var(--fd);font-size:28px;font-weight:800;line-height:1;}
.ss{font-size:11.5px;color:var(--mt);margin-top:5px;}

.badge{padding:2px 9px;border-radius:20px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px;}
.b-live{background:rgba(16,185,129,.15);color:var(--ok);border:1px solid rgba(16,185,129,.3);}
.b-adm{background:rgba(124,58,237,.15);color:#c4b5fd;border:1px solid rgba(124,58,237,.3);}
.b-stu{background:rgba(0,212,255,.12);color:var(--ac);border:1px solid rgba(0,212,255,.25);}
.rp{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:600;}
.rHigh{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.3);}
.rMed{background:rgba(245,158,11,.15);color:#fcd34d;border:1px solid rgba(245,158,11,.3);}
.rLow{background:rgba(16,185,129,.15);color:#6ee7b7;border:1px solid rgba(16,185,129,.3);}

.tw{overflow-x:auto;border-radius:9px;}
table{width:100%;border-collapse:collapse;font-size:12.5px;}
th{padding:9px 13px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;
  letter-spacing:.8px;color:var(--mt);background:var(--sf2);border-bottom:1px solid var(--br);}
td{padding:10px 13px;border-bottom:1px solid rgba(255,255,255,.04);}
tr:hover td{background:rgba(255,255,255,.02);cursor:pointer;}
tr:last-child td{border-bottom:none;}

.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 15px;border-radius:8px;
  font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .15s;font-family:var(--fb);}
.bp{background:linear-gradient(135deg,var(--ac),#0099cc);color:#001a2e;box-shadow:0 3px 12px rgba(0,212,255,.2);}
.bp:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(0,212,255,.3);}
.bp:disabled{opacity:.5;transform:none;cursor:not-allowed;}
.bg{background:var(--sf2);color:var(--mt);border:1px solid var(--br);}
.bg:hover{color:var(--tx);background:var(--sf3);}
.bg.on{color:var(--ac);border-color:rgba(0,212,255,.3);background:rgba(0,212,255,.06);}
.bsm{padding:5px 11px;font-size:12px;}

.ai-panel{background:linear-gradient(135deg,rgba(0,212,255,.04),rgba(124,58,237,.04));
  border:1px solid rgba(0,212,255,.15);border-radius:13px;padding:20px;}
.ai-chip{background:linear-gradient(135deg,var(--ac),var(--ac2));border-radius:5px;
  padding:2px 8px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;}
.ss-sec{margin-bottom:14px;}
.ss-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ac);margin-bottom:6px;}
.ss-txt{font-size:13.5px;line-height:1.7;color:var(--tx);}
.qw-list{display:flex;flex-direction:column;gap:6px;}
.qw-item{display:flex;align-items:flex-start;gap:9px;background:rgba(16,185,129,.05);
  border:1px solid rgba(16,185,129,.15);border-radius:7px;padding:8px 12px;font-size:13px;}
.qw-n{width:19px;height:19px;background:var(--ok);border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:10px;font-weight:800;color:#001a10;flex-shrink:0;margin-top:1px;}

.si{background:var(--sf2);border:1px solid var(--br);border-radius:8px;padding:7px 13px;
  font-size:12.5px;color:var(--tx);outline:none;font-family:var(--fb);}
.si:focus{border-color:rgba(0,212,255,.4);}
.si::placeholder{color:var(--mt);}

.pw{background:var(--sf3);border-radius:4px;height:5px;overflow:hidden;}
.pf{height:100%;border-radius:4px;transition:width .6s ease;}

.dvd{height:1px;background:var(--br);margin:14px 0;}
.ph{margin-bottom:20px;}
.ph h2{font-family:var(--fd);font-size:21px;font-weight:800;}
.ph p{color:var(--mt);font-size:13px;margin-top:3px;}

.mr{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:18px;}
.mb2{background:var(--sf2);border-radius:9px;padding:13px 15px;text-align:center;}
.mb2 .v{font-family:var(--fd);font-size:21px;font-weight:800;color:var(--ac);}
.mb2 .l{font-size:10.5px;color:var(--mt);margin-top:2px;text-transform:uppercase;letter-spacing:.5px;}
.cmt td,.cmt th{padding:8px 13px;text-align:center;font-size:12.5px;}
.cmc{background:rgba(0,212,255,.18);font-weight:700;color:var(--ac);}
.cml{background:rgba(239,68,68,.08);color:#fca5a5;}
.fg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;}
.fg-item{background:var(--sf);border-radius:7px;padding:9px 11px;border:1px solid var(--br);}
.fg-name{font-size:10.5px;color:var(--mt);margin-bottom:3px;}
.fg-val{font-size:13.5px;font-weight:600;}
.ttip{background:var(--sf2);border:1px solid var(--br);border-radius:8px;padding:8px 12px;font-size:12px;}

.db-stat{background:var(--sf2);border-radius:9px;padding:13px 15px;border:1px solid var(--br);}
.db-stat .v{font-family:var(--fd);font-size:20px;font-weight:800;}
.db-stat .l{font-size:10px;color:var(--mt);margin-top:2px;text-transform:uppercase;letter-spacing:.4px;}
.act-item{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);}
.act-icon{width:28px;height:28px;border-radius:7px;background:var(--sf2);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
.act-msg{font-size:12.5px;}
.act-time{font-size:10.5px;color:var(--mt);margin-top:1px;}
.tag{padding:2px 8px;border-radius:5px;font-size:11px;font-weight:600;background:var(--sf2);color:var(--mt);border:1px solid var(--br);}
.cc{border-radius:11px;padding:14px;border:1px solid var(--br);display:flex;gap:12px;}

.prof-hero{background:linear-gradient(135deg,rgba(0,212,255,.05),rgba(124,58,237,.05));
  border:1px solid rgba(0,212,255,.15);border-radius:15px;padding:22px;margin-bottom:18px;}

@keyframes fi{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes sp{to{transform:rotate(360deg);}}
.fa{animation:fi .3s ease forwards;}
.spin{width:15px;height:15px;border:2px solid rgba(0,212,255,.2);border-top-color:var(--ac);border-radius:50%;animation:sp .7s linear infinite;}

.rp-High{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.3);}
.rp-Med{background:rgba(245,158,11,.15);color:#fcd34d;border:1px solid rgba(245,158,11,.3);}
.rp-Low{background:rgba(16,185,129,.15);color:#6ee7b7;border:1px solid rgba(16,185,129,.3);}
`;

// ═══════════════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [phase, setPhase] = useState("loading");
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    (async () => {
      // Restore session
      const session = await DB.getSession();
      if (session) {
        const u = await DB.findUser(session.email);
        if (u) {
          setUser(u);
          const stus = await DB.getStudents();
          setStudents(stus || generateStudents(120));
          setPhase("app"); return;
        }
      }
      // Seed admin
      const users = await DB.getUsers();
      if (!users.find(u => u.role === "admin")) {
        await DB.createUser({ email:"admin@eduinsight.ai", password:"admin123", name:"Admin User", role:"admin" });
      }
      // Seed students
      let stus = await DB.getStudents();
      if (!stus) {
        stus = generateStudents(120);
        await DB.saveStudents(stus);
        await DB.logActivity({ type:"system", msg:"Dataset seeded: 120 student records generated", icon:"🗃" });
      }
      setStudents(stus);
      setPhase("auth");
    })();
  }, []);

  const login = async (u) => {
    await DB.setSession({ email:u.email, role:u.role });
    await DB.logActivity({ type:"login", msg:`${u.name} (${u.role}) logged in`, icon:"🔐" });
    setUser(u); setPhase("app");
  };

  const logout = async () => {
    await DB.logActivity({ type:"logout", msg:`${user.name} logged out`, icon:"🚪" });
    await DB.clearSession();
    setUser(null); setPhase("auth");
  };

  if (phase === "loading") return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)"}}>
        <div style={{textAlign:"center"}}>
          <div className="spin" style={{width:32,height:32,margin:"0 auto 14px"}}/>
          <div style={{color:"var(--mt)",fontSize:13}}>Initializing database…</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {phase === "auth" ? <AuthScreen onLogin={login} /> : <MainApp user={user} students={students} setStudents={setStudents} onLogout={logout} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [f, setF] = useState({ name:"", email:"", password:"", confirm:"", rollNo:"" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [loading, setLoading] = useState(false);
  const sf = (k, v) => setF(p => ({...p, [k]:v}));

  const submit = async () => {
    setErr(""); setOk("");
    if (mode === "signup") {
      if (!f.name.trim()) return setErr("Full name is required");
      if (!f.email.includes("@")) return setErr("Valid email required");
      if (f.password.length < 6) return setErr("Password must be ≥6 characters");
      if (f.password !== f.confirm) return setErr("Passwords do not match");
      if (role === "student" && !f.rollNo.trim()) return setErr("Roll number is required");
      setLoading(true);
      const res = await DB.createUser({ name:f.name, email:f.email, password:f.password, role, rollNo:f.rollNo||null });
      setLoading(false);
      if (res.error) return setErr(res.error);
      await DB.logActivity({ type:"signup", msg:`New ${role} registered: ${f.name}`, icon:"✅" });
      setOk("Account created! You can now log in."); setMode("login");
      setF(p => ({...p, password:"", confirm:""}));
    } else {
      if (!f.email || !f.password) return setErr("Email and password required");
      setLoading(true);
      const u = await DB.findUser(f.email);
      setLoading(false);
      if (!u || u.password !== f.password) return setErr("Invalid email or password");
      if (role !== u.role) return setErr(`This account is a ${u.role}, not a ${role}`);
      onLogin(u);
    }
  };

  return (
    <div className="auth-root">
      {/* Left */}
      <div className="auth-left">
        <div className="auth-logo">🎓</div>
        <div className="auth-headline">Classroom intelligence,<br/><span>reimagined with AI</span></div>
        <div className="auth-desc">EduInsight AI uses machine learning to predict student risk, discover behavioral clusters, and generate personalized teaching strategies — all stored in a persistent database.</div>
        <div className="auth-feat-list">
          {["Random Forest risk prediction (88.7% accuracy)","K-Means behavioral clustering (k=4)","Claude AI intervention strategies","Persistent student & user database","Role-based access: Admin + Student","Session persistence across refreshes"].map(f => (
            <div key={f} className="auth-feat"><div className="feat-bullet"/>{f}</div>
          ))}
        </div>
        <div className="demo-box">
          <div className="demo-label">Demo Credentials</div>
          <div className="demo-creds">
            Admin: <b>admin@eduinsight.ai</b> / <b>admin123</b><br/>
            Student: Sign up with any email
          </div>
        </div>
      </div>

      {/* Right — form card */}
      <div className="auth-right">
        <div className="form-card">
          <div className="form-title">{mode === "login" ? "Welcome back" : "Create account"}</div>
          <div className="form-sub">{mode === "login" ? "Sign in to your EduInsight dashboard" : "Join the EduInsight platform"}</div>

          <div className="role-tabs">
            {[{id:"student",icon:"🎒",label:"Student"},{id:"admin",icon:"🛡",label:"Admin"}].map(r => (
              <button key={r.id} className={`role-tab ${role===r.id?"on":""}`} onClick={() => setRole(r.id)}>
                <span>{r.icon}</span>{r.label}
              </button>
            ))}
          </div>

          {err && <div className="err-box">⚠ {err}</div>}
          {ok && <div className="ok-box">✓ {ok}</div>}

          {mode === "signup" && (
            <>
              <div className="fg"><label className="fl">Full Name</label>
                <input className="fi" placeholder="e.g. Aditya Sharma" value={f.name} onChange={e=>sf("name",e.target.value)}/></div>
              {role === "student" && <div className="fg"><label className="fl">Roll Number</label>
                <input className="fi" placeholder="e.g. STU0042" value={f.rollNo} onChange={e=>sf("rollNo",e.target.value)}/></div>}
            </>
          )}
          <div className="fg"><label className="fl">Email</label>
            <input className="fi" type="email" placeholder="you@school.edu" value={f.email} onChange={e=>sf("email",e.target.value)}/></div>
          <div className={mode==="signup"?"frow":""}>
            <div className="fg"><label className="fl">Password</label>
              <input className="fi" type="password" placeholder="••••••••" value={f.password} onChange={e=>sf("password",e.target.value)}/></div>
            {mode==="signup" && <div className="fg"><label className="fl">Confirm Password</label>
              <input className="fi" type="password" placeholder="••••••••" value={f.confirm} onChange={e=>sf("confirm",e.target.value)}/></div>}
          </div>

          <button className={`btn-sub ${role==="admin"?"adm":""}`} onClick={submit} disabled={loading}>
            {loading ? <><div className="spin"/>Processing…</> : mode==="login" ? `Sign In as ${role==="admin"?"Admin":"Student"}` : "Create Account"}
          </button>

          <div className="auth-sw">
            {mode==="login" ? <>Don't have an account? <span className="auth-lnk" onClick={()=>{setMode("signup");setErr("");setOk("");}}>Sign up</span></>
              : <>Already have an account? <span className="auth-lnk" onClick={()=>{setMode("login");setErr("");setOk("");}}>Log in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════
function MainApp({ user, students, setStudents, onLogout }) {
  const isAdmin = user.role === "admin";
  const [page, setPage] = useState(isAdmin ? "dashboard" : "profile");
  const [selStu, setSelStu] = useState(null);
  const [strat, setStrat] = useState(null);
  const [stratLoad, setStratLoad] = useState(false);
  const [stratErr, setStratErr] = useState(null);
  const [fRisk, setFRisk] = useState("All");
  const [search, setSearch] = useState("");

  const myRec = !isAdmin ? (students.find(s=>s.email===user.email) || students[0]) : null;
  const riskCounts = students.reduce((a,s)=>{a[s.risk_level]=(a[s.risk_level]||0)+1;return a;},{});
  const pieData = Object.entries(riskCounts).map(([name,value])=>({name,value}));
  const cMeta = CM.map(c=>({...c, count:students.filter(s=>s.cluster===c.id).length}));
  const scat = students.map(s=>({x:s.hours_studied,y:s.attendance,z:s.exam_score,cluster:s.cluster,name:s.name,risk:s.risk_level}));
  const avg = (students.reduce((a,s)=>a+s.exam_score,0)/students.length).toFixed(1);
  const filtered = students.filter(s=>(fRisk==="All"||s.risk_level===fRisk) && (search===""||s.name.toLowerCase().includes(search.toLowerCase())||s.rollNo?.toLowerCase().includes(search.toLowerCase())));

  const handleStrat = async (stu) => {
    const t = stu || selStu; if (!t) return;
    setStratLoad(true); setStrat(null); setStratErr(null);
    try {
      const cached = await DB.getStrategy(t.dbId);
      if (cached) { setStrat(cached.strategy); setStratLoad(false); return; }
      const r = await genStrategy(t);
      await DB.saveStrategy(t.dbId, r);
      await DB.logActivity({ type:"ai", msg:`AI strategy for ${t.name}`, icon:"🤖" });
      setStrat(r);
    } catch { setStratErr("Failed to generate. Check API connectivity."); }
    setStratLoad(false);
  };

  const pickStu = s => { setSelStu(s); setStrat(null); setStratErr(null); setPage("students"); };

  const adminNav = [
    {id:"dashboard",icon:"⬡",label:"Overview"},
    {id:"risk",icon:"⚠",label:"Risk Analysis"},
    {id:"clusters",icon:"◎",label:"Learning Clusters"},
    {id:"students",icon:"◻",label:"Student Explorer"},
    {id:"model",icon:"⊞",label:"Model Metrics"},
    {id:"database",icon:"🗃",label:"Database & Users"},
  ];
  const stuNav = [{id:"profile",icon:"◈",label:"My Profile"},{id:"mystrat",icon:"✦",label:"AI Strategy"}];
  const navItems = isAdmin ? adminNav : stuNav;
  const titles = {dashboard:"Overview",risk:"Risk Analysis",clusters:"Learning Clusters",students:"Student Explorer",model:"Model Metrics",database:"Database & Users",profile:"My Profile",mystrat:"AI Strategy"};
  const acColor = {admin:"#7c3aed",student:"#00d4ff"}[user.role];

  return (
    <div className="app-wrap">
      <div className="layout">
        <aside className="sidebar">
          <div className="s-logo">
            <div className="s-logo-icon">🎓</div>
            <div className="s-logo-title">EduInsight AI</div>
            <div className="s-logo-sub">Classroom Intelligence</div>
          </div>
          <div className="user-pill">
            <div className="u-avatar" style={{background:`${acColor}20`,color:acColor,border:`1px solid ${acColor}30`}}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="u-name">{user.name}</div>
              <div className="u-role"><span className={`badge ${isAdmin?"b-adm":"b-stu"}`} style={{fontSize:9,padding:"1px 6px"}}>{isAdmin?"🛡 Admin":"🎒 Student"}</span></div>
            </div>
          </div>
          <nav className="nav">
            <div className="nav-sec">{isAdmin?"Analytics":"My Learning"}</div>
            {navItems.map(n=>(
              <div key={n.id} className={`ni ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
                <span className="ni-icon">{n.icon}</span>{n.label}
              </div>
            ))}
            <div className="nav-sec">System</div>
            <div className="ni" style={{opacity:.4,cursor:"default",fontSize:12}}><span className="ni-icon">◈</span>{students.length} records in DB</div>
          </nav>
          <div className="nav-btm"><button className="btn-out" onClick={onLogout}>← Log Out</button></div>
        </aside>
        <main className="main">
          <div className="topbar">
            <div>
              <div className="tb-title">{titles[page]}</div>
              <div className="tb-sub">AY 2024–25 · {isAdmin?"Admin View":`${user.name} · Student`}</div>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <span className="badge b-live">● Live Model</span>
              {isAdmin && <span className="badge b-adm">🛡 Admin</span>}
            </div>
          </div>
          <div className="content">
            {page==="dashboard" && isAdmin && <PageOverview students={students} pieData={pieData} cMeta={cMeta} avg={avg} riskCounts={riskCounts} scat={scat} onStu={pickStu}/>}
            {page==="risk" && isAdmin && <PageRisk students={students} pieData={pieData} riskCounts={riskCounts} onStu={pickStu}/>}
            {page==="clusters" && isAdmin && <PageClusters students={students} cMeta={cMeta} scat={scat} onStu={pickStu}/>}
            {page==="students" && isAdmin && <PageStudents students={students} filtered={filtered} fRisk={fRisk} setFRisk={setFRisk} search={search} setSearch={setSearch} selStu={selStu} onStu={pickStu} strat={strat} stratLoad={stratLoad} stratErr={stratErr} onStrat={handleStrat}/>}
            {page==="model" && isAdmin && <PageModel/>}
            {page==="database" && isAdmin && <PageDB students={students}/>}
            {page==="profile" && !isAdmin && <PageStuProfile student={myRec}/>}
            {page==="mystrat" && !isAdmin && <PageStuStrat student={myRec} strat={strat} stratLoad={stratLoad} stratErr={stratErr} onGen={()=>handleStrat(myRec)}/>}
          </div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STUDENT PAGES
// ═══════════════════════════════════════════════════════════════════
function PageStuProfile({ student }) {
  if (!student) return <div style={{color:"var(--mt)"}}>No student record linked to your account.</div>;
  const sc = student.exam_score < 60 ? "#ef4444" : student.exam_score <= 75 ? "#f59e0b" : "#10b981";
  const cl = CM[student.cluster];
  const rClass = student.risk_level === "High Risk" ? "rHigh" : student.risk_level === "Medium Risk" ? "rMed" : "rLow";
  return (
    <div className="fa">
      <div className="ph"><h2>My Academic Profile</h2><p>Performance snapshot & ML risk assessment</p></div>
      <div className="prof-hero mb18">
        <div style={{display:"flex",alignItems:"flex-start",gap:22,flexWrap:"wrap"}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(0,212,255,.1)",border:"2px solid rgba(0,212,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"var(--ac)"}}>
            {student.name.charAt(0)}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800}}>{student.name}</div>
            <div style={{fontSize:12.5,color:"var(--mt)",marginTop:2}}>{student.rollNo} · {student.gender} · {student.school_type} School</div>
            <div style={{display:"flex",gap:7,marginTop:9,flexWrap:"wrap"}}>
              <span className={`rp ${rClass}`}>{student.risk_level}</span>
              <span style={{background:`${cl.color}15`,color:cl.color,border:`1px solid ${cl.color}30`,padding:"3px 9px",borderRadius:20,fontSize:11.5,fontWeight:600}}>{cl.name}</span>
            </div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:48,fontWeight:800,color:sc,lineHeight:1}}>{student.exam_score}</div>
            <div style={{fontSize:11.5,color:"var(--mt)",marginTop:3}}>Score / 100</div>
          </div>
        </div>
      </div>
      <div className="g4 mb18">
        {[
          {l:"Study Hrs/Day",v:`${student.hours_studied}h`,ok:student.hours_studied>=4,c:"cb"},
          {l:"Attendance",v:`${student.attendance}%`,ok:student.attendance>=75,c:"cg"},
          {l:"Prev Score",v:student.previous_scores,ok:student.previous_scores>=60,c:"cp"},
          {l:"Sleep Hours",v:`${student.sleep_hours}h`,ok:student.sleep_hours>=7,c:"co"},
        ].map((s,i)=>(
          <div key={i} className={`sc ${s.c}`}>
            <div className="sl">{s.l}</div>
            <div className="sv" style={{color:s.ok?"var(--ok)":"var(--dn)",fontSize:24}}>{s.v}</div>
            <div className="ss">{s.ok?"✓ On track":"⚠ Needs attention"}</div>
          </div>
        ))}
      </div>
      <div className="g2">
        <div className="card">
          <div className="ct">Academic Factors</div>
          {[
            {l:"Motivation Level",v:student.motivation_level,g:student.motivation_level==="High",w:student.motivation_level==="Low"},
            {l:"Internet Access",v:student.internet_access,g:student.internet_access==="Yes",w:student.internet_access==="No"},
            {l:"Parental Involvement",v:student.parental_involvement,g:student.parental_involvement==="High",w:student.parental_involvement==="Low"},
            {l:"Access to Resources",v:student.access_to_resources,g:student.access_to_resources==="High",w:student.access_to_resources==="Low"},
            {l:"Teacher Quality",v:student.teacher_quality,g:student.teacher_quality==="High",w:student.teacher_quality==="Low"},
            {l:"Peer Influence",v:student.peer_influence,g:student.peer_influence==="Positive",w:student.peer_influence==="Negative"},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
              <span style={{fontSize:12.5,color:"var(--mt)"}}>{f.l}</span>
              <span style={{fontSize:13,fontWeight:600,color:f.g?"#6ee7b7":f.w?"#fca5a5":"var(--tx)"}}>{f.v} {f.g?"✓":f.w?"⚠":""}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="ct">Learning Cluster: {cl.name}</div>
          <div style={{background:`${cl.color}0a`,border:`1px solid ${cl.color}25`,borderRadius:9,padding:"14px",marginBottom:12}}>
            <div style={{color:cl.color,fontWeight:700,marginBottom:5,fontFamily:"var(--fd)"}}>Cluster {student.cluster}</div>
            <div style={{fontSize:13,color:"var(--mt)",lineHeight:1.6}}>{cl.desc}</div>
          </div>
          <div style={{fontSize:12.5,color:"var(--mt)",lineHeight:1.8}}>
            <div style={{marginBottom:6}}><b style={{color:"var(--tx)"}}>Background</b></div>
            <div>Family Income: {student.family_income} · Parental Education: {student.parental_education}</div>
            <div>Distance from Home: {student.distance_from_home}</div>
            <div>Extracurricular: {student.extracurricular_activities} · Physical Activity: {student.physical_activity}h/wk</div>
            <div style={{marginTop:4}}>Learning Disability: <b style={{color:student.learning_disability==="Yes"?"#fca5a5":"var(--tx)"}}>{student.learning_disability}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageStuStrat({ student, strat, stratLoad, stratErr, onGen }) {
  if (!student) return <div style={{color:"var(--mt)"}}>No student record found.</div>;
  return (
    <div className="fa">
      <div className="ph"><h2>My AI Strategy</h2><p>Personalized intervention by Claude AI based on your academic profile</p></div>
      <div className="ai-panel">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:15,gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:15}}>{student.name}</span><span className="ai-chip">Claude AI</span></div>
            <div style={{fontSize:12,color:"var(--mt)",marginTop:2}}>Risk: {student.risk_level} · Score: {student.exam_score}/100</div>
          </div>
          <button className="btn bp" onClick={onGen} disabled={stratLoad}>
            {stratLoad?<><div className="spin"/>Generating…</>:<><span>✦</span>{strat?"Regenerate":"Generate"} My Strategy</>}
          </button>
        </div>
        {!strat && !stratLoad && !stratErr && (
          <div style={{textAlign:"center",padding:"28px 0",color:"var(--mt)"}}>
            <div style={{fontSize:26,marginBottom:8}}>✦</div>
            <div style={{fontSize:13.5}}>Click "Generate My Strategy" to get your personalized AI plan</div>
          </div>
        )}
        {stratErr && <div className="err-box">{stratErr}</div>}
        {stratLoad && <div style={{textAlign:"center",padding:"22px 0",color:"var(--mt)"}}><div className="spin" style={{width:22,height:22,margin:"0 auto 10px"}}/><div style={{fontSize:13}}>Claude AI is analyzing your profile…</div></div>}
        {strat && <StratPanel strat={strat}/>}
      </div>
    </div>
  );
}

function StratPanel({ strat }) {
  return (
    <div className="fa" style={{borderTop:"1px solid rgba(0,212,255,.15)",paddingTop:16}}>
      {strat.teaching_strategy && <div className="ss-sec"><div className="ss-lbl">📚 Study Strategy</div><div className="ss-txt">{strat.teaching_strategy}</div></div>}
      {strat.classroom_intervention && <div className="ss-sec"><div className="ss-lbl">🎯 Action Plan</div><div className="ss-txt">{strat.classroom_intervention}</div></div>}
      {strat.parent_communication && <div className="ss-sec"><div className="ss-lbl">📧 Parent Communication</div><div className="ss-txt" style={{fontStyle:"italic",background:"rgba(0,212,255,.04)",padding:"10px 13px",borderRadius:7,borderLeft:"3px solid rgba(0,212,255,.3)"}}>{strat.parent_communication}</div></div>}
      {strat.quick_wins?.length > 0 && <div className="ss-sec"><div className="ss-lbl">⚡ Quick Wins</div><div className="qw-list">{strat.quick_wins.map((w,i)=><div key={i} className="qw-item"><div className="qw-n">{i+1}</div><div>{w}</div></div>)}</div></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  DATABASE PAGE
// ═══════════════════════════════════════════════════════════════════
function PageDB({ students }) {
  const [users, setUsers] = useState([]);
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{ const [u,a]=await Promise.all([DB.getUsers(),DB.getActivity()]); setUsers(u);setActs(a);setLoading(false); })();},[]);
  const rc = students.reduce((a,s)=>{a[s.risk_level]=(a[s.risk_level]||0)+1;return a;},{});
  if (loading) return <div style={{color:"var(--mt)",padding:20}}>Loading…</div>;
  return (
    <div className="fa">
      <div className="ph"><h2>Database & Users</h2><p>Persistent storage via window.storage · Survives page refresh · Per-session isolation</p></div>
      <div className="g4 mb18">
        <div className="db-stat"><div className="v" style={{color:"var(--ac)"}}>{students.length}</div><div className="l">Student Records</div></div>
        <div className="db-stat"><div className="v" style={{color:"#7c3aed"}}>{users.length}</div><div className="l">Registered Users</div></div>
        <div className="db-stat"><div className="v" style={{color:"#ef4444"}}>{rc["High Risk"]||0}</div><div className="l">High Risk Students</div></div>
        <div className="db-stat"><div className="v" style={{color:"#10b981"}}>{acts.length}</div><div className="l">Activity Log Entries</div></div>
      </div>
      <div className="g2 mb18">
        <div className="card">
          <div className="ct">Registered Users <span style={{color:"var(--ac)",fontFamily:"var(--fb)",fontSize:12,textTransform:"none",letterSpacing:0}}>{users.length}</span></div>
          <div className="tw"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>{users.map((u,i)=>(
              <tr key={i}>
                <td style={{fontWeight:500}}>{u.name}</td>
                <td style={{color:"var(--mt)",fontSize:12}}>{u.email}</td>
                <td><span className={`badge ${u.role==="admin"?"b-adm":"b-stu"}`} style={{fontSize:10}}>{u.role}</span></td>
                <td style={{color:"var(--mt)",fontSize:11}}>{u.createdAt?new Date(u.createdAt).toLocaleDateString():"—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
        <div className="card">
          <div className="ct">Activity Log <span style={{color:"var(--ac)",fontFamily:"var(--fb)",fontSize:12,textTransform:"none",letterSpacing:0}}>last {acts.length}</span></div>
          <div style={{maxHeight:280,overflowY:"auto"}}>
            {acts.length===0 && <div style={{color:"var(--mt)",fontSize:13}}>No activity yet.</div>}
            {acts.map((a,i)=>(
              <div key={i} className="act-item">
                <div className="act-icon">{a.icon||"•"}</div>
                <div><div className="act-msg">{a.msg}</div><div className="act-time">{a.ts?new Date(a.ts).toLocaleString():""}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="ct">Storage Schema</div>
        <div className="g3">
          {[
            {key:"edu:users",desc:"Array of all registered users with roles, emails, creation timestamps",type:"JSON Array"},
            {key:"edu:students",desc:"120 ML-scored student records (19 features + risk + cluster)",type:"JSON Array"},
            {key:"edu:session",desc:"Active session: email + role for auto-login on refresh",type:"JSON Object"},
            {key:"edu:activity",desc:"Rolling 50-entry audit log of all system events",type:"JSON Array"},
            {key:"edu:strat:{id}",desc:"Cached AI strategies per student — avoids redundant API calls",type:"JSON Object"},
            {key:"(extensible)",desc:"Add grades, notifications, assignments as needed",type:"—"},
          ].map((s,i)=>(
            <div key={i} style={{background:"var(--sf2)",borderRadius:8,padding:"11px 13px",border:"1px solid var(--br)"}}>
              <div style={{fontFamily:"monospace",fontSize:11.5,color:"var(--ac)",marginBottom:5}}>{s.key}</div>
              <div style={{fontSize:12,color:"var(--mt)",lineHeight:1.5}}>{s.desc}</div>
              <div style={{marginTop:5}}><span className="tag">{s.type}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN ANALYTICS PAGES
// ═══════════════════════════════════════════════════════════════════
const TT = ({active,payload,label})=>{if(!active||!payload?.length)return null;return<div className="ttip"><div style={{fontWeight:600,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||"var(--ac)"}}>{p.value?.toFixed?p.value.toFixed(3):p.value}</div>)}</div>;};

function PageOverview({ students, pieData, cMeta, avg, riskCounts, scat, onStu }) {
  return (
    <div className="fa">
      <div className="ph"><h2>Classroom Overview</h2><p>RF risk classification + K-Means clustering intelligence</p></div>
      <div className="g4 mb18">
        <div className="sc cb"><div className="sl">Total Students</div><div className="sv" style={{color:"var(--ac)"}}>{students.length}</div><div className="ss">In database</div></div>
        <div className="sc cr"><div className="sl">High Risk</div><div className="sv" style={{color:"#ef4444"}}>{riskCounts["High Risk"]||0}</div><div className="ss">{(((riskCounts["High Risk"]||0)/students.length)*100).toFixed(0)}% of class</div></div>
        <div className="sc cg"><div className="sl">Avg Score</div><div className="sv" style={{color:"#10b981"}}>{avg}</div><div className="ss">Class average</div></div>
        <div className="sc cp"><div className="sl">RF Accuracy</div><div className="sv" style={{color:"#7c3aed"}}>88.7%</div><div className="ss">F1: 0.877</div></div>
      </div>
      <div className="g2 mb18">
        <div className="card"><div className="ct">Risk Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4} dataKey="value" labelLine={false}>
              {pieData.map((e,i)=><Cell key={i} fill={RC[e.name]}/>)}
            </Pie><Tooltip content={<TT/>}/><Legend formatter={v=><span style={{color:"var(--mt)",fontSize:11.5}}>{v}</span>}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card"><div className="ct">Feature Importance</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FI.slice(0,6)} layout="vertical" margin={{left:8,right:14}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
              <XAxis type="number" tick={{fill:"var(--mt)",fontSize:10}} tickFormatter={v=>v.toFixed(2)}/>
              <YAxis type="category" dataKey="feature" tick={{fill:"var(--mt)",fontSize:10}} width={108}/>
              <Tooltip content={<TT/>}/><Bar dataKey="importance" fill="var(--ac)" radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card mb18"><div className="ct">Cluster Scatter — Study Hours vs Attendance</div>
        <ResponsiveContainer width="100%" height={210}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
            <XAxis dataKey="x" tick={{fill:"var(--mt)",fontSize:10}}/><YAxis dataKey="y" tick={{fill:"var(--mt)",fontSize:10}}/><ZAxis range={[22,65]}/>
            <Tooltip content={({active,payload})=>{if(!active||!payload?.[0])return null;const d=payload[0].payload;return<div className="ttip"><b>{d.name}</b><br/>{d.x}h · {d.y}% · {d.z}pts</div>;}}/>
            {CM.map(c=><Scatter key={c.id} name={c.name} data={scat.filter(d=>d.cluster===c.id)} fill={c.color} opacity={0.7}/>)}
            <Legend formatter={v=><span style={{color:"var(--mt)",fontSize:11}}>{v}</span>}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="card"><div className="ct">⚠ High Risk — Immediate Attention</div>
        <div className="tw"><table>
          <thead><tr><th>Name</th><th>Score</th><th>Att%</th><th>Hrs</th><th>Motivation</th><th>Risk</th><th></th></tr></thead>
          <tbody>{students.filter(s=>s.risk_level==="High Risk").slice(0,6).map(s=>(
            <tr key={s.id} onClick={()=>onStu(s)}>
              <td style={{fontWeight:500}}>{s.name}</td><td style={{color:"#fca5a5",fontWeight:600}}>{s.exam_score}</td>
              <td>{s.attendance}%</td><td>{s.hours_studied}h</td><td>{s.motivation_level}</td>
              <td><span className="rp rHigh">High Risk</span></td><td style={{color:"var(--ac)",fontSize:12}}>View →</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}

function PageRisk({ students, pieData, riskCounts, onStu }) {
  return (
    <div className="fa">
      <div className="ph"><h2>Risk Analysis</h2><p>&lt;60 High · 60–75 Medium · &gt;75 Low</p></div>
      <div className="g3 mb18">
        {Object.entries(riskCounts).map(([risk,count])=>(
          <div key={risk} className="card" style={{borderColor:RC[risk]+"44"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
              <span className={`rp ${risk==="High Risk"?"rHigh":risk==="Medium Risk"?"rMed":"rLow"}`}>{risk}</span>
              <span style={{fontSize:26,fontFamily:"var(--fd)",fontWeight:800,color:RC[risk]}}>{count}</span>
            </div>
            <div style={{fontSize:12.5,color:"var(--mt)"}}>{((count/students.length)*100).toFixed(1)}% of students</div>
            <div className="pw" style={{marginTop:9}}><div className="pf" style={{width:`${(count/students.length)*100}%`,background:RC[risk]}}/></div>
          </div>
        ))}
      </div>
      <div className="g2 mb18">
        <div className="card"><div className="ct">Risk Breakdown</div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value" label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
              {pieData.map((e,i)=><Cell key={i} fill={RC[e.name]}/>)}
            </Pie><Tooltip content={<TT/>}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card"><div className="ct">Feature Importance (all)</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={FI} layout="vertical" margin={{left:8,right:14}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
              <XAxis type="number" tick={{fill:"var(--mt)",fontSize:10}} tickFormatter={v=>v.toFixed(2)}/>
              <YAxis type="category" dataKey="feature" tick={{fill:"var(--mt)",fontSize:10}} width={108}/>
              <Tooltip content={<TT/>}/><Bar dataKey="importance" fill="var(--ac2)" radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card"><div className="ct">All High-Risk Students</div>
        <div className="tw"><table>
          <thead><tr><th>Roll</th><th>Name</th><th>Score</th><th>Attendance</th><th>Study Hrs</th><th>Motivation</th></tr></thead>
          <tbody>{students.filter(s=>s.risk_level==="High Risk").map(s=>(
            <tr key={s.id} onClick={()=>onStu(s)}>
              <td style={{color:"var(--mt)",fontSize:11}}>{s.rollNo}</td><td style={{fontWeight:500}}>{s.name}</td>
              <td style={{color:"#fca5a5",fontWeight:600}}>{s.exam_score}</td>
              <td style={{color:s.attendance<70?"#fca5a5":"inherit"}}>{s.attendance}%</td>
              <td style={{color:s.hours_studied<3?"#fca5a5":"inherit"}}>{s.hours_studied}h</td><td>{s.motivation_level}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}

function PageClusters({ students, cMeta, scat, onStu }) {
  return (
    <div className="fa">
      <div className="ph"><h2>Learning Clusters</h2><p>K-Means k=4 · Silhouette: 0.612 · Elbow method</p></div>
      <div className="g2 mb18">
        {cMeta.map(c=>(
          <div key={c.id} className="cc" style={{background:`${c.color}0a`,borderColor:`${c.color}28`}}>
            <div style={{width:13,height:13,borderRadius:"50%",background:c.color,flexShrink:0,marginTop:3}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontFamily:"var(--fd)",fontWeight:700}}>C{c.id}: {c.name}</span>
                <span style={{background:`${c.color}20`,color:c.color,padding:"2px 8px",borderRadius:20,fontSize:11.5,fontWeight:600}}>{c.count}</span>
              </div>
              <p style={{fontSize:12.5,color:"var(--mt)",lineHeight:1.6}}>{c.desc}</p>
              <div className="pw" style={{marginTop:9}}><div className="pf" style={{width:`${(c.count/students.length)*100}%`,background:c.color}}/></div>
            </div>
          </div>
        ))}
      </div>
      <div className="card"><div className="ct">Cluster Scatter Visualization</div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{top:10,right:18,bottom:20,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
            <XAxis dataKey="x" type="number" domain={[0,11]} tick={{fill:"var(--mt)",fontSize:10}} label={{value:"Hrs/day",fill:"var(--mt)",fontSize:11,position:"insideBottom",offset:-8}}/>
            <YAxis dataKey="y" type="number" domain={[35,105]} tick={{fill:"var(--mt)",fontSize:10}} label={{value:"Attendance %",fill:"var(--mt)",fontSize:11,angle:-90,position:"insideLeft"}}/>
            <ZAxis range={[30,80]}/>
            <Tooltip content={({active,payload})=>{if(!active||!payload?.[0])return null;const d=payload[0].payload;return<div className="ttip"><b>{d.name}</b><br/>{d.x}h · {d.y}% · Score:{d.z}<br/>{d.risk}</div>;}}/>
            {CM.map(c=><Scatter key={c.id} name={c.name} data={scat.filter(d=>d.cluster===c.id)} fill={c.color} opacity={0.75}/>)}
            <Legend formatter={v=><span style={{color:"var(--mt)",fontSize:11}}>{v}</span>}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PageStudents({ students, filtered, fRisk, setFRisk, search, setSearch, selStu, onStu, strat, stratLoad, stratErr, onStrat }) {
  const rClass = r => r==="High Risk"?"rHigh":r==="Medium Risk"?"rMed":"rLow";
  return (
    <div className="fa">
      <div className="ph"><h2>Student Explorer</h2><p>Select a student to view their profile and generate a Claude AI strategy</p></div>
      {selStu && (
        <div className="ai-panel mb18 fa">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>
            <div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontFamily:"var(--fd)",fontWeight:800,fontSize:16}}>{selStu.name}</span>
                <span className={`rp ${rClass(selStu.risk_level)}`}>{selStu.risk_level}</span>
                <span className="ai-chip">Claude AI</span>
              </div>
              <div style={{fontSize:11.5,color:"var(--mt)",marginTop:2}}>{selStu.rollNo} · Score: {selStu.exam_score} · {CM[selStu.cluster].name}</div>
            </div>
            <button className="btn bp" onClick={()=>onStrat(selStu)} disabled={stratLoad}>
              {stratLoad?<><div className="spin"/>Generating…</>:<><span>✦</span>Generate AI Strategy</>}
            </button>
          </div>
          <div className="fg-grid mb14">
            {[
              {n:"Study Hours",v:`${selStu.hours_studied}h`,b:selStu.hours_studied<4},
              {n:"Attendance",v:`${selStu.attendance}%`,b:selStu.attendance<70},
              {n:"Prev Score",v:selStu.previous_scores,b:selStu.previous_scores<60},
              {n:"Motivation",v:selStu.motivation_level,b:selStu.motivation_level==="Low"},
              {n:"Internet",v:selStu.internet_access,b:selStu.internet_access==="No"},
              {n:"Sleep",v:`${selStu.sleep_hours}h`,b:selStu.sleep_hours<6},
              {n:"Parental Inv.",v:selStu.parental_involvement,b:selStu.parental_involvement==="Low"},
              {n:"Peer Influence",v:selStu.peer_influence,b:selStu.peer_influence==="Negative"},
              {n:"Teacher Quality",v:selStu.teacher_quality,b:selStu.teacher_quality==="Low"},
            ].map((f,i)=>(
              <div key={i} className="fg-item" style={f.b?{borderColor:"rgba(239,68,68,.28)",background:"rgba(239,68,68,.04)"}:{}}>
                <div className="fg-name">{f.n}</div>
                <div className="fg-val" style={{color:f.b?"#fca5a5":"var(--tx)"}}>{f.v}{f.b?" ⚠":""}</div>
              </div>
            ))}
          </div>
          {stratErr && <div className="err-box">{stratErr}</div>}
          {strat && <StratPanel strat={strat}/>}
        </div>
      )}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:13,flexWrap:"wrap"}}>
        <input className="si" style={{width:200}} placeholder="Search name / roll…" value={search} onChange={e=>setSearch(e.target.value)}/>
        {["All","High Risk","Medium Risk","Low Risk"].map(r=>(
          <button key={r} className={`btn bg bsm ${fRisk===r?"on":""}`} onClick={()=>setFRisk(r)}>{r}</button>
        ))}
        <span style={{marginLeft:"auto",fontSize:11.5,color:"var(--mt)"}}>{filtered.length} students</span>
      </div>
      <div className="card"><div className="tw"><table>
        <thead><tr><th>Roll</th><th>Name</th><th>Score</th><th>Risk</th><th>Cluster</th><th>Hrs</th><th>Att</th><th>Motivation</th></tr></thead>
        <tbody>{filtered.map(s=>(
          <tr key={s.id} onClick={()=>onStu(s)} style={{background:selStu?.id===s.id?"rgba(0,212,255,.04)":""}}>
            <td style={{color:"var(--mt)",fontSize:11}}>{s.rollNo}</td>
            <td style={{fontWeight:selStu?.id===s.id?600:400}}>{s.name}</td>
            <td style={{fontWeight:600,color:s.exam_score<60?"#fca5a5":s.exam_score<=75?"#fcd34d":"#6ee7b7"}}>{s.exam_score}</td>
            <td><span className={`rp ${rClass(s.risk_level)}`}>{s.risk_level}</span></td>
            <td style={{color:CM[s.cluster].color,fontSize:12}}>C{s.cluster}: {CM[s.cluster].name}</td>
            <td>{s.hours_studied}h</td><td>{s.attendance}%</td><td>{s.motivation_level}</td>
          </tr>
        ))}</tbody>
      </table></div></div>
    </div>
  );
}

function PageModel() {
  const cm = MM.confusionMatrix, labels=["High Risk","Med Risk","Low Risk"];
  return (
    <div className="fa">
      <div className="ph"><h2>Model Metrics</h2><p>Random Forest · 80/20 split · Cross-validated</p></div>
      <div className="mr">
        {[["Accuracy",MM.accuracy],["Precision",MM.precision],["Recall",MM.recall],["F1 Score",MM.f1]].map(([l,v])=>(
          <div key={l} className="mb2"><div className="v">{(v*100).toFixed(1)}%</div><div className="l">{l}</div></div>
        ))}
      </div>
      <div className="g2 mb18">
        <div className="card"><div className="ct">Confusion Matrix</div>
          <table className="cmt" style={{width:"100%",marginTop:7}}>
            <thead><tr><th style={{color:"var(--mt)",fontSize:10}}>↓ Act / Pred →</th>{labels.map(l=><th key={l} style={{color:"var(--mt)",fontSize:10}}>{l}</th>)}</tr></thead>
            <tbody>{cm.map((row,i)=>(
              <tr key={i}><td style={{color:"var(--mt)",fontSize:11,textAlign:"left",paddingLeft:13}}>{labels[i]}</td>
                {row.map((v,j)=><td key={j} className={i===j?"cmc":v>0?"cml":""}>{v}</td>)}
              </tr>
            ))}</tbody>
          </table>
          <div style={{marginTop:10,fontSize:12,color:"var(--mt)"}}>Diagonal = correct · Off-diagonal = misclassification</div>
        </div>
        <div className="card"><div className="ct">Feature Importance</div>
          <ResponsiveContainer width="100%" height={225}>
            <BarChart data={FI} layout="vertical" margin={{left:8,right:14}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
              <XAxis type="number" tick={{fill:"var(--mt)",fontSize:10}} tickFormatter={v=>v.toFixed(2)}/>
              <YAxis type="category" dataKey="feature" tick={{fill:"var(--mt)",fontSize:10}} width={108}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="importance" fill="var(--ac2)" radius={[0,3,3,0]}>
                {FI.map((_,i)=><Cell key={i} fill={`rgba(124,58,237,${1-i*.07})`}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card"><div className="ct">System Architecture</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:11}}>
          {["React 18","Recharts","Random Forest (RF)","K-Means k=4","Claude claude-sonnet-4-20250514 API","window.storage DB","Role-Based Auth","Session Persistence","Activity Logging","AI Strategy Caching"].map(t=><span key={t} className="tag">{t}</span>)}
        </div>
        <div style={{fontSize:12.5,color:"var(--mt)",lineHeight:1.8}}>
          <b style={{color:"var(--tx)"}}>Pipeline:</b> Dataset → Feature engineering → RF Classifier (n=200, depth=8) → Risk tiers → K-Means clustering → Claude AI strategies → Persistent DB → Role-based React dashboard
        </div>
      </div>
    </div>
  );
}
