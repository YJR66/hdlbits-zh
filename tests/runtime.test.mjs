import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveRuntime} from '../runtime.mjs';

test('Linux bundled runtime uses native binaries, IVL modules and private libraries',()=>{
 const r=resolveRuntime({root:'/opt/练习',platform:'linux',environ:{PATH:'/usr/bin',LD_LIBRARY_PATH:'/custom'},exists:()=>true});
 assert.equal(r.compiler,'/opt/练习/.tools/linux/runtime/bin/iverilog');
 assert.equal(r.runtime,'/opt/练习/.tools/linux/runtime/bin/vvp');
 assert.deepEqual(r.compilerArgs,['-B','/opt/练习/.tools/linux/runtime/lib/ivl']);
 assert.deepEqual(r.runtimeArgs,['-M','/opt/练习/.tools/linux/runtime/lib/ivl']);
 assert.equal(r.env.LD_LIBRARY_PATH,'/opt/练习/.tools/linux/runtime/lib/native:/custom');
 assert.equal(r.env.PATH,'/opt/练习/.tools/linux/runtime/bin:/usr/bin');
});
test('Windows portable runtime keeps exe paths and Windows PATH delimiter',()=>{
 const r=resolveRuntime({root:'C:\\学习',platform:'win32',environ:{PATH:'C:\\Windows'},exists:()=>true});
 assert.equal(r.compiler,'C:\\学习\\.tools\\ucrt64\\bin\\iverilog.exe');
 assert.equal(r.env.PATH,'C:\\学习\\.tools\\ucrt64\\bin;C:\\Windows');
 assert.equal(r.env.LD_LIBRARY_PATH,undefined);
});
test('system compiler fallback does not inject a missing bundle into PATH',()=>{
 const r=resolveRuntime({root:'/src',platform:'linux',environ:{PATH:'/usr/bin'},exists:()=>false});
 assert.equal(r.bundled,false);assert.equal(r.compiler,'iverilog');assert.equal(r.runtime,'vvp');
 assert.deepEqual(r.compilerArgs,[]);assert.deepEqual(r.runtimeArgs,[]);assert.equal(r.env.PATH,'/usr/bin');
});
test('explicit native tool overrides are not passed bundled IVL directories',()=>{
 const r=resolveRuntime({root:'/src',platform:'linux',environ:{HDLBITS_RUNTIME_ROOT:'/app/runtime',IVERILOG_PATH:'/custom/ivl',VVP_PATH:'/custom/vvp'},exists:()=>true});
 assert.equal(r.runtimeRoot,'/app/runtime');assert.equal(r.compiler,'/custom/ivl');assert.equal(r.runtime,'/custom/vvp');
 assert.deepEqual(r.compilerArgs,[]);assert.deepEqual(r.runtimeArgs,[]);
});
test('partial bundles fall back to system tools as a pair',()=>{
 const r=resolveRuntime({root:'/src',platform:'linux',environ:{},exists:p=>p.endsWith('/iverilog')});
 assert.equal(r.bundled,false);assert.equal(r.compiler,'iverilog');assert.equal(r.runtime,'vvp');
});
