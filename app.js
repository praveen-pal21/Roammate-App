// Roammate — dating + travel app (Firebase edition)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { makeDb } from "./db.js";

(() => {
const INTERESTS = ["Hiking","Beaches","Food","Museums","Nightlife","Photography","Books","Road trips","Yoga","Coffee","Music","Art","Wildlife","Skiing","Diving","Culture"];
const STYLES = ["Slow travel","Adventure","Luxury","Backpacking","Culture","Foodie"];
const GENDERS = ["Woman","Man","Non-binary"];
const PALETTE = ["#3F5A4A","#8A4B3C","#5B4E7A","#2F5D6B","#7A5C2E","#6B3F55","#44614F","#9A5A3A"];

const S = {db:null,user:null,me:null,canWrite:true,profiles:{},likes:{},chats:{},trips:{},groups:{},joins:{},
  tab:"discover",view:null,draft:{},sub:{},seenMatches:null,groupFilter:"foryou",editing:false};

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const hash = s => {let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const color = id => PALETTE[hash(id)%PALETTE.length];
const initial = n => esc((n||"?").trim()[0]?.toUpperCase()||"?");
const av = (id,name,cls="",extra="") => {
  const photo = S.profiles[id]?.photoURL || (id===S.me ? (myP()?.photoURL || S.user?.photoURL) : "");
  if(photo) return `<div class="avatar ${cls} has-img" style="background-image:url('${esc(photo)}');${extra}"></div>`;
  return `<div class="avatar ${cls}" style="background:${color(id)};${extra}">${initial(name)}</div>`;
};
const chatId = (a,b) => [a,b].sort().join("+");
const fmtTime = t => new Date(t).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
const fmtDate = d => d ? new Date(d+"T00:00").toLocaleDateString([], {day:"numeric",month:"short"}) : "";
const pname = id => S.profiles[id]?.name || (id === S.me ? (S.user?.displayName || "Traveler") : "Traveler");
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
const ICON = {
  discover:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  matches:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  trips:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>',
  groups:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M15 14.5c3 0 5.5 1.6 5.5 4.5"/></svg>',
  profile:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 16 12 21 12 21z"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 20.5 21 12 3 3.5l2.5 8.5zM5.5 12H13"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 6l-6 6 6 6"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M12 21s-6-5.7-6-11a6 6 0 0 1 12 0c0 5.3-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>',
};

// ---------- data derivations ----------
const myP = () => S.profiles[S.me];
const myLikes = () => S.likes[S.me] || {liked:[],passed:[]};
const likesMe = id => { const l=S.likes[id]; return !!l && ((l.liked||[]).includes(S.me) || (l.liked||[]).includes("*")); };
function matches(){
  const mine = myLikes().liked||[];
  return mine.filter(id => S.profiles[id] && likesMe(id));
}
function fits(a,b){ // does b fit a's preferences
  const pref=a.interestedIn||[]; if(pref.length && !pref.includes(b.gender)) return false;
  if(b.age && a.ageMin && b.age < a.ageMin) return false;
  if(b.age && a.ageMax && b.age > a.ageMax) return false;
  return true;
}
function score(a,b){
  const shared=(a.interests||[]).filter(i=>(b.interests||[]).includes(i)).length;
  let s=50+Math.min(shared*10,30);
  if(a.travelStyle && a.travelStyle===b.travelStyle) s+=14;
  if(a.city && b.city && a.city.trim().toLowerCase()===b.city.trim().toLowerCase()) s+=5;
  return {pct:Math.min(s,99),shared};
}
function candidates(){
  const me=myP(); if(!me) return [];
  const l=myLikes(); const seen=new Set([...(l.liked||[]),...(l.passed||[]),S.me]);
  return Object.entries(S.profiles).filter(([id,p])=>!seen.has(id) && p.name && fits(me,p) && fits(p,me))
    .map(([id,p])=>({id,p,...score(me,p)})).sort((a,b)=>b.pct-a.pct);
}
const myTrips = () => Object.entries(S.trips).filter(([,t])=>t.owner===S.me || (t.invited||[]).includes(S.me)).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
const groupMembers = gid => Object.values(S.joins).filter(j=>j.gid===gid).map(j=>j.uid);
const unread = () => matches().filter(id=>{const c=S.chats[chatId(S.me,id)];return c && c.lastFrom!==S.me && (c.lastAt||0)>(+localGet("read:"+chatId(S.me,id))||0)}).length;
function localGet(k){try{return localStorage.getItem(k)}catch{return null}}
function localSet(k,v){try{localStorage.setItem(k,v)}catch{}}

// ---------- writes ----------
async function safe(fn){
  try{await fn()}catch(e){
    if(e?.code==="permission-denied") toast("You don't have permission to do that.");
    else if(e?.code==="resource-exhausted") toast("The app's storage quota is full.");
    else toast("Couldn't save — please try again.");
    console.error(e);
  }
}
async function saveProfile(data){
  await safe(async()=>{await S.db.doc("profiles/"+S.me).set({...data,updatedAt:Date.now()});
    if(!S.likes[S.me]) await S.db.doc("likes/"+S.me).set({liked:[],passed:[]});});
}
async function decide(id,like){
  const l=myLikes(); const liked=[...(l.liked||[])], passed=[...(l.passed||[])];
  (like?liked:passed).push(id);
  S.likes[S.me]={liked,passed}; render();
  await safe(()=>S.db.doc("likes/"+S.me).set({liked,passed}));
  if(like && likesMe(id)){
    const cid=chatId(S.me,id);
    if(!S.chats[cid]) await safe(()=>S.db.doc("chats/"+cid).set({members:[S.me,id].sort(),lastAt:Date.now(),last:"",lastFrom:""}));
    showMatch(id);
  }
}
async function sendMsg(cid,text){
  const other=cid.split("+").find(x=>x!==S.me);
  await safe(async()=>{
    await S.db.doc("chats/"+cid).set({members:[S.me,other].sort(),last:text.slice(0,120),lastFrom:S.me,lastAt:Date.now()});
    await S.db.collection("chats/"+cid+"/msgs").add({from:S.me,text,at:Date.now()});
  });
}

// ---------- subscriptions ----------
function subscribeAll(){
  const coll=(name,key,map=d=>d)=>S.db.collection(name).onSnapshot(snap=>{
    const o={};snap.docs.forEach(d=>{if(d.exists)o[d.id]=map(d.data())});S[key]=o;
    if(key==="likes") checkNewMatches();
    render();
  },e=>console.warn(name,e));
  S.db.collection("profiles").onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});S.profiles=o;S.loaded=true;render()},e=>{console.warn(e);S.loaded=true;render()}); coll("likes","likes");
  const tripSets={own:{},inv:{}};
  const tripSub=(key,q)=>q.onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});tripSets[key]=o;S.trips={...tripSets.own,...tripSets.inv};render()},e=>console.warn("trips",e));
  tripSub("own",S.db.collection("trips").where("owner","==",S.me));
  tripSub("inv",S.db.collection("trips").where("invited","array-contains",S.me));
  coll("groups","groups"); coll("joins","joins");
  S.db.collection("chats").where("members","array-contains",S.me).onSnapshot(snap=>{
    const o={};snap.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});S.chats=o;render();
  },e=>console.warn("chats",e));
}
function checkNewMatches(){
  const m=matches();
  if(S.seenMatches===null){S.seenMatches=new Set(m);return}
  m.forEach(id=>{if(!S.seenMatches.has(id)){S.seenMatches.add(id);if(S.tab!=="discover")toast("New match: "+pname(id)+" ♥")}});
}
function openSub(key,path,order){
  closeSubs();
  S.sub.items=[];S.sub.key=key;
  S.sub.un=S.db.collection(path).orderBy("at","asc").limit(300).onSnapshot(snap=>{
    S.sub.items=snap.docs.filter(d=>d.exists).map(d=>({id:d.id,...d.data()}));render();
    const box=$(".msgs");if(box)box.scrollTop=box.scrollHeight;
  },e=>console.warn(path,e));
}
function closeSubs(){if(S.sub.un){S.sub.un();S.sub={}}}

// ---------- render ----------
function keepInputs(){const o={};document.querySelectorAll("[data-keep]").forEach(el=>{o[el.dataset.keep]=el.value});
  const a=document.activeElement;return {o,focus:a?.dataset?.keep,sel:a?.selectionStart}}
function restoreInputs(k){document.querySelectorAll("[data-keep]").forEach(el=>{if(k.o[el.dataset.keep]!==undefined)el.value=k.o[el.dataset.keep]});
  if(k.focus){const el=document.querySelector(`[data-keep="${k.focus}"]`);if(el){el.focus();try{el.setSelectionRange(k.sel,k.sel)}catch{}}}}

function render(){
  const app=$("#app"); const k=keepInputs();
  if(!S.loaded){app.innerHTML='<div class="spin"></div>';return}
  if(!myP() || S.editing){ $("#nav").hidden=!myP(); app.innerHTML=profileForm(!myP()); if(myP())renderNav(); restoreInputs(k); return; }
  renderNav();
  let html="";
  if(S.view?.type==="chat") html=chatView(S.view.id);
  else if(S.view?.type==="trip") html=tripView(S.view.id);
  else if(S.view?.type==="group") html=groupView(S.view.id);
  else html=({discover:discoverView,matches:matchesView,trips:tripsView,groups:groupsView,profile:profileView})[S.tab]();
  app.innerHTML=html; restoreInputs(k);
}
function renderNav(){
  const n=$("#nav");n.hidden=false;const u=unread();
  n.innerHTML=`<div class="in">${["discover","matches","trips","groups","profile"].map(t=>
    `<button class="${S.tab===t&&!S.editing?"on":""}" data-act="tab" data-v="${t}">${ICON[t]}${t[0].toUpperCase()+t.slice(1)}${t==="matches"&&u?`<span class="badge">${u}</span>`:""}</button>`).join("")}</div>`;
}

// ----- onboarding / profile form -----
function profileForm(isNew){
  const defaultName = S.user?.displayName || "";
  const p = myP() || {
    name: defaultName,
    photoURL: S.user?.photoURL || "",
    email: S.user?.email || "",
    interestedIn: [],
    interests: [],
    ageMin: 22,
    ageMax: 40
  };
  if(!p.name && S.user?.displayName) p.name = S.user.displayName;
  const chipset=(name,list,sel)=>`<div class="chips" data-chips="${name}">${list.map(x=>`<span class="chip ${(sel||[]).includes(x)?"on":""}" data-act="chip" data-v="${esc(x)}">${esc(x)}</span>`).join("")}</div>`;
  const googleBadge = (S.user?.displayName || S.user?.email) ? `
    <div class="row" style="background:var(--surface-2);border:1px solid var(--border);padding:10px 14px;border-radius:14px;margin-bottom:14px;gap:12px">
      ${av(S.me, p.name || S.user.displayName, "", "width:42px;height:42px;")}
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(S.user.displayName || p.name || "Traveler")}</div>
        <div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(S.user.email||"")}</div>
      </div>
      <span class="tag" style="background:rgba(66,133,244,.15);color:#4285F4;font-size:11px">Connected</span>
    </div>` : "";
  return `${isNew?`<div class="hero-logo">${ICON.globe}</div><div class="eyebrow">Roammate</div><h1>Find your next<br><em>favorite person.</em></h1>
  <p class="sub">Meet people who travel like you do, then turn a spark into a shared story.</p>`
  :`<button class="back" data-act="canceledit">${ICON.left} Back</button><div class="eyebrow">Your profile</div><h1>Edit your travel identity</h1>`}
  ${!S.canWrite?`<div class="banner">View-only access<small>Ask the owner for Contributor access to create a profile.</small></div>`:""}
  <form id="pform" class="card">
    ${googleBadge}
    <label>Your first name</label><input name="name" data-keep="f_name" required maxlength="30" value="${esc(p.name)}" placeholder="e.g. Krishan">
    <div class="row"><div><label>Age</label><input name="age" data-keep="f_age" type="number" min="18" max="99" required value="${esc(p.age)}"></div>
    <div><label>I am</label><select name="gender" data-keep="f_gender">${GENDERS.map(g=>`<option ${p.gender===g?"selected":""}>${g}</option>`).join("")}</select></div></div>
    <label>Home city</label><input name="city" data-keep="f_city" maxlength="40" value="${esc(p.city)}" placeholder="e.g. Delhi">
    <label>A line about you</label><textarea name="bio" data-keep="f_bio" maxlength="160" placeholder="Mountains in the morning, a good story by sunset.">${esc(p.bio)}</textarea>
    <label>Travel style</label><select name="travelStyle" data-keep="f_style">${STYLES.map(s=>`<option ${p.travelStyle===s?"selected":""}>${s}</option>`).join("")}</select>
    <label>Interests <span class="muted small">(pick a few)</span></label>${chipset("interests",INTERESTS,p.interests)}
    <h2>Dating preferences</h2>
    <label>Show me</label>${chipset("interestedIn",GENDERS,p.interestedIn)}
    <div class="row"><div><label>Age from</label><input name="ageMin" data-keep="f_min" type="number" min="18" max="99" value="${esc(p.ageMin)}"></div>
    <div><label>to</label><input name="ageMax" data-keep="f_max" type="number" min="18" max="99" value="${esc(p.ageMax)}"></div></div>
    <div style="margin-top:20px"><button class="btn primary" type="submit" ${S.canWrite?"":"disabled"}>${isNew?"Start exploring":"Save profile"}</button></div>
  </form>`;
}

// ----- discover -----
function discoverView(){
  const c=candidates(); const m=matches();
  const newest=m.filter(id=>!S.chats[chatId(S.me,id)]?.last).slice(-1)[0];
  let body;
  if(!c.length){
    body=`<div class="card empty">${ICON.globe}<h3>No more travelers nearby</h3><p class="small">Widen your preferences, or share Roammate with friends so more people join.</p>
    <div class="row" style="margin-top:12px"><button class="btn forest sm" data-act="restart">Start over</button><button class="btn ghost sm" data-act="edit">Edit preferences</button></div></div>`;
  } else {
    const {id,p,pct,shared}=c[0];
    const cardAv = p.photoURL
      ? `<div class="bigav has-img" style="background-image:url('${esc(p.photoURL)}')"></div>`
      : `<div class="bigav">${initial(p.name)}</div>`;
    body=`<div class="pcard" style="background:linear-gradient(160deg,${color(id)}cc,${color(id)} 55%,#1d1a18)">
      ${p.demo?'<span class="demo">Demo profile</span>':""}<span class="score">${pct}% match</span>
      ${cardAv}
      <h2>${esc(p.name)}, ${esc(p.age)}</h2>
      <div class="small" style="opacity:.85;display:flex;align-items:center;gap:4px">${ICON.pin}${esc(p.city||"Somewhere")} · ${esc(p.travelStyle||"")}</div>
      ${p.bio?`<p style="margin:10px 0 12px">${esc(p.bio)}</p>`:'<div style="height:10px"></div>'}
      <div class="chips">${(p.interests||[]).slice(0,6).map(i=>`<span class="chip static">${esc(i)}</span>`).join("")}</div>
      ${shared?`<div class="small" style="opacity:.8;margin-top:10px">${shared} shared interest${shared>1?"s":""}</div>`:""}
    </div>
    <div class="actions"><button class="circle" data-act="pass" data-v="${id}" aria-label="Pass">${ICON.x}</button>
    <button class="circle like" data-act="like" data-v="${id}" aria-label="Like">${ICON.heart}</button></div>`;
  }
  return `<div class="eyebrow">Discover</div><h1>A little chemistry.<br><em>A lot of possibility.</em></h1>
  <p class="sub">Curated for your travel style and the way you want to connect.</p>
  ${newest?`<div class="banner" data-act="openchat" data-v="${newest}" style="margin-bottom:14px">You and ${esc(pname(newest))} matched!<small>Tap to say hello.</small></div>`:""}
  ${body}`;
}
function showMatch(id){
  $("#overlay").innerHTML=`<div class="modal-bg" data-act="closemodal"><div class="modal" style="text-align:center">
    <div class="row" style="justify-content:center;gap:0;margin:8px 0 14px"><div style="flex:none">${av(S.me,myP().name,"lg")}</div><div style="flex:none;margin-left:-14px">${av(id,pname(id),"lg")}</div></div>
    <div class="eyebrow">It's a match</div><h1>You and ${esc(pname(id))}<br><em>clicked.</em></h1>
    <p class="sub">Say hello now, and plan a trip together when it feels right.</p>
    <button class="btn primary" data-act="openchat" data-v="${id}">Send a message</button>
    <button class="btn ghost" style="margin-top:8px" data-act="closemodal">Keep exploring</button></div></div>`;
}

// ----- matches & chat -----
function matchesView(){
  const m=matches().sort((a,b)=>(S.chats[chatId(S.me,b)]?.lastAt||0)-(S.chats[chatId(S.me,a)]?.lastAt||0));
  return `<div class="eyebrow">Connections</div><h1>The people you<br><em>clicked with.</em></h1><p class="sub">A shared love of getting lost is a pretty good start.</p>
  ${m.length?`<div class="stack">${m.map(id=>{const c=S.chats[chatId(S.me,id)];const isNew=c&&c.lastFrom!==S.me&&(c.lastAt||0)>(+localGet("read:"+chatId(S.me,id))||0);
    return `<div class="item" data-act="openchat" data-v="${id}">${av(id,pname(id))}<div class="grow"><h3>${esc(pname(id))}${isNew?' <span class="tag">New</span>':""}</h3>
    <div class="line">${c?.last?(c.lastFrom===S.me?"You: ":"")+esc(c.last):"You matched — say hello!"}</div></div><span class="muted">›</span></div>`}).join("")}</div>`
  :`<div class="card empty">${ICON.matches}<h3>No matches yet</h3><p class="small">Like someone on Discover — when they like you back, you'll find them here.</p></div>`}`;
}
function chatView(id){
  const cid=chatId(S.me,id); const items=S.sub.key===cid?S.sub.items:[];
  localSet("read:"+cid,Date.now());
  const p=S.profiles[id]||{};
  return `<div class="chatwrap"><div><button class="back" data-act="back">${ICON.left} Matches</button>
  <div class="row" style="gap:12px">${av(id,p.name)}<div style="flex:1"><h3>${esc(p.name)}</h3><div class="small muted">${esc(p.city||"")} · ${esc(p.travelStyle||"")}</div></div>
  <button class="btn ghost sm" style="flex:none" data-act="newtrip" data-v="${id}">Plan a trip</button></div></div>
  <div class="msgs"><div class="sys">You matched — say hello to ${esc(p.name)}.</div>
  ${items.map(m=>`<div class="msg ${m.from===S.me?"me":""}">${esc(m.text)}<div class="t">${fmtTime(m.at)}</div></div>`).join("")}</div>
  <form class="composer" data-form="msg" data-v="${cid}"><input data-keep="msg_${cid}" placeholder="Write something curious…" maxlength="1000" autocomplete="off" ${S.canWrite?"":"disabled"}>
  <button class="btn primary sm" type="submit" aria-label="Send">${ICON.send}</button></form></div>`;
}

// ----- trips -----
function tripsView(){
  const t=myTrips();
  return `<div class="eyebrow">Your journeys</div><h1>Plan something<br><em>worth remembering.</em></h1><p class="sub">Build the details now, invite the right person when it feels right.</p>
  ${t.length?`<div class="stack">${t.map(([id,tr])=>tripCard(id,tr)).join("")}</div><div style="margin-top:14px"><button class="btn primary" data-act="newtrip">+ Plan a trip</button></div>`
  :`<div class="card empty">${ICON.trips}<h3>Your map is waiting</h3><p class="small">Start a personal itinerary, then invite a match to make it shared.</p><button class="btn primary sm" style="margin-top:8px" data-act="newtrip">Plan a trip</button></div>`}`;
}
function tripCard(id,tr){
  const inv=(tr.invited||[]);const shared=tr.owner!==S.me?`Invited by ${esc(pname(tr.owner))}`:inv.length?`With ${inv.map(i=>esc(pname(i))).join(", ")}`:"Just you so far";
  return `<div class="tripcard" data-act="opentrip" data-v="${id}"><span class="tag" style="background:rgba(255,255,255,.18);color:#fff">${esc(tr.vibe||"Trip")}</span>
  <h2 style="color:#fff;margin:10px 0 2px">${esc(tr.title)}</h2><div class="m">${esc(tr.destination)} · ${fmtDate(tr.start)} – ${fmtDate(tr.end)}</div><div class="m" style="margin-top:8px">${shared}</div></div>`;
}
function tripDays(tr){
  const s=new Date(tr.start+"T00:00"),e=new Date(tr.end+"T00:00");let n=Math.round((e-s)/864e5)+1;if(!(n>0))n=1;return Math.min(n,30);
}
function tripView(id){
  const tr=S.trips[id]; if(!tr) return `<button class="back" data-act="back">${ICON.left} Trips</button><div class="empty">This trip was removed.</div>`;
  const n=tripDays(tr); const acts=tr.activities||{}; const mm=matches().filter(m=>!(tr.invited||[]).includes(m)&&m!==tr.owner);
  let days="";
  for(let d=1;d<=n;d++){
    const list=(acts[d]||[]).slice().sort((a,b)=>(a.time||"").localeCompare(b.time||""));
    const date=new Date(new Date(tr.start+"T00:00").getTime()+(d-1)*864e5);
    days+=`<div class="day"><h3>Day ${d} <span class="muted small" style="font-weight:400">· ${date.toLocaleDateString([], {weekday:"short",day:"numeric",month:"short"})}</span></h3>
    <div class="card" style="padding:6px 14px">${list.length?list.map(a=>`<div class="act"><span class="dot"></span><div style="flex:1"><div style="font-weight:600">${esc(a.title)}</div>
      <div class="small muted">${esc(a.time||"Anytime")}${a.by?` · added by ${a.by===S.me?"you":esc(pname(a.by))}`:""}</div></div>
      <button class="btn ghost sm" data-act="delact" data-v="${id}" data-d="${d}" data-i="${esc(a.id)}" aria-label="Remove"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`).join("")
      :`<div class="small muted" style="padding:10px 0">No activities planned yet.</div>`}</div>
    <form class="row" style="margin-top:8px" data-form="act" data-v="${id}" data-d="${d}"><input style="flex:2" data-keep="act_${id}_${d}" placeholder="Add a Day ${d} activity" maxlength="80">
    <input style="flex:1" type="time" data-keep="actt_${id}_${d}"><button class="btn forest sm" style="flex:none" type="submit">Add</button></form></div>`;
  }
  return `<button class="back" data-act="back">${ICON.left} Trips</button>${tripCard(id,tr).replace('data-act="opentrip"','')}
  ${tr.notes?`<p class="muted small" style="margin:10px 2px">${esc(tr.notes)}</p>`:""}
  ${days}
  <h2>Travel together</h2>
  ${tr.owner===S.me?(mm.length?`<div class="card"><label style="margin-top:0">Invite a match</label><div class="row"><select id="invsel">${mm.map(m=>`<option value="${m}">${esc(pname(m))}</option>`).join("")}</select>
    <button class="btn primary sm" style="flex:none" data-act="invite" data-v="${id}">Invite</button></div></div>`
    :`<div class="card small muted">${(tr.invited||[]).length?"Everyone you've matched with is already invited.":"Match with someone first, then invite them here."}</div>`)
  :`<div class="card small muted">${esc(pname(tr.owner))} invited you. You can both add activities.</div>`}
  ${tr.owner===S.me?`<button class="btn ghost" style="margin-top:14px" data-act="deltrip" data-v="${id}">Delete trip</button>`:""}`;
}
function tripModal(withId){
  const today=new Date().toISOString().slice(0,10);
  const later=new Date(Date.now()+4*864e5).toISOString().slice(0,10);
  $("#overlay").innerHTML=`<div class="modal-bg" data-act="closemodal"><div class="modal">
  <div class="eyebrow">New trip</div><h1 style="font-size:24px">Where to?</h1>
  <form data-form="trip" data-v="${withId||""}">
  <label>Trip name</label><input name="title" required maxlength="50" placeholder="Monsoon in Goa">
  <label>Destination</label><input name="destination" required maxlength="50" placeholder="Goa, India">
  <div class="row"><div><label>Start</label><input type="date" name="start" required value="${today}"></div><div><label>End</label><input type="date" name="end" required value="${later}"></div></div>
  <label>Vibe</label><select name="vibe">${STYLES.map(s=>`<option>${s}</option>`).join("")}</select>
  <label>Notes</label><textarea name="notes" maxlength="200" placeholder="Slow travel, thoughtful plans, and space for a little spontaneity."></textarea>
  ${withId?`<p class="small muted">${esc(pname(withId))} will be invited automatically.</p>`:""}
  <div style="margin-top:16px"><button class="btn primary" type="submit">Create trip</button></div></form></div></div>`;
}

// ----- groups -----
function groupsView(){
  const me=myP()||{}; let list=Object.entries(S.groups).sort((a,b)=>(a[1].start||"").localeCompare(b[1].start||""));
  if(S.groupFilter==="foryou") list=list.filter(([,g])=>(g.tags||[]).some(t=>(me.interests||[]).includes(t)||t===me.travelStyle)).concat(list.filter(([,g])=>!(g.tags||[]).some(t=>(me.interests||[]).includes(t)||t===me.travelStyle)));
  if(S.groupFilter==="mine") list=list.filter(([id,g])=>groupMembers(id).includes(S.me)||g.host===S.me);
  return `<div class="eyebrow">Group travel</div><h1>Go together.<br><em>Make it bigger.</em></h1><p class="sub">Find small groups of curious people heading somewhere beautiful.</p>
  <div class="seg">${[["foryou","For you"],["mine","Joined"]].map(([k,l])=>`<span class="chip ${S.groupFilter===k?"on":""}" data-act="gfilter" data-v="${k}">${l}</span>`).join("")}</div>
  ${list.length?`<div class="grid2">${list.map(([id,g])=>{const n=groupMembers(id).length;return `<div class="gcard" data-act="opengroup" data-v="${id}">
    <div class="cover" style="background:${color(id)}">${initial(g.title)}</div><h3>${esc(g.title)}</h3>
    <div class="small muted">${esc(g.place)}</div><div class="small muted">${n}/${esc(g.capacity||10)} travelers${(g.tags||[])[0]?" · "+esc(g.tags[0]):""}</div>
    ${g.sample?'<span class="tag" style="margin-top:6px">Sample</span>':""}</div>`}).join("")}</div>`
  :`<div class="card empty">${ICON.groups}<h3>${S.groupFilter==="mine"?"You haven't joined a group yet":"No group trips yet"}</h3></div>`}
  <div style="margin-top:16px"><button class="btn primary" data-act="newgroup">+ Host a group trip</button></div>`;
}
function groupView(id){
  const g=S.groups[id]; if(!g) return `<button class="back" data-act="back">${ICON.left} All group trips</button><div class="empty">This group was removed.</div>`;
  const mem=groupMembers(id); const joined=mem.includes(S.me); const full=mem.length>=(+g.capacity||10);
  const posts=S.sub.key==="g"+id?S.sub.items:[];
  return `<button class="back" data-act="back">${ICON.left} All group trips</button>
  <div class="tripcard" style="cursor:default"><h2 style="color:#fff;margin:0 0 2px">${esc(g.title)}</h2><div class="m">${esc(g.place)} · ${fmtDate(g.start)} – ${fmtDate(g.end)}</div>
  <p style="margin:10px 0 6px">${esc(g.description||"")}</p><div class="m">${mem.length}/${esc(g.capacity||10)} travelers · Hosted by ${g.host?(g.host===S.me?"you":esc(pname(g.host))):"Roammate"}</div></div>
  <div style="margin-top:12px">${joined?`<button class="btn ghost" data-act="leave" data-v="${id}">Leave group</button>`
    :`<button class="btn primary" data-act="join" data-v="${id}" ${full?"disabled":""}>${full?"Group is full":"Join this group trip"}</button>`}</div>
  ${(g.tags||[]).length?`<div class="chips" style="margin-top:12px">${g.tags.map(t=>`<span class="chip static">${esc(t)}</span>`).join("")}</div>`:""}
  <h2>Travelers</h2>
  ${mem.length?`<div class="chips">${mem.map(u=>`<span class="chip static">${esc(pname(u))}${u===S.me?" (you)":""}</span>`).join("")}</div>`:`<p class="small muted">Be the first to join.</p>`}
  <h2>Group posts</h2>
  ${joined||g.host===S.me?`<form class="stack" data-form="post" data-v="${id}"><textarea data-keep="post_${id}" maxlength="500" placeholder="Share a thought with the group"></textarea><button class="btn forest" type="submit">Post to group</button></form>`
    :`<p class="small muted">Join the group to post.</p>`}
  <div class="stack" style="margin-top:12px">${posts.slice().reverse().map(p=>`<div class="card" style="padding:12px"><div class="row" style="gap:10px">${av(p.from,pname(p.from),"","width:32px;height:32px;font-size:14px;")}
    <div style="flex:1"><b>${esc(pname(p.from))}</b> <span class="small muted">· ${new Date(p.at).toLocaleDateString([], {day:"numeric",month:"short"})} ${fmtTime(p.at)}</span></div></div><p style="margin:8px 0 0">${esc(p.text)}</p></div>`).join("")||'<p class="small muted">No posts yet.</p>'}</div>`;
}
function groupModal(){
  const today=new Date(Date.now()+14*864e5).toISOString().slice(0,10),later=new Date(Date.now()+19*864e5).toISOString().slice(0,10);
  $("#overlay").innerHTML=`<div class="modal-bg" data-act="closemodal"><div class="modal">
  <div class="eyebrow">Host a group trip</div><h1 style="font-size:24px">Gather your crew</h1>
  <form data-form="group">
  <label>Trip name</label><input name="title" required maxlength="40" placeholder="Spiti road trip">
  <label>Where</label><input name="place" required maxlength="40" placeholder="Spiti Valley, India">
  <div class="row"><div><label>Start</label><input type="date" name="start" required value="${today}"></div><div><label>End</label><input type="date" name="end" required value="${later}"></div></div>
  <label>Group size</label><input type="number" name="capacity" min="2" max="40" value="8">
  <label>What's the plan?</label><textarea name="description" maxlength="240" placeholder="Hikes, mountain huts and slow mornings."></textarea>
  <label>Tags</label><div class="chips" data-chips="gtags">${[...STYLES,...INTERESTS.slice(0,8)].map(x=>`<span class="chip" data-act="chip" data-v="${x}">${x}</span>`).join("")}</div>
  <div style="margin-top:16px"><button class="btn primary" type="submit">Publish group trip</button></div></form></div></div>`;
}

// ----- profile -----
function profileView(){
  const p=myP(); const t=myTrips().length, g=Object.values(S.joins).filter(j=>j.uid===S.me).length;
  return `<div class="eyebrow">Profile</div><h1>Travel looks<br><em>good on you.</em></h1>
  <div class="card" style="text-align:center;padding:24px">${av(S.me,p.name,"lg","margin:0 auto 10px;")}
  <h2 style="margin:0">${esc(p.name)}, ${esc(p.age)}</h2><div class="muted small">${esc(p.city||"")} · ${esc(p.travelStyle||"")}</div>
  ${p.email?`<div class="small muted" style="margin-top:2px">${esc(p.email)}</div>`:""}
  <div class="row" style="margin-top:14px;text-align:center"><div><b>${matches().length}</b><div class="small muted">Matches</div></div><div><b>${t}</b><div class="small muted">Trips</div></div><div><b>${g}</b><div class="small muted">Groups</div></div></div></div>
  <div class="card" style="margin-top:12px"><div class="row"><h3>Your travel identity</h3><button class="btn ghost sm" style="flex:none" data-act="edit">Edit</button></div>
  <p style="margin:8px 0">${esc(p.bio||"Add a line about yourself.")}</p><div class="chips">${(p.interests||[]).map(i=>`<span class="chip static">${esc(i)}</span>`).join("")}</div></div>
  <div class="card" style="margin-top:12px" data-act="edit"><h3>Dating preferences</h3><div class="small muted">Age ${esc(p.ageMin)}–${esc(p.ageMax)} · ${(p.interestedIn||[]).length?esc(p.interestedIn.join(", ")):"Everyone"}</div></div>
  <button class="btn ghost" style="margin-top:12px" data-act="restart">Show people I passed on again</button>
  <button class="btn forest" style="margin-top:10px" data-act="signout">Sign out</button>`;
}

// ---------- events ----------
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]"); if(!el) return;
  const a=el.dataset.act, v=el.dataset.v;
  if(a==="tab"){closeSubs();S.view=null;S.editing=false;S.tab=v;render();scrollTo(0,0)}
  else if(a==="chip"){el.classList.toggle("on")}
  else if(a==="like"||a==="pass"){if(!S.canWrite)return toast("View-only access");decide(v,a==="like")}
  else if(a==="closemodal"){if(e.target===el||el.tagName==="BUTTON")$("#overlay").innerHTML=""}
  else if(a==="openchat"){$("#overlay").innerHTML="";S.tab="matches";S.view={type:"chat",id:v};openSub(chatId(S.me,v),"chats/"+chatId(S.me,v)+"/msgs");render();}
  else if(a==="back"){closeSubs();S.view=null;render()}
  else if(a==="edit"){S.editing=true;render();scrollTo(0,0)}
  else if(a==="canceledit"){S.editing=false;render()}
  else if(a==="restart"){const l=myLikes();await safe(()=>S.db.doc("likes/"+S.me).set({liked:l.liked||[],passed:[]}));S.tab="discover";S.view=null;render();toast("Passed profiles are back in Discover")}
  else if(a==="newtrip"){tripModal(v)}
  else if(a==="opentrip"){S.tab="trips";S.view={type:"trip",id:v};render();scrollTo(0,0)}
  else if(a==="invite"){const who=$("#invsel").value;const tr=S.trips[v];await safe(()=>S.db.doc("trips/"+v).update({invited:[...new Set([...(tr.invited||[]),who])]}));toast(pname(who)+" is invited")}
  else if(a==="delact"){const tr=S.trips[v];const acts=JSON.parse(JSON.stringify(tr.activities||{}));acts[el.dataset.d]=(acts[el.dataset.d]||[]).filter(x=>x.id!==el.dataset.i);await safe(()=>S.db.doc("trips/"+v).update({activities:acts}))}
  else if(a==="deltrip"){if(confirm("Delete this trip?")){await safe(()=>S.db.doc("trips/"+v).delete());S.view=null;render()}}
  else if(a==="gfilter"){S.groupFilter=v;render()}
  else if(a==="newgroup"){groupModal()}
  else if(a==="opengroup"){S.view={type:"group",id:v};openSub("g"+v,"groups/"+v+"/posts");render();scrollTo(0,0)}
  else if(a==="join"){await safe(()=>S.db.doc("joins/"+v+"+"+S.me).set({gid:v,uid:S.me,at:Date.now()}));toast("You're in! Say hi in the group posts.")}
  else if(a==="signout"){await signOut(S.auth)}
  else if(a==="authmode"){S.authMode=v;renderAuth()}
  else if(a==="google"){try{await signInWithPopup(S.auth,new GoogleAuthProvider())}catch(err){authError(err)}}
  else if(a==="reset"){const em=document.querySelector('#authform [name=email]')?.value.trim();if(!em)return toast("Enter your email first");try{await sendPasswordResetEmail(S.auth,em);toast("Password reset email sent")}catch(err){authError(err)}}
  else if(a==="leave"){await safe(()=>S.db.doc("joins/"+v+"+"+S.me).delete())}
});
document.addEventListener("submit",async e=>{
  e.preventDefault(); const f=e.target;
  if(f.id==="authform"){
    const fd=Object.fromEntries(new FormData(f));const btn=f.querySelector("button[type=submit]");btn.disabled=true;
    try{ if(S.authMode==="signup") await createUserWithEmailAndPassword(S.auth,fd.email.trim(),fd.password);
         else await signInWithEmailAndPassword(S.auth,fd.email.trim(),fd.password); }
    catch(err){authError(err);btn.disabled=false}
    return;
  }
  if(f.id==="pform"){
    const fd=Object.fromEntries(new FormData(f));const pick=n=>[...f.querySelectorAll(`[data-chips="${n}"] .chip.on`)].map(c=>c.dataset.v);
    const lo=Math.max(18,+fd.ageMin||18),hi=Math.max(lo,+fd.ageMax||99);
    if(+fd.age<18) return toast("Roammate is for adults 18+");
    const photoURL = myP()?.photoURL || S.user?.photoURL || "";
    const email = myP()?.email || S.user?.email || "";
    await saveProfile({name:fd.name.trim(),age:+fd.age,gender:fd.gender,city:fd.city.trim(),bio:fd.bio.trim(),travelStyle:fd.travelStyle,
      interests:pick("interests"),interestedIn:pick("interestedIn"),ageMin:lo,ageMax:hi,photoURL,email});
    S.editing=false; render(); return;
  }
  const kind=f.dataset.form, v=f.dataset.v;
  if(kind==="msg"){const i=f.querySelector("input");const t=i.value.trim();if(!t)return;i.value="";await sendMsg(v,t)}
  else if(kind==="act"){const [ti,tm]=f.querySelectorAll("input");const t=ti.value.trim();if(!t)return;
    const tr=S.trips[v];const acts=JSON.parse(JSON.stringify(tr.activities||{}));const d=f.dataset.d;
    (acts[d]=acts[d]||[]).push({id:Math.random().toString(36).slice(2,9),title:t,time:tm.value||"",by:S.me});ti.value="";tm.value="";
    await safe(()=>S.db.doc("trips/"+v).update({activities:acts}))}
  else if(kind==="trip"){const fd=Object.fromEntries(new FormData(f));if(fd.end<fd.start)return toast("End date is before start date");
    const ref=S.db.collection("trips").doc();
    await safe(()=>ref.set({...fd,owner:S.me,invited:v?[v]:[],activities:{},createdAt:Date.now()}));
    $("#overlay").innerHTML="";closeSubs();S.tab="trips";S.view={type:"trip",id:ref.id};render();scrollTo(0,0)}
  else if(kind==="group"){const fd=Object.fromEntries(new FormData(f));if(fd.end<fd.start)return toast("End date is before start date");
    const tags=[...f.querySelectorAll('[data-chips="gtags"] .chip.on')].map(c=>c.dataset.v);
    const ref=S.db.collection("groups").doc();
    await safe(async()=>{await ref.set({...fd,capacity:+fd.capacity||8,tags,host:S.me,createdAt:Date.now()});await S.db.doc("joins/"+ref.id+"+"+S.me).set({gid:ref.id,uid:S.me,at:Date.now()})});
    $("#overlay").innerHTML="";S.view={type:"group",id:ref.id};openSub("g"+ref.id,"groups/"+ref.id+"/posts");render()}
  else if(kind==="post"){const ta=f.querySelector("textarea");const t=ta.value.trim();if(!t)return;ta.value="";
    await safe(()=>S.db.collection("groups/"+v+"/posts").add({from:S.me,text:t,at:Date.now()}))}
});

// ---------- auth + boot ----------
function authError(err){
  const m={"auth/invalid-credential":"Wrong email or password.","auth/email-already-in-use":"That email already has an account — log in instead.",
    "auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"That email doesn't look right.",
    "auth/popup-closed-by-user":"Google sign-in was closed.","auth/too-many-requests":"Too many attempts — try again in a bit."};
  toast(m[err?.code]||"Sign-in failed. Please try again."); console.error(err);
}
function renderAuth(){
  $("#nav").hidden=true; const up=S.authMode!=="login";
  $("#app").innerHTML=`<div class="hero-logo">${ICON.globe}</div><div class="eyebrow">Roammate</div>
  <h1>Find your next<br><em>favorite person.</em></h1>
  <p class="sub">Meet people who travel like you do, then turn a spark into a shared story.</p>
  <form id="authform" class="card">
    <label style="margin-top:0">Email</label><input name="email" type="email" required autocomplete="email" placeholder="you@example.com">
    <label>Password</label><input name="password" type="password" required minlength="6" autocomplete="${up?"new-password":"current-password"}" placeholder="At least 6 characters">
    <div style="margin-top:18px"><button class="btn primary" type="submit">${up?"Create account":"Log in"}</button></div>
    <div style="margin-top:10px"><button class="btn ghost" type="button" data-act="google">Continue with Google</button></div>
    <p class="small muted" style="text-align:center;margin:14px 0 0">${up?`Already have an account? <a href="#" data-act="authmode" data-v="login" style="color:var(--accent)">Log in</a>`
      :`New here? <a href="#" data-act="authmode" data-v="signup" style="color:var(--accent)">Create an account</a> · <a href="#" data-act="reset" style="color:var(--accent)">Forgot password</a>`}</p>
  </form>`;
}
let unsubs=[];
function boot(){
  if(!firebaseConfig?.apiKey || firebaseConfig.apiKey.startsWith("YOUR_")){
    $("#app").innerHTML=`<div class="eyebrow">Setup needed</div><h1>Add your Firebase config</h1><p class="sub">Open <b>firebase-config.js</b> and paste your Firebase web app config. See README.md for the steps.</p>`;return;
  }
  const app=initializeApp(firebaseConfig);
  S.auth=getAuth(app); S.db=makeDb(getFirestore(app),u=>unsubs.push(u)); S.authMode="signup";
  onAuthStateChanged(S.auth,u=>{
    unsubs.forEach(f=>{try{f()}catch{}}); unsubs=[]; closeSubs();
    Object.assign(S,{user:u,me:u?u.uid:null,profiles:{},likes:{},chats:{},trips:{},groups:{},joins:{},loaded:false,view:null,tab:"discover",editing:false,seenMatches:null});
    $("#overlay").innerHTML="";
    if(!u){renderAuth();return}
    render(); subscribeAll();
  });
}
boot();
})();
