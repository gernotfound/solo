import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,sanitizeState,quantity,carriedWeight,dropToGround,pickupGroundItem,MAX_GROUND_STACKS} from '../src/domain/index.js';
import {saveState,loadState,SAVE_KEY} from '../src/domain/persistence.js';
import {createSceneryRenderer} from '../src/render/scenery.js';
import {drawPlayerSprite} from '../src/render/player.js';

function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}

test('lasciare e raccogliere oggetti mantiene quantità e posizione senza duplicarli',()=>{
 const s=initialState(),weight=carriedWeight(s),x=s.x,y=s.y;
 assert.equal(dropToGround(s,'berry',{x:x+35,y},2),true);
 assert.equal(quantity(s,'berry'),2);
 assert.equal(s.ground.length,1);
 assert.deepEqual({x:s.ground[0].x,y:s.ground[0].y},{x:x+35,y});
 assert.equal(pickupGroundItem(s,s.ground[0].id),true);
 assert.equal(quantity(s,'berry'),3);
 assert.equal(s.ground[0].qty,1);
 assert.equal(pickupGroundItem(s,s.ground[0].id),true);
 assert.equal(quantity(s,'berry'),4);
 assert.equal(s.ground.length,0);
 assert.equal(carriedWeight(s),weight);
 assert.equal(pickupGroundItem(s,'ground-1'),false);
});
test('pile vicine si uniscono; pile lontane hanno ID distinti e stabili',()=>{
 const s=initialState();
 assert.equal(dropToGround(s,'wood',{x:1100,y:3550}),true);
 assert.equal(dropToGround(s,'wood',{x:1106,y:3550}),true);
 assert.equal(s.ground.length,1);
 assert.equal(s.ground[0].qty,2);
 assert.equal(dropToGround(s,'wood',{x:1400,y:3550}),true);
 assert.equal(s.ground.length,2);
 assert.notEqual(s.ground[0].id,s.ground[1].id);
});
test('equipaggiamento e condizione vengono conservati a terra e al recupero',()=>{
 const s=initialState();s.condition.knife=41;
 assert.equal(dropToGround(s,'knife',{x:s.x,y:s.y}),true);
 assert.equal(s.equipment.hand,null);
 assert.equal(s.ground[0].condition,41);
 const pile=s.ground[0].id;s.condition.knife=0;
 assert.equal(pickupGroundItem(s,pile),true);
 assert.equal(s.condition.knife,41);
 assert.equal(s.inventory.knife,1);
});
test('operazioni impossibili non sottraggono oggetti',()=>{
 const s=initialState(),before=structuredClone(s.inventory);
 assert.equal(dropToGround(s,'unknown',{x:s.x,y:s.y}),false);
 assert.equal(dropToGround(s,'berry',{x:Infinity,y:1}),false);
 assert.equal(dropToGround(s,'berry',{x:s.x,y:s.y},5),false);
 assert.equal(dropToGround(s,'berry',{x:-1,y:s.y}),false);
 assert.deepEqual(s.inventory,before);
 assert.equal(s.ground.length,0);
 s.ground=Array.from({length:MAX_GROUND_STACKS},(_,i)=>({id:'ground-'+(i+1),item:'wood',qty:1,x:100+i,y:100}));
 assert.equal(dropToGround(s,'berry',{x:s.x,y:s.y}),false);
 assert.deepEqual(s.inventory,before);
});
test('salvataggio mantiene pile mentre scarta il sistema narrativo precedente',()=>{
 const s=initialState();dropToGround(s,'berry',{x:16000,y:12500});s.x=16000;s.y=12500;
 const db=storage();assert.equal(saveState(db,s,1234),true);
 const raw=JSON.parse(db.getItem(SAVE_KEY));raw.found=[0,2,5,21];
 db.setItem(SAVE_KEY,JSON.stringify(raw));
 const restored=loadState(db);
 assert.equal(restored.x,16000);assert.equal(restored.ground.length,1);
 assert.equal(restored.ground[0].item,'berry');
 assert.equal(Object.hasOwn(restored,'found'),false);
 assert.equal(dropToGround(restored,'berry',{x:17000,y:12500}),true);
 assert.notEqual(restored.ground[0].id,restored.ground[1].id);
});
test('sanitizeState elimina ID duplicati e pile malformate, senza perdere le altre',()=>{
 const s=sanitizeState({version:2,ground:[
 {id:'ground-4',item:'stone',qty:2,x:21000,y:15000},
 {id:'ground-4',item:'stone',qty:2,x:21000,y:15000},
 {id:'ground-8',item:'unknown',qty:2,x:1,y:2},
 {id:'ground-9',item:'berry',qty:-3,x:5,y:10},
 {id:'ground-10',item:'berry',qty:2,x:999999,y:10},
 {id:'other-id',item:'berry',qty:2,x:10,y:10},
 {id:'ground-12',item:'knife',qty:1,x:100,y:100,condition:35}
 ],nextGroundId:1});
 assert.deepEqual(s.ground.map(x=>x.id),['ground-4','ground-12']);
 assert.equal(s.nextGroundId,13);
 assert.equal(s.ground[1].condition,35);
});
function canvasRecorder(){
 const fills=[];
 const ctx={fillStyle:'',strokeStyle:'',beginPath(){},ellipse(){},roundRect(){},fill(){fills.push(this.fillStyle)},stroke(){},moveTo(){},lineTo(){},setLineDash(){},save(){},restore(){},translate(){},rotate(){},fillText(){},rect(){},fillRect(){fills.push(this.fillStyle)}};
 return {ctx,fills};
}
test('macchina e casa aperte, bacche esaurite, cassa svuotata e albero tagliato cambiano disegno',()=>{
 const s=initialState(),r=canvasRecorder(),draw=createSceneryRenderer(r.ctx,s,{}).drawObject;
 const car={kind:'car',id:'car-demo',x:50,y:50,r:27,rot:0,shade:.2};
 draw(car,0);assert.equal(r.fills.includes('#243a36'),false);
 s.looted[car.id]={items:{},until:Date.now()+40000};r.fills.length=0;
 draw(car,0);assert.ok(r.fills.includes('#243a36'));
 const house={kind:'house',id:'house-demo',x:100,y:100,w:140,h:100,doorX:170,doorY:203,category:'home',variant:1,shade:.2};
 s.looted[house.id]={items:{},until:Date.now()+40000};r.fills.length=0;
 draw(house,0);assert.ok(r.fills.includes('#242c27'));
 const bush={kind:'berry',id:'bush-demo',x:75,y:80,r:20};
 r.fills.length=0;draw(bush,0);assert.ok(r.fills.includes('#b84f60'));
 s.harvested[bush.id]=Date.now()+40000;r.fills.length=0;
 draw(bush,0);assert.equal(r.fills.includes('#b84f60'),false);
 const tree={kind:'tree',id:'tree-demo',x:75,y:80,r:24,shade:.4};
 s.harvested[tree.id]=Date.now()+40000;r.fills.length=0;
 draw(tree,0);assert.ok(r.fills.includes('#806a4f'));
 const crate={kind:'crate',id:'crate-demo',x:75,y:80,r:24};
 s.looted[crate.id]={items:{},until:Date.now()+40000};r.fills.length=0;
 draw(crate,0);assert.ok(r.fills.includes('#3f392e'));
});
test('personaggio zenitale ruota attorno al proprio asse e disegna la silhouette anche equipaggiato',()=>{
 const {ctx,fills}=canvasRecorder(),angles=[];
 ctx.rotate=a=>angles.push(a);
 const s=initialState();s.equipment.hand='knife';
 drawPlayerSprite(ctx,s,{facing:Math.PI/3,moving:true,step:1});
 assert.deepEqual(angles,[Math.PI/3]);
 assert.ok(fills.includes('#d6a982'));
 assert.ok(fills.includes('#607c6d'));
 assert.ok(fills.includes('#4b4239'));
});
