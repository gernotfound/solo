import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,quantity} from '../src/domain/index.js';
import {SAVE_KEY,LEGACY_KEYS,loadState,saveState,resetState} from '../src/domain/persistence.js';
function storage(seed={}){const m=new Map(Object.entries(seed));return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),peek:k=>m.get(k),keys:()=>[...m.keys()]}}

test('salvataggio SoLo: roundtrip zaino, equipaggiamento, colture e coordinate',()=>{
 const store=storage(),s=initialState();s.inventory.berry=23;s.x=1400;s.plots.test={plantedAt:1000,duration:125000,watered:0};assert.equal(saveState(store,s,4567),true);const copy=loadState(store);assert.equal(copy.x,1400);assert.equal(quantity(copy,'berry'),23);assert.deepEqual(copy.plots,s.plots);assert.equal(copy.lastSave,4567);
});
test('sorgente precedente viene letta e non distrutta durante la migrazione',()=>{
 const previous=initialState();previous.x=2200;previous.inventory.beans=7;const store=storage({[LEGACY_KEYS[0]]:JSON.stringify(previous)});const next=loadState(store);assert.equal(next.x,2200);assert.equal(next.inventory.beans,7);assert.ok(store.peek(LEGACY_KEYS[0]));assert.equal(saveState(store,next),true);assert.ok(store.peek(SAVE_KEY));assert.ok(store.peek(LEGACY_KEYS[0]));
});
test('migrazione salvataggio esplorativo precedente conserva posizione, ricordi, segnaposto',()=>{
 const old={x:3000,y:1500,found:[0,2,2,100],marker:{x:3001,y:1501}};const store=storage({[LEGACY_KEYS[1]]:JSON.stringify(old)});const s=loadState(store);assert.equal(s.x,3000);assert.deepEqual(s.found,[0,2]);assert.deepEqual(s.marker,old.marker);
});
test('salvataggi guasti e archiviazione non accessibile non impediscono l’avvio',()=>{
 const store=storage({[SAVE_KEY]:'{broken json'});assert.equal(loadState(store).version,2);
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('quota exceeded')}};assert.equal(loadState(denied).version,2);const s=initialState();const before=s.lastSave;assert.equal(saveState(denied,s,99999),false);assert.equal(s.lastSave,before);
});
test('azzeramento esplicito cancella tutte le versioni del solo gioco',()=>{
 const store=storage({[SAVE_KEY]:'x',[LEGACY_KEYS[0]]:'y',[LEGACY_KEYS[1]]:'z',otherGame:'preserve'});resetState(store);assert.deepEqual(store.keys(),['otherGame']);
});

test('salvataggio in regioni ampliate conserva coordinate, segnaposto e nuove testimonianze',()=>{
 const store=storage(),s=initialState();
 s.x=16000;s.y=12600;s.marker={x:20600,y:14200};s.found=[0,7,20,28,20];
 assert.equal(saveState(store,s,1234567),true);
 const restored=loadState(store);
 assert.equal(restored.x,16000);assert.equal(restored.y,12600);
 assert.deepEqual(restored.marker,{x:20600,y:14200});
 assert.deepEqual(restored.found,[0,7,20,28]);
 const corrupt={...s,x:999999999,y:-111,marker:{x:Infinity,y:1}};
 const checked=loadState(storage({[SAVE_KEY]:JSON.stringify(corrupt)}));
 assert.equal(checked.x,22375);assert.equal(checked.y,25);assert.equal(checked.marker,null);
});
