import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await fs.mkdir(path.join(root,'dist/vendor'),{recursive:true});
for(const [from,to]of [['wavedrom.min.js','wavedrom.min.js'],['skins/default.js','default.js'],['LICENSE','wavedrom-LICENSE.txt']])await fs.copyFile(path.join(root,'node_modules/wavedrom',from),path.join(root,'dist/vendor',to));
console.log('WaveDrom vendor assets copied.');
