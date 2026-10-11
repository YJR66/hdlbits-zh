import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const data=JSON.parse(await fs.readFile(path.join(root,'dist/problems.json'),'utf8'));
const entries=new Set();let images=0,waves=0;
for(const p of data){if(entries.has(p.id)||!p.title||!p.description||!p.ports)throw Error('Invalid record '+p.id);entries.add(p.id);for(const src of p.images){await fs.access(path.join(root,'dist',src));images++;}waves+=p.waves.length;}
for(const file of ['index.html','style.css','app.js','vendor/default.js','vendor/wavedrom.min.js'])await fs.access(path.join(root,'dist',file));
console.log(JSON.stringify({pages:data.length,imageReferences:images,waveforms:waves,valid:true}));
