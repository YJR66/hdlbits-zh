import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {resolveRuntime} from '../runtime.mjs';

/** CLI diagnostic runs the packaged backend without touching the user's data. */
export async function smokeTest({handler,root,resourcesPath,isPackaged,exe,versions}){
 const checks=[];
 const get=async url=>handler(new Request('hdlbits://app'+url));
 const run=async data=>(await handler(new Request('hdlbits://app/api/run',{method:'POST',headers:{'Content-Type':'application/json',Origin:'hdlbits://app'},body:JSON.stringify(data)}))).json();
 try{
  const tools=resolveRuntime({root});
  assert.equal(tools.bundled,true,'Packaged compiler must not fall back to system Icarus');
  if(isPackaged)assert.equal(tools.runtimeRoot,path.join(resourcesPath,'runtime'));
  const health=await(await get('/api/health')).json();assert.equal(health.compiler,true);checks.push('bundled-compiler');
  for(const url of ['/wiki/Main_Page','/wiki/Step_one','/app.js','/vendor/wavedrom.min.js','/style.css'])assert.equal((await get(url)).status,200);
  const problems=await(await get('/problems.json')).json();assert.equal(problems.length,182);
  for(const p of problems)for(const image of p.images)assert.equal((await get(image)).status,200,image);
  checks.push('182-problems-and-assets');
  assert.equal((await run({id:'step_one',code:'module top_module(output one); assign one=1; endmodule'})).status,'passed');checks.push('correct-answer-passes');
  assert.equal((await run({id:'step_one',code:'module top_module(output one); assign one=0; endmodule'})).status,'incorrect');checks.push('wrong-answer-fails');
  assert.equal((await run({id:'step_one',code:'module top_module(output one); assign one=; endmodule'})).status,'compile_error');checks.push('syntax-error-reported');
  const simulation=await run({mode:'playground',code:'`timescale 1ns/1ps\nmodule top_module; reg a=0; initial begin $dumpfile("trace.vcd"); $dumpvars(0,top_module); #5; a=1; #5; $display("PACKAGED_SIMULATION"); $finish; end endmodule'});
  assert.equal(simulation.status,'simulated');assert.match(simulation.vcd,/\$var/);checks.push('waveform-and-simulation');
  const manifest=JSON.parse(await fs.readFile(path.join(resourcesPath,'runtime-manifest.json'),'utf8'));assert.ok(manifest.length);checks.push('runtime-licenses-and-manifest');
  return {ok:true,isPackaged,exe,root,resourcesPath,versions,checks};
 }catch(error){return {ok:false,isPackaged,exe,checks,error:error.stack};}
}
