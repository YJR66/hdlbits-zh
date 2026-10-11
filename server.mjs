import http from 'node:http';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {checkSource,makeTestbench,references} from './judge.mjs';
import {resolveRuntime} from './runtime.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url)),DIST=path.join(ROOT,'dist');
const {compiler,runtime,compilerArgs,runtimeArgs,env}=resolveRuntime({root:ROOT});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
let busy=0;
const activeProcesses=new Set();
export function stopSimulations(){for(const child of activeProcesses)child.kill();}

export function runProcess(executable,args,cwd,timeout=6000){
 return new Promise(resolve=>{
  let output='',finished=false,timedOut=false,overflow=false;
  const child=spawn(executable,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  activeProcesses.add(child);
  const timer=setTimeout(()=>{timedOut=true;child.kill();},timeout);
  const finish=(code,error)=>{if(finished)return;finished=true;clearTimeout(timer);activeProcesses.delete(child);resolve({code,output,error,timedOut,overflow});};
  const capture=chunk=>{output+=chunk.toString();if(output.length>500000){output=output.slice(0,500000);overflow=true;child.kill();}};
  child.stdout.on('data',capture);child.stderr.on('data',capture);
  child.on('error',e=>finish(-1,e.code));child.on('close',code=>finish(code));
 });
}

export async function simulate({id,code,mode='judge'}){
 checkSource(code);
 const problems=JSON.parse(await fs.readFile(path.join(DIST,'problems.json'),'utf8'));
 const problem=problems.find(p=>p.id===id);
 if(mode!=='playground'&&!problem) throw new Error('题目不存在。');
 const tb=mode==='judge'?makeTestbench(problem):null;
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'hdlbits-'));
 try{
  await fs.writeFile(path.join(tmp,'submission.sv'),code+'\n`default_nettype wire\n','utf8');
  if(tb) await fs.writeFile(path.join(tmp,'bench.sv'),tb.source,'utf8');
  const args=[...compilerArgs,'-g2012','-Wall','-o','program.vvp'];
  if(tb) args.push('-s','__local_tb');
  else if(mode!=='playground') args.push('-s','top_module');
  args.push('submission.sv');if(tb)args.push('bench.sv');
  const compiled=await runProcess(compiler,args,tmp);
  if(compiled.error==='ENOENT') return {status:'unavailable',message:'未找到 Icarus Verilog。请按 README 安装运行时，或设置 IVERILOG_PATH 与 VVP_PATH。'};
  if(compiled.code!==0||compiled.timedOut) return {status:'compile_error',message:compiled.timedOut?'编译超过时间限制。':'编译未通过。',log:compiled.output||compiled.error};
  if(!tb&&mode!=='playground') return {status:'compiled',message:'语法与模块编译通过。',log:compiled.output};
  const executed=await runProcess(runtime,[...runtimeArgs,'-n','program.vvp'],tmp,5000);
  if(executed.timedOut||executed.overflow) return {status:'runtime_error',message:executed.timedOut?'仿真超时（5 秒）。检查无限循环，或添加 $finish。':'仿真输出超过限制。',log:executed.output.slice(0,8000)};
  if(executed.code!==0) return {status:'runtime_error',message:'仿真未正常结束。',log:executed.output||executed.error};
  if(tb){
   const rows=executed.output.split(/\r?\n/).filter(l=>l.startsWith('__ROW__|')).map(l=>l.split('|').slice(1));
   const last=executed.output.match(/__END__\|(\d+)/);
   const expectedRows=problem.ports.match(/\binput\s+clk\b/)?(tb.cycles-1)*2:tb.cycles;
   if(!last||rows.length!==expectedRows) return {status:'runtime_error',message:'仿真在所有测试完成前终止。请移除提交电路中的 $finish、$stop 或额外输出。',log:executed.output.slice(0,4000)};
   const failures=rows.filter(r=>r.at(-1)!=='0').length;
   const chosen=[...rows.filter(r=>r.at(-1)!=='0').slice(0,10),...rows.filter(r=>r.at(-1)==='0').slice(0,10)];
   return {status:failures?'incorrect':'passed',message:failures?`${rows.length} 次采样中有 ${failures} 次输出不一致。`:`通过 ${rows.length} 次采样测试。`,total:rows.length,failures,exhaustive:tb.exhaustive,columns:['采样',...tb.columns,'不一致'],rows:chosen,log:compiled.output};
  }
  let vcd='';const file=path.join(tmp,'trace.vcd');if(existsSync(file)){const stat=await fs.stat(file);if(stat.size<=2000000)vcd=await fs.readFile(file,'utf8');}
  return {status:'simulated',message:'仿真已结束。',log:executed.output,vcd};
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
}

const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
export async function getHealth(){
 const result=await runProcess(compiler,[...compilerArgs,'-V'],os.tmpdir(),2500);
 return {ok:true,compiler:result.code===0,engine:'Icarus Verilog',supported:Object.keys(references),storage:'browser-local'};
}
export function createServer(){
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   // Local-only server: reject foreign Host/Origin to avoid cross-site requests.
   if(!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'仅接受本机请求。'});
   const url=new URL(req.url,'http://'+req.headers.host);
   if(req.method==='GET'&&url.pathname==='/api/health'){
    return json(res,200,await getHealth());
   }
   if(req.method==='POST'&&url.pathname==='/api/run'){
    if(req.headers.origin&&req.headers.origin!==url.origin)return json(res,403,{error:'请求来源不匹配。'});
    if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'需要 JSON 请求。'});
    if(busy>=2)return json(res,429,{error:'已有仿真正在运行，请稍后重试。'});
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>150000){return json(res,413,{error:'请求过大。'});}}
    let input;try{input=JSON.parse(body);}catch{return json(res,400,{error:'JSON 格式错误。'});}
    busy++;try{return json(res,200,await simulate(input));}finally{busy--;}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'不支持此请求方法。'});
   const decoded=decodeURIComponent(url.pathname);
   const target=decoded==='/'||decoded.startsWith('/wiki/')||decoded==='/mw/index.php'?'index.html':decoded.replace(/^\//,'');
   const file=path.resolve(DIST,target);
   if(file!==DIST&&!file.startsWith(DIST+path.sep))return json(res,403,{error:'无效路径。'});
   try{const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);}
   catch{return json(res,404,{error:'文件不存在。'});}
  }catch(e){json(res,400,{error:e.message||'请求失败。'});}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT)||4173;
 const server=createServer();server.listen(port,'127.0.0.1',()=>console.log(`HDLBits 中文本地学习版\nLocal: http://127.0.0.1:${port}\n按 Ctrl+C 停止。`));
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已被使用。可设置 PORT 后重新启动。`:e.message);process.exitCode=1;});
}
