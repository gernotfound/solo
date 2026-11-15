import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoadIndex} from '../src/world/roads.js';
import {createWorld} from '../src/world/world.js';
import {initialState,createDaylightSampler} from '../src/domain/index.js';
import {createFrameScheduler} from '../src/app/scheduler.js';
import {createSceneryRenderer} from '../src/render/scenery.js';

test('road proximity preserves exact results inside each requested range',()=>{
 const routes=[{w:80,p:[[-400,-300],[1500,800],[4000,800]]},{w:44,p:[[6000,9000],[7000,9000]]},{w:50,p:[[700,700],[700,700]]}];
 const index=createRoadIndex(routes,230,160);
 function brute(x,y){
  let best=Infinity;
  for(const road of routes)for(let i=1;i<road.p.length;i++){
   const [ax,ay]=road.p[i-1],[bx,by]=road.p[i],dx=bx-ax,dy=by-ay;
   const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
   best=Math.min(best,Math.hypot(x-ax-t*dx,y-ay-t*dy)-road.w/2);
  }
  return best;
 }
 for(let x=-550;x<=7350;x+=143)for(let y=-500;y<=9900;y+=257){
  const want=brute(x,y);
  for(const limit of [0,8,34,110,160]){
   const actual=index.distanceWithin(x,y,limit);
   if(want>limit)assert.equal(actual,Infinity);
   else assert.ok(Math.abs(actual-want)<1e-9,'distance mismatch');
  }
 }
 assert.equal(index.segmentCount,4);
 assert.ok(index.cellCount>60);
 assert.equal(index.distanceWithin(NaN,20,10),Infinity);
 assert.equal(index.distanceWithin(4,20,200),Infinity);
});
test('world road distance proximity agrees with the existing exact calculation',()=>{
 const w=createWorld(initialState());
 for(let x=90;x<=22200;x+=431)for(let y=30;y<=16000;y+=509){
  const exact=w.roadDist(x,y);
  for(const limit of [8,34,110,160]){
   const actual=w.fastRoadDist(x,y,limit);
   if(exact>limit)assert.equal(actual,Infinity);
   else assert.ok(Math.abs(actual-exact)<1e-8,'world road mismatch at '+x+','+y);
  }
 }
});
test('water classifications match old geometry across the river, bridges and map',()=>{
 const w=createWorld(initialState());
 const oldWater=(x,y)=>w.waterBodies.some(b=>w.inLake(x,y,b))||
  (w.pathDist(x,y,w.river)<49&&w.roadDist(x,y)>34);
 for(let x=0;x<=3700;x+=43)for(let y=0;y<4900;y+=47)
  assert.equal(w.inWater(x,y),oldWater(x,y),'river: '+x+','+y);
 for(let x=5000;x<22400;x+=739)for(let y=4000;y<16400;y+=613)
  assert.equal(w.inWater(x,y),oldWater(x,y),'world: '+x+','+y);
});
test('road rendering skips distant arteries, preserving visible strokes',()=>{
 let strokes=0;
 const ctx={beginPath(){},moveTo(){},lineTo(){},setLineDash(){},stroke(){strokes++},save(){},restore(){},translate(){},rotate(){},roundRect(){},fill(){},ellipse(){},rect(){},fillRect(){}};
 const world={routes:[{w:40,p:[[0,50],[1000,50]]},{w:40,p:[[5000,5000],[5500,5000]]}],gx:[],gy:[],townGrids:[]};
 const draw=createSceneryRenderer(ctx,{looted:{},harvested:{}},world).drawRoads;
 draw({l:300,r:600,t:0,b:200});assert.equal(strokes,4);
 strokes=0;draw({l:1500,r:1900,t:0,b:200});assert.equal(strokes,0);
 strokes=0;draw({l:5200,r:5300,t:4900,b:5100});assert.equal(strokes,4);
});
test('frame scheduling keeps gameplay frames and avoids overlay/minimap/autosave repetition',()=>{
 const s=createFrameScheduler();
 assert.equal(s.shouldRender(0,true),true);
 assert.equal(s.shouldRender(50,true),false);
 assert.equal(s.shouldRender(149,true),false);
 assert.equal(s.shouldRender(150,true),true);
 assert.equal(s.shouldRender(151,false),true);
 assert.equal(s.shouldRender(152,true),false);
 assert.equal(s.shouldRender(300,true),true);
 assert.equal(s.shouldDrawMinimap(1099,false),false);
 assert.equal(s.shouldDrawMinimap(1100,false),true);
 assert.equal(s.shouldDrawMinimap(3200,true),false);
 assert.equal(s.shouldDrawMinimap(3200,false),true);
 assert.equal(s.shouldAutosave(9999),false);
 assert.equal(s.shouldAutosave(10000),true);
 assert.equal(s.shouldAutosave(15000),false);
 assert.equal(s.shouldAutosave(20000),true);
 assert.throws(()=>createFrameScheduler({autosaveIntervalMs:0}),RangeError);
});
test('daylight sampling is periodic and recovers from clock corrections',()=>{
 let calls=0;
 const light=createDaylightSampler(d=>{calls++;return d.getTime()/1000},1000);
 assert.equal(light(new Date(10000)),10);
 assert.equal(light(new Date(10500)),10);
 assert.equal(light(new Date(10999)),10);
 assert.equal(calls,1);
 assert.equal(light(new Date(11000)),11);
 assert.equal(calls,2);
 assert.equal(light(new Date(9000)),9);
 assert.equal(calls,3);
 assert.throws(()=>createDaylightSampler(undefined,-5),RangeError);
});
