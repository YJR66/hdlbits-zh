import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createProtocolHandler,isAppURL} from '../desktop/protocol.mjs';
import {simulate,getHealth} from '../server.mjs';
const dist=fileURLToPath(new URL('../dist',import.meta.url));
const handler=createProtocolHandler({dist,simulate,getHealth});
const request=(url,init)=>new Request('hdlbits://app'+url,init);

test('desktop protocol serves routes, assets and compiler without HTTP',async()=>{
 for(const p of ['/','/wiki/Main_Page','/wiki/Step_one','/wiki/sim/circuit1','/app.js','/style.css','/vendor/wavedrom.min.js','/assets/logo270.png']){
  const response=await handler(request(p));assert.equal(response.status,200,p);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'/);
 }
 const health=await(await handler(request('/api/health'))).json();assert.equal(health.compiler,true);assert.equal(health.supported.length,72);
 const r=await handler(request('/api/run',{method:'POST',headers:{'Content-Type':'application/json',Origin:'hdlbits://app'},body:JSON.stringify({id:'step_one',code:'module top_module(output one); assign one=1; endmodule'})}));
 assert.equal((await r.json()).status,'passed');
 assert.equal((await handler(request('/missing.png'))).status,404);
 assert.equal((await handler(request('/style.css',{method:'HEAD'}))).status,200);
});
test('desktop protocol denies foreign origins, traversal and invalid requests',async()=>{
 assert.equal(isAppURL('hdlbits://app/wiki/Main_Page'),true);
 for(const u of ['https://example.com','file:///c:/windows','hdlbits://user@app/','hdlbits://other/'])assert.equal(isAppURL(u),false,u);
 assert.equal((await handler(new Request('hdlbits://other/'))).status,403);
 assert.equal((await handler(request('/%2e%2e%5cserver.mjs'))).status,403);
 assert.equal((await handler(request('/api/run',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'}))).status,403);
 assert.equal((await handler({...request('/'),url:'hdlbits://app/',initiatorOrigin:'https://example.com'})).status,403);
 assert.equal((await handler(request('/api/run',{method:'POST',body:'{}'}))).status,415);
 assert.equal((await handler(request('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:'not json'}))).status,400);
 assert.equal((await handler(request('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(150001)}))).status,413);
});
