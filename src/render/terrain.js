// Dettagli ambientali senza stato: per la stessa cella il risultato è stabile,
// anche dopo riavvii e spostamenti della camera. Si disegnano solo le celle visibili.
export function drawTerrainFeatures(ctx,world,view){
 const {hash,regionAt,inCity,inField,woods,inWater,fastRoadDist,cityRoadDist}=world;
 const cell=180,TAU=Math.PI*2;
 const ell=(x,y,rx,ry,color,angle=0)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,TAU);ctx.fillStyle=color;ctx.fill()};
 const line=(points,color,width)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()};
 const box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
 for(let cy=Math.floor(view.t/cell);cy<=Math.ceil(view.b/cell);cy++)
  for(let cx=Math.floor(view.l/cell);cx<=Math.ceil(view.r/cell);cx++){
   const x=(cx+.2+hash(cx+19,cy+7)*.55)*cell;
   const y=(cy+.2+hash(cx-17,cy+41)*.55)*cell;
   if(inWater(x,y))continue;
   const v=hash(cx+8,cy-9),seed=hash(cx+191,cy-181);
   let biome=regionAt(x,y).kind;
   if(x<6400&&y<4800)biome=inCity(x,y)?'town':inField(x,y)?'orchard':woods(x,y)>.2?'highland':'asphalt';
   ctx.save();ctx.translate(x,y);ctx.rotate((seed-.5)*.75);
   // Più scale di dettaglio: il suolo non è un'unica tinta uniforme.
   if(v>.22){ell(0,0,36+seed*34,11+v*12,biome==='industrial'?'#514f4b22':biome==='wetland'?'#355f5736':biome==='coast'?'#f2dcb83b':'#354b3a19',seed*.4);}
   if(biome==='highland'){
    for(let n=0;n<5;n++){const dx=-30+n*13;ell(dx,(n%2)*16,5+seed*5,7,'#557b529e')}
    if(v>.7){line([[-40,17],[-11,8],[8,-6],[35,-15]],'#637b64a8',2.5);}
   }else if(biome==='orchard'){
    for(let n=0;n<4;n++){const dy=-32+n*22;line([[-54,dy],[56,dy+4]],'#8c966590',4);for(let k=0;k<4;k++)ell(-37+k*24,dy-3,4.8,5.5,'#65894f')}
   }else if(biome==='wetland'){
    ell(-10,3,48,24,'#6d9f9e7d',-.3);ell(18,1,21,10,'#90b6a9af');
    for(let n=0;n<7;n++){const dx=-39+n*13,dy=(n%3)*8;line([[dx,dy+15],[dx+5,dy-16]],'#63855caf',3)}
   }else if(biome==='harbor'){
    box(-37,-25,75,45,'#687e786b');box(-34,-22,69,39,'#a4aca05c');
    if(v>.5){box(-35,-8,70,3,'#e2c98f9e');box(-35,5,70,3,'#e2c98f9e')}
    else{line([[-22,-9],[-8,5],[14,7],[25,19]],'#4c655dac',4)}
   }else if(biome==='quarantine'||biome==='barracks'){
    box(-42,3,84,10,'#5e675d8a');for(let i=0;i<6;i++)box(-40+i*14,3,7,10,i%2?'#d9ad6ea1':'#9e6555a0');
    if(v>.6){line([[-37,-24],[38,-24]],'#52645599',3);for(let n=-2;n<=2;n++)box(n*16,-26,3,12,'#51665aa0')}
   }else if(biome==='quarry'){
    for(let n=0;n<4;n++){const yy=-23+n*15;line([[-43+n*5,yy],[-18+n*3,yy-6],[36,yy+5]],n%2?'#8f8574':'#b9a690',4)}
    ell(21,12,19,11,'#817b6bad',.7);
   }else if(biome==='industrial'){
    box(-38,-22,76,41,'#6767627d');box(-31,-16,61,25,'#9a998779');
    line([[-46,25],[-20,25],[-20,-22]],'#4a5750af',7);
    if(v>.6){ell(11,7,16,10,'#403e3b78');ell(11,7,10,5,'#8e78538c')}
   }else if(biome==='coast'){
    line([[-42,-7],[-15,-15],[11,-4],[43,-12]],'#f8e6b8af',4);
    line([[-32,14],[0,8],[35,17]],'#9bbdb6a9',3);
    for(let n=0;n<5;n++)ell(n*15-30,20-(n%3)*8,3,3,'#e9d5ada3');
   }else if(biome==='town'){
    box(-37,-27,74,49,'#626b6180');box(-33,-23,66,41,'#b7b7a48c');
    line([[-23,-16],[-3,-5],[21,-8],[29,13]],'#65756bb0',3);
    if(v>.57){box(6,-19,19,13,'#777f759a');box(10,-16,11,7,'#434c4997')}
   }else{
    line([[-43,-18],[-8,-9],[19,-12],[39,2]],'#7f86735a',2);
    ell(21,19,25,10,'#8a8b745b');
   }
   // Segnaletica e margini: vicini alla strada, mai al centro della carreggiata.
   if(v>.81){const road=Math.min(fastRoadDist(x,y,110),cityRoadDist(x,y));if(road>12&&road<110){
    box(-2,-31,4,45,'#626c60');box(-16,-38,32,15,biome==='quarantine'?'#bb815c':'#c3ae79');
    box(-12,-34,24,3,'#f1e0b5');
   }}
   ctx.restore();
  }
}
