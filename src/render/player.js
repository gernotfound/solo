// Silhouette zenitale centrata sull'asse del movimento: nessuna posa dipende
// dall'orientamento assoluto e lo zaino rimane sotto le spalle.
export function drawPlayerSprite(ctx,state,{facing=0,moving=false,step=0}={}){
 const ell=(x,y,rx,ry,color,rot=0)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()};
 const rect=(x,y,w,h,r,color,stroke=null)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}};
 const equip=state.equipment||{},walking=moving?Math.sin(step*9)*3:0;
 const torso=equip.body==='jacket'?'#79624b':'#607c6d';
 ctx.save();ctx.translate(state.x,state.y);
 ell(2,10,26,15,'#1f332a66');
 ctx.rotate(facing);
 // Piedi e ombra sono simmetrici rispetto all'asse della figura.
 rect(-13,16+walking,10,24,4,equip.feet==='boots'?'#4b4239':'#877765','#273d34');
 rect(3,16-walking,10,24,4,equip.feet==='boots'?'#4b4239':'#877765','#273d34');
 rect(-15,9,30,15,5,'#475d4d');
 if(equip.back==='backpack'){
  rect(-22,-9,44,38,10,'#866e4e','#34463a');
  rect(-17,-5,34,29,8,'#9d8058','#443f32');
  rect(-3,13,6,8,2,'#ceb88d');
 }
 // Spalle e braccia aderiscono al busto in ogni direzione.
 rect(-23,-6,46,35,13,'#354e40','#20382f');
 rect(-18,-8,36,34,10,torso,'#283f34');
 const sleeve=equip.body==='jacket'?'#6d5848':'#577365';
 rect(-28,-3+walking*.2,12,26,6,sleeve,'#33483b');
 rect(16,-3-walking*.2,12,26,6,sleeve,'#33483b');
 ell(-21,20+walking*.2,5,6,'#d6ad86');
 ell(21,20-walking*.2,5,6,'#d6ad86');
 rect(-14,8,28,9,3,'#40594a');
 rect(-7,10,14,4,2,'#b3a37b');
 // Testa vista dall'alto: capelli/cappello, non un volto frontale ruotato.
 ell(0,-18,18,19,'#314b3d');
 ell(0,-21,15.5,16.5,'#d6a982');
 ell(0,-26,15.5,11,'#3d4636');
 ell(-8,-27,7,7,'#4c5740');
 ell(8,-27,7,7,'#4c5740');
 if(equip.head==='cap'){ell(0,-26,17,12,'#94754e');rect(-13,-36,26,8,4,'#6e593f');rect(-12,-40,24,6,3,'#a48856')}
 if(equip.hand){
  ctx.save();ctx.translate(26,16);
  if(['knife','spear','axe'].includes(equip.hand)){
   rect(-3,-8,6,24,2,'#735d40');
   if(equip.hand==='axe')rect(-10,-22,20,15,2,'#a3afb0','#415048');
   else if(equip.hand==='spear')rect(-2,-33,4,28,1,'#b8baa9');
   else rect(-3,-20,6,13,1,'#c5c9be');
  }else if(equip.hand==='pistol'){rect(-6,-20,12,25,2,'#343c3d','#a4a8a1');rect(-6,1,12,10,2,'#53473a')}
  else if(equip.hand==='torch'){rect(-5,-12,10,24,3,'#797d61');ell(0,-14,7,7,'#e8d6a0')}
  ctx.restore();
 }
 ctx.restore();
}
