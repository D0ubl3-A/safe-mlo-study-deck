function resize(){
  const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);
  ctx.setTransform(d,0,0,d,0,0);
}
addEventListener('resize',resize);resize();

const keys={};
addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  if(e.key==='e'||e.key==='E')inspectNearest();
});
addEventListener('keyup',e=>keys[e.key]=false);
document.querySelectorAll('[data-key]').forEach(b=>{
  const k=b.dataset.key;
  ['pointerdown','touchstart'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();keys[k]=true}));
  ['pointerup','pointercancel','pointerleave','touchend'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();keys[k]=false}));
});

const sprite={img:new Image(),ready:false};
sprite.img.onload=()=>sprite.ready=true;
sprite.img.onerror=()=>sprite.ready=false;
sprite.img.src='assets/sprites/shayla/shayla-spritesheet.png';

function camera(){
  const w=canvas.getBoundingClientRect().width,h=canvas.getBoundingClientRect().height;
  return{x:clamp(state.x-w/2,0,world.w-w),y:clamp(state.y-h/2,0,world.h-h),w,h};
}
function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawRoad(r,c){
  ctx.fillStyle='#5a626b';ctx.fillRect(r.x-c.x,r.y-c.y,r.w,r.h);
  ctx.strokeStyle='#e9dfaa99';ctx.lineWidth=2;ctx.setLineDash([18,18]);ctx.beginPath();
  if(r.dir==='v'){ctx.moveTo(r.x+r.w/2-c.x,r.y-c.y);ctx.lineTo(r.x+r.w/2-c.x,r.y+r.h-c.y)}
  else{ctx.moveTo(r.x-c.x,r.y+r.h/2-c.y);ctx.lineTo(r.x+r.w-c.x,r.y+r.h/2-c.y)}
  ctx.stroke();ctx.setLineDash([]);
}
function drawHome(h,c,target,sideTarget){
  const x=h.x-c.x,y=h.y-c.y;ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#0004';rounded(-40,18,100,58,10);ctx.fill();
  ctx.fillStyle=h.color;rounded(-44,-16,88,56,7);ctx.fill();
  ctx.fillStyle='#3f4a56';ctx.beginPath();ctx.moveTo(-52,-16);ctx.lineTo(0,-52);ctx.lineTo(52,-16);ctx.closePath();ctx.fill();
  ctx.fillStyle='#79a5c5';ctx.fillRect(-28,2,18,17);
  ctx.fillStyle='#6e4d32';ctx.fillRect(13,4,16,36);
  ctx.fillStyle='#d6c083';ctx.fillRect(18,8,3,3);
  if(target||sideTarget){
    ctx.strokeStyle=target?'#ffdf7c':'#7bbcff';ctx.lineWidth=4;ctx.beginPath();
    ctx.arc(0,-2,68+Math.sin(performance.now()/250)*4,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=target?'#ffdf7c':'#9dd0ff';ctx.font='800 11px system-ui';ctx.textAlign='center';
    ctx.fillText(target?'MISSION':'LUCKY LEAD',0,-68);
  }
  ctx.restore();
}
function drawPlayer(c,isMoving){
  const x=state.x-c.x,y=state.y-c.y;ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,13,18,8,0,0,Math.PI*2);ctx.fill();
  if(sprite.ready){
    const cols=4,rows=2,fw=sprite.img.naturalWidth/cols,fh=sprite.img.naturalHeight/rows;
    const row=isMoving?1:0,frame=Math.floor(performance.now()/(isMoving?120:320))%cols;
    ctx.drawImage(sprite.img,frame*fw,row*fh,fw,fh,-27,-61,54,72);
  }else{
    ctx.fillStyle='#171a22';ctx.fillRect(-8,-2,7,22);ctx.fillRect(2,-2,7,22);
    ctx.fillStyle='#e5ba57';rounded(-14,-31,28,34,8);ctx.fill();
    ctx.fillStyle='#6f482d';ctx.beginPath();ctx.arc(0,-43,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='900 8px system-ui';ctx.textAlign='center';ctx.fillText('SL',0,-12);
  }
  ctx.restore();
}

let moving=false;
function draw(){
  const c=camera();ctx.clearRect(0,0,c.w,c.h);ctx.fillStyle='#c7d0b1';ctx.fillRect(0,0,c.w,c.h);
  for(const n of neighborhoods){
    const locked=state.rep<n.unlock;ctx.fillStyle=n.tint;ctx.globalAlpha=locked ? .32 : .62;
    rounded(n.x-c.x,n.y-c.y,n.w,n.h,30);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#2b3544aa';ctx.font='800 13px system-ui';ctx.fillText((locked?'🔒 ':'')+n.name,n.x-c.x+18,n.y-c.y+25);
  }
  for(const p of world.parks){
    ctx.fillStyle='#7ba66d';rounded(p.x-c.x,p.y-c.y,p.w,p.h,22);ctx.fill();
    for(let i=0;i<14;i++){ctx.fillStyle='#507a49';ctx.beginPath();ctx.arc(p.x-c.x+18+(i*37)%p.w,p.y-c.y+20+(i*51)%p.h,8,0,Math.PI*2);ctx.fill()}
  }
  world.roads.forEach(r=>drawRoad(r,c));
  const m=missions[clamp(state.mission,0,missions.length-1)];
  const target=state.finaleComplete?null:m.target,side=state.bonusLead?.target;
  homes.forEach(h=>drawHome(h,c,h.id===target,h.id===side));
  drawPlayer(c,moving);
  requestAnimationFrame(draw);
}

let last=performance.now();
function tick(now){
  const dt=Math.min((now-last)/16.67,2.2);last=now;
  let dx=0,dy=0;
  if(keys.ArrowUp||keys.w||keys.W)dy-=1;
  if(keys.ArrowDown||keys.s||keys.S)dy+=1;
  if(keys.ArrowLeft||keys.a||keys.A)dx-=1;
  if(keys.ArrowRight||keys.d||keys.D)dx+=1;
  moving=!!(dx||dy);
  if(moving){
    const mag=Math.hypot(dx,dy)||1,sprint=(keys.Shift?1.55:1);
    state.x=clamp(state.x+dx/mag*4.6*sprint*dt,20,world.w-20);
    state.y=clamp(state.y+dy/mag*4.6*sprint*dt,20,world.h-20);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);requestAnimationFrame(draw);

function nearestHome(){
  let best=null,dist=1e9;
  for(const h of homes){const d=Math.hypot(h.x-state.x,h.y-state.y);if(d<dist){dist=d;best=h}}
  return{home:best,dist};
}
function openModal(title,body,actions=[],details='',eyebrow='Property Opportunity'){
  $('modalEyebrow').textContent=eyebrow;$('modalTitle').textContent=title;$('modalBody').innerHTML=body;
  $('modalDetails').innerHTML=details;$('modalActions').innerHTML='';
  actions.forEach(a=>{
    const b=document.createElement('button');b.className=a.primary?'primary':'secondary';
    if(a.danger)b.classList.add('danger');b.textContent=a.label;b.onclick=a.onClick;$('modalActions').appendChild(b);
  });
  $('modalBack').classList.add('open');
}
function closeModal(){$('modalBack').classList.remove('open')}
$('closeModal').onclick=closeModal;
$('modalBack').addEventListener('click',e=>{if(e.target===$('modalBack'))closeModal()});

function inspectNearest(){
  const {home:h,dist}=nearestHome();
  if(dist>115){toast('Move closer to a property');return}
  const hood=neighborhoods.find(n=>n.name===h.hood);
  if(hood&&state.rep<hood.unlock){toast(h.hood+' unlocks at '+hood.unlock+' reputation');return}
  if(!state.seenHomes.includes(h.id))state.seenHomes.push(h.id);
  checkAchievements();save();
  const m=missions[clamp(state.mission,0,missions.length-1)];
  const missionTarget=!state.finaleComplete&&m.target===h.id,sideTarget=state.bonusLead?.target===h.id;
  const issueReveal=state.skills.inspection>=2?`<p class="muted"><b>Inspection edge:</b> ${h.issue}</p>`:'';
  const details=`<div class="stats"><div class="stat"><b>${money(h.price)}</b><span>Simulated price</span></div>
    <div class="stat"><b>${h.beds} / ${h.baths}</b><span>Beds / baths</span></div>
    <div class="stat"><b>${h.match}%</b><span>Client match</span></div>
    <div class="stat"><b>${h.value}</b><span>Value IQ</span></div></div>${issueReveal}`;
  if(sideTarget)return runBonusLead(h,details);
  if(missionTarget)return runMission(h,details);
  openModal(h.name,`Explore this simulated property in <b>${h.hood}</b>. Build market knowledge or use it as a future client comparison.`,
    [{label:'Study the property',primary:true,onClick:()=>{recordChoice(true);addRewards(12,0,10,{quality:'perfect',type:'inspection'});closeModal();toast('Market knowledge gained')}}],details);
}
