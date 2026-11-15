import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrainCache} from '../src/render/cache.js';

function fixture(options={}){
 const buffers=[],painted=[],views=[];
 const createCanvas=()=>{
  const canvas={width:0,height:0};
  canvas.getContext=()=>({setTransform(...args){canvas.transform=args}});
  buffers.push(canvas);return canvas;
 };
 const c=createTerrainCache((ctx,view)=>views.push(view),{createCanvas,...options});
 const ctx={drawImage(canvas,...args){painted.push({canvas,args})}};
 return {c,ctx,buffers,painted,views};
}
test('static terrain is rasterized once and reused across frames without reallocations',()=>{
 const {c,ctx,buffers,painted,views}=fixture();
 const view={l:100,t:200,r:900,b:990};
 assert.equal(c.draw(ctx,view,1),true);
 assert.equal(c.stats.tilesBuilt,4);
 assert.equal(c.tileCount,4);
 assert.equal(views.length,4);
 assert.equal(painted.length,4);
 assert.ok(c.cachedBytes<=24*1024*1024);
 assert.equal(c.draw(ctx,view,1),true);
 assert.equal(c.stats.tilesBuilt,4);
 assert.equal(c.stats.tilesReused,4);
 assert.equal(buffers.length,4);
 assert.equal(painted.length,8);
 assert.ok(buffers.every(b=>b.width===512&&b.height===512));
});
test('tile rasterization is calibrated to actual scale and invalidated on zoom change',()=>{
 const {c,ctx,buffers}=fixture();
 const view={l:50,t:50,r:400,b:400};
 assert.equal(c.draw(ctx,view,1.2),true);
 assert.equal(buffers[0].width,614);
 assert.equal(buffers[0].transform[0],614/512);
 assert.equal(c.draw(ctx,view,1.2),true);
 assert.equal(c.stats.tilesBuilt,1);
 assert.equal(c.draw(ctx,view,1.5),true);
 assert.equal(c.stats.tilesBuilt,2);
 assert.equal(buffers[0].width,0);
 assert.equal(c.tileCount,1);
});
test('cache refuses impossible viewport budgets instead of thrashing memory',()=>{
 const {c,ctx,buffers}=fixture({maxBytes:512*512*4*2});
 const view={l:0,t:0,r:950,b:950};
 assert.equal(c.draw(ctx,view,1),false);
 assert.equal(c.stats.fallbackFrames,1);
 assert.equal(buffers.length,0);
 assert.equal(c.tileCount,0);
});
test('cache evicts old tiles and keeps memory below the configured limit',()=>{
 const {c,ctx,buffers}=fixture({maxBytes:512*512*4*2});
 const a={l:5,t:5,r:510,b:510},b={l:520,t:5,r:900,b:510},d={l:1030,t:5,r:1500,b:510};
 assert.equal(c.draw(ctx,a,1),true);
 assert.equal(c.draw(ctx,b,1),true);
 assert.equal(c.draw(ctx,d,1),true);
 assert.equal(c.tileCount,2);
 assert.equal(buffers[0].width,0);
 assert.equal(c.cachedBytes,2*512*512*4);
 assert.equal(c.draw(ctx,a,1),true);
 assert.equal(c.stats.tilesBuilt,4);
 c.clear();
 assert.equal(c.tileCount,0);assert.equal(c.cachedBytes,0);
 assert.throws(()=>c.draw(ctx,a,0),RangeError);
});

test('a tile boundary does not load an invisible extra tile',()=>{
 const {c,ctx}=fixture();
 assert.equal(c.draw(ctx,{l:0,t:0,r:512,b:512},1),true);
 assert.equal(c.tileCount,1);
});
