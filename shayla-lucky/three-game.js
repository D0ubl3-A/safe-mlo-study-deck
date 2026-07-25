import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';

const $ = (id) => document.getElementById(id);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Math.round(n));

const saveKey = 'shaylaLucky3D_v1';
const defaults = {x:0,z:34,yaw:Math.PI,level:1,xp:0,rep:120,money:0,momentum:1,deals:0,mission:0,seen:[],skillPoints:0};
let state = {...defaults};
try { state = {...defaults,...JSON.parse(localStorage.getItem(saveKey)||'{}')}; } catch {}
const save = ()=>localStorage.setItem(saveKey,JSON.stringify(state));

const missions = [
  {title:'Meet the client at the open house',text:'Walk to Sunset Courtyard and inspect the property.',target:'starter',rep:90,cash:5200},
  {title:'Protect the buyer',text:'Inspect Mesa Lane and catch the roof issue before making an offer.',target:'suburban',rep:115,cash:4100},
  {title:'Win the negotiation',text:'Meet at the Bank & Loan Center and structure a client-first offer.',target:'bank',rep:140,cash:7400},
  {title:'Break into luxury',text:'Reach the mansion district and win the million-dollar listing.',target:'mansion',rep:360,cash:31000},
  {title:'Keys to the City',text:'Reach the marina overlook and complete the luxury market tour.',target:'marina',rep:500,cash:42000}
];

const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dc9ef);
scene.fog = new THREE.Fog(0x9dc9ef,95,230);
const camera = new THREE.PerspectiveCamera(56,innerWidth/innerHeight,0.1,500);

const hemi = new THREE.HemisphereLight(0xeaf6ff,0x6f7d4c,2.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d1,4.2);
sun.position.set(-55,85,30); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-120; sun.shadow.camera.right=120; sun.shadow.camera.top=120; sun.shadow.camera.bottom=-120;
scene.add(sun);

const mats = {
  grass:new THREE.MeshStandardMaterial({color:0x739b58,roughness:.95}),
  road:new THREE.MeshStandardMaterial({color:0x3d444c,roughness:.95}),
  sidewalk:new THREE.MeshStandardMaterial({color:0xc9c4bb,roughness:.9}),
  white:new THREE.MeshStandardMaterial({color:0xf2eee5,roughness:.78}),
  stone:new THREE.MeshStandardMaterial({color:0xb7aa96,roughness:.9}),
  dark:new THREE.MeshStandardMaterial({color:0x202733,roughness:.65}),
  glass:new THREE.MeshPhysicalMaterial({color:0x5ba9cf,roughness:.16,metalness:.15,transparent:true,opacity:.78}),
  roof:new THREE.MeshStandardMaterial({color:0x26313a,roughness:.9}),
  gold:new THREE.MeshStandardMaterial({color:0xd2a844,metalness:.62,roughness:.28}),
  wood:new THREE.MeshStandardMaterial({color:0x8a684b,roughness:.9}),
  water:new THREE.MeshPhysicalMaterial({color:0x2f98c5,roughness:.18,metalness:.05,transparent:true,opacity:.82})
};

function box(w,h,d,mat,x,y,z,cast=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m;
}
function cyl(r,h,mat,x,y,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function label(text,x,y,z,scale=1.0){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.fillStyle='rgba(9,12,18,.88)';g.roundRect(15,15,994,226,28);g.fill();g.strokeStyle='#d8b45f';g.lineWidth=8;g.stroke();g.fillStyle='#f8e5ad';g.font='800 72px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.position.set(x,y,z);s.scale.set(10*scale,2.5*scale,1);scene.add(s);return s;
}
function tree(x,z,s=1){cyl(.23*s,4.2*s,new THREE.MeshStandardMaterial({color:0x755236}),x,2.1*s,z);const crown=new THREE.Mesh(new THREE.SphereGeometry(1.75*s,12,9),new THREE.MeshStandardMaterial({color:0x3d793d,roughness:1}));crown.position.set(x,4.9*s,z);crown.castShadow=true;scene.add(crown);}
function palm(x,z,s=1){cyl(.18*s,5.2*s,new THREE.MeshStandardMaterial({color:0x9a7752}),x,2.6*s,z);for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.BoxGeometry(.18*s,.05*s,3.1*s),new THREE.MeshStandardMaterial({color:0x3f8b43}));leaf.position.set(x,5.4*s,z);leaf.rotation.y=i*Math.PI*2/7;leaf.rotation.x=-.22;leaf.translateZ(1.35*s);leaf.castShadow=true;scene.add(leaf);}}

// Terrain / roads / sidewalks
box(260,.6,220,mats.grass,0,-.35,0,false);
for(const z of [-40,0,40]) box(260,.12,11,mats.road,0,.02,z,false);
for(const x of [-65,-25,25,65]) box(11,.12,220,mats.road,x,.025,0,false);
for(const z of [-47,-33,-7,7,33,47]) box(260,.09,3.6,mats.sidewalk,0,.08,z,false);
for(const x of [-72,-58,-32,-18,18,32,58,72]) box(3.6,.09,220,mats.sidewalk,x,.08,0,false);

const interactables=[];
const colliders=[];
function addCollider(x,z,w,d){colliders.push({x,z,w,d});}
function register(id,name,x,z,range=7){interactables.push({id,name,x,z,range});}

function house({id,name,x,z,w=15,d=12,h=7,wall=mats.white,roof=mats.roof,luxury=false}){
  box(w,h,d,wall,x,h/2,z); addCollider(x,z,w+1,d+1);
  const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,4,4),roof);r.position.set(x,h+2,z);r.rotation.y=Math.PI/4;r.castShadow=true;r.receiveShadow=true;scene.add(r);
  box(2.3,3.6,.35,mats.wood,x,h*.25,z-d/2-.19);
  for(const dx of [-w*.28,w*.28]) box(2.5,2.1,.24,mats.glass,x+dx,h*.63,z-d/2-.2,false);
  if(luxury){box(w*.65,.25,4,mats.water,x,h*.12,z+d*.62,false);for(const dx of [-w*.42,w*.42])palm(x+dx,z-d*.8,.8);}
  label(name,x,h+6,z,0.72);register(id,name,x,z);
}

house({id:'starter',name:'SUNSET COURTYARD',x:-96,z:-65,w:14,d:11,h:6,wall:new THREE.MeshStandardMaterial({color:0x6b8190,roughness:.88})});
house({id:'suburban',name:'MESA LANE',x:-47,z:-65,w:17,d:13,h:7,wall:new THREE.MeshStandardMaterial({color:0xc5ad8e,roughness:.9})});
house({id:'mansion',name:'LUXURY HEIGHTS',x:51,z:-66,w:27,d:20,h:10,wall:mats.white,luxury:true});
house({id:'openhouse',name:'OPEN HOUSE',x:-1,z:-66,w:16,d:13,h:7,wall:new THREE.MeshStandardMaterial({color:0xd2c5a7,roughness:.88})});

// Real estate office
box(23,8,15,mats.dark,-95,4,22);addCollider(-95,22,24,16);box(19,5,.3,mats.glass,-95,4,14.35,false);label('SHAYLA LUCKY REAL ESTATE',-95,10.5,14,0.62);register('office','Shayla Lucky Real Estate',-95,22);
// Bank
box(23,9,16,mats.stone,-48,4.5,22);addCollider(-48,22,24,17);for(const dx of [-7,-3.5,0,3.5,7])cyl(.55,7,mats.white,-48+dx,3.5,13.7);box(25,1,18,mats.white,-48,9.2,22);label('BANK & LOAN CENTER',-48,12.2,13.4,.7);register('bank','Bank & Loan Center',-48,22);
// Condo tower
box(20,45,18,mats.dark,46,22.5,18);addCollider(46,18,21,19);for(let y=4;y<44;y+=4){for(const x of [38.5,43.5,48.5,53.5])box(3.7,2.4,.25,mats.glass,x,y,8.9,false);}label('CONDO TOWER',46,49,18,.7);
// Office building
box(25,28,19,mats.dark,94,14,19);addCollider(94,19,26,20);box(23,24,.3,mats.glass,94,14,9.35,false);label('MARKET CENTER',94,31,19,.7);

// Park
box(40,.15,33,new THREE.MeshStandardMaterial({color:0x5d8e55}),-17,.1,70,false);for(const p of [[-32,59],[-20,61],[-5,61],[-30,78],[-8,79]])tree(p[0],p[1],.8);cyl(4,.7,mats.stone,-17,.35,70);cyl(2.5,1.1,mats.water,-17,.9,70);label('CITY PARK',-17,6,70,.6);register('park','City Park',-17,70);
// Marina
box(58,.08,36,mats.water,76,.08,74,false);for(const x of [53,67,81,95])box(2,.5,28,mats.wood,x,.25,74);for(const x of [57,72,88]){const hull=new THREE.Mesh(new THREE.CapsuleGeometry(1.5,6,5,12),mats.white);hull.rotation.z=Math.PI/2;hull.position.set(x,.8,75);scene.add(hull);}label('MARINA',76,6,58,.65);register('marina','Marina Overlook',76,58,10);

// Construction lot
box(30,.1,25,new THREE.MeshStandardMaterial({color:0x9b7654}),85,.1,-65,false);for(let i=0;i<12;i++)box(.4,3,.4,mats.wood,72+(i%4)*8,1.5,-74+Math.floor(i/4)*8);label('CONSTRUCTION LOT',85,5,-65,.55);

for(let i=0;i<45;i++){const x=-120+(i*37)%240,z=-98+(i*53)%196;if(Math.abs(x)%40>12&&Math.abs(z)%40>12)tree(x,z,.6+.25*((i%3)));}
for(const p of [[39,-50],[62,-50],[31,-83],[71,-82],[101,45],[-108,50]])palm(p[0],p[1],.8);

// Open-house sign / mission beacon
const signPost=box(.4,4,.4,mats.white,-8,2,-49);box(5.5,3,.3,mats.dark,-8,3.2,-49);label('OPEN HOUSE',-8,5.2,-48.7,.47);
const beacon=new THREE.Mesh(new THREE.TorusGeometry(3.2,.18,10,32),new THREE.MeshStandardMaterial({color:0xffd45f,emissive:0x8a5a00,emissiveIntensity:2}));beacon.rotation.x=Math.PI/2;beacon.position.set(-96,.4,-65);scene.add(beacon);

// Shayla 3D avatar based on uploaded luxury sprite reference: black suit, long black hair, glasses.
const shayla=new THREE.Group();scene.add(shayla);
const skin=new THREE.MeshStandardMaterial({color:0xb8785b,roughness:.72});
const suit=new THREE.MeshStandardMaterial({color:0x111318,roughness:.72});
const blouse=new THREE.MeshStandardMaterial({color:0xf2f0ea,roughness:.8});
const hairMat=new THREE.MeshStandardMaterial({color:0x111014,roughness:.68});
const shoeMat=new THREE.MeshStandardMaterial({color:0x08090b,roughness:.55});
const torso=new THREE.Mesh(new THREE.BoxGeometry(1.25,1.65,.62),suit);torso.position.y=2.65;torso.castShadow=true;shayla.add(torso);
const shirt=new THREE.Mesh(new THREE.BoxGeometry(.48,1.16,.66),blouse);shirt.position.set(0,2.68,.03);shayla.add(shirt);
const head=new THREE.Mesh(new THREE.SphereGeometry(.43,16,12),skin);head.position.y=3.95;head.castShadow=true;shayla.add(head);
const hairBack=new THREE.Mesh(new THREE.SphereGeometry(.57,16,12,0,Math.PI*2,0,Math.PI*.72),hairMat);hairBack.scale.set(1,1.45,.8);hairBack.position.set(0,3.95,-.18);shayla.add(hairBack);
for(const side of [-1,1]){const hlock=new THREE.Mesh(new THREE.CapsuleGeometry(.15,1.15,4,8),hairMat);hlock.position.set(side*.36,3.45,-.1);hlock.rotation.z=side*.08;shayla.add(hlock);}
const glasses=new THREE.Group();for(const side of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,6,16),shoeMat);ring.position.set(side*.2,4.02,.38);glasses.add(ring);}box;const bridgeG=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,.03),shoeMat);bridgeG.position.set(0,4.02,.38);glasses.add(bridgeG);shayla.add(glasses);
const limbs={};
function limb(name,w,h,d,mat,x,y,z){const pivot=new THREE.Group();pivot.position.set(x,y,z);const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.y=-h/2;mesh.castShadow=true;pivot.add(mesh);shayla.add(pivot);limbs[name]=pivot;return pivot;}
limb('armL',.32,1.55,.35,suit,-.78,3.22,0);limb('armR',.32,1.55,.35,suit,.78,3.22,0);
limb('legL',.42,1.75,.48,suit,-.34,1.85,0);limb('legR',.42,1.75,.48,suit,.34,1.85,0);
const heelL=new THREE.Mesh(new THREE.BoxGeometry(.44,.22,.78),shoeMat);heelL.position.set(-.34,.08,.12);shayla.add(heelL);const heelR=heelL.clone();heelR.position.x=.34;shayla.add(heelR);
shayla.scale.set(1.05,1.05,1.05);shayla.position.set(state.x,0,state.z);shayla.rotation.y=state.yaw;

const keys={};
let orbitYaw=0, orbitPitch=.28, orbitDistance=10.5;
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')interact();});
addEventListener('keyup',e=>keys[e.code]=false);
let dragging=false,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;orbitYaw-=(e.clientX-lastX)*.006;orbitPitch=clamp(orbitPitch-(e.clientY-lastY)*.004,-.05,.65);lastX=e.clientX;lastY=e.clientY;});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('wheel',e=>{orbitDistance=clamp(orbitDistance+e.deltaY*.01,6,16);},{passive:true});

const touch={x:0,y:0};
const stick=$('stick'),knob=$('stickKnob');
function setStick(clientX,clientY){const r=stick.getBoundingClientRect();let dx=clientX-(r.left+r.width/2),dy=clientY-(r.top+r.height/2);const max=r.width*.34,mag=Math.hypot(dx,dy)||1;if(mag>max){dx=dx/mag*max;dy=dy/mag*max;}knob.style.transform=`translate(${dx}px,${dy}px)`;touch.x=dx/max;touch.y=dy/max;}
stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);setStick(e.clientX,e.clientY)});stick.addEventListener('pointermove',e=>{if(stick.hasPointerCapture(e.pointerId))setStick(e.clientX,e.clientY)});function resetStick(){touch.x=touch.y=0;knob.style.transform='translate(0,0)'}stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);
$('interactBtn').onclick=interact;

function collides(nx,nz){for(const c of colliders){if(Math.abs(nx-c.x)<c.w/2+.7&&Math.abs(nz-c.z)<c.d/2+.7)return true;}return false;}
function nearestInteractive(){let best=null,dist=1e9;for(const p of interactables){const d=Math.hypot(shayla.position.x-p.x,shayla.position.z-p.z);if(d<dist){dist=d;best=p;}}return {best,dist};}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2300);}
function updateHUD(){const m=missions[Math.min(state.mission,missions.length-1)];$('level').textContent=state.level;$('rep').textContent=state.rep.toLocaleString();$('cash').textContent=money(state.money);$('momentum').textContent=state.momentum+'×';$('missionTitle').textContent=state.mission>=missions.length?'Career complete — free roam':m.title;$('missionText').textContent=state.mission>=missions.length?'All districts remain open. Keep exploring the city.':m.text;$('missionProgress').style.width=Math.min(100,(state.mission/missions.length)*100)+'%';$('coords').textContent=`${Math.round(shayla.position.x)}, ${Math.round(shayla.position.z)}`;}
function rewardMission(m){state.rep+=Math.round(m.rep*(1+(state.momentum-1)*.12));state.money+=m.cash;state.xp+=45;state.deals++;state.momentum=clamp(state.momentum+1,1,5);while(state.xp>=100){state.xp-=100;state.level++;state.skillPoints++;toast('Level up — Level '+state.level+'!');}state.mission++;save();updateHUD();const next=missions[state.mission];if(next){const t=interactables.find(p=>p.id===next.target);if(t)beacon.position.set(t.x,.4,t.z);}else beacon.visible=false;}
function interact(){const {best,dist}=nearestInteractive();if(!best||dist>best.range){toast('Move closer to a property or location');return;}const m=missions[state.mission];if(!m){toast(best.name+' explored');return;}if(best.id!==m.target){toast(best.name+' discovered — current mission is elsewhere');if(!state.seen.includes(best.id)){state.seen.push(best.id);state.rep+=8;save();updateHUD();}return;}
  $('modalTitle').textContent=best.name;$('modalText').textContent=m.text;$('modal').classList.add('open');
}
$('modalGood').onclick=()=>{const m=missions[state.mission];$('modal').classList.remove('open');rewardMission(m);toast('Excellent client-first decision · rewards earned');};
$('modalClose').onclick=()=>$('modal').classList.remove('open');
$('resetBtn').onclick=()=>{localStorage.removeItem(saveKey);location.reload();};

function animateWalk(t,moving,speed){const s=Math.sin(t*speed);limbs.armL.rotation.x=s*.7;limbs.armR.rotation.x=-s*.7;limbs.legL.rotation.x=-s*.62;limbs.legR.rotation.x=s*.62;torso.position.y=2.65+(moving?Math.abs(Math.sin(t*speed*2))*.035:0);if(!moving){for(const l of Object.values(limbs))l.rotation.x*=.82;}}

const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);const now=performance.now()/1000;
  let f=0,r=0;if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD||keys.ArrowRight)r+=1;if(keys.KeyA||keys.ArrowLeft)r-=1;f+=-touch.y;r+=touch.x;
  const moving=Math.abs(f)+Math.abs(r)>.08;const sprint=keys.ShiftLeft||keys.ShiftRight;const speed=sprint?10.5:6.2;
  if(moving){const camForward=new THREE.Vector3(-Math.sin(orbitYaw),0,-Math.cos(orbitYaw));const camRight=new THREE.Vector3(Math.cos(orbitYaw),0,-Math.sin(orbitYaw));const dir=camForward.multiplyScalar(f).add(camRight.multiplyScalar(r));if(dir.lengthSq()>0){dir.normalize();const nx=shayla.position.x+dir.x*speed*dt,nz=shayla.position.z+dir.z*speed*dt;if(!collides(nx,nz)){shayla.position.x=clamp(nx,-124,124);shayla.position.z=clamp(nz,-104,104);}const targetYaw=Math.atan2(dir.x,dir.z);let diff=((targetYaw-shayla.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;shayla.rotation.y+=diff*Math.min(1,dt*10);state.yaw=shayla.rotation.y;}}
  animateWalk(now,moving,sprint?10:7);
  state.x=shayla.position.x;state.z=shayla.position.z;
  const target=shayla.position.clone().add(new THREE.Vector3(0,2.6,0));const cp=Math.cos(orbitPitch),sp=Math.sin(orbitPitch);const desired=new THREE.Vector3(target.x+Math.sin(orbitYaw)*orbitDistance*cp,target.y+2.2+sp*orbitDistance,target.z+Math.cos(orbitYaw)*orbitDistance*cp);camera.position.lerp(desired,1-Math.pow(.0008,dt));camera.lookAt(target);
  const {best,dist}=nearestInteractive();const hint=$('hint');if(best&&dist<best.range+2){hint.style.opacity='1';hint.textContent=`E · ${best.name}`;}else hint.style.opacity='0';
  beacon.rotation.z+=dt*1.4;beacon.position.y=.5+Math.sin(now*2.5)*.15;
  updateHUD();renderer.render(scene,camera);
}

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);
updateHUD();const current=missions[state.mission];if(current){const t=interactables.find(p=>p.id===current.target);if(t)beacon.position.set(t.x,.4,t.z);}else beacon.visible=false;
frame();
