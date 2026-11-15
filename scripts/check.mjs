import {readdir,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
async function walk(folder){const files=[];for(const d of await readdir(folder,{withFileTypes:true})){const p=resolve(folder,d.name);if(d.isDirectory())files.push(...await walk(p));else if(p.endsWith('.js')||p.endsWith('.mjs'))files.push(p)}return files}
const files=[...await walk(resolve(root,'src')),...await walk(resolve(root,'scripts')),...await walk(resolve(root,'tests'))];
for(const f of files){execFileSync(process.execPath,['--check',f]);const src=await readFile(f,'utf8');if(f.includes('/src/')&&src.includes('eval('))throw new Error('eval prohibited: '+f)}
console.log(`${files.length} source/script/test files: valid syntax`);
