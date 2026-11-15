// Rasterizza solo il terreno statico. Personaggio, animali, saccheggio e luce
// restano disegnati ogni frame su Canvas principale.
export function createTerrainCache(renderTile,{
 tileSize=512,maxBytes=24*1024*1024,
 createCanvas=()=>document.createElement('canvas')
}={}){
 if(!Number.isFinite(tileSize)||tileSize<=0||!Number.isFinite(maxBytes)||maxBytes<=0)throw new RangeError('Invalid terrain cache limits');
 const cache=new Map();let cachedBytes=0,lastScale=0;
 const stats={tilesBuilt:0,tilesReused:0,fallbackFrames:0};
 function clear(){for(const tile of cache.values()){tile.canvas.width=0;tile.canvas.height=0}cache.clear();cachedBytes=0}
 function draw(ctx,view,scale){
  if(!Number.isFinite(scale)||scale<=0)throw new RangeError('Invalid raster scale');
  if(scale!==lastScale){clear();lastScale=scale}
  const x0=Math.floor(view.l/tileSize),x1=Math.max(x0,Math.ceil(view.r/tileSize)-1),y0=Math.floor(view.t/tileSize),y1=Math.max(y0,Math.ceil(view.b/tileSize)-1);
  const total=(x1-x0+1)*(y1-y0+1),pixelSize=Math.max(1,Math.round(tileSize*scale)),tileBytes=pixelSize*pixelSize*4;
  // Su schermi enormi non saturiamo la memoria né rigeneriamo le tessere
  // a ogni fotogramma per effetto dell'espulsione LRU.
  if(total*tileBytes>maxBytes){stats.fallbackFrames++;return false}
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const k=x+','+y;let tile=cache.get(k);
   if(tile){cache.delete(k);cache.set(k,tile);stats.tilesReused++}
   else{
    while(cache.size&&cachedBytes+tileBytes>maxBytes){const oldest=cache.keys().next().value,evicted=cache.get(oldest);cache.delete(oldest);cachedBytes-=evicted.bytes;evicted.canvas.width=0;evicted.canvas.height=0}
    const canvas=createCanvas();canvas.width=canvas.height=pixelSize;
    const context=canvas.getContext('2d',{alpha:false});
    if(!context)throw new Error('Canvas context unavailable');
    const actualScale=pixelSize/tileSize,l=x*tileSize,t=y*tileSize;
    context.setTransform(actualScale,0,0,actualScale,-l*actualScale,-t*actualScale);
    // Overscan per le decorazioni che iniziano fuori dalla tessera ma
    // la attraversano. Il clip è garantito dal buffer Canvas.
    renderTile(context,{l:l-220,t:t-220,r:l+tileSize+220,b:t+tileSize+220});
    tile={canvas,bytes:tileBytes};cache.set(k,tile);cachedBytes+=tileBytes;stats.tilesBuilt++;
   }
   ctx.drawImage(tile.canvas,x*tileSize,y*tileSize,tileSize,tileSize);
  }
  return true;
 }
 return {draw,clear,stats,get cachedBytes(){return cachedBytes},get tileCount(){return cache.size}};
}
