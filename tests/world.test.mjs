import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,W,H} from '../src/world/world.js';
import {initialState} from '../src/domain/index.js';

test('generazione: mappa articolata, città, campagne, strade, fauna e fonti',()=>{
 const w=createWorld(initialState());assert.ok(w.world.length>900);assert.ok(w.buildings.length>55);assert.ok(w.wildlife.length>10);
 for(const kind of ['house','tree','deadTree','rock','berry','camp','well','plot','car','crate'])assert.ok(w.interactables.some(o=>o.kind===kind),kind);
 assert.ok(w.river.length>8);assert.ok(w.routes.length>=5);assert.ok(w.forest.length>5);assert.ok(w.fields.length>4);
});
test('generazione deterministica: identica sequenza e stessi ID per stesso seed e stato',()=>{
 const s=initialState(),a=createWorld(s),b=createWorld(s);assert.deepEqual(a.world.map(o=>[o.id,o.kind,o.x,o.y]),b.world.map(o=>[o.id,o.kind,o.x,o.y]));assert.deepEqual(a.wildlife.map(o=>[o.id,o.kind,o.x,o.y]),b.wildlife.map(o=>[o.id,o.kind,o.x,o.y]));
});
test('mondo: confini coerenti, bosco, città, campi e acqua classificati',()=>{
 const w=createWorld(initialState());assert.equal(w.inCity(3600,1800),true);assert.equal(w.inCity(850,900),false);assert.ok(w.inField(750,3900));assert.ok(w.inWater(1850,1090));assert.equal(w.inWater(1070,3540),false);
 assert.equal(w.blocked(-1,30),true);assert.equal(w.blocked(W+10,H),true);
});
test('nessun animale vivo ripristinato se la morte salvata è registrata',()=>{
 const s=initialState();s.animals['animal-0']=Date.now();const w=createWorld(s);assert.equal(w.wildlife[0].deadAt,s.animals['animal-0']);
});
test('generazioni indipendenti: modificare una mappa non modifica quelle successive',()=>{
 const a=createWorld(initialState());a.world[0].x=123456;const b=createWorld(initialState());assert.notEqual(b.world[0].x,123456);
});
