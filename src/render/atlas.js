import {W,H,TAU} from '../world/world.js';
import {REGIONS} from '../world/expansion.js';

const PALETTE={asphalt:'#b0a991',harbor:'#a3b2a9',town:'#b6b5a7',industrial:'#a99d8c',highland:'#91a28a',wetland:'#839f94',quarantine:'#ae9c89',orchard:'#aebd87',quarry:'#b7aa91',barracks:'#acae9b',coast:'#b9b4a1'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createAtlasRenderer(world,state){
 const {forest,fields,waterBodies,river,routes,gx,gy,townGrids,locations}=world;
 function draw(c,w,h,full=false){
  const viewW=full?W:3100,viewH=full?H:2350;
  const ox=full?0:clamp(state.x-viewW/2,0,W-viewW),oy=full?0:clamp(state.y-viewH/2,0,H-viewH);
  const sx=w/viewW,sy=h/viewH;
  const x=v=>(v-ox)*sx,y=v=>(v-oy)*sy;
  const visible=(px,py,pad=0)=>px>=ox-pad&&px<=ox+viewW+pad&&py>=oy-pad&&py<=oy+viewH+pad;
  c.save();c.clearRect(0,0,w,h);c.fillStyle='#b5b094';c.fillRect(0,0,w,h);
  c.beginPath();c.rect(0,0,w,h);c.clip();
  for(const region of REGIONS){if(!visible(region.x,region.y,Math.max(region.rx,region.ry)))continue;
   c.beginPath();c.ellipse(x(region.x),y(region.y),region.rx*sx,region.ry*sy,0,0,TAU);
   c.fillStyle=PALETTE[region.kind]||'#a4ad94';c.fill();}
  for(const f of forest){if(!visible(f.x,f.y,Math.max(f.rx,f.ry)))continue;c.beginPath();c.ellipse(x(f.x),y(f.y),f.rx*sx,f.ry*sy,0,0,TAU);c.fillStyle='#668965';c.fill();}
  for(const f of fields){if(!visible(f.x+f.w/2,f.y+f.h/2,Math.max(f.w,f.h)))continue;c.fillStyle='#c2bb7b';c.fillRect(x(f.x),y(f.y),f.w*sx,f.h*sy);}
  function poly(points,color,width){c.beginPath();points.forEach((p,i)=>i?c.lineTo(x(p[0]),y(p[1])):c.moveTo(x(p[0]),y(p[1])));c.strokeStyle=color;c.lineWidth=Math.max(.65,width*(sx+sy)/2);c.lineCap='round';c.lineJoin='round';c.stroke()}
  poly(river,'#649c9f',120);
  for(const body of waterBodies){if(!visible(body.x,body.y,Math.max(body.rx,body.ry)))continue;c.beginPath();c.ellipse(x(body.x),y(body.y),body.rx*sx,body.ry*sy,0,0,TAU);c.fillStyle='#77abb1';c.fill()}
  for(const r of routes){poly(r.p,'#4e655d',r.w+19);poly(r.p,'#a7a698',r.w)}
  for(const gx0 of gx)poly([[gx0,1030],[gx0,3390]],'#a1a29a',88);
  for(const gy0 of gy)poly([[3020,gy0],[5900,gy0]],'#a1a29a',88);
  for(const g of townGrids){if(!visible(g.x+g.w/2,g.y+g.h/2,Math.max(g.w,g.h)))continue;
   c.fillStyle='#9a9f95';c.fillRect(x(g.x),y(g.y),g.w*sx,g.h*sy);
   for(let a=g.x;a<=g.x+g.w;a+=g.step)poly([[a,g.y],[a,g.y+g.h]],'#c6c1af',76);
   for(let b=g.y;b<=g.y+g.h;b+=g.step)poly([[g.x,b],[g.x+g.w,b]],'#c6c1af',76);
  }
  if(full){
   // Etichette in pixel dopo la trasformazione: leggibili anche con un mondo grande.
   const marks=[...locations.filter(p=>p.story),...locations.filter(p=>!p.story)];
   c.font='bold 10px system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';
   for(const p of marks){if(!visible(p.x,p.y))continue;
    c.beginPath();c.arc(x(p.x),y(p.y),p.id==='shelter'?6:4,0,TAU);c.fillStyle=p.id==='shelter'?'#faf0c2':'#e5b768';c.fill();c.strokeStyle='#354d43';c.lineWidth=1.7;c.stroke();
    if(p.story){const label=p.name,cx=clamp(x(p.x),65,w-65),cy=clamp(y(p.y)+15,12,h-8);
     const tw=c.measureText(label).width;c.fillStyle='rgba(29,48,39,.88)';c.fillRect(cx-tw/2-6,cy-8,tw+12,16);c.fillStyle='#f4e6c3';c.fillText(label,cx,cy);}
   }
  }else{
   for(const p of locations){if(!visible(p.x,p.y))continue;c.beginPath();c.arc(x(p.x),y(p.y),3,0,TAU);c.fillStyle='#f0cc87';c.fill()}
  }
  if(state.marker&&visible(state.marker.x,state.marker.y)){c.beginPath();c.arc(x(state.marker.x),y(state.marker.y),full?7:5,0,TAU);c.strokeStyle='#e28d55';c.lineWidth=2;c.stroke()}
  c.beginPath();c.arc(x(state.x),y(state.y),full?6:5,0,TAU);c.fillStyle='#fff6ce';c.fill();c.strokeStyle='#243f31';c.lineWidth=2;c.stroke();
  if(!full){c.strokeStyle='#fff6cf55';c.lineWidth=1;c.beginPath();c.arc(x(state.x),y(state.y),Math.max(sx,sy)*260,0,TAU);c.stroke()}
  c.restore();
 }
 return draw;
}
