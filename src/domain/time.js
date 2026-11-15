import {clamp} from './state.js';
// Alba e tramonto approssimati per il luogo del gioco (Salerno, 40.7°N 14.8°E).
// L'orario viene sempre letto dal dispositivo dell'utente, incluso il cambio ora legale.
export function solarHours(date){const start=new Date(date.getFullYear(),0,0),day=Math.floor((date-start)/86400000);const gamma=2*Math.PI/365*(day-1);
 const eot=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
 const decl=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
 const lat=40.7*Math.PI/180,ha=Math.acos(clamp(Math.cos(90.833*Math.PI/180)/(Math.cos(lat)*Math.cos(decl))-Math.tan(lat)*Math.tan(decl),-1,1));
 const noon=(720-4*14.8-eot-date.getTimezoneOffset())/60;return {sunrise:noon-ha*12/Math.PI,sunset:noon+ha*12/Math.PI};
}
export function daylight(date){const {sunrise,sunset}=solarHours(date);const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
 const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};return clamp(smooth((hour-(sunrise-.55))/1.1)*(1-smooth((hour-(sunset-.55))/1.1)),0,1);
}
export function timeText(date){return date.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',hour12:false});}
