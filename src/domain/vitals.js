import {ITEMS} from './catalog.js';
import {clamp} from './state.js';
export function statEffects(s,dt,{night=0,nearFire=false,running=false}={}){
 // dt in secondi attivi; non consumare bisogni durante la sospensione del browser.
 s.hunger=clamp(s.hunger-dt*(running?.042:.022),0,100);s.thirst=clamp(s.thirst-dt*(running?.065:.035),0,100);
 const clothing=Object.values(s.equipment).reduce((v,id)=>v+(ITEMS[id]?.warmth||0),0);
 const cold=night*(nearFire?0:.10)*Math.max(.20,1-clothing/55);
 s.warmth=clamp(s.warmth+dt*(nearFire?.45:night<.25?.11:-cold),0,100);
 s.stamina=clamp(s.stamina+dt*(running?-9:(s.hunger<15||s.thirst<15?3.5:8)),0,100);
 if(s.hunger===0||s.thirst===0||s.warmth<12)s.health=clamp(s.health-dt*(.6*(s.hunger===0)+1*(s.thirst===0)+.35*(s.warmth<12)),0,100);
 else if(s.hunger>65&&s.thirst>55&&s.warmth>35)s.health=clamp(s.health+dt*.015,0,100);
}
