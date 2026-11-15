import {ITEMS,SLOTS,DEFAULT_POSITION} from './catalog.js';
export function initialState(){return {version:2,x:DEFAULT_POSITION.x,y:DEFAULT_POSITION.y,face:0,health:100,hunger:84,thirst:78,stamina:100,warmth:100,days:0,kills:0,inventory:{wood:3,stone:2,berry:4,water:3,can:1,seed:4,shirt:1,pants:1,boots:1,knife:1,bandage:2},equipment:{head:null,body:'shirt',legs:'pants',feet:'boots',back:null,hand:'knife'},condition:{knife:65},looted:{},harvested:{},plots:{},fires:{},animals:{},marker:null,found:[],deathCount:0,lastSave:Date.now()};}
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function sanitizeState(raw){const base=initialState();if(!raw||typeof raw!=='object'||raw.version!==2)return base;
 for(const k of ['x','y','health','hunger','thirst','stamina','warmth','kills','deathCount','days','face','lastSave'])if(Number.isFinite(raw[k]))base[k]=raw[k];
 base.lastSave=Math.max(0,base.lastSave);
 base.x=clamp(base.x,25,6375);base.y=clamp(base.y,25,4775);
 for(const k of ['health','hunger','thirst','stamina','warmth'])base[k]=clamp(base[k],0,100);
 for(const k of ['inventory','condition','looted','harvested','plots','fires','animals']){
  if(raw[k]&&typeof raw[k]==='object'&&!Array.isArray(raw[k]))base[k]={...raw[k]};
 }
 base.inventory=Object.fromEntries(Object.entries(base.inventory).filter(([k,v])=>ITEMS[k]&&Number.isInteger(v)&&v>0&&v<10000));
 base.equipment={...base.equipment};for(const slot of SLOTS){const item=raw.equipment?.[slot];base.equipment[slot]=typeof item==='string'&&ITEMS[item]?.slot===slot&&base.inventory[item]>0?item:null;}
 base.condition=Object.fromEntries(Object.entries(base.condition).filter(([k,v])=>ITEMS[k]?.durability&&Number.isFinite(v)&&v>=0));
 base.found=Array.isArray(raw.found)?[...new Set(raw.found.filter(n=>Number.isInteger(n)&&n>=0&&n<7))]:[];
 if(raw.marker&&Number.isFinite(raw.marker.x)&&Number.isFinite(raw.marker.y))base.marker={x:clamp(raw.marker.x,0,6400),y:clamp(raw.marker.y,0,4800)};
 return base;
}
