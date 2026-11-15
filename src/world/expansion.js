// Gli ampliamenti sono indipendenti dalla sequenza RNG del mondo originale:
// coordinate e ID persistiti prima della versione 3 non devono cambiare.
export const MAP_WIDTH=22400,MAP_HEIGHT=16400;
export const REGIONS=Object.freeze([
 {id:'evacuazione',name:"IL CORRIDOIO DELL'ESODO",x:7800,y:2700,rx:2100,ry:2300,kind:'asphalt',story:"L'autostrada fu aperta soltanto in uscita. La fila di auto non arrivò mai al valico.",clue:"Cartelli di evacuazione, mezzi in panne e un posto di blocco vuoto.",landmark:'barricade'},
 {id:'porto',name:'IL PORTO DELLA NEBBIA',x:12000,y:1700,rx:2700,ry:2400,kind:'harbor',story:"Le navi partirono senza equipaggio. I registri della dogana hanno ancora le pagine strappate.",clue:'Banchine, magazzini e container tra canali salmastri.',landmark:'crane'},
 {id:'ospedale',name:'SANATORIO DEL VENTO',x:16100,y:1900,rx:2000,ry:2100,kind:'town',story:"L'ultima radio ospedaliera trasmetteva dati meteorologici invece dei nomi dei pazienti.",clue:'Ambulanze, cortili e una torre idrica.',landmark:'watertower'},
 {id:'industria',name:'LE FORNACI DI FERRO',x:19900,y:3200,rx:2500,ry:3100,kind:'industrial',story:"Le sirene dello stabilimento tacquero tre giorni dopo il blackout. I cancelli furono saldati dall'interno.",clue:'Ciminiere, fabbriche e piazzali disseminati di rottami.',landmark:'chimney'},
 {id:'altipiano',name:'ALTIPIANO DELLE ANTENNE',x:9100,y:7200,rx:3150,ry:2800,kind:'highland',story:"I ripetitori continuarono a lampeggiare anche quando non rimase nessuno ad ascoltare.",clue:'Tornanti, torri radio e punti panoramici sopra i boschi.',landmark:'mast'},
 {id:'palude',name:'LE SALINE DIMENTICATE',x:14000,y:6600,rx:2700,ry:2550,kind:'wetland',story:"L'acqua risalì nei campi da un giorno all'altro. Restano barche incagliate tra gli alberi.",clue:'Acquitrini, canneti e piattaforme abbandonate.',landmark:'boat'},
 {id:'quarantena',name:'PERIMETRO ROSSO',x:18800,y:7800,rx:3300,ry:3000,kind:'quarantine',story:"Nessun documento indica che l'ordine di isolamento sia mai stato revocato.",clue:'Recinzioni, checkpoint, container e rifugi isolati.',landmark:'watchtower'},
 {id:'frutteti',name:'I FRUTTETI DEL SUD',x:6700,y:12000,rx:3700,ry:3150,kind:'orchard',story:"Qualcuno aveva continuato a potare gli alberi molto dopo l'abbandono del paese.",clue:'Filari di frutteti, poderi e serre senza vetri.',landmark:'silo'},
 {id:'cava',name:'LA CAVA DELLE OMBRE',x:11500,y:12500,rx:3400,ry:3100,kind:'quarry',story:"L'ultima annotazione della miniera parla di un rumore sotto la roccia, non di un crollo.",clue:'Gradoni di pietra, mezzi da lavoro e baracche.',landmark:'derrick'},
 {id:'caserma',name:'LA CASERMA MUTA',x:16200,y:12700,rx:3400,ry:3000,kind:'barracks',story:"Gli alloggi erano pronti per il cambio turno. Nessuno è mai arrivato.",clue:'Hangar, magazzini, officine e recinti senza guardie.',landmark:'radar'},
 {id:'costa',name:'LA COSTA SPEZZATA',x:20600,y:14200,rx:2600,ry:2300,kind:'coast',story:"Al vecchio faro si accende ancora una luce quando arriva la tempesta, ma non c'è corrente.",clue:'Strade costiere, fari, villaggi di pescatori e spiagge vuote.',landmark:'lighthouse'}
]);
export const EXTRA_TOWNS=Object.freeze([
 {x:11100,y:980,w:1920,h:1440,step:310,kind:'harbor'},
 {x:17580,y:1630,w:2860,h:2060,step:380,kind:'industrial'},
 {x:15520,y:970,w:1230,h:1250,step:305,kind:'clinic'},
 {x:15250,y:11400,w:1740,h:1480,step:350,kind:'barracks'}
]);
export const EXTRA_WATERS=Object.freeze([
 {x:13380,y:5530,rx:740,ry:360},
 {x:14770,y:7260,rx:560,ry:510},
 {x:21070,y:14680,rx:550,ry:340},
 {x:8200,y:10600,rx:410,ry:270}
]);
const TRACKS=[
 [[5800,2140],[7050,2340],[8500,2620],[10300,2300],[12200,2300],[14600,2400],[16500,2650],[18400,3070],[21800,3600]],
 [[8300,2500],[8600,4480],[9700,6450],[11500,7900],[13200,9200],[15000,10700],[17300,12400],[21200,14100]],
 [[3000,4300],[3820,5650],[4920,7460],[6150,9140],[7540,10700],[8900,12300],[10700,14400],[12300,16250]],
 [[12400,2150],[13000,3900],[13700,6000],[15400,8000],[17900,8000],[21800,7700]],
 [[4950,4400],[6450,5200],[8200,6880],[10100,8610],[11300,10900],[11700,12600]],
 [[18000,3300],[18000,4800],[19100,6000],[18700,7850],[17000,9700],[16300,11600]],
 [[7500,11200],[9100,11280],[10900,11900],[13200,12700],[16300,13200],[18800,13900],[21900,15500]],
 [[15800,2400],[16100,3900],[15500,5200],[15100,6600]],
 [[10500,2700],[10900,4300],[10700,5800],[9500,7200]]
];
export const EXTRA_ROUTES=Object.freeze(TRACKS.map((p,i)=>({w:i<3?100:68,p})));
function seed32(seed){return function(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
export function regionAt(x,y){
 let found=null,best=Infinity;
 for(const r of REGIONS){const dx=(x-r.x)/r.rx,dy=(y-r.y)/r.ry,d=dx*dx+dy*dy;
  if(d<best){best=d;found=r}}
 return found;
}
export function buildExpansion({addWorld,blocked,forest,fields,routes,locations,notes,wildlife,savedState}) {
 const rand=seed32(0x5b1a773d);
 const between=(a,b)=>a+(b-a)*rand();
 const chance=p=>rand()<p;
 for(const r of EXTRA_ROUTES)routes.push({w:r.w,p:r.p.map(q=>[...q])});
 const forests=[
 [6800,6500,1400,1650],[9400,7800,1950,1600],[7400,13500,1750,1550],
 [10100,14700,1450,1300],[16700,5900,1000,790],[18500,10800,1200,1350],
 [21500,10300,1000,1450],[12000,9700,900,1100]
 ];
 for(const [x,y,rx,ry]of forests)forest.push({x,y,rx,ry});
 const farms=[[4900,9000,900,740],[5500,12100,1250,880],[7200,13700,1050,800],[9200,10300,620,720],[16400,14200,1050,550]];
 for(const [x,y,w,h]of farms)fields.push({x,y,w,h});
 for(const r of REGIONS){
  const px=r.x,py=r.y;
  locations.push({x:px,y:py,id:r.id,name:r.name,story:r.story,clue:r.clue});
  addWorld({kind:'landmark',style:r.landmark,id:'exp-mark-'+r.id,x:px,y:py,r:64,region:r.id,shade:.5});
  notes.push({x:px+135,y:py+108,name:r.name+' · testimonianza',text:r.story});
  notes.push({x:px-205,y:py+135,name:r.name+' · tracce',text:r.clue});
  const blockCount=['harbor','industrial','barracks','town'].includes(r.kind)?8:4;
  for(let i=0;i<blockCount;i++){
   const angle=(i/blockCount)*Math.PI*2+.22,rad=320+(i%3)*127;
   const x=Math.round(px+Math.cos(angle)*rad),y=Math.round(py+Math.sin(angle)*rad);
   const category=r.kind==='industrial'?'warehouse':r.kind==='harbor'?'shop':r.kind==='barracks'?'police':r.kind==='town'?'clinic':i%4===0?'barn':'home';
   const w=128+i%3*25,h=96+i%2*38;
   if(!blocked(x+w/2,y+h/2,40))addWorld({kind:'house',id:'exp-house-'+r.id+'-'+i,x,y,w,h,doorX:x+w/2,doorY:y+h+3,category,variant:i%5,shade:rand(),region:r.id});
  }
  // Ogni regione offre punti di riposo e scorte, non obiettivi o missioni.
  const spots=[['crate',220,-160],['camp',-160,-245],['well',280,235],['car',-320,100]];
  for(let k=0;k<spots.length;k++){
   const [kind,dx,dy]=spots[k],x=px+dx,y=py+dy;
   if(!blocked(x,y,26))addWorld({kind,id:'exp-'+r.id+'-'+kind,x,y,r:kind==='car'?27:23,rot:k,shade:rand(),region:r.id});
  }
 }
 // Piccoli centri urbani: strade a maglia locale, isolati e ingressi alle porte.
 for(let t=0;t<EXTRA_TOWNS.length;t++){
  const town=EXTRA_TOWNS[t];
  for(let col=0;col<Math.floor(town.w/town.step);col++)for(let row=0;row<Math.floor(town.h/town.step);row++){
   const x=town.x+col*town.step+96,y=town.y+row*town.step+98,w=town.step-156,h=town.step-160;
   if(w<70||h<70||blocked(x+w/2,y+h/2,22))continue;
   const category=town.kind==='harbor'?'warehouse':town.kind==='clinic'?'clinic':town.kind==='barracks'?'police':chance(.25)?'shop':'warehouse';
   addWorld({kind:'house',id:'exp-town-'+t+'-'+col+'-'+row,x,y,w,h,doorX:x+w/2,doorY:y+h+3,category,variant:(col+row)%5,shade:rand()});
  }
 }
 // Le lunghe arterie conservano la memoria dell'esodo: veicoli perquisibili
 // posizionati su tratte reali, con identificativi indipendenti dal resto della mappa.
 for(let ri=0;ri<EXTRA_ROUTES.length;ri++){
  const route=EXTRA_ROUTES[ri];
  for(let si=1;si<route.p.length;si++){
   const [ax,ay]=route.p[si-1],[bx,by]=route.p[si],len=Math.hypot(bx-ax,by-ay);
   const count=Math.floor(len/180);
   for(let i=1;i<count;i++){
    if(!chance(.35))continue;
    const fraction=i/count,x=ax+(bx-ax)*fraction+(chance(.5)?-1:1)*route.w*.18,
       y=ay+(by-ay)*fraction+(chance(.5)?-1:1)*route.w*.18;
    if(x<90||y<90||x>MAP_WIDTH-90||y>MAP_HEIGHT-90)continue;
    addWorld({kind:'car',id:'exp-roadcar-'+ri+'-'+si+'-'+i,x,y,r:27,shade:rand(),rot:Math.atan2(by-ay,bx-ax),region:regionAt(x,y).id});
   }
  }
 }
 // Oggetti per bioma: la loro identità non dipende dall'ordine degli altri oggetti.
 for(let i=0;i<2550;i++){
  const region=REGIONS[i%REGIONS.length],angle=between(0,Math.PI*2),rad=Math.sqrt(rand());
  const x=Math.round(region.x+Math.cos(angle)*rad*region.rx*.90),
        y=Math.round(region.y+Math.sin(angle)*rad*region.ry*.85);
  if(x<65||y<65||x>MAP_WIDTH-65||y>MAP_HEIGHT-65||blocked(x,y,32))continue;
  let kind;
  if(['highland','orchard'].includes(region.kind))kind=chance(.68)?'tree':chance(.24)?'deadTree':'bush';
  else if(['wetland','coast'].includes(region.kind))kind=chance(.46)?'bush':chance(.5)?'rock':'deadTree';
  else if(['industrial','quarantine','quarry'].includes(region.kind))kind=chance(.48)?'debris':chance(.54)?'rock':'deadTree';
  else kind=chance(.48)?'tree':chance(.42)?'bush':'rock';
  addWorld({kind,id:'exp-eco-'+i,x,y,r:kind==='tree'||kind==='deadTree'?between(17,33):between(8,21),shade:rand(),rot:between(0,Math.PI*2)});
 }
 // I nuovi animali si aggiungono ai vecchi senza rinumerare animal-0 ... animal-41.
 for(let i=0;i<85;i++){
  const region=REGIONS[i%REGIONS.length],a=between(0,Math.PI*2),k=between(.22,.85);
  const x=Math.max(65,Math.min(MAP_WIDTH-65,region.x+Math.cos(a)*k*region.rx));
  const y=Math.max(65,Math.min(MAP_HEIGHT-65,region.y+Math.sin(a)*k*region.ry));
  if(blocked(x,y,22))continue;
  const kind=i%11===0?'wolf':i%4===0?'deer':'rabbit',id='exp-animal-'+i;
  wildlife.push({id,kind,x,y,originX:x,originY:y,dir:between(0,Math.PI*2),turn:between(1,4),hp:kind==='wolf'?90:kind==='deer'?60:30,agro:0,attackAt:0,deadAt:savedState.animals[id]||0});
 }
}
