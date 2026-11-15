// Indice spaziale uniforme. Query per rettangolo con identità stabile,
// deduplicazione per oggetti che attraversano più celle e ordine del chiamante.
export function createSpatialIndex(objects,cellSize=350){
 const cells=new Map();
 const key=(x,y)=>x+','+y;
 for(const o of objects){
  const pad=o.kind==='house'?0:Math.max(16,o.r||20);
  const left=o.kind==='house'?o.x:o.x-pad,right=o.kind==='house'?o.x+o.w:o.x+pad;
  const top=o.kind==='house'?o.y:o.y-pad,bottom=o.kind==='house'?o.y+o.h:o.y+pad;
  for(let x=Math.floor(left/cellSize);x<=Math.floor(right/cellSize);x++)
   for(let y=Math.floor(top/cellSize);y<=Math.floor(bottom/cellSize);y++){
    const k=key(x,y);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(o);
   }
 }
 function query(l,t,r,b){
  if(![l,t,r,b].every(Number.isFinite)||r<l||b<t)return [];
  const out=[],seen=new Set();
  for(let x=Math.floor(l/cellSize);x<=Math.floor(r/cellSize);x++)
   for(let y=Math.floor(t/cellSize);y<=Math.floor(b/cellSize);y++)
    for(const o of cells.get(key(x,y))||[]){
     if(seen.has(o))continue;seen.add(o);
     const pad=o.kind==='house'?0:Math.max(16,o.r||20);
     const ox=o.kind==='house'?o.x:o.x-pad,oy=o.kind==='house'?o.y:o.y-pad;
     const rx=o.kind==='house'?o.x+o.w:o.x+pad,by=o.kind==='house'?o.y+o.h:o.y+pad;
     if(rx>=l&&ox<=r&&by>=t&&oy<=b)out.push(o);
    }
  return out;
 }
 return {query,cellSize,cellCount:cells.size};
}
