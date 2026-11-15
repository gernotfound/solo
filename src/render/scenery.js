import {clamp} from '../domain/index.js';
import {TAU,W,H} from '../world/world.js';
export function createSceneryRenderer(ctx,state,world) {
const {forest,fields,lake,pond,waterBodies,townGrids,regions,river,routes,gx,gy,locations,hash,woods,inCity,inWater,roadDist,cityRoadDist}=world;
const ell=(x,y,rx,ry,color,rot=0)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,TAU);ctx.fillStyle=color;ctx.fill()};
function rect(x,y,w,h,r,color,stroke=null,line=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
function path(points,width,color,dash=[]){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
function drawEnvironmentalStory(view){
 // Dettagli di terreno generati per cella: nessuna grande lista di entità
 // da aggiornare, e il risultato è identico dopo un caricamento del salvataggio.
 const cell=210;
 for(let iy=Math.floor(view.t/cell);iy<=Math.ceil(view.b/cell);iy++)
  for(let ix=Math.floor(view.l/cell);ix<=Math.ceil(view.r/cell);ix++){
   const x=ix*cell+hash(ix+191,iy+23)*110,y=iy*cell+hash(ix-71,iy+81)*110;
   if(x<6400&&y<4800)continue;
   const region=world.regionAt(x,y),value=hash(ix+41,iy-13);
   if(value<.28)continue;
   ctx.save();ctx.translate(x,y);ctx.rotate((hash(ix+6,iy+6)-.5)*.8);
   const mark=(width,height,color)=>rect(-width/2,-height/2,width,height,2,color);
   switch(region.kind){
    case 'harbor':mark(46,22,'#6a888277');mark(27,15,'#bd836155');path([[-15,-9],[14,-9]],2,'#e6d0a555');break;
    case 'industrial':ell(0,0,38,18,'#695c5077');mark(44,8,'#4d554e77');mark(16,23,'#a37b5e77');break;
    case 'town':mark(14,35,'#e1d9b75e');mark(34,7,'#798f845e');break;
    case 'highland':ell(0,0,45,17,'#748d7660');for(let i=0;i<5;i++)ell((i-2)*12,Math.sin(i*3)*10,6,4,'#c0b999a0');break;
    case 'wetland':for(let i=0;i<7;i++){const a=i*.8;path([[Math.sin(a)*27,19],[Math.sin(a)*33,-19]],3,'#5d825f99')}break;
    case 'quarantine':mark(65,9,'#675f5470');for(let i=0;i<4;i++)mark(8,9,i%2?'#d3ba7977':'#b66b5f77');break;
    case 'orchard':for(let i=0;i<4;i++){const cx=(i-1.5)*18;ell(cx,-7,13,12,'#6b996a99');ell(cx+6,0,8,8,'#a4bb7799')}break;
    case 'quarry':for(let i=0;i<4;i++){const cx=(i-1)*15;ell(cx,Math.cos(i*5)*12,13,9,'#8b837199')}break;
    case 'barracks':mark(42,11,'#6b7c6b88');mark(15,19,'#9c936e99');break;
    case 'coast':path([[-33,-10],[-13,5],[17,7],[41,-8]],4,'#e5d5b299');ell(30,19,13,5,'#97b5a584');break;
    case 'asphalt':mark(63,7,'#7e82747a');mark(18,24,'#b7a46c83');break;
   }
   ctx.restore();
  }
}
function land(view){
 ctx.fillStyle='#b7b38d';ctx.fillRect(view.l,view.t,view.r-view.l,view.b-view.t);
 // Ogni macroregione possiede un suolo riconoscibile, visibile senza minimappa.
 const soil={asphalt:'#b1ab92',harbor:'#a5b3a8',town:'#bdb9a9',industrial:'#aa9c89',highland:'#91a58b',wetland:'#81a493',quarantine:'#b09c8a',orchard:'#b0bf8c',quarry:'#bea98d',barracks:'#a1a99c',coast:'#c8bd9d'};
 for(const z of regions){if(Math.abs(z.x-(view.l+view.r)/2)>z.rx+(view.r-view.l)/2||Math.abs(z.y-(view.t+view.b)/2)>z.ry+(view.b-view.t)/2)continue;
  ell(z.x,z.y,z.rx,z.ry,soil[z.kind]||'#a1ab8f');ell(z.x-60,z.y+85,z.rx*.86,z.ry*.89,soil[z.kind]||'#9eac92');
 }
 // Zone naturali di superficie, con culling della viewport.
 for(const f of forest){if(f.x+f.rx<view.l||f.x-f.rx>view.r||f.y+f.ry<view.t||f.y-f.ry>view.b)continue;ell(f.x,f.y,f.rx+45,f.ry+48,'#a2b58a');ell(f.x+14,f.y-14,f.rx*.93,f.ry*.90,'#86a47b');ell(f.x-30,f.y+45,f.rx*.72,f.ry*.76,'#75996f')}
 for(const f of fields){if(f.x+f.w<view.l||f.x>view.r||f.y+f.h<view.t||f.y>view.b)continue;rect(f.x-17,f.y-18,f.w+34,f.h+34,17,'#a2ab76','#828e68',5);rect(f.x,f.y,f.w,f.h,9,'#bfbb7e');ctx.save();ctx.beginPath();ctx.rect(f.x,f.y,f.w,f.h);ctx.clip();for(let y=f.y+15;y<f.y+f.h;y+=31){path([[f.x+4,y],[f.x+f.w-4,y+12]],11,'#a6a971');path([[f.x+4,y+9],[f.x+f.w-4,y+21]],3,'#ddd39b')}ctx.restore();for(let x=f.x+7;x<f.x+f.w;x+=80){rect(x,f.y-24,4,24,1,'#74694c');rect(x,f.y+f.h,4,19,1,'#74694c')}}
 rect(2970,950,2990,2490,60,'#a9a99d','#999b8f',16);
 // Colline e linee topografiche a ovest, fuori dai centri abitati.
 ctx.save();ctx.strokeStyle='#848c6966';ctx.lineWidth=5;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(520,2000,620+i*56,300+i*29,-.2,.1,Math.PI*1.8);ctx.stroke()}ctx.restore();
 // Acqua: sponde, corso d'acqua, canneti e specchi d'acqua.
 path(river,144,'#9eaa8c');path(river,105,'#62979b');path(river,66,'#6fa8a9');path(river,22,'#9dc6bd66');
 for(const body of waterBodies){if(body.x+body.rx<view.l||body.x-body.rx>view.r||body.y+body.ry<view.t||body.y-body.ry>view.b)continue;ell(body.x,body.y,body.rx+25,body.ry+25,'#9cab88');ell(body.x,body.y,body.rx,body.ry,'#679d9d');ell(body.x-20,body.y-13,body.rx*.85,body.ry*.80,'#79aaac');ell(body.x-60,body.y-48,body.rx*.46,body.ry*.4,'#88b8b3a0')}
 for(let i=0;i<36;i++){const theta=i*TAU/36,body=i%4===0?pond:lake,x=body.x+Math.cos(theta)*body.rx*1.02,y=body.y+Math.sin(theta)*body.ry*1.03;ell(x,y,5+(i%3)*4,7,'#6f8f60')}
 // Trama locale leggera: completamente deterministica, senza sfarfallio.
 const cell=69;for(let cy=Math.floor(view.t/cell);cy<=Math.ceil(view.b/cell);cy++)for(let cx=Math.floor(view.l/cell);cx<=Math.ceil(view.r/cell);cx++){
  const x=cx*cell+hash(cx,cy)*cell,y=cy*cell+hash(cx+1,cy+3)*cell,v=hash(cx+30,cy-21),city=inCity(x,y),water=inWater(x,y);
  if(water)continue;ctx.lineWidth=1.4;ctx.strokeStyle=city?'#6d706853':woods(x,y)>.12?'#3d5d3c66':'#928d6066';ctx.beginPath();ctx.moveTo(x-5,y+2);ctx.lineTo(x,y-v*7);ctx.lineTo(x+3,y+1);ctx.stroke();
  if(v>.83)ell(x+18,y+12,3,2,city?'#e2d0a56b':'#ece0ae9c');
 }
 drawEnvironmentalStory(view);
}
function drawRoads(){
 for(const road of routes){path(road.p,road.w+23,'#b8ad8c');path(road.p,road.w+12,'#596b61');path(road.p,road.w,'#797f77');path(road.p,3,'#e4c991',[24,39]);}
 // City blocks, roads, alleys and faded zebra crossings.
 for(const x of gx){path([[x,1030],[x,3390]],105,'#57685d');path([[x,1030],[x,3390]],92,'#888b83');path([[x,1030],[x,3390]],3,'#e5d4a8',[24,29])}
 for(const y of gy){path([[3020,y],[5900,y]],105,'#57685d');path([[3020,y],[5900,y]],92,'#888b83');path([[3020,y],[5900,y]],3,'#e5d4a8',[24,29])}
 for(const grid of townGrids){for(let x=grid.x;x<=grid.x+grid.w;x+=grid.step){path([[x,grid.y],[x,grid.y+grid.h]],83,'#57685d');path([[x,grid.y],[x,grid.y+grid.h]],70,'#95988e');}for(let y=grid.y;y<=grid.y+grid.h;y+=grid.step){path([[grid.x,y],[grid.x+grid.w,y]],83,'#57685d');path([[grid.x,y],[grid.x+grid.w,y]],70,'#95988e');}}
 for(let c=0;c<gx.length;c++)for(let r=0;r<gy.length;r++)if((c+r)%3===0){const x=gx[c]+56,y=gy[r]-39;for(let i=0;i<6;i++)rect(x,y+i*12,32,6,1,'#d1c8ac84')}
 // Ponti: consentono di oltrepassare il corso d'acqua sulle strade.
 for(const p of [[1540,3390,235,99,-.05],[2600,2950,210,90,-.32]]){ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(p[4]);rect(-p[2]/2,-p[3]/2-8,p[2],p[3]+16,4,'#d7c7a2','#5d6b5e',6);rect(-p[2]/2,-p[3]/2+5,p[2],p[3]-10,2,'#8e9588');ctx.restore()}
}
function drawRoadDetails(view){
 const cell=175;for(let yy=Math.floor(view.t/cell);yy<=Math.ceil(view.b/cell);yy++)for(let xx=Math.floor(view.l/cell);xx<=Math.ceil(view.r/cell);xx++){
 const x=xx*cell+hash(xx+71,yy)*80,y=yy*cell+hash(xx,yy+90)*80,d=Math.min(roadDist(x,y),cityRoadDist(x,y));
 if(d>8||hash(xx,yy)<.64)continue;
 ctx.beginPath();ctx.moveTo(x-13,y-9);ctx.lineTo(x-2,y+3);ctx.lineTo(x+9,y+7);ctx.lineTo(x+20,y+21);ctx.strokeStyle='#455d5877';ctx.lineWidth=2;ctx.stroke();
 }
 // Vegetazione spunta dal cemento.
 for(let i=0;i<64;i++){const x=3050+(i%8)*353+hash(i,5)*40,y=1150+Math.floor(i/8)*290+hash(i,10)*44;if(x<view.l-60||x>view.r+60||y<view.t-60||y>view.b+60)continue;ell(x,y,15,8,'#6f9272aa');ell(x-6,y-4,7,6,'#779b69')}
}
function drawHouse(o){const {x,y,w,h,category,variant,shade}=o;
 const roof=['#9b8975','#8a9790','#a99c80','#9b857a','#aaa187'][variant%5];
 rect(x+11,y+18,w,h,10,'#293e3766');rect(x,y+10,w,h,7,'#536459','#2d4038',5);rect(x,y,w,h,6,roof,'#51564a',5);rect(x+10,y+9,w-20,h-21,3,'#dac9a017');
 if(category==='police'){rect(x+15,y+12,w-30,26,5,'#3d5f6d','#cad2bf',2);ctx.font='bold 17px Arial';ctx.fillStyle='#f1e2bf';ctx.textAlign='center';ctx.fillText('POLIZIA',x+w/2,y+32)}
 else if(category==='clinic'){rect(x+15,y+14,41,34,4,'#d2e0c7');rect(x+31,y+19,9,25,2,'#a95150');rect(x+23,y+26,25,8,2,'#a95150')}
 else if(category==='market'||category==='shop'){rect(x+18,y+14,w-36,24,5,'#6e8065','#d5c39b',2);ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillStyle='#f4e4b4';ctx.fillText(category==='market'?'ALIMENTARI':'BOTTEGA',x+w/2,y+31)}
 else {rect(x+18,y+15,w*.32,12,2,'#495b50','#d2c8a1',2);rect(x+w*.65,y+17,w*.21,14,2,'#506259','#d2c8a1',2)}
 rect(x+w*.19,y+h*.42,w*.19,h*.21,3,shade>.55?'#384b4a':'#60706a','#c1bc9d',2);path([[x+w*.24,y+h*.44],[x+w*.31,y+h*.6]],2,'#d4c7a5');
 path([[x+w*.56,y+3],[x+w*.62,y+h*.25],[x+w*.56,y+h*.38],[x+w*.68,y+h*.49]],2.5,'#576153');
 if(shade>.45){rect(x+w*.36,y+h*.62,w*.38,8,2,'#666a5a');ell(x+w*.86,y+h*.82,10,6,'#78946b')}
 // Porte distinguibili e accessibili dall'esterno.
 rect(o.doorX-17,y+h-9,34,20,3,'#554a39','#d6c49d',3);ell(o.doorX+10,y+h,2.2,2.2,'#f2d697');
 if(category==='warehouse'||category==='barn')for(let i=0;i<3;i++)rect(x+17+i*28,y+h*.15,18,12,1,'#54645c');
}
function drawTree(o){const {x,y,r,shade}=o;
 ell(x+8,y+10,r*.85,r*.64,'#263f3650');
 if(o.kind==='deadTree'){path([[x,y+9],[x,y-18],[x-13,y-30]],8,'#73664f');path([[x,y-17],[x+17,y-35]],5,'#8c7b5d');path([[x-7,y-24],[x-17,y-39]],3,'#b69f77');return}
 ell(x,y-r*.1,r*.86,r*.83,'#365d45');ell(x-r*.27,y-r*.36,r*.70,r*.65,shade>.52?'#5d8556':'#668f61');ell(x+r*.31,y-r*.35,r*.66,r*.65,shade>.58?'#5a875c':'#497852');ell(x,y-r*.58,r*.66,r*.64,shade>.42?'#95b27d':'#789e70');ell(x-r*.25,y-r*.70,r*.18,r*.12,'#c1d19a90');
}
function drawBush(o){const {x,y,r}=o;ell(x+4,y+7,r*1.1,r*.64,'#293f384d');
 if(o.kind==='rock'){ell(x,y,r,r*.76,'#7f8578');ell(x-r*.22,y-r*.2,r*.45,r*.29,'#bec1aa');return}
 ell(x-r*.36,y-r*.12,r*.74,r*.65,'#527c53');ell(x+r*.32,y-r*.24,r*.72,r*.67,'#6e9a6b');ell(x,y-r*.45,r*.56,r*.51,'#83ac78');
 if(o.kind==='berry')for(let i=0;i<4;i++){ell(x+(i%2-.5)*r*.7,y-r*.5+Math.floor(i/2)*r*.4,3.5,3.5,'#b45e67')}
}
function drawCar(o){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);ell(5,7,32,22,'#233a355f');const colors=['#9d6554','#8fa396','#bf9a6f','#737f6b'];rect(-28,-16,56,32,7,colors[Math.min(3,Math.floor(o.shade*4))],'#364a40',4);rect(-11,-16,24,31,5,'#365b5b','#c7c0a0',3);path([[-7,-15],[12,12]],2,'#bdc4b2');rect(-21,-20,10,5,2,'#2f3834');rect(11,15,13,5,2,'#303c37');rect(-29,-5,5,10,1,'#e6cc90');ctx.restore()}
function drawCamp(o,t){const lit=state.fires[o.id]&&state.fires[o.id]>Date.now();ell(o.x,o.y+10,34,19,'#2b382c50');for(let i=0;i<8;i++){const a=i*TAU/8;ell(o.x+Math.cos(a)*26,o.y+Math.sin(a)*15,9,6,'#7d7865')}path([[o.x-15,o.y+9],[o.x+15,o.y-10]],8,'#7e6448');path([[o.x-15,o.y-8],[o.x+12,o.y+12]],8,'#5a513e');
 if(lit){const sway=Math.sin(t*.005)*5;ell(o.x,o.y-12+sway*.3,17,24,'#dc894d');ell(o.x+4,o.y-17+sway,10,19,'#f7c779');ell(o.x+1,o.y-16,6,11,'#fff1a3')}
}
function drawPlot(o){const p=state.plots[o.id];rect(o.x-27,o.y-21,54,42,5,'#78694b','#c4a475',3);for(let i=-1;i<=1;i++)path([[o.x-22,o.y+i*10],[o.x+22,o.y+i*10]],2,'#b59560');if(!p)return;const progress=Math.min(1,(Date.now()-p.plantedAt)/p.duration);if(progress>.1){const size=7+14*progress;for(let i=0;i<3;i++){const x=o.x-13+i*13;ell(x-4,o.y-9,size*.5,size*.35,'#65935b',-.7);ell(x+3,o.y-11,size*.5,size*.35,'#8eb06c',.7)}}if(progress===1)ell(o.x,o.y-24,7,7,'#e9c96b')}
function drawWell(o){ell(o.x,o.y+8,25,18,'#31433a70');ell(o.x,o.y,22,18,'#918575');ell(o.x,o.y-4,16,12,'#395f62');ell(o.x-3,o.y-7,8,5,'#7faba8');path([[o.x-23,o.y-2],[o.x-23,o.y-31],[o.x+23,o.y-31],[o.x+23,o.y-2]],5,'#715f43')}
function drawLandmark(o,t){
 ctx.save();ctx.translate(o.x,o.y);
 // Sagome dedicate: il punto di interesse resta leggibile mentre si esplora.
 ell(6,19,72,36,'#263d3755');
 const style=o.style;
 if(style==='lighthouse'||style==='mast'||style==='watchtower'||style==='watertower'){
  rect(-17,-70,34,91,4,style==='lighthouse'?'#e5d5bc':'#73887c','#52675e',5);
  rect(-24,-83,48,17,3,'#4c625d');rect(-12,-104,24,20,3,'#c7a66f');
  if(style==='lighthouse'){rect(-18,-43,36,12,2,'#ad695b');ell(0,-101,14,9,'#f7e2a5')}
  else if(style==='mast'){path([[-40,24],[0,-133],[40,24]],8,'#4e675e');ell(0,-138,8,8,'#e1a96a')}
 }else if(style==='crane'||style==='derrick'){
  path([[-24,30],[-12,-98],[10,-98],[22,30]],10,'#6e756b');
  path([[-75,-95],[95,-95]],9,style==='crane'?'#bd9568':'#7f8a81');
  path([[58,-95],[58,-7]],3,'#5d6b62');rect(48,-3,21,14,3,'#c0a16e');
 }else if(style==='chimney'){
  for(const [x,h] of [[-33,109],[15,130]]){rect(x,-h,35,h+16,4,'#916d60','#554f46',5);rect(x-6,-h-9,47,12,2,'#c1a78a')}
 }else if(style==='barricade'){
  rect(-67,-22,134,49,5,'#827b68','#4d5f55',5);
  for(let i=0;i<5;i++){path([[-65+i*29,-20],[-36+i*29,24]],8,i%2?'#e8d7a9':'#c77d5e')}
 }else if(style==='boat'){
  ell(0,0,72,24,'#465f5e');rect(-54,-11,108,19,3,'#9c8168');path([[0,0],[0,-71],[48,-15]],4,'#d0c2a1');
 }else if(style==='silo'){
  for(const x of [-30,30]){rect(x-23,-65,46,90,6,'#a7aca0','#64796a',4);ell(x,-65,25,14,'#d2c9ae')}
 }else if(style==='radar'){
  rect(-43,-11,86,42,7,'#75887a','#415e52',5);path([[0,-10],[0,-64]],9,'#66796d');
  ctx.beginPath();ctx.arc(0,-66,29,Math.PI*.85,Math.PI*1.85);ctx.lineWidth=9;ctx.strokeStyle='#c7c5b1';ctx.stroke();
 }
 ctx.restore();
}
function drawObject(o,t){if(o.kind==='landmark')drawLandmark(o,t);else if(o.kind==='house')drawHouse(o);else if(o.kind==='tree'||o.kind==='deadTree')drawTree(o);else if(['bush','berry','rock'].includes(o.kind))drawBush(o);else if(o.kind==='car')drawCar(o);else if(o.kind==='camp')drawCamp(o,t);else if(o.kind==='plot')drawPlot(o);else if(o.kind==='well')drawWell(o);else if(o.kind==='bed'){ell(o.x,o.y+7,29,16,'#263a324d');rect(o.x-28,o.y-15,56,33,5,'#735e45','#a89067',3);rect(o.x-23,o.y-11,44,25,4,'#8b9c7a');rect(o.x-21,o.y-9,17,20,3,'#cbb88b')}else if(o.kind==='crate'){rect(o.x-22,o.y-14,43,32,4,'#96734f','#644d35',4);path([[o.x-19,o.y-12],[o.x+19,o.y+14]],3,'#c2a06b')}else if(o.kind==='debris'){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.shade*6);rect(-o.r,-o.r*.4,o.r*2,o.r*.8,1,o.shade>.5?'#8f8770':'#68776b');ctx.restore()}}
return {ell,rect,path,land,drawRoads,drawRoadDetails,drawObject};
}
