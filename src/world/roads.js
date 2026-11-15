// Indice di prossimità per una rete stradale statica.
// La query è limitata a una soglia: Infinity significa soltanto "più lontano
// della soglia richiesta", non la distanza esatta dalla strada più vicina.
export function createRoadIndex(routes,cellSize=350,maxRange=160){
 if(!Number.isFinite(cellSize)||cellSize<=0||!Number.isFinite(maxRange)||maxRange<0)throw new RangeError('Invalid road index limits');
 const cells=new Map();
 const key=(x,y)=>x+','+y;
 let segmentCount=0;
 for(const road of routes){
  if(!Array.isArray(road.p)||road.p.length<2)continue;
  const half=road.w/2;
  for(let i=1;i<road.p.length;i++){
   const [ax,ay]=road.p[i-1],[bx,by]=road.p[i],dx=bx-ax,dy=by-ay,denom=dx*dx+dy*dy;
   const seg={ax,ay,dx,dy,denom,half};segmentCount++;
   const margin=half+maxRange;
   const minX=Math.floor((Math.min(ax,bx)-margin)/cellSize),maxX=Math.floor((Math.max(ax,bx)+margin)/cellSize);
   const minY=Math.floor((Math.min(ay,by)-margin)/cellSize),maxY=Math.floor((Math.max(ay,by)+margin)/cellSize);
   for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){
    const k=key(x,y),bucket=cells.get(k);
    if(bucket)bucket.push(seg);else cells.set(k,[seg]);
   }
  }
 }
 function distanceWithin(x,y,limit=maxRange){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(limit)||limit<0||limit>maxRange)return Infinity;
  const bucket=cells.get(key(Math.floor(x/cellSize),Math.floor(y/cellSize)));
  if(!bucket)return Infinity;
  let best=Infinity;
  for(const s of bucket){
   const t=Math.max(0,Math.min(1,((x-s.ax)*s.dx+(y-s.ay)*s.dy)/(s.denom||1)));
   const d=Math.hypot(x-s.ax-t*s.dx,y-s.ay-t*s.dy)-s.half;
   if(d<best)best=d;
  }
  return best<=limit?best:Infinity;
 }
 return {distanceWithin,cellCount:cells.size,segmentCount,maxRange};
}
