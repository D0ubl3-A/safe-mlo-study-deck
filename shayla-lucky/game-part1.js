'use strict';

const $=id=>document.getElementById(id);
const canvas=$('game');
const ctx=canvas.getContext('2d');
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Math.round(n));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const todayKey=()=>new Date().toLocaleDateString('en-CA');
const yesterdayKey=()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toLocaleDateString('en-CA')};
const toast=t=>{const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2300)};

const defaults={
  version:2,x:560,y:500,level:1,xp:0,rep:120,money:0,deals:0,seen:0,seenHomes:[],streak:1,lastPlayDay:null,
  momentum:1,skillPoints:0,skills:{negotiation:0,inspection:0,networking:0},mission:0,completed:[],
  guessedDate:null,achievements:[],leadMeter:0,bonusLead:null,totalSavings:0,perfectChoices:0,sideDeals:0,finaleComplete:false
};
let saved={};
try{saved=JSON.parse(localStorage.getItem('shaylaLuckyGameV2')||localStorage.getItem('shaylaLuckyGame')||'{}')}catch{}
const state={...defaults,...saved,skills:{...defaults.skills,...(saved.skills||{})},seenHomes:Array.isArray(saved.seenHomes)?saved.seenHomes:[]};

function updateStreak(){
  const t=todayKey();
  if(state.lastPlayDay===t)return;
  if(state.lastPlayDay===yesterdayKey()) state.streak=Math.max(1,(state.streak||1)+1);
  else if(state.lastPlayDay) state.streak=1;
  state.lastPlayDay=t;
}
updateStreak();
const save=()=>localStorage.setItem('shaylaLuckyGameV2',JSON.stringify(state));

const world={w:1900,h:1380,roads:[],parks:[],homes:[]};
for(let x=120;x<world.w;x+=280)world.roads.push({x:x-34,y:0,w:68,h:world.h,dir:'v'});
for(let y=110;y<world.h;y+=240)world.roads.push({x:0,y:y-32,w:world.w,h:64,dir:'h'});

const neighborhoods=[
  {name:'Starter District',x:150,y:145,w:470,h:330,tint:'#d7c7a2',unlock:0},
  {name:'Family District',x:720,y:145,w:500,h:330,tint:'#b9d0a1',unlock:300},
  {name:'Investor Row',x:130,y:650,w:490,h:390,tint:'#c7b5a6',unlock:500},
  {name:'Luxury Heights',x:730,y:650,w:850,h:390,tint:'#c8c0da',unlock:900},
  {name:'Summit Estates',x:1250,y:145,w:480,h:330,tint:'#d7c7dc',unlock:1800}
];
world.parks=[{x:860,y:250,w:230,h:130},{x:1360,y:730,w:170,h:180}];

const homes=[
  {id:'H1',name:'Sunset Courtyard',x:278,y:250,price:419000,beds:3,baths:2,match:94,hood:'Starter District',color:'#e5c59b',issue:'Aging water heater',value:92},
  {id:'H2',name:'Mesa Lane',x:520,y:410,price:405000,beds:3,baths:2,match:88,hood:'Starter District',color:'#d2a582',issue:'Roof wear',value:90},
  {id:'H3',name:'Parkside Family Home',x:905,y:390,price:615000,beds:4,baths:3,match:91,hood:'Family District',color:'#dbd6bf',issue:'HVAC nearing service interval',value:89},
  {id:'H4',name:'Juniper Pool House',x:1120,y:250,price:672000,beds:4,baths:3,match:89,hood:'Family District',color:'#c9d2d1',issue:'Pool equipment service due',value:87},
  {id:'H5',name:'Value-Add Bungalow',x:300,y:805,price:289000,beds:3,baths:2,match:86,hood:'Investor Row',color:'#bda58d',issue:'Kitchen + roof rehab',value:95},
  {id:'H6',name:'Corner Duplex',x:535,y:930,price:348000,beds:4,baths:2,match:82,hood:'Investor Row',color:'#c2b1a8',issue:'Deferred exterior maintenance',value:88},
  {id:'H7',name:'Skyline Estate',x:980,y:800,price:1375000,beds:5,baths:5,match:96,hood:'Luxury Heights',color:'#e1ded3',issue:'Premium finish punch list',value:97},
  {id:'H8',name:'Canyon Glass House',x:1260,y:980,price:1895000,beds:5,baths:6,match:93,hood:'Luxury Heights',color:'#c8d3de',issue:'Custom glazing inspection',value:96},
  {id:'H9',name:'Summit View Residence',x:1460,y:320,price:2480000,beds:6,baths:7,match:98,hood:'Summit Estates',color:'#ddd6ce',issue:'Smart-home commissioning',value:99}
];
world.homes=homes;

const missions=[
  {title:'Earn the first set of keys',text:'Meet the Carters at Sunset Courtyard and prove you understand their needs before the house.',target:'H1',progress:10,reward:'Up to 90 REP · $5.2K',unlock:0},
  {title:'Catch what others miss',text:'Inspect Mesa Lane and protect the buyers from an expensive surprise.',target:'H2',progress:23,reward:'Up to 115 REP · Skill progress',unlock:0},
  {title:'Win the negotiation',text:'Structure the Mesa Lane offer around certainty, repairs and client budget.',target:'H2',progress:37,reward:'Up to 140 REP · $7.4K',unlock:0},
  {title:'Think like an investor',text:'Analyze Value-Add Bungalow and keep the renovation from eating the spread.',target:'H5',progress:51,reward:'Up to 170 REP · $9.8K',unlock:500},
  {title:'Turn one client into three',text:'Visit Juniper Pool House and earn a referral by putting fit ahead of pressure.',target:'H4',progress:64,reward:'Referral lead · 185 REP',unlock:300},
  {title:'Break into luxury',text:'Reach 900 reputation. Luxury Heights unlocks when the market trusts the brand.',target:null,progress:74,reward:'Luxury Heights',unlock:900},
  {title:'Win the million-dollar listing',text:'Tour Skyline Estate and pitch premium positioning instead of generic exposure.',target:'H7',progress:88,reward:'Up to 360 REP · $31K',unlock:900},
  {title:'Keys to the City',text:'Close Canyon Glass House with a client-first strategy and become a Market Legend.',target:'H8',progress:100,reward:'Prestige milestone',unlock:1500}
];

const ranks=[['Rising Agent',0],['Neighborhood Specialist',250],['Deal Maker',500],['Top Producer',900],['Luxury Specialist',1500],['Market Legend',2500],['Keys to the City',4000]];
function rankName(){let r=ranks[0][0];for(const [n,min] of ranks)if(state.rep>=min)r=n;return r}
function nextRank(){for(const [n,min] of ranks)if(state.rep<min)return{name:n,min};return{name:'City Icon',min:state.rep}}
function multiplier(){return 1+Math.max(0,state.momentum-1)*0.12}
function skillBonus(type){return 1+(state.skills[type]||0)*0.05}
function hoodUnlocked(h){const hood=neighborhoods.find(n=>n.name===h.hood);return !hood||state.rep>=hood.unlock}

const achievements=[
  {id:'firstClose',icon:'🔑',name:'First Keys',desc:'Close the first client mission.',test:()=>state.deals>=1},
  {id:'perfect3',icon:'⭐',name:'Trusted Advisor',desc:'Make 3 top-tier client decisions.',test:()=>state.perfectChoices>=3},
  {id:'explorer8',icon:'🏘️',name:'Market Explorer',desc:'Inspect 8 different properties.',test:()=>state.seenHomes.length>=8},
  {id:'momentum5',icon:'🔥',name:'On Fire',desc:'Reach 5× decision momentum.',test:()=>state.momentum>=5},
  {id:'luxury',icon:'💎',name:'Luxury Lucky',desc:'Close a luxury mission.',test:()=>state.mission>=7},
  {id:'legend',icon:'🏆',name:'City Legend',desc:'Earn 2,500 reputation.',test:()=>state.rep>=2500}
];

function checkAchievements(){
  for(const a of achievements){
    if(a.test()&&!state.achievements.includes(a.id)){
      state.achievements.push(a.id);
      state.skillPoints++;
      toast('Achievement unlocked: '+a.name+' · +1 skill point');
    }
  }
}

function addRewards(rep,cash,xp,{quality='good',type='networking'}={}){
  const m=quality==='perfect'?multiplier():1;
  const repGain=Math.round(rep*m*skillBonus('networking'));
  const cashGain=Math.round(cash*m*skillBonus(type==='negotiation'?'negotiation':'networking'));
  const xpGain=Math.round(xp*skillBonus('inspection'));
  state.rep+=repGain;state.money+=cashGain;state.xp+=xpGain;
  let leveled=0;
  while(state.xp>=100){state.xp-=100;state.level++;state.skillPoints++;leveled++}
  if(leveled)toast('Level up! Level '+state.level+' · +'+leveled+' skill point'+(leveled>1?'s':''));
  checkAchievements();save();syncUI();
  return{repGain,cashGain,xpGain};
}

function recordChoice(perfect){
  if(perfect){state.perfectChoices++;state.momentum=clamp(state.momentum+1,1,5)}
  else state.momentum=Math.max(1,state.momentum-1);
  state.leadMeter+=perfect?2:1;
  if(state.skills.networking>=2)state.leadMeter++;
  maybeCreateLead();checkAchievements();
}

function maybeCreateLead(){
  if(state.bonusLead||state.leadMeter<5)return;
  const currentTarget=missions[state.mission]?.target;
  const pool=homes.filter(h=>h.id!==currentTarget&&hoodUnlocked(h));
  if(!pool.length)return;
  const h=pool[(state.deals+state.sideDeals+state.level)%pool.length];
  state.bonusLead={
    target:h.id,
    name:['Relocation Buyer','Investor Referral','Move-Up Family','Executive Buyer'][(state.level+state.deals)%4],
    budget:h.price+45000
  };
  state.leadMeter=0;
  toast('Lucky Lead unlocked — a referral just hit your phone');
}

function syncUI(){
  const m=missions[clamp(state.mission,0,missions.length-1)];
  state.seen=state.seenHomes.length;
  $('hudLevel').textContent=state.level;
  $('hudRep').textContent=state.rep.toLocaleString();
  $('hudMoney').textContent=money(state.money);
  $('hudMomentum').textContent=state.momentum+'×';
  $('statDeals').textContent=state.deals+state.sideDeals;
  $('statHomes').textContent=state.seen;
  $('statStreak').textContent=state.streak;
  $('statSkills').textContent=state.skillPoints;
  $('rankName').textContent=rankName();
  $('xpFill').style.width=state.xp+'%';
  $('xpText').textContent=state.xp+' / 100 XP';
  $('missionTitle').textContent=state.finaleComplete?'Career complete — keep building the empire':m.title;
  $('missionText').textContent=state.finaleComplete?'Luxury referrals, daily challenges, skills and the leaderboard remain active after earning the Keys to the City.':m.text;
  $('missionProgress').style.width=(state.finaleComplete?100:m.progress)+'%';
  $('rewardPreview').textContent=state.finaleComplete?'Prestige play active':m.reward;
  const nr=nextRank();
  $('nextUnlock').textContent=nr.name==='City Icon'?'Max current career tier reached':'Next rank: '+nr.name+' at '+nr.min.toLocaleString()+' REP';
  $('momentumValue').textContent=state.momentum+'×';
  $('momentumBonus').textContent='Perfect-choice reward multiplier: '+multiplier().toFixed(2)+'×';
  renderListings();renderRankings();renderSkills();renderAchievements();renderMissions();renderLead();renderDaily();save();
}

function renderListings(){
  $('listings').innerHTML=homes.map(h=>{
    const locked=!hoodUnlocked(h);
    return `<div class="listing" style="opacity:${locked ? .48 : 1}">
      <div class="listingTop"><b>${locked?'🔒 ':''}${h.name}</b><em>${money(h.price)}</em></div>
      <p>${h.beds}BR · ${h.baths}BA · ${h.hood}</p>
      <div class="bar"><i style="width:${h.match}%"></i></div>
    </div>`;
  }).join('');
}

function renderRankings(){
  const leaders=[
    ['ClosingQueen',18420],['VegasKeyMaster',16980],['PropertyBoss',15140],
    ['Shayla Player',Math.round(state.rep*8.2+(state.deals+state.sideDeals)*440)],['HomeHunter',11200]
  ].sort((a,b)=>b[1]-a[1]);
  $('rankings').innerHTML=leaders.map((l,i)=>`<div class="leader ${l[0]==='Shayla Player'?'you':''}">
    <span class="pos">#${i+1}</span><span class="name">${l[0]}</span><span class="score">${l[1].toLocaleString()}</span>
  </div>`).join('');
}

function renderSkills(){
  const defs={
    negotiation:['Negotiation','More game commission from strong offers.'],
    inspection:['Inspection','More XP and stronger property-read rewards.'],
    networking:['Networking','More reputation and faster referral leads.']
  };
  $('skills').innerHTML='<div class="skillGrid">'+Object.entries(defs).map(([k,v])=>`<div class="skillCard">
    <b>${v[0]} · ${state.skills[k]}/5</b><p>${v[1]}</p>
    <button data-skill="${k}" ${state.skillPoints<=0||state.skills[k]>=5?'disabled':''}>Upgrade · 1 point</button>
  </div>`).join('')+'</div>';
  document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>upgradeSkill(b.dataset.skill));
}

function renderAchievements(){
  $('achievements').innerHTML=achievements.map(a=>{
    const got=state.achievements.includes(a.id);
    return `<div class="achievement ${got?'':'locked'}"><div class="badge">${a.icon}</div>
      <div><b>${a.name}</b><p>${a.desc}${got?' · UNLOCKED':''}</p></div></div>`;
  }).join('');
}

function renderMissions(){
  $('missions').innerHTML=missions.map((m,i)=>{
    const done=i<state.mission||state.finaleComplete;
    const active=i===state.mission&&!state.finaleComplete;
    const locked=m.unlock>state.rep&&i>=state.mission;
    return `<div class="listing" style="opacity:${locked ? .5 : 1}">
      <div class="listingTop"><b>${done?'✓ ':active?'▶ ':locked?'🔒 ':''}${m.title}</b>
      <em>${done?'DONE':active?'ACTIVE':m.unlock?m.unlock+' REP':'NEXT'}</em></div>
      <p>${m.text}</p>${active?`<div class="bar"><i style="width:${m.progress}%"></i></div>`:''}
    </div>`;
  }).join('');
}

function renderLead(){
  const host=$('leadHost');
  if(!state.bonusLead){
    host.innerHTML='<p class="muted tiny">Referral meter '+state.leadMeter+'/5 · strong decisions fill it faster.</p>';
    return;
  }
  const h=homes.find(x=>x.id===state.bonusLead.target);
  if(!h){state.bonusLead=null;return renderLead()}
  host.innerHTML=`<div class="leadCard pulse"><div class="eyebrow">Lucky Lead</div>
    <b>${state.bonusLead.name}</b>
    <p>Budget up to ${money(state.bonusLead.budget)} · Best current match: ${h.name}</p>
    <button id="leadBtn">Set as side objective</button></div>`;
  $('leadBtn').onclick=()=>{state.x=h.x-90;state.y=h.y+35;save();toast('Referral pinned — inspect '+h.name)};
}

function upgradeSkill(k){
  if(state.skillPoints<=0||state.skills[k]>=5)return;
  state.skillPoints--;state.skills[k]++;save();syncUI();
  toast(k[0].toUpperCase()+k.slice(1)+' upgraded to '+state.skills[k]+'/5');
}

const dailyValues=[439000,459000,475000,489000,505000];
function dailyActual(){const d=new Date();return dailyValues[(d.getFullYear()+d.getMonth()+d.getDate())%dailyValues.length]}
function renderDaily(){
  const done=state.guessedDate===todayKey();
  $('guessResult').textContent=done?'Completed today':'?';
  document.querySelectorAll('[data-guess]').forEach(b=>b.disabled=done);
}
