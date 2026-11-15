import {ITEMS,RECIPES,SLOTS,SLOT_NAMES,DEFAULT_POSITION,initialState,sanitizeState,clamp,quantity,carriedWeight,carryCapacity,addItem,removeItem,canCraft,craft,equip,consume,daylight,solarHours,timeText,statEffects,dropToGround,pickupGroundItem,createDaylightSampler} from '../domain/index.js'
import {createWorld,W,H,TAU} from '../world/world.js'
import {createSceneryRenderer} from '../render/scenery.js'
import {createAtlasRenderer} from '../render/atlas.js'
import {drawPlayerSprite} from '../render/player.js'
import {loadState,saveState,resetState} from '../domain/persistence.js';
import {createFrameScheduler} from './scheduler.js';
import {createTerrainCache} from '../render/cache.js';

const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false}),mini=$('mini'),mc=mini.getContext('2d'),overlay=$('overlay'),content=$('panel-content');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hypot=(x,y,a,b)=>Math.hypot(x-a,y-b);
const lerp=(a,b,t)=>a+(b-a)*t;
let state=loadState(localStorage);
function save(){return saveState(localStorage,state)}
window.addEventListener('pagehide',save);
const worldData=createWorld(state);
const {world,buildings,interactables,wildlife,ambient,random,rand,randInt,hash,forest,fields,lake,pond,river,routes,gx,gy,locations,pathDist,roadDist,cityRoadDist,woods,inCity,inField,inLake,inWater,blocked,queryWorld,queryBuildings,queryInteractables,regionAt,regions}=worldData;
const {ell,rect,path,land,drawRoads,drawRoadDetails,drawObject}=createSceneryRenderer(ctx,state,worldData);
const mapDraw=createAtlasRenderer(worldData,state);
const daylightAt=createDaylightSampler(),scheduler=createFrameScheduler();
const terrainCache=createTerrainCache((tileCtx,tileView)=>{
 const background=createSceneryRenderer(tileCtx,state,worldData);
 background.land(tileView);background.drawRoads(tileView);background.drawRoadDetails(tileView);
});
let facing=state.face||0,step=0,moving=false,camX=state.x,camY=state.y,vw=1,vh=1,dpr=1,zoom=1,frame=0,last=0,panel=null,activeTarget=null;
const keys=new Set(),stickVec={x:0,y:0};let touchRun=false,stickPointer=null,toastingUntil=0,lastAttack=0;
function drawPlayer(){drawPlayerSprite(ctx,state,{facing,moving,step})}
function drawAnimal(a,t){if(a.deadAt>0){ell(a.x,a.y+4,a.kind==='deer'?25:15,9,'#744f3c');ell(a.x+8,a.y-3,7,7,'#bb946b');return}
 ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.dir+Math.PI/2);const size=a.kind==='deer'?1.4:a.kind==='wolf'?1.18:.78;ctx.scale(size,size);ell(2,9,21,10,'#29443c66');const main=a.kind==='wolf'?'#747772':a.kind==='deer'?'#ad8056':'#b4a996';ell(0,3,20,15,main);ell(0,-13,13,12,main);ell(-11,-22,a.kind==='rabbit'?6:5,a.kind==='rabbit'?15:9,main,-.35);ell(11,-22,a.kind==='rabbit'?6:5,a.kind==='rabbit'?15:9,main,.35);ell(-5,-16,2,2,'#24382d');ell(5,-16,2,2,'#24382d');if(a.kind==='wolf')path([[-7,-23],[0,-27],[7,-23]],2,'#49544e');ctx.restore();
 if(a.kind==='wolf'&&hypot(state.x,state.y,a.x,a.y)<160) {ctx.textAlign='center';ctx.font='bold 10px Arial';ctx.fillStyle='#ffd0b6';ctx.fillText('LUPO',a.x,a.y-40)}
}
function drawGroundItems(l,tp,r,b){
 for(const pile of state.ground){
  if(pile.x<l-35||pile.x>r+35||pile.y<tp-35||pile.y>b+35)continue;
  const item=ITEMS[pile.item];if(!item)continue;
  ell(pile.x+3,pile.y+11,17,9,'#203a325a');
  ctx.save();ctx.translate(pile.x,pile.y);
  rect(-15,-11,30,25,5,'#a38b65','#564c3a',2);
  rect(-12,-8,24,5,2,'#cebd92');
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='17px system-ui';ctx.fillStyle='#fff8dd';ctx.fillText(item.icon,0,1);
  if(pile.qty>1){ctx.font='bold 11px system-ui';ctx.fillStyle='#fff2be';ctx.fillText('×'+pile.qty,22,16)}
  ctx.restore();
 }
}
function drawWaypoint(){if(!state.marker)return;const dx=state.marker.x-state.x,dy=state.marker.y-state.y,d=Math.hypot(dx,dy);if(d<65){state.marker=null;notify('Hai raggiunto il segnaposto.');save();return}
 const angle=Math.atan2(dy,dx),px=vw/2+Math.cos(angle)*Math.min(160,vw*.23),py=vh/2+Math.sin(angle)*Math.min(120,vh*.2);
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.translate(px,py);ctx.rotate(angle+Math.PI/2);ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,9);ctx.lineTo(0,5);ctx.lineTo(-10,9);ctx.closePath();ctx.fillStyle='#f6d883';ctx.strokeStyle='#30473a';ctx.lineWidth=3;ctx.fill();ctx.stroke();ctx.restore();
}
function drawScene(t){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#b7b38d';ctx.fillRect(0,0,vw,vh);
 ctx.translate(vw/2,vh/2);ctx.scale(zoom,zoom);ctx.translate(-camX,-camY);
 const pad=95,l=camX-vw/(2*zoom)-pad,r=camX+vw/(2*zoom)+pad,tp=camY-vh/(2*zoom)-pad,b=camY+vh/(2*zoom)+pad,view={l:clamp(l,0,W),r:clamp(r,0,W),t:clamp(tp,0,H),b:clamp(b,0,H)};
 if(!terrainCache.draw(ctx,view,zoom*dpr)){land(view);drawRoads(view);drawRoadDetails(view)}
 drawGroundItems(l,tp,r,b);
 let drawn=false;
 for(const o of queryWorld(l-90,tp-90,r+90,b+90).sort((a,b)=>a.depth-b.depth)){if(!drawn&&o.depth>state.y){drawPlayer(t);drawn=true}
 if(o.kind==='house'){if(o.x+o.w<l||o.x>r||o.y+o.h<tp||o.y>b)continue}
 else if(o.x+55<l||o.x-55>r||o.y+65<tp||o.y-65>b)continue;
 drawObject(o,t);
 }
 if(!drawn)drawPlayer(t);
 for(const a of wildlife){if(a.x+50<l||a.x-50>r||a.y+50<tp||a.y-50>b)continue;drawAnimal(a,t)}
 if(state.marker){const p=state.marker;ell(p.x,p.y,20+5*Math.sin(t*.004),10,'#f2ae6866');ctx.strokeStyle='#f8d48b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,20,0,TAU);ctx.stroke()}
 if(activeTarget){const {x,y}=targetPoint(activeTarget);ctx.strokeStyle='#ffe2a9';ctx.lineWidth=2.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,32+Math.sin(t*.006)*2,0,TAU);ctx.stroke();ctx.setLineDash([])}
 drawWaypoint();
}
const targetPoint=t=>t.type==='animal'?t.object:{x:t.object.kind==='house'?t.object.doorX:t.object.x,y:t.object.kind==='house'?t.object.doorY:t.object.y};
const targetTitle=t=>t.type==='ground'?ITEMS[t.object.item].name+' ×'+t.object.qty:t.type==='animal'?`Carcassa di ${t.object.kind==='wolf'?'lupo':t.object.kind==='deer'?'cervo':'coniglio'}`:{house:({home:'Casa abbandonata',shelter:'Casa rifugio',police:'Commissariato',clinic:'Ambulatorio',market:'Alimentari',warehouse:'Magazzino',shop:'Bottega',barn:'Fienile',radio:'Stazione radio'})[t.object.category]||'Edificio',car:'Auto abbandonata',tree:'Albero',deadTree:'Albero secco',bush:'Cespuglio',berry:'Bacche selvatiche',rock:'Pietre',camp:'Fuoco da campo',plot:'Orto',well:'Acqua da raccogliere',crate:'Cassa',bed:'Posto per riposare'}[t.object.kind]||'Oggetto';
const targetVerb=t=>t.type==='ground'?'RACCOGLI':t.type==='animal'?'SCUOIA':['car','house','crate'].includes(t.object.kind)?'CERCA':t.object.kind==='plot'?'COLTIVA':t.object.kind==='camp'?'FUOCO':t.object.kind==='bed'?'RIPOSA':'RACCOGLI';
function collectTarget(){let closest=null,score=1e9;
 for(const o of queryInteractables(state.x-175,state.y-175,state.x+175,state.y+175)){const p=o.kind==='house'?{x:o.doorX,y:o.doorY}:o,d=hypot(state.x,state.y,p.x,p.y),limit=o.kind==='house'?98:75;if(d>limit)continue;
  const penalty=['tree','bush','rock'].includes(o.kind)?15:0;if(d+penalty<score){score=d+penalty;closest={type:'world',object:o}}}
  for(const pile of state.ground){const d=hypot(state.x,state.y,pile.x,pile.y);if(d<76&&d-25<score){score=d-25;closest={type:'ground',object:pile}}}
 for(const a of wildlife)if(a.deadAt>0){const d=hypot(state.x,state.y,a.x,a.y);if(d<85&&d-15<score){score=d-15;closest={type:'animal',object:a}}}
 return closest;
}
function notify(message,duration=3500){const el=$('toast');el.textContent=message;el.classList.add('show');toastingUntil=performance.now()+duration}
function addLoot(id,qty=1){return addItem(state,id,qty)}
function giveLoot(items){const gained=[],failed=[],remaining={};for(const [id,n]of Object.entries(items)){
 const free=Math.floor((carryCapacity(state)-carriedWeight(state)+.00001)/ITEMS[id].weight),take=Math.min(free,n);
 if(take>0&&addLoot(id,take))gained.push(`${ITEMS[id].name} ×${take}`);
 if(n>take){failed.push(`${ITEMS[id].name} ×${n-take}`);remaining[id]=n-take;}
 }return {gained,failed,remaining};}
function containerLoot(o){let table={home:[['can',2],['cloth',3],['water',2],['seed',4],['shirt',1],['pants',1],['medkit',1],['berry',3]],shelter:[['water',3],['beans',3],['cloth',2],['wood',2]],police:[['ammo',12],['pistol',1],['bandage',2],['jacket',1],['scrap',2]],clinic:[['medkit',2],['bandage',3],['cloth',3],['water',2]],market:[['can',3],['water',2],['beans',4],['seed',4]],warehouse:[['scrap',4],['wood',3],['rope',2],['ammo',8],['axe',1]],shop:[['scrap',3],['water',1],['knife',1],['boots',1],['can',2]],barn:[['seed',5],['wood',3],['rope',2],['fiber',3]],radio:[['scrap',4],['ammo',6],['torch',1]],car:[['scrap',3],['cloth',2],['water',1],['ammo',5],['can',1],['rope',1]],crate:[['wood',3],['cloth',2],['water',2],['can',1],['seed',3]]}[o.kind==='house'?o.category:o.kind]||[['scrap',1]];
 const amount=o.kind==='house'?4:o.kind==='crate'?3:2;
 const result={};for(let k=0;k<amount;k++){const idx=Math.floor(hash(o.id.length*39+k*43,o.x*17+o.y*.3+k*111)*table.length),[id,q]=table[idx];result[id]=(result[id]||0)+Math.max(1,Math.ceil(q*(.5+hash(k*28,o.x))));}
 if(o.category==='police'){result.pistol=(result.pistol||0)+1;result.ammo=(result.ammo||0)+8}
 return result;
}
function searchContainer(o){const now=Date.now();let entry=state.looted[o.id];if(!entry||typeof entry!=='object'||(entry.until&&entry.until<now))entry={items:containerLoot(o),until:0};
 const result=giveLoot(entry.items);entry.items=result.remaining;
 if(!Object.keys(entry.items).length)entry.until=now+24*60*60*1000;
 state.looted[o.id]=entry;
 notify(result.gained.length?'Trovato: '+result.gained.join(', ')+(result.failed.length?'. Zaino pieno: alcuni oggetti rimangono.':''):result.failed.length?'Zaino pieno: alleggeriscilo dall’inventario.':'Niente di utile. Rifornimenti tra 24 ore.',4000);save();
}
function harvest(o){const cooldown=o.kind==='tree'||o.kind==='deadTree'?200000:o.kind==='berry'||o.kind==='bush'?120000:90000;
 if((state.harvested[o.id]||0)>Date.now()){notify('Zona già raccolta. Torna più tardi.');return}
 const weapon=state.equipment.hand;
 let items={};if(o.kind==='tree'){if(weapon!=='axe'){notify('Serve un’ascia per tagliare un albero. Cerca rami secchi oppure fabbricala.');return}items={wood:3,fiber:1}}
 else if(o.kind==='deadTree')items={wood:2};else if(o.kind==='rock')items={stone:2};else if(o.kind==='berry')items={berry:3,seed:1};else items={fiber:2,berry:1};
 if(!canCarryBundle(items)){notify('Zaino pieno. Apri Inventario e liberati di qualcosa.');return}
 for(const [id,n] of Object.entries(items))addLoot(id,n);if(o.kind==='tree')damageTool(2);
 state.harvested[o.id]=Date.now()+cooldown;notify('Raccolto: '+Object.entries(items).map(([id,n])=>`${ITEMS[id].name} ×${n}`).join(', '));save();
}
function canCarryBundle(all){const total=Object.entries(all).reduce((sum,[k,n])=>sum+ITEMS[k].weight*n,0);return carriedWeight(state)+total<=carryCapacity(state)+1e-5}
function nearFire(){return queryInteractables(state.x-150,state.y-150,state.x+150,state.y+150).some(o=>o.kind==='camp'&&state.fires[o.id]>Date.now()&&hypot(state.x,state.y,o.x,o.y)<142)}
function nearFarm(){return queryInteractables(state.x-145,state.y-145,state.x+145,state.y+145).some(o=>o.kind==='plot'&&hypot(state.x,state.y,o.x,o.y)<140)}
function fireInteraction(o){if(state.fires[o.id]>Date.now()){state.stamina=clamp(state.stamina+35,0,100);state.warmth=clamp(state.warmth+30,0,100);notify('Ti sei riposato al calore del fuoco. +35 resistenza, +30 calore. Cucina dal menu Crea.');save();return}
 if(quantity(state,'wood')<3||quantity(state,'stone')<1){notify('Per accendere il fuoco servono 3 Legno e 1 Pietra.');return}
 removeItem(state,'wood',3);removeItem(state,'stone',1);state.fires[o.id]=Date.now()+15*60*1000;notify('Fuoco acceso per 15 minuti reali. Ora puoi cucinare e purificare l’acqua.');save();
}
function farmInteraction(o){const current=state.plots[o.id];if(!current){if(quantity(state,'seed')<1||quantity(state,'water')<1){notify('Per seminare servono 1 Seme e 1 Acqua potabile.');return}removeItem(state,'seed');removeItem(state,'water');state.plots[o.id]={plantedAt:Date.now(),duration:125000,watered:0};notify('Hai seminato. Il raccolto sarà pronto in circa 2 minuti reali.');save();return}
 const elapsed=Date.now()-current.plantedAt;
 if(elapsed>=current.duration){const reward={beans:4,seed:2};if(!canCarryBundle(reward)){notify('Libera spazio nello zaino prima di raccogliere.');return}for(const [id,n]of Object.entries(reward))addLoot(id,n);delete state.plots[o.id];notify('Raccolto pronto! +4 Fagioli, +2 Semi.');save();return}
 if(quantity(state,'water')>0&&current.watered<2){removeItem(state,'water');current.watered++;current.plantedAt-=30000;notify('Irrigato. Il raccolto matura 30 secondi prima.');save();return}
 notify(`Pianta in crescita: mancano ${Math.ceil((current.duration-elapsed)/1000)} secondi.${current.watered>=2?' Irrigazioni massime.':''}`);
}
function skin(a){const items=a.kind==='wolf'?{rawMeat:2,hide:2}:a.kind==='deer'?{rawMeat:3,hide:2}:{rawMeat:1,hide:1};if(!canCarryBundle(items)){notify('Zaino pieno: libera spazio per la carne e le pelli.');return}
 for(const [id,n]of Object.entries(items))addLoot(id,n);a.deadAt=-Date.now();state.animals[a.id]=a.deadAt;notify('Animale scuoiato: '+Object.entries(items).map(([id,n])=>`${ITEMS[id].name} ×${n}`).join(', '));save();
}
function interact(){if(panel||state.health<=0)return;const t=collectTarget();if(!t){notify('Avvicinati a un albero, una risorsa, una casa, un’auto o una carcassa.');return}
  if(t.type==='ground'){if(pickupGroundItem(state,t.object.id)){notify('Raccolto: '+ITEMS[t.object.item].name);save()}else notify('Zaino pieno: libera spazio per raccogliere.');return}
 if(t.type==='animal'){skin(t.object);return}
 const o=t.object;
 if(['car','house','crate'].includes(o.kind))searchContainer(o);
 else if(['tree','deadTree','rock','bush','berry'].includes(o.kind))harvest(o);
 else if(o.kind==='camp')fireInteraction(o);
 else if(o.kind==='well'){if(addLoot('dirtyWater',1)){notify('Hai raccolto acqua non potabile. Bollila su un fuoco acceso.');save()}else notify('Non hai spazio nello zaino.');}
 else if(o.kind==='plot')farmInteraction(o);
 else if(o.kind==='bed'){state.stamina=100;state.health=clamp(state.health+8,0,100);notify('Hai riposato e recuperato resistenza. L’orologio reale continua a scorrere.');save()}
}
function damageTool(amount){const weapon=state.equipment.hand;if(!ITEMS[weapon]?.durability)return;
 const after=(state.condition[weapon]??ITEMS[weapon].durability)-amount;
 if(after<=0){removeItem(state,weapon);state.condition[weapon]=0;notify('Il tuo utensile si è rotto!')}else state.condition[weapon]=after;
}
function clearShot(a){const dx=a.x-state.x,dy=a.y-state.y,steps=Math.ceil(Math.hypot(dx,dy)/38);
 const nearby=queryBuildings(Math.min(state.x,a.x),Math.min(state.y,a.y),Math.max(state.x,a.x),Math.max(state.y,a.y));for(let i=1;i<steps;i++){const x=state.x+dx*i/steps,y=state.y+dy*i/steps;if(nearby.some(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h))return false}return true}
function attack(){if(panel||state.health<=0)return;
 const now=performance.now(),weapon=state.equipment.hand||'fists',pistol=weapon==='pistol',def=ITEMS[weapon],cool=pistol?500:weapon==='axe'?720:430;
 if(now-lastAttack<cool)return;lastAttack=now;
 if(pistol&&quantity(state,'ammo')===0){notify('La pistola è scarica. Cerca munizioni nel commissariato e nelle auto.');return}
 const range=pistol?320:def?.range||45,damage=def?.damage||7;
 const vx=Math.sin(facing),vy=-Math.cos(facing);
 const targets=wildlife.filter(a=>a.deadAt===0).map(a=>{const dx=a.x-state.x,dy=a.y-state.y,d=Math.hypot(dx,dy);return {a,d,dot:(dx*vx+dy*vy)/(d||1)}}).filter(v=>v.d<range&&v.dot>(pistol?.17:-.12)&&clearShot(v.a)).sort((a,b)=>a.d-b.d);
 if(pistol)removeItem(state,'ammo');
 if(!targets.length){if(pistol)notify('Colpo esploso: nessun bersaglio nel campo visivo.');else notify('Nessun animale davanti all’arma. Avvicinati e orienta il personaggio.');return}
 const a=targets[0].a;a.hp-=damage;a.agro=7;if(!pistol&&weapon!=='fists')damageTool(1);
 if(a.hp<=0){a.deadAt=Date.now();state.animals[a.id]=a.deadAt;state.kills++;notify(`Hai abbattuto ${a.kind==='wolf'?'un lupo':a.kind==='deer'?'un cervo':'un coniglio'}. Avvicinati e premi RACCOGLI.`)}else{a.dir=Math.atan2(a.y-state.y,a.x-state.x);notify('Colpito! '+Math.ceil(a.hp)+' salute animale rimanente.')}save();
}
function hurt(amount,source){const protection=Object.values(state.equipment).reduce((sum,id)=>sum+(ITEMS[id]?.armor||0),0);const actual=Math.max(2,Math.round(amount*(1-protection*.025)));state.health=clamp(state.health-actual,0,100);notify(`${source} ti ha ferito. -${actual} salute!`,2500);
 if(state.health<=0)dead();
}
function dead(){if(panel==='death')return;state.deathCount++;openPanel('death');notify('Sei morto. Puoi ricominciare dal rifugio con parte delle risorse.');save()}
function respawn(){for(const [id,n]of Object.entries(state.inventory)){if(Object.values(state.equipment).includes(id))continue;const remove=Math.floor(n*.35);if(remove>0)removeItem(state,id,remove)}
 state.x=DEFAULT_POSITION.x;state.y=DEFAULT_POSITION.y;state.health=70;state.hunger=65;state.thirst=65;state.warmth=65;state.stamina=100;for(const a of wildlife)if(a.deadAt===0&&hypot(a.x,a.y,state.x,state.y)<400){a.x=a.originX;a.y=a.originY}
 closePanel(true);save();notify('Sei tornato al Rifugio Zero. Hai perso parte delle scorte ma non i progressi.');
}
function updateAnimals(dt){const now=Date.now();for(const a of wildlife){if(a.deadAt!==0){if(now-Math.abs(a.deadAt)>6*60*1000){a.deadAt=0;a.hp=a.kind==='wolf'?90:a.kind==='deer'?60:30;delete state.animals[a.id];a.x=a.originX;a.y=a.originY}continue}
 const d=hypot(a.x,a.y,state.x,state.y);if(d>1100)continue;
 a.turn-=dt;a.agro=Math.max(0,a.agro-dt);let speed=a.kind==='rabbit'?80:a.kind==='deer'?65:58;
 const aggressive=a.kind==='wolf'&&d<220;const fleeing=(a.kind!=='wolf'&&d<190)||a.agro>0&&a.kind!=='wolf';
 if(aggressive){a.dir=Math.atan2(state.y-a.y,state.x-a.x);speed=110;if(d<43&&now-a.attackAt>1600){a.attackAt=now;hurt(11,'Un lupo')}}
 else if(fleeing){a.dir=Math.atan2(a.y-state.y,a.x-state.x);speed=a.kind==='rabbit'?170:145}
 else{speed*=.38;if(a.turn<=0){a.turn=rand(1.5,4.5);a.dir+=rand(-1.8,1.8)}}
 const nx=a.x+Math.cos(a.dir)*speed*dt,ny=a.y+Math.sin(a.dir)*speed*dt;
 if(nx>30&&nx<W-30&&ny>30&&ny<H-30&&!inWater(nx,ny)&&!queryBuildings(nx-18,ny-18,nx+18,ny+18).some(b=>nx>b.x-18&&nx<b.x+b.w+18&&ny>b.y-18&&ny<b.y+b.h+18)){a.x=nx;a.y=ny}else a.dir+=1.6;
 }}
function openPanel(tab){panel=tab;overlay.classList.remove('hidden');keys.clear();stickVec.x=stickVec.y=0;resetStick();updatePanel();if(tab!=='death')$('close').focus()}
function closePanel(force=false){if(panel==='death'&&!force)return;panel=null;overlay.classList.add('hidden')}
function panelItems(){const active=Object.entries(state.inventory).filter(([id,n])=>ITEMS[id]&&n>0).sort((a,b)=>(ITEMS[a[0]].slot?0:1)-(ITEMS[b[0]].slot?0:1));
 let html=`<div class="inventory-stats"><span>🎒 CARICO: ${carriedWeight(state).toFixed(1)} / ${carryCapacity(state)} kg</span><span>OGGETTI: ${active.reduce((s,[,n])=>s+n,0)}</span><span>${state.kills} animali cacciati</span></div><p class="smallnote">Mangia, bevi o cura le ferite; equipaggia armi e indumenti. Lascia gli oggetti superflui a terra, dove resteranno fino a quando li raccogli. Le scorte rimaste negli edifici possono essere recuperate in seguito.</p>`;
 for(const [id,n]of active){const d=ITEMS[id],isEquipped=Object.values(state.equipment).includes(id),canUse='food'in d||'water'in d||'health'in d;
 html+=`<article class="item-row"><span class="item-icon">${d.icon}</span><div class="item-copy"><strong>${d.name}${isEquipped?' · indossato':''}</strong><small>${d.desc}${d.durability?` · condizione ${Math.round(state.condition[id]??d.durability)}/${d.durability}`:''}</small></div><span class="item-qty">×${n}</span><div class="row-actions">${canUse?`<button class="ui-btn" data-act="consume" data-id="${id}">USA</button>`:''}${d.slot?`<button class="ui-btn alt" data-act="equip" data-id="${id}">${isEquipped?'TOGLI':'EQUIPAGGIA'}</button>`:''}<button class="ui-btn danger" data-act="drop" data-id="${id}">LASCIA</button></div></article>`}
 return html;
}
function panelCraft(){const stationFire=nearFire(),stationFarm=nearFarm();let html=`<div class="paper-box"><strong>⚒ Banco da lavoro improvvisato</strong><p>Puoi fabbricare strumenti con materiali raccolti. Le ricette di cucina richiedono un fuoco acceso nelle vicinanze; i semi si recuperano dai raccolti vicino a un orto.</p><span class="badge">Fuoco: ${stationFire?'ATTIVO':'non disponibile'}</span> <span class="badge">Orto: ${stationFarm?'VICINO':'non disponibile'}</span></div><div class="recipe-list">`;
 for(const r of RECIPES){const item=ITEMS[r.output],station=r.station==='fire'?stationFire?'fire':null:r.station==='farm'?stationFarm?'farm':null:null,valid=canCraft(state,r,station);
 html+=`<article class="recipe ${valid?'':'locked'}"><span class="item-icon">${item.icon}</span><div class="item-copy"><strong>${item.name} ×${r.qty}</strong><small>${r.category} · ${item.desc}</small>${r.station?`<div class="station">Richiede ${r.station==='fire'?'un fuoco acceso':'un orto vicino'}</div>`:''}<div class="craft-need">${Object.entries(r.need).map(([id,n])=>`<span class="ingredient ${quantity(state,id)>=n?'':'missing'}">${ITEMS[id].name} ${quantity(state,id)}/${n}</span>`).join('')}</div></div><div class="row-actions"><button class="ui-btn" data-act="craft" data-id="${r.id}" ${valid?'':'disabled'}>CREA</button></div></article>`}
 return html+'</div>';
}
function panelEquipment(){let html=`<div class="inventory-stats"><span>ISOLAMENTO: +${Object.values(state.equipment).reduce((sum,id)=>sum+(ITEMS[id]?.warmth||0),0)}</span><span>PROTEZIONE: ${Object.values(state.equipment).reduce((sum,id)=>sum+(ITEMS[id]?.armor||0),0)}</span><span>CARICO: ${carryCapacity(state)} kg</span></div><p class="smallnote">L’abbigliamento riduce il freddo della notte; la protezione attenua le ferite. Uno zaino rinforzato aumenta la capacità di trasporto. Armi e utensili condividono lo slot della mano.</p><div class="cols"><div>`;
 for(const slot of SLOTS){const id=state.equipment[slot],item=ITEMS[id];html+=`<article class="slot-row"><span class="item-icon">${item?.icon||'—'}</span><div class="item-copy"><strong>${SLOT_NAMES[slot]}</strong><small>${item?.name||'Niente equipaggiato'}</small></div>${item?`<button class="ui-btn alt" data-act="equip" data-id="${id}">TOGLI</button>`:''}</article>`}
 html+=`</div><div class="equipment-figure"><div><div style="font-size:60px">${state.equipment.body==='jacket'?'🧥':'🧍'}</div><strong>IL SOPRAVVISSUTO</strong><p class="smallnote">Arma: ${state.equipment.hand?ITEMS[state.equipment.hand].name:'Pugni'}<br>Giacca: ${state.equipment.body?ITEMS[state.equipment.body].name:'nessuna'}<br>Carico residuo: ${(carryCapacity(state)-carriedWeight(state)).toFixed(1)} kg</p></div></div></div>`;return html;
}
function panelMap(){return `<p class="smallnote">Mappa generale e minimappa locale. Esplorazione libera, senza missioni obbligatorie.</p><canvas id="bigmap" width="900" height="675" aria-label="Carta di SoLo: tocca per impostare un segnaposto"></canvas><div class="map-info"><span>Foreste · Campagne · Città · Acque · Zone in rovina</span><span>Esplorazione libera</span></div><div class="row-actions" style="margin-top:12px"><button class="ui-btn alt" data-act="marker-clear">RIMUOVI SEGNAPOSTO</button></div><div class="section-title">ZONE DEL MONDO</div><div class="guide-grid">${locations.map(p=>`<article class="journal-card"><div class="item-copy"><strong>${p.name}</strong><small>${p.clue||'Area esplorabile.'}</small><small>${Math.round(hypot(state.x,state.y,p.x,p.y))} m dalla tua posizione</small></div><button class="ui-btn" data-act="waypoint" data-id="${p.id}">SEGUI</button></article>`).join('')}</div>`}
function panelGuide(){return `<div class="guide-grid"><article><h3>1. Sopravvivi</h3><p>Fame, sete e freddo possono portarti alla morte. Mangia dallo zaino, bevi acqua potabile, riposati e usa le bende se sei ferito. Correre consuma resistenza.</p></article><article><h3>2. Raccogli e cerca</h3><p>Premi E o ESAMINA vicino a rami secchi, cespugli, pietre, auto e porte delle case. I contenitori aperti e le piante raccolte cambiano aspetto. Puoi lasciare oggetti a terra e recuperarli in seguito.</p></article><article><h3>3. Accendi un fuoco</h3><p>Vai a un focolare: usa 3 legni e 1 pietra. Il fuoco dura 15 minuti reali e permette di cuocere carne e bollire l’acqua raccolta dai pozzi.</p></article><article><h3>4. Coltiva</h3><p>Avvicinati a un appezzamento di terra vicino al rifugio. Usa un seme e un’acqua potabile per piantare. Il raccolto cresce in circa due minuti, anche mentre esplori.</p></article><article><h3>5. Caccia e difenditi</h3><p>Animali selvatici percorrono la mappa: conigli e cervi fuggono, i lupi ti inseguono. Attacca col coltello, con la lancia, con l’ascia o con la pistola. Avvicinati agli animali abbattuti per recuperare carne e pelli.</p></article><article><h3>6. Equipaggiati</h3><p>In Inventario equipaggia giacche, pantaloni, scarponi, copricapo, zaino e un’arma. Le armi si usurano; la pistola richiede munizioni. Il commissariato può contenerne una.</p></article><article><h3>7. Giorno e notte</h3><p>La luce segue il vero orologio locale del dispositivo, con alba e tramonto stagionali calcolati per l’area di Salerno. Al buio usa la torcia oppure resta vicino al fuoco. Riposare non accelera l’ora reale.</p></article><article><h3>8. Controlli</h3><p>Smartphone: joystick, CORRI, ESAMINA e ATTACCA. PC: WASD/frecce, Shift, E, Spazio, I inventario, C crafting, G equipaggiamento, M mappa, H guida.</p></article></div><div class="paper-box"><strong>Salvataggio</strong><p>Salvataggio automatico locale: posizione, zaino, oggetti a terra, indumenti, coltivazioni, risorse e bottini. Non esistono account né acquisti. Se elimini i dati del browser perderai i progressi.</p><button class="ui-btn danger" data-act="newgame">AZZERA E RICOMINCIA</button></div>`}
function updatePanel(){if(!panel)return;document.querySelector('.tabs').style.display=panel==='death'?'none':'';$('close').style.display=panel==='death'?'none':'';document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('selected',b.dataset.tab===panel));
 const titles={inventory:'Inventario',craft:'Crafting',equipment:'Equipaggiamento',map:'Mappa delle Terre',guide:'Guida alla sopravvivenza',death:'Un altro inizio'};$('panel-title').textContent=titles[panel]||'Sopravvivenza';
 if(panel==='death'){content.innerHTML=`<div class="death"><h3>Sei morto nelle Terre del Silenzio</h3><p>Giorni sopravvissuti: ${Math.floor(state.days)} · Animali cacciati: ${state.kills} · Morti: ${state.deathCount}.</p><p>Puoi tornare al Rifugio Zero. Perderai una parte delle scorte non equipaggiate, ma gli oggetti lasciati a terra e il resto del mondo rimarranno.</p><button class="ui-btn" data-act="respawn">RIPARTI DAL RIFUGIO</button></div>`;return}
 content.innerHTML=panel==='inventory'?panelItems():panel==='craft'?panelCraft():panel==='equipment'?panelEquipment():panel==='map'?panelMap():panelGuide();
 if(panel==='map'){const m=$('bigmap');mapDraw(m.getContext('2d'),m.width,m.height,true)}
}
function menuAction(act,id){switch(act){case 'consume':if(consume(state,id)){notify('Hai usato: '+ITEMS[id].name);save()}else notify('Non puoi usare questo oggetto adesso.');break;
 case 'equip':{if(!equip(state,id)){notify('Non puoi equipaggiarlo.');break}notify(state.equipment[ITEMS[id].slot]===id?ITEMS[id].name+' equipaggiato.':ITEMS[id].name+' rimosso.');save();break}
 case 'drop':{const dx=Math.sin(facing)*48,dy=-Math.cos(facing)*48,px=state.x+dx,py=state.y+dy;const pos=isSolid(px,py)?{x:state.x,y:state.y}:{x:px,y:py};if(dropToGround(state,id,pos,1)){notify('Lasciato a terra: '+ITEMS[id].name+'. Puoi recuperarlo.');save()}else notify('Impossibile lasciare l’oggetto: spazio insufficiente a terra.');break}
 case 'craft':{const r=RECIPES.find(r=>r.id===id);const station=r?.station==='fire'?nearFire()?'fire':null:r?.station==='farm'?nearFarm()?'farm':null:null;
  if(r&&craft(state,r,station)){notify('Creato: '+ITEMS[r.output].name+' ×'+r.qty);save()}else notify('Materiali, spazio o postazione insufficienti.');break}
 case 'marker-clear':state.marker=null;notify('Segnaposto rimosso.');save();break;
 case 'waypoint':{const p=locations.find(l=>l.id===id);if(p){state.marker={x:p.x,y:p.y};notify('Destinazione: '+p.name);save()}break}
 case 'newgame':if(confirm('Eliminare tutti i progressi e ricominciare?')){resetState(localStorage);location.reload()}return;
 case 'respawn':respawn();return;}
 updatePanel();}
content.addEventListener('click',e=>{const btn=e.target.closest('button[data-act]');if(btn)menuAction(btn.dataset.act,btn.dataset.id)});
content.addEventListener('click',e=>{if(e.target.id!=='bigmap')return;const b=e.target.getBoundingClientRect();state.marker={x:clamp((e.clientX-b.left)/b.width*W,0,W),y:clamp((e.clientY-b.top)/b.height*H,0,H)};notify('Destinazione impostata. Segui la freccia sul terreno.');save();updatePanel()});
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>openPanel(btn.dataset.tab)));
$('map-btn').addEventListener('click',()=>openPanel('map'));mini.addEventListener('click',()=>openPanel('map'));mini.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPanel('map')}});
$('close').addEventListener('click',closePanel);overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)closePanel()});
$('interact').addEventListener('click',interact);$('attack').addEventListener('click',attack);
function resetStick(){const n=$('nub');n.style.transform='translate(0px,0px)'}
const stick=$('stick');function updateStick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.31,d=Math.hypot(dx,dy)||1,s=Math.min(1,max/d);stickVec.x=dx*s/max;stickVec.y=dy*s/max;$('nub').style.transform=`translate(${dx*s}px,${dy*s}px)`}
stick.addEventListener('pointerdown',e=>{if(stickPointer!==null)return;stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);e.preventDefault()});
stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e)});
function endStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;stickVec.x=stickVec.y=0;resetStick()}
stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);stick.addEventListener('lostpointercapture',()=>{stickPointer=null;stickVec.x=stickVec.y=0;resetStick()});
const runBtn=$('run');runBtn.addEventListener('pointerdown',e=>{touchRun=true;runBtn.classList.add('pressed');runBtn.setPointerCapture(e.pointerId);e.preventDefault()});const stopRun=()=>{touchRun=false;runBtn.classList.remove('pressed')};runBtn.addEventListener('pointerup',stopRun);runBtn.addEventListener('pointercancel',stopRun);runBtn.addEventListener('lostpointercapture',stopRun);
window.addEventListener('keydown',e=>{const tracked=['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyE','KeyI','KeyC','KeyG','KeyM','KeyH','ShiftLeft','ShiftRight','Escape'];if(tracked.includes(e.code))e.preventDefault();
 if(e.repeat&&!['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code))return;
 keys.add(e.code);if(e.code==='Escape'){closePanel();return}if(panel)return;
 if(e.code==='KeyE')interact();if(e.code==='Space')attack();const menus={KeyI:'inventory',KeyC:'craft',KeyG:'equipment',KeyM:'map',KeyH:'guide'};if(menus[e.code])openPanel(menus[e.code]);
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchRun=false;stickVec.x=stickVec.y=0;resetStick();stopRun()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();keys.clear();touchRun=false;stickVec.x=stickVec.y=0;resetStick();stopRun()}});
const lightCanvas=document.createElement('canvas'),lightCtx=lightCanvas.getContext('2d');
function resize(){vw=innerWidth;vh=innerHeight;dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.max(1,Math.round(vw*dpr));canvas.height=Math.max(1,Math.round(vh*dpr));lightCanvas.width=canvas.width;lightCanvas.height=canvas.height;
 zoom=clamp(Math.min(vw/1050,vh/740),.62,1.22);
}
window.addEventListener('resize',resize,{passive:true});resize();
// Il buio è disegnato su un livello separato: la maschera luminosa non cancella il mondo sottostante.
function drawLighting(){const sun=daylightAt(new Date()),dark=(1-sun)*.78;if(dark<.025)return;
 lightCtx.setTransform(dpr,0,0,dpr,0,0);lightCtx.clearRect(0,0,vw,vh);lightCtx.fillStyle=`rgba(9,24,36,${dark})`;lightCtx.fillRect(0,0,vw,vh);lightCtx.globalCompositeOperation='destination-out';
 const torch=state.equipment.hand==='torch',radius=(torch?350:177)*Math.max(.72,zoom),sx=vw/2,sy=vh/2;
 const g=lightCtx.createRadialGradient(sx,sy,18,sx,sy,radius);g.addColorStop(0,'rgba(255,255,255,.98)');g.addColorStop(.35,'rgba(255,255,255,.84)');g.addColorStop(1,'rgba(255,255,255,0)');lightCtx.fillStyle=g;lightCtx.fillRect(sx-radius,sy-radius,radius*2,radius*2);
 for(const f of queryWorld(camX-vw/zoom,camY-vh/zoom,camX+vw/zoom,camY+vh/zoom)){if(f.kind!=='camp'||!(state.fires[f.id]>Date.now()))continue;const x=(f.x-camX)*zoom+sx,y=(f.y-camY)*zoom+sy;if(x<-220||x>vw+220||y<-220||y>vh+220)continue;const radius=165*zoom,h=lightCtx.createRadialGradient(x,y,8,x,y,radius);h.addColorStop(0,'rgba(255,255,255,.95)');h.addColorStop(1,'rgba(255,255,255,0)');lightCtx.fillStyle=h;lightCtx.fillRect(x-radius,y-radius,radius*2,radius*2)}
 lightCtx.globalCompositeOperation='source-over';ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(lightCanvas,0,0);ctx.restore();
}
function isSolid(x,y){const r=14;if(x<r||x>W-r||y<r||y>H-r||inWater(x,y))return true;
 for(const o of queryWorld(x-110,y-110,x+110,y+110)){if(o.kind==='house'){const cx=clamp(x,o.x,o.x+o.w),cy=clamp(y,o.y,o.y+o.h);if(hypot(x,y,cx,cy)<r+2)return true}
 else if(['tree','deadTree','car','rock','landmark'].includes(o.kind)&&hypot(x,y,o.x,o.y)<r+(o.kind==='car'?23:o.kind==='landmark'?42:o.kind==='tree'&&state.harvested[o.id]>Date.now()?8:o.r*.5))return true}
 return false;
}
let running=false,playSeconds=(state.days||0)*86400,secondsSinceHud=0;
function update(dt,t){if(panel)return;let mx=stickVec.x+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),my=stickVec.y+(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);const magnitude=Math.hypot(mx,my);moving=magnitude>.08;if(moving){mx/=Math.max(1,magnitude);my/=Math.max(1,magnitude);facing=Math.atan2(my,mx)+Math.PI/2;state.face=facing;
 running=(touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight'))&&state.stamina>5&&state.hunger>4&&state.thirst>3;
 const burden=carriedWeight(state)/carryCapacity(state),speed=(running?315:190)*(burden>.92?.86:1)*(state.warmth<20?.76:1)*dt;
 const nextX=state.x+mx*speed,nextY=state.y+my*speed;
 if(!isSolid(nextX,state.y))state.x=nextX;if(!isSolid(state.x,nextY))state.y=nextY;step+=dt*(running?8:5);
 }else running=false;
 const sun=daylightAt(new Date());
 statEffects(state,dt,{night:1-sun,nearFire:nearFire(),running});
 if(state.equipment.hand==='torch'&&sun<.25){state.condition.torch=(state.condition.torch??ITEMS.torch.durability)-dt/8;if(state.condition.torch<=0){removeItem(state,'torch');state.condition.torch=0;notify('La torcia si è scaricata.')}}
 if(state.health<=0){dead();return}
 updateAnimals(dt);
 playSeconds+=dt;state.days=playSeconds/86400;
 camX=lerp(camX,state.x,Math.min(1,dt*6.5));camY=lerp(camY,state.y,Math.min(1,dt*6.5));
 activeTarget=collectTarget();
 const a=$('interact');a.classList.toggle('active',!!activeTarget);$('interact-icon').textContent=activeTarget?'✦':'·';$('interact-label').textContent=activeTarget?targetVerb(activeTarget):'ESAMINA';$('proximity').textContent=activeTarget?targetTitle(activeTarget):'';
 secondsSinceHud+=dt;if(secondsSinceHud>.33){secondsSinceHud=0;updateHud();if(state.x>=6400||state.y>=4800){const region=regionAt(state.x,state.y);if(lastRegion&&lastRegion!==region.id)notify(region.name+' — '+region.clue,6500);lastRegion=region.id;}else lastRegion='legacy';}
 if(toastingUntil&&t>toastingUntil){$('toast').classList.remove('show');toastingUntil=0}
}
function zoneAt(x,y){if(x>=6400||y>=4800)return regionAt(x,y).name;if(inCity(x,y))return'LA CITTÀ FANTASMA';if(inField(x,y))return'I CAMPI DI RUGGINE';if(inLake(x,y,lake)||inLake(x,y,pond)||pathDist(x,y,river)<160)return'LE ACQUE PERDUTE';if(woods(x,y)>.18)return'IL BOSCO DEL RITORNO';if(Math.min(roadDist(x,y),cityRoadDist(x,y))<80)return'LA STRADA DELLE CENERI';return'LE TERRE DEL SILENZIO'}
function updateHud(){for(const id of ['health','hunger','thirst','stamina','warmth']){$('bar-'+id).style.width=`${state[id].toFixed(1)}%`;$('val-'+id).textContent=Math.round(state[id]);}
 $('zone').textContent=zoneAt(state.x,state.y);const now=new Date(),sun=daylightAt(now);$('clock').textContent=timeText(now);$('sunicon').textContent=sun>.65?'☀':sun>.12?'◒':'☾';$('dayname').textContent=sun>.65?'GIORNO':sun>.12?'CREPUSCOLO':'NOTTE';

}
let lastRegion=null;
function frameLoop(t){
 const dt=Math.min((t-last)/1000||0,.05);last=t;frame++;
 update(dt,t);
 if(scheduler.shouldRender(t,panel!==null)){drawScene(t);drawLighting()}
 if(scheduler.shouldDrawMinimap(t,panel!==null))mapDraw(mc,mini.width,mini.height);
 if(scheduler.shouldAutosave(t))save();
 requestAnimationFrame(frameLoop);
}
// Hook diagnostico di sola lettura per smoke test del gioco.
Object.defineProperty(window,'__survivalStatus',{get:()=>Object.freeze({x:state.x,y:state.y,face:state.face,health:state.health,hunger:state.hunger,thirst:state.thirst,inventory:{...state.inventory},equipment:{...state.equipment},clock:timeText(new Date()),daylight:daylight(new Date()),killed:state.kills,animals:wildlife.filter(a=>a.deadAt===0).length,plots:Object.keys(state.plots).length,ground:state.ground.map(p=>({...p})),terrainCache:{...terrainCache.stats,tiles:terrainCache.tileCount,bytes:terrainCache.cachedBytes},looted:Object.keys(state.looted).length,harvested:Object.keys(state.harvested).length,loaded:true})});
updateHud();notify('Esplora liberamente. Cerca risorse, crea oggetti e costruisci la tua storia.',5200);requestAnimationFrame(frameLoop);
