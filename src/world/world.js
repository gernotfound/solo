import {clamp,DEFAULT_POSITION} from '../domain/index.js';
export const W=6400,H=4800,TAU=Math.PI*2;
const hypot=(x,y,a,b)=>Math.hypot(x-a,y-b);
export function createWorld(savedState) {
let seed=0x3512af91;
function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296}
const rand=(a,b)=>a+random()*(b-a),randInt=(a,b)=>Math.floor(rand(a,b+1));
function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296}
function seedChoice(arr){return arr[Math.floor(random()*arr.length)]}
const forest=[{x:850,y:1250,rx:890,ry:1090},{x:2410,y:540,rx:920,ry:680},{x:5200,y:620,rx:1110,ry:580},{x:400,y:3050,rx:550,ry:800},{x:5700,y:4170,rx:900,ry:700},{x:2460,y:2480,rx:620,ry:880},{x:3390,y:4300,rx:900,ry:560}];
const fields=[{x:650,y:3800,w:940,h:690},{x:1710,y:3470,w:980,h:750},{x:2700,y:3460,w:690,h:870},{x:4780,y:3530,w:800,h:540},{x:700,y:2470,w:540,h:450},{x:1630,y:2920,w:510,h:420}];
const lake={x:1850,y:1090,rx:480,ry:330};
const pond={x:5940,y:3700,rx:250,ry:160};
const river=[[1830,0],[1930,340],[1950,610],[2040,1020],[2070,1440],[2290,1830],[2500,2170],[2690,2630],[2860,3080],[3070,3600],[3260,4090],[3450,4800]];
const routes=[
 {w:100,p:[[0,3430],[800,3420],[1470,3390],[2050,3200],[2790,2950],[3270,2730],[4020,2470],[4730,2360],[6400,2140]]},
 {w:75,p:[[1180,4700],[1380,4050],[1470,3380],[1710,2780],[1580,2170],[1210,1660],[900,920],[600,0]]},
 {w:68,p:[[2000,3200],[2310,3510],[2900,4010],[3750,4540]]},
 {w:70,p:[[4680,2350],[5110,3050],[5570,3640],[6170,4220]]},
 {w:58,p:[[4290,1210],[4610,600],[5200,0]]},
 {w:45,p:[[900,2600],[1330,2360],[1780,2140],[2320,1880],[2860,1480]]},
];
const gx=[3140,3520,3900,4280,4660,5040,5420,5800],gy=[1110,1480,1850,2220,2590,2960,3330];
const locations=[
 {x:980,y:3650,name:'IL RIFUGIO ZERO',id:'shelter'},
 {x:1630,y:1190,name:'LAGO DELLE FELCI',id:'lake'},
 {x:850,y:920,name:'BOSCO DEI PINI',id:'forest'},
 {x:3660,y:2000,name:'CENTRO ABBANDONATO',id:'city'},
 {x:5200,y:2200,name:'COMMISSARIATO',id:'police'},
 {x:2220,y:3820,name:'CAMPI DI RUGGINE',id:'fields'},
 {x:4870,y:730,name:'STAZIONE RADIO',id:'radio'},
];
const notes=[
 {x:1240,y:3370,name:'Il distributore',text:'Una ricevuta dell’ultimo giorno.'},
 {x:740,y:1050,name:'La torre dei pini',text:'Il registro del guardaboschi.'},
 {x:3770,y:1630,name:'La scuola',text:'Un disegno infantile.'},
 {x:4900,y:2580,name:'Il quartiere muto',text:'Una foto senza data.'},
 {x:2260,y:3900,name:'Il frutteto',text:'Il quaderno delle semine.'},
 {x:4860,y:720,name:'L’antenna',text:'Una trasmissione incompleta.'},
 {x:5510,y:3020,name:'La tavola calda',text:'Il menù di ieri.'},
];
const world=[];const buildings=[],interactables=[],wildlife=[],ambient=[];let serial=0;
function addWorld(o){o.id=o.id||`o${serial++}`;o.depth=o.kind==='house'?o.y+o.h:o.y+(o.r||12);world.push(o);if(o.kind==='house')buildings.push(o);if(['house','car','tree','deadTree','bush','rock','crate','camp','plot','well','berry','bed','cattails'].includes(o.kind))interactables.push(o);return o;}
function segDist(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)}
function pathDist(x,y,p){let d=Infinity;for(let i=1;i<p.length;i++)d=Math.min(d,segDist(x,y,p[i-1],p[i]));return d;}
function roadDist(x,y){let d=Infinity;for(const r of routes)d=Math.min(d,pathDist(x,y,r.p)-r.w*.5);return d}
function cityRoadDist(x,y){if(x<2950||x>5990||y<970||y>3460)return Infinity;let d=Infinity;for(const x0 of gx)d=Math.min(d,Math.abs(x-x0)-44);for(const y0 of gy)d=Math.min(d,Math.abs(y-y0)-44);return d}
function woods(x,y){let v=-1;for(const f of forest){const t=((x-f.x)/f.rx)**2+((y-f.y)/f.ry)**2;v=Math.max(v,1-t)}return v}
function inCity(x,y){return x>3010&&x<5910&&y>970&&y<3440}
function inField(x,y){return fields.some(f=>x>f.x&&x<f.x+f.w&&y>f.y&&y<f.y+f.h)}
function inLake(x,y,shape){return((x-shape.x)/shape.rx)**2+((y-shape.y)/shape.ry)**2<.88}
function inWater(x,y){return inLake(x,y,lake)||inLake(x,y,pond)||(pathDist(x,y,river)<49 && roadDist(x,y)>34)}
function blocked(x,y,r=20){if(x<40||x>W-40||y<40||y>H-40||inWater(x,y))return true;
 if(roadDist(x,y)<r+9||cityRoadDist(x,y)<r+9)return true;
 for(const b of buildings){if(x>b.x-r&&x<b.x+b.w+r&&y>b.y-r&&y<b.y+b.h+r)return true}
 for(const o of interactables){if((o.kind==='tree'||o.kind==='car'||o.kind==='rock')&&hypot(x,y,o.x,o.y)<r+(o.r||24))return true}
 return false;
}
function house(x,y,w,h,kind='home',variant=0){const doorX=x+w*.5,doorY=y+h+3;return addWorld({kind:'house',x,y,w,h,doorX,doorY,category:kind,variant,r:24,shade:random()})}
// I bordi delle strade dividono isolati praticabili, ognuno con costruzioni diverse.
for(let col=0;col<gx.length-1;col++)for(let row=0;row<gy.length-1;row++){
 const bx=gx[col]+58,by=gy[row]+55,bw=gx[col+1]-gx[col]-115,bh=gy[row+1]-gy[row]-109;
 if((col===2&&row===2)||(col===5&&row===3)||(col===0&&row===4))continue;
 const kind=col===5&&row===2?'police':col===1&&row===2?'clinic':col===5&&row===4?'market':col===6&&row===1?'warehouse':random()<.18?'shop':'home';
 if(random()<.55&&kind==='home'){house(bx+4,by+4,bw*.50,bh*.74,kind,randInt(0,4));house(bx+bw*.57,by+13,bw*.37,bh*.64,'home',randInt(0,4));}
 else house(bx+rand(4,15),by+rand(5,18),bw-rand(25,48),bh-rand(36,70),kind,randInt(0,4));
}
for(const [x,y,w,h,kind]of [
 [1275,3520,175,143,'shelter'],[1420,2820,126,110,'home'],[820,3300,145,113,'shop'],[2300,3870,142,106,'barn'],[2520,3610,158,120,'barn'],[1770,3400,120,105,'home'],[4900,640,152,111,'radio'],[5200,790,130,93,'warehouse'],[1950,2070,128,105,'home'],[2450,2450,150,110,'home'],[500,2430,143,112,'home'],[5580,3890,146,111,'home'],[5900,4380,130,110,'home']])house(x,y,w,h,kind,randInt(0,4));
// Il rifugio iniziale ha risorse essenziali e possibilità di coltivare vicino alla casa.
addWorld({kind:'camp',x:990,y:3620,r:29,id:'camp-start'});
addWorld({kind:'well',x:1148,y:3600,r:22,id:'well-start'});
addWorld({kind:'bed',x:1384,y:3683,r:27,id:'bed-start'});
for(let i=0;i<7;i++)addWorld({kind:'plot',x:1540+i%4*67,y:3735+Math.floor(i/4)*67,r:23,id:`plot-start-${i}`});
for(let i=0;i<12;i++)addWorld({kind:'plot',x:1970+i%6*75,y:4050+Math.floor(i/6)*78,r:24,id:`plot-field-${i}`});
for(let i=0;i<8;i++)addWorld({kind:'plot',x:2820+i%4*75,y:3850+Math.floor(i/4)*78,r:24,id:`plot-west-${i}`});
for(const [x,y] of [[1530,1400],[2320,1570],[5930,3480]])addWorld({kind:'well',x,y,r:19});
for(const [x,y] of [[975,3800],[2420,3970],[4620,3600]])addWorld({kind:'camp',x,y,r:27});
for(let i=0;i<1100;i++){
 const f=seedChoice(forest),x=rand(f.x-f.rx,f.x+f.rx),y=rand(f.y-f.ry,f.y+f.ry),r=rand(18,37);
 if(x<35||x>W-35||y<35||y>H-35||woods(x,y)<rand(-.15,.38)||blocked(x,y,r+8))continue;
 addWorld({kind:random()<.14?'deadTree':'tree',x,y,r,shade:random(),rot:rand(0,TAU)});
}
for(let i=0;i<570;i++){
 const x=rand(30,W-30),y=rand(30,H-30),r=rand(8,20);
 if(blocked(x,y,r+4))continue;
 addWorld({kind:random()<.35?'rock':random()<.20?'berry':'bush',x,y,r,shade:random()});
}
// Scorte facili nei primi metri e vegetazione dedicata all'esplorazione iniziale.
for(const [kind,x,y]of [['berry',1010,3730],['berry',1170,3750],['rock',870,3610],['deadTree',850,3710],['bush',1080,3820],['crate',1220,3520]])addWorld({kind,x,y,r:20,shade:.5});
for(let i=0;i<90;i++){
 let x=0,y=0,tries=0;do{x=rand(80,W-80);y=rand(90,H-90);tries++}while(tries<45&&(Math.min(roadDist(x,y),cityRoadDist(x,y))>22||buildings.some(b=>x>b.x-45&&x<b.x+b.w+45&&y>b.y-45&&y<b.y+b.h+45)||hypot(x,y,DEFAULT_POSITION.x,DEFAULT_POSITION.y)<110));
 if(tries<45)addWorld({kind:'car',x,y,r:27,shade:random(),rot:randInt(0,3)*Math.PI/2+rand(-.14,.14)});
}
for(let i=0;i<150;i++){const x=rand(0,W),y=rand(0,H);if(blocked(x,y,18))continue;addWorld({kind:'debris',x,y,r:rand(3,11),shade:random()})}
for(let i=0;i<42;i++){
 const x=rand(60,W-60),y=rand(90,H-90);if(blocked(x,y,30)||inCity(x,y))continue;
 wildlife.push({id:`animal-${i}`,kind:i%7===0?'wolf':i%3===0?'deer':'rabbit',x,y,originX:x,originY:y,dir:rand(0,TAU),turn:rand(1,4),hp:i%7===0?90:i%3===0?60:30,agro:0,attackAt:0,deadAt:savedState.animals[`animal-${i}`]||0});
}
world.sort((a,b)=>a.depth-b.depth);
return {world,buildings,interactables,wildlife,ambient,random,rand,randInt,hash,forest,fields,lake,pond,river,routes,gx,gy,locations,notes,segDist,pathDist,roadDist,cityRoadDist,woods,inCity,inField,inLake,inWater,blocked};
}
