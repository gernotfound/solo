import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,W,H} from '../src/world/world.js';
import {REGIONS,MAP_WIDTH,MAP_HEIGHT,regionAt} from '../src/world/expansion.js';
import {createSpatialIndex} from '../src/world/spatial.js';
import {WORLD_STORY_NOTES} from '../src/shared/world-limits.js';
import {initialState} from '../src/domain/index.js';

test('grande territorio: almeno dodici volte l’area iniziale e undici regioni nuove',()=>{
 assert.equal(W,MAP_WIDTH);assert.equal(H,MAP_HEIGHT);
 assert.ok(W*H/(6400*4800)>=11.9);
 assert.equal(REGIONS.length,11);
 const world=createWorld(initialState());
 assert.ok(world.world.length>3000);
 assert.equal(world.locations.length,18);
 assert.equal(world.notes.length,WORLD_STORY_NOTES);
 assert.equal(world.world.filter(o=>o.kind==='landmark').length,REGIONS.length);
 assert.ok(world.routes.length>=14);
 assert.ok(world.townGrids.length>=4);
 assert.ok(world.waterBodies.length>=6);
});
test('ogni area ha nome, indizi e testimonianze accessibili e non obbligatorie',()=>{
 const w=createWorld(initialState());
 for(const loc of w.locations){
  assert.ok(loc.name&&loc.story&&loc.clue,loc.id);
  assert.ok(loc.story.length>45,loc.id);
 }
 for(const r of REGIONS){
  assert.equal(regionAt(r.x,r.y).id,r.id);
  assert.ok(w.notes.some(n=>n.name.startsWith(r.name)));
  assert.ok(w.world.some(o=>o.kind==='house'&&o.region===r.id)||w.world.some(o=>o.kind==='landmark'&&o.region===r.id),r.id);
 }
 const ids=new Set(w.world.map(o=>o.id));
 assert.equal(ids.size,w.world.length);
});
test('regressione salvataggi: identità e coordinate del mondo precedente non variano',()=>{
 const w=createWorld(initialState());
 const old=w.world.find(o=>o.id==='o754');
 assert.ok(old);
 assert.equal(old.kind,'rock');
 assert.equal(old.x,5885.719192856923);
 assert.equal(old.y,53.35117475129664);
 const animal=w.wildlife.find(a=>a.id==='animal-0');
 assert.equal(animal.x,1619.5652421563864);
 assert.equal(animal.y,3599.173484807834);
 const saved=initialState();
 saved.looted['exp-roadcar-0-1-1']={items:{wood:1},until:0};
 saved.animals['exp-animal-0']=1_700_000_000_000;
 const loaded=createWorld(saved);
 assert.equal(loaded.wildlife.find(a=>a.id==='exp-animal-0')?.deadAt,1_700_000_000_000);
 assert.ok(loaded.world.some(o=>o.id==='o754'));
});
test('geometria ampliata: confini, coste, strade, centri e indice spaziale',()=>{
 const w=createWorld(initialState());
 assert.equal(w.blocked(W+1,8000),true);
 assert.equal(w.blocked(10000,H+1),true);
 assert.ok(w.inWater(13380,5530));
 assert.ok(w.inCity(11350,1260));
 assert.ok(w.roadDist(8500,2620)<12);
 const nearby=w.queryWorld(1070,3400,1430,3910);
 assert.ok(nearby.length>0);
 assert.ok(nearby.length<w.world.length/15);
 const point=w.world.find(o=>o.id==='exp-mark-porto');
 assert.ok(point);
 assert.ok(w.queryWorld(point.x-65,point.y-65,point.x+65,point.y+65).some(o=>o.id===point.id));
 assert.ok(w.queryInteractables(7000,1500,14000,4300).some(o=>o.kind==='car'));
 assert.ok(w.spatialCells>500);
});
test('indice spaziale: oggetti multidimensionali, celle adiacenti e deduplica',()=>{
 const house={kind:'house',id:'a',x:100,y:200,w:800,h:380};
 const tree={kind:'tree',id:'b',x:1800,y:1000,r:40};
 const spatial=createSpatialIndex([house,tree],256);
 assert.deepEqual(spatial.query(800,550,850,600).map(o=>o.id),['a']);
 assert.deepEqual(spatial.query(1770,950,1830,1050).map(o=>o.id),['b']);
 assert.deepEqual(spatial.query(0,0,2100,1400).map(o=>o.id),['a','b']);
 assert.deepEqual(spatial.query(1100,1000,1150,1300),[]);
 assert.deepEqual(spatial.query(200,400,100,100),[]);
});
test('determinismo: nuovo mondo invariato per stato e generazione indipendente',()=>{
 const a=createWorld(initialState()),b=createWorld(initialState());
 assert.deepEqual(a.world.map(o=>[o.id,o.x,o.y]),b.world.map(o=>[o.id,o.x,o.y]));
 assert.deepEqual(a.wildlife.map(o=>[o.id,o.x,o.y]),b.wildlife.map(o=>[o.id,o.x,o.y]));
 a.world.find(o=>o.id==='exp-mark-porto').x=-50;
 assert.equal(b.world.find(o=>o.id==='exp-mark-porto').x,12000);
});
