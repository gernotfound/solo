import {ITEMS} from './catalog.js';
import {quantity,addItem,removeItem} from './inventory.js';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../shared/world-limits.js';

export const MAX_GROUND_STACKS=1500;

// Una pila esiste sul terreno fino a quando viene raccolta o il giocatore azzera la partita.
// Le operazioni verificano tutti i vincoli prima di cambiare inventario o mondo.
export function dropToGround(state,itemId,position,amount=1){
 if(!ITEMS[itemId]||!Number.isInteger(amount)||amount<1||quantity(state,itemId)<amount)return false;
 if(!Number.isFinite(position?.x)||!Number.isFinite(position?.y)||position.x<0||position.x>WORLD_WIDTH||position.y<0||position.y>WORLD_HEIGHT)return false;
 const x=Math.round(position.x),y=Math.round(position.y);
 const condition=ITEMS[itemId].durability?Math.max(0,Math.min(ITEMS[itemId].durability,state.condition[itemId]??ITEMS[itemId].durability)):undefined;
 const stack=state.ground.find(o=>o.item===itemId&&o.condition===condition&&o.qty+amount<=9999&&Math.hypot(o.x-x,o.y-y)<36);
 if(!stack&&state.ground.length>=MAX_GROUND_STACKS)return false;
 if(!removeItem(state,itemId,amount))return false;
 if(stack){stack.qty+=amount;return true}
 const id='ground-'+state.nextGroundId++;
 state.ground.push({id,item:itemId,qty:amount,x,y,...(condition===undefined?{}:{condition})});
 return true;
}

export function pickupGroundItem(state,stackId){
 const idx=state.ground.findIndex(o=>o.id===stackId);
 if(idx<0)return false;
 const pile=state.ground[idx],previousQty=quantity(state,pile.item);
 if(!addItem(state,pile.item,1))return false;
 if(ITEMS[pile.item].durability&&Number.isFinite(pile.condition))
  state.condition[pile.item]=previousQty>0?Math.min(state.condition[pile.item]??ITEMS[pile.item].durability,pile.condition):pile.condition;
 if(--pile.qty===0)state.ground.splice(idx,1);
 return true;
}
