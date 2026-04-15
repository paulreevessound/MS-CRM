import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { auth, signInWithGoogle, signOutUser, loadUserData, saveUserData, loadUserProfile, createUserProfile } from './firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
const XLSX = window.XLSX;

// ── Icon System — custom SVG icons replacing all emojis ──────────────────
const ICON_PATHS = {
  mic:        <><rect x="9" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  fader:      <><rect x="4" y="3" width="2.5" height="18" rx="1.25" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="3" y="8" width="4.5" height="5" rx="1" fill="currentColor"/><rect x="11" y="3" width="2.5" height="18" rx="1.25" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="10" y="12" width="4.5" height="5" rx="1" fill="currentColor"/><rect x="18" y="3" width="2.5" height="18" rx="1.25" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="17" y="6" width="4.5" height="5" rx="1" fill="currentColor"/></>,
  console:    <><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="7" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="5" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="10" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="15" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></>,
  camera:     <><path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><rect x="2" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  headphones: <><path d="M3 12a9 9 0 0 1 18 0" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 12v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M21 12v4a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  clapper:    <><path d="M4 11h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M4 11l2-6h12l2 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/><line x1="8" y1="5" x2="9.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="5" x2="15.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  person:     <><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  people:     <><circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="17" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M15 14.2c.6-.1 1.3-.2 2-.2 3.9 0 7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  money:      <><rect x="2" y="6" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="6" y1="6" x2="6" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="6" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="18" y1="6" x2="18" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  folder:     <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  calendar:   <><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><rect x="7" y="13" width="3" height="3" rx=".5" fill="currentColor"/><rect x="11" y="13" width="3" height="3" rx=".5" fill="currentColor"/></>,
  gantt:      <><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/><rect x="4" y="4" width="8" height="4" rx="1.5" fill="currentColor"/><rect x="8" y="10" width="10" height="4" rx="1.5" fill="currentColor" opacity=".8"/><rect x="4" y="16" width="6" height="4" rx="1.5" fill="currentColor" opacity=".6"/></>,
  note:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  screen:     <><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  refresh:    <><path d="M23 4v6h-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 20v-6h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  search:     <><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  lock:       <><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  bell:       <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  link:       <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  wrench:     <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  files:      <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h3a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M5 10h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  trash:      <><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  dot_green:  <><circle cx="12" cy="12" r="5" fill="#43a047"/><circle cx="12" cy="12" r="8" stroke="#43a047" strokeWidth="1" fill="none" opacity=".4"/></>,
  lightning:  <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
  warning:    <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></>,
  upload:     <><polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  timer:      <><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><polyline points="12 9 12 13 14.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  settings:   <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  waveform:   <><polyline points="2 12 5 5 8 18 11 8 14 15 17 10 20 12 22 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  plus:       <><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
};

// Legacy emoji → icon name map for Firestore data saved before migration
const EMOJI_TO_ICON={'🎙️':'mic','🎚️':'fader','🎛️':'console','🎥':'camera','🎧':'headphones',
  '🎬':'clapper','👤':'person','👥':'people','💰':'money','📁':'folder','📅':'calendar',
  '📊':'gantt','📝':'note','📺':'screen','🔄':'refresh','🔍':'search','🔒':'lock',
  '🔔':'bell','🔗':'link','🔧':'wrench','🗂️':'files','🗑':'trash','⚡':'lightning',
  '⚠️':'warning','⬆':'upload','⏱':'timer','⚙️':'settings'};

function Icon({name,size=16,color='currentColor',className='',style={}}){
  const resolvedName=EMOJI_TO_ICON[name]||name;
  const paths=ICON_PATHS[resolvedName];
  if(!paths)return null;
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{display:'inline-block',verticalAlign:'middle',flexShrink:0,color,...style}}>
      {paths}
    </svg>
  );
}




// ── Constants ──────────────────────────────────────────────────────────────
const ST=[{l:'Not Started',c:'#757575',bg:'#f5f5f5'},{l:'In Progress',c:'#1565c0',bg:'#e3f2fd'},{l:'Review',c:'#6a1fa2',bg:'#f3e5f5'},{l:'Done',c:'#2e7d32',bg:'#e8f5e9'},{l:'Stuck',c:'#c62828',bg:'#ffebee'},{l:'On Hold',c:'#e65100',bg:'#fff3e0'}];
const PRI=[{l:'Critical',c:'#c62828',bg:'#ffebee'},{l:'High',c:'#d84315',bg:'#fbe9e7'},{l:'Medium',c:'#f57f17',bg:'#fffde7'},{l:'Low',c:'#2e7d32',bg:'#e8f5e9'}];
const PAL=['#5c6bc0','#e53935','#43a047','#fb8c00','#00acc1','#8e24aa','#f4511e','#3949ab'];
const PEOPLE=['Matthew P','Paul R','Kristen S','Tom B','Alex R','Mia L'];
const GCOLS=['#5c6bc0','#43a047','#fb8c00','#e53935','#00acc1','#8e24aa'];
const STAGES=['Brief','Capture','Edit','Mix','Master','QC','Deliver'];
const STAGE_COLORS=['#00acc1','#fb8c00','#5c6bc0','#8e24aa','#43a047','#f4511e','#3949ab'];

const TASK_DEFS=[
  {name:'Ingest',    abbr:'ING', color:'#546e7a',text:'#fff'},
  {name:'DX Edit',   abbr:'DX',  color:'#d32f2f',text:'#fff'},
  {name:'MX Edit',   abbr:'MX',  color:'#1565c0',text:'#fff'},
  {name:'SFX Edit',  abbr:'SFX', color:'#2e7d32',text:'#fff'},
  {name:'Pre Mix',   abbr:'PRE', color:'#bf360c',text:'#fff'},
  {name:'Final Mix', abbr:'MIX', color:'#283593',text:'#fff'},
  {name:'QC',        abbr:'QC',  color:'#e65100',text:'#fff'},
  {name:'Delivery',  abbr:'DEL', color:'#f9a825',text:'#333'},
];
const uid=()=>Math.random().toString(36).slice(2,9);
const sOpts=t=>t==='priority'?PRI:ST;
const sStyle=(v,t='status')=>{const o=sOpts(t).find(x=>x.l===v);return o?{background:o.bg,color:o.c,border:`1px solid ${o.c}30`}:{background:'#f5f5f5',color:'#999'}};
const pColor=n=>PAL[PEOPLE.indexOf(n)%PAL.length]||'#5c6bc0';
const inits=n=>n?n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2):'?';
const fmtD=d=>{if(!d)return'';const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-AU',{day:'numeric',month:'short'})};
const fmtM=d=>{if(!d)return'';const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-AU',{month:'long',year:'numeric'})};
const fmtCur=v=>{if(v===''||v==null)return'';const n=parseFloat(v);return isNaN(n)?'':'$'+n.toLocaleString('en-AU',{minimumFractionDigits:0})};
const minsToHrs=m=>(m/60).toFixed(1);
const today=()=>new Date().toISOString().split('T')[0];
const addDays=(d,n)=>{const dt=new Date(d+'T00:00:00');dt.setDate(dt.getDate()+n);return dt.toISOString().split('T')[0]};
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/(86400000));
const tk=(id,nm,sd,ed,st,pct,who)=>({id,name:nm,startDate:sd,endDate:ed,status:st,pct:pct||0,assignee:who||'Paul R'});
const taskDef=name=>TASK_DEFS.find(t=>t.name===name)||TASK_DEFS[0];

// ── Initial Master Gantt — pre-populated from live schedule ────────────────
const INIT_MASTER_GANTT=[
  {id:'mg1',code:'MS1039',name:'Shark Net',client:'Pocket Money Productions',type:'film',
   episodes:[{id:'e1',name:'Film',tasks:[
     tk('sn1','Ingest',   '2026-05-04','2026-05-04','Done',100,'Paul R'),
     tk('sn2','DX Edit',  '2026-05-04','2026-05-29','In Progress',60,'Paul R'),
     tk('sn3','MX Edit',  '2026-06-10','2026-06-14','Not Started',0,'Matthew P'),
     tk('sn4','SFX Edit', '2026-06-02','2026-06-09','Not Started',0,'Matthew P'),
     tk('sn5','Pre Mix',  '2026-06-15','2026-06-21','Not Started',0,'Paul R'),
     tk('sn6','Final Mix','2026-06-22','2026-06-26','Not Started',0,'Paul R'),
     tk('sn7','QC',       '2026-06-27','2026-06-28','Not Started',0,'Kristen S'),
     tk('sn8','Delivery', '2026-06-29','2026-06-29','Not Started',0,'Kristen S'),
   ]}]},
  {id:'mg2',code:'MS0972',name:'Inside Sydney Fish Markets',client:'Butter Films',type:'series',
   episodes:[
     {id:'e1',name:'Ep 1',tasks:[
       tk('f1a','Ingest',   '2026-05-25','2026-05-25','Not Started',0,'Paul R'),
       tk('f1b','DX Edit',  '2026-05-26','2026-05-27','Not Started',0,'Paul R'),
       tk('f1c','MX Edit',  '2026-05-27','2026-05-28','Not Started',0,'Paul R'),
       tk('f1d','SFX Edit', '2026-05-28','2026-05-29','Not Started',0,'Paul R'),
       tk('f1e','Pre Mix',  '2026-05-29','2026-05-30','Not Started',0,'Paul R'),
       tk('f1f','Final Mix','2026-05-30','2026-06-01','Not Started',0,'Paul R'),
       tk('f1g','QC',       '2026-06-01','2026-06-02','Not Started',0,'Kristen S'),
       tk('f1h','Delivery', '2026-06-02','2026-06-02','Not Started',0,'Kristen S'),
     ]},
     {id:'e2',name:'Ep 2',tasks:[
       tk('f2a','Ingest',   '2026-06-29','2026-06-29','Not Started',0,'Paul R'),
       tk('f2b','DX Edit',  '2026-06-30','2026-07-01','Not Started',0,'Paul R'),
       tk('f2c','MX Edit',  '2026-07-01','2026-07-02','Not Started',0,'Paul R'),
       tk('f2d','SFX Edit', '2026-07-02','2026-07-03','Not Started',0,'Paul R'),
       tk('f2e','Pre Mix',  '2026-07-03','2026-07-04','Not Started',0,'Paul R'),
       tk('f2f','Final Mix','2026-07-04','2026-07-06','Not Started',0,'Paul R'),
       tk('f2g','QC',       '2026-07-06','2026-07-07','Not Started',0,'Kristen S'),
       tk('f2h','Delivery', '2026-08-24','2026-08-24','Not Started',0,'Kristen S'),
     ]},
     {id:'e3',name:'Ep 3',tasks:[
       tk('f3a','Ingest',   '2026-07-06','2026-07-06','Not Started',0,'Paul R'),
       tk('f3b','DX Edit',  '2026-07-07','2026-07-08','Not Started',0,'Paul R'),
       tk('f3c','MX Edit',  '2026-07-08','2026-07-10','Not Started',0,'Paul R'),
       tk('f3d','SFX Edit', '2026-07-10','2026-07-11','Not Started',0,'Paul R'),
       tk('f3e','Pre Mix',  '2026-07-11','2026-07-12','Not Started',0,'Paul R'),
       tk('f3f','Final Mix','2026-07-12','2026-07-14','Not Started',0,'Paul R'),
       tk('f3g','QC',       '2026-07-14','2026-07-14','Not Started',0,'Kristen S'),
       tk('f3h','Delivery', '2026-08-31','2026-08-31','Not Started',0,'Kristen S'),
     ]},
     {id:'e4',name:'Ep 4',tasks:[
       tk('f4a','Ingest',   '2026-07-28','2026-07-28','Not Started',0,'Paul R'),
       tk('f4b','DX Edit',  '2026-07-29','2026-07-30','Not Started',0,'Paul R'),
       tk('f4c','MX Edit',  '2026-07-30','2026-07-31','Not Started',0,'Paul R'),
       tk('f4d','SFX Edit', '2026-07-31','2026-08-01','Not Started',0,'Paul R'),
       tk('f4e','Pre Mix',  '2026-08-01','2026-08-02','Not Started',0,'Paul R'),
       tk('f4f','Final Mix','2026-08-03','2026-08-05','Not Started',0,'Paul R'),
       tk('f4g','QC',       '2026-08-05','2026-08-05','Not Started',0,'Kristen S'),
       tk('f4h','Delivery', '2026-09-07','2026-09-07','Not Started',0,'Kristen S'),
     ]},
     {id:'e5',name:'Ep 5',tasks:[
       tk('f5a','Ingest',   '2026-08-10','2026-08-10','Not Started',0,'Paul R'),
       tk('f5b','DX Edit',  '2026-08-11','2026-08-12','Not Started',0,'Paul R'),
       tk('f5c','MX Edit',  '2026-08-12','2026-08-14','Not Started',0,'Paul R'),
       tk('f5d','SFX Edit', '2026-08-14','2026-08-15','Not Started',0,'Paul R'),
       tk('f5e','Pre Mix',  '2026-08-15','2026-08-16','Not Started',0,'Paul R'),
       tk('f5f','Final Mix','2026-08-16','2026-08-18','Not Started',0,'Paul R'),
       tk('f5g','QC',       '2026-08-18','2026-08-18','Not Started',0,'Kristen S'),
       tk('f5h','Delivery', '2026-09-14','2026-09-14','Not Started',0,'Kristen S'),
     ]},
     {id:'e6',name:'Ep 6',tasks:[
       tk('f6a','Ingest',   '2026-08-24','2026-08-24','Not Started',0,'Paul R'),
       tk('f6b','DX Edit',  '2026-08-25','2026-08-26','Not Started',0,'Paul R'),
       tk('f6c','MX Edit',  '2026-08-26','2026-08-28','Not Started',0,'Paul R'),
       tk('f6d','SFX Edit', '2026-08-28','2026-08-29','Not Started',0,'Paul R'),
       tk('f6e','Pre Mix',  '2026-08-29','2026-08-30','Not Started',0,'Paul R'),
       tk('f6f','Final Mix','2026-08-30','2026-09-01','Not Started',0,'Paul R'),
       tk('f6g','QC',       '2026-09-01','2026-09-01','Not Started',0,'Kristen S'),
       tk('f6h','Delivery', '2026-09-21','2026-09-21','Not Started',0,'Kristen S'),
     ]},
   ]},
  {id:'mg3',code:'MS1052',name:'Dancing Reality Show',client:'BBC Studios',type:'series',
   episodes:[
     {id:'d1',name:'Ep 1',tasks:[
       tk('d1a','Ingest',   '2026-05-30','2026-05-30','Not Started',0,'Matthew P'),
       tk('d1b','DX Edit',  '2026-05-30','2026-06-04','Not Started',0,'Matthew P'),
       tk('d1c','MX Edit',  '2026-06-04','2026-06-09','Not Started',0,'Matthew P'),
       tk('d1d','SFX Edit', '2026-06-09','2026-06-12','Not Started',0,'Matthew P'),
       tk('d1e','Pre Mix',  '2026-06-12','2026-06-15','Not Started',0,'Matthew P'),
       tk('d1f','Final Mix','2026-06-15','2026-06-18','Not Started',0,'Matthew P'),
       tk('d1g','QC',       '2026-06-23','2026-06-23','Not Started',0,'Kristen S'),
       tk('d1h','Delivery', '2026-07-04','2026-07-05','Not Started',0,'Kristen S'),
     ]},
     {id:'d2',name:'Ep 2',tasks:[
       tk('d2a','Ingest',   '2026-06-12','2026-06-12','Not Started',0,'Matthew P'),
       tk('d2b','DX Edit',  '2026-06-12','2026-06-16','Not Started',0,'Matthew P'),
       tk('d2c','MX Edit',  '2026-06-16','2026-06-20','Not Started',0,'Matthew P'),
       tk('d2d','SFX Edit', '2026-06-20','2026-06-22','Not Started',0,'Matthew P'),
       tk('d2e','Pre Mix',  '2026-06-22','2026-06-24','Not Started',0,'Matthew P'),
       tk('d2f','Final Mix','2026-06-24','2026-06-25','Not Started',0,'Matthew P'),
       tk('d2g','QC',       '2026-06-30','2026-06-30','Not Started',0,'Kristen S'),
       tk('d2h','Delivery', '2026-07-11','2026-07-12','Not Started',0,'Kristen S'),
     ]},
     {id:'d3',name:'Ep 3',tasks:[
       tk('d3a','Ingest',   '2026-06-23','2026-06-23','Not Started',0,'Matthew P'),
       tk('d3b','DX Edit',  '2026-06-23','2026-06-26','Not Started',0,'Matthew P'),
       tk('d3c','MX Edit',  '2026-06-26','2026-06-29','Not Started',0,'Matthew P'),
       tk('d3d','SFX Edit', '2026-06-29','2026-07-01','Not Started',0,'Matthew P'),
       tk('d3e','Pre Mix',  '2026-07-01','2026-07-02','Not Started',0,'Matthew P'),
       tk('d3f','Final Mix','2026-07-02','2026-07-03','Not Started',0,'Matthew P'),
       tk('d3g','QC',       '2026-07-07','2026-07-07','Not Started',0,'Kristen S'),
       tk('d3h','Delivery', '2026-07-18','2026-07-19','Not Started',0,'Kristen S'),
     ]},
     {id:'d4',name:'Ep 4',tasks:[
       tk('d4a','Ingest',   '2026-06-24','2026-06-24','Not Started',0,'Matthew P'),
       tk('d4b','DX Edit',  '2026-06-24','2026-06-29','Not Started',0,'Matthew P'),
       tk('d4c','MX Edit',  '2026-06-29','2026-07-03','Not Started',0,'Matthew P'),
       tk('d4d','SFX Edit', '2026-07-03','2026-07-06','Not Started',0,'Matthew P'),
       tk('d4e','Pre Mix',  '2026-07-06','2026-07-08','Not Started',0,'Matthew P'),
       tk('d4f','Final Mix','2026-07-08','2026-07-09','Not Started',0,'Matthew P'),
       tk('d4g','QC',       '2026-07-14','2026-07-14','Not Started',0,'Kristen S'),
       tk('d4h','Delivery', '2026-07-25','2026-07-26','Not Started',0,'Kristen S'),
     ]},
     {id:'d5',name:'Ep 5',tasks:[
       tk('d5a','Ingest',   '2026-06-26','2026-06-26','Not Started',0,'Matthew P'),
       tk('d5b','DX Edit',  '2026-06-26','2026-07-02','Not Started',0,'Matthew P'),
       tk('d5c','MX Edit',  '2026-07-02','2026-07-07','Not Started',0,'Matthew P'),
       tk('d5d','SFX Edit', '2026-07-07','2026-07-10','Not Started',0,'Matthew P'),
       tk('d5e','Pre Mix',  '2026-07-10','2026-07-13','Not Started',0,'Matthew P'),
       tk('d5f','Final Mix','2026-07-13','2026-07-16','Not Started',0,'Matthew P'),
       tk('d5g','QC',       '2026-07-21','2026-07-22','Not Started',0,'Kristen S'),
       tk('d5h','Delivery', '2026-08-01','2026-08-02','Not Started',0,'Kristen S'),
     ]},
     {id:'d6',name:'Ep 6',tasks:[
       tk('d6a','Ingest',   '2026-07-03','2026-07-03','Not Started',0,'Matthew P'),
       tk('d6b','DX Edit',  '2026-07-03','2026-07-09','Not Started',0,'Matthew P'),
       tk('d6c','MX Edit',  '2026-07-09','2026-07-14','Not Started',0,'Matthew P'),
       tk('d6d','SFX Edit', '2026-07-14','2026-07-17','Not Started',0,'Matthew P'),
       tk('d6e','Pre Mix',  '2026-07-17','2026-07-21','Not Started',0,'Matthew P'),
       tk('d6f','Final Mix','2026-07-21','2026-07-23','Not Started',0,'Matthew P'),
       tk('d6g','QC',       '2026-07-28','2026-07-28','Not Started',0,'Kristen S'),
       tk('d6h','Delivery', '2026-08-08','2026-08-09','Not Started',0,'Kristen S'),
     ]},
     {id:'d7',name:'Ep 7',tasks:[
       tk('d7a','Ingest',   '2026-07-10','2026-07-10','Not Started',0,'Matthew P'),
       tk('d7b','DX Edit',  '2026-07-10','2026-07-16','Not Started',0,'Matthew P'),
       tk('d7c','MX Edit',  '2026-07-16','2026-07-22','Not Started',0,'Matthew P'),
       tk('d7d','SFX Edit', '2026-07-22','2026-07-26','Not Started',0,'Matthew P'),
       tk('d7e','Pre Mix',  '2026-07-26','2026-07-29','Not Started',0,'Matthew P'),
       tk('d7f','Final Mix','2026-07-29','2026-07-30','Not Started',0,'Matthew P'),
       tk('d7g','QC',       '2026-08-04','2026-08-04','Not Started',0,'Kristen S'),
       tk('d7h','Delivery', '2026-08-15','2026-08-16','Not Started',0,'Kristen S'),
     ]},
     {id:'d8',name:'Ep 8',tasks:[
       tk('d8a','Ingest',   '2026-07-31','2026-07-31','Not Started',0,'Matthew P'),
       tk('d8b','DX Edit',  '2026-07-31','2026-08-02','Not Started',0,'Matthew P'),
       tk('d8c','MX Edit',  '2026-08-02','2026-08-04','Not Started',0,'Matthew P'),
       tk('d8d','SFX Edit', '2026-08-04','2026-08-05','Not Started',0,'Matthew P'),
       tk('d8e','Pre Mix',  '2026-08-05','2026-08-06','Not Started',0,'Matthew P'),
       tk('d8f','Final Mix','2026-08-06','2026-08-06','Not Started',0,'Matthew P'),
       tk('d8g','QC',       '2026-08-13','2026-08-14','Not Started',0,'Kristen S'),
       tk('d8h','Delivery', '2026-08-22','2026-08-23','Not Started',0,'Kristen S'),
     ]},
   ]},
  {id:'mg4',code:'MS1073',name:'Deadliest Dinners S1',client:'Foxtel',type:'series',
   episodes:[
     {id:'dd1',name:'Ep 1',tasks:[
       tk('dd1a','Ingest',   '2026-06-04','2026-06-04','Not Started',0,'Paul R'),
       tk('dd1b','DX Edit',  '2026-06-04','2026-06-08','Not Started',0,'Paul R'),
       tk('dd1c','MX Edit',  '2026-06-08','2026-06-11','Not Started',0,'Paul R'),
       tk('dd1d','SFX Edit', '2026-06-11','2026-06-14','Not Started',0,'Paul R'),
       tk('dd1e','Pre Mix',  '2026-06-14','2026-06-16','Not Started',0,'Paul R'),
       tk('dd1f','Final Mix','2026-06-16','2026-06-19','Not Started',0,'Paul R'),
       tk('dd1g','QC',       '2026-06-30','2026-06-30','Not Started',0,'Kristen S'),
       tk('dd1h','Delivery', '2026-07-01','2026-07-01','Not Started',0,'Kristen S'),
     ]},
     {id:'dd2',name:'Ep 2',tasks:[
       tk('dd2a','Ingest',   '2026-06-11','2026-06-11','Not Started',0,'Paul R'),
       tk('dd2b','DX Edit',  '2026-06-12','2026-06-15','Not Started',0,'Paul R'),
       tk('dd2c','MX Edit',  '2026-06-15','2026-06-19','Not Started',0,'Paul R'),
       tk('dd2d','SFX Edit', '2026-06-19','2026-06-22','Not Started',0,'Paul R'),
       tk('dd2e','Pre Mix',  '2026-06-22','2026-06-24','Not Started',0,'Paul R'),
       tk('dd2f','Final Mix','2026-06-24','2026-06-27','Not Started',0,'Paul R'),
       tk('dd2g','QC',       '2026-07-07','2026-07-07','Not Started',0,'Kristen S'),
       tk('dd2h','Delivery', '2026-07-08','2026-07-08','Not Started',0,'Kristen S'),
     ]},
     {id:'dd3',name:'Ep 3',tasks:[
       tk('dd3a','Ingest',   '2026-06-16','2026-06-16','Not Started',0,'Paul R'),
       tk('dd3b','DX Edit',  '2026-06-17','2026-06-20','Not Started',0,'Paul R'),
       tk('dd3c','MX Edit',  '2026-06-20','2026-06-24','Not Started',0,'Paul R'),
       tk('dd3d','SFX Edit', '2026-06-24','2026-06-27','Not Started',0,'Paul R'),
       tk('dd3e','Pre Mix',  '2026-06-27','2026-07-01','Not Started',0,'Paul R'),
       tk('dd3f','Final Mix','2026-07-01','2026-07-04','Not Started',0,'Paul R'),
       tk('dd3g','QC',       '2026-07-14','2026-07-14','Not Started',0,'Kristen S'),
       tk('dd3h','Delivery', '2026-07-15','2026-07-15','Not Started',0,'Kristen S'),
     ]},
     {id:'dd4',name:'Ep 4',tasks:[
       tk('dd4a','Ingest',   '2026-07-08','2026-07-08','Not Started',0,'Paul R'),
       tk('dd4b','DX Edit',  '2026-07-08','2026-07-10','Not Started',0,'Paul R'),
       tk('dd4c','MX Edit',  '2026-07-10','2026-07-12','Not Started',0,'Paul R'),
       tk('dd4d','SFX Edit', '2026-07-12','2026-07-13','Not Started',0,'Paul R'),
       tk('dd4e','Pre Mix',  '2026-07-13','2026-07-14','Not Started',0,'Paul R'),
       tk('dd4f','Final Mix','2026-07-14','2026-07-14','Not Started',0,'Paul R'),
       tk('dd4g','QC',       '2026-07-21','2026-07-21','Not Started',0,'Kristen S'),
       tk('dd4h','Delivery', '2026-07-22','2026-07-22','Not Started',0,'Kristen S'),
     ]},
     {id:'dd5',name:'Ep 5',tasks:[
       tk('dd5a','Ingest',   '2026-07-14','2026-07-14','Not Started',0,'Paul R'),
       tk('dd5b','DX Edit',  '2026-07-14','2026-07-15','Not Started',0,'Paul R'),
       tk('dd5c','MX Edit',  '2026-07-15','2026-07-16','Not Started',0,'Paul R'),
       tk('dd5d','SFX Edit', '2026-07-16','2026-07-17','Not Started',0,'Paul R'),
       tk('dd5e','Pre Mix',  '2026-07-17','2026-07-17','Not Started',0,'Paul R'),
       tk('dd5f','Final Mix','2026-07-17','2026-07-18','Not Started',0,'Paul R'),
       tk('dd5g','QC',       '2026-07-28','2026-07-28','Not Started',0,'Kristen S'),
       tk('dd5h','Delivery', '2026-07-29','2026-07-29','Not Started',0,'Kristen S'),
     ]},
     {id:'dd6',name:'Ep 6',tasks:[
       tk('dd6a','Ingest',   '2026-07-21','2026-07-21','Not Started',0,'Paul R'),
       tk('dd6b','DX Edit',  '2026-07-21','2026-07-22','Not Started',0,'Paul R'),
       tk('dd6c','MX Edit',  '2026-07-22','2026-07-23','Not Started',0,'Paul R'),
       tk('dd6d','SFX Edit', '2026-07-23','2026-07-24','Not Started',0,'Paul R'),
       tk('dd6e','Pre Mix',  '2026-07-24','2026-07-24','Not Started',0,'Paul R'),
       tk('dd6f','Final Mix','2026-07-24','2026-07-25','Not Started',0,'Paul R'),
       tk('dd6g','QC',       '2026-08-04','2026-08-04','Not Started',0,'Kristen S'),
       tk('dd6h','Delivery', '2026-08-05','2026-08-05','Not Started',0,'Kristen S'),
     ]},
     {id:'dd7',name:'Ep 7',tasks:[
       tk('dd7a','Ingest',   '2026-07-28','2026-07-28','Not Started',0,'Paul R'),
       tk('dd7b','DX Edit',  '2026-07-28','2026-07-29','Not Started',0,'Paul R'),
       tk('dd7c','MX Edit',  '2026-07-29','2026-07-30','Not Started',0,'Paul R'),
       tk('dd7d','SFX Edit', '2026-07-30','2026-07-31','Not Started',0,'Paul R'),
       tk('dd7e','Pre Mix',  '2026-07-31','2026-08-01','Not Started',0,'Paul R'),
       tk('dd7f','Final Mix','2026-08-01','2026-08-01','Not Started',0,'Paul R'),
       tk('dd7g','QC',       '2026-08-11','2026-08-11','Not Started',0,'Kristen S'),
       tk('dd7h','Delivery', '2026-08-12','2026-08-12','Not Started',0,'Kristen S'),
     ]},
     {id:'dd8',name:'Ep 8',tasks:[
       tk('dd8a','Ingest',   '2026-08-11','2026-08-11','Not Started',0,'Paul R'),
       tk('dd8b','DX Edit',  '2026-08-11','2026-08-12','Not Started',0,'Paul R'),
       tk('dd8c','MX Edit',  '2026-08-12','2026-08-13','Not Started',0,'Paul R'),
       tk('dd8d','SFX Edit', '2026-08-13','2026-08-14','Not Started',0,'Paul R'),
       tk('dd8e','Pre Mix',  '2026-08-14','2026-08-14','Not Started',0,'Paul R'),
       tk('dd8f','Final Mix','2026-08-14','2026-08-15','Not Started',0,'Paul R'),
       tk('dd8g','QC',       '2026-08-20','2026-08-20','Not Started',0,'Kristen S'),
       tk('dd8h','Delivery', '2026-08-21','2026-08-22','Not Started',0,'Kristen S'),
     ]},
   ]},
  {id:'mg5',code:'MS0733',name:'FTLOP S3',client:'Context Media',type:'series',
   episodes:[
     {id:'ft1',name:'Series',tasks:[
       tk('ft1a','Ingest',   '2026-08-24','2026-08-28','Not Started',0,'Paul R'),
       tk('ft1b','DX Edit',  '2026-08-28','2026-09-07','Not Started',0,'Paul R'),
       tk('ft1c','MX Edit',  '2026-09-07','2026-09-14','Not Started',0,'Paul R'),
       tk('ft1d','SFX Edit', '2026-09-14','2026-09-21','Not Started',0,'Paul R'),
       tk('ft1e','Pre Mix',  '2026-09-21','2026-09-28','Not Started',0,'Paul R'),
       tk('ft1f','Final Mix','2026-09-28','2026-10-07','Not Started',0,'Matthew P'),
       tk('ft1g','QC',       '2026-10-07','2026-10-14','Not Started',0,'Kristen S'),
       tk('ft1h','Delivery', '2026-10-21','2026-10-26','Not Started',0,'Kristen S'),
     ]},
   ]},
];

const DEFAULT_ENGINEER_SKILLS=[
  {id:'dialogueEdit', label:'Dialogue Edit', color:'#d32f2f'},
  {id:'musicEdit',    label:'Music Edit',    color:'#1565c0'},
  {id:'sfxEdit',      label:'SFX Edit',      color:'#2e7d32'},
  {id:'backgrounds',  label:'Backgrounds',   color:'#546e7a'},
  {id:'preMix',       label:'Pre Mix',       color:'#bf360c'},
  {id:'finalMix',     label:'Final Mix',     color:'#283593'},
  {id:'revisions',    label:'Revisions',     color:'#6a1b9a'},
  {id:'qcChanges',    label:'QC Changes',    color:'#e65100'},
  {id:'deliverables', label:'Deliverables',  color:'#f9a825'},
];

// ── Initial App Data ───────────────────────────────────────────────────────
const INIT={
  activeBoard:'b1',
  boards:[
    {id:'b1',name:'Active Projects',icon:'mic',color:'#5c6bc0',
     columns:[{id:'c1',name:'Status',type:'status'},{id:'c2',name:'Engineer',type:'person'},{id:'c3',name:'Client',type:'text'},{id:'c4',name:'Due Date',type:'date'},{id:'c5',name:'Budget',type:'currency'},{id:'c6',name:'Hours',type:'number'}],
     groups:[
       {id:'g1',name:'In Progress',color:'#5c6bc0',collapsed:false,items:[
         {id:'i1',name:'TVC Mix — Nike Campaign',notes:'Final stem delivery. -1.0dBTP, -14 LUFS.',startDate:'2026-04-08',timeLogs:[{id:'t1',date:'2026-04-10',mins:180,person:'Paul R',note:'Initial mix'},{id:'t2',date:'2026-04-11',mins:240,person:'Paul R',note:'Stem balancing'}],values:{c1:'In Progress',c2:'Paul R',c3:'Nike ANZ',c4:'2026-04-20',c5:4500,c6:12}},
         {id:'i2',name:'Documentary Mix — Wanderers',notes:'Ep 3 of 5. ADR session Tue 14th.',startDate:'2026-03-24',timeLogs:[{id:'t3',date:'2026-04-07',mins:420,person:'Matthew P',note:'Ep1-2'},{id:'t4',date:'2026-04-09',mins:360,person:'Matthew P',note:'Ep3 grade'}],values:{c1:'Review',c2:'Matthew P',c3:'Wanderers Film Co',c4:'2026-04-18',c5:8200,c6:28}},
       ]},
       {id:'g2',name:'Upcoming',color:'#43a047',collapsed:false,items:[
         {id:'i3',name:'Radio Spots — CommBank',notes:'3x 30sec spots. Talent booked.',startDate:'2026-04-22',timeLogs:[],values:{c1:'Not Started',c2:'Tom B',c3:'CommBank',c4:'2026-04-28',c5:2100,c6:6}},
         {id:'i4',name:'Podcast Series — The Brief',notes:'10 ep. -16 LUFS.',startDate:'2026-04-28',timeLogs:[],values:{c1:'Not Started',c2:'Paul R',c3:'The Brief Podcast',c4:'2026-05-05',c5:3600,c6:20}},
       ]},
       {id:'g3',name:'Completed',color:'#43a047',collapsed:true,items:[
         {id:'i5',name:'Feature Mix — Still Water',notes:'Delivered 4 Apr. Archive to NAS.',startDate:'2026-03-10',timeLogs:[{id:'t5',date:'2026-03-20',mins:480,person:'Matthew P',note:'Full mix'}],values:{c1:'Done',c2:'Matthew P',c3:'Still Water Prods',c4:'2026-04-05',c5:14000,c6:45}},
       ]},
     ]},
    {id:'b3',name:'Engineers',icon:'headphones',color:'#8e24aa',
     columns:[{id:'c1',name:'Status',type:'status'},{id:'c2',name:'Role',type:'text'},{id:'c3',name:'Rate ($/day)',type:'currency'},{id:'c4',name:'Booked From',type:'date'},{id:'c5',name:'Booked To',type:'date'}],
     groups:[
       {id:'g1',name:'Staff',color:'#5c6bc0',collapsed:false,items:[
         {id:'i1',name:'Paul Reeves',notes:'Senior Sound Engineer. paul@mightysound.studio',startDate:'',timeLogs:[],_type:'staff',
          skills:{dialogueEdit:true,musicEdit:true,sfxEdit:true,backgrounds:true,preMix:true,finalMix:true,revisions:true,qcChanges:true,deliverables:true},
          values:{c1:'Available',c2:'Senior Engineer',c3:null,c4:'',c5:''}},
         {id:'i2',name:'Matthew Perrott',notes:'Founder / Lead Mix Engineer. matt@mightysound.studio',startDate:'',timeLogs:[],_type:'staff',
          skills:{dialogueEdit:true,musicEdit:true,sfxEdit:true,backgrounds:true,preMix:true,finalMix:true,revisions:true,qcChanges:true,deliverables:true},
          values:{c1:'Available',c2:'Lead Mix Engineer',c3:null,c4:'',c5:''}},
         {id:'i3',name:'Kristen Settinelli',notes:'QC & Delivery specialist. kristen@mightysound.studio',startDate:'',timeLogs:[],_type:'staff',
          skills:{dialogueEdit:false,musicEdit:false,sfxEdit:false,backgrounds:false,preMix:false,finalMix:false,revisions:true,qcChanges:true,deliverables:true},
          values:{c1:'Available',c2:'QC & Delivery',c3:null,c4:'',c5:''}},
       ]},
       {id:'g2',name:'Freelancers',color:'#8e24aa',collapsed:false,items:[
         {id:'i4',name:'David Chen',notes:'Preferred for Foley. david@chenfoley.com.au',startDate:'',timeLogs:[],_type:'freelancer',
          skills:{dialogueEdit:false,musicEdit:false,sfxEdit:true,backgrounds:true,preMix:false,finalMix:false,revisions:false,qcChanges:false,deliverables:false},
          values:{c1:'Available',c2:'Foley Artist',c3:760,c4:'',c5:''}},
         {id:'i5',name:'Emma Walsh',notes:'Mon–Thu only. ADR supervisor.',startDate:'',timeLogs:[],_type:'freelancer',
          skills:{dialogueEdit:true,musicEdit:false,sfxEdit:false,backgrounds:false,preMix:true,finalMix:true,revisions:true,qcChanges:false,deliverables:false},
          values:{c1:'Available',c2:'ADR Supervisor',c3:880,c4:'',c5:''}},
       ]},
     ]},
    {id:'b4',name:'Budget Tracker',icon:'money',color:'#fb8c00',
     columns:[{id:'c1',name:'Status',type:'status'},{id:'c2',name:'Client',type:'text'},{id:'c3',name:'Quoted',type:'currency'},{id:'c4',name:'Invoiced',type:'currency'},{id:'c5',name:'Paid',type:'currency'},{id:'c6',name:'Due Date',type:'date'}],
     groups:[
       {id:'g1',name:'Outstanding',color:'#fb8c00',collapsed:false,items:[
         {id:'i1',name:'Nike TVC Mix',notes:'Invoice #1042. Net 30.',startDate:'',timeLogs:[],values:{c1:'In Progress',c2:'Nike ANZ',c3:4500,c4:4500,c5:0,c6:'2026-05-15'}},
         {id:'i2',name:'Wanderers Documentary',notes:'Milestone 2 of 3. Balance on delivery.',startDate:'',timeLogs:[],values:{c1:'Review',c2:'Wanderers Film Co',c3:8200,c4:4100,c5:4100,c6:'2026-04-30'}},
       ]},
       {id:'g2',name:'Paid',color:'#43a047',collapsed:false,items:[
         {id:'i3',name:'Still Water Feature Mix',notes:'Paid in full 8 Apr.',startDate:'',timeLogs:[],values:{c1:'Done',c2:'Still Water Prods',c3:14000,c4:14000,c5:14000,c6:'2026-04-10'}},
       ]},
     ]},
  ],
  masterGantt: INIT_MASTER_GANTT,
  longform:{
    activeProduction:'p1',
    productions:[
      {id:'p1',name:'Wanderers — Documentary Series',type:'Documentary (5-Part)',client:'Wanderers Film Co',engineer:'Matthew P',budget:8200,
       episodes:[
         {id:'e1',name:'Ep 1 — The Journey Begins',dueDate:'2026-03-20',status:'Done',stages:{Brief:100,Capture:100,Edit:100,Mix:100,Master:100,QC:100,Deliver:100},tasks:[tk('w1a','Ingest','2026-03-01','2026-03-03','Done',100,'Matthew P'),tk('w1b','DX Edit','2026-03-03','2026-03-06','Done',100,'Matthew P'),tk('w1c','MX Edit','2026-03-06','2026-03-09','Done',100,'Matthew P'),tk('w1d','SFX Edit','2026-03-09','2026-03-12','Done',100,'Matthew P'),tk('w1e','Pre Mix','2026-03-12','2026-03-14','Done',100,'Matthew P'),tk('w1f','Final Mix','2026-03-14','2026-03-17','Done',100,'Matthew P'),tk('w1g','QC','2026-03-17','2026-03-19','Done',100,'Kristen S'),tk('w1h','Delivery','2026-03-19','2026-03-20','Done',100,'Kristen S')]},
         {id:'e2',name:'Ep 2 — Into the Wild',dueDate:'2026-04-05',status:'Review',stages:{Brief:100,Capture:100,Edit:100,Mix:100,Master:80,QC:0,Deliver:0},tasks:[tk('w2a','Ingest','2026-03-15','2026-03-17','Done',100,'Matthew P'),tk('w2b','DX Edit','2026-03-17','2026-03-20','Done',100,'Matthew P'),tk('w2c','MX Edit','2026-03-20','2026-03-23','Done',100,'Matthew P'),tk('w2d','SFX Edit','2026-03-23','2026-03-26','Done',100,'Matthew P'),tk('w2e','Pre Mix','2026-03-26','2026-03-28','Done',100,'Matthew P'),tk('w2f','Final Mix','2026-03-28','2026-04-01','Done',100,'Matthew P'),tk('w2g','QC','2026-04-01','2026-04-04','In Progress',40,'Kristen S'),tk('w2h','Delivery','2026-04-04','2026-04-05','Not Started',0,'Kristen S')]},
         {id:'e3',name:'Ep 3 — The Summit',dueDate:'2026-04-18',status:'In Progress',stages:{Brief:100,Capture:100,Edit:65,Mix:0,Master:0,QC:0,Deliver:0},tasks:[tk('w3a','Ingest','2026-03-28','2026-03-30','Done',100,'Matthew P'),tk('w3b','DX Edit','2026-03-30','2026-04-02','Done',100,'Matthew P'),tk('w3c','MX Edit','2026-04-02','2026-04-07','In Progress',65,'Matthew P'),tk('w3d','SFX Edit','2026-04-07','2026-04-10','Not Started',0,'Matthew P'),tk('w3e','Pre Mix','2026-04-10','2026-04-12','Not Started',0,'Matthew P'),tk('w3f','Final Mix','2026-04-12','2026-04-15','Not Started',0,'Matthew P'),tk('w3g','QC','2026-04-15','2026-04-17','Not Started',0,'Kristen S'),tk('w3h','Delivery','2026-04-17','2026-04-18','Not Started',0,'Kristen S')]},
         {id:'e4',name:'Ep 4 — Coming Home',dueDate:'2026-05-02',status:'In Progress',stages:{Brief:100,Capture:45,Edit:0,Mix:0,Master:0,QC:0,Deliver:0},tasks:[tk('w4a','Ingest','2026-04-08','2026-04-12','In Progress',45,'Matthew P'),tk('w4b','DX Edit','2026-04-12','2026-04-16','Not Started',0,'Matthew P'),tk('w4c','MX Edit','2026-04-16','2026-04-20','Not Started',0,'Matthew P'),tk('w4d','SFX Edit','2026-04-20','2026-04-23','Not Started',0,'Tom B'),tk('w4e','Pre Mix','2026-04-23','2026-04-25','Not Started',0,'Matthew P'),tk('w4f','Final Mix','2026-04-25','2026-04-29','Not Started',0,'Matthew P'),tk('w4g','QC','2026-04-29','2026-05-01','Not Started',0,'Kristen S'),tk('w4h','Delivery','2026-05-01','2026-05-02','Not Started',0,'Kristen S')]},
         {id:'e5',name:'Ep 5 — Legacy',dueDate:'2026-05-16',status:'Not Started',stages:{Brief:80,Capture:0,Edit:0,Mix:0,Master:0,QC:0,Deliver:0},tasks:[tk('w5a','Ingest','2026-04-18','2026-04-21','Not Started',0,'Matthew P'),tk('w5b','DX Edit','2026-04-21','2026-04-25','Not Started',0,'Matthew P'),tk('w5c','MX Edit','2026-04-25','2026-04-29','Not Started',0,'Matthew P'),tk('w5d','SFX Edit','2026-04-29','2026-05-03','Not Started',0,'Tom B'),tk('w5e','Pre Mix','2026-05-03','2026-05-05','Not Started',0,'Matthew P'),tk('w5f','Final Mix','2026-05-05','2026-05-09','Not Started',0,'Matthew P'),tk('w5g','QC','2026-05-09','2026-05-12','Not Started',0,'Kristen S'),tk('w5h','Delivery','2026-05-12','2026-05-16','Not Started',0,'Kristen S')]},
       ]},
      {id:'p2',name:'The Brief — Podcast Series',type:'Podcast (10-Part)',client:'The Brief Podcast',engineer:'Paul R',budget:3600,
       episodes:[
         {id:'b1',name:'Ep 01 — The State of Play',dueDate:'2026-05-01',status:'Review',stages:{Brief:100,Capture:100,Edit:100,Mix:100,Master:100,QC:20,Deliver:0},tasks:[tk('b1a','Ingest','2026-04-18','2026-04-19','Done',100,'Paul R'),tk('b1b','DX Edit','2026-04-19','2026-04-21','Done',100,'Paul R'),tk('b1c','MX Edit','2026-04-21','2026-04-22','Done',100,'Paul R'),tk('b1d','SFX Edit','2026-04-22','2026-04-23','Done',100,'Paul R'),tk('b1e','Pre Mix','2026-04-23','2026-04-24','Done',100,'Paul R'),tk('b1f','Final Mix','2026-04-24','2026-04-27','Done',100,'Paul R'),tk('b1g','QC','2026-04-27','2026-04-30','In Progress',20,'Kristen S'),tk('b1h','Delivery','2026-04-30','2026-05-01','Not Started',0,'Kristen S')]},
         {id:'b2',name:'Ep 02 — Follow the Money',dueDate:'2026-05-08',status:'In Progress',stages:{Brief:100,Capture:90,Edit:40,Mix:0,Master:0,QC:0,Deliver:0},tasks:[tk('b2a','Ingest','2026-04-24','2026-04-25','Done',100,'Paul R'),tk('b2b','DX Edit','2026-04-25','2026-04-28','In Progress',40,'Paul R'),tk('b2c','MX Edit','2026-04-28','2026-04-30','Not Started',0,'Paul R'),tk('b2d','SFX Edit','2026-04-30','2026-05-01','Not Started',0,'Paul R'),tk('b2e','Pre Mix','2026-05-01','2026-05-02','Not Started',0,'Paul R'),tk('b2f','Final Mix','2026-05-02','2026-05-05','Not Started',0,'Paul R'),tk('b2g','QC','2026-05-05','2026-05-07','Not Started',0,'Kristen S'),tk('b2h','Delivery','2026-05-07','2026-05-08','Not Started',0,'Kristen S')]},
       ]},
    ]
  }
};

// ── Simple Components ──────────────────────────────────────────────────────
function SBadge({v,t='status',onClick}){return<span className="sbadge" style={sStyle(v,t)} onClick={onClick}>{v||'— set'}</span>}
function SPop({t,cur,onSel,onClose}){const ref=useRef();useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose()};setTimeout(()=>document.addEventListener('mousedown',h),0);return()=>document.removeEventListener('mousedown',h)},[]);return<div className="pop" ref={ref}>{sOpts(t).map(o=><div key={o.l} className="pop-item" onClick={()=>{onSel(o.l);onClose()}}><span className="pop-dot" style={{background:o.c}}/>{o.l}{o.l===cur&&<span style={{marginLeft:'auto',fontSize:10,color:'#bbb'}}>✓</span>}</div>)}</div>}
function PPop({cur,onSel,onClose}){const ref=useRef();useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose()};setTimeout(()=>document.addEventListener('mousedown',h),0);return()=>document.removeEventListener('mousedown',h)},[]);return<div className="pop" ref={ref}><div className="pop-item" style={{color:'#bbb'}} onClick={()=>{onSel('');onClose()}}>— unassign</div>{PEOPLE.map(p=><div key={p} className="pop-item" onClick={()=>{onSel(p);onClose()}}><span className="pav" style={{background:pColor(p),width:20,height:20,fontSize:8}}>{inits(p)}</span>{p}{p===cur&&<span style={{marginLeft:'auto',fontSize:10,color:'#bbb'}}>✓</span>}</div>)}</div>}

function Cell({col,value,onChange}){
  const [ed,setEd]=useState(false);const [ev,setEv]=useState('');const [pop,setPop]=useState(false);
  const start=()=>{setEv(value??'');setEd(true)};const commit=()=>{setEd(false);onChange(ev)};
  if(col.type==='status'||col.type==='priority')return<div style={{position:'relative'}}><SBadge v={value} t={col.type} onClick={e=>{e.stopPropagation();setPop(!pop)}}/>{pop&&<div style={{position:'absolute',top:'100%',left:0,zIndex:200}}><SPop t={col.type} cur={value} onSel={onChange} onClose={()=>setPop(false)}/></div>}</div>;
  if(col.type==='person')return<div style={{position:'relative'}}>{value?<span className="pchip" onClick={e=>{e.stopPropagation();setPop(!pop)}}><span className="pav" style={{background:pColor(value),width:22,height:22}}>{inits(value)}</span><span>{value}</span></span>:<span className="muted tcell" onClick={e=>{e.stopPropagation();setPop(!pop)}}>+ assign</span>}{pop&&<div style={{position:'absolute',top:'100%',left:0,zIndex:200}}><PPop cur={value} onSel={onChange} onClose={()=>setPop(false)}/></div>}</div>;
  if(col.type==='date'){if(ed)return<input type="date" className="ii" style={{width:118}} value={ev} onChange={e=>setEv(e.target.value)} onBlur={commit} autoFocus/>;return<span className="dcell" onClick={start}>{fmtD(value)||<span className="muted">Set date</span>}</span>;}
  if(col.type==='currency'){if(ed)return<input className="ii" style={{width:84}} value={ev} onChange={e=>setEv(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==='Enter'&&commit()} autoFocus/>;return<span className="ncell" onClick={start}>{fmtCur(value)||<span className="muted">$0</span>}</span>;}
  if(col.type==='number'){if(ed)return<input className="ii" style={{width:66}} value={ev} onChange={e=>setEv(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==='Enter'&&commit()} autoFocus/>;return<span className="ncell" onClick={start}>{value!==''&&value!=null?value:<span className="muted">0</span>}</span>;}
  if(ed)return<input className="ii" value={ev} onChange={e=>setEv(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==='Enter'&&commit()} autoFocus/>;
  return<span className="tcell" onClick={start}>{value||<span className="muted">—</span>}</span>;
}

// ── TableView ──────────────────────────────────────────────────────────────
function TableView({board,onUpdate,onSelect,onEditItem}){
  const [addingG,setAddingG]=useState(false);const [newG,setNewG]=useState('');const [showC,setShowC]=useState(false);const [edName,setEdName]=useState(null);
  const toggle=gid=>onUpdate(p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,collapsed:!g.collapsed}:g)}));
  const updCell=(gid,iid,cid,v)=>onUpdate(p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,items:g.items.map(i=>i.id===iid?{...i,values:{...i.values,[cid]:v}}:i)}:g)}));
  const updName=(gid,iid,name)=>onUpdate(p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,items:g.items.map(i=>i.id===iid?{...i,name}:i)}:g)}));
  const addItem=gid=>{const it={id:uid(),name:'New item',notes:'',startDate:'',timeLogs:[],values:{}};onUpdate(p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,items:[...g.items,it]}:g)}))};
  const addGroup=()=>{if(!newG.trim())return;const g={id:uid(),name:newG,color:GCOLS[board.groups.length%GCOLS.length],collapsed:false,items:[]};onUpdate(p=>({...p,groups:[...p.groups,g]}));setNewG('');setAddingG(false)};
  const addCol=(name,type)=>{const c={id:uid(),name,type};onUpdate(p=>({...p,columns:[...p.columns,c]}));setShowC(false)};
  const totals=useMemo(()=>{const t={};board.columns.forEach(c=>{if(c.type==='number'||c.type==='currency'){let s=0;board.groups.forEach(g=>g.items.forEach(i=>{const v=parseFloat(i.values[c.id]);if(!isNaN(v))s+=v}));t[c.id]={s,t:c.type,n:c.name}}});return t},[board]);
  return(<div>
    {board.groups.map(g=>(<div key={g.id} className="group-block">
      <div className="group-header" onClick={()=>toggle(g.id)}>
        <span className="g-chev" style={{transform:g.collapsed?'rotate(0)':'rotate(90deg)'}}>▶</span>
        <span className="g-dot" style={{background:g.color}}/><span className="g-name">{g.name}</span><span className="g-cnt">{g.items.length} item{g.items.length!==1?'s':''}</span>
      </div>
      {!g.collapsed&&(<div className="tbl-wrap">
        <div className="tbl-head"><div className="th th-name">Item</div>{board.columns.map(c=><div key={c.id} className="th th-col">{c.name}</div>)}<div className="th-add" onClick={()=>setShowC(true)}>+ Add column</div></div>
        {g.items.map(item=>(<div key={item.id} className="tbl-row">
          <div className="td-name">{edName===item.id?<input className="ni" value={item.name} autoFocus onChange={e=>updName(g.id,item.id,e.target.value)} onBlur={()=>setEdName(null)} onKeyDown={e=>e.key==='Enter'&&setEdName(null)} onClick={e=>e.stopPropagation()}/>:
            <><span className="td-nm-txt" onDoubleClick={e=>{e.stopPropagation();setEdName(item.id)}} onClick={()=>onSelect(board.id,g.id,item.id)}>{item.name}</span>
            {item.notes&&<span style={{fontSize:9,color:'#ccc'}}><Icon name="note" size={9}/></span>}
            {item.timeLogs&&item.timeLogs.length>0&&<span style={{fontSize:9,color:'#ccc'}}><Icon name="timer" size={13}/></span>}
            {onEditItem&&<button onClick={e=>{e.stopPropagation();onEditItem(item,g.name)}} style={{marginLeft:6,background:'none',border:'1px solid #ddd',borderRadius:4,padding:'1px 7px',fontSize:10,fontWeight:700,color:'#888',cursor:'pointer',flexShrink:0}} title="Edit">✏️ Edit</button>}
            </>}
          </div>
          {board.columns.map(c=><div key={c.id} className="td-col"><Cell col={c} value={item.values[c.id]} onChange={v=>updCell(g.id,item.id,c.id,v)}/></div>)}
        </div>))}
        <div className="add-row"><div className="add-row-btn" onClick={()=>addItem(g.id)}>+ Add item</div></div>
        {Object.keys(totals).length>0&&<div className="sum-row">{Object.values(totals).map(t=><div key={t.n}>{t.n}: <b>{t.t==='currency'?fmtCur(t.s):t.s}</b></div>)}</div>}
      </div>)}
    </div>))}
    {addingG?<div style={{display:'flex',gap:7,alignItems:'center',marginTop:8}}>
      <input className="ni" style={{maxWidth:200}} placeholder="Group name..." value={newG} onChange={e=>setNewG(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==='Enter')addGroup();if(e.key==='Escape')setAddingG(false)}}/>
      <button className="btn-p" onClick={addGroup} style={{padding:'5px 12px',fontSize:12}}>Add</button>
      <button className="btn-g" onClick={()=>setAddingG(false)} style={{padding:'5px 10px',fontSize:12}}>Cancel</button>
    </div>:<span style={{fontSize:13,color:'#bbb',cursor:'pointer',display:'block',marginTop:10,fontWeight:600}} onClick={()=>setAddingG(true)}>+ Add group</span>}
    {showC&&<AddColModal onAdd={addCol} onClose={()=>setShowC(false)}/>}
  </div>);
}

// ── KanbanView ─────────────────────────────────────────────────────────────
function KanbanView({board,onSelect}){
  const sc=board.columns.find(c=>c.type==='status');if(!sc)return<div className="empty"><h3>No status column</h3></div>;
  const pc=board.columns.find(c=>c.type==='person');const dc=board.columns.find(c=>c.type==='date');
  const lanes=ST.map(o=>({...o,items:board.groups.flatMap(g=>g.items.filter(i=>i.values[sc.id]===o.l).map(i=>({...i,gid:g.id})))})).filter(l=>l.items.length>0||['Not Started','In Progress','Review','Done'].includes(l.l));
  return(<div className="kb">{lanes.map(lane=>(<div key={lane.l} className="kb-col">
    <div className="kb-col-h"><span style={{width:9,height:9,borderRadius:'50%',background:lane.c,display:'inline-block'}}/><span className="kb-ct">{lane.l}</span><span className="kb-cnt">{lane.items.length}</span></div>
    {lane.items.map(item=>(<div key={item.id} className="kb-card" onClick={()=>onSelect(board.id,item.gid,item.id)}>
      <div className="kb-ctitle">{item.name}</div>
      <div className="kb-meta">
        {pc&&item.values[pc.id]&&<span className="pav" style={{background:pColor(item.values[pc.id]),width:22,height:22,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',color:'#fff',fontWeight:700,fontSize:9}}>{inits(item.values[pc.id])}</span>}
        {dc&&item.values[dc.id]&&<span className="kb-date">{fmtD(item.values[dc.id])}</span>}
      </div>
    </div>))}
    {lane.items.length===0&&<div className="kb-empty">Empty</div>}
  </div>))}</div>);
}

// ── GCal Month View (extracted — can't use IIFE in Babel JSX) ─────────────
const DAYS_SHORT_CAL=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function GcalMonthView({anchor,allEvents,eventsForDate,handleDayClick,handleEventClick,setCalView,setAnchor,dateStr,isToday_}){
  const year=anchor.getFullYear(),month=anchor.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++){const d=new Date(year,month,0-i+(firstDay>0?1:0));cells.push({date:new Date(year,month-1,daysInMonth-(firstDay-1-i)),other:true})}
  for(let d=1;d<=daysInMonth;d++)cells.push({date:new Date(year,month,d),other:false});
  let extra=1;while(cells.length<42)cells.push({date:new Date(year,month+1,extra++),other:true});
  return(
    <div className="gc-month">
      <div className="gc-month-head">
        {DAYS_SHORT_CAL.map(d=><div key={d} className="gc-month-dh">{d}</div>)}
      </div>
      <div className="gc-month-grid" style={{gridTemplateRows:'repeat(6,1fr)'}}>
        {cells.map((cell,i)=>{
          const dStr=dateStr(cell.date);
          const events=eventsForDate(dStr);
          const isToday=isToday_(cell.date);
          return(
            <div key={i} className={`gc-month-cell${isToday?' today':''}${cell.other?' other':''}`}
              onClick={e=>handleDayClick(e,dStr)}>
              <div className={`gc-day-num${isToday?' today-circle':''}`}>{cell.date.getDate()}</div>
              {events.slice(0,3).map(ev=>(
                <div key={ev.id} className="gc-event-chip"
                  style={{background:ev.color,color:ev.textColor||'#fff',opacity:cell.other?0.6:1}}
                  onClick={e=>handleEventClick(e,ev)} title={ev.title}>
                  {ev.title}
                </div>
              ))}
              {events.length>3&&<div className="gc-more-link" onClick={e=>{e.stopPropagation();setCalView('day');setAnchor(new Date(cell.date))}}>{events.length-3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Google Calendar API Hook ───────────────────────────────────────────────
const GCAL_CLIENT_ID='375953047409-g264eo7tghcg1g82s6f8khfg8p5f0jh4.apps.googleusercontent.com';
const GCAL_SCOPES='https://www.googleapis.com/auth/calendar';

function useGoogleCalendar(){
  const [token,setToken]=useState(()=>{
    // Restore token from localStorage so it survives navigation
    try{return localStorage.getItem('gcal_token')||null;}catch{return null;}
  });
  const [gcalEvents,setGcalEvents]=useState([]);
  const [syncStatus,setSyncStatus]=useState('idle');// idle|syncing|ok|error
  const [lastSync,setLastSync]=useState(null);
  const [calendars,setCalendars]=useState([]);// list of user's calendars
  const [selectedCals,setSelectedCals]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('gcal_selected')||'null')||null;}catch{return null;}
  });
  const pollRef=useRef(null);

  // Use Firebase popup to get Google access token with calendar scope
  const connect=()=>{
    // Use Google Identity Services token client for reliable scope-specific tokens
    if(!window.google?.accounts?.oauth2){
      console.warn('GIS not loaded yet');
      setSyncStatus('error');
      return;
    }
    const client=window.google.accounts.oauth2.initTokenClient({
      client_id:GCAL_CLIENT_ID,
      scope:'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets',
      callback:(resp)=>{
        if(resp.error){console.warn('GCal token error:',resp.error);setSyncStatus('error');return;}
        try{localStorage.setItem('gcal_token',resp.access_token);}catch{}
        setToken(resp.access_token);
      },
    });
    client.requestAccessToken();
  };

  const disconnect=()=>{setToken(null);setGcalEvents([]);setCalendars([]);setSelectedCals(null);setSyncStatus('idle');clearInterval(pollRef.current);try{localStorage.removeItem('gcal_token');localStorage.removeItem('gcal_selected');}catch{}};

  const fetchCalendarList=useCallback(async(t=token)=>{
    if(!t)return;
    try{
      const resp=await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',{
        headers:{Authorization:`Bearer ${t}`}
      });
      if(!resp.ok)return;
      const data=await resp.json();
      const cals=(data.items||[]).map(c=>({id:c.id,name:c.summary,color:c.backgroundColor||'#4285f4',primary:c.primary||false}));
      setCalendars(cals);
      // Auto-select all on first load
      if(!selectedCals){
        const ids=cals.map(c=>c.id);
        setSelectedCals(ids);
        try{localStorage.setItem('gcal_selected',JSON.stringify(ids));}catch{}
      }
    }catch(e){console.warn('Calendar list failed:',e.message)}
  },[token,selectedCals]);

  const toggleCalendar=(id)=>{
    setSelectedCals(prev=>{
      const next=prev?.includes(id)?prev.filter(x=>x!==id):[...(prev||[]),id];
      try{localStorage.setItem('gcal_selected',JSON.stringify(next));}catch{}
      return next;
    });
  };

  const fetchEvents=useCallback(async(t=token,cals=selectedCals)=>{
    if(!t)return;
    setSyncStatus('syncing');
    try{
      const now=new Date();
      const min=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString();
      const max=new Date(now.getFullYear(),now.getMonth()+3,1).toISOString();
      const calIds=cals||['primary'];
      const allEvents=[];
      await Promise.all(calIds.map(async calId=>{
        const resp=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=250`,{
          headers:{Authorization:`Bearer ${t}`}
        });
        if(resp.status===401){setToken(null);try{localStorage.removeItem('gcal_token');}catch{}setSyncStatus('error');return;}
        if(!resp.ok)return;
        const data=await resp.json();
        // Tag each event with its source calendar ID
        allEvents.push(...(data.items||[]).map(ev=>({...ev,_calendarId:calId})));
      }));
      setGcalEvents(allEvents);
      setSyncStatus('ok');setLastSync(new Date());
    }catch(e){setSyncStatus('error');console.warn('GCal fetch failed:',e.message)}
  },[token,selectedCals]);

  useEffect(()=>{
    if(token){
      fetchCalendarList(token);
      fetchEvents(token);
      pollRef.current=setInterval(()=>fetchEvents(token),60000);
    }
    return()=>clearInterval(pollRef.current);
  },[token]);

  const createEvent=useCallback(async(event)=>{
    if(!token)return null;
    try{
      const resp=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',{
        method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify(event)
      });
      if(!resp.ok)throw new Error('Create failed');
      const created=await resp.json();
      setGcalEvents(p=>[...p,created]);
      return created;
    }catch(e){console.warn('GCal create failed:',e.message);return null}
  },[token]);

  const deleteEvent=useCallback(async(eventId)=>{
    if(!token)return;
    try{
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,{
        method:'DELETE',headers:{Authorization:`Bearer ${token}`}
      });
      setGcalEvents(p=>p.filter(e=>e.id!==eventId));
    }catch(e){console.warn('GCal delete failed:',e.message)}
  },[token]);

  return{token,connected:!!token,gcalEvents,syncStatus,lastSync,calendars,selectedCals,toggleCalendar,connect,disconnect,fetchEvents,createEvent,deleteEvent};
}

// ── WorkBoard Calendar (Google Calendar style) ─────────────────────────────
function WorkboardCalendar({ganttData,boards,account}){
  const [calView,setCalView]=useState('week');// month|week|day
  const [anchor,setAnchor]=useState(new Date());// the "current" date
  const [createModal,setCreateModal]=useState(null);// {x,y,date,hour}
  const [detailEvent,setDetailEvent]=useState(null);// {x,y,event}
  const [showCalList,setShowCalList]=useState(true);
  const gcal=useGoogleCalendar();
  const scrollRef=useRef();
  const todayD=today();

  // Scroll to 8am on mount / view change
  useEffect(()=>{
    if((calView==='week'||calView==='day')&&scrollRef.current){
      scrollRef.current.scrollTop=8*48-24;
    }
  },[calView]);

  // Current time line position
  const [nowMinutes,setNowMinutes]=useState(()=>{const n=new Date();return n.getHours()*60+n.getMinutes()});
  useEffect(()=>{const t=setInterval(()=>{const n=new Date();setNowMinutes(n.getHours()*60+n.getMinutes())},60000);return()=>clearInterval(t)},[]);

  // Collect all WorkBoard events from Gantt
  const wbEvents=useMemo(()=>{
    const events=[];
    ganttData.forEach(proj=>{
      proj.episodes.forEach(ep=>{
        ep.tasks.forEach(task=>{
          if(task.startDate&&task.endDate){
            const td=TASK_DEFS.find(t=>t.name===task.name)||{color:'#5c6bc0',text:'#fff'};
            events.push({
              id:`wb_${task.id}`,
              title:`${proj.code} ${ep.name} — ${task.name}`,
              start:task.startDate,end:task.endDate,
              color:td.color,textColor:td.text,
              assignee:task.assignee,status:task.status,
              _type:'workboard',_proj:proj.name,_ep:ep.name,_task:task.name,
            });
          }
        });
      });
    });
    return events;
  },[ganttData]);

  // Google Calendar events formatted for display
  const gcEvents=useMemo(()=>gcal.gcalEvents.map(e=>{
    // Look up this event's calendar colour
    const cal=gcal.calendars.find(c=>c.id===e._calendarId);
    const color=cal?.color||'#1a73e8';
    return{
      id:e.id,
      title:e.summary||'(No title)',
      start:e.start?.date||e.start?.dateTime?.split('T')[0],
      end:e.end?.date||e.end?.dateTime?.split('T')[0],
      startTime:e.start?.dateTime?new Date(e.start.dateTime):null,
      endTime:e.end?.dateTime?new Date(e.end.dateTime):null,
      color,textColor:'#fff',
      _type:'gcal',_gcalId:e.id,_allDay:!e.start?.dateTime,_calendarId:e._calendarId,
    };
  }),[gcal.gcalEvents,gcal.calendars]);

  const allEvents=[...wbEvents,...gcEvents];

  // Sync WB Gantt tasks to Google Calendar
  const syncGanttToGcal=async()=>{
    if(!gcal.connected){gcal.connect();return}
    let count=0;
    for(const ev of wbEvents.slice(0,20)){// limit to 20 to avoid rate limits
      await gcal.createEvent({
        summary:ev.title,
        start:{date:ev.start},end:{date:ev.end},
        description:`Assignee: ${ev.assignee||'TBC'} | Status: ${ev.status}`,
        colorId:'1',
      });
      count++;
    }
    alert(`Pushed ${count} tasks to Google Calendar`);
  };

  // Navigation
  const DAYS_SHORT=DAYS_SHORT_CAL;
  const MONTHS_LONG=['January','February','March','April','May','June','July','August','September','October','November','December'];

  const getWeekStart=d=>{const dt=new Date(d);dt.setDate(dt.getDate()-dt.getDay());return dt};
  const weekStart=getWeekStart(anchor);
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d});
  const hours=Array.from({length:24},(_,i)=>i);

  const navPrev=()=>{const d=new Date(anchor);if(calView==='month')d.setMonth(d.getMonth()-1);else if(calView==='week')d.setDate(d.getDate()-7);else d.setDate(d.getDate()-1);setAnchor(d)};
  const navNext=()=>{const d=new Date(anchor);if(calView==='month')d.setMonth(d.getMonth()+1);else if(calView==='week')d.setDate(d.getDate()+7);else d.setDate(d.getDate()+1);setAnchor(d)};
  const goToday=()=>setAnchor(new Date());

  const titleStr=calView==='month'?`${MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`
    :calView==='week'?`${weekDays[0].toLocaleDateString('en-AU',{day:'numeric',month:'short'})} – ${weekDays[6].toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}`
    :anchor.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const dateStr=d=>d.toISOString().split('T')[0];
  const isToday_=d=>dateStr(d)===todayD;

  // Get events for a given date string
  const eventsForDate=dStr=>allEvents.filter(e=>e.start<=dStr&&(e.end>=dStr||e.start===dStr));

  // Position timed events in week/day view
  const positionEvent=(ev,dStr)=>{
    const top=(ev.startTime?(ev.startTime.getHours()*60+ev.startTime.getMinutes()):8*60)/60*48;
    const bottom=(ev.endTime?(ev.endTime.getHours()*60+ev.endTime.getMinutes()):top/48*60+60)/60*48;
    return{top,height:Math.max(bottom-top,24)};
  };

  const handleDayClick=(e,dStr,hour=null)=>{
    if(createModal){setCreateModal(null);return}
    const rect=e.currentTarget.getBoundingClientRect();
    setCreateModal({x:Math.min(rect.left,window.innerWidth-320),y:Math.min(e.clientY,window.innerHeight-280),date:dStr,hour});
  };

  const handleEventClick=(e,event)=>{
    e.stopPropagation();
    const rect=e.currentTarget.getBoundingClientRect();
    setDetailEvent({x:Math.min(rect.right+8,window.innerWidth-340),y:Math.min(rect.top,window.innerHeight-280),event});
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',position:'relative'}} onClick={()=>{setCreateModal(null);setDetailEvent(null)}}>
      {/* Sync banner */}
      {gcal.connected&&(
        <div className="gc-sync-panel">
          <div className="gc-sync-dot" style={{background:gcal.syncStatus==='ok'?'#34a853':gcal.syncStatus==='syncing'?'#fbbc04':'#ea4335'}}/>
          <span style={{fontWeight:600,color:'#1e8e3e'}}>
            {gcal.syncStatus==='ok'?`Synced with Google Calendar · ${gcal.gcalEvents.length} events · ${gcal.lastSync?.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}`:gcal.syncStatus==='syncing'?'Syncing…':'Sync error'}
          </span>
          <button onClick={e=>{e.stopPropagation();gcal.fetchEvents()}} style={{background:'none',border:'1px solid #34a853',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:700,color:'#34a853',cursor:'pointer',marginLeft:6}}>↻ Refresh</button>
          <button onClick={e=>{e.stopPropagation();syncGanttToGcal()}} style={{background:'none',border:'1px solid #1a73e8',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:700,color:'#1a73e8',cursor:'pointer'}}>⬆ Push Gantt to GCal</button>
          <button onClick={e=>{e.stopPropagation();gcal.disconnect()}} style={{marginLeft:'auto',background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:11,fontWeight:600}}>Disconnect</button>
        </div>
      )}

      {/* Calendar list — collapsible */}
      {gcal.connected&&gcal.calendars.length>0&&(
        <div style={{background:'#f8f9fa',borderBottom:'1px solid #e5e5e5'}}>
          <div onClick={e=>{e.stopPropagation();setShowCalList(p=>!p)}}
            style={{display:'flex',alignItems:'center',gap:6,padding:'5px 14px',cursor:'pointer',userSelect:'none'}}>
            <span style={{fontSize:9,color:'#999',transform:showCalList?'rotate(90deg)':'rotate(0)',display:'inline-block',transition:'transform .15s'}}>▶</span>
            <span style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'.07em'}}>
              Calendars ({gcal.selectedCals?.length||0}/{gcal.calendars.length})
            </span>
          </div>
          {showCalList&&(
            <div style={{padding:'0 14px 8px',display:'flex',gap:6,flexWrap:'wrap'}}>
              {gcal.calendars.map(cal=>(
                <div key={cal.id} onClick={e=>{e.stopPropagation();gcal.toggleCalendar(cal.id);setTimeout(()=>gcal.fetchEvents(),100);}}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:12,cursor:'pointer',fontSize:11,fontWeight:600,
                    background:gcal.selectedCals?.includes(cal.id)?cal.color+'22':'#f0f0f0',
                    color:gcal.selectedCals?.includes(cal.id)?cal.color:'#aaa',
                    border:`1px solid ${gcal.selectedCals?.includes(cal.id)?cal.color+'44':'#ddd'}`,
                    transition:'all .13s',opacity:gcal.selectedCals?.includes(cal.id)?1:.6}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:gcal.selectedCals?.includes(cal.id)?cal.color:'#ccc',display:'inline-block',flexShrink:0}}/>
                  {cal.name}{cal.primary&&<span style={{fontSize:9,opacity:.6}}> (primary)</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="gc-wrap" style={{flex:1,minHeight:0}}>
        {/* Toolbar */}
        <div className="gc-toolbar" onClick={e=>e.stopPropagation()}>
          <button className="gc-today-btn" onClick={goToday}>Today</button>
          <button className="gc-nav-arrow" onClick={navPrev}>‹</button>
          <button className="gc-nav-arrow" onClick={navNext}>›</button>
          <span className="gc-title">{titleStr}</span>
          <button className={`gc-sync-btn${gcal.connected?' connected':''}`}
            onClick={e=>{e.stopPropagation();gcal.connected?gcal.fetchEvents():gcal.connect()}}>
            <span>{gcal.connected?<><Icon name="dot_green" size={14}/></>:'calendar'}</span>
            <span>{gcal.connected?'Google Calendar':'Connect Google'}</span>
          </button>
          <div className="gc-view-toggle">
            {['day','week','month'].map(v=><button key={v} className={`gc-view-btn${calView===v?' active':''}`} onClick={()=>setCalView(v)} style={{textTransform:'capitalize'}}>{v}</button>)}
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        {calView==='month'&&<GcalMonthView anchor={anchor} allEvents={allEvents} eventsForDate={eventsForDate} handleDayClick={handleDayClick} handleEventClick={handleEventClick} setCalView={setCalView} setAnchor={setAnchor} dateStr={dateStr} isToday_={isToday_}/>}

        {/* ── WEEK VIEW ── */}
        {calView==='week'&&(
          <div className="gc-week">
            <div className="gc-week-head">
              <div className="gc-week-time-gutter"/>
              {weekDays.map((d,i)=>(
                <div key={i} className="gc-week-day-col" onClick={()=>{setCalView('day');setAnchor(d)}}>
                  <div className="gc-week-dn">{DAYS_SHORT[d.getDay()]}</div>
                  <div className={`gc-week-dd${isToday_(d)?' today':''}`}>{d.getDate()}</div>
                </div>
              ))}
            </div>
            <div className="gc-week-body" ref={scrollRef}>
              <div className="gc-week-times">
                {hours.map(h=><div key={h} className="gc-hour-label">{h===0?'':h<12?`${h} AM`:h===12?'12 PM':`${h-12} PM`}</div>)}
              </div>
              <div className="gc-week-grid">
                {weekDays.map((d,di)=>{
                  const dStr=dateStr(d);
                  const isToday=isToday_(d);
                  const dayEvents=allEvents.filter(e=>e.start===dStr&&!e._allDay);
                  return(
                    <div key={di} className="gc-day-col" onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();const clickY=e.clientY-rect.top;const hour=Math.floor(clickY/48);handleDayClick(e,dStr,hour)}}>
                      {hours.map(h=><div key={h} className="gc-hour-row"/>)}
                      {isToday&&<div className="gc-now-line" style={{top:nowMinutes/60*48}}><div className="gc-now-dot"/></div>}
                      {dayEvents.map(ev=>{
                        const {top,height}=positionEvent(ev,dStr);
                        return(
                          <div key={ev.id} className="gc-week-event" style={{top,height,background:ev.color,color:ev.textColor||'#fff'}}
                            onClick={e=>handleEventClick(e,ev)}>
                            <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:11}}>{ev.title}</div>
                            {height>32&&ev.assignee&&<div style={{fontSize:10,opacity:.8}}>{ev.assignee}</div>}
                          </div>
                        );
                      })}
                      {/* All-day events */}
                      {allEvents.filter(e=>e.start<=dStr&&e.end>=dStr&&(e._allDay||!e.startTime)).map(ev=>(
                        <div key={'ad_'+ev.id} className="gc-week-event" style={{top:4,height:20,background:ev.color+'dd',color:ev.textColor||'#fff',fontSize:10,padding:'2px 4px'}}
                          onClick={e=>handleEventClick(e,ev)}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {calView==='day'&&(
          <div className="gc-day">
            <div className="gc-day-head">
              <div className="gc-day-head-date">{DAYS_SHORT[anchor.getDay()]}</div>
              <div className={`gc-day-head-num${isToday_(anchor)?' today':''}`}>{anchor.getDate()}</div>
            </div>
            <div style={{flex:1,overflow:'hidden',display:'flex',minHeight:0}} ref={scrollRef}>
              <div className="gc-week-times">
                {hours.map(h=><div key={h} className="gc-hour-label">{h===0?'':h<12?`${h} AM`:h===12?'12 PM':`${h-12} PM`}</div>)}
              </div>
              <div style={{flex:1,position:'relative',cursor:'pointer'}} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();const clickY=e.clientY-rect.top+scrollRef.current.scrollTop;const hour=Math.floor(clickY/48);handleDayClick(e,dateStr(anchor),hour)}}>
                {hours.map(h=><div key={h} className="gc-hour-row" style={{borderLeft:'1px solid #e0e0e0'}}/>)}
                {isToday_(anchor)&&<div className="gc-now-line" style={{top:nowMinutes/60*48}}><div className="gc-now-dot"/></div>}
                {allEvents.filter(e=>e.start===dateStr(anchor)&&!e._allDay&&e.startTime).map(ev=>{
                  const {top,height}=positionEvent(ev,dateStr(anchor));
                  return(
                    <div key={ev.id} className="gc-week-event" style={{top,height,background:ev.color,color:ev.textColor||'#fff',left:8,right:8}}
                      onClick={e=>handleEventClick(e,ev)}>
                      <div style={{fontWeight:600,fontSize:12}}>{ev.title}</div>
                      {height>28&&ev.startTime&&<div style={{fontSize:10,opacity:.8}}>{ev.startTime.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}–{ev.endTime?.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}</div>}
                      {height>44&&ev.assignee&&<div style={{fontSize:10,opacity:.8}}>{ev.assignee}</div>}
                    </div>
                  );
                })}
                {allEvents.filter(e=>e.start<=dateStr(anchor)&&e.end>=dateStr(anchor)&&(e._allDay||!e.startTime)).map(ev=>(
                  <div key={'ad_'+ev.id} className="gc-week-event" style={{top:4,height:22,background:ev.color+'dd',color:ev.textColor||'#fff',fontSize:11,left:8,right:8}}
                    onClick={e=>handleEventClick(e,ev)}>{ev.title}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE EVENT MODAL ── */}
      {createModal&&(
        <div className="gc-create-modal" style={{left:createModal.x,top:createModal.y}} onClick={e=>e.stopPropagation()}>
          <CreateEventModal
            date={createModal.date} hour={createModal.hour}
            gcalConnected={gcal.connected}
            onSave={async(ev)=>{
              if(gcal.connected){
                const startDT=createModal.hour!=null?new Date(createModal.date+'T'+String(createModal.hour).padStart(2,'0')+':00:00'):null;
                const endDT=startDT?new Date(startDT.getTime()+3600000):null;
                await gcal.createEvent({
                  summary:ev.title,
                  description:ev.notes||'',
                  start:startDT?{dateTime:startDT.toISOString()}:{date:createModal.date},
                  end:endDT?{dateTime:endDT.toISOString()}:{date:addDays(createModal.date,1)},
                  colorId:'1',
                });
              }
              setCreateModal(null);
            }}
            onClose={()=>setCreateModal(null)}
          />
        </div>
      )}

      {/* ── EVENT DETAIL POPUP ── */}
      {detailEvent&&(
        <div className="gc-event-detail" style={{left:detailEvent.x,top:detailEvent.y}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setDetailEvent(null)} style={{float:'right',background:'none',border:'none',fontSize:18,color:'#aaa',cursor:'pointer',lineHeight:1}}>×</button>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:12,height:12,borderRadius:3,background:detailEvent.event.color,flexShrink:0}}/>
            <div style={{fontSize:14,fontWeight:700,color:'#111',flex:1,paddingRight:20}}>{detailEvent.event.title}</div>
          </div>
          <div style={{fontSize:12,color:'#555',marginBottom:4}}>
            <Icon name="calendar" size={12}/> {detailEvent.event.start}{detailEvent.event.start!==detailEvent.event.end?` → ${detailEvent.event.end}`:''}
          </div>
          {detailEvent.event.assignee&&<div style={{fontSize:12,color:'#555',marginBottom:4,display:'flex',alignItems:'center',gap:4}}><Icon name="person" size={12}/> {detailEvent.event.assignee}</div>}
          {detailEvent.event.status&&<div style={{fontSize:12,color:'#555',marginBottom:4,display:'flex',alignItems:'center',gap:4}}><Icon name="lightning" size={12}/> {detailEvent.event.status}</div>}
          {detailEvent.event._type==='gcal'&&(
            <button onClick={()=>{gcal.deleteEvent(detailEvent.event._gcalId);setDetailEvent(null)}}
              style={{marginTop:8,background:'#fff5f5',border:'1px solid #fcc',borderRadius:5,padding:'4px 10px',color:'#c62828',fontSize:11,fontWeight:700,cursor:'pointer'}}>
              Delete from Google Calendar
            </button>
          )}
          {detailEvent.event._type==='workboard'&&gcal.connected&&(
            <button onClick={async()=>{
              await gcal.createEvent({summary:detailEvent.event.title,start:{date:detailEvent.event.start},end:{date:detailEvent.event.end},colorId:'1'});
              setDetailEvent(null);
            }}
              style={{marginTop:8,background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:5,padding:'4px 10px',color:'#2e7d32',fontSize:11,fontWeight:700,cursor:'pointer'}}>
              <Icon name="calendar" size={12}/> Add to Google Calendar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Event Modal ─────────────────────────────────────────────────────
function CreateEventModal({date,hour,gcalConnected,onSave,onClose}){
  const [title,setTitle]=useState('');
  const [notes,setNotes]=useState('');
  const fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
  const hrFmt=h=>h==null?'All day':h<12?`${h}:00 AM`:h===12?'12:00 PM':`${h-12}:00 PM`;
  return(
    <div>
      <input autoFocus style={{width:'100%',border:'none',borderBottom:'2px solid #1a73e8',outline:'none',fontSize:16,fontWeight:400,color:'#111',padding:'4px 0 6px',marginBottom:12,fontFamily:'Barlow,sans-serif'}}
        placeholder="Event title" value={title} onChange={e=>setTitle(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'&&title.trim())onSave({title,notes});if(e.key==='Escape')onClose()}}/>
      <div style={{fontSize:12,color:'#70757a',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><Icon name="calendar" size={12}/> {fmt(date)} · {hrFmt(hour)}</div>
      <textarea style={{width:'100%',border:'1px solid #e0e0e0',borderRadius:6,padding:'7px 9px',fontSize:12,resize:'none',height:54,outline:'none',fontFamily:'Barlow,sans-serif',color:'#333'}}
        placeholder="Add notes..." value={notes} onChange={e=>setNotes(e.target.value)}/>
      <div style={{display:'flex',gap:6,marginTop:10,justifyContent:'flex-end'}}>
        <button onClick={onClose} style={{background:'none',border:'1px solid #ddd',borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#555'}}>Cancel</button>
        <button onClick={()=>title.trim()&&onSave({title,notes})}
          style={{background:'#1a73e8',border:'none',borderRadius:6,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer',color:'#fff',opacity:title.trim()?1:.4}}>
          {gcalConnected?'Save to Google Calendar':'Create'}
        </button>
      </div>
    </div>
  );
}

// ── Old CalendarView (for board calendar tab — kept simple) ─────────────────
function CalendarView({board,onSelect}){
  const now=new Date();const [yr,setYr]=useState(now.getFullYear());const [mo,setMo]=useState(now.getMonth());
  const dcol=board.columns.find(c=>c.type==='date');const todayStr=today();
  const allItems=useMemo(()=>board.groups.flatMap(g=>g.items.map(i=>({...i,gid:g.id}))).filter(i=>{if(!dcol)return false;const d=i.values[dcol.id];if(!d)return false;const dt=new Date(d+'T00:00:00');return dt.getFullYear()===yr&&dt.getMonth()===mo}),[board,yr,mo,dcol]);
  const itemsByDay=useMemo(()=>{const m={};allItems.forEach(i=>{const d=new Date(i.values[dcol.id]+'T00:00:00').getDate();if(!m[d])m[d]=[];m[d].push(i)});return m},[allItems]);
  const firstDay=new Date(yr,mo,1).getDay();const daysInMonth=new Date(yr,mo+1,0).getDate();const daysInPrev=new Date(yr,mo,0).getDate();
  const cells=[];for(let i=firstDay-1;i>=0;i--)cells.push({day:daysInPrev-i,other:true});for(let d=1;d<=daysInMonth;d++)cells.push({day:d,other:false});const rem=42-cells.length;for(let d=1;d<=rem;d++)cells.push({day:d,other:true});
  const prevMo=()=>{if(mo===0){setYr(y=>y-1);setMo(11)}else setMo(m=>m-1)};const nextMo=()=>{if(mo===11){setYr(y=>y+1);setMo(0)}else setMo(m=>m+1)};
  const isToday=(d,other)=>{if(other)return false;return new Date(yr,mo,d).toISOString().split('T')[0]===todayStr};
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  if(!dcol)return<div className="empty"><h3>No date column</h3></div>;
  return(<div>
    <div className="cal-nav">
      <button className="cal-nav-btn" onClick={prevMo}>‹</button>
      <span className="cal-month">{fmtM(`${yr}-${String(mo+1).padStart(2,'0')}-01`)}</span>
      <button className="cal-nav-btn" onClick={nextMo}>›</button>
    </div>
    <div className="cal-grid">
      {DAYS.map(d=><div key={d} className="cal-day-hdr">{d}</div>)}
      {cells.map((cell,i)=>{const items=(!cell.other&&itemsByDay[cell.day])||[];const tod=isToday(cell.day,cell.other);return(
        <div key={i} className={`cal-cell${tod?' today':''}${cell.other?' other-month':''}`}>
          <div className={`cal-date${tod?' today-num':''}`}>{cell.day}</div>
          {items.slice(0,3).map(item=>{const st=item.values[board.columns.find(c=>c.type==='status')?.id];const c2=st?sStyle(st).color:'#5c6bc0';return<span key={item.id} className="cal-chip" style={{background:c2+'18',color:c2,border:`1px solid ${c2}30`}} onClick={()=>onSelect(board.id,item.gid,item.id)} title={item.name}>{item.name}</span>;})}
          {items.length>3&&<div className="cal-more">+{items.length-3} more</div>}
        </div>
      );})}
    </div>
  </div>);
}

// ── Board GanttView ────────────────────────────────────────────────────────
function GanttView({board,onSelect}){
  const dcol=board.columns.find(c=>c.type==='date');const [offsetW,setOffsetW]=useState(0);
  const WEEKS=12;const PX_WEEK=110;const todayD=today();
  const startDate=useMemo(()=>addDays(todayD,-14+offsetW*7),[offsetW,todayD]);
  const totalPx=WEEKS*PX_WEEK;const dToX=d=>daysBetween(startDate,d)*(PX_WEEK/7);const todayX=dToX(todayD);
  const weeksArr=useMemo(()=>Array.from({length:WEEKS},(_,i)=>{const d=addDays(startDate,i*7);const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-AU',{day:'numeric',month:'short'})}),[startDate]);
  const allItems=board.groups.flatMap(g=>g.items.map(i=>({...i,gid:g.id,gname:g.name,gcolor:g.color})));
  const withDates=allItems.filter(i=>dcol&&i.values[dcol.id]);
  const grouped=board.groups.map(g=>({...g,items:withDates.filter(i=>i.gid===g.id)})).filter(g=>g.items.length>0);
  const getBar=i=>{const ed=dcol&&i.values[dcol.id];if(!ed)return null;const sd=i.startDate||addDays(ed,-7);const x1=Math.max(0,dToX(sd));const x2=Math.min(totalPx,dToX(ed));const w=x2-x1;if(w<=0)return null;const st=i.values[board.columns.find(c=>c.type==='status')?.id];const c2=st?sStyle(st).color:'#5c6bc0';return{x:x1,w,c:c2}};
  if(!dcol)return<div className="empty"><h3>No date column</h3></div>;
  if(withDates.length===0)return<div className="empty"><h3>No items with dates</h3></div>;
  return(<div>
    <div className="gantt-nav" style={{display:'flex',gap:8,marginBottom:14}}>
      <button className="mg-nav-btn" onClick={()=>setOffsetW(o=>o-2)}>‹ Earlier</button>
      <span style={{fontSize:13,color:'#666',fontWeight:600}}>{weeksArr[0]} — {weeksArr[WEEKS-1]}</span>
      <button className="mg-nav-btn" onClick={()=>setOffsetW(o=>o+2)}>Later ›</button>
      <button className="mg-nav-btn" onClick={()=>setOffsetW(0)} style={{fontSize:11}}>Today</button>
    </div>
    <div className="gantt-wrap" style={{overflowX:'auto'}}><div style={{minWidth:210+totalPx}}>
      <div className="gantt-head"><div className="gantt-label-col">Item</div><div style={{display:'flex',minWidth:totalPx}}>{weeksArr.map((w,i)=><div key={i} className="gantt-week" style={{flex:`0 0 ${PX_WEEK}px`}}>{w}</div>)}</div></div>
      {grouped.map(g=>(<div key={g.id}>
        <div className="gantt-grp-hdr"><div className="gantt-grp-label" style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:7,height:7,borderRadius:'50%',background:g.color,display:'inline-block'}}/>{g.name}</div><div style={{flex:1,background:'#f8f8f8',minWidth:totalPx}}/></div>
        {g.items.map(item=>{const bar=getBar(item);return(<div key={item.id} className="gantt-row">
          <div className="gantt-row-label" onClick={()=>onSelect(board.id,item.gid,item.id)}>{item.name}</div>
          <div className="gantt-timeline" style={{minWidth:totalPx}}>
            {todayX>=0&&todayX<=totalPx&&<div className="gantt-today-line" style={{left:todayX}}/>}
            {bar&&<div className="gantt-bar" style={{left:bar.x,width:bar.w,background:bar.c+'22',border:`1px solid ${bar.c}55`,color:bar.c}} onClick={()=>onSelect(board.id,item.gid,item.id)}>{bar.w>60?item.name:''}</div>}
          </div>
        </div>);})}
      </div>))}
    </div></div>
  </div>);
}

// ── MASTER GANTT VIEW CONFIG (outside component so it's stable) ───────────
const VIEW_CFG={
  days:  {units:28,pxPer:42, step:1, navStep:7,
          labelFn:d=>{const dt=new Date(d+'T00:00:00');const dow=dt.getDay();return{top:['Su','Mo','Tu','We','Th','Fr','Sa'][dow],bot:dt.getDate(),isWeekend:dow===0||dow===6}}},
  weeks: {units:16,pxPer:72, step:7, navStep:28,
          labelFn:d=>{const dt=new Date(d+'T00:00:00');return{top:dt.toLocaleDateString('en-AU',{month:'short'}),bot:dt.toLocaleDateString('en-AU',{day:'numeric',month:'short'}),isWeekend:false}}},
  months:{units:12,pxPer:110,step:28,navStep:84,
          labelFn:d=>{const dt=new Date(d+'T00:00:00');return{top:dt.toLocaleDateString('en-AU',{month:'short'}),bot:dt.getFullYear(),isWeekend:false}}},
};

// ── DATE PICKER POPUP ─────────────────────────────────────────────────────
function DatePickerPopup({anchorRef,onSelect,onClose}){
  const ref=useRef();
  const now=new Date();
  const [yr,setYr]=useState(now.getFullYear());
  const [mo,setMo]=useState(now.getMonth());
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&anchorRef.current&&!anchorRef.current.contains(e.target))onClose()};
    setTimeout(()=>document.addEventListener('mousedown',h),0);
    return()=>document.removeEventListener('mousedown',h);
  },[]);
  const firstDay=new Date(yr,mo,1).getDay();
  const daysInMonth=new Date(yr,mo+1,0).getDate();
  const daysInPrev=new Date(yr,mo,0).getDate();
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:daysInPrev-i,other:true});
  for(let d=1;d<=daysInMonth;d++)cells.push({day:d,other:false});
  while(cells.length<42)cells.push({day:cells.length-firstDay-daysInMonth+1,other:true});
  const DAYS=['Su','Mo','Tu','We','Th','Fr','Sa'];
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const todayStr=today();
  const prevMo=()=>{if(mo===0){setYr(y=>y-1);setMo(11)}else setMo(m=>m-1)};
  const nextMo=()=>{if(mo===11){setYr(y=>y+1);setMo(0)}else setMo(m=>m+1)};
  const selectDay=(d,other)=>{
    if(other)return;
    const dateStr=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onSelect(dateStr);onClose();
  };
  return(
    <div ref={ref} style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:400,background:'#fff',border:'1px solid #ddd',borderRadius:10,boxShadow:'0 8px 28px rgba(0,0,0,.14)',padding:12,width:240,userSelect:'none'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <button onClick={prevMo} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,color:'#555',padding:'2px 6px'}}>‹</button>
        <span style={{fontSize:13,fontWeight:800,color:'#111'}}>{MONTHS[mo]} {yr}</span>
        <button onClick={nextMo} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,color:'#555',padding:'2px 6px'}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
        {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:9,fontWeight:700,color:'#bbb',padding:'2px 0',letterSpacing:'.04em',textTransform:'uppercase'}}>{d}</div>)}
        {cells.map((cell,i)=>{
          const dateStr=`${yr}-${String(mo+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
          const isToday=!cell.other&&dateStr===todayStr;
          const dow=new Date(dateStr+'T00:00:00').getDay();
          const isWeekend=dow===0||dow===6;
          return(
            <div key={i} onClick={()=>selectDay(cell.day,cell.other)}
              style={{textAlign:'center',padding:'4px 0',fontSize:12,fontWeight:isToday?800:500,
                borderRadius:4,cursor:cell.other?'default':'pointer',
                color:cell.other?'#ddd':isToday?'#fff':isWeekend?'#e53935':'#333',
                background:isToday?'#111':'transparent',
                transition:'background .1s'}}
              onMouseEnter={e=>{if(!cell.other&&!isToday)e.currentTarget.style.background='#f5f5f5'}}
              onMouseLeave={e=>{if(!cell.other&&!isToday)e.currentTarget.style.background='transparent'}}
            >{cell.day}</div>
          );
        })}
      </div>
      <div style={{borderTop:'1px solid #f0f0f0',marginTop:8,paddingTop:8,display:'flex',gap:5}}>
        <button onClick={()=>{onSelect(todayStr);onClose()}} style={{flex:1,background:'#111',border:'none',borderRadius:5,padding:'5px 0',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:'.04em',textTransform:'uppercase'}}>Today</button>
        <button onClick={onClose} style={{flex:1,background:'transparent',border:'1px solid #ddd',borderRadius:5,padding:'5px 0',color:'#666',fontSize:11,fontWeight:600,cursor:'pointer'}}>Cancel</button>
      </div>
    </div>
  );
}

// ── GOOGLE SHEETS SYNC ────────────────────────────────────────────────────
// Replace GSHEETS_CLIENT_ID with your Google Cloud OAuth 2.0 Client ID
const GSHEETS_CLIENT_ID='375953047409-g264eo7tghcg1g82s6f8khfg8p5f0jh4.apps.googleusercontent.com';
const GSHEETS_SCOPES='https://www.googleapis.com/auth/spreadsheets';

function useGoogleSheets(ganttData,onUpdateGantt){
  const [connected,setConnected]=useState(false);
  const [sheetId,setSheetId]=useState('');
  const [syncStatus,setSyncStatus]=useState('idle'); // idle | syncing | error | ok
  const [lastSync,setLastSync]=useState(null);
  const [accessToken,setAccessToken]=useState(null);
  const pollRef=useRef(null);

  // Use Firebase popup to get Google Sheets access token
  const connectGoogle=async()=>{
    try{
      const provider=new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.setCustomParameters({prompt:'consent'});
      const result=await signInWithPopup(auth,provider);
      const credential=GoogleAuthProvider.credentialFromResult(result);
      if(credential?.accessToken){
        setAccessToken(credential.accessToken);
        setConnected(true);
      }
    }catch(e){
      console.warn('Sheets connect failed:',e.message);
    }
  };

  // Parse MASTER sheet rows → gantt projects
  // Format: Col A=Event, Col B=Engineer, Col C=Start Date, Col D=End Date, Col E=Days
  // Section headers: all-caps row with no dates → new project group
  // Episode rows: MS code in name + valid dates → episode with date range
  // Task rows: known task names (DX, MX, BGX, SFX, Pre Mix, Final Mix, QC, Deliverables)
  const parseSheetToGantt=(rows,sheetTitle)=>{
    if(!rows||rows.length<2)return null;
    const TASK_MAP=[
      {keys:['ingest','rough cut','rushes'],       std:'Ingest'},
      {keys:['dx edit','dx ','dialogue'],           std:'DX Edit'},
      {keys:['mx edit','mx ','music edit'],         std:'MX Edit'},
      {keys:['bgx','sfx','sfx edit','bkgd'],        std:'SFX Edit'},
      {keys:['pre mix','pre-mix','premix'],          std:'Pre Mix'},
      {keys:['final mix','final-mix','mix ','dub'],  std:'Final Mix'},
      {keys:['qc','quality','review'],               std:'QC'},
      {keys:['deliver','deliverable'],               std:'Delivery'},
    ];
    const matchTask=name=>{const n=name.toLowerCase();return TASK_MAP.find(t=>t.keys.some(k=>n.includes(k)))?.std||null};
    const isDate=v=>v&&(v instanceof Date||String(v).match(/^\d{4}-\d{2}-\d{2}$/));
    const toDate=v=>{if(!v)return null;if(v instanceof Date)return v.toISOString().split('T')[0];const s=String(v).trim();if(s.match(/^\d{4}-\d{2}-\d{2}$/))return s;return null};
    const isError=v=>!v||String(v).match(/^#(REF|N\/A|VALUE|DIV)/);

    const projects=[];
    let curProj=null;
    let curEp=null;

    rows.forEach((row,ri)=>{
      if(ri<4)return; // skip header rows
      const a=row[0]?String(row[0]).trim():'';
      const b=row[1];
      const startD=toDate(row[2]);
      const endD=toDate(row[3]);
      if(!a)return;

      // Section header: all-caps, no valid dates → new project
      const isHeader=a===a.toUpperCase()&&a.length>3&&!startD&&!a.match(/^MS\d/);
      // MS code row with valid dates → episode/summary
      const isMSRow=a.match(/^[\s]*MS\d+/)&&isDate(row[2])&&!isError(row[2]);
      // Task row: known task name
      const taskType=matchTask(a);

      if(isHeader&&!isMSRow){
        // New project section
        const code=a.match(/MS\d+/)?.[0]||null;
        if(code&&projects.find(p=>p.code===code)){
          curProj=projects.find(p=>p.code===code);
        } else {
          curProj={
            id:uid(),
            code:code||'MS'+Math.floor(Math.random()*9000+1000),
            name:a.replace(/MS\d+\s*/,'').trim().replace(/\s+-\s+.*$/,'').trim()||a,
            client:'Live Sheet',type:'series',sheetId,episodes:[]
          };
          projects.push(curProj);
        }
        curEp=null;
        return;
      }

      if(isMSRow&&curProj){
        // Episode summary row — extract ep number if present
        const epMatch=a.match(/ep(?:isode)?\s*(\d+)/i);
        const epName=epMatch?`Ep ${epMatch[1].padStart(2,'0')}`:(curProj.episodes.length===0?'Film':'Ep '+(curProj.episodes.length+1));
        curEp={id:uid(),name:epName,tasks:[]};
        // If no engineer ref error, extract it
        if(b&&!isError(b)&&typeof b==='string')curEp.engineer=b;
        curProj.episodes.push(curEp);
        // Add a placeholder Ingest from this summary row's dates if no tasks yet
        if(startD){
          curEp._startDate=startD;
          curEp._endDate=endD||addDays(startD,14);
        }
        return;
      }

      if(taskType&&curEp){
        // Task row — dates come from col C/D when read from Sheets API
        const sd=(!isError(row[2])&&isDate(row[2]))?toDate(row[2]):(curEp._startDate||today());
        const ed=(!isError(row[3])&&isDate(row[3]))?toDate(row[3]):addDays(sd,3);
        const eng=(!isError(b)&&b&&typeof b==='string')?b:(curEp.engineer||'Paul R');
        curEp.tasks.push(tk(uid(),taskType,sd,ed,'Not Started',0,eng));
        return;
      }

      // Standalone MS row without a current project
      if(isMSRow&&!curProj){
        const code=a.match(/MS\d+/)?.[0]||'MS'+Math.floor(Math.random()*9000+1000);
        const name=a.replace(/MS\d+\s*/,'').split('-')[0].trim();
        curProj={id:uid(),code,name,client:'Live Sheet',type:'film',sheetId,episodes:[]};
        projects.push(curProj);
        curEp={id:uid(),name:'Film',tasks:[]};
        if(startD){curEp._startDate=startD;curEp._endDate=endD||addDays(startD,14)}
        curProj.episodes.push(curEp);
      }
    });

    // Fill any episodes with no tasks with defaults based on date range
    projects.forEach(proj=>proj.episodes.forEach(ep=>{
      if(ep.tasks.length===0&&ep._startDate){
        const totalDays=daysBetween(ep._startDate,ep._endDate||addDays(ep._startDate,14));
        const step=Math.max(1,Math.floor(totalDays/8));
        ep.tasks=TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(ep._startDate,i*step),addDays(ep._startDate,(i+1)*step),'Not Started',0,'Paul R'));
      }
      delete ep._startDate;delete ep._endDate;delete ep.engineer;
    }));

    return projects.length>0?{
      id:uid(),code:'MASTER',name:sheetTitle||'Live Schedule',
      client:'Google Sheets',type:'master',sheetId,
      _isMulti:true,_projects:projects
    }:null;
  };

  // Write gantt status changes back to sheet
  const writeBack=async(rowIndex,statusValue)=>{
    if(!accessToken||!sheetId)return;
    try{
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!E${rowIndex+2}?valueInputOption=RAW`,{
        method:'PUT',
        headers:{'Authorization':`Bearer ${accessToken}`,'Content-Type':'application/json'},
        body:JSON.stringify({values:[[statusValue]]})
      });
    }catch(e){console.warn('Write back failed:',e)}
  };

  // Poll sheet for changes every 30s
  const pollSheet=useCallback(async()=>{
    if(!accessToken||!sheetId)return;
    setSyncStatus('syncing');
    try{
      // Read MASTER sheet (main gantt data)
      const range='MASTER!A:E';
      const resp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,{
        headers:{'Authorization':`Bearer ${accessToken}`}
      });
      if(!resp.ok)throw new Error('Sheet fetch failed: '+resp.status);
      const data=await resp.json();
      const rows=data.values||[];
      // Get sheet title
      const metaResp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`,{
        headers:{'Authorization':`Bearer ${accessToken}`}
      });
      const meta=await metaResp.json();
      const title=meta.properties?.title||'Live Schedule';
      const result=parseSheetToGantt(rows,title);
      if(result&&result._isMulti){
        // Multi-project MASTER sheet — merge each project into ganttData
        onUpdateGantt(prev=>{
          let next=[...prev];
          result._projects.forEach(proj=>{
            const existing=next.findIndex(p=>p.code===proj.code&&p.sheetId===sheetId);
            if(existing>=0){next[existing]={...proj,id:next[existing].id}}
            else next.push(proj);
          });
          return next;
        });
      } else if(result){
        onUpdateGantt(prev=>{
          const existing=prev.findIndex(p=>p.sheetId===sheetId);
          if(existing>=0){const next=[...prev];next[existing]={...result,id:prev[existing].id};return next}
          return[...prev,result];
        });
      }
      setSyncStatus('ok');setLastSync(new Date());
    }catch(e){setSyncStatus('error');console.warn('Poll failed:',e.message)}
  },[accessToken,sheetId,onUpdateGantt]);

  useEffect(()=>{
    if(connected&&sheetId&&accessToken){
      pollSheet();
      pollRef.current=setInterval(pollSheet,30000);
    }
    return()=>clearInterval(pollRef.current);
  },[connected,sheetId,accessToken]);

  return{connected,sheetId,setSheetId,syncStatus,lastSync,connectGoogle,pollSheet,writeBack};
}

// ── MASTER GANTT SCHEDULER ────────────────────────────────────────────────
function MasterGantt({ganttData,onUpdateGantt,onShowConflicts}){
  const [collapsed,setCollapsed]=useState({});
  const [epCollapsed,setEpCollapsed]=useState({});
  const [viewMode,setViewMode]=useState('days');
  const [showImport,setShowImport]=useState(false);
  const [showDatePicker,setShowDatePicker]=useState(false);
  const [showSheetsPanel,setShowSheetsPanel]=useState(false);
  const datePickerBtnRef=useRef();
  const scrollRef=useRef();       // the scrollable container
  const headerScrollRef=useRef(); // synced header scroll
  const todayD=today();
  const cfg=useMemo(()=>VIEW_CFG[viewMode],[viewMode]);
  const LBL_W=220;

  // Google Sheets hook
  const sheets=useGoogleSheets(ganttData,onUpdateGantt);

  // ── Continuous timeline — render 18 months centred on today ──────────────
  const TOTAL_DAYS=540; // 18 months
  const ORIGIN=useMemo(()=>{
    // Start of timeline = today minus 60 days
    const dt=new Date(todayD+'T00:00:00');
    dt.setDate(dt.getDate()-60);
    if(viewMode==='days'){dt.setDate(dt.getDate()-dt.getDay())} // snap to week
    return dt.toISOString().split('T')[0];
  },[todayD,viewMode]);

  const totalUnits=useMemo(()=>Math.ceil(TOTAL_DAYS/cfg.step),[cfg]);
  const totalPx=totalUnits*cfg.pxPer;
  const todayPx=useMemo(()=>daysBetween(ORIGIN,todayD)*(cfg.pxPer/cfg.step),[ORIGIN,todayD,cfg]);

  const colsArr=useMemo(()=>Array.from({length:totalUnits},(_,i)=>{
    const d=addDays(ORIGIN,i*cfg.step);
    return{date:d,...cfg.labelFn(d)};
  }),[ORIGIN,cfg,totalUnits]);

  const weekendCols=useMemo(()=>{
    if(viewMode!=='days')return[];
    return colsArr.filter(c=>c.isWeekend).map((c,i)=>({key:i,left:daysBetween(ORIGIN,c.date)*cfg.pxPer}));
  },[colsArr,ORIGIN,cfg,viewMode]);

  const dToX=useCallback(d=>{
    const days=daysBetween(ORIGIN,d);
    return Math.max(0,days*(cfg.pxPer/cfg.step));
  },[ORIGIN,cfg]);

  // Scroll to today on mount or view change
  useEffect(()=>{
    if(scrollRef.current){
      const target=todayPx-300; // show 300px of past on left
      scrollRef.current.scrollLeft=Math.max(0,target);
    }
  },[todayPx,viewMode]);

  // Sync header scroll (horizontal) and label column (vertical) with body scroll
  const labelScrollRef=useRef();
  const onScroll=e=>{
    if(headerScrollRef.current)headerScrollRef.current.scrollLeft=e.target.scrollLeft;
    if(labelScrollRef.current)labelScrollRef.current.scrollTop=e.target.scrollTop;
  };

  // ── Month label row — show month names above day columns ─────────────────
  const monthGroups=useMemo(()=>{
    if(viewMode!=='days')return[];
    const groups=[];let cur=null;
    colsArr.forEach((c,i)=>{
      const dt=new Date(c.date+'T00:00:00');
      const label=dt.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
      if(label!==cur){groups.push({label,startIdx:i});cur=label}
    });
    return groups.map((g,i)=>{
      const endIdx=i<groups.length-1?groups[i+1].startIdx:colsArr.length;
      return{...g,width:(endIdx-g.startIdx)*cfg.pxPer,left:g.startIdx*cfg.pxPer};
    });
  },[colsArr,cfg,viewMode]);

  // Conflict detection
  const conflicts=useMemo(()=>{
    const tasks=[];
    ganttData.forEach(proj=>proj.episodes.forEach(ep=>ep.tasks.forEach(t=>{
      if(t.assignee&&t.status!=='Done'&&t.startDate&&t.endDate)tasks.push({...t,projName:proj.name});
    })));
    const conf=[];
    for(let i=0;i<tasks.length;i++)for(let j=i+1;j<tasks.length;j++){
      const a=tasks[i],b=tasks[j];
      if(a.assignee===b.assignee&&a.startDate<=b.endDate&&b.startDate<=a.endDate)
        conf.push(`${a.projName}: ${a.name} overlaps with ${b.projName}: ${b.name} (${a.assignee})`);
    }
    return conf;
  },[ganttData]);

  const toggleProj=id=>setCollapsed(p=>({...p,[id]:!p[id]}));
  const toggleEp=id=>setEpCollapsed(p=>({...p,[id]:!p[id]}));

  const getBarStyle=task=>{
    const x1=dToX(task.startDate);const x2=dToX(task.endDate);
    const w=Math.max(x2-x1,cfg.pxPer*0.4);
    if(w<=0)return null;
    const td=taskDef(task.name);
    return{left:x1,width:w,td};
  };

  const getEpSpan=ep=>{
    const ts=ep.tasks;if(!ts.length)return null;
    const s=ts.reduce((m,t)=>t.startDate<m?t.startDate:m,ts[0].startDate);
    const e=ts.reduce((m,t)=>t.endDate>m?t.endDate:m,ts[0].endDate);
    return{left:dToX(s),width:Math.max(dToX(e)-dToX(s),4)};
  };

  const scrollToToday=()=>{
    if(scrollRef.current)scrollRef.current.scrollTo({left:Math.max(0,todayPx-300),behavior:'smooth'});
  };
  const scrollByWeeks=n=>{
    if(scrollRef.current)scrollRef.current.scrollBy({left:n*cfg.pxPer*(viewMode==='days'?7:1),behavior:'smooth'});
  };

  return(
    <div className="mg-wrap">
      {/* Conflict banner */}
      {conflicts.length>0&&(
        <div className="mg-conflict-banner">
          <Icon name="warning" size={14}/>
          <span style={{flex:1}}>{conflicts.length} engineer conflict{conflicts.length!==1?'s':''} detected</span>
          <button className="resolve-btn" onClick={onShowConflicts}><Icon name="lightning" size={12}/> View & Fix</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mg-toolbar">
        {/* View toggle */}
        <div style={{display:'flex',gap:0,border:'1px solid #ddd',borderRadius:7,overflow:'hidden',flexShrink:0}}>
          {['days','weeks','months'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)}
              style={{padding:'5px 12px',border:'none',borderRight:m!=='months'?'1px solid #ddd':'none',cursor:'pointer',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',background:viewMode===m?'#111':'#fff',color:viewMode===m?'#fff':'#666',transition:'all .13s'}}>
              {m}
            </button>
          ))}
        </div>
        <button className="mg-nav-btn" onClick={()=>scrollByWeeks(-1)}>‹</button>
        {/* Date picker */}
        <div style={{position:'relative'}}>
          <button ref={datePickerBtnRef} className="mg-nav-btn"
            onClick={()=>setShowDatePicker(p=>!p)}
            style={{display:'flex',alignItems:'center',gap:6,fontWeight:600,background:showDatePicker?'#111':'#fff',color:showDatePicker?'#fff':'#555'}}>
            <Icon name="calendar" size={12}/> Jump to date
          </button>
          {showDatePicker&&<DatePickerPopup anchorRef={datePickerBtnRef}
            onSelect={d=>{
              if(scrollRef.current)scrollRef.current.scrollTo({left:Math.max(0,dToX(d)-300),behavior:'smooth'});
              setShowDatePicker(false);
            }}
            onClose={()=>setShowDatePicker(false)}/>}
        </div>
        <button className="mg-nav-btn" onClick={()=>scrollByWeeks(1)}>›</button>
        <button className="mg-nav-btn" onClick={scrollToToday} style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.03em'}}>Today</button>

        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {/* Google Sheets sync status */}
          {sheets.connected&&(
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:600,color:sheets.syncStatus==='ok'?'#2e7d32':sheets.syncStatus==='error'?'#c62828':'#888'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:sheets.syncStatus==='ok'?'#43a047':sheets.syncStatus==='syncing'?'#fb8c00':'#c62828',display:'inline-block'}}/>
              {sheets.syncStatus==='ok'?`Synced ${sheets.lastSync?.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}`:sheets.syncStatus==='syncing'?'Syncing…':'Sync error'}
              <button onClick={sheets.pollSheet} className="mg-nav-btn" style={{fontSize:10,padding:'3px 8px'}}><Icon name="refresh" size={12}/></button>
            </div>
          )}
          <button className="t-btn" onClick={()=>setShowSheetsPanel(p=>!p)}
            style={{fontWeight:700,fontSize:12,background:sheets.connected?'#e8f5e9':'#fff',borderColor:sheets.connected?'#a5d6a7':'#ddd',color:sheets.connected?'#2e7d32':'#444'}}>
            {sheets.connected?'● Sheets':<><Icon name="gantt" size={12}/> Connect Sheets</>}
          </button>
          <button className="t-btn" onClick={()=>setShowImport(true)} style={{fontWeight:700,fontSize:12}}><Icon name="upload" size={12}/> Import</button>
          <button className="t-btn" onClick={()=>exportICS(ganttData)} style={{fontWeight:700,fontSize:12}}><Icon name="calendar" size={12}/> .ics</button>
        </div>
      </div>

      {/* Google Sheets panel */}
      {showSheetsPanel&&(
        <div style={{background:'#fff',border:'1px solid #e5e5e5',borderRadius:8,padding:'12px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:'0 0 auto'}}>
            {sheets.connected
              ?<span style={{fontSize:12,fontWeight:700,color:'#2e7d32'}}>✓ Connected to Google</span>
              :<button className="btn-p" onClick={sheets.connectGoogle} style={{padding:'6px 14px',fontSize:12}}>Sign in with Google</button>}
          </div>
          {sheets.connected&&(<>
            <div style={{flex:1,minWidth:220}}>
              <input className="m-in" style={{marginBottom:0,fontSize:12}} placeholder="Paste Google Sheet ID or URL…"
                value={sheets.sheetId} onChange={e=>{
                  const v=e.target.value;
                  // Extract sheet ID from URL if pasted
                  const m=v.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
                  sheets.setSheetId(m?m[1]:v);
                }}/>
            </div>
            <button className="btn-p" onClick={sheets.pollSheet} style={{padding:'6px 14px',fontSize:12,flexShrink:0}}>Sync Now</button>
            <span style={{fontSize:11,color:'#aaa',fontWeight:500}}>Auto-syncs every 30s. Changes to status update the sheet in real time.</span>
          </>)}
        </div>
      )}

      {/* Gantt body — split into frozen labels + scrollable timeline */}
      <div className="mg-gantt-container" style={{display:'flex',minHeight:0,flex:1}}>

        {/* FROZEN LABEL COLUMN */}
        <div style={{width:LBL_W,flexShrink:0,borderRight:'1px solid #ddd',background:'#fff',overflowY:'hidden',zIndex:12,display:'flex',flexDirection:'column'}}>
          {/* Header spacer matching the timeline header height */}
          <div style={{height:viewMode==='days'?52:34,flexShrink:0,background:'#f5f5f5',borderBottom:'1px solid #ddd'}}/>
          {/* Label rows */}
          <div ref={labelScrollRef} style={{overflowY:'hidden',flex:1}} id="gantt-label-scroll">
            {ganttData.map(proj=>(
              <React.Fragment key={proj.id}>
                <div className="mg-project-row" style={{cursor:'pointer'}} onClick={()=>toggleProj(proj.id)}>
                  <div className="mg-project-label" style={{width:'100%',borderRight:'none'}}>
                    <span style={{fontSize:9,color:'rgba(255,255,255,.4)',transform:collapsed[proj.id]?'rotate(0)':'rotate(90deg)',display:'inline-block',transition:'transform .15s',flexShrink:0}}>▶</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="mg-project-code">{proj.code}</div>
                      <div className="mg-project-name" style={{fontSize:11}}>{proj.name}</div>
                    </div>
                  </div>
                </div>
                {!collapsed[proj.id]&&proj.episodes.map(ep=>{
                  const isEpOpen=!epCollapsed[ep.id];
                  return(<React.Fragment key={ep.id}>
                    <div className="mg-ep-row" style={{cursor:'pointer'}} onClick={()=>toggleEp(ep.id)}>
                      <div className="mg-ep-label" style={{width:'100%',borderRight:'none'}}>
                        <span style={{fontSize:9,color:'#bbb',transform:isEpOpen?'rotate(90deg)':'rotate(0)',display:'inline-block',transition:'transform .15s',flexShrink:0}}>▶</span>
                        <div className="mg-ep-name">{ep.name}</div>
                      </div>
                    </div>
                    {isEpOpen&&ep.tasks.map(task=>{
                      const td=taskDef(task.name);
                      return(<div key={task.id} className="mg-task-row">
                        <div className="mg-task-label" style={{width:'100%',borderRight:'none'}}>
                          <span style={{width:8,height:8,borderRadius:2,background:td.color,display:'inline-block',flexShrink:0}}/>
                          <span className="mg-task-name">{task.name}</span>
                          {task.assignee&&<span className="mg-task-eng" style={{color:td.color,fontSize:9}}>{task.assignee.split(' ')[0]}</span>}
                        </div>
                      </div>);
                    })}
                  </React.Fragment>);
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* SCROLLABLE TIMELINE */}
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',minWidth:0}}>

          {/* Sticky header — separate non-scrolling wrapper */}
          <div ref={headerScrollRef} style={{overflowX:'hidden',flexShrink:0,background:'#f5f5f5',borderBottom:'1px solid #ddd'}}>
            <div style={{width:totalPx,position:'relative'}}>
              {/* Month row (days mode only) */}
              {viewMode==='days'&&(
                <div style={{display:'flex',height:18,borderBottom:'1px solid #e8e8e8'}}>
                  {monthGroups.map((g,i)=>(
                    <div key={i} style={{position:'absolute',left:g.left,width:g.width,padding:'2px 6px',fontSize:10,fontWeight:800,color:'#555',letterSpacing:'.04em',textTransform:'uppercase',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',borderRight:'1px solid #e8e8e8'}}>
                      {g.label}
                    </div>
                  ))}
                </div>
              )}
              {/* Day/Week/Month cells */}
              <div style={{display:'flex',height:viewMode==='days'?34:34}}>
                {colsArr.map((c,i)=>(
                  <div key={i} className={`mg-day-cell${c.isWeekend?' weekend':''}`}
                    style={{width:cfg.pxPer,flexShrink:0,borderRight:'1px solid #e8e8e8'}}>
                    <div className="mg-day-top">{c.top}</div>
                    <div className={`mg-day-num${c.date===todayD?' today-num':''}`}>{c.bot}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable rows */}
          <div ref={scrollRef} style={{overflowX:'scroll',overflowY:'auto',flex:1}} onScroll={onScroll}>
            <div style={{width:totalPx,position:'relative'}}>
              {/* Weekend tint columns — rendered once as background */}
              {weekendCols.map(w=>(
                <div key={w.key} className="mg-weekend-col" style={{left:w.left,width:cfg.pxPer,top:0,bottom:0,height:'100%'}}/>
              ))}
              {/* Today line */}
              <div className="mg-today-line" style={{left:todayPx,top:0,bottom:0,height:'100%',zIndex:6}}/>

              {ganttData.map(proj=>(
                <React.Fragment key={proj.id}>
                  {/* Project row — show summary bar when collapsed */}
                  {(()=>{
                    const allTasks=proj.episodes.flatMap(ep=>ep.tasks);
                    const starts=allTasks.map(t=>t.startDate).filter(Boolean).sort();
                    const ends=allTasks.map(t=>t.endDate).filter(Boolean).sort();
                    const projStart=starts[0]; const projEnd=ends[ends.length-1];
                    const bLeft=projStart?dToX(projStart):null;
                    const bRight=projEnd?dToX(projEnd):null;
                    const bWidth=bLeft!=null&&bRight!=null?Math.max(4,bRight-bLeft):0;
                    return(
                      <div className="mg-project-timeline" style={{minWidth:totalPx,height:34,position:'relative'}}>
                        {collapsed[proj.id]&&bWidth>0&&(
                          <div style={{position:'absolute',left:bLeft,width:bWidth,top:'50%',transform:'translateY(-50%)',height:14,borderRadius:4,background:'#5c6bc0',opacity:.85,display:'flex',alignItems:'center',paddingLeft:6,overflow:'hidden',zIndex:2}}>
                            <span style={{fontSize:9,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{proj.code} {proj.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {!collapsed[proj.id]&&proj.episodes.map(ep=>{
                    const span=getEpSpan(ep);
                    const isEpOpen=!epCollapsed[ep.id];
                    return(<React.Fragment key={ep.id}>
                      {/* Episode row */}
                      <div className="mg-ep-timeline" style={{minWidth:totalPx,height:28,position:'relative',background:'#f8f8f8',borderBottom:'1px solid #eee'}}>
                        {span&&<div className="mg-ep-spine" style={{left:span.left,width:span.width}}/>}
                        {span&&<span style={{position:'absolute',left:span.left+span.width+4,top:'50%',transform:'translateY(-50%)',fontSize:10,color:'#aaa',fontWeight:600,whiteSpace:'nowrap'}}>{fmtD(ep.tasks[ep.tasks.length-1]?.endDate)}</span>}
                      </div>
                      {/* Task rows */}
                      {isEpOpen&&ep.tasks.map(task=>{
                        const bs=getBarStyle(task);
                        const td=bs?.td;
                        const isDone=task.status==='Done';
                        const isIP=task.status==='In Progress';
                        return(<div key={task.id} className="mg-task-timeline" style={{minWidth:totalPx,height:30,position:'relative',borderBottom:'1px solid #f5f5f5',background:'#fff'}}>
                          {bs&&bs.width>0&&(
                            <div className="mg-task-bar" style={{left:bs.left,width:bs.width}}>
                              <div className="mg-bar-bg" style={{background:td.color,opacity:isDone?0.92:isIP?0.72:0.32}}/>
                              <div className="mg-bar-content" style={{color:isDone||isIP?td.text:'#555'}}>
                                <span className="mg-bar-abbr">{bs.width>55?task.name:td.abbr}</span>
                                {task.assignee&&<span className="mg-bar-eng">{inits(task.assignee)}</span>}
                              </div>
                              {isIP&&task.pct>0&&<div style={{position:'absolute',bottom:0,left:0,height:3,width:`${task.pct}%`,background:td.color,opacity:.9}}/>}
                            </div>
                          )}
                        </div>);
                      })}
                    </React.Fragment>);
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showImport&&<ImportModal onClose={()=>setShowImport(false)} onImport={proj=>{onUpdateGantt(p=>[...p,proj]);setShowImport(false)}}/>}
    </div>
  );
}



// ── iCal Export ────────────────────────────────────────────────────────────
function exportICS(ganttData){
  const fmtICS=d=>d.replace(/-/g,'')+'T090000Z';
  let ics=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Mighty Sound WorkBoard//EN\nCALSCALE:GREGORIAN\n`;
  ganttData.forEach(proj=>proj.episodes.forEach(ep=>ep.tasks.forEach(task=>{
    ics+=`BEGIN:VEVENT\nUID:${uid()}@mightysound.studio\nDTSTART:${fmtICS(task.startDate)}\nDTEND:${fmtICS(task.endDate)}\nSUMMARY:${proj.code} ${ep.name} — ${task.name}\nDESCRIPTION:Engineer: ${task.assignee||'TBC'} | Status: ${task.status}\nLOCATION:Mighty Sound Studio\nEND:VEVENT\n`;
  })));
  ics+='END:VCALENDAR';
  const blob=new Blob([ics],{type:'text/calendar'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mighty_sound_schedule.ics';a.click();URL.revokeObjectURL(url);
}

// ── IMPORT MODAL ───────────────────────────────────────────────────────────
const CONTENT_TYPES=[
  {id:'series',  icon:'screen', label:'TV Series',     desc:'Multiple episodes, each with a full audio post pipeline'},
  {id:'film',    icon:'clapper', label:'Film',           desc:'Single feature or short film, one pipeline'},
  {id:'doco',    icon:'camera', label:'Documentary',    desc:'Single doc or doc series — treated as one pipeline per ep'},
  {id:'short',   icon:'lightning', label:'Short Form',     desc:'TVCs, social, podcasts — multiple assets by duration/count'},
];

function ImportModal({onClose,onImport}){
  const [step,setStep]=useState('type');   // type | upload | processing | preview
  const [contentType,setContentType]=useState('');
  const [fileName,setFileName]=useState('');
  const [fileExt,setFileExt]=useState('');
  const [progress,setProgress]=useState(0);
  const [parsed,setParsed]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const [error,setError]=useState('');
  const [processingMsg,setProcessingMsg]=useState('');
  const fileRef=useRef();

  const handleFile=async(file)=>{
    if(!file)return;
    setFileName(file.name);
    const ext=file.name.split('.').pop().toLowerCase();
    setFileExt(ext);
    setStep('processing');setProgress(10);setError('');
    try{
      if(ext==='xlsx'||ext==='xls'){setProcessingMsg('Reading spreadsheet…');await parseXLSX(file)}
      else if(ext==='pdf'){setProcessingMsg('Sending PDF to AI…');await parsePDF(file)}
      else if(['png','jpg','jpeg'].includes(ext)){setProcessingMsg('Sending image to AI…');await parseImage(file)}
      else{setError('Unsupported file type. Use XLSX, PDF, PNG or JPG.');setStep('upload')}
    }catch(e){setError('Failed to parse: '+e.message);setStep('upload')}
  };

  // ── Build prompt based on content type ──────────────────────────────────
  const buildPrompt=()=>{
    const base=`You are parsing a ${contentType==='series'?'TV series':contentType==='doco'?'documentary':contentType==='short'?'short form content':'film'} audio post-production schedule.
Return ONLY valid JSON, no markdown, no explanation, no code fences.

The 8 audio post tasks in order are:
Ingest → DX Edit → MX Edit → SFX Edit → Pre Mix → Final Mix → QC → Delivery

Milestone/column name mapping:
- "Picture Lock" / "Final Lock" / "Pic Lock" / "Lock" = Ingest startDate
- "Online Playback" / "Conform" / "Online" = DX Edit startDate  
- "Mix Playback" / "Pre-dub" = Pre Mix startDate
- "Deliver for QC" / "QC" = QC startDate
- "Final Delivery" / "TX" / "Broadcast" = Delivery startDate
- Estimate endDate as startDate + 2 days unless another milestone is closer
`;

    if(contentType==='series'){
      return base+`
This is a TV SERIES. Find ALL episode numbers (Ep 1, Ep 2, EP01, 101, 102, etc).
Create one episode per episode number. Each episode must have all 8 tasks.

JSON structure:
{"projectName":"show name","type":"series","totalEpisodes":N,"episodes":[{"name":"Ep 01","tasks":[{"task":"Ingest","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"DX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"MX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"SFX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Pre Mix","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Final Mix","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"QC","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Delivery","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}]}]}

CRITICAL: Return one episode object for EVERY episode in the schedule. If you see Ep1 through Ep10 you must return 10 episode objects.`;
    }
    if(contentType==='short'){
      return base+`
This is SHORT FORM content (TVCs, social, podcasts, etc).
Identify: asset type (e.g. "30sec TVC"), duration, and quantity.
Each unique asset (by version or number) is one "episode" entry.

JSON structure:
{"projectName":"campaign name","type":"short","assetType":"30sec TVC","assetCount":N,"episodes":[{"name":"30sec :01","durationSecs":30,"tasks":[{"task":"Ingest","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"DX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"MX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"SFX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Pre Mix","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Final Mix","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"QC","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Delivery","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}]}]}`;
    }
    // film or doco — single pipeline
    return base+`
This is a ${contentType==='doco'?'documentary':'film'}. Single pipeline, no episode breakdown.

JSON structure:
{"projectName":"title","type":"${contentType}","episodes":[{"name":"${contentType==='doco'?'Documentary':'Film'}","tasks":[{"task":"Ingest","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"DX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"MX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"SFX Edit","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Pre Mix","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Final Mix","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"QC","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"},{"task":"Delivery","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}]}]}`;
  };

  // ── Parse XLSX ───────────────────────────────────────────────────────────
  const parseXLSX=async(file)=>{
    setProgress(30);
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
    setProgress(55);
    const projName=rows.slice(0,3).flatMap(r=>r).find(c=>c&&typeof c==='string'&&c.length>2&&!/^(SAT|SUN|MON|TUE|WED|THU|FRI|SATURDAY|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY)$/i.test(c))||file.name.replace(/\.[^.]+$/,'');
    const projCode='MS'+Math.floor(Math.random()*9000+1000);

    const AUDIO_TASKS=[
      {keys:['ingest','rushes','rush'],name:'Ingest'},
      {keys:['dx edit','dialogue edit','dx '],name:'DX Edit'},
      {keys:['mx edit','music edit','mx '],name:'MX Edit'},
      {keys:['sfx edit','sound fx','sfx ','foley','bkgd'],name:'SFX Edit'},
      {keys:['pre-mix','pre mix','premix','predub'],name:'Pre Mix'},
      {keys:['final mix','final-mix','m&e'],name:'Final Mix'},
      {keys:['qc','quality check','review playback','mix playback'],name:'QC'},
      {keys:['deliver','deliverable','tx ','on air','broadcast','final delivery'],name:'Delivery'},
    ];

    // Collect all dated rows
    const datedRows=[];let lastDate=null;
    rows.forEach(row=>{
      let d=null;
      for(const ci of [2,1,0]){
        const cell=row[ci];
        if(cell instanceof Date&&!isNaN(cell)){d=cell.toISOString().split('T')[0];break}
        if(typeof cell==='string'){const dt=new Date(cell);if(!isNaN(dt)&&cell.match(/\d{4}/)){d=dt.toISOString().split('T')[0];break}}
      }
      if(d)lastDate=d;
      if(lastDate){
        const text=row.filter(c=>c!=null).map(c=>typeof c==='string'?c:String(c)).join(' ');
        datedRows.push({date:lastDate,text,row});
      }
    });

    // Detect episodes
    const allText=datedRows.map(r=>r.text).join(' ');
    const epNums=new Set();
    const epRe=/\bep(?:isode)?\s*(\d+)\b/gi;
    let m;while((m=epRe.exec(allText))!==null)epNums.add(parseInt(m[1]));

    let episodes=[];

    if((contentType==='series'||contentType==='doco')&&epNums.size>1){
      // Group by episode
      const epMap={};
      datedRows.forEach(({date,text})=>{
        const matches=[...text.matchAll(/\bep(?:isode)?\s*(\d+)\b/gi)];
        const nums=matches.map(x=>parseInt(x[1]));
        AUDIO_TASKS.forEach(at=>{
          if(at.keys.some(k=>text.toLowerCase().includes(k))){
            (nums.length>0?nums:[0]).forEach(n=>{
              if(!epMap[n])epMap[n]={};
              if(!epMap[n][at.name])epMap[n][at.name]=date;
            });
          }
        });
      });
      episodes=Object.keys(epMap).map(Number).sort((a,b)=>a-b).map(n=>{
        const epData=epMap[n];
        const orderedTasks=TASK_DEFS.map(td=>{
          const startDate=epData[td.name]||null;
          return startDate?tk(uid(),td.name,startDate,addDays(startDate,3),'Not Started',0,'Paul R'):null;
        }).filter(Boolean);
        return{id:uid(),name:`Ep ${String(n).padStart(2,'0')}`,tasks:orderedTasks.length>0?orderedTasks:TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*5),addDays(today(),i*5+4),'Not Started',0,'Paul R'))};
      });
    } else {
      // Single pipeline
      const taskMap={};
      datedRows.forEach(({date,text})=>{
        AUDIO_TASKS.forEach(at=>{if(!taskMap[at.name]&&at.keys.some(k=>text.toLowerCase().includes(k)))taskMap[at.name]=date});
      });
      const tasks=TASK_DEFS.map(td=>taskMap[td.name]?tk(uid(),td.name,taskMap[td.name],addDays(taskMap[td.name],3),'Not Started',0,'Paul R'):null).filter(Boolean);
      episodes=[{id:uid(),name:contentType==='doco'?'Documentary':contentType==='short'?'Asset 01':'Film',tasks:tasks.length>0?tasks:TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*5),addDays(today(),i*5+4),'Not Started',0,'Paul R'))}];
    }

    setProgress(90);
    const proj={id:uid(),code:projCode,name:projName.toString().trim().slice(0,40),client:'Imported',type:contentType,episodes};
    setParsed(proj);setStep('preview');setProgress(100);
  };

  // ── Parse PDF — send as base64 document to AI (not text) ─────────────────
  const parsePDF=async(file)=>{
    setProgress(20);
    setProcessingMsg('Reading PDF…');
    const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file)});
    setProgress(40);
    setProcessingMsg('AI is reading the schedule…');
    await callAI([
      {type:'document',source:{type:'base64',media_type:'application/pdf',data:base64}},
      {type:'text',text:buildPrompt()}
    ],file.name);
  };

  // ── Parse Image ──────────────────────────────────────────────────────────
  const parseImage=async(file)=>{
    setProgress(25);
    const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file)});
    setProgress(45);
    setProcessingMsg('AI is reading the schedule…');
    await callAI([
      {type:'image',source:{type:'base64',media_type:'image/'+file.name.split('.').pop().replace('jpg','jpeg'),data:base64}},
      {type:'text',text:buildPrompt()}
    ],file.name);
  };

  // ── Call AI ───────────────────────────────────────────────────────────────
  const callAI=async(msgContent,name)=>{
    setProgress(60);
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:4000,
          messages:[{role:'user',content:msgContent}]
        })
      });
      setProgress(82);
      const result=await resp.json();
      if(result.error)throw new Error(result.error.message||'API error');
      const rawText=result.content?.find(c=>c.type==='text')?.text||'';
      // Extract JSON — handle both bare objects and arrays
      const jsonMatch=rawText.match(/\{[\s\S]*\}/);
      if(!jsonMatch)throw new Error('AI returned no JSON. Try a different file.');
      const schedule=JSON.parse(jsonMatch[0]);
      buildProject(schedule,name);
    }catch(e){
      // Graceful fallback with placeholder
      console.warn('AI parse failed:',e.message);
      const proj={
        id:uid(),code:'MS'+Math.floor(Math.random()*9000+1000),
        name:name.replace(/\.[^.]+$/,'').slice(0,40),
        client:'Imported',type:contentType,
        episodes:[{id:uid(),name:contentType==='series'?'Ep 01':contentType==='doco'?'Documentary':contentType==='short'?'Asset 01':'Film',
          tasks:TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*5),addDays(today(),i*5+4),'Not Started',0,'Paul R'))}]
      };
      setError('AI could not fully parse the file — placeholder created. Edit tasks after import.');
      setParsed(proj);setStep('preview');setProgress(100);
    }
  };

  // ── Build project from AI response ────────────────────────────────────────
  const buildProject=(schedule,name)=>{
    const projCode='MS'+Math.floor(Math.random()*9000+1000);
    const rawEps=schedule.episodes||[];
    const episodes=rawEps.map(ep=>({
      id:uid(),
      name:ep.name||'Episode',
      durationSecs:ep.durationSecs||null,
      tasks:(ep.tasks||[]).map(t=>tk(
        uid(),
        t.task||'Ingest',
        t.startDate||today(),
        t.endDate||addDays(t.startDate||today(),3),
        'Not Started',0,'Paul R'
      ))
    }));
    if(episodes.length===0){
      setError('No episodes found in file — placeholder created.');
      episodes.push({id:uid(),name:'Film',tasks:TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*5),addDays(today(),i*5+4),'Not Started',0,'Paul R'))});
    }
    const proj={
      id:uid(),code:projCode,
      name:(schedule.projectName||name.replace(/\.[^.]+$/,'')).slice(0,40),
      client:'Imported',type:schedule.type||contentType,
      assetType:schedule.assetType||null,
      episodes
    };
    setParsed(proj);setStep('preview');setProgress(100);
  };

  const onDrop=e=>{e.preventDefault();setDragOver(false);if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0])};

  // ── RENDER ────────────────────────────────────────────────────────────────
  return(
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" style={{width:520,maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <h3 style={{margin:0,display:'flex',alignItems:'center',gap:8}}>
            Import Production Schedule
            <span className="ai-badge" style={{background:"#e8f5e9",color:"#2e7d32"}}><Icon name="lightning" size={11}/> Auto</span>
          </h3>
          {step!=='type'&&<button onClick={()=>setStep('type')} style={{background:'none',border:'none',fontSize:11,fontWeight:700,color:'#aaa',cursor:'pointer',textTransform:'uppercase',letterSpacing:'.05em'}}>← Back</button>}
        </div>

        {/* Step 1: Content type */}
        {step==='type'&&(
          <div>
            <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:10,textTransform:'uppercase',letterSpacing:'.06em'}}>What type of content is this?</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {CONTENT_TYPES.map(ct=>(
                <div key={ct.id} onClick={()=>setContentType(ct.id)}
                  style={{padding:'12px 13px',border:`2px solid ${contentType===ct.id?'#111':'#e5e5e5'}`,borderRadius:8,cursor:'pointer',background:contentType===ct.id?'#f5f5f5':'#fff',transition:'all .13s'}}>
                  <div style={{fontSize:20,marginBottom:5}}>{ct.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#111',marginBottom:2}}>{ct.label}</div>
                  <div style={{fontSize:11,color:'#aaa',fontWeight:500,lineHeight:1.4}}>{ct.desc}</div>
                </div>
              ))}
            </div>
            <div className="m-actions">
              <button className="btn-g" onClick={onClose}>Cancel</button>
              <button className="btn-p" disabled={!contentType} onClick={()=>setStep('upload')} style={{opacity:contentType?1:.4}}>Next — Upload File</button>
            </div>
          </div>
        )}

        {/* Step 2: Upload */}
        {step==='upload'&&(
          <div>
            <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:10,textTransform:'uppercase',letterSpacing:'.06em'}}>
              {CONTENT_TYPES.find(c=>c.id===contentType)?.icon} {CONTENT_TYPES.find(c=>c.id===contentType)?.label} — Upload schedule file
            </div>
            <div className={`import-drop${dragOver?' drag':''}`}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={onDrop}
              onClick={()=>fileRef.current.click()}>
              <div className="import-drop-icon">⬆</div>
              <div className="import-drop-title">Drop your production schedule here</div>
              <div className="import-drop-sub">or click to browse</div>
              <div className="import-type-pills">
                <span className="import-type xlsx">XLSX</span>
                <span className="import-type pdf">PDF</span>
                <span className="import-type img">PNG / JPG</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg" style={{display:'none'}} onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])}/>
            {error&&<div style={{color:'#c62828',fontSize:12,marginTop:6,fontWeight:600}}>{error}</div>}
            <div style={{fontSize:11,color:'#aaa',marginTop:8,lineHeight:1.5,fontWeight:500}}>
              {contentType==='series'&&'AI will detect all episode numbers and create a separate 8-task pipeline per episode.'}
              {contentType==='film'&&'AI will create a single film pipeline with all 8 audio post tasks.'}
              {contentType==='doco'&&'AI will create a documentary pipeline. If multiple episodes are found they will each get their own pipeline.'}
              {contentType==='short'&&'AI will identify individual assets (by version/number) and their durations. Each asset gets its own task pipeline.'}
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step==='processing'&&(
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{marginBottom:14}}><Icon name="settings" size={36} style={{color:"#bbb"}}/></div>
            <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:6}}>{fileName}</div>
            <div style={{fontSize:12,color:'#aaa',marginBottom:18,fontWeight:500}}>{processingMsg}</div>
            <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
            <div style={{fontSize:11,color:'#bbb',marginTop:7,fontWeight:600}}>{progress}%</div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step==='preview'&&parsed&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:'#111'}}>{parsed.name}</div>
                <div style={{fontSize:11,color:'#aaa',fontWeight:500,marginTop:2}}>
                  {parsed.code} · {CONTENT_TYPES.find(c=>c.id===parsed.type)?.label||parsed.type} · {parsed.episodes.length} {parsed.type==='short'?'asset':parsed.type==='film'||parsed.type==='doco'?'pipeline':'episode'}{parsed.episodes.length!==1?'s':''}
                  {parsed.assetType&&` · ${parsed.assetType}`}
                </div>
              </div>
              <span style={{fontSize:20}}>{CONTENT_TYPES.find(c=>c.id===parsed.type)?.icon||'folder'}</span>
            </div>
            {error&&<div style={{color:'#e65100',fontSize:11,fontWeight:600,marginBottom:8,background:'#fff3e0',padding:'6px 10px',borderRadius:5}}>{error}</div>}
            <div className="import-preview" style={{maxHeight:300}}>
              {parsed.episodes.map(ep=>(
                <div key={ep.id} style={{marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:800,color:'#333',padding:'5px 0 3px',textTransform:'uppercase',letterSpacing:'.06em',borderBottom:'1px solid #f0f0f0',marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
                    {ep.name}
                    {ep.durationSecs&&<span style={{fontSize:9,background:'#e3f2fd',color:'#1565c0',padding:'1px 6px',borderRadius:3,fontWeight:700}}>{ep.durationSecs}s</span>}
                    <span style={{marginLeft:'auto',fontSize:9,color:'#bbb',fontWeight:600}}>{ep.tasks.length} tasks</span>
                  </div>
                  {ep.tasks.map(t=>{const td=taskDef(t.name);return(
                    <div key={t.id} className="import-row">
                      <span style={{width:8,height:8,borderRadius:2,background:td.color,display:'inline-block',flex:'0 0 8px'}}/>
                      <span style={{flex:1,fontSize:12,fontWeight:600}}>{t.name}</span>
                      <span style={{color:'#aaa',fontSize:11}}>{fmtD(t.startDate)} → {fmtD(t.endDate)}</span>
                    </div>
                  );})}
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'#aaa',margin:'10px 0',fontWeight:500}}>All tasks are editable after import.</div>
            <div className="m-actions">
              <button className="btn-g" onClick={()=>setStep('upload')}>Re-import</button>
              <button className="btn-p" onClick={()=>onImport(parsed)}>Add to Master Gantt ↗</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

  const handleFile=async(file)=>{
    if(!file)return;
    setFileName(file.name);const ext=file.name.split('.').pop().toLowerCase();
    setFileType(ext==='xlsx'||ext==='xls'?'xlsx':ext==='pdf'?'pdf':['png','jpg','jpeg'].includes(ext)?'image':'unknown');
    setStage('processing');setProgress(10);setError('');
    try{
      if(ext==='xlsx'||ext==='xls')await parseXLSX(file);
      else if(ext==='pdf')await parsePDF(file);
      else if(['png','jpg','jpeg'].includes(ext))await parseImage(file);
      else setError('Unsupported file type. Please use XLSX, PDF, PNG or JPG.');
    }catch(e){setError('Failed to parse file: '+e.message);setStage('upload')}
  };

  const parseXLSX=async(file)=>{
    setProgress(30);
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
    setProgress(50);

    const projName=rows.slice(0,3).flatMap(r=>r).find(c=>c&&typeof c==='string'&&c.length>2&&!c.match(/^(SATURDAY|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY)$/i))||'Imported Project';
    const projCode='MS'+Math.floor(Math.random()*9000+1000);

    // Episode detection patterns
    const EP_RE=/\bep(?:isode)?\s*(\d+)\b/i;
    const AUDIO_TASKS=[
      {keys:['ingest','rushes','rush','camera','card'],name:'Ingest'},
      {keys:['dx edit','dialogue','dx '],name:'DX Edit'},
      {keys:['mx edit','music edit','mx '],name:'MX Edit'},
      {keys:['sfx edit','sound effect','sfx ','bkgd','backgrounds','foley'],name:'SFX Edit'},
      {keys:['pre-mix','pre mix','premix','predub'],name:'Pre Mix'},
      {keys:['final mix','final-mix','mix','dub','m&e'],name:'Final Mix'},
      {keys:['qc','quality','review','playback'],name:'QC'},
      {keys:['deliver','deliverable','tx','onair','on air','broadcast'],name:'Delivery'},
    ];

    // Two-pass: first collect all dated rows, then group by episode
    const datedRows=[];
    let lastDate=null;
    rows.forEach((row,ri)=>{
      let d=null;
      // Date can be in col B (index 1) or C (index 2)
      for(const ci of [2,1,0]){
        const cell=row[ci];
        if(cell instanceof Date){d=cell.toISOString().split('T')[0];break}
        if(typeof cell==='string'&&cell.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)){
          const dt=new Date(cell);if(!isNaN(dt))d=dt.toISOString().split('T')[0];break;
        }
      }
      if(d)lastDate=d;
      if(lastDate){
        const rowText=row.filter(c=>c!=null).map(c=>String(c)).join(' ');
        datedRows.push({date:lastDate,text:rowText,row,ri});
      }
    });

    // Detect if this is a series by looking for episode mentions
    const episodeMentions=new Set();
    datedRows.forEach(({text})=>{
      const m=text.match(/\bep(?:isode)?\s*(\d+)\b/gi);
      if(m)m.forEach(ep=>episodeMentions.add(ep.toLowerCase().replace(/\s+/,'')));
    });

    const isSeries=episodeMentions.size>1;
    setProgress(70);

    let episodes=[];

    if(isSeries){
      // Group audio task dates by episode number
      const epMap={};
      datedRows.forEach(({date,text})=>{
        // Find episode reference in this row
        const epMatches=[...text.matchAll(/\bep(?:isode)?\s*(\d+)\b/gi)];
        const epNums=epMatches.map(m=>parseInt(m[1]));
        // Find audio tasks in this row
        AUDIO_TASKS.forEach(at=>{
          if(at.keys.some(k=>text.toLowerCase().includes(k))){
            const targetEps=epNums.length>0?epNums:[0];// ep0 = series-wide
            targetEps.forEach(epNum=>{
              if(!epMap[epNum])epMap[epNum]={};
              if(!epMap[epNum][at.name])epMap[epNum][at.name]=date;
            });
          }
        });
      });

      const sortedEps=Object.keys(epMap).map(Number).sort((a,b)=>a-b);
      episodes=sortedEps.map(epNum=>{
        const epData=epMap[epNum];
        const taskDates=Object.entries(epData).sort((a,b)=>a[1].localeCompare(b[1]));
        const tasks=taskDates.length>0
          ?taskDates.map(([taskName,startDate],i)=>tk(uid(),taskName,startDate,addDays(startDate,i===taskDates.length-1?2:Math.max(1,daysBetween(startDate,taskDates[i+1]?taskDates[i+1][1]:addDays(startDate,3))-1)),'Not Started',0,'Paul R'))
          :TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*4),addDays(today(),i*4+3),'Not Started',0,'Paul R'));
        return{id:uid(),name:`Ep ${String(epNum).padStart(2,'0')}`,tasks};
      });
    } else {
      // Film/single — original logic
      const taskMap={};
      datedRows.forEach(({date,text})=>{
        AUDIO_TASKS.forEach(at=>{
          if(!taskMap[at.name]&&at.keys.some(k=>text.toLowerCase().includes(k))){
            taskMap[at.name]=date;
          }
        });
      });
      const taskEntries=TASK_DEFS.map(td=>({name:td.name,date:taskMap[td.name]||null})).filter(t=>t.date);
      const tasks=taskEntries.length>0
        ?taskEntries.map((te,i)=>tk(uid(),te.name,te.date,addDays(te.date,i<taskEntries.length-1?Math.max(1,daysBetween(te.date,taskEntries[i+1]?.date||addDays(te.date,4))-1):3),'Not Started',0,'Paul R'))
        :TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*5),addDays(today(),i*5+4),'Not Started',0,'Paul R'));
      episodes=[{id:uid(),name:'Film',tasks}];
    }

    setProgress(90);
    const proj={
      id:uid(),code:projCode,
      name:projName.toString().replace(/[^\w\s\-]/g,'').trim().slice(0,40),
      client:'Imported',type:isSeries?'series':'film',
      episodes
    };
    setParsed(proj);setStage('preview');setProgress(100);
  };

  const parsePDF=async(file)=>{
    setProgress(30);
    const text=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsText(file)});
    setProgress(50);
    await parseWithAI(text.slice(0,4000),'pdf',file.name);
  };

  const parseImage=async(file)=>{
    setProgress(25);
    const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file)});
    setProgress(45);
    await parseWithAI(base64,'image',file.name);
  };

  const parseWithAI=async(data,type,name)=>{
    setProgress(55);
    const PROMPT=`You are parsing a TV/film audio post-production schedule.
Extract ALL episodes and their key milestone dates. Return ONLY valid JSON, no markdown, no explanation.

JSON structure:
{
  "projectName": "show name",
  "type": "series" or "film",
  "episodes": [
    {
      "name": "Ep 01",
      "tasks": [
        {"task": "Ingest",    "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "DX Edit",   "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "MX Edit",   "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "SFX Edit",  "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "Pre Mix",   "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "Final Mix", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "QC",        "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
        {"task": "Delivery",  "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}
      ]
    }
  ]
}

Milestone mapping rules:
- "Picture Lock" / "Final Lock" / "Pic Lock" = start of Ingest (startDate). Ingest ends 2 days later.
- "Online Playback" / "Conform" = DX Edit start. Ends day before Mix Playback.
- "Mix Playback" = Pre Mix start. Ends 1 day later.
- "Deliver for QC" / "QC" = QC startDate. Ends 3 days later.
- "Final Delivery" / "TX" = Delivery startDate and endDate.
- If separate DX/MX/SFX edit dates exist, use them directly.
- For each episode, estimate task durations based on gaps between milestones.
- IMPORTANT: Create one episode entry per episode number found (Ep 01, Ep 02, 101, 102, etc.)
- If it's a film (no episode numbers), use a single episode named "Film".`;

    try{
      const msgContent=type==='image'
        ?[{type:'image',source:{type:'base64',media_type:'image/png',data}},{type:'text',text:PROMPT}]
        :[{type:'text',text:PROMPT+'\n\nSchedule data:\n'+data}];

      const resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:3000,messages:[{role:'user',content:msgContent}]})
      });
      setProgress(80);
      const result=await resp.json();
      const rawText=result.content?.find(c=>c.type==='text')?.text||'';
      const jsonMatch=rawText.match(/\{[\s\S]*\}/);
      if(!jsonMatch)throw new Error('No JSON in response');
      const schedule=JSON.parse(jsonMatch[0]);
      const projCode='MS'+Math.floor(Math.random()*9000+1000);
      const episodes=(schedule.episodes||[]).map(ep=>({
        id:uid(),
        name:ep.name||'Film',
        tasks:(ep.tasks||[]).map(t=>tk(
          uid(),
          t.task||'Ingest',
          t.startDate||today(),
          t.endDate||addDays(t.startDate||today(),3),
          'Not Started',0,'Paul R'
        ))
      }));
      if(episodes.length===0)throw new Error('No episodes found');
      const proj={
        id:uid(),code:projCode,
        name:(schedule.projectName||name.replace(/\.[^.]+$/,'')).slice(0,40),
        client:'Imported',
        type:schedule.type||(episodes.length>1?'series':'film'),
        episodes
      };
      setParsed(proj);setStage('preview');setProgress(100);
    }catch(e){
      // Fallback placeholder
      const proj={id:uid(),code:'MS'+Math.floor(Math.random()*9000+1000),name:name.replace(/\.[^.]+$/,'').slice(0,40),client:'Imported',type:'film',
        episodes:[{id:uid(),name:'Film',tasks:TASK_DEFS.map((td,i)=>tk(uid(),td.name,addDays(today(),i*5),addDays(today(),i*5+4),'Not Started',0,'Paul R'))}]};
      setParsed(proj);setStage('preview');setProgress(100);
    }
  };

// ── LongformView ───────────────────────────────────────────────────────────
function LongformGantt({longform,activeProd,masterGantt=[]}){
  const [collapsed,setCollapsed]=useState({});const [offsetW,setOffsetW]=useState(0);
  const [showAll,setShowAll]=useState(false);
  const activeProdObj=longform.productions.find(p=>p.id===activeProd)||longform.productions[0];
  // Show all productions or just the active one
  // Convert masterGantt projects to production-like format
  const ganttAsProds=useMemo(()=>masterGantt.map(p=>({
    id:'mg_'+p.id, name:p.code+' — '+p.name, type:p.type||'Film', client:p.client,
    episodes:p.episodes.map(ep=>({...ep,dueDate:ep.tasks?.slice(-1)[0]?.endDate||'',status:ep.tasks?.every(t=>t.status==='Done')?'Done':ep.tasks?.some(t=>t.status==='In Progress')?'In Progress':'Not Started'})),
    _fromMaster:true,
  })),[masterGantt]);
  // Show the selected project/production, or all when showAll is toggled
  const isMasterActive=activeProd?.startsWith('mg_');
  const activeMasterProj=ganttAsProds.find(p=>p.id===activeProd);
  const prodsToShow=showAll
    ?[...ganttAsProds,...longform.productions]
    :isMasterActive
      ?(activeMasterProj?[activeMasterProj]:ganttAsProds)
      :(activeProdObj?[activeProdObj]:[]);
  const WEEKS=16;const PX_WEEK=80;const todayD=today();
  const startDate=useMemo(()=>addDays(todayD,-14+offsetW*7),[offsetW,todayD]);
  const totalPx=WEEKS*PX_WEEK;const dToX=d=>daysBetween(startDate,d)*(PX_WEEK/7);const todayX=dToX(todayD);
  const weeksArr=useMemo(()=>Array.from({length:WEEKS},(_,i)=>{const d=addDays(startDate,i*7);const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-AU',{day:'numeric',month:'short'})}),[startDate]);
  const toggleEp=id=>setCollapsed(p=>({...p,[id]:!p[id]}));
  const toggleProd=id=>setCollapsed(p=>({...p,['prod_'+id]:!p['prod_'+id]}));
  const PROD_COLORS=['#5c6bc0','#e53935','#43a047','#fb8c00','#00acc1','#8e24aa','#f4511e','#3949ab'];
  if(!prodsToShow.length)return null;
  return(<div>
    <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center',flexWrap:'wrap'}}>
      <button className="mg-nav-btn" onClick={()=>setOffsetW(o=>o-2)}>‹ Earlier</button>
      <span style={{fontSize:13,color:'#555',fontWeight:600}}>{weeksArr[0]} — {weeksArr[WEEKS-1]}</span>
      <button className="mg-nav-btn" onClick={()=>setOffsetW(o=>o+2)}>Later ›</button>
      <button className="mg-nav-btn" onClick={()=>setOffsetW(0)} style={{fontSize:11}}>Today</button>
      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
        <button className="t-btn" style={{fontWeight:700,fontSize:11,background:showAll?'#111':'#fff',color:showAll?'#fff':'#555',borderColor:showAll?'#111':'#ddd'}} onClick={()=>setShowAll(p=>!p)}>
          {showAll?'Master Gantt only':'Master Gantt + Productions'}
        </button>
      </div>
    </div>
    <div className="lfg-legend" style={{marginBottom:10}}>
      {TASK_DEFS.map(t=><div key={t.name} className="lfg-legend-item"><span className="lfg-legend-dot" style={{background:t.color}}/>{t.name}</div>)}
    </div>
    <div className="lfg-wrap" style={{overflowX:'auto'}}><div style={{minWidth:240+totalPx}}>
      <div className="lfg-head"><div className="lfg-lbl-col">Production / Episode</div><div style={{display:'flex',minWidth:totalPx}}>{weeksArr.map((w,i)=><div key={i} className="lfg-week" style={{flex:`0 0 ${PX_WEEK}px`}}>{w}</div>)}</div></div>
      {prodsToShow.map((prod,pi)=>{
        const prodColor=PROD_COLORS[pi%PROD_COLORS.length];
        const isProdOpen=!collapsed['prod_'+prod.id];
        // Compute production span
        const allTs=prod.episodes.flatMap(ep=>ep.tasks||[]);
        const pStart=allTs.map(t=>t.startDate).filter(Boolean).sort()[0];
        const pEnd=allTs.map(t=>t.endDate).filter(Boolean).sort().slice(-1)[0];
        const px1=pStart?Math.max(0,dToX(pStart)):null;
        const px2=pEnd?Math.min(totalPx,dToX(pEnd)):null;
        return(<React.Fragment key={prod.id}>
          {/* Production header row */}
          <div style={{display:'flex',cursor:'pointer',background:'#1a1a2e',borderBottom:'1px solid #333'}} onClick={()=>toggleProd(prod.id)}>
            <div className="lfg-lbl-col" style={{color:'#fff',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',gap:6,padding:'6px 10px'}}>
              <span style={{fontSize:9,color:'rgba(255,255,255,.4)',transform:isProdOpen?'rotate(90deg)':'rotate(0)',display:'inline-block',transition:'transform .15s'}}>▶</span>
              <span style={{width:8,height:8,borderRadius:2,background:prodColor,display:'inline-block',flexShrink:0}}/>
              <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{prod.name}</span>
              <span style={{fontSize:9,color:'rgba(255,255,255,.35)',fontWeight:500,flexShrink:0}}>{prod.episodes.length} eps</span>
            </div>
            <div style={{flex:1,minWidth:totalPx,position:'relative',height:32}}>
              {todayX>=0&&todayX<=totalPx&&<div className="lfg-today" style={{left:todayX}}/>}
              {!isProdOpen&&px1!=null&&px2!=null&&px2>px1&&(
                <div style={{position:'absolute',left:px1,width:px2-px1,top:'50%',transform:'translateY(-50%)',height:12,borderRadius:3,background:prodColor,opacity:.8,display:'flex',alignItems:'center',paddingLeft:4,overflow:'hidden'}}>
                  <span style={{fontSize:8,fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>{fmtD(pStart)}–{fmtD(pEnd)}</span>
                </div>
              )}
            </div>
          </div>
          {isProdOpen&&prod.episodes.map(ep=>{
            const ts=ep.tasks||[];const isOpen=!collapsed[ep.id];
            const s=ts.length?ts.reduce((m,t)=>t.startDate<m?t.startDate:m,ts[0].startDate):null;
            const e=ts.length?ts.reduce((m,t)=>t.endDate>m?t.endDate:m,ts[0].endDate):null;
            const x1=s?Math.max(0,dToX(s)):0;const x2=e?Math.min(totalPx,dToX(e)):0;
            return(<React.Fragment key={ep.id}>
              <div className="lfg-ep-row" onClick={()=>toggleEp(ep.id)} style={{borderLeft:`3px solid ${prodColor}`}}>
                <div className="lfg-ep-label">
                  <span style={{fontSize:9,color:'#aaa',transform:isOpen?'rotate(90deg)':'rotate(0)',display:'inline-block',transition:'transform .15s',flex:'0 0 auto'}}>▶</span>
                  <span style={{flex:1}}>{ep.name}</span>
                  <SBadge v={ep.status} onClick={e=>e.stopPropagation()}/>
                </div>
                <div className="lfg-ep-timeline" style={{minWidth:totalPx}}>
                  {todayX>=0&&todayX<=totalPx&&<div className="lfg-today" style={{left:todayX}}/>}
                  {x2>x1&&x2-x1>0&&<div className="lfg-ep-spine" style={{left:x1,width:x2-x1,background:prodColor+'44',border:`1px solid ${prodColor}66`}}/>}
                  <span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#bbb',fontWeight:600}}>{fmtD(ep.dueDate)}</span>
                </div>
              </div>
              {isOpen&&ts.map(task=>{
                const td=taskDef(task.name);const tx1=Math.max(0,dToX(task.startDate));const tx2=Math.min(totalPx,dToX(task.endDate));const w=tx2-tx1;
                const isDone=task.status==='Done';const isIP=task.status==='In Progress';
                return(<div key={task.id} className="lfg-task-row" style={{borderLeft:`3px solid ${prodColor}44`}}>
                  <div className="lfg-task-label"><span style={{width:8,height:8,borderRadius:2,background:td.color,display:'inline-block',flex:'0 0 8px'}}/><span>{task.name}</span>{task.assignee&&<span style={{marginLeft:'auto',fontSize:9,color:'#bbb',fontWeight:600}}>{task.assignee.split(' ')[0]}</span>}</div>
                  <div className="lfg-task-timeline" style={{minWidth:totalPx}}>
                    {todayX>=0&&todayX<=totalPx&&<div className="lfg-today" style={{left:todayX}}/>}
                    {w>0&&(<div className="lfg-task-bar" style={{left:tx1,width:w,background:isDone?td.color+'dd':isIP?td.color+'55':'#f0f0f0',border:`1px solid ${td.color}${isDone?'cc':isIP?'88':'33'}`}} title={`${task.name}: ${task.status} (${task.pct}%)`}>
                      {isIP&&task.pct>0&&<div className="lfg-bar-fill" style={{width:`${task.pct}%`,background:td.color}}/>}
                      <div className="lfg-bar-label" style={{color:isDone?'#fff':isIP?td.color:'#bbb'}}>{w>55?task.name:''}</div>
                    </div>)}
                  </div>
                </div>);
              })}
            </React.Fragment>);
          })}
        </React.Fragment>);
      })}
    </div></div>
  </div>);
}


// ── Master Gantt Pipeline View (for projects from Master Gantt) ────────────
function MasterGanttPipeline({proj}){
  if(!proj)return null;
  const allTasks=proj.episodes.flatMap(ep=>ep.tasks||[]);
  const taskTypes=TASK_DEFS.map(td=>td.name);
  const stageAvg=taskName=>{
    const tasks=allTasks.filter(t=>t.name===taskName);
    if(!tasks.length)return 0;
    return Math.round(tasks.reduce((s,t)=>s+(t.status==='Done'?100:t.status==='In Progress'?t.pct||50:0),0)/tasks.length);
  };
  const totalPct=Math.round(taskTypes.reduce((s,n)=>s+stageAvg(n),0)/taskTypes.length);
  const doneEps=proj.episodes.filter(ep=>ep.tasks?.every(t=>t.status==='Done')).length;
  return(<div>
    <div className="lf-hdr-card">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div>
          <div className="lf-title">{proj.code} — {proj.name}</div>
          <div className="lf-meta">{proj.type} · {proj.client}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:26,fontWeight:900,color:'#111',fontFamily:'DM Mono,monospace'}}>{totalPct}%</div>
          <div style={{fontSize:9,color:'#aaa',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700}}>Complete</div>
        </div>
      </div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        {[{v:proj.episodes.length,l:'Episodes'},{v:doneEps,l:'Delivered'},{v:proj.episodes.length-doneEps,l:'Remaining'}].map(s=>(
          <div key={s.l} className="lf-stat"><div className="lf-stat-val">{s.v}</div><div className="lf-stat-lbl">{s.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:2,marginTop:14,alignItems:'center',flexWrap:'wrap'}}>
        {TASK_DEFS.map((td,i)=>(
          <React.Fragment key={td.name}>
            {i>0&&<span style={{fontSize:10,color:'#ccc',margin:'0 1px',marginBottom:10}}>→</span>}
            <div className="lf-stage">
              <div className="lf-stage-name" style={{fontSize:8}}>{td.abbr}</div>
              <div className="lf-stage-bar"><div className="lf-stage-fill" style={{width:`${stageAvg(td.name)}%`,background:td.color}}/></div>
              <div className="lf-stage-pct">{stageAvg(td.name)}%</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
    <div className="ep-table">
      <div className="ep-head">
        <div className="ep-th ep-th-name">Episode</div>
        {TASK_DEFS.map(td=><div key={td.name} className="ep-th ep-th-stage" style={{color:td.color,fontSize:9}}>{td.abbr}</div>)}
        <div className="ep-th ep-th-status">Status</div>
      </div>
      {proj.episodes.map(ep=>{
        const epDone=ep.tasks?.every(t=>t.status==='Done');
        const epIP=ep.tasks?.some(t=>t.status==='In Progress');
        const epStatus=epDone?'Done':epIP?'In Progress':'Not Started';
        return(<div key={ep.id} className="ep-row">
          <div className="ep-name">{ep.name}</div>
          {TASK_DEFS.map(td=>{
            const task=ep.tasks?.find(t=>t.name===td.name);
            const pct=!task?0:task.status==='Done'?100:task.status==='In Progress'?task.pct||50:0;
            return(<div key={td.name} className="ep-stage">
              <div className="ep-stg-bar"><div className="ep-stg-fill" style={{width:`${pct}%`,background:td.color}}/></div>
              <div className="ep-stg-pct">{pct}%</div>
            </div>);
          })}
          <div className="ep-status"><SBadge v={epStatus}/></div>
        </div>);
      })}
    </div>
  </div>);
}

function LongformPipeline({prod,onUpdate,prodId}){
  if(!prod)return null;
  const stageAvg=s=>Math.round(prod.episodes.reduce((sum,e)=>sum+(e.stages[s]||0),0)/Math.max(prod.episodes.length,1));
  const doneCount=prod.episodes.filter(e=>e.status==='Done').length;
  const totalPct=Math.round(STAGES.reduce((s,st)=>s+stageAvg(st),0)/STAGES.length);
  const updEpStage=(eid,stage,val)=>onUpdate(lf=>({...lf,productions:lf.productions.map(p=>p.id===prodId?{...p,episodes:p.episodes.map(e=>e.id===eid?{...e,stages:{...e.stages,[stage]:Math.min(100,Math.max(0,parseInt(val)||0))}}:e)}:p)}));
  const updEpStatus=(eid,status)=>onUpdate(lf=>({...lf,productions:lf.productions.map(p=>p.id===prodId?{...p,episodes:p.episodes.map(e=>e.id===eid?{...e,status}:e)}:p)}));
  return(<div>
    <div className="lf-hdr-card">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div><div className="lf-title">{prod.name}</div><div className="lf-meta">{prod.type} · {prod.client} · {prod.engineer}</div></div>
        <div style={{textAlign:'right'}}><div style={{fontSize:26,fontWeight:900,color:'#111',fontFamily:'DM Mono,monospace'}}>{totalPct}%</div><div style={{fontSize:9,color:'#aaa',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700}}>Complete</div></div>
      </div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        {[{v:prod.episodes.length,l:'Episodes'},{v:doneCount,l:'Delivered'},{v:prod.episodes.length-doneCount,l:'Remaining'},{v:fmtCur(prod.budget),l:'Budget'}].map(s=><div key={s.l} className="lf-stat"><div className="lf-stat-val">{s.v}</div><div className="lf-stat-lbl">{s.l}</div></div>)}
      </div>
      <div style={{display:'flex',gap:2,marginTop:14,alignItems:'center'}}>
        {STAGES.map((stage,i)=>(<React.Fragment key={stage}>{i>0&&<span style={{fontSize:10,color:'#ccc',margin:'0 1px',marginBottom:10}}>→</span>}<div className="lf-stage"><div className="lf-stage-name">{stage}</div><div className="lf-stage-bar"><div className="lf-stage-fill" style={{width:`${stageAvg(stage)}%`,background:STAGE_COLORS[i]}}/></div><div className="lf-stage-pct">{stageAvg(stage)}%</div></div></React.Fragment>))}
      </div>
    </div>
    <div className="ep-table">
      <div className="ep-head">
        <div className="ep-th ep-th-name">Episode</div>
        {STAGES.map((s,i)=><div key={s} className="ep-th ep-th-stage" style={{color:STAGE_COLORS[i]}}>{s}</div>)}
        <div className="ep-th ep-th-due">Due</div>
        <div className="ep-th ep-th-status">Status</div>
      </div>
      {prod.episodes.map(ep=>(<div key={ep.id} className="ep-row">
        <div className="ep-name">{ep.name}</div>
        {STAGES.map((stage,i)=>(<div key={stage} className="ep-stage"><div className="ep-stg-bar"><div className="ep-stg-fill" style={{width:`${ep.stages[stage]}%`,background:STAGE_COLORS[i]}}/></div><div className="ep-stg-pct" onClick={()=>{const v=prompt(`${stage} % for "${ep.name}"`,ep.stages[stage]);if(v!==null)updEpStage(ep.id,stage,v)}}>{ep.stages[stage]}%</div></div>))}
        <div className="ep-due">{fmtD(ep.dueDate)||'—'}</div>
        <div className="ep-status"><SBadge v={ep.status} onClick={()=>{const opts=ST.map(s=>s.l);const next=(opts.indexOf(ep.status)+1)%opts.length;updEpStatus(ep.id,opts[next])}}/></div>
      </div>))}
    </div>
  </div>);
}

function LongformView({longform,onUpdate,masterGantt=[]}){
  const defaultId=masterGantt.length?'mg_'+masterGantt[0].id:longform.activeProduction;
  const [activeProd,setActiveProd]=useState(defaultId);
  const [lfView,setLfView]=useState('pipeline');
  // Active item — could be from masterGantt or longform
  const isMasterProj=activeProd?.startsWith('mg_');
  const masterProjId=isMasterProj?activeProd.replace('mg_',''):null;
  const masterProj=masterGantt.find(p=>p.id===masterProjId);
  const prod=isMasterProj?null:longform.productions.find(p=>p.id===activeProd)||longform.productions[0];
  return(<div>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
      <div className="lf-tabs" style={{marginBottom:0,flex:1}}>
        {masterGantt.map(p=><div key={'mg_'+p.id} className={`lf-tab${activeProd==='mg_'+p.id?' active':''}`} onClick={()=>setActiveProd('mg_'+p.id)} style={{borderLeft:'3px solid #5c6bc0'}}>{p.code} {p.name}</div>)}
        {longform.productions.map(p=><div key={p.id} className={`lf-tab${p.id===activeProd?' active':''}`} onClick={()=>setActiveProd(p.id)}>{p.name}</div>)}
        <div className="lf-tab" style={{borderStyle:'dashed'}}>+ New</div>
      </div>
      <div style={{display:'flex',gap:6}}>
        <button className={`lf-vbtn${lfView==='pipeline'?' active':''}`} onClick={()=>setLfView('pipeline')}>⊟ Pipeline</button>
        <button className={`lf-vbtn${lfView==='gantt'?' active':''}`} onClick={()=>setLfView('gantt')}><Icon name="gantt" size={13}/> Gantt</button>
      </div>
    </div>
    {lfView==='pipeline'&&isMasterProj&&<MasterGanttPipeline proj={masterProj}/>}
    {lfView==='pipeline'&&!isMasterProj&&<LongformPipeline prod={prod} prodId={activeProd} onUpdate={onUpdate}/>}
    {lfView==='gantt'&&<LongformGantt longform={longform} activeProd={activeProd} masterGantt={masterGantt}/>}
  </div>);
}

// ── TimeTracker ────────────────────────────────────────────────────────────
function TimeTracker({item,onUpdate}){
  const [running,setRunning]=useState(false);const [elapsed,setElapsed]=useState(0);const [person,setPerson]=useState(PEOPLE[0]);const [note,setNote]=useState('');const [manHrs,setManHrs]=useState('');const [manDate,setManDate]=useState(today());const [manNote,setManNote]=useState('');const [manPerson,setManPerson]=useState(PEOPLE[0]);
  const startRef=useRef(null);const ivRef=useRef(null);
  const fmt=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const start=()=>{setRunning(true);startRef.current=Date.now()-elapsed*1000;ivRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-startRef.current)/1000)),500)};
  const stop=()=>{clearInterval(ivRef.current);setRunning(false);const mins=Math.round(elapsed/60);if(mins>0)onUpdate('timeLogs',[...(item.timeLogs||[]),{id:uid(),date:today(),mins,person,note}]);setElapsed(0);setNote('')};
  const addManual=()=>{const h=parseFloat(manHrs);if(isNaN(h)||h<=0)return;onUpdate('timeLogs',[...(item.timeLogs||[]),{id:uid(),date:manDate,mins:Math.round(h*60),person:manPerson,note:manNote}]);setManHrs('');setManNote('')};
  const del=id=>onUpdate('timeLogs',(item.timeLogs||[]).filter(l=>l.id!==id));
  useEffect(()=>()=>clearInterval(ivRef.current),[]);
  const logs=item.timeLogs||[];const totalMins=logs.reduce((s,l)=>s+(l.mins||0),0);
  return(<div>
    <div style={{background:'#f8f8f8',border:'1px solid #e5e5e5',borderRadius:8,padding:14,marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <div className="timer-display">{fmt(elapsed)}</div>
        {running?<button className="timer-btn" onClick={stop} style={{background:'#fff5f5',borderColor:'#f5c6c6',color:'#c62828'}}>⏹ Stop &amp; Log</button>:<button className="timer-btn" onClick={start} style={{background:'#e8f5e9',borderColor:'#c8e6c9',color:'#2e7d32'}}>▶ Start Timer</button>}
      </div>
      {running&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div><div className="det-label">Engineer</div><select className="m-sel" style={{padding:'6px 8px',fontSize:12,marginBottom:0}} value={person} onChange={e=>setPerson(e.target.value)}>{PEOPLE.map(p=><option key={p}>{p}</option>)}</select></div>
        <div><div className="det-label">Note</div><input className="det-in" style={{fontSize:12}} placeholder="What are you working on?" value={note} onChange={e=>setNote(e.target.value)}/></div>
      </div>}
      <div style={{fontSize:12,color:'#aaa',marginTop:8,fontWeight:600}}>Total logged: <b style={{color:'#333',fontFamily:'DM Mono,monospace'}}>{minsToHrs(totalMins)}h</b></div>
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#aaa',marginBottom:8}}>Log time manually</div>
      <div style={{display:'grid',gridTemplateColumns:'80px 100px 1fr',gap:7,marginBottom:7}}>
        <div><div className="det-label">Hours</div><input className="det-in" type="number" step="0.5" min="0" placeholder="0.5" value={manHrs} onChange={e=>setManHrs(e.target.value)}/></div>
        <div><div className="det-label">Date</div><input className="det-in" type="date" value={manDate} onChange={e=>setManDate(e.target.value)}/></div>
        <div><div className="det-label">Note</div><input className="det-in" placeholder="Session note..." value={manNote} onChange={e=>setManNote(e.target.value)}/></div>
      </div>
      <div style={{display:'flex',gap:7}}><select className="m-sel" style={{flex:1,padding:'6px 8px',fontSize:12,marginBottom:0}} value={manPerson} onChange={e=>setManPerson(e.target.value)}>{PEOPLE.map(p=><option key={p}>{p}</option>)}</select><button className="btn-p" onClick={addManual} style={{padding:'7px 14px',fontSize:12}}>Log time</button></div>
    </div>
    {logs.length>0&&<div>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#aaa',marginBottom:8}}>Time log</div>
      <div style={{background:'#f8f8f8',borderRadius:7,padding:'4px 10px'}}>
        {[...logs].reverse().map(l=><div key={l.id} className="time-log-row">
          <span className="tl-hrs">{minsToHrs(l.mins)}h</span>
          <span style={{fontSize:11,color:'#bbb',fontWeight:500}}>{fmtD(l.date)}</span>
          <span className="pav" style={{background:pColor(l.person),width:20,height:20,fontSize:8}}>{inits(l.person)}</span>
          <span style={{flex:1,fontSize:11,color:'#777',fontWeight:500}}>{l.note||'—'}</span>
          <button className="tl-del" onClick={()=>del(l.id)}>×</button>
        </div>)}
      </div>
    </div>}
  </div>);
}

// ── Gantt Project Row (needs its own component for useState) ──────────────
function GanttProjectRow({proj,board,setBoard}){
  const [open,setOpen]=useState(false);
  const allTasks=proj.episodes.flatMap(ep=>ep.tasks);
  const done=allTasks.filter(t=>t.status==='Done').length;
  const ip=allTasks.filter(t=>t.status==='In Progress').length;
  const pct=allTasks.length?Math.round(done/allTasks.length*100):0;
  const status=done===allTasks.length?'Done':ip>0?'In Progress':'Not Started';
  return(
    <div style={{background:'#fff',border:'1px solid #eee',borderRadius:8,marginBottom:8,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',userSelect:'none'}} onClick={()=>setOpen(p=>!p)}>
        <span style={{fontSize:9,color:'#bbb',transform:open?'rotate(90deg)':'rotate(0)',display:'inline-block',transition:'transform .15s',flexShrink:0}}>▶</span>
        <span className="gantt-sync-badge" style={{flexShrink:0}}>{proj.code}</span>
        <span style={{fontWeight:700,fontSize:13,color:'#111',flex:1}}>{proj.name}</span>
        <span style={{fontSize:11,color:'#888',fontWeight:500}}>{proj.client}</span>
        <span style={{fontSize:11,fontWeight:700,color:status==='Done'?'#2e7d32':status==='In Progress'?'#1565c0':'#888'}}>{status}</span>
        <div style={{width:80,height:5,background:'#f0f0f0',borderRadius:3,overflow:'hidden',flexShrink:0}}>
          <div style={{height:'100%',width:pct+'%',background:pct===100?'#43a047':'#5c6bc0',borderRadius:3,transition:'width .3s'}}/>
        </div>
        <span style={{fontSize:11,color:'#aaa',fontWeight:600,flexShrink:0,minWidth:28}}>{pct}%</span>
      </div>
      {open&&(
        <div style={{borderTop:'1px solid #f5f5f5',padding:'8px 14px 12px'}}>
          {proj.episodes.map(ep=>{
            const epDone=ep.tasks.filter(t=>t.status==='Done').length;
            const epIP=ep.tasks.filter(t=>t.status==='In Progress').length;
            const epPct=ep.tasks.length?Math.round(epDone/ep.tasks.length*100):0;
            return(
              <div key={ep.id} style={{marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:'#555',minWidth:60}}>{ep.name}</span>
                  <div style={{flex:1,height:4,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:epPct+'%',background:epPct===100?'#43a047':epIP>0?'#5c6bc0':'#e0e0e0',borderRadius:2,transition:'width .3s'}}/>
                  </div>
                  <span style={{fontSize:10,color:'#aaa',fontWeight:600,flexShrink:0}}>{epDone}/{ep.tasks.length}</span>
                </div>
                <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                  {ep.tasks.map(t=>{
                    const td=taskDef(t.name);
                    const isDone=t.status==='Done';
                    const isIP=t.status==='In Progress';
                    return(
                      <span key={t.id} title={`${t.name}: ${t.status}${t.assignee?' — '+t.assignee:''}`}
                        style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,
                          background:isDone?td.color:isIP?td.color+'44':'#f5f5f5',
                          color:isDone?'#fff':isIP?td.color:'#bbb',
                          border:`1px solid ${isDone||isIP?td.color:'#e5e5e5'}`,
                          letterSpacing:'.03em'}}>
                        {td.abbr||t.name.slice(0,3).toUpperCase()}{isDone&&' ✓'}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{marginTop:6}}>
            <button onClick={()=>setBoard('__master__')} style={{background:'none',border:'1px solid #ddd',borderRadius:5,padding:'4px 10px',fontSize:11,fontWeight:600,color:'#8e24aa',cursor:'pointer'}}>
              Open in Gantt →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
let ENGINEER_SKILLS=DEFAULT_ENGINEER_SKILLS;

// ── Modals ─────────────────────────────────────────────────────────────────
function AddColModal({onAdd,onClose}){const [name,setName]=useState('');const [type,setType]=useState('text');const TYPES=[{t:'text',l:'Text'},{t:'status',l:'Status'},{t:'priority',l:'Priority'},{t:'person',l:'Person'},{t:'date',l:'Date'},{t:'number',l:'Number'},{t:'currency',l:'Currency ($)'}];return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><h3>Add column</h3><label>Name</label><input className="m-in" placeholder="Column name" value={name} onChange={e=>setName(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&name&&onAdd(name,type)}/><label>Type</label><select className="m-sel" value={type} onChange={e=>setType(e.target.value)}>{TYPES.map(c=><option key={c.t} value={c.t}>{c.l}</option>)}</select><div className="m-actions"><button className="btn-g" onClick={onClose}>Cancel</button><button className="btn-p" onClick={()=>name&&onAdd(name,type)}>Add</button></div></div></div>);}
function AddBoardModal({onAdd,onClose}){const ICONS=['folder','mic','clapper','gantt','people','money','calendar','wrench','note','lightning','fader','console','headphones','files'];const [name,setName]=useState('');const [icon,setIcon]=useState('folder');return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><h3>New board</h3><label>Name</label><input className="m-in" placeholder="Board name" value={name} onChange={e=>setName(e.target.value)} autoFocus/><label>Icon</label><div className="icon-grid">{ICONS.map(ic=><span key={ic} className={`icon-opt${icon===ic?' sel':''}`} onClick={()=>setIcon(ic)} title={ic}><Icon name={ic} size={16}/></span>)}</div><div className="m-actions"><button className="btn-g" onClick={onClose}>Cancel</button><button className="btn-p" onClick={()=>name&&onAdd(name,icon)}>Create</button></div></div></div>);}

function AddCustomSkill({onAdd}){
  const [val,setVal]=useState('');
  const SKILL_COLORS=['#d32f2f','#1565c0','#2e7d32','#546e7a','#bf360c','#283593','#6a1b9a','#e65100','#f9a825','#00838f'];
  const add=()=>{
    const v=val.trim();if(!v)return;
    const id=v.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now();
    const color=SKILL_COLORS[Math.floor(Math.random()*SKILL_COLORS.length)];
    onAdd({id,label:v,color});setVal('');
  };
  return(
    <div style={{display:'flex',gap:6,marginTop:8,alignItems:'center'}}>
      <input className="m-in" style={{marginBottom:0,fontSize:11,flex:1}} placeholder="Add custom skill…" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
      <button onClick={add} style={{background:'#111',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,padding:'6px 12px',cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>+ Add</button>
    </div>
  );
}

function AddEngineerModal({onAdd,onClose,editItem,skillsList,onAddSkill}){
  const skills_=skillsList||DEFAULT_ENGINEER_SKILLS;
  const [name,setName]=useState(editItem?.name||'');
  const [role,setRole]=useState(editItem?.values?.c2||'');
  const [rate,setRate]=useState(editItem?.values?.c3||'');
  const [bookedFrom,setBookedFrom]=useState(editItem?.values?.c4||'');
  const [bookedTo,setBookedTo]=useState(editItem?.values?.c5||'');
  const [engType,setEngType]=useState(editItem?._type||'staff');
  const [notes,setNotes]=useState(editItem?.notes||'');
  const [skills,setSkills]=useState(editItem?.skills||{});
  const toggleSkill=id=>setSkills(p=>({...p,[id]:!p[id]}));
  const isStaff=engType==='staff';
  const activeCount=skills_.filter(s=>skills[s.id]).length;

  const save=()=>{
    if(!name.trim())return;
    onAdd({
      id:editItem?.id||uid(),
      name:name.trim(),notes,startDate:'',
      timeLogs:editItem?.timeLogs||[],
      skills,_type:engType,
      _group:isStaff?'Staff':'Freelancers',
      values:{
        c1:editItem?.values?.c1||'Available',
        c2:role,
        c3:isStaff?null:(parseFloat(rate)||null),
        c4:bookedFrom||'',
        c5:bookedTo||'',
      }
    });
  };

  return(
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" style={{width:500,maxHeight:'88vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <h3 style={{margin:0}}>{editItem?'Edit Engineer':'Add Engineer'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,color:'#bbb',cursor:'pointer'}}>×</button>
        </div>

        {/* Staff / Freelancer toggle */}
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {[['staff','Staff'],['freelancer','Freelancer']].map(([t,l])=>(
            <div key={t} onClick={()=>setEngType(t)}
              style={{flex:1,padding:'8px 12px',borderRadius:7,border:`2px solid ${engType===t?'#111':'#e5e5e5'}`,background:engType===t?'#111':'#fff',color:engType===t?'#fff':'#555',fontSize:12,fontWeight:700,cursor:'pointer',textAlign:'center',transition:'all .13s'}}>
              {l}
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
          <div>
            <label>Full Name</label>
            <input className="m-in" placeholder="e.g. Alex Rodriguez" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
          </div>
          <div>
            <label>Role / Title</label>
            <input className="m-in" placeholder="e.g. Sound Editor" value={role} onChange={e=>setRole(e.target.value)}/>
          </div>
          {!isStaff&&(
            <div>
              <label>Day Rate ($)</label>
              <input className="m-in" type="number" placeholder="750" value={rate} onChange={e=>setRate(e.target.value)}/>
            </div>
          )}
        </div>

        {/* Booking date range */}
        <div style={{background:'#f8f8f8',borderRadius:8,padding:'10px 12px',marginBottom:12,border:'1px solid #eee'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Current Booking (optional)</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#999',marginBottom:4,display:'block',textTransform:'uppercase',letterSpacing:'.06em'}}>From</label>
              <input className="m-in" type="date" style={{marginBottom:0}} value={bookedFrom} onChange={e=>setBookedFrom(e.target.value)}/>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#999',marginBottom:4,display:'block',textTransform:'uppercase',letterSpacing:'.06em'}}>To</label>
              <input className="m-in" type="date" style={{marginBottom:0}} value={bookedTo} onChange={e=>setBookedTo(e.target.value)}/>
            </div>
          </div>
          {bookedFrom&&bookedTo&&<div style={{fontSize:11,color:'#888',marginTop:5,fontWeight:500}}>Booked for {daysBetween(bookedFrom,bookedTo)} days</div>}
        </div>

        {/* Skills */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>
            Skills <span style={{color:'#bbb',fontWeight:500}}>({activeCount}/{skills_.length})</span>
          </div>
          <div style={{fontSize:11,color:'#888',fontWeight:500,marginBottom:8}}>Tick tasks this engineer can handle — used by AI for conflict resolution</div>
          <div className="skills-grid">
            {skills_.map(s=>(
              <div key={s.id} className={`skill-check${skills[s.id]?' active':''}`} onClick={()=>toggleSkill(s.id)}>
                <input type="checkbox" checked={!!skills[s.id]} onChange={()=>toggleSkill(s.id)} onClick={e=>e.stopPropagation()}/>
                <span className="skill-check-label">{s.label}</span>
              </div>
            ))}
          </div>
          {activeCount>0&&(
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:8}}>
              {skills_.filter(s=>skills[s.id]).map(s=>(
                <span key={s.id} style={{fontSize:9,fontWeight:700,background:s.color+'22',color:s.color,padding:'2px 7px',borderRadius:10}}>{s.label}</span>
              ))}
            </div>
          )}
          {/* Add custom skill */}
          <AddCustomSkill onAdd={skill=>{if(onAddSkill)onAddSkill(skill);toggleSkill(skill.id);}}/>
        </div>

        <div style={{marginBottom:4}}>
          <label>Notes</label>
          <textarea className="m-in" style={{minHeight:54,resize:'vertical'}} placeholder="Contact details, notes..." value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>

        <div className="m-actions">
          <button className="btn-g" onClick={onClose}>Cancel</button>
          <button className="btn-p" onClick={save} disabled={!name.trim()} style={{opacity:name.trim()?1:.5}}>
            {editItem?'Save Changes':'Add Engineer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ItemDetail ─────────────────────────────────────────────────────────────
const POST_STAGES_DEF=[
  {id:'dialogueEdit', label:'Dialogue Edit',  color:'#d32f2f'},
  {id:'musicEdit',    label:'Music Edit',     color:'#1565c0'},
  {id:'sfxEdit',      label:'SFX Edit',       color:'#2e7d32'},
  {id:'backgrounds',  label:'Backgrounds',    color:'#546e7a'},
  {id:'preReMix',     label:'Pre Mix',        color:'#bf360c'},
  {id:'finalMix',     label:'Final Mix',      color:'#283593'},
  {id:'revisions',    label:'Revisions',      color:'#6a1b9a'},
  {id:'qcChanges',    label:'QC Changes',     color:'#e65100'},
  {id:'deliverables', label:'Deliverables',   color:'#f9a825'},
];

function ProjectSettings({item,engineers,onUpdate}){
  const alloc=item.stageAlloc||{};
  const setAlloc=(stageId,field,val)=>onUpdate('stageAlloc',{...alloc,[stageId]:{...(alloc[stageId]||{}),[field]:val}});
  const totalDays=POST_STAGES_DEF.reduce((s,st)=>s+(parseFloat(alloc[st.id]?.days)||0),0);
  return(
    <div className="proj-settings" style={{paddingBottom:4}}>
      <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Time Allocation per Stage</div>
      <div style={{display:'flex',gap:6,fontSize:10,fontWeight:700,color:'#bbb',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5,paddingLeft:2}}>
        <div style={{flex:1}}>Stage</div>
        <div style={{width:60,textAlign:'center'}}>Days</div>
        <div style={{width:110}}>Assigned Engineer</div>
      </div>
      {POST_STAGES_DEF.map(stage=>{
        const row=alloc[stage.id]||{};
        const engOpts=['',... (engineers||[])];
        return(
          <div key={stage.id} className="ps-row">
            <div className="ps-stage">
              <span className="ps-dot" style={{background:stage.color}}/>
              {stage.label}
            </div>
            <input type="number" min="0" step="0.5" className="ps-in"
              placeholder="0"
              value={row.days||''}
              onChange={e=>setAlloc(stage.id,'days',e.target.value)}/>
            <select className="ps-sel" value={row.engineer||''} onChange={e=>setAlloc(stage.id,'engineer',e.target.value)}>
              <option value="">— TBC</option>
              {engOpts.filter(Boolean).map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        );
      })}
      <div className="ps-total">
        <span>Total allocated</span>
        <span style={{fontWeight:800,fontSize:16,color:'#111'}}>{totalDays} days</span>
      </div>
      {item.values?.c4&&(
        <div style={{fontSize:11,color:'#888',fontWeight:500,marginTop:8}}>
          Due: {item.values.c4}
          {totalDays>0&&item.startDate&&<span style={{marginLeft:8,color:'#5c6bc0',fontWeight:600}}>
            {Math.round(totalDays/5)} weeks of work
          </span>}
        </div>
      )}
    </div>
  );
}

function ItemDetail({boards,sel,onClose,onUpdate,engineers,skillsList}){
  const [tab,setTab]=useState('fields');if(!sel)return null;
  const {bid,gid,iid}=sel;const board=boards.find(b=>b.id===bid);if(!board)return null;
  const group=board.groups.find(g=>g.id===gid);if(!group)return null;
  const item=group.items.find(i=>i.id===iid);if(!item)return null;
  const upd=(field,val)=>onUpdate(bid,p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,items:g.items.map(i=>i.id===iid?{...i,[field]:val}:i)}:g)}));
  const updVal=(cid,val)=>onUpdate(bid,p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,items:g.items.map(i=>i.id===iid?{...i,values:{...i.values,[cid]:val}}:i)}:g)}));
  const del=()=>{onUpdate(bid,p=>({...p,groups:p.groups.map(g=>g.id===gid?{...g,items:g.items.filter(i=>i.id!==iid)}:g)}));onClose()};
  const totalLogged=(item.timeLogs||[]).reduce((s,l)=>s+(l.mins||0),0);

  const isEngineerBoard=board.id==='b3';
  const isActiveProjects=board.id==='b1';

  // Build tabs based on board type
  const tabs=[
    {id:'fields',l:'Fields'},
    ...(isEngineerBoard?[{id:'skills',l:'Skills'}]:[]),
    ...(isActiveProjects?[{id:'settings',l:'Project Settings'}]:[]),
    {id:'time',l:'Time Tracking'},
    {id:'timeline',l:'Timeline'},
    {id:'notes',l:'Notes'},
  ];

  return(<div className="overlay" onClick={onClose}><div className="detail" onClick={e=>e.stopPropagation()}>
    <div className="det-hdr">
      <button className="det-close" onClick={onClose}>×</button>
      <input className="det-title" value={item.name} onChange={e=>upd('name',e.target.value)} placeholder="Item name"/>
      <div className="det-sub">{board.name} / {group.name}{totalLogged>0&&<span style={{marginLeft:10,color:'#5c6bc0',fontWeight:600}}>⏱ {minsToHrs(totalLogged)}h</span>}</div>
    </div>
    <div className="det-tabs">{tabs.map(t=><div key={t.id} className={`det-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.l}</div>)}</div>
    <div className="det-body">
      {tab==='fields'&&<>
        <div className="det-grid">{board.columns.map(col=><div key={col.id} className="det-field"><div className="det-label">{col.name}</div><Cell col={col} value={item.values[col.id]} onChange={v=>updVal(col.id,v)}/></div>)}</div>
        {isEngineerBoard&&item.skills&&(
          <div style={{marginTop:10}}>
            <div className="det-label" style={{marginBottom:6}}>Skills</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {(skillsList||DEFAULT_ENGINEER_SKILLS).filter(s=>item.skills[s.id]).map(s=>(
                <span key={s.id} className="eng-skill-pill" style={{background:s.color+'22',color:s.color}}>{s.label}</span>
              ))}
              {!(skillsList||DEFAULT_ENGINEER_SKILLS).some(s=>item.skills[s.id])&&<span style={{fontSize:11,color:'#bbb',fontWeight:500}}>No skills set — open Skills tab to configure</span>}
            </div>
          </div>
        )}
        <hr className="det-div"/><button className="btn-del" onClick={del}>Delete item</button>
      </>}
      {tab==='skills'&&isEngineerBoard&&(
        <div>
          <div style={{fontSize:12,color:'#888',fontWeight:500,marginBottom:12,lineHeight:1.5}}>
            Tick which tasks this engineer can handle. The AI uses this when resolving scheduling conflicts.
          </div>
          <div className="skills-grid">
            {(skillsList||DEFAULT_ENGINEER_SKILLS).map(s=>{
              const active=!!(item.skills||{})[s.id];
              return(
                <div key={s.id} className={`skill-check${active?' active':''}`}
                  onClick={()=>upd('skills',{...(item.skills||{}),[s.id]:!active})}>
                  <input type="checkbox" checked={active} onChange={()=>{}} onClick={e=>e.stopPropagation()}/>
                  <span className="skill-check-label">{s.label}</span>
                  {s.id.startsWith('custom_')&&<span style={{marginLeft:'auto',fontSize:9,color:'#bbb',fontWeight:600}}>custom</span>}
                </div>
              );
            })}
          </div>
          <div style={{marginTop:10,fontSize:11,color:'#aaa',fontWeight:500}}>
            {(skillsList||DEFAULT_ENGINEER_SKILLS).filter(s=>(item.skills||{})[s.id]).length} of {(skillsList||DEFAULT_ENGINEER_SKILLS).length} skills selected
          </div>
        </div>
      )}
      {tab==='settings'&&isActiveProjects&&(
        <ProjectSettings item={item} engineers={engineers||[]} onUpdate={upd}/>
      )}
      {tab==='time'&&<TimeTracker item={item} onUpdate={upd}/>}
      {tab==='timeline'&&<div>
        <div style={{marginBottom:14}}><div className="det-label">Start Date</div><input type="date" className="det-in" value={item.startDate||''} onChange={e=>upd('startDate',e.target.value)}/></div>
        <div style={{marginBottom:14}}><div className="det-label">End / Due Date</div>{board.columns.filter(c=>c.type==='date').map(c=><div key={c.id} style={{marginBottom:7}}><div style={{fontSize:11,color:'#bbb',marginBottom:3,fontWeight:600}}>{c.name}</div><Cell col={c} value={item.values[c.id]} onChange={v=>updVal(c.id,v)}/></div>)}</div>
        {item.startDate&&board.columns.find(c=>c.type==='date')&&item.values[board.columns.find(c=>c.type==='date').id]&&<div style={{background:'#f5f5f5',borderRadius:7,padding:12,fontSize:12,color:'#888',fontWeight:600}}>Duration: <b style={{color:'#333'}}>{daysBetween(item.startDate,item.values[board.columns.find(c=>c.type==='date').id])} days</b></div>}
      </div>}
      {tab==='notes'&&<textarea className="det-notes" style={{minHeight:200}} value={item.notes||''} placeholder="Add session notes, delivery specs, links..." onChange={e=>upd('notes',e.target.value)}/>}
    </div>
  </div></div>);
}

// ── Studio Rooms Panel ─────────────────────────────────────────────────────
function StudioRooms({rooms,onUpdateRoom}){
  if(!rooms||!rooms.length)return null;
  const STATUS_COLOR={free:'#43a047',booked:'#fb8c00',occupied:'#e53935'};
  return(
    <div className="studio-rooms">
      {rooms.map(room=>(
        <div key={room.id} className={`studio-room ${room.status}`}>
          <div className="studio-room-name">{room.name}</div>
          <div style={{fontSize:9,color:'#aaa',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{room.type}</div>
          <div className="studio-room-dot" style={{background:STATUS_COLOR[room.status]||'#aaa'}}/>
          <div style={{fontSize:10,fontWeight:700,color:STATUS_COLOR[room.status],textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>
            {room.status==='occupied'?'In Use':room.status==='booked'?'Booked':'Free'}
          </div>
          <div className="studio-room-project">{room.project||'—'}</div>
        </div>
      ))}
    </div>
  );
}

// ── Conflict Resolution Modal ──────────────────────────────────────────────
function ConflictResolutionModal({conflicts,ganttData,engineers,onApply,onClose}){
  const [stage,setStage]=useState('list');// list | loading | suggestions
  const [suggestions,setSuggestions]=useState([]);
  const [approved,setApproved]=useState({});
  const [rejected,setRejected]=useState({});

  // Task name → required skill ID mapping
  const TASK_SKILL_MAP={
    'Ingest':      null,          // any engineer can ingest
    'DX Edit':     'dialogueEdit',
    'MX Edit':     'musicEdit',
    'SFX Edit':    'sfxEdit',
    'Backgrounds': 'backgrounds',
    'Pre Mix':     'preMix',
    'Final Mix':   'finalMix',
    'QC':          'qcChanges',
    'Delivery':    'deliverables',
  };

  const getSuggestions=()=>{
    setStage('loading');

    // Build a flat list of all active tasks with project/episode context
    const allTasks=[];
    ganttData.forEach(proj=>proj.episodes.forEach(ep=>ep.tasks.forEach(t=>{
      if(t.status!=='Done') allTasks.push({...t,projName:proj.name,epName:ep.name,projCode:proj.code});
    })));

    // Build per-engineer schedule: name → [{startDate,endDate,taskRef}]
    const scheduleOf={};
    allTasks.forEach(t=>{
      if(!t.assignee)return;
      if(!scheduleOf[t.assignee])scheduleOf[t.assignee]=[];
      scheduleOf[t.assignee].push({s:t.startDate,e:t.endDate,ref:t});
    });

    // Helper: do two date ranges overlap?
    const overlaps=(s1,e1,s2,e2)=>s1<=e2&&s2<=e1;

    // Helper: is engineer available on dates (ignoring a specific task ref)?
    const isAvailable=(name,startDate,endDate,excludeRef)=>{
      const slots=scheduleOf[name]||[];
      return!slots.some(sl=>sl.ref!==excludeRef&&overlaps(startDate,endDate,sl.s,sl.e));
    };

    // Helper: does engineer have required skill?
    const hasSkill=(eng,taskName)=>{
      const reqSkill=TASK_SKILL_MAP[taskName];
      if(!reqSkill)return true; // no skill requirement (e.g. Ingest)
      const skills=eng.skills||{};
      return typeof skills==='object'&&!Array.isArray(skills)?!!skills[reqSkill]:false;
    };

    // Helper: is engineer blocked by their booking dates?
    const notBlockedByBooking=(eng,startDate,endDate)=>{
      const bf=eng.values?.c4;const bt=eng.values?.c5;
      if(!bf||!bt)return true; // no booking dates set = available
      return!overlaps(startDate,endDate,bf,bt);
    };

    // Score engineer for a task: lower = better
    // Staff preferred over freelancer; fewer active tasks = better
    const scoreEng=(eng,taskName)=>{
      const taskCount=(scheduleOf[eng.name]||[]).length;
      const typeScore=eng._type==='staff'?0:100;
      return typeScore+taskCount;
    };

    // Find conflicts and resolve them
    const results=[];
    // Track assignments we've already changed this session (simulate forward)
    const simulatedSchedule=JSON.parse(JSON.stringify(scheduleOf));

    // Re-check availability using simulated schedule
    const simAvailable=(name,startDate,endDate,excludeRef)=>{
      const slots=simulatedSchedule[name]||[];
      return!slots.some(sl=>sl.ref!==excludeRef&&overlaps(startDate,endDate,sl.s,sl.e));
    };

    conflicts.forEach(conflictStr=>{
      // Parse conflict string: "EngineerName double-booked: projA taskA (s1–e1) vs projB taskB (s2–e2)"
      const nameMatch=conflictStr.match(/^(.+?) double-booked:/);
      if(!nameMatch)return;
      const conflictedEng=nameMatch[1].trim();

      // Find the two conflicting tasks
      const taskRefs=allTasks.filter(t=>{
        if(t.assignee!==conflictedEng)return false;
        // Check if this task is mentioned in the conflict string
        return conflictStr.includes(t.projName)&&conflictStr.includes(t.name)&&conflictStr.includes(t.startDate);
      });
      if(taskRefs.length<2)return;

      // Try to reassign the second task (keep first, reassign second)
      const taskToMove=taskRefs[1];
      const reqSkill=TASK_SKILL_MAP[taskToMove.name];

      // Find best available alternative engineer
      const candidates=(engineers||[])
        .filter(eng=>eng.name!==conflictedEng)
        .filter(eng=>hasSkill(eng,taskToMove.name))
        .filter(eng=>notBlockedByBooking(eng,taskToMove.startDate,taskToMove.endDate))
        .filter(eng=>simAvailable(eng.name,taskToMove.startDate,taskToMove.endDate,null))
        .sort((a,b)=>scoreEng(a,taskToMove.name)-scoreEng(b,taskToMove.name));

      if(candidates.length===0){
        results.push({
          conflictSummary:conflictStr,
          icon:'warning',
          title:`No available engineer for ${taskToMove.projCode} ${taskToMove.name}`,
          reason:`All engineers with ${reqSkill||'required'} skill are occupied on ${taskToMove.startDate}–${taskToMove.endDate}. Consider adjusting dates.`,
          changeType:'manual',before:conflictedEng,after:'TBC',
          freelancerName:null,freelancerNote:null,ganttChange:null
        });
        return;
      }

      const best=candidates[0];
      const skillLabel=reqSkill||'general';
      const typeLabel=best._type==='staff'?'Staff':'Freelancer';

      results.push({
        conflictSummary:conflictStr,
        icon:'refresh',
        title:`Reassign ${taskToMove.projCode} ${taskToMove.name} → ${best.name}`,
        reason:`${best.name} (${typeLabel}) has ${skillLabel} skill and is free ${taskToMove.startDate}–${taskToMove.endDate}.`,
        changeType:'reassign',
        before:conflictedEng,
        after:best.name,
        freelancerName:best._type==='freelancer'?best.name:null,
        freelancerNote:best._type==='freelancer'?`Day rate: $${best.values?.c3||'TBC'}`:null,
        ganttChange:{projName:taskToMove.projName,epName:taskToMove.epName,taskName:taskToMove.name,field:'assignee',value:best.name}
      });

      // Update simulated schedule so next conflict sees this change
      if(!simulatedSchedule[best.name])simulatedSchedule[best.name]=[];
      simulatedSchedule[best.name].push({s:taskToMove.startDate,e:taskToMove.endDate,ref:taskToMove});
      simulatedSchedule[conflictedEng]=(simulatedSchedule[conflictedEng]||[]).filter(sl=>sl.ref!==taskToMove);
    });

    setSuggestions(results);
    setStage('suggestions');
  };

  const applyApproved=()=>{
    const toApply=suggestions.filter((_,i)=>approved[i]&&!rejected[i]);
    toApply.forEach(sug=>{
      if(!sug.ganttChange)return;
      onApply(sug.ganttChange);
    });
    onClose();
  };

  const approvedCount=Object.values(approved).filter(Boolean).length;

  return(
    <div className="modal-ov" onClick={onClose}>
      <div className="cr-modal" onClick={e=>e.stopPropagation()}>
        <div className="cr-hdr">
          <div className="cr-title">
            <Icon name="warning" size={16}/>
            <span>Schedule Conflicts</span>
            <span className="ai-badge" style={{background:"#e8f5e9",color:"#2e7d32"}}><Icon name="lightning" size={11}/> Auto</span>
            <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',fontSize:20,color:'#bbb',cursor:'pointer',lineHeight:1,padding:0}}>×</button>
          </div>
          <div style={{fontSize:12,color:'#888',fontWeight:500,marginTop:4}}>
            {conflicts.length} conflict{conflicts.length!==1?'s':''} detected — engineers double-booked on the same dates
          </div>
        </div>

        <div className="cr-body">
          {stage==='list'&&(<>
            <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Detected Conflicts</div>
            {conflicts.slice(0,12).map((c,i)=><div key={i} className="conflict-item"><Icon name="lightning" size={11}/> {c}</div>)}
            {conflicts.length>12&&<div style={{fontSize:11,color:'#aaa',fontWeight:500,marginBottom:8}}>+{conflicts.length-12} more conflicts…</div>}
          </>)}

          {stage==='loading'&&(
            <div style={{textAlign:'center',padding:'40px 0'}}>
              <div style={{marginBottom:14}}><Icon name="waveform" size={40} style={{color:'#bbb'}}/></div>
              <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:6}}>Analysing schedule…</div>
              <div style={{fontSize:12,color:'#aaa',fontWeight:500}}>Checking engineer workloads, skills and availability</div>
              <div style={{width:200,height:3,background:'#e5e5e5',borderRadius:3,margin:'18px auto 0',overflow:'hidden'}}>
                <div style={{height:'100%',width:'60%',background:'#111',borderRadius:3,animation:'pulse 1.2s ease-in-out infinite'}}/>
              </div>
            </div>
          )}

          {stage==='suggestions'&&(<>
            <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>AI Suggestions — Review and Approve</div>
            {suggestions.map((sug,i)=>(
              <div key={i} className={`suggestion-card${approved[i]?' approved':rejected[i]?' rejected':''}`}>
                <div className="sug-header">
                  <div className="sug-icon">{sug.icon==='warning'?<Icon name="warning" size={18}/>:<Icon name="refresh" size={18}/>}</div>
                  <div style={{flex:1}}>
                    <div className="sug-title">{sug.title}</div>
                    <div className="sug-reason">{sug.reason}</div>
                  </div>
                  {approved[i]&&<span style={{fontSize:11,fontWeight:700,color:'#2e7d32',background:'#e8f5e9',padding:'2px 8px',borderRadius:10,flexShrink:0}}>✓ Approved</span>}
                  {rejected[i]&&<span style={{fontSize:11,fontWeight:700,color:'#aaa',flexShrink:0}}>Skipped</span>}
                </div>
                <div className="sug-change">
                  <span style={{fontSize:10,color:'#aaa',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',flexShrink:0}}>
                    {sug.changeType==='reassign'?'Engineer':sug.changeType==='reschedule'?'Dates':'Freelancer'}
                  </span>
                  <span className="sug-before">{sug.before}</span>
                  <span style={{color:'#555',fontWeight:700}}>→</span>
                  <span className="sug-after">{sug.after}</span>
                </div>
                {sug.freelancerName&&(
                  <div className="sug-freelancer">
                    <Icon name="person" size={12}/> <b>{sug.freelancerName}</b> recommended — {sug.freelancerNote}
                  </div>
                )}
                {!approved[i]&&!rejected[i]&&(
                  <div className="sug-actions">
                    <button className="sug-btn-approve" onClick={()=>setApproved(p=>({...p,[i]:true}))}>✓ Approve</button>
                    <button className="sug-btn-reject" onClick={()=>setRejected(p=>({...p,[i]:true}))}>Skip</button>
                  </div>
                )}
                {approved[i]&&(
                  <button className="sug-btn-reject" onClick={()=>setApproved(p=>({...p,[i]:false}))}>Undo approve</button>
                )}
              </div>
            ))}
          </>)}
        </div>

        <div className="cr-footer">
          {stage==='list'&&<>
            <button className="btn-p" onClick={getSuggestions} style={{display:'flex',alignItems:'center',gap:6}}>
              <span><Icon name="lightning" size={12}/> Get Suggestions</span>
            </button>
            <button className="btn-g" onClick={onClose}>Close</button>
          </>}
          {stage==='loading'&&<button className="btn-g" onClick={onClose}>Cancel</button>}
          {stage==='suggestions'&&<>
            <button className="btn-p" onClick={applyApproved} disabled={approvedCount===0} style={{opacity:approvedCount>0?1:.4}}>
              Apply {approvedCount>0?approvedCount+' ':''}{approvedCount===1?'change':'changes'}
            </button>
            <button className="btn-g" onClick={()=>setStage('list')}>← Back</button>
            <span style={{marginLeft:'auto',fontSize:11,color:'#aaa',fontWeight:500}}>{approvedCount}/{suggestions.length} approved</span>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Accounts & Permissions ─────────────────────────────────────────────────
const ROLE_MAP={
  'matt@mightysound.studio':    'admin',
  'paul@mightysound.studio':    'staff',
  'kristen@mightysound.studio': 'staff',
};
const getRoleForEmail=(email)=>ROLE_MAP[email?.toLowerCase()]||'staff';

// Permissions per role
const PERMS={
  admin:   {viewBudget:true,  editBudget:true,  viewEngineers:true,  editEngineers:true,  viewAllProjects:true,editProjects:true,  viewGantt:true,editGantt:true,  manageAccounts:true},
  staff:   {viewBudget:true,  editBudget:false, viewEngineers:true,  editEngineers:false, viewAllProjects:true,editProjects:true,  viewGantt:true,editGantt:true,  manageAccounts:false},
  freelancer:{viewBudget:false,editBudget:false, viewEngineers:false, editEngineers:false, viewAllProjects:false,editProjects:false,viewGantt:false,editGantt:false, manageAccounts:false},
};

function can(account,perm){
  if(!account)return false;
  return !!(PERMS[account.role]||{})[perm];
}

// ── Sign In Screen ─────────────────────────────────────────────────────────


// ── App ────────────────────────────────────────────────────────────────────

// ── Mighty Sound Animated Loader ──────────────────────────────────────────
function MightySoundLoader(){
  return(
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'center',
      height:'100vh',background:'#0d0d14',flexDirection:'column',gap:0,
      fontFamily:"'Barlow Condensed', 'Barlow', sans-serif",
    }}>
      <style>{`
        @keyframes ms-bar { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
        @keyframes ms-fade-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ms-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .ms-bar-wrap { display:flex; align-items:center; gap:5px; margin-bottom:32px; }
        .ms-bar { width:4px; border-radius:3px; background:#fff; transform-origin:bottom; animation:ms-bar 1s ease-in-out infinite; }
        .ms-wordmark { animation: ms-fade-in .6s ease both; animation-delay:.2s; opacity:0; }
        .ms-sub { animation: ms-fade-in .6s ease both; animation-delay:.5s; opacity:0; }
        .ms-dots { animation: ms-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Animated waveform bars */}
      <div className="ms-bar-wrap">
        {[28,42,20,55,35,48,22,38,50,25,44,18,52,32,45,24,40,30].map((h,i)=>(
          <div key={i} className="ms-bar" style={{
            height:h,
            opacity:.4+((i%3)*.2),
            animationDelay:`${(i*0.08)%1}s`,
            animationDuration:`${0.7+(i%4)*0.15}s`,
            background: i%4===0?'#5c6bc0':i%4===1?'#fff':i%4===2?'rgba(255,255,255,.6)':'#8e96ff',
          }}/>
        ))}
      </div>

      {/* Wordmark */}
      <div className="ms-wordmark" style={{textAlign:'center'}}>
        <div style={{
          fontSize:42,fontWeight:800,color:'#fff',letterSpacing:'-.01em',
          lineHeight:1,textTransform:'uppercase',
        }}>
          Mighty Sound
        </div>
        <div style={{
          fontSize:13,fontWeight:600,color:'rgba(255,255,255,.35)',
          letterSpacing:'.25em',textTransform:'uppercase',marginTop:6,
        }}>
          WorkBoard
        </div>
      </div>

      {/* Loading indicator */}
      <div className="ms-dots" style={{
        marginTop:48,fontSize:11,fontWeight:600,
        color:'rgba(255,255,255,.25)',letterSpacing:'.15em',textTransform:'uppercase',
      }}>
        Loading
      </div>
    </div>
  );
}

export default function App(){
  const [data,setData]=useState(null);const [view,setView]=useState('table');const [sel,setSel]=useState(null);const [showAddBoard,setShowAddBoard]=useState(false);const [loaded,setLoaded]=useState(true);const [firestoreReady,setFirestoreReady]=useState(false);
  const [showConflicts,setShowConflicts]=useState(false);
  const [account,setAccount]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [loginKey,setLoginKey]=useState(0);
  const saveRef=useRef(null);
  const isMaster=data&&data.activeBoard==='__master__';
  const isLongform=data&&data.activeBoard==='__longform__';
  const isCalendar=data&&data.activeBoard==='__calendar__';



  // Firebase auth listener
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async(firebaseUser)=>{
      if(firebaseUser){
        let profile=await loadUserProfile(firebaseUser.uid);
        if(!profile){
          profile={
            uid:firebaseUser.uid,
            name:firebaseUser.displayName,
            email:firebaseUser.email,
            avatar:firebaseUser.displayName?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)||'?',
            role:getRoleForEmail(firebaseUser.email),
            photoURL:firebaseUser.photoURL,
            createdAt:new Date().toISOString(),
          };
          await createUserProfile(firebaseUser.uid,profile);
        }
        setAccount({...profile,photoURL:firebaseUser.photoURL});
        setLoginKey(k=>k+1);
      } else {
        setAccount(null);
        setData(null);
      }
      setAuthLoading(false);
    });
    return()=>unsub();
  },[]);

  // Load data when user signs in — show app immediately with INIT, sync Firestore in background
  useEffect(()=>{
    if(!account){setData(null);setLoaded(false);setFirestoreReady(false);return;}
    // Immediately load with defaults so app is never stuck
    setData(INIT);
    setLoaded(true);
    // Then try to load saved data from Firestore in background
    let cancelled=false;
    (async()=>{
      try{
        const saved=await loadUserData(account.uid);
        if(!cancelled&&saved){setData(saved);}
      }catch(e){
        console.warn('Firestore sync failed, using defaults:',e);
      }finally{
        if(!cancelled)setFirestoreReady(true);
      }
    })();
    return()=>{cancelled=true;};
  },[account?.uid, loginKey]);

  // Save data on change
  useEffect(()=>{
    if(!data||!account)return;
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(async()=>{
      try{await saveUserData(account.uid,data);}catch{}
    },700);
  },[data,loaded]);

  // Compute gantt-derived items for Active Projects (read-only view)
  const ganttDerivedItems=useMemo(()=>{
    if(!data)return[];
    return data.masterGantt.map(proj=>{
      const allTasks=proj.episodes.flatMap(ep=>ep.tasks);
      const done=allTasks.filter(t=>t.status==='Done').length;
      const ip=allTasks.filter(t=>t.status==='In Progress').length;
      const status=done===allTasks.length?'Done':ip>0?'In Progress':'Not Started';
      const endDates=allTasks.map(t=>t.endDate).filter(Boolean).sort();
      const engineers=[...new Set(allTasks.map(t=>t.assignee).filter(Boolean))];
      return{
        id:'gd_'+proj.id,name:proj.code+' — '+proj.name,
        notes:`${proj.type} · ${proj.episodes.length} ep · ${proj.client}`,
        startDate:allTasks[0]?.startDate||'',timeLogs:[],
        _fromGantt:true,_ganttId:proj.id,
        values:{c1:status,c2:engineers[0]||'',c3:proj.client,c4:endDates[endDates.length-1]||'',c5:null,c6:allTasks.length}
      };
    });
  },[data]);

  const [showAddEngineer,setShowAddEngineer]=useState(false);
  const [editEngineer,setEditEngineer]=useState(null); // {item, groupName}

  // Live skills list from data
  const skillsList=useMemo(()=>data?.engineerSkills||DEFAULT_ENGINEER_SKILLS,[data]);

  // Add a custom skill to the global list
  const addSkillToList=useCallback(skill=>{
    setData(p=>({...p,engineerSkills:[...(p.engineerSkills||DEFAULT_ENGINEER_SKILLS),skill]}));
  },[]);

  // Collect engineer names for dropdowns
  const engineerList=useMemo(()=>{
    if(!data)return[];
    const eb=data.boards.find(b=>b.id==='b3');if(!eb)return[];
    return eb.groups.flatMap(g=>g.items).map(i=>i.name).filter(Boolean);
  },[data]);

  // Collect engineer data (with skills) for conflict resolution
  const freelancerList=useMemo(()=>{
    if(!data)return[];
    const eb=data.boards.find(b=>b.id==='b3');if(!eb)return[];
    return eb.groups.flatMap(g=>g.items).map(i=>({
      name:i.name,
      _type:i._type||'staff',
      values:{c2:i.values?.c2||'',c3:i._type==='staff'?null:i.values?.c3||'',c4:i.values?.c4||'',c5:i.values?.c5||''},
      skills:i.skills||{}, // keep raw {skillId:true} object
    }));
  },[data]);

  const updBoard=useCallback((bid,fn)=>setData(p=>({...p,boards:p.boards.map(b=>b.id===bid?(typeof fn==='function'?fn(b):{...b,...fn}):b)})),[]);

  const saveEngineer=useCallback((eng)=>{
    const eb=data.boards.find(b=>b.id==='b3');if(!eb)return;
    const {_group,...cleanEng}=eng;
    if(editEngineer){
      // Update existing in place
      updBoard('b3',b=>({...b,groups:b.groups.map(g=>({...g,items:g.items.map(i=>i.id===cleanEng.id?cleanEng:i)}))}));
    } else {
      // Add new to correct group
      const groupId=eb.groups.find(g=>g.name===_group)?.id||eb.groups[0]?.id;
      updBoard('b3',b=>({...b,groups:b.groups.map(g=>g.id===groupId?{...g,items:[...g.items,cleanEng]}:g)}));
    }
    setShowAddEngineer(false);setEditEngineer(null);
  },[data,editEngineer,updBoard]);

  const board=data&&!isMaster&&!isLongform&&!isCalendar?data.boards.find(b=>b.id===data.activeBoard):null;
  const setBoard=id=>{setData(p=>({...p,activeBoard:id}));setView('table');setSel(null)};
  const updLongform=fn=>setData(p=>({...p,longform:typeof fn==='function'?fn(p.longform):{...p.longform,...fn}}));
  const updMasterGantt=fn=>setData(p=>({...p,masterGantt:typeof fn==='function'?fn(p.masterGantt):[...p.masterGantt,...fn]}));

  // Apply a gantt change from conflict resolution
  const applyGanttChange=useCallback(change=>{
    if(!change)return;
    setData(p=>({...p,masterGantt:p.masterGantt.map(proj=>{
      if(proj.name!==change.projName&&proj.code!==change.projName)return proj;
      return{...proj,episodes:proj.episodes.map(ep=>{
        if(ep.name!==change.epName)return ep;
        return{...ep,tasks:ep.tasks.map(t=>{
          if(t.name!==change.taskName)return t;
          return{...t,[change.field]:change.value};
        })};
      })};
    })}));
  },[]);

  const addBoard=(name,icon)=>{const nb={id:uid(),name,icon,color:GCOLS[data.boards.length%GCOLS.length],columns:[{id:uid(),name:'Status',type:'status'},{id:uid(),name:'Assigned',type:'person'},{id:uid(),name:'Due Date',type:'date'}],groups:[{id:uid(),name:'Group 1',color:'#5c6bc0',collapsed:false,items:[]}]};setData(p=>({...p,boards:[...p.boards,nb],activeBoard:nb.id}));setShowAddBoard(false)};
  const quickAdd=()=>{if(!board||!board.groups.length)return;const it={id:uid(),name:'New item',notes:'',startDate:'',timeLogs:[],values:{}};updBoard(board.id,p=>({...p,groups:p.groups.map((g,i)=>i===0?{...g,items:[it,...g.items]}:g)}))};
  const VIEWS=[{id:'table',l:'⊞ Table'},{id:'kanban',l:'▣ Kanban'},{id:'calendar',l:'Calendar'}];

  // loader removed — app renders immediately with INIT data

  if(authLoading)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1a1a2e',color:'#fff',fontFamily:'Barlow,sans-serif',fontSize:14}}>
      Loading…
    </div>
  );

  if(!account)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1a1a2e'}}>
      <div style={{textAlign:'center',fontFamily:'Barlow,sans-serif'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff',marginBottom:4}}>Mighty Sound</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.4)',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:40}}>WorkBoard</div>
        <button onClick={signInWithGoogle} style={{display:'flex',alignItems:'center',gap:12,background:'#fff',border:'none',borderRadius:8,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',color:'#333',margin:'0 auto'}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.34-8.16 2.34-6.26 0-11.57-3.59-13.46-8.83l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );

  if(!data)return<MightySoundLoader/>;
  return(<div className="app">
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <svg viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="#000" strokeWidth="1.5"/><path d="M7 8l3 3 3-3" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sb-logo-text">
          <div className="sb-logo-brand">Mighty Sound</div>
          <div className="sb-logo-sub">WorkBoard</div>
        </div>
      </div>
      <div className="sb-scroll">
        <div className="sb-section">Boards</div>
        {data?.boards
          .filter(b=>{
            if(b.id==='b4'&&!can(account,'viewBudget'))return false; // hide Budget from freelancers
            if(b.id==='b3'&&!can(account,'viewEngineers'))return false; // hide Engineers from freelancers
            return true;
          })
          .map(b=><div key={b.id} className={`sb-item${b.id===data.activeBoard&&!isMaster&&!isLongform?' active':''}`} onClick={()=>setBoard(b.id)}><span className="sb-icon"><Icon name={b.icon} size={14}/></span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</span></div>)}
        {can(account,'editProjects')&&<div className="sb-add" onClick={()=>setShowAddBoard(true)}><span className="sb-icon">+</span>Add board</div>}
        <div className="sb-section" style={{marginTop:12}}>Scheduler</div>
        {can(account,'viewGantt')&&<div className={`sb-item${isMaster?' active':''}`} onClick={()=>setBoard('__master__')}><span className="sb-icon"><Icon name="gantt" size={14}/></span>Master Gantt<span className="sb-badge new">Live</span></div>}
        <div className={`sb-item${data.activeBoard==='__calendar__'?' active':''}`} onClick={()=>setBoard('__calendar__')}><span className="sb-icon"><Icon name="calendar" size={14}/></span>Calendar<span className="sb-badge" style={{background:'rgba(26,115,232,.2)',color:'rgba(26,115,232,.9)'}}>GCal</span></div>
        <div className={`sb-item${isLongform?' active':''}`} onClick={()=>setBoard('__longform__')}><span className="sb-icon"><Icon name="clapper" size={14}/></span>Production Overview</div>
        <div className="sb-section" style={{marginTop:12}}>Workspace</div>
        {[['bell','Notifications'],['settings','Settings']].map(([icon,label])=><div key={label} className="sb-item"><span className="sb-icon"><Icon name={icon} size={14}/></span>{label}</div>)}
      </div>
      <div className="sb-footer">
        {account.photoURL
          ?<img src={account.photoURL} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}} alt=""/>
          :<div className="user-av" style={{background:'#5c6bc0',color:'#fff',fontSize:10}}>{account.avatar}</div>
        }
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,.85)',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{account.name}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,.35)',fontWeight:500,textTransform:'capitalize'}}>{account.role}</div>
        </div>
        <button onClick={signOutUser} style={{background:'none',border:'1px solid rgba(255,255,255,.15)',borderRadius:5,color:'rgba(255,255,255,.4)',fontSize:10,fontWeight:700,padding:'3px 7px',cursor:'pointer',flexShrink:0,letterSpacing:'.03em'}} title="Sign out">↩</button>
      </div>
    </div>
    <div className="main">
      {isMaster?(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:'18px 22px 12px',minHeight:0}}>
          <div className="board-title" style={{marginBottom:14,flexShrink:0}}>
            <Icon name="gantt" size={16}/><span>Master Gantt Scheduler</span>
            <span className="bcount">{data.masterGantt.reduce((n,p)=>n+p.episodes.reduce((m,e)=>m+e.tasks.length,0),0)} tasks across {data.masterGantt.length} projects</span>
          </div>
          <div style={{flex:1,overflow:'hidden',minHeight:0,display:'flex',flexDirection:'column'}}>
            <MasterGantt ganttData={data?.masterGantt||[]} onUpdateGantt={updMasterGantt} onShowConflicts={()=>setShowConflicts(true)}/>
          </div>
        </div>
      ):isCalendar?(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:'18px 22px 12px',minHeight:0}}>
          <div className="board-title" style={{marginBottom:10,flexShrink:0}}>
            <Icon name="calendar" size={15}/><span>Calendar</span>
            <span className="bcount">All projects · Google Calendar sync</span>
          </div>
          <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
            <WorkboardCalendar ganttData={data?.masterGantt||[]} boards={data?.boards||[]} account={account}/>
          </div>
        </div>
      ):isLongform?(
        <>
          <div className="board-header"><div className="board-title"><Icon name="clapper" size={16}/><span>Production Overview</span><span className="bcount">{data.longform.productions.reduce((s,p)=>s+p.episodes.length,0)} episodes</span></div><hr className="hdr-div" style={{marginTop:4}}/></div>
          <div className="board-content"><LongformView longform={data?.longform||{productions:[],activeProduction:""}} onUpdate={updLongform} masterGantt={data?.masterGantt||[]}/></div>
        </>
      ):board?(
        <>
          <div className="board-header">
            <div className="board-title"><Icon name={board.icon} size={16}/><span>{board.name}</span><span className="bcount">{board.groups.reduce((n,g)=>n+g.items.length,0)} items</span></div>
            <div className="toolbar">{VIEWS.map(v=><button key={v.id} className={`view-btn${view===v.id?' active':''}`} onClick={()=>setView(v.id)}>{v.l}</button>)}<div className="t-sep"/><button className="t-btn"><Icon name="search" size={12}/> Filter</button>
              {board.id==='b3'
                ?<button className="t-btn hi" onClick={()=>{setEditEngineer(null);setShowAddEngineer(true)}}>+ Add Engineer</button>
                :<button className="t-btn hi" onClick={quickAdd}>+ New item</button>
              }
            </div>
            <hr className="hdr-div"/>
          </div>
          <div className="board-content">
            {/* Permission gate for budget board */}
            {board.id==='b4'&&!can(account,'viewBudget')&&(
              <div className="perm-denied">You don't have permission to view budget information.</div>
            )}

            {/* Gantt-derived projects — only on Active Projects */}
            {board.id==='b1'&&ganttDerivedItems.length>0&&view==='table'&&(
              <div className="group-block">
                <div className="group-header">
                  <span className="g-dot" style={{background:'#8e24aa'}}/>
                  <span className="g-name" style={{color:'#8e24aa'}}>Live Projects — From Master Gantt</span>
                  <span className="g-cnt">{ganttDerivedItems.length} projects</span>
                  <span style={{marginLeft:8,fontSize:10,color:'#8e24aa',fontWeight:600,cursor:'pointer',textDecoration:'underline'}} onClick={()=>setBoard('__master__')}>Open Gantt →</span>
                </div>
                {data.masterGantt.map(proj=>(
                  <GanttProjectRow key={proj.id} proj={proj} board={board} setBoard={setBoard}/>
                ))}
              </div>
            )}

            {view==='table'&&<TableView board={board} onUpdate={fn=>updBoard(board.id,fn)} onSelect={(bid,gid,iid)=>setSel({bid,gid,iid})}
              onEditItem={board.id==='b3'?(item,groupName)=>{setEditEngineer({item,groupName});setShowAddEngineer(true)}:null}
            />}
            {view==='kanban'&&<KanbanView board={board} onSelect={(bid,gid,iid)=>setSel({bid,gid,iid})}/>}
            {view==='calendar'&&<CalendarView board={board} onSelect={(bid,gid,iid)=>setSel({bid,gid,iid})}/>}
            {view==='gantt'&&<GanttView board={board} onSelect={(bid,gid,iid)=>setSel({bid,gid,iid})}/>}
          </div>
        </>
      ):<div className="empty"><h3>Select a board</h3></div>}
      {sel&&<ItemDetail boards={data?.boards||[]} sel={sel} onClose={()=>setSel(null)} onUpdate={updBoard} engineers={engineerList} skillsList={skillsList}/>}
      {showAddBoard&&<AddBoardModal onAdd={addBoard} onClose={()=>setShowAddBoard(false)}/>}
      {showAddEngineer&&<AddEngineerModal
        editItem={editEngineer?{...editEngineer.item,_group:editEngineer.groupName}:null}
        skillsList={skillsList}
        onAdd={saveEngineer}
        onAddSkill={addSkillToList}
        onClose={()=>{setShowAddEngineer(false);setEditEngineer(null)}}
      />}
      {showConflicts&&data&&(
        <div className="modal-ov" onClick={()=>setShowConflicts(false)}>
          <ConflictResolutionModal
            conflicts={data.masterGantt.reduce((all,proj)=>{
              const tasks=proj.episodes.flatMap(ep=>ep.tasks.map(t=>({...t,projName:proj.name})));
              for(let i=0;i<tasks.length;i++)for(let j=i+1;j<tasks.length;j++){
                const a=tasks[i],b=tasks[j];
                if(a.assignee&&a.assignee===b.assignee&&a.status!=='Done'&&b.status!=='Done'&&a.startDate<=b.endDate&&b.startDate<=a.endDate)
                  all.push(`${a.assignee} double-booked: ${a.projName} ${a.name} (${a.startDate}–${a.endDate}) vs ${b.projName} ${b.name} (${b.startDate}–${b.endDate})`);
              }
              return all;
            },[])}
            ganttData={data?.masterGantt||[]}
            engineers={freelancerList}
            onApply={change=>{applyGanttChange(change)}}
            onClose={()=>setShowConflicts(false)}
          />
        </div>
      )}
    </div>
  </div>);
}