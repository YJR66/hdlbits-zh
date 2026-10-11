import fs from 'node:fs/promises';
import path from 'node:path';

export const APP_ORIGIN='hdlbits://app';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const headers={
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'"
};
const json=(status,value)=>new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
export function isAppURL(value){try{const u=new URL(value);return u.protocol==='hdlbits:'&&u.host==='app'&&!u.username&&!u.password;}catch{return false;}}

/** Serve bundled content and simulation directly, without opening a TCP port. */
export function createProtocolHandler({dist,simulate,getHealth}){
 let busy=0;
 return async request=>{
  try{
   if(!isAppURL(request.url))return json(403,{error:'无效地址。'});
   if(request.initiatorOrigin&&request.initiatorOrigin!==APP_ORIGIN)return json(403,{error:'请求来源不匹配。'});
   const u=new URL(request.url);
   if(request.method==='GET'&&u.pathname==='/api/health')return json(200,await getHealth());
   if(request.method==='POST'&&u.pathname==='/api/run'){
    const origin=request.headers.get('origin');
    if(origin&&origin!==APP_ORIGIN)return json(403,{error:'请求来源不匹配。'});
    if(!request.headers.get('content-type')?.startsWith('application/json'))return json(415,{error:'需要 JSON 请求。'});
    if(busy>=2)return json(429,{error:'已有仿真正在运行，请稍后重试。'});
    if(Number(request.headers.get('content-length'))>150000)return json(413,{error:'请求过大。'});
    const text=await request.text();if(Buffer.byteLength(text)>150000)return json(413,{error:'请求过大。'});
    let input;try{input=JSON.parse(text);}catch{return json(400,{error:'JSON 格式错误。'});}
    if(busy>=2)return json(429,{error:'已有仿真正在运行，请稍后重试。'});
    busy++;try{return json(200,await simulate(input));}finally{busy--;}
   }
   if(request.method!=='GET'&&request.method!=='HEAD')return json(405,{error:'不支持此请求方法。'});
   const decoded=decodeURIComponent(u.pathname);
   if(decoded.includes('\\')||decoded.split('/').includes('..'))return json(403,{error:'无效路径。'});
   const target=decoded==='/'||decoded.startsWith('/wiki/')||decoded==='/mw/index.php'?'index.html':decoded.replace(/^\//,'');
   const file=path.resolve(dist,target),relative=path.relative(dist,file);
   if(!relative||relative.startsWith('..')||path.isAbsolute(relative))return json(403,{error:'无效路径。'});
   try{
    const data=await fs.readFile(file);
    return new Response(request.method==='HEAD'?null:data,{headers:{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream'}});
   }catch{return json(404,{error:'文件不存在。'});}
  }catch(error){return json(400,{error:error.message||'请求失败。'});}
 };
}
