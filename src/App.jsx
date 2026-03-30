import { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const TEAL = "#00838F", DARK_TEAL = "#005F6B", LIGHT_TEAL = "#E0F4F5";
const ORANGE = "#E65100", LIGHT_ORANGE = "#FFF3E0";
const RATINGS = ["Student Engagement & Agency","Clarity of Instructions","Studio Rotation Management","Questioning & Dialogue Quality","Differentiation / Inclusion Support","Reflection / Debrief Facilitation","Classroom Energy & Wellbeing"];

const EMPTY = () => ({
  teacherName:"", studio:"", date:"", time:"", grade:"", students:"", observer:"", obsType:"",
  rotationStage:"", context:"", obsNotes:"", strengths:"", scope:"", commNotes:"", nextObs:"", ackNotes:"",
  ratings: Object.fromEntries(RATINGS.map(r => [r, 0])),
  actions: [{action:"",byWhen:"",owner:""},{action:"",byWhen:"",owner:""}],
});

// Safe storage helpers — never throw
const store = {
  async get(key) {
    try { const r = await window.storage.get(key); return r?.value ? JSON.parse(r.value) : null; } catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); return true; } catch { return false; }
  },
  async del(key) {
    try { await window.storage.delete(key); return true; } catch { return false; }
  }
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#f0f4f5;color:#1a2e30;}
.app{min-height:100vh;display:flex;flex-direction:column;}
.topbar{background:#005F6B;color:white;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 12px rgba(0,95,107,.3);}
.topbar h1{font-family:'DM Serif Display',serif;font-size:20px;}
.topbar p{font-size:11px;opacity:.65;margin-top:2px;letter-spacing:1px;text-transform:uppercase;}
.tabs{display:flex;background:white;border-bottom:2px solid #e0f4f5;padding:0 32px;}
.tab{padding:14px 24px;font-size:12px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;color:#999;transition:all .2s;}
.tab:hover{color:#00838F;}.tab.on{color:#00838F;border-bottom-color:#00838F;}
.page{flex:1;padding:28px 32px;max-width:1000px;margin:0 auto;width:100%;}

/* Draft bar */
.dbar{display:flex;align-items:center;justify-content:space-between;background:white;border:1.5px solid #d0e8ea;border-radius:10px;padding:11px 18px;margin-bottom:18px;gap:12px;flex-wrap:wrap;}
.dbar-l{display:flex;align-items:center;gap:10px;}
.dot{width:8px;height:8px;border-radius:50%;background:#ccc;flex-shrink:0;transition:background .3s;}
.dot.green{background:#4CAF50;}.dot.orange{background:#FF9800;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
.dbar-r{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.confirm-msg{font-size:12px;color:#e53935;font-weight:600;}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid;transition:all .18s;}
.btn-save{background:#00838F;color:white;border-color:#00838F;}.btn-save:hover:not(:disabled){background:#006e79;}
.btn-save:disabled{opacity:.5;cursor:not-allowed;}
.btn-clear{background:white;color:#e53935;border-color:#ffcdd2;}.btn-clear:hover{background:#fff5f5;}
.btn-cancel{background:white;color:#555;border-color:#ddd;}.btn-cancel:hover{background:#f5f5f5;}
.btn-dark{background:#37474F;color:white;border:none;}.btn-dark:hover{opacity:.85;}
.btn-print{background:#005F6B;color:white;border:none;}.btn-print:hover{opacity:.85;}

/* Section cards */
.scard{background:white;border-radius:12px;overflow:hidden;margin-bottom:18px;box-shadow:0 1px 6px rgba(0,95,107,.08);}
.scard-hd{background:#005F6B;color:white;padding:11px 20px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.badge{background:rgba(255,255,255,.2);border-radius:4px;padding:2px 8px;font-size:10px;font-weight:500;letter-spacing:0;text-transform:none;}
.scard-body{padding:18px 20px;}

/* Form */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.fg{display:flex;flex-direction:column;gap:5px;}
.lbl{font-size:10px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;color:#005F6B;}
.lbl em{font-style:normal;font-weight:400;color:#aaa;text-transform:none;letter-spacing:0;}
input,textarea,select{border:1.5px solid #d0e8ea;border-radius:8px;padding:9px 13px;font-family:'DM Sans',sans-serif;font-size:13px;color:#1a2e30;background:white;transition:border-color .2s;outline:none;width:100%;}
input:focus,textarea:focus,select:focus{border-color:#00838F;box-shadow:0 0 0 3px rgba(0,131,143,.1);}
textarea{resize:vertical;line-height:1.6;}
.hint{font-size:11px;color:#888;line-height:1.5;padding:9px 13px;background:#f8fdfd;border-left:3px solid #00838F;border-radius:0 6px 6px 0;margin-bottom:12px;}

/* Stars */
.rrow{display:flex;align-items:center;padding:9px 0;border-bottom:1px solid #f0f0f0;gap:12px;}
.rrow:last-child{border-bottom:none;}
.rlbl{flex:1;font-size:13px;color:#333;}
.stars{display:flex;gap:3px;}
.star{width:28px;height:28px;border:none;background:none;cursor:pointer;font-size:20px;color:#ddd;transition:color .12s,transform .1s;padding:0;line-height:1;}
.star:hover{transform:scale(1.2);}.star.on{color:#00838F;}
.rval{font-size:12px;font-weight:700;color:#005F6B;min-width:30px;text-align:right;}

/* Actions */
.ah{display:grid;grid-template-columns:1fr 150px 130px 36px;gap:10px;margin-bottom:6px;}
.ar{display:grid;grid-template-columns:1fr 150px 130px 36px;gap:10px;align-items:center;margin-bottom:8px;}
.rm{width:32px;height:32px;border:1.5px solid #ffcdd2;border-radius:6px;background:#fff5f5;color:#e53935;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.rm:hover{background:#ffebee;}
.add{padding:8px 16px;border:1.5px dashed #00838F;border-radius:8px;background:none;color:#00838F;cursor:pointer;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;margin-top:4px;}
.add:hover{background:#f0fdfe;}

/* Generate */
.gen{width:100%;padding:15px;background:#00838F;color:white;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;}
.gen:hover:not(:disabled){background:#006e79;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,131,143,.3);}
.gen:disabled{opacity:.55;cursor:not-allowed;transform:none;}

/* Feedback card */
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.fcard{background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,95,107,.12);}
.fcard-top{background:#005F6B;color:white;padding:18px 26px;display:flex;justify-content:space-between;align-items:center;}
.fschool{font-family:'DM Serif Display',serif;font-size:21px;}
.fsub{font-size:11px;opacity:.7;margin-top:3px;}
.fbody{padding:22px 26px;font-size:13px;}
.fsec{background:#00838F;color:white;padding:7px 14px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin:18px -26px 12px;}
.mgrid{display:grid;grid-template-columns:1fr 1fr;}
.mrow{display:flex;border-bottom:1px solid #eef4f5;padding:5px 0;gap:8px;}
.mlbl{font-size:10px;font-weight:700;color:#005F6B;min-width:130px;}
.mval{font-size:12px;color:#333;}
.sbi-blk{border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:8px;}
.sbi-top{padding:7px 12px;display:flex;gap:8px;align-items:center;}
.sbi-cir{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;flex-shrink:0;}
.sbi-bdy{padding:9px 12px;font-size:12px;line-height:1.7;color:#222;}
.gp{background:#FFF8E1;border:1px solid #ffe082;border-radius:8px;padding:10px 12px;margin-bottom:8px;}
.rtbl{width:100%;border-collapse:collapse;font-size:12px;}
.rtbl th{background:#00838F;color:white;padding:6px 10px;text-align:left;font-weight:600;}
.rtbl td{padding:6px 10px;border-bottom:1px solid #f0f0f0;}
.rtbl tr:last-child td{border-bottom:none;}
.sf{color:#00838F;}.se{color:#ddd;}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;}
.cbox{border-radius:8px;overflow:hidden;}
.cbox-hd{padding:7px 12px;font-size:10px;font-weight:700;}
.cbox-bd{padding:10px 12px;font-size:12px;line-height:1.7;color:#222;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;white-space:pre-wrap;min-height:60px;}
.cmnotes{border:1px solid #e0e0e0;border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.7;white-space:pre-wrap;}
.atbl{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px;}
.atbl th{background:#00838F;color:white;padding:6px 10px;font-weight:600;text-align:left;}
.atbl td{padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;}
.atbl tr:last-child td{border-bottom:none;}
.sigrow{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:8px;}
.sigbox{border-top:1.5px solid #ccc;padding-top:4px;}
.ffoot{background:#f8fdfd;border-top:1px solid #e0f4f5;padding:9px 26px;text-align:center;font-size:11px;font-style:italic;color:#00838F;}
.empty{text-align:center;padding:60px 20px;color:#aaa;}
.loading{display:flex;align-items:center;justify-content:center;gap:8px;padding:60px;color:#00838F;font-size:14px;}
.dp{width:8px;height:8px;border-radius:50%;background:#00838F;animation:dp 1.2s ease-in-out infinite;}
.dp:nth-child(2){animation-delay:.2s;}.dp:nth-child(3){animation-delay:.4s;}
@keyframes dp{0%,80%,100%{transform:scale(.6);opacity:.4;}40%{transform:scale(1);opacity:1;}}
.toast{position:fixed;bottom:24px;right:24px;color:white;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,.2);z-index:999;animation:tup .3s ease;}
.t-ok{background:#2E7D32;}.t-info{background:#1a2e30;}.t-err{background:#c62828;}
@keyframes tup{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}
@media print{
  .topbar,.tabs,.toolbar,.dbar,.toast{display:none!important;}
  .page{padding:0!important;max-width:100%!important;}
  .fcard{box-shadow:none!important;border-radius:0!important;}
  body{background:white!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function StarPicker({ val, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" className={`star${i<=(hov||val)?" on":""}`}
          onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(0)}
          onClick={()=>onChange(i===val?0:i)}>★</button>
      ))}
    </div>
  );
}

function StarShow({ n=0 }) {
  return <span>{[1,2,3,4,5].map(i=><span key={i} className={i<=n?"sf":"se"}>★</span>)}</span>;
}

function Toast({ msg, type, done }) {
  useEffect(()=>{ const t=setTimeout(done,2600); return()=>clearTimeout(t); },[]);
  return <div className={`toast t-${type}`}>{msg}</div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]       = useState("input");
  const [form, setForm]     = useState(EMPTY());
  const [fb, setFb]         = useState(null);
  const [loading, setLoad]  = useState(false);
  const [dirty, setDirty]   = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [askClear, setAsk]  = useState(false);
  const [toast, setToast]   = useState(null);
  const [provider, setProvider] = useState("anthropic");

  const msg = (text, type="t-ok") => setToast({ text, type });

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(cfg => {
      if (cfg.provider) setProvider(cfg.provider);
    }).catch(() => {});
  }, []);

  // Load draft on mount — never crash
  useEffect(() => {
    store.get("draft").then(d => {
      if (!d) return;
      if (d.form) setForm(d.form);
      if (d.at) setSavedAt(new Date(d.at));
      msg("Draft restored!", "t-ok");
    });
  }, []);

  // Form helpers
  const upd = (k, v) => { setForm(f => ({...f, [k]: v})); setDirty(true); };
  const updR = (k, v) => { setForm(f => ({...f, ratings: {...f.ratings, [k]: v}})); setDirty(true); };
  const updA = (i, k, v) => {
    setForm(f => { const a=[...f.actions]; a[i]={...a[i],[k]:v}; return {...f,actions:a}; });
    setDirty(true);
  };
  const addAction = () => { setForm(f=>({...f,actions:[...f.actions,{action:"",byWhen:"",owner:""}]})); setDirty(true); };
  const remAction = i => { setForm(f=>({...f,actions:f.actions.filter((_,x)=>x!==i)})); setDirty(true); };

  // Save draft — fire and forget, never blocks
  const save = () => {
    setSaving(true);
    store.set("draft", { form, at: new Date().toISOString() }).then(ok => {
      if (ok) { setSavedAt(new Date()); setDirty(false); msg("Draft saved!", "t-ok"); }
      else msg("Could not save draft", "t-err");
      setSaving(false);
    });
  };

  // Clear — resets state immediately, storage delete is fire-and-forget
  const clear = () => {
    store.del("draft"); // don't wait
    setForm(EMPTY());
    setFb(null);
    setDirty(false);
    setSavedAt(null);
    setAsk(false);
    msg("Cleared! Ready for new observation.", "t-info");
  };

  const ago = d => {
    if (!d) return "";
    const s = Math.floor((Date.now()-d)/1000);
    if (s<60) return "just now";
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  };

  // Generate — save is fire-and-forget, never blocks API call
  const generate = async () => {
    if (!form.obsNotes.trim()) return;
    save(); // non-blocking
    setLoad(true);
    setFb(null);
    setTab("card");

    const filledR = Object.entries(form.ratings).filter(([,v])=>v>0);
    const rNote = filledR.length
      ? `Use these exact observer ratings: ${filledR.map(([k,v])=>`${k}=${v}/5`).join(", ")}.`
      : "Infer ratings from the observation notes.";

    const manualActions = form.actions.filter(a=>a.action.trim());

    const prompt = `You are a school principal writing a teacher observation feedback report for Achieve Studio School.

Your job: take the observer's raw notes below and turn them into polished, professional feedback. 

RULES FOR ALL OUTPUT:
1. Fix every spelling mistake and grammar error
2. Rephrase all informal, casual, or shorthand language into formal professional prose
3. Keep tone warm, specific, constructive, and growth-oriented
4. Never reproduce raw notes verbatim — always rephrase
5. Every field must be complete, well-written sentences

TEACHER: ${form.teacherName||"—"} | STUDIO: ${form.studio||"—"} | GRADE: ${form.grade||"—"}
DATE: ${form.date||"—"} | STAGE: ${form.rotationStage||"—"} | CONTEXT: ${form.context||"—"}

RAW OBSERVATION NOTES:
${form.obsNotes}
${form.strengths?`\nRAW STRENGTHS NOTES: ${form.strengths}`:""}
${form.scope?`\nRAW IMPROVEMENT NOTES: ${form.scope}`:""}
${form.commNotes?`\nRAW COMMUNICATION NOTES: ${form.commNotes}`:""}
${manualActions.length?`\nRAW ACTIONS: ${manualActions.map(a=>`${a.action} | by: ${a.byWhen||"TBD"} | owner: ${a.owner||"TBD"}`).join(" / ")}`:""}
${form.nextObs?`\nNEXT OBS NOTE: ${form.nextObs}`:""}
RATINGS: ${rNote}

Reply with ONLY this JSON and nothing else — no backticks, no explanation:
{"situation":"","behavior":"","impact":"","growthPrompt":"","ratings":{"Student Engagement & Agency":0,"Clarity of Instructions":0,"Studio Rotation Management":0,"Questioning & Dialogue Quality":0,"Differentiation / Inclusion Support":0,"Reflection / Debrief Facilitation":0,"Classroom Energy & Wellbeing":0},"strengths":"","scopeForImprovement":"","feedbackForCommunication":"","actions":[{"action":"","byWhen":"","owner":""}],"nextObservation":""}`;

    try {
      let res, data, raw;

      if (provider === "anthropic") {
        res = await fetch("/api/anthropic/v1/messages", {
          method:"POST",
          headers:{
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body:JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1500, messages:[{role:"user",content:prompt}] })
        });
        if (!res.ok) throw new Error((await res.json().catch(()=>null))?.error?.message || `HTTP ${res.status}`);
        data = await res.json();
        raw = data.content.filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      } else if (provider === "grok" || provider === "openai") {
        const url = provider === "grok" ? "/api/grok/v1/chat/completions" : "/api/openai/v1/chat/completions";
        const model = provider === "grok" ? "grok-beta" : "gpt-4o";
        res = await fetch(url, {
          method:"POST",
          headers:{
            "Content-Type": "application/json"
          },
          body:JSON.stringify({ model, messages:[{role:"system",content:"You are a helpful assistant that strictly outputs JSON."}, {role:"user",content:prompt}] })
        });
        if (!res.ok) throw new Error((await res.json().catch(()=>null))?.error?.message || `HTTP ${res.status}`);
        data = await res.json();
        raw = data.choices[0].message.content;
      } else if (provider === "gemini") {
        res = await fetch(`/api/gemini/v1beta/models/gemini-1.5-pro:generateContent`, {
          method:"POST",
          headers:{"Content-Type": "application/json"},
          body:JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!res.ok) throw new Error((await res.json().catch(()=>null))?.error?.message || `HTTP ${res.status}`);
        data = await res.json();
        raw = data.candidates[0].content.parts[0].text;
      } else if (provider === "local") {
        const localUrl = import.meta.env.VITE_LOCAL_URL || "http://127.0.0.1:11434"; // Default Ollama port
        res = await fetch(`${localUrl}/v1/chat/completions`, {
          method:"POST",
          headers:{"Content-Type": "application/json"},
          body:JSON.stringify({ 
            model: "llama3:latest", 
            messages:[
              {role:"system",content:"You are a helpful assistant that strictly outputs JSON. Return ONLY JSON and nothing else."}, 
              {role:"user",content:prompt}
            ] 
          })
        });
        if (!res.ok) throw new Error(`Local Model HTTP ${res.status}. Ensure your local model is running and CORS is enabled.`);
        data = await res.json();
        raw = data.choices[0].message.content;
      } else {
        throw new Error("Unknown AI provider: " + provider);
      }
      // Strip any accidental markdown fences
      const clean = raw.replace(/^```[a-z]*\n?/,"").replace(/\n?```$/,"").trim();
      const parsed = JSON.parse(clean);
      // Apply manual star ratings on top of AI ratings
      Object.entries(form.ratings).forEach(([k,v])=>{ if(v>0) parsed.ratings[k]=v; });
      setFb(parsed);
    } catch(e) {
      console.error("API Error details:", e);
      setFb({ _err: true, message: e.message || "An unknown error occurred." });
    }
    setLoad(false);
  };

  const downloadPDF = async () => {
    if (!fb || fb._err) return;
    setLoad(true);
    const esc = s => String(s||"—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const name = form.teacherName || "Teacher";

    // Instead of capturing the live DOM (which causes blank pages on scroll), 
    // we build a clean HTML template specifically for the PDF exact to the original print layout.
    const htmlObj = document.createElement('div');
    htmlObj.innerHTML = `
      <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#1a2e30;padding:24px;width:800px;margin:0 auto;background:white;">
        <div style="background:#005F6B;color:white;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div><h1 style="font-family:'DM Serif Display',serif;font-size:20px;margin:0;">Achieve Studio School</h1><p style="font-size:10px;opacity:.7;margin-top:3px;margin-bottom:0;">Teacher Observation &amp; Feedback Form</p></div>
          <small style="font-size:10px;opacity:.6;font-style:italic;">India's Only Studio School</small>
        </div>
        
        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 1 — Observation Snapshot</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;margin-bottom:16px;">
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Teacher Name</span><span style="font-size:10px;color:#333;">${esc(form.teacherName)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Studio / Subject</span><span style="font-size:10px;color:#333;">${esc(form.studio)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Date</span><span style="font-size:10px;color:#333;">${esc(form.date)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Time &amp; Duration</span><span style="font-size:10px;color:#333;">${esc(form.time)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Grade / Group</span><span style="font-size:10px;color:#333;">${esc(form.grade)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">No. of Students</span><span style="font-size:10px;color:#333;">${esc(form.students)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Observer</span><span style="font-size:10px;color:#333;">${esc(form.observer)}</span></div>
          <div style="display:flex;padding:5px 0;border-bottom:1px solid #eef4f5;"><span style="font-size:9px;font-weight:700;color:#005F6B;min-width:120px;">Observation Type</span><span style="font-size:10px;color:#333;">${esc(form.obsType)}</span></div>
        </div>

        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 2 — Studio Context</div>
        <p style="font-size:10px;line-height:1.75;margin-bottom:5px;">${esc(form.context)}</p>
        <p style="font-size:10px;margin-bottom:16px;"><strong style="color:#005F6B;">Stage:</strong> ${esc(form.rotationStage)}</p>

        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 3 — Feedback (SBI Framework)</div>
        <div style="border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;margin-bottom:8px;">
          <div style="background:#E0F4F5;padding:6px 12px;display:flex;gap:8px;align-items:center;font-size:9px;font-weight:700;"><div style="width:18px;height:18px;border-radius:50%;background:#005F6B;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;">S</div><span style="color:#005F6B;">SITUATION</span></div>
          <div style="padding:9px 12px;font-size:10px;line-height:1.75;color:#222;">${esc(fb.situation)}</div>
        </div>
        <div style="border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;margin-bottom:8px;">
          <div style="background:#E8F5E9;padding:6px 12px;display:flex;gap:8px;align-items:center;font-size:9px;font-weight:700;"><div style="width:18px;height:18px;border-radius:50%;background:#2E7D32;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;">B</div><span style="color:#2E7D32;">BEHAVIOR</span></div>
          <div style="padding:9px 12px;font-size:10px;line-height:1.75;color:#222;">${esc(fb.behavior)}</div>
        </div>
        <div style="border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;margin-bottom:8px;">
          <div style="background:#FFF3E0;padding:6px 12px;display:flex;gap:8px;align-items:center;font-size:9px;font-weight:700;"><div style="width:18px;height:18px;border-radius:50%;background:#E65100;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;">I</div><span style="color:#E65100;">IMPACT</span></div>
          <div style="padding:9px 12px;font-size:10px;line-height:1.75;color:#222;">${esc(fb.impact)}</div>
        </div>
        <div style="background:#FFF8E1;border:1px solid #ffe082;border-radius:6px;padding:10px 12px;margin-bottom:16px;">
          <div style="font-size:9px;font-weight:700;color:#E65100;margin-bottom:5px;">★ GROWTH PROMPT</div>
          <div style="font-size:10px;line-height:1.75;">${esc(fb.growthPrompt)}</div>
        </div>

        <div style="page-break-before: always;"></div>
        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 4 — Studio Practice Quick Ratings</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px;">
          <thead><tr><th style="background:#00838F;color:white;padding:6px 10px;text-align:left;font-weight:600;">Practice Area</th><th style="background:#00838F;color:white;padding:6px 10px;text-align:left;font-weight:600;">Rating</th><th style="background:#00838F;color:white;padding:6px 10px;text-align:left;font-weight:600;width:55px;">Score</th></tr></thead>
          <tbody>${Object.entries(fb.ratings||{}).map(([area,score])=>`
            <tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;">${esc(area)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;"><span style="color:#00838F;">${"★".repeat(score)}</span><span style="color:#ddd;">${"☆".repeat(5-score)}</span></td>
            <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:700;color:#005F6B;">${score}/5</td></tr>`).join("")}
          </tbody>
        </table>

        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 5 — Strengths &amp; Scope for Improvement</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          <div style="border-radius:6px;overflow:hidden;">
            <div style="padding:6px 12px;font-size:9px;font-weight:700;background:#E0F4F5;color:#005F6B;">✦ Strengths</div>
            <div style="padding:10px 12px;font-size:10px;line-height:1.75;color:#222;border:1px solid #eee;border-top:none;border-radius:0 0 6px 6px;min-height:60px;">${esc(fb.strengths)}</div>
          </div>
          <div style="border-radius:6px;overflow:hidden;">
            <div style="padding:6px 12px;font-size:9px;font-weight:700;background:#FFF3E0;color:#E65100;">→ Scope for Improvement</div>
            <div style="padding:10px 12px;font-size:10px;line-height:1.75;color:#222;border:1px solid #eee;border-top:none;border-radius:0 0 6px 6px;min-height:60px;">${esc(fb.scopeForImprovement)}</div>
          </div>
        </div>

        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 5B — Feedback for Communication</div>
        <div style="border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;font-size:10px;line-height:1.75;margin-bottom:16px;">${esc(fb.feedbackForCommunication)}</div>

        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 6 — Agreed Actions &amp; Follow-up</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px;">
          <thead><tr><th style="background:#00838F;color:white;padding:6px 10px;font-weight:600;text-align:left;width:55%;">Action / Commitment</th><th style="background:#00838F;color:white;padding:6px 10px;font-weight:600;text-align:left;width:25%;">By When</th><th style="background:#00838F;color:white;padding:6px 10px;font-weight:600;text-align:left;">Owner</th></tr></thead>
          <tbody>${(fb.actions||[]).filter(a=>a.action).map(a=>`
            <tr><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;">${esc(a.action)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;">${esc(a.byWhen)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;">${esc(a.owner)}</td></tr>`).join("")}
          </tbody>
        </table>
        <div style="font-size:10px;color:#555;padding:6px 0;border-top:1px solid #eee;margin-top:5px;margin-bottom:16px;"><strong style="color:#005F6B;">Next Observation:</strong> ${esc(fb.nextObservation)}</div>

        <div style="background:#00838F;color:white;padding:6px 12px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Section 7 — Acknowledgement</div>
        <p style="font-size:9px;color:#777;font-style:italic;margin-bottom:8px;">This form is a record of a professional conversation. Its purpose is growth, not evaluation.</p>
        ${form.ackNotes?`<p style="font-size:10px;line-height:1.6;margin-bottom:10px;">${esc(form.ackNotes)}</p>`:""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:40px;margin-bottom:40px;">
          <div style="border-top:1.5px solid #ccc;padding-top:4px;font-size:9px;color:#888;">Observer Signature</div>
          <div style="border-top:1.5px solid #ccc;padding-top:4px;font-size:9px;color:#888;">Teacher Signature &amp; Date</div>
        </div>

        <div style="background:#f8fdfd;border-top:1px solid #e0f4f5;padding:8px 24px;text-align:center;font-size:9px;font-style:italic;color:#00838F;">
          "Every classroom is a studio. Every teacher, a craftsperson." &nbsp;|&nbsp; Confidential — For Professional Development Use Only
        </div>
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `${name.replace(/\s+/g,"_")}_Feedback.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(htmlObj).save();
      msg("PDF Downloaded successfully!", "t-ok");
    } catch (e) {
      console.error(e);
      msg("Failed to generate PDF", "t-err");
    } finally {
      setLoad(false);
    }
  };

  const saveForDownload = async () => {
    if (!fb || fb._err) return;
    const ok = await store.set("report", { form, fb, savedAt: new Date().toISOString() });
    if (ok) msg("Report saved! Go to chat and say: download my report", "t-ok");
    else msg("Could not save 2014 try again", "t-err");
  };

  const f = form;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* Header */}
        <div className="topbar">
          <div><h1>Achieve Studio School</h1><p>Teacher Observation &amp; Feedback Tool</p></div>
          <div style={{fontSize:11,opacity:.6,textAlign:"right"}}>AI-Powered<br/>Feedback Generator</div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab${tab==="input"?" on":""}`} onClick={()=>setTab("input")}>📝 Enter Observation</div>
          <div className={`tab${tab==="card"?" on":""}`} onClick={()=>setTab("card")}>📋 Feedback Card</div>
        </div>

        {/* ── INPUT TAB ── */}
        {tab==="input" && (
          <div className="page">

            {/* Draft bar */}
            <div className="dbar">
              <div className="dbar-l">
                <div className={`dot${dirty?" orange":savedAt?" green":""}`}/>
                <div>
                  <strong style={{fontSize:13,color:"#333"}}>Draft</strong>
                  <span style={{fontSize:11,display:"block",color:dirty?"#FF9800":savedAt?"#4CAF50":"#888"}}>
                    {dirty?"Unsaved changes":savedAt?`Saved ${ago(savedAt)}`:"No draft saved yet"}
                  </span>
                </div>
              </div>
              <div className="dbar-r">
                {askClear ? (
                  <>
                    <span className="confirm-msg">Clear all data?</span>
                    <button className="btn btn-clear" onClick={clear}>Yes, clear</button>
                    <button className="btn btn-cancel" onClick={()=>setAsk(false)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-clear" onClick={()=>setAsk(true)}>✕ Clear &amp; Start New</button>
                    <button className="btn btn-save" onClick={save} disabled={saving}>{saving?"Saving…":"💾 Save Draft"}</button>
                  </>
                )}
              </div>
            </div>

            {/* S1 */}
            <div className="scard">
              <div className="scard-hd">Section 1 — Observation Snapshot <span className="badge">Required</span></div>
              <div className="scard-body">
                <div className="g2">
                  {[["teacherName","Teacher Name","e.g. Sujatha"],["studio","Studio / Subject","e.g. Think Patch / Maths"],
                    ["grade","Grade / Group","e.g. Grade 6 – Group B"],["students","No. of Students","e.g. 24"],
                    ["observer","Observer","Your name"],["obsType","Observation Type","e.g. Walkthrough"]
                  ].map(([k,l,p])=>(
                    <div className="fg" key={k}>
                      <label className="lbl">{l}</label>
                      <input placeholder={p} value={f[k]} onChange={e=>upd(k,e.target.value)}/>
                    </div>
                  ))}
                </div>
                <div className="g2">
                  <div className="fg"><label className="lbl">Date</label><input type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></div>
                  <div className="fg"><label className="lbl">Time &amp; Duration</label><input placeholder="e.g. 10:20am – 40 mins" value={f.time} onChange={e=>upd("time",e.target.value)}/></div>
                </div>
              </div>
            </div>

            {/* S2 */}
            <div className="scard">
              <div className="scard-hd">Section 2 — Studio Context</div>
              <div className="scard-body">
                <div className="g2">
                  <div className="fg">
                    <label className="lbl">Rotation Stage</label>
                    <select value={f.rotationStage} onChange={e=>upd("rotationStage",e.target.value)}>
                      <option value="">Select…</option>
                      {["Introduction / Launch","Active Exploration","Guided Practice","Reflection / Debrief","Transition"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label className="lbl">Studio Context <em>(brief)</em></label>
                    <input placeholder="e.g. Students working on fractions in groups" value={f.context} onChange={e=>upd("context",e.target.value)}/>
                  </div>
                </div>
              </div>
            </div>

            {/* S3 */}
            <div className="scard">
              <div className="scard-hd">Section 3 — Observation Notes <span className="badge">AI generates SBI from this</span></div>
              <div className="scard-body">
                <div className="hint">Write freely — spelling, grammar, shorthand, whatever comes naturally. The AI will rephrase everything into polished professional language.</div>
                <textarea style={{minHeight:160}} placeholder="e.g. Teacher opened well. Instructions verbal — some at the back didn't follow. Good questioning in group 2. Debrief rushed." value={f.obsNotes} onChange={e=>upd("obsNotes",e.target.value)}/>
              </div>
            </div>

            {/* S4 */}
            <div className="scard">
              <div className="scard-hd">Section 4 — Studio Practice Ratings <span className="badge">Optional — AI fills if blank</span></div>
              <div className="scard-body">
                <div className="hint">Rate what you observed. Leave blank and AI will rate from your notes. 1 = Needs support · 5 = Exemplary</div>
                {RATINGS.map(r=>(
                  <div className="rrow" key={r}>
                    <div className="rlbl">{r}</div>
                    <StarPicker val={f.ratings[r]} onChange={v=>updR(r,v)}/>
                    <div className="rval">{f.ratings[r]>0?`${f.ratings[r]}/5`:"—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* S5 */}
            <div className="scard">
              <div className="scard-hd">Section 5 — Strengths &amp; Scope for Improvement <span className="badge">Optional — AI fills &amp; rephrases</span></div>
              <div className="scard-body">
                <div className="g2">
                  <div className="fg">
                    <label className="lbl">✦ Strengths <em>(your rough notes)</em></label>
                    <textarea style={{minHeight:100}} placeholder="What stood out positively?" value={f.strengths} onChange={e=>upd("strengths",e.target.value)}/>
                  </div>
                  <div className="fg">
                    <label className="lbl">→ Scope for Improvement <em>(your rough notes)</em></label>
                    <textarea style={{minHeight:100}} placeholder="Areas to develop?" value={f.scope} onChange={e=>upd("scope",e.target.value)}/>
                  </div>
                </div>
              </div>
            </div>

            {/* S5B */}
            <div className="scard">
              <div className="scard-hd">Section 5B — Feedback for Communication <span className="badge">Optional — AI fills &amp; rephrases</span></div>
              <div className="scard-body">
                <div className="fg">
                  <label className="lbl">Communication notes <em>(tone, timing, sensitivities)</em></label>
                  <textarea style={{minHeight:90}} placeholder="e.g. Lead with strengths. Suggest 1:1 before sharing written form." value={f.commNotes} onChange={e=>upd("commNotes",e.target.value)}/>
                </div>
              </div>
            </div>

            {/* S6 */}
            <div className="scard">
              <div className="scard-hd">Section 6 — Agreed Actions <span className="badge">Optional — AI suggests &amp; rephrases</span></div>
              <div className="scard-body">
                <div className="ah">
                  <span className="lbl">Action</span><span className="lbl">By When</span><span className="lbl">Owner</span><span/>
                </div>
                {f.actions.map((a,i)=>(
                  <div className="ar" key={i}>
                    <input placeholder="e.g. establish ground rules" value={a.action} onChange={e=>updA(i,"action",e.target.value)}/>
                    <input placeholder="e.g. Next session" value={a.byWhen} onChange={e=>updA(i,"byWhen",e.target.value)}/>
                    <select value={a.owner} onChange={e=>updA(i,"owner",e.target.value)}>
                      <option value="">Owner…</option>
                      <option>Teacher</option><option>Both</option><option>Observer</option>
                    </select>
                    <button className="rm" onClick={()=>remAction(i)}>×</button>
                  </div>
                ))}
                <button className="add" onClick={addAction}>+ Add Action</button>
                <div style={{marginTop:14}}>
                  <div className="fg"><label className="lbl">Next Observation</label><input placeholder="e.g. In 3 weeks / 15 April 2026" value={f.nextObs} onChange={e=>upd("nextObs",e.target.value)}/></div>
                </div>
              </div>
            </div>

            {/* S7 */}
            <div className="scard">
              <div className="scard-hd">Section 7 — Acknowledgement <span className="badge">Optional</span></div>
              <div className="scard-body">
                <div className="fg">
                  <label className="lbl">Notes above signature lines</label>
                  <textarea style={{minHeight:70}} placeholder="e.g. Agreed follow-up: 18 April." value={f.ackNotes} onChange={e=>upd("ackNotes",e.target.value)}/>
                </div>
              </div>
            </div>

            <button className="gen" onClick={generate} disabled={!f.obsNotes.trim()||loading}>
              {loading?"Generating…":"✦  Generate Feedback Card"}
            </button>
          </div>
        )}

        {/* ── CARD TAB ── */}
        {tab==="card" && (
          <div className="page">
            {loading ? (
              <div className="loading">
                <div className="dp"/><div className="dp"/><div className="dp"/>
                <span style={{marginLeft:10}}>Generating your feedback card…</span>
              </div>
            ) : !fb ? (
              <div className="empty"><div style={{fontSize:44,marginBottom:12}}>📋</div><div>Enter observation notes and click Generate</div></div>
            ) : fb._err ? (
              <div className="empty">
                <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
                <div style={{color:"#c62828",fontWeight:600,marginBottom:6}}>Could not generate feedback.</div>
                <div style={{color:"#555",fontSize:13,whiteSpace:"pre-wrap"}}>{fb.message}</div>
                <button className="btn btn-dark" style={{marginTop:16}} onClick={()=>setTab("input")}>Return to Inputs</button>
              </div>
            ) : (
              <>
                <div className="toolbar">
                  <button className="btn btn-print" onClick={downloadPDF}>📥 Download Report</button>
                  <button className="btn btn-dark" onClick={()=>setTab("input")}>✏️ Edit Inputs</button>
                  <span style={{fontSize:12,color:"#888"}}>The downloaded file will automatically open the print dialog to save as PDF.</span>
                </div>
                <div className="fcard">
                  <div className="fcard-top">
                    <div><div className="fschool">Achieve Studio School</div><div className="fsub">Teacher Observation &amp; Feedback Form</div></div>
                    <div style={{fontSize:11,opacity:.65,fontStyle:"italic"}}>India's Only Studio School</div>
                  </div>
                  <div className="fbody">

                    <div className="fsec">Section 1 — Observation Snapshot</div>
                    <div className="mgrid">
                      {[["Teacher Name",f.teacherName],["Studio / Subject",f.studio],["Date",f.date],["Time & Duration",f.time],["Grade / Group",f.grade],["No. of Students",f.students],["Observer",f.observer],["Observation Type",f.obsType]].map(([l,v])=>(
                        <div className="mrow" key={l}><span className="mlbl">{l}</span><span className="mval">{v||"—"}</span></div>
                      ))}
                    </div>

                    <div className="fsec">Section 2 — Studio Context</div>
                    <p style={{fontSize:12,lineHeight:1.7,marginBottom:5}}>{f.context||"—"}</p>
                    <p style={{fontSize:11,fontWeight:700,color:DARK_TEAL}}>Stage: <span style={{fontWeight:400,color:"#333"}}>{f.rotationStage||"—"}</span></p>

                    <div className="fsec">Section 3 — Feedback (SBI Framework)</div>
                    {[{l:"S",t:"SITUATION",k:"situation",bg:LIGHT_TEAL,c:DARK_TEAL},{l:"B",t:"BEHAVIOR",k:"behavior",bg:"#E8F5E9",c:"#2E7D32"},{l:"I",t:"IMPACT",k:"impact",bg:LIGHT_ORANGE,c:ORANGE}].map(({l,t,k,bg,c})=>(
                      <div className="sbi-blk" key={k}>
                        <div className="sbi-top" style={{background:bg}}>
                          <div className="sbi-cir" style={{background:c}}>{l}</div>
                          <span style={{color:c,fontSize:11,fontWeight:700}}>{t}</span>
                        </div>
                        <div className="sbi-bdy">{fb[k]}</div>
                      </div>
                    ))}
                    <div className="gp">
                      <div style={{fontSize:10,fontWeight:700,color:ORANGE,marginBottom:5}}>★ GROWTH PROMPT</div>
                      <div style={{fontSize:12,lineHeight:1.7}}>{fb.growthPrompt}</div>
                    </div>

                    <div className="fsec">Section 4 — Studio Practice Quick Ratings</div>
                    <table className="rtbl">
                      <thead><tr><th>Practice Area</th><th>Rating</th><th style={{width:50}}>Score</th></tr></thead>
                      <tbody>{Object.entries(fb.ratings||{}).map(([a,s])=>(
                        <tr key={a}><td>{a}</td><td><StarShow n={s}/></td><td style={{fontWeight:700,color:DARK_TEAL}}>{s}/5</td></tr>
                      ))}</tbody>
                    </table>

                    <div className="fsec">Section 5 — Strengths &amp; Scope for Improvement</div>
                    <div className="twocol">
                      <div className="cbox">
                        <div className="cbox-hd" style={{background:LIGHT_TEAL,color:DARK_TEAL}}>✦ Strengths</div>
                        <div className="cbox-bd">{fb.strengths}</div>
                      </div>
                      <div className="cbox">
                        <div className="cbox-hd" style={{background:LIGHT_ORANGE,color:ORANGE}}>→ Scope for Improvement</div>
                        <div className="cbox-bd">{fb.scopeForImprovement}</div>
                      </div>
                    </div>

                    <div className="fsec">Section 5B — Feedback for Communication</div>
                    <div className="cmnotes">{fb.feedbackForCommunication}</div>

                    <div className="fsec">Section 6 — Agreed Actions &amp; Follow-up</div>
                    <table className="atbl">
                      <thead><tr><th style={{width:"55%"}}>Action / Commitment</th><th style={{width:"25%"}}>By When</th><th>Owner</th></tr></thead>
                      <tbody>{(fb.actions||[]).filter(a=>a.action).map((a,i)=>(
                        <tr key={i}><td>{a.action}</td><td>{a.byWhen}</td><td>{a.owner}</td></tr>
                      ))}</tbody>
                    </table>
                    <p style={{fontSize:11,color:"#555",marginTop:6,padding:"5px 0",borderTop:"1px solid #eee"}}>
                      <strong style={{color:DARK_TEAL}}>Next Observation:</strong> {fb.nextObservation}
                    </p>

                    <div className="fsec">Section 7 — Acknowledgement</div>
                    <p style={{fontSize:11,color:"#777",fontStyle:"italic",marginBottom:8}}>This form is a record of a professional conversation. Its purpose is growth, not evaluation.</p>
                    {f.ackNotes&&<p style={{fontSize:12,marginBottom:10,lineHeight:1.6}}>{f.ackNotes}</p>}
                    <div className="sigrow">
                      <div className="sigbox"><div style={{fontSize:11,color:"#888",marginTop:28}}>Observer Signature</div></div>
                      <div className="sigbox"><div style={{fontSize:11,color:"#888",marginTop:28}}>Teacher Signature &amp; Date</div></div>
                    </div>
                  </div>
                  <div className="ffoot">
                    "Every classroom is a studio. Every teacher, a craftsperson."
                    <span style={{margin:"0 12px",opacity:.4}}>|</span>
                    <span style={{opacity:.5}}>Confidential — For Professional Development Use Only</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {toast && <Toast msg={toast.text} type={toast.type} done={()=>setToast(null)}/>}
      </div>
    </>
  );
}
