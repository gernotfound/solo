// Gli eventi UI e i salvataggi su interazione restano immediati.
// Qui si limita solo il lavoro ripetitivo non necessario a ogni frame.
export function createFrameScheduler({overlayIntervalMs=150,minimapIntervalMs=1100,autosaveIntervalMs=10000}={}){
 for(const n of [overlayIntervalMs,minimapIntervalMs,autosaveIntervalMs])if(!Number.isFinite(n)||n<=0)throw new RangeError('Invalid frame interval');
 let lastOverlay=-Infinity,lastMinimap=0,lastAutosave=0;
 return {
  shouldRender(t,overlayOpen){
   if(!overlayOpen)return true;
   if(t<lastOverlay||t-lastOverlay>=overlayIntervalMs){lastOverlay=t;return true}
   return false;
  },
  shouldDrawMinimap(t,overlayOpen){
   if(overlayOpen)return false;
   if(t<lastMinimap||t-lastMinimap>=minimapIntervalMs){lastMinimap=t;return true}
   return false;
  },
  shouldAutosave(t){
   if(t<lastAutosave||t-lastAutosave>=autosaveIntervalMs){lastAutosave=t;return true}
   return false;
  }
 };
}
