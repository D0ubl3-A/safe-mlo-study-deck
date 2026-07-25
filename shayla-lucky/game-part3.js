function rewardMission({rep,cash,xp,message,perfect=false,type='networking',savings=0,finale=false}){
  recordChoice(perfect);
  if(savings)state.totalSavings+=savings;
  const gain=addRewards(rep,cash,xp,{quality:perfect?'perfect':'good',type});
  state.deals++;
  if(finale){state.finaleComplete=true;state.mission=missions.length-1}
  else state.mission=Math.min(state.mission+1,missions.length-1);
  advanceGates();save();syncUI();closeModal();toast(message+' · +'+gain.repGain+' REP');
}
function advanceGates(){if(state.mission===5&&state.rep>=900)state.mission=6;if(state.rep>=2500)checkAchievements()}

function runMission(h,details){
  switch(state.mission){
    case 0:return openModal('First-Time Buyer: '+h.name,'The Carters want a 3-bedroom home under their simulated $425,000 budget. What should Shayla lead with?',[{label:'Needs, budget and total ownership cost',primary:true,onClick:()=>rewardMission({rep:90,cash:5200,xp:46,message:'Trust-first close',perfect:true,type:'networking'})},{label:'Push the emotional sale',onClick:()=>rewardMission({rep:42,cash:3600,xp:25,message:'Deal moved, trust weakened'})}],details,'Client Decision');
    case 1:return openModal('Inspection: '+h.name,'The roof shows wear and the buyer wants certainty. What is the strongest next move?',[{label:'Price the risk and request inspection leverage',primary:true,onClick:()=>rewardMission({rep:115,cash:4100,xp:55,message:'Hidden risk converted into leverage',perfect:true,type:'inspection'})},{label:'Ignore it because the home photographs well',onClick:()=>rewardMission({rep:30,cash:2500,xp:20,message:'Risk was left on the table'})}],details,'Inspection Challenge');
    case 2:return openModal('Negotiation: '+h.name,'Asking price: '+money(h.price)+'. The buyer needs room for repairs. Pick the strongest structure.',[{label:'$394K + fast close + inspection protection',primary:true,onClick:()=>rewardMission({rep:140,cash:7400,xp:52,message:'Strong structure won',perfect:true,type:'negotiation',savings:11000})},{label:'Full price immediately',onClick:()=>rewardMission({rep:55,cash:4700,xp:26,message:'Deal advanced, leverage lost'})}],details,'Negotiation Room');
    case 3:return openModal('Investor Analysis: '+h.name,'Acquisition: $289K. Simulated renovation: $61K. Projected resale: $395K–$425K. What protects the deal?',[{label:'Proceed only with a hard rehab ceiling',primary:true,onClick:()=>rewardMission({rep:170,cash:9800,xp:62,message:'Margin protected',perfect:true,type:'inspection'})},{label:'Renovate without a cap',onClick:()=>rewardMission({rep:42,cash:3200,xp:24,message:'Scope risk reduced the return'})}],details,'Investor Mission');
    case 4:return openModal('Referral Moment: '+h.name,'The home is attractive, but the client’s commute priority is stronger than the property fit. What earns the referral?',[{label:'Say so and show a better-fit option',primary:true,onClick:()=>rewardMission({rep:185,cash:6900,xp:58,message:'Client became an advocate',perfect:true,type:'networking'})},{label:'Push the house anyway',onClick:()=>rewardMission({rep:48,cash:4300,xp:28,message:'A close matters less than lifetime trust'})}],details,'Relationship Mission');
    case 6:return openModal('Luxury Listing: '+h.name,'The seller wants premium positioning, not generic exposure. Which plan gives Shayla the strongest brand advantage?',[{label:'Cinematic launch + qualified-buyer strategy',primary:true,onClick:()=>rewardMission({rep:360,cash:31000,xp:82,message:'Luxury listing won',perfect:true,type:'networking'})},{label:'Post everywhere immediately',onClick:()=>rewardMission({rep:125,cash:16000,xp:45,message:'Exposure helped, positioning did not'})}],details,'Luxury Presentation');
    case 7:return openModal('Keys to the City: '+h.name,'The final client can afford the house, but inspection complexity is high. What defines a Market Legend?',[{label:'Protect the client even if it risks the close',primary:true,onClick:()=>rewardMission({rep:500,cash:42000,xp:95,message:'Keys to the City earned',perfect:true,type:'negotiation',finale:true})},{label:'Close first and solve problems later',onClick:()=>rewardMission({rep:140,cash:21000,xp:50,message:'Revenue won, legacy lost',finale:true})}],details,'Career Finale');
    default:return openModal(h.name,'You found the current mission property.',[{label:'Continue',primary:true,onClick:closeModal}],details);
  }
}

function runBonusLead(h,details){
  const lead=state.bonusLead;
  openModal('Lucky Lead: '+lead.name,`A referral trusts Shayla with a simulated budget of <b>${money(lead.budget)}</b>. ${h.name} is a strong fit. How do you turn a surprise lead into a long-term client?`,[
    {label:'Qualify needs before selling the house',primary:true,onClick:()=>{recordChoice(true);state.sideDeals++;const g=addRewards(95,5600,38,{quality:'perfect',type:'networking'});state.bonusLead=null;save();syncUI();closeModal();toast('Referral closed · +'+g.repGain+' REP');}},
    {label:'Rush directly to an offer',onClick:()=>{recordChoice(false);state.sideDeals++;addRewards(35,2800,20);state.bonusLead=null;save();syncUI();closeModal();toast('Lead closed with lower trust');}}
  ],details,'Referral Opportunity');
}
