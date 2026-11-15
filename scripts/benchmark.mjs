import {performance} from 'node:perf_hooks';
import {createWorld} from '../src/world/world.js';
import {initialState} from '../src/domain/index.js';
// Benchmark riproducibile del motore Node, NON misurazione FPS su dispositivi.
const t0=performance.now(),w=createWorld(initialState()),setup=performance.now()-t0;
const positions=Array.from({length:6000},(_,i)=>[Math.round((i*977+73)%22400),Math.round((i*677+31)%16400)]);
function measure(label,fn){
 for(let i=0;i<2;i++)for(const [x,y] of positions)fn(x,y);
 const times=[];
 for(let k=0;k<5;k++){const start=performance.now();let checksum=0;for(const [x,y] of positions){const d=fn(x,y);checksum+=Number.isFinite(d)?d:0}times.push({ms:performance.now()-start,checksum})}
 times.sort((a,b)=>a.ms-b.ms);console.log(label+': '+times[2].ms.toFixed(2)+' ms for '+positions.length+' queries (checksum '+times[2].checksum.toFixed(1)+')');return times[2].ms;
}
const roadOld=measure('Full route scan',(x,y)=>{const d=w.roadDist(x,y);return d<=110?d:Infinity});
const roadNew=measure('Indexed routes',(x,y)=>w.fastRoadDist(x,y,110));
const waterOld=measure('Original water check',(x,y)=>w.waterBodies.some(b=>w.inLake(x,y,b))||(w.pathDist(x,y,w.river)<49&&w.roadDist(x,y)>34)?1:0);
const waterNew=measure('Bounded water check',(x,y)=>w.inWater(x,y)?1:0);
console.log('Create world: '+setup.toFixed(2)+' ms; index cells '+w.roadIndex.cellCount+', segments '+w.roadIndex.segmentCount);
console.log('Index road speed ratio: '+(roadOld/roadNew).toFixed(2)+'x; water ratio: '+(waterOld/waterNew).toFixed(2)+'x (Node runner only)');
