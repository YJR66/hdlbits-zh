import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {references,parsePorts,makeTestbench,checkSource} from '../judge.mjs';
import {simulate,createServer} from '../server.mjs';
const problems=JSON.parse(await fs.readFile(new URL('../dist/problems.json',import.meta.url)));

test('182 unique translated entries with valid local assets',async()=>{
 assert.equal(problems.length,182);assert.equal(new Set(problems.map(p=>p.id)).size,182);
 for(const p of problems){assert.match(p.title,/[\u4e00-\u9fff]/);assert.match(p.description,/[\u4e00-\u9fff]/);assert.match(p.ports,/module top_module/);for(const image of p.images)await fs.access(new URL('../dist'+image,import.meta.url));}
});
test('port parser preserves inherited direction and non-zero ranges',()=>{
 const parsed=parsePorts('module top_module(input [3:0] a,b, output reg [3:1] z);');
 assert.deepEqual(parsed.map(p=>[p.name,p.direction,p.width]),[['a','input',4],['b','input',4],['z','output',3]]);
});
test('safety and request bounds',()=>{assert.throws(()=>checkSource('`include "file"'));assert.throws(()=>checkSource('$system("abc");'));assert.throws(()=>checkSource('$dumpfile("other.vcd");'));assert.throws(()=>checkSource('$readmemh("x",y);'));assert.throws(()=>checkSource('a'.repeat(80001)));checkSource('$dumpfile("trace.vcd");');});
test('every local reference compiles and passes', {timeout:120000},async t=>{
 for(const [id,body]of Object.entries(references))await t.test(id,async()=>{const p=problems.find(p=>p.id===id);assert.ok(p);assert.ok(makeTestbench(p));const result=await simulate({id,code:p.ports+'\n'+body+'\nendmodule'});assert.equal(result.status,'passed',JSON.stringify(result));assert.ok(result.total>0);});
});
test('incorrect, syntax error, unsupported, and early termination are distinct',async()=>{
 assert.equal((await simulate({id:'step_one',code:'module top_module(output one); assign one=0; endmodule'})).status,'incorrect');
 assert.equal((await simulate({id:'wire',code:'module top_module(input in, output out); assign out=; endmodule'})).status,'compile_error');
 assert.equal((await simulate({id:'module',mode:'compile',code:'module top_module(input a,b,output out); assign out=a&b; endmodule'})).status,'compiled');
 assert.equal((await simulate({id:'wire',code:'module top_module(input in, output out); assign out=in; initial $finish; endmodule'})).status,'runtime_error');
});
test('playground produces actual VCD and logs',async()=>{
 const result=await simulate({mode:'playground',code:'`timescale 1ns/1ps\nmodule top_module; reg a=0; initial begin $dumpfile("trace.vcd"); $dumpvars(0,top_module); #5; a=1; #5; $display("REAL_SIMULATION"); $finish; end endmodule'});
 assert.equal(result.status,'simulated',JSON.stringify(result));assert.match(result.log,/REAL_SIMULATION/);assert.match(result.vcd,/\$var/);
});
test('HTTP routes, API, and missing assets',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{for(const url of ['/','/wiki/Main_Page','/wiki/Step_one','/wiki/sim/circuit1','/wiki/Special:VlgStats/Me','/style.css','/app.js','/problems.json'])assert.equal((await fetch(base+url)).status,200,url);assert.equal((await fetch(base+'/missing.png')).status,404);const h=await(await fetch(base+'/api/health')).json();assert.equal(h.compiler,true);assert.equal((await fetch(base+'/api/run',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'})).status,403);}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
