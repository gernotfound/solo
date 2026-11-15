import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';

const root=resolve(import.meta.dirname,'..'),sourceRoot=resolve(root,'src');
async function walk(folder){const files=[];for(const ent of await readdir(folder,{withFileTypes:true})){const p=resolve(folder,ent.name);if(ent.isDirectory())files.push(...await walk(p));else if(ent.name.endsWith('.js'))files.push(p)}return files.sort()}
const paths=await walk(sourceRoot);
const imports={};
for(const file of paths){
 let source=await readFile(file,'utf8');
 source=source.replace(/\b(from\s*|import\s*)(['"])(\.{1,2}\/[^'"\n]+)\2/g,(full,prefix,quote,path)=>{
  const target=resolve(dirname(file),path);
  if(!paths.includes(target))throw new Error(`Import mancante o fuori da src: ${file} → ${path}`);
  return `${prefix}${quote}solo/${relative(sourceRoot,target).replaceAll('\\','/')}${quote}`;
 });
 imports[`solo/${relative(sourceRoot,file).replaceAll('\\','/')}`]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
}
const html=await readFile(resolve(root,'index.html'),'utf8'),css=await readFile(resolve(root,'style.css'),'utf8');
const built=html.replace('<link rel="stylesheet" href="/style.css">',`<style>${css}</style>`).replace('</head>',`<script type="importmap">${JSON.stringify({imports})}</script>\n</head>`).replace('<script type="module" src="/src/app/game.js"></script>',`<script type="module">import 'solo/app/game.js';</script>`);
if(built===html||built.includes('/src/app/game.js'))throw new Error('Build HTML incompleta');
await mkdir(resolve(root,'dist'),{recursive:true});await writeFile(resolve(root,'dist/index.html'),built);
console.log(`SoLo build: ${paths.length} ESM modules, ${(Buffer.byteLength(built)/1024).toFixed(1)} KiB, dist/index.html`);
