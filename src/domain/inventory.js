import {ITEMS,SLOTS} from './catalog.js';
import {clamp} from './state.js';
export function quantity(s,id){return s.inventory[id]||0;}
export function carryCapacity(s){return 17+(s.equipment.back==='backpack'?ITEMS.backpack.capacity:0);}
export function carriedWeight(s){return Object.entries(s.inventory).reduce((sum,[key,n])=>sum+(ITEMS[key]?.weight||0)*n,0);}
export function canCarry(s,id,n=1){return !!ITEMS[id]&&n>0&&carriedWeight(s)+ITEMS[id].weight*n<=carryCapacity(s)+1e-6;}
export function addItem(s,id,n=1){if(!ITEMS[id]||!Number.isInteger(n)||n<=0||!canCarry(s,id,n))return false;s.inventory[id]=quantity(s,id)+n;return true;}
export function removeItem(s,id,n=1){if(!ITEMS[id]||!Number.isInteger(n)||n<=0||quantity(s,id)<n)return false;const left=quantity(s,id)-n;if(left)s.inventory[id]=left;else{delete s.inventory[id];for(const slot of SLOTS)if(s.equipment[slot]===id)s.equipment[slot]=null;}return true;}
export function canCraft(s,recipe,station=null){return Object.entries(recipe.need).every(([id,n])=>quantity(s,id)>=n)&&(!recipe.station||recipe.station===station)&&canCarryAfter(s,recipe);}
export function canCarryAfter(s,recipe){const freed=Object.entries(recipe.need).reduce((n,[id,q])=>n+ITEMS[id].weight*q,0);return carriedWeight(s)-freed+ITEMS[recipe.output].weight*recipe.qty<=carryCapacity(s)+1e-6;}
export function craft(s,recipe,station=null){if(!canCraft(s,recipe,station))return false;for(const [id,n]of Object.entries(recipe.need))removeItem(s,id,n);s.inventory[recipe.output]=quantity(s,recipe.output)+recipe.qty;if(ITEMS[recipe.output].durability)s.condition[recipe.output]=ITEMS[recipe.output].durability;return true;}
export function equip(s,id){const item=ITEMS[id];if(!item?.slot||quantity(s,id)<1)return false;if(s.equipment[item.slot]===id){s.equipment[item.slot]=null;return true;}s.equipment[item.slot]=id;return true;}
export function consume(s,id){const d=ITEMS[id];if(!d||quantity(s,id)<1||(!('food'in d)&&!('water'in d)&&!('health'in d)))return false;
 if((d.food||0)>0&&s.hunger>=99&&(d.water||0)<=0&&(d.health||0)<=0)return false;
 if((d.water||0)>0&&s.thirst>=99&&(d.food||0)<=0&&(d.health||0)<=0)return false;
 if((d.health||0)>0&&s.health>=99&&(d.food||0)<=0&&(d.water||0)<=0)return false;
 removeItem(s,id);s.hunger=clamp(s.hunger+(d.food||0),0,100);s.thirst=clamp(s.thirst+(d.water||0),0,100);s.health=clamp(s.health+(d.health||0),0,100);return true;
}
