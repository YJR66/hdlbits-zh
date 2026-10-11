import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {createServer} from '../server.mjs';
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const code=await fs.readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const skin=await fs.readFile(new URL('../dist/vendor/default.js',import.meta.url),'utf8');
const wave=await fs.readFile(new URL('../dist/vendor/wavedrom.min.js',import.meta.url),'utf8');
const problems=JSON.parse(await fs.readFile(new URL('../dist/problems.json',import.meta.url),'utf8'));

test('frontend routes, 182 editors, 52 waveforms, search and persistence',{timeout:120000},async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const errors=[];const vc=new VirtualConsole();vc.on('error',(...args)=>errors.push(args.join(' ')));vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:base+'/wiki/Main_Page',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.fetch=(url,opts)=>fetch(new URL(url,base),opts);w.AbortSignal=AbortSignal;w.structuredClone=structuredClone;w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};
 const route=id=>{w.history.pushState({},'',base+'/wiki/'+id);w.dispatchEvent(new w.PopStateEvent('popstate'));};
 const assertCleanCopy=()=>assert.doesNotMatch(w.document.body.textContent,/非官方|原站|官方镜像|隐藏测试|独立编写|实现范围|中文化|逐字译本|本机执行|本地测试|本地学习版/);
 try{
  w.eval(skin);w.eval(wave);await w.eval('(async()=>{'+code+'\n})()');
  assert.match(w.document.querySelector('h1').textContent,/Verilog 中文练习/);
  assertCleanCopy();
  for(const id of ['Problem_sets','Iverilog','Special:VlgStats/Me','Special:VlgProfile','Project:About','Help','missing-page']){route(id);assertCleanCopy();}
  route('Problem_sets');assert.equal(w.document.querySelectorAll('.catalog-list li').length,182);
  const search=w.document.querySelector('#catalog-search');search.value='移位';search.dispatchEvent(new w.Event('input'));
  assert.ok(w.document.querySelectorAll('.catalog-list li').length>5);assert.ok(w.document.querySelectorAll('.catalog-list li').length<182);
  search.value='no-such-exercise-xyz';search.dispatchEvent(new w.Event('input'));assert.match(w.document.querySelector('.empty').textContent,/没有匹配/);
  let renderedWaves=0;
  for(const p of problems){route(p.slug);assertCleanCopy();assert.match(w.document.querySelector('h1').textContent,new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.ok(w.document.querySelector('#code-editor'),p.id);assert.equal(w.document.querySelector('.source-link'),null,p.id);assert.equal(w.document.querySelector('.problem-copy')?.textContent,p.description,p.id);assert.ok(!w.document.querySelector('.problem-main').textContent.includes('中文题意摘要'),p.id);assert.ok(!w.document.querySelector('.problem-main').textContent.includes('查看英文原题'),p.id);assert.ok(w.document.querySelector('.port-box'),p.id);assert.equal(w.document.querySelectorAll('.diagram img').length,p.images.length,p.id);assert.ok(!w.document.querySelector('#main').textContent.includes('波形渲染失败'),p.id);renderedWaves+=w.document.querySelectorAll('.diagram svg').length;}
  assert.equal(renderedWaves,52);
  route('sim/circuit1');const tick=w.document.querySelectorAll('#gmarks_0 > g.muted text');assert.equal(tick[0].textContent,'5');assert.equal(tick[1].textContent,'10');
  route('wire');let editor=w.document.querySelector('#code-editor');editor.value='module top_module(input in, output out); assign out=in; endmodule';editor.dispatchEvent(new w.Event('input'));
  assert.match(JSON.parse(w.localStorage.getItem('hdlbits-zh-v1')).problems.wire.code,/assign out=in/);
  route('zero');route('wire');assert.match(w.document.querySelector('#code-editor').value,/assign out=in/);
  const resultPromise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('UI simulation timeout')),10000);const observer=new w.MutationObserver(()=>{if(w.document.querySelector('#run-result .success')){clearTimeout(timer);observer.disconnect();resolve();}});observer.observe(w.document.querySelector('#run-result'),{childList:true,subtree:true});});
  w.document.querySelector('#run-code').click();await resultPromise;
  assert.match(w.document.querySelector('#run-result').textContent,/测试通过/);
  assertCleanCopy();
  route('module');editor=w.document.querySelector('#code-editor');editor.value='module top_module(input a,b,output out); assign out=a&b; endmodule';
  const compileResult=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('UI compile timeout')),10000);const observer=new w.MutationObserver(()=>{if(w.document.querySelector('#run-result').textContent.includes('编译通过 · 未验证逻辑')){clearTimeout(timer);observer.disconnect();resolve();}});observer.observe(w.document.querySelector('#run-result'),{childList:true,subtree:true});});
  w.document.querySelector('#run-code').click();await compileResult;assertCleanCopy();assert.equal(w.document.querySelector('#run-result .success'),null);
  route('Special:VlgStats/Me');assert.equal(w.document.querySelectorAll('.stat-card strong')[1].textContent,'1');
  route('Special:VlgProfile');w.document.querySelector('#profile-name').value='<script>alert(1)</script>';w.document.querySelector('.profile-form').dispatchEvent(new w.Event('submit',{cancelable:true}));route('Special:VlgStats/Me');assert.equal(w.document.querySelectorAll('#main script').length,0);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
