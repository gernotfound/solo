import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,RECIPES,SLOTS,initialState,sanitizeState,carryCapacity,carriedWeight,addItem,removeItem,canCraft,craft,equip,consume,solarHours,daylight,statEffects,quantity} from '../src/domain/index.js';

test('cataloghi validi: tutte le ricette riferiscono oggetti e quantità reali',()=>{
 const ids=new Set();for(const r of RECIPES){assert.ok(!ids.has(r.id));ids.add(r.id);assert.ok(ITEMS[r.output]);assert.ok(Number.isInteger(r.qty)&&r.qty>0);for(const [id,n] of Object.entries(r.need)){assert.ok(ITEMS[id]);assert.ok(Number.isInteger(n)&&n>0)}}
 for(const [id,item] of Object.entries(ITEMS)){assert.ok(item.weight>=0&&Number.isFinite(item.weight),id);if(item.slot)assert.ok(SLOTS.includes(item.slot),id)}
});
test('stato iniziale: risorse finite, equipaggiamento posseduto e peso entro capacità',()=>{
 const s=initialState();assert.equal(s.version,2);assert.equal(s.equipment.hand,'knife');assert.equal(s.inventory.knife,1);assert.ok(carriedWeight(s)<=carryCapacity(s));for(const id of Object.values(s.equipment))if(id)assert.ok(quantity(s,id)>0);
});
test('addItem/rimozione: fallimenti atomici su overflow, quantità frazionarie, item ignoto',()=>{
 const s=initialState(),before=structuredClone(s.inventory);
 for(const [id,n] of [['stone',100],['stone',1.2],['__proto__',1],['invalid',1],['water',-1]])assert.equal(addItem(s,id,n),false);
 assert.deepEqual(s.inventory,before);for(const n of [0,-1,2.1,999])assert.equal(removeItem(s,'water',n),false);assert.deepEqual(s.inventory,before);
});
test('equipaggiamento e zaino aumentano la capacità solo quando indossati',()=>{
 const s=initialState();assert.equal(addItem(s,'backpack'),true);assert.equal(equip(s,'backpack'),true);assert.equal(carryCapacity(s),30);
 assert.equal(equip(s,'backpack'),true);assert.equal(carryCapacity(s),17);assert.equal(removeItem(s,'knife'),true);assert.equal(s.equipment.hand,null);
});
test('crafting non duplica risorse ed è atomico se mancano ingredienti',()=>{
 const s=initialState(),r=RECIPES.find(r=>r.id==='knife');assert.equal(canCraft(s,r),false);assert.equal(craft(s,r),false);
 assert.equal(addItem(s,'fiber',1),true);assert.equal(canCraft(s,r),true);assert.equal(craft(s,r),true);assert.equal(s.inventory.knife,2);assert.equal(s.inventory.stone,undefined);assert.equal(s.inventory.fiber,undefined);assert.equal(craft(s,r),false);
});
test('crafting postazioni: fuoco e orto sono vincoli, non semplici decorazioni',()=>{
 const s=initialState();assert.equal(addItem(s,'rawMeat'),true);const meat=RECIPES.find(r=>r.id==='cookedMeat');assert.equal(craft(s,meat),false);assert.equal(craft(s,meat,'farm'),false);assert.equal(craft(s,meat,'fire'),true);
 const seeds=RECIPES.find(r=>r.id==='seed');assert.equal(addItem(s,'beans',2),true);assert.equal(craft(s,seeds,'fire'),false);assert.equal(craft(s,seeds,'farm'),true);
});
test('crafting: fallimento per peso non consuma materiali',()=>{
 const s=initialState();s.inventory={wood:3,stone:2,fiber:1,ammo:600};const r=RECIPES.find(r=>r.id==='knife');const before=structuredClone(s.inventory);assert.equal(craft(s,r),false);assert.deepEqual(s.inventory,before);
});
test('consumabili: acqua, cibo, cure e acqua contaminata hanno effetti realistici',()=>{
 const s=initialState();s.thirst=15;assert.equal(consume(s,'water'),true);assert.equal(s.thirst,50);assert.equal(s.inventory.water,2);
 s.health=50;assert.equal(addItem(s,'dirtyWater'),true);assert.equal(consume(s,'dirtyWater'),true);assert.equal(s.health,34);
 s.health=99;assert.equal(consume(s,'bandage'),false);assert.equal(s.inventory.bandage,2);
});
test('consumabili: oggetti non consumabili e oggetti non posseduti sono rifiutati',()=>{
 const s=initialState();assert.equal(consume(s,'knife'),false);assert.equal(consume(s,'fake'),false);assert.equal(consume(s,'medkit'),false);
});
test('bisogni: corsa, freddo e sete consumano risorse vitali, valori limitati a 0..100',()=>{
 const s=initialState(),old={...s};statEffects(s,45,{night:1,nearFire:false,running:true});for(const k of ['hunger','thirst','stamina','warmth'])assert.ok(s[k]<old[k],k);
 const empty=initialState();empty.hunger=0;empty.thirst=0;statEffects(empty,20);assert.ok(empty.health<100);for(const k of ['hunger','thirst','stamina','warmth','health'])assert.ok(empty[k]>=0&&empty[k]<=100,k);
});
test('bisogni: fuoco protegge dal freddo, immobilità recupera resistenza',()=>{
 const open=initialState(),fire=initialState();open.stamina=20;fire.stamina=20;statEffects(open,25,{night:1});statEffects(fire,25,{night:1,nearFire:true});assert.ok(fire.warmth>open.warmth);assert.ok(fire.stamina>20);
});
test('luce reale: inverno/estate e notte, nel fuso orario di Roma',()=>{
 const winter=new Date(2026,0,15,12),summer=new Date(2026,5,15,12);const w=solarHours(winter),s=solarHours(summer);
 assert.ok(w.sunrise>6&&w.sunrise<9);assert.ok(s.sunrise>4&&s.sunrise<7);assert.ok(w.sunset>15&&w.sunset<19);assert.ok(s.sunset>19&&s.sunset<22);
 assert.ok(daylight(new Date(2026,5,15,12))>.9);assert.ok(daylight(new Date(2026,5,15,1))<.1);
});
test('salvataggio: campi ignoti, coordinate fuori mappa e riferimenti invaldi sanitizzati',()=>{
 const s=sanitizeState({version:2,x:9999999,y:-88,health:200,inventory:{pistol:-2,water:4,garbage:99999},equipment:{hand:'pistol',head:'knife'},found:[1,1,100]});
 assert.equal(s.x,22375);assert.equal(s.y,25);assert.equal(s.health,100);assert.deepEqual(s.inventory,{water:4});assert.equal(s.equipment.hand,null);assert.deepEqual(s.found,[1]);
});
