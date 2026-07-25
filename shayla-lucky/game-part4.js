$('actionBtn').onclick=inspectNearest;
$('helpBtn').onclick=()=>openModal('How to Play','Explore, inspect highlighted homes, make client-first decisions and keep a winning streak of <b>good judgment</b>. Perfect choices build Momentum, which increases game rewards and unlocks referral leads.',[{label:'Start playing',primary:true,onClick:closeModal}],'<p class="muted"><b>Desktop:</b> WASD / arrows · Shift to run · E to inspect<br><b>Mobile:</b> directional pad + Inspect Property<br><br>Missing a day never costs money or items; daily streaks are a bonus-only progression layer.</p>','Controls');

document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===t));
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===t.dataset.tab));
});

document.querySelectorAll('[data-guess]').forEach(b=>b.onclick=()=>{
  if(state.guessedDate===todayKey()){toast('Daily challenge already completed');return}
  const guess=Number(b.dataset.guess),actual=dailyActual(),diff=Math.abs(guess-actual);
  state.guessedDate=todayKey();$('guessResult').textContent='Simulated value: '+money(actual);
  if(diff===0){recordChoice(true);addRewards(85,0,42,{quality:'perfect',type:'inspection'});toast('Perfect price read · +85 base REP')}
  else if(diff<=36000){recordChoice(true);addRewards(42,0,22,{quality:'perfect',type:'inspection'});toast('Strong estimate · momentum increased')}
  else{recordChoice(false);addRewards(12,0,10,{type:'inspection'});toast('Market knowledge gained')}
  save();syncUI();
});

setInterval(()=>{
  const before=state.mission;advanceGates();
  if(before!==state.mission){save();syncUI();toast('Luxury Heights unlocked!')}
},1200);

syncUI();
setTimeout(()=>openModal('Welcome to Keys to the City','Build a career around <b>Shayla Lucky</b> through smart decisions, not button grinding. Each strong choice builds Momentum, unlocks better clients, earns skill points and opens higher-value districts.',[
  {label:'Enter the city',primary:true,onClick:closeModal},
  {label:'See the progression loop',onClick:()=>{$('modalBody').innerHTML='<b>Explore → inspect → advise → negotiate → close → earn Momentum → upgrade skills → unlock better districts → win better clients.</b><br><br>The game always gives you a visible next milestone.'}}
],'<p class="muted">All homes, prices, clients, commissions, rankings and market conditions are simulated gameplay data.</p>','Career Mode 2.0'),300);
