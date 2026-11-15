import {initialState,sanitizeState,clamp} from './state.js';

// La chiave SoLo è indipendente dagli altri progetti. La migrazione usa le vecchie
// chiavi solo in lettura: un errore di scrittura non deve distruggere il salvataggio originale.
export const SAVE_KEY='solo-save-v1';
export const LEGACY_KEYS=['ultimo-viandante-survival-v2','ultimo-viandante-save-v1'];

function parse(storage,key){try{const text=storage.getItem(key);return text?JSON.parse(text):null}catch{return null}}

export function loadState(storage){
 const current=parse(storage,SAVE_KEY);
 if(current?.version===2)return sanitizeState(current);
 const previous=parse(storage,LEGACY_KEYS[0]);
 if(previous?.version===2)return sanitizeState(previous);
 const early=parse(storage,LEGACY_KEYS[1]);
 if(early&&Number.isFinite(early.x)&&Number.isFinite(early.y)){
  const state=initialState();state.x=clamp(early.x,25,6375);state.y=clamp(early.y,25,4775);
  if(early.marker&&Number.isFinite(early.marker.x)&&Number.isFinite(early.marker.y))state.marker={x:clamp(early.marker.x,0,6400),y:clamp(early.marker.y,0,4800)};
  return state;
 }
 return initialState();
}

export function saveState(storage,state,now=Date.now()){
 try{const snapshot={...state,lastSave:now};storage.setItem(SAVE_KEY,JSON.stringify(snapshot));state.lastSave=now;return true}catch{return false}
}
export function resetState(storage){
 for(const key of [SAVE_KEY,...LEGACY_KEYS])storage.removeItem(key);
}
