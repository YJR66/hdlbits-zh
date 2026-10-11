const $=(s,root=document)=>root.querySelector(s);
const main=$('#main');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=id=>'/wiki/'+id.split('/').map(encodeURIComponent).join('/');
const KEY='hdlbits-zh-v1';
let problems=[],byId=new Map(),health={supported:[],compiler:false},routeVersion=0;
let state={version:1,profile:{name:'学习者'},problems:{},playground:''};
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===1&&saved.profile&&saved.problems)state=saved;}catch{}
const record=id=>state.problems[id]||{};
const status=id=>record(id).passed?'solved':record(id).reviewed?'reviewed':record(id).code?'attempted':'';
const statusText=id=>({solved:'测试通过',reviewed:'已自行复习',attempted:'有草稿','':'未开始'}[status(id)]);
const dot=id=>`<span class="status-dot ${status(id)}" title="${statusText(id)}" aria-label="${statusText(id)}"></span>`;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{toast('浏览器存储空间不足，请先导出备份。');return false;}}
function update(id,values){state.problems[id]={...record(id),...values,updated:new Date().toISOString()};return save();}
let toastTimer;function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);}
function confirmAction(message){return new Promise(resolve=>{const d=$('#confirm-dialog');$('#confirm-message').textContent=message;d.showModal();const finish=value=>{d.close();resolve(value);};$('#accept-dialog').onclick=()=>finish(true);$('#cancel-dialog').onclick=()=>finish(false);d.oncancel=()=>resolve(false);});}
function download(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
const canonical=s=>decodeURIComponent(s).replace(/^\/wiki\//,'').replace(/ /g,'_').toLowerCase();
const sections=[
 ['Getting_Started','开始使用','Logo_hdlbits.png','从第一个常量输出开始，熟悉 Verilog 编写、编译与验证流程。'],
 ['Verilog_Language','Verilog 语言','Logo_v.png','导线与向量、模块层次、过程语句和更多语言特性。'],
 ['Combinational_Logic','组合逻辑','Logo_comb.png','从逻辑门到多路选择器、加法器与卡诺图。'],
 ['Sequential_Logic','时序逻辑','Logo_seq.png','触发器、计数器、移位寄存器和有限状态机。'],
 ['Verification:_Reading_Simulations','阅读仿真波形','Logo_sim.png','找出代码中的错误，从输入输出波形还原电路。'],
 ['Verification:_Writing_Testbenches','编写测试平台','Logo_tb.png','生成时钟与输入激励，为电路编写自己的测试。']
];
const template=p=>p.ports+'\n\n    // 在这里编写你的电路逻辑\n\nendmodule\n';
const home=()=>`<article class="home"><h1>HDLBits — Verilog 中文练习</h1><div class="home-intro"><p>通过一系列小型电路设计练习，学习使用 Verilog 硬件描述语言。先掌握基本语法，再逐步练习组合逻辑、时序逻辑与数字系统设计。</p><p>在题目页面阅读题目说明、查看电路图与模块声明，并直接编写代码。</p><h3>如何使用 HDLBits</h3><ol><li>选择题目：<strong><a href="/wiki/Problem_sets">浏览题目集</a></strong>，或<strong><a href="/wiki/Step_one">从第一题开始</a></strong>。</li><li>根据题意编写 Verilog 模块，保留指定的模块名和端口。</li><li>运行测试，阅读诊断信息，再修改、验证。</li></ol><p>代码草稿会自动保存在当前浏览器中。你可以<a href="/wiki/Special:VlgStats/Me"><strong>查看学习进度</strong></a>，或在<a href="/wiki/Special:VlgProfile"><strong>资料与备份</strong></a>中导出数据，迁移到其他浏览器。</p><h3>应该从哪些练习开始？</h3><p>建议先完成“开始使用”，再交替学习语言与电路设计。语法练习帮助表达电路，电路练习帮助理解硬件；无需拘泥于目录顺序，可从每个主题的基础题逐步深入。</p></div><h2>练习主题</h2><div class="section-panels">${sections.map(([anchor,title,img,text])=>`<a class="topic-panel" href="/wiki/Problem_sets#${anchor}"><div class="head"><img src="/assets/${img}" alt="">${title}</div><p>${text}</p></a>`).join('')}</div><h2>运行仿真</h2><p>在<a href="/wiki/Iverilog">Verilog 仿真实验台</a>中编写电路与测试平台，查看实际仿真日志和波形。</p></article>`;

function filtered(query='',filter='all'){
 const tokens=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return problems.filter(p=>tokens.every(t=>(p.id+' '+p.title+' '+p.titleEn+' '+p.path.join(' ')+' '+p.description).toLowerCase().includes(t))&&(filter==='all'||filter==='supported'&&health.supported.includes(p.id)||filter==='unstarted'&&!status(p.id)||filter==='attempted'&&status(p.id)==='attempted'||filter==='solved'&&status(p.id)==='solved'||filter==='reviewed'&&status(p.id)==='reviewed'));
}
function catalogContent(list){
 if(!list.length)return '<div class="empty">没有匹配的题目。试试中文主题、英文名称或题目编号。</div>';
 let html='',prev=[];
 for(const p of list){
  let same=0;while(same<p.path.length&&prev[same]===p.path[same])same++;
  if(same<p.path.length){if(prev.length)html+='</ul>';for(let i=same;i<p.path.length;i++){const level=Math.min(4,2+i);const anchor=p.pathEn[i].replaceAll(' ','_');html+=`<h${level} class="catalog-section" id="${esc(anchor)}">${esc(p.path[i])}</h${level}>`;}html+='<ul class="catalog-list">';}
  html+=`<li>${dot(p.id)}<a href="${href(p.slug)}">${esc(p.title)}</a><small title="题目编号">${String(p.order).padStart(3,'0')}</small></li>`;prev=p.path;
 }return html+'</ul>';
}
function catalog(query=''){
 main.innerHTML=`<h1>${query?'搜索结果':'题目集'}<span class="tag">182 道练习</span></h1><div class="catalog-layout"><aside class="toc"><h3>目录</h3><ul>${sections.map(([anchor,title])=>`<li><a href="/wiki/Problem_sets#${anchor}">${title}</a></li>`).join('')}<li><a href="/wiki/Problem_sets#Building_Larger_Circuits">构建大型电路</a></li><li><a href="/wiki/Problem_sets#CS450">CS450 扩展练习</a></li></ul><hr><small>○ 未开始<br><span style="color:#c99b3d">●</span> 有草稿<br><span style="color:#398c44">●</span> 测试通过<br><span style="color:#427fa8">●</span> 自行复习</small></aside><section><div class="catalog-tools"><input id="catalog-search" type="search" placeholder="搜索中文、英文或题目编号…" aria-label="搜索题目" value="${esc(query)}"><select id="catalog-filter" aria-label="筛选学习状态"><option value="all">所有题目</option><option value="unstarted">未开始</option><option value="attempted">有草稿</option><option value="solved">测试通过</option><option value="reviewed">已自行复习</option><option value="supported">支持测试</option></select></div><p class="muted" id="result-count"></p><div id="catalog-results"></div></section></div>`;
 const refresh=()=>{const list=filtered($('#catalog-search').value,$('#catalog-filter').value);$('#catalog-results').innerHTML=catalogContent(list);$('#result-count').textContent=`共 ${list.length} 道题`;};
 $('#catalog-search').oninput=refresh;$('#catalog-filter').onchange=refresh;refresh();
}
function navProblem(p){const i=p.order-1;return `<a href="${i?href(problems[i-1].slug):'/wiki/Problem_sets'}">← ${i?esc(problems[i-1].title):'题目目录'}</a><a href="${i<problems.length-1?href(problems[i+1].slug):'/wiki/Problem_sets'}">${i<problems.length-1?esc(problems[i+1].title):'题目目录'} →</a>`;}
function sidebar(current){
 const groups=new Map();for(const p of problems){const key=p.path.at(-1);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 return `<aside class="problem-sidebar" aria-label="题库导航"><a href="/wiki/Problem_sets"><strong>全部题目</strong></a>${[...groups].map(([name,list])=>`<details ${list.some(p=>p.id===current)?'open':''}><summary>${esc(name)} <small>${list.length}</small></summary>${list.map(p=>`<a class="${p.id===current?'current':''}" href="${href(p.slug)}" ${p.id===current?'aria-current="page"':''}>${dot(p.id)}${esc(p.title)}</a>`).join('')}</details>`).join('')}</aside>`;
}
const hints={
 '基础语法':'从每一个输出出发，确定它由哪些输入驱动。区分连接、按位逻辑运算与常量。',
 '向量':'先计算输入和输出的总位宽，再检查下标方向、拼接顺序以及符号扩展。',
 '模块与层次结构':'画出实例之间的连线，逐个核对端口名称、方向和位宽。',
 '过程语句':'组合块中为所有输出覆盖所有分支；时钟块使用非阻塞赋值。reg 并不必然意味着硬件寄存器。',
 '有限状态机':'先确定状态及复位状态，分别写出次态、状态寄存器和输出。检查输入同时有效时的优先级。',
 '计数器':'明确起点、终点、复位值以及使能优先级，再检查回绕边界。',
 '移位寄存器':'检查移位方向、移入位、装载优先级，以及未使能时是否保持。'
};
function editorMarkup(id,code,playground=false){return `<section class="hb-box editor-box"><h3>${playground?'编写电路与测试平台':'在这里编写你的解答'}</h3><div class="editor-toolbar"><div><select id="history-select" aria-label="历史代码"><option value="">加载历史…</option>${(record(id).history||[]).map((h,i)=>`<option value="${i}">${esc(new Date(h.at).toLocaleString('zh-CN'))} · ${esc(h.label)}</option>`).join('')}</select> <button class="secondary" id="load-history">加载</button></div><span id="save-label">${record(id).code?'已恢复草稿':'Ctrl+Enter 运行 · Tab 缩进'}</span></div><div class="code-area"><div class="line-numbers" aria-hidden="true"></div><textarea id="code-editor" aria-label="Verilog 代码编辑器" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off">${esc(code)}</textarea></div><div class="toolbar"><button id="run-code">${playground?'运行仿真':health.supported.includes(id)?'提交并运行测试':'编译检查'}</button>${!playground?'<button class="secondary" id="compile-code">仅编译</button>':''}<button class="secondary" id="download-code">下载 .v</button><button class="secondary" id="reset-code">重置代码</button></div><div class="toolbar"><label class="link-button" for="source-file" tabindex="0">从源文件导入…</label><input class="source-upload" type="file" id="source-file" accept=".v,.sv,.txt">${!playground?`<button class="link-button" id="review-problem">${record(id).reviewed?'取消自行复习标记':'标记为已自行复习'}</button>`:''}</div>${playground?'<p class="footer-note" style="margin:10px 0 0">请用 $finish 结束仿真。</p>':''}</section><section id="run-result" aria-live="polite"></section>`;}
function problemPage(p){
 const original=p.ports?template(p):'module top_module();\n\nendmodule\n';
 main.innerHTML=`<div class="problem-layout"><article class="problem-main"><p class="eyebrow"><a href="/wiki/Problem_sets">题目集</a> / ${p.path.map(esc).join(' / ')}</p><h1 class="problem-title">${esc(p.title)} ${dot(p.id)}</h1><div class="prev-next">${navProblem(p)}</div><div class="mode-strip"><span class="chip">${String(p.order).padStart(3,'0')} / 182</span><code>${esc(p.id)}</code></div><p class="problem-copy">${esc(p.description)}</p>${p.images.map((src,i)=>`<figure class="diagram"><a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${esc(p.title)} — 电路图 ${i+1}" loading="lazy"></a></figure>`).join('')}${p.tables.map(t=>`<div class="reference-table">${t}</div>`).join('')}${p.waves.map((_,i)=>`<div class="diagram" id="WaveDrom_Display_${i}"></div>`).join('')}<section class="hb-box port-box"><h3>模块声明</h3><pre>${esc(p.ports||'暂无模块声明。')}</pre></section><details class="hb-box hint-box"><summary>思考提示…</summary><p>${esc(hints[p.path.at(-1)]||'先把输入、输出及时间关系整理成真值表或状态图，再编写逻辑。始终保留接口中的模块名、端口名与位宽。')}</p></details>${editorMarkup(p.id,record(p.id).code??original)}<details class="hb-box"><summary>学习笔记</summary><textarea id="notes" aria-label="本题学习笔记" rows="4" style="width:100%;margin-top:12px;padding:10px" placeholder="记录思路、易错点或待解决的问题…">${esc(record(p.id).notes||'')}</textarea></details><div class="prev-next bottom">${navProblem(p)}</div></article>${sidebar(p.id)}</div>`;
 mountEditor(p.id,original,false);$('#notes').oninput=e=>update(p.id,{notes:e.target.value});
 p.waves.forEach((w,i)=>{try{renderReferenceWave(w,i);}catch(error){console.error('Waveform render failed:',p.id,error);const el=$('#WaveDrom_Display_'+i);el.innerHTML='<p class="muted">波形渲染失败，请刷新页面重试。</p>';}});
}
function renderReferenceWave(w,i){
 const wave=structuredClone(w);
 const translate=x=>{if(Array.isArray(x)){if(x[0]==='Inputs')x[0]='输入';if(x[0]==='Outputs')x[0]='输出';x.forEach(translate);}};translate(wave.signal);
 // WaveDrom 3.7 coerces array ticks to strings in parseConfig; render numeric
 // tick positions first, then put the original labels back on those positions.
 const ticks=[];
 for(const anchor of ['head','foot'])for(const key of ['tick','tock'])if(wave[anchor]?.[key]!==undefined){
  const labels=Array.isArray(wave[anchor][key])?wave[anchor][key]:null;ticks.push(labels);if(labels)wave[anchor][key]=0;
 }
 window.WaveDrom.RenderWaveForm(i,wave,'WaveDrom_Display_');
 document.querySelectorAll('#WaveDrom_Display_'+i+' #gmarks_'+i+' > g.muted').forEach((group,n)=>{if(ticks[n])group.querySelectorAll('text').forEach((text,j)=>{text.textContent=ticks[n][j]??'';});});
}
function mountEditor(id,original,playground){
 const editor=$('#code-editor'),numbers=$('.line-numbers');
 const viewport=document.createElement('div');viewport.className='highlight-viewport';viewport.setAttribute('aria-hidden','true');const highlight=document.createElement('pre');viewport.append(highlight);editor.parentElement.append(viewport);editor.classList.add('syntax-editor');
 const colorize=source=>{let out='',last=0;const pattern=/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b\d+'[sS]?[bBoOdDhH][\da-fA-F_xXzZ?]+|\b(?:module|endmodule|input|output|wire|reg|logic|assign|always|initial|begin|end|if|else|case|casez|endcase|default|posedge|negedge|generate|endgenerate|genvar|for|integer|parameter|localparam)\b|\$\w+|\b\d+\b/g;for(const m of source.matchAll(pattern)){out+=esc(source.slice(last,m.index));const token=m[0],type=token.startsWith('/')?'comment':token.startsWith('"')?'string':/^\d/.test(token)?'number':'keyword';out+=`<span class="syntax-${type}">${esc(token)}</span>`;last=m.index+token.length;}return out+esc(source.slice(last))+'\n';};
 const syncScroll=()=>{numbers.scrollTop=editor.scrollTop;highlight.style.transform=`translate(${-editor.scrollLeft}px,${-editor.scrollTop}px)`;};
 const resizeNumbers=()=>{numbers.textContent=Array.from({length:editor.value.split('\n').length},(_,i)=>i+1).join('\n');numbers.style.height=editor.offsetHeight+'px';highlight.innerHTML=colorize(editor.value);syncScroll();};
 const persist=()=>{const ok=playground?(state.playground=editor.value,save()):update(id,{code:editor.value});$('#save-label').textContent=ok?'草稿已自动保存':'保存失败，请下载备份';resizeNumbers();};
 editor.oninput=persist;editor.onscroll=syncScroll;resizeNumbers();
 editor.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();const start=editor.selectionStart,end=editor.selectionEnd;editor.setRangeText('    ',start,end,'end');persist();}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();$('#run-code').click();}};
 $('#reset-code').onclick=async()=>{if(await confirmAction('将当前编辑器恢复为初始模板？已保存的运行历史不受影响。')){editor.value=original;persist();}};
 $('#download-code').onclick=()=>download(id.replaceAll('/','_')+'.v',editor.value);
 $('#source-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>80000){toast('源文件不能超过 80 KB。');return;}if(editor.value!==original&&!(await confirmAction('用导入文件替换当前草稿？')))return;editor.value=await f.text();persist();toast('已导入 '+f.name);e.target.value='';};
 $('label[for="source-file"]').onkeydown=e=>{if(e.key==='Enter')$('#source-file').click();};
 $('#load-history').onclick=()=>{const index=$('#history-select').value;if(index===''){toast('请先选择一条历史记录。');return;}const h=record(id).history?.[+index];if(h){editor.value=h.code;persist();toast('已加载历史代码');}};
 if(!playground)$('#review-problem').onclick=()=>{const reviewed=!record(id).reviewed;update(id,{reviewed});$('#review-problem').textContent=reviewed?'取消自行复习标记':'标记为已自行复习';toast(reviewed?'已标记为自行复习，不计入测试通过数量。':'已取消复习标记。');};
 const run=async(mode)=>{
  const version=routeVersion,code=editor.value,btn=$('#run-code'),compile=$('#compile-code');
  if(!code.trim()){toast('请先输入代码。');return;}
  persist();btn.disabled=true;if(compile)compile.disabled=true;
  $('#run-result').innerHTML='<div class="result"><h3>正在编译'+(mode==='compile'?'…':'并仿真…')+'</h3></div>';
  try{
   const response=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,code,mode}),signal:AbortSignal.timeout(15000)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'请求失败');
   if(!playground){const history=[{at:new Date().toISOString(),code,label:labels[result.status]||result.status},...(record(id).history||[])].slice(0,6);update(id,{history,...(result.status==='passed'?{passed:true}:{}),lastResult:result.status});}
   if(version!==routeVersion)return;
   showResult(result);if(!playground){$('#history-select').innerHTML='<option value="">加载历史…</option>'+record(id).history.map((h,i)=>`<option value="${i}">${esc(new Date(h.at).toLocaleString('zh-CN'))} · ${esc(h.label)}</option>`).join('');$('.problem-title .status-dot').className='status-dot '+status(id);}
  }catch(e){if(version===routeVersion)showResult({status:'runtime_error',message:e.name==='TimeoutError'?'请求超时，请检查服务终端。':e.message});}
  finally{if(btn.isConnected)btn.disabled=false;if(compile?.isConnected)compile.disabled=false;}
 };
 $('#run-code').onclick=()=>run(playground?'playground':health.supported.includes(id)?'judge':'compile');if($('#compile-code'))$('#compile-code').onclick=()=>run('compile');
}
const labels={passed:'测试通过',incorrect:'输出不一致',compile_error:'编译错误',runtime_error:'仿真错误',unavailable:'运行时不可用',compiled:'编译通过 · 未验证逻辑',simulated:'仿真完成'};
function showResult(r){
 const success=['passed','simulated'].includes(r.status),error=['incorrect','compile_error','runtime_error','unavailable'].includes(r.status);
 $('#run-result').innerHTML=`<div class="result ${success?'success':error?'error':''}"><h3>${esc(labels[r.status]||'运行结果')}</h3><p>${esc(r.status==='compiled'?'语法与模块编译通过。':r.status==='passed'&&Number.isFinite(r.total)?`通过 ${r.total} 次采样测试。`:r.message)}</p>${r.columns?`<details open><summary>采样数据（十六进制，优先展示不一致样本）</summary><div class="table-scroll"><table class="truth-table"><thead><tr>${r.columns.map(c=>`<th>${esc(c.replace('got_','实际 ').replace('exp_','参考 '))}</th>`).join('')}</tr></thead><tbody>${r.rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`:''}${r.log?`<details open><summary>编译 / 仿真日志</summary><pre>${esc(r.log)}</pre></details>`:''}${r.vcd?'<h3>仿真波形</h3><div id="vcd-wave" class="table-scroll"></div><button id="download-vcd" class="secondary">下载 VCD</button>':''}</div>`;
 if(r.vcd){$('#vcd-wave').innerHTML=renderVcd(r.vcd);$('#download-vcd').onclick=()=>download('trace.vcd',r.vcd);}
}
function renderVcd(text){
 const signals=[],events=new Map();let time=0,max=0;
 for(const line of text.split(/\r?\n/)){
  const v=line.match(/^\$var\s+\w+\s+(\d+)\s+(\S+)\s+(\S+)/);if(v){if(!signals.some(s=>s.id===v[2]))signals.push({width:+v[1],id:v[2],name:v[3]});continue;}
  if(line[0]==='#'){time=+line.slice(1);max=Math.max(max,time);continue;}
  const change=line.match(/^([01xz])(\S+)$/i)||line.match(/^b([01xz]+)\s+(\S+)$/i);
  if(change){if(!events.has(change[2]))events.set(change[2],[]);events.get(change[2]).push([time,change[1]]);}
 }
 if(!max||!signals.length)return '<p class="muted">波形中没有可绘制的时间变化。</p>';
 const width=900,rowHeight=42,left=135,span=width-left-20;let svg=`<svg class="wave" viewBox="0 0 ${width} ${signals.slice(0,16).length*rowHeight+35}" xmlns="http://www.w3.org/2000/svg" aria-label="仿真波形" role="img">`;
 signals.slice(0,16).forEach((s,i)=>{const y=30+i*rowHeight;svg+=`<text x="12" y="${y+12}" font-size="12" fill="#344854">${esc(s.name)}</text>`;const ev=events.get(s.id)||[];for(let k=0;k<ev.length&&k<600;k++){const [t,val]=ev[k],end=ev[k+1]?.[0]??max,x=left+t/max*span,x2=left+end/max*span;if(s.width===1){const yy=val==='1'?y:y+20;svg+=`<path d="M${x},${y} V${y+20} M${x},${yy} H${x2}" fill="none" stroke="${val==='x'?'#bd7c39':'#328967'}" stroke-width="1.6"/>`;}else{svg+=`<path d="M${x},${y+10} L${x+3},${y} H${x2-3} L${x2},${y+10} L${x2-3},${y+20} H${x+3} Z" fill="#e9f4ed" stroke="#59946d"/>`;if(x2-x>28)svg+=`<text x="${x+5}" y="${y+14}" font-size="10">${esc(/^[01]+$/.test(val)?BigInt('0b'+val).toString(16):val)}</text>`;}}});
 return svg+'</svg><p class="footer-note">展示前 16 个信号，每个信号最多 600 次跳变。完整数据可下载 VCD 查看。</p>';
}
const playgroundTemplate='`timescale 1ns/1ps\nmodule top_module;\n    reg clk = 0;\n    reg [3:0] count = 0;\n    always #5 clk = ~clk;\n    always @(posedge clk) count <= count + 1\'b1;\n\n    initial begin\n        $dumpfile("trace.vcd");\n        $dumpvars(0, top_module);\n        $monitor("time=%0t count=%0d", $time, count);\n        #160;\n        $finish;\n    end\nendmodule\n';
function playground(){main.innerHTML=`<h1>Verilog 仿真实验台</h1><p>编写电路与测试平台，运行仿真并查看波形。</p><div class="sim-layout"><section>${editorMarkup('__playground',state.playground||playgroundTemplate,true)}</section><aside class="sim-help"><h3>使用说明</h3><ol><li>在同一份代码中写入电路和测试平台。</li><li>使用 <code>initial</code> 与 <code>#</code> 延时产生激励。</li><li>调用 <code>$display</code> 或 <code>$monitor</code> 查看输出。</li><li>调用 <code>$finish</code> 结束仿真。</li></ol><h3>记录波形</h3><p>使用 <code>$dumpfile("trace.vcd")</code> 和 <code>$dumpvars</code> 生成波形，完成后可预览并下载 VCD。</p><p class="muted">代码上限 80,000 字符；单次仿真最长运行 5 秒。</p><p id="engine-status">${health.compiler?'● Icarus Verilog 已就绪':'运行时暂不可用，请查看 README'}</p></aside></div>`;mountEditor('__playground',playgroundTemplate,true);}
function stats(){
 const solved=problems.filter(p=>status(p.id)==='solved'),attempted=problems.filter(p=>status(p.id)==='attempted'),reviewed=problems.filter(p=>status(p.id)==='reviewed');
 main.innerHTML=`<h1>${esc(state.profile.name||'学习者')}的学习进度</h1><div class="stats-cards">${[[182,'全部练习'],[solved.length,'测试通过'],[attempted.length,'正在练习'],[reviewed.length,'已自行复习']].map(([n,t])=>`<div class="stat-card"><strong>${n}</strong><span>${t}</span></div>`).join('')}</div><h3>主题进度</h3>${[...new Set(problems.map(p=>p.path[0]==='电路设计'?p.path[1]:p.path[0]))].map(group=>{const list=problems.filter(p=>(p.path[0]==='电路设计'?p.path[1]:p.path[0])===group),n=list.filter(p=>status(p.id)==='solved').length;return `<div><a href="/wiki/Problem_sets">${esc(group)}</a><span style="float:right" class="muted">${n} / ${list.length}</span><div class="progress-line"><i style="width:${n/list.length*100}%"></i></div></div>`;}).join('')}<h3>最近练习</h3>${historyTable()}<p style="margin-top:20px"><a class="button" href="/wiki/Problem_sets">继续练习</a> <a href="/wiki/Special:VlgProfile">导出进度备份 →</a></p>`;
}
function historyTable(){const list=problems.filter(p=>record(p.id).updated).sort((a,b)=>record(b.id).updated.localeCompare(record(a.id).updated)).slice(0,25);return list.length?`<div class="table-scroll"><table class="wide-table"><thead><tr><th>题目</th><th>状态</th><th>最近更新</th></tr></thead><tbody>${list.map(p=>`<tr><td><a href="${href(p.slug)}">${esc(p.title)}</a></td><td>${statusText(p.id)}</td><td>${esc(new Date(record(p.id).updated).toLocaleString('zh-CN'))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">还没有练习记录。打开一道题并开始编写代码吧。</div>';}
function profile(){
 main.innerHTML=`<h1>资料与备份</h1><form class="profile-form"><label for="profile-name">学习昵称</label><input id="profile-name" value="${esc(state.profile.name)}" maxlength="40" required><div class="toolbar"><button>保存资料</button></div></form><h2>备份与迁移</h2><p>清除浏览器数据会删除本地记录。定期导出 JSON 备份，也可在另一个浏览器导入继续学习。</p><div class="toolbar"><button id="export-data">导出所有学习数据</button><label for="import-data" class="button secondary" tabindex="0">导入备份</label><input class="source-upload" id="import-data" type="file" accept=".json"></div><p class="muted" style="margin-top:15px">备份包括昵称、草稿、笔记、复习标记及每题最多六次运行历史。</p><h2>运行环境</h2><p>仿真引擎：<strong>${health.compiler?'Icarus Verilog 已就绪':'尚未检测到 Icarus Verilog'}</strong></p>`;
 $('.profile-form').onsubmit=e=>{e.preventDefault();state.profile.name=$('#profile-name').value.trim()||'学习者';if(save())toast('资料已保存');};
 $('#export-data').onclick=()=>download('hdlbits-学习备份-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2),'application/json');
 $('label[for="import-data"]').onkeydown=e=>{if(e.key==='Enter')$('#import-data').click();};
 $('#import-data').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>5_000_000){toast('备份文件不能超过 5 MB。');return;}await importBackupText(await f.text());e.target.value='';};
 const paste=document.createElement('details');paste.className='hb-box';paste.innerHTML='<summary>也可以粘贴 JSON 备份</summary><p class="muted">文件选择器不可用时，将备份文件的内容粘贴到这里。</p><textarea id="backup-text" aria-label="JSON 备份文本" rows="5" style="width:100%;font-family:monospace"></textarea><div class="toolbar"><button id="import-text">导入 JSON 文本</button></div>';
 $('#import-data').closest('.toolbar').after(paste);$('#import-text').onclick=()=>importBackupText($('#backup-text').value);
}
async function importBackupText(text){
 try{
  if(text.length>5_000_000)throw new Error('备份不能超过 5 MB。');
  const data=JSON.parse(text);
  if(data.version!==1||typeof data.profile?.name!=='string'||!data.problems||Array.isArray(data.problems))throw new Error('不是有效的学习备份。');
  const clean={version:1,profile:{name:data.profile.name.slice(0,40)},problems:{},playground:typeof data.playground==='string'?data.playground.slice(0,80000):''};
  for(const [id,r]of Object.entries(data.problems)){
   if(!byId.has(id)||!r||typeof r!=='object')continue;
   clean.problems[id]={code:typeof r.code==='string'?r.code.slice(0,80000):undefined,notes:typeof r.notes==='string'?r.notes.slice(0,20000):'',passed:r.passed===true,reviewed:r.reviewed===true,updated:typeof r.updated==='string'&&!Number.isNaN(Date.parse(r.updated))?r.updated:new Date().toISOString(),history:Array.isArray(r.history)?r.history.filter(h=>typeof h?.code==='string'&&typeof h.at==='string').slice(0,6).map(h=>({at:h.at,code:h.code.slice(0,80000),label:String(h.label||'历史记录').slice(0,80)})):[]};
  }
  if(await confirmAction('导入将替换当前浏览器的全部学习记录。建议先导出备份，确认继续？')){
   const old=state;state=clean;if(save()){profile();toast('备份已导入');}else state=old;
  }
 }catch(error){toast('导入失败：'+error.message);}
}
function about(){main.innerHTML=`<article style="max-width:950px"><h1>关于 HDLBits</h1><p>通过一系列电路设计练习，学习使用 Verilog 硬件描述语言。练习涵盖语言基础、组合逻辑、时序逻辑、有限状态机及仿真验证。</p><p><a href="/wiki/Problem_sets">浏览题目集</a>，或<a href="/wiki/Step_one">从第一题开始</a>。</p><h2>致谢</h2><p>练习内容与图表来源于 <a href="https://hdlbits.01xz.net/wiki/Main_Page" target="_blank" rel="noopener">HDLBits</a>，作者 Henry Wong。</p><p>波形显示：WaveDrom（MIT）。仿真引擎：Icarus Verilog（GPL-2.0-or-later）。</p></article>`;}
function help(){main.innerHTML=`<h1>使用说明</h1><div class="help-grid"><section><h3>开始一道练习</h3><p>从题目集按主题或关键词查找题目。阅读题目说明，查看图表与模块接口，在编辑器中补全逻辑。</p></section><section><h3>保存与恢复</h3><p>输入代码时立即保存到当前浏览器。运行后可从历史下拉框恢复最近六次代码。下载 .v 保存源文件；通过资料页导出全部数据。</p></section><section><h3>正确理解结果</h3><p>“编译通过”表示语法与模块检查完成；“测试通过”表示输出与测试预期一致。“自行复习”单独统计。</p></section><section><h3>运行自己的测试平台</h3><p>进入仿真实验台，把电路与测试模块放在同一份代码中，用 $display 输出日志。波形文件名设为 trace.vcd，结束前调用 $finish。</p></section><section><h3>快捷键</h3><p>编辑器中 Tab 插入四个空格，Ctrl+Enter 或 ⌘+Enter 运行。页面可使用浏览器打印功能。</p></section><section><h3>给定子模块</h3><p>遇到 Unknown module type 时，请检查模块名称，并在代码中包含所需子模块的实现。</p></section></div>`;}
function go(url){history.pushState({},'',url);render();}
async function render(){
 routeVersion++;const url=new URL(location.href),id=canonical(url.pathname==='/'?'Main_Page':url.pathname);
 document.querySelectorAll('.nav-item[open]').forEach(d=>d.open=false);$('.topbar').classList.remove('expanded');$('.mobile-toggle').setAttribute('aria-expanded','false');
 if(url.pathname==='/mw/index.php'&&url.searchParams.has('search'))catalog(url.searchParams.get('search'));
 else if(['main_page',''].includes(id))main.innerHTML=home();
 else if(id==='problem_sets')catalog(url.searchParams.get('q')||'');
 else if(id==='search')catalog(url.searchParams.get('q')||'');
 else if(id==='iverilog')playground();
 else if(id.startsWith('special:vlgstats')||id==='special:vlgrank')stats();
 else if(id==='special:vlgprofile'||id==='special:vlglogin')profile();
 else if(id==='project:about')about();
 else if(id==='help')help();
 else if(byId.has(id))problemPage(byId.get(id));
 else main.innerHTML='<h1>未找到该页面</h1><p>请检查页面地址，或返回题目集。</p><a class="button" href="/wiki/Problem_sets">返回题目集</a>';
 document.title=($('h1',main)?.textContent||'HDLBits')+' — HDLBits';window.scrollTo(0,0);
 if(url.hash){try{document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();}catch{}}
}
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;const u=new URL(a.href);if(u.origin!==location.origin||(!u.pathname.startsWith('/wiki/')&&u.pathname!=='/'))return;e.preventDefault();go(u.pathname+u.search+u.hash);});
window.addEventListener('popstate',render);
$('.nav-search').onsubmit=e=>{e.preventDefault();const q=$('.nav-search input').value.trim();go('/wiki/Problem_sets?q='+encodeURIComponent(q));};
$('.mobile-toggle').onclick=()=>{const open=$('.topbar').classList.toggle('expanded');$('.mobile-toggle').setAttribute('aria-expanded',String(open));};
$('#print-page').onclick=()=>window.print();
document.querySelectorAll('.nav-item').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.nav-item').forEach(other=>{if(other!==d)other.open=false;});}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.nav-item').forEach(d=>d.open=false);});
try{const result=await fetch('/problems.json');if(!result.ok)throw new Error('题库文件读取失败');problems=await result.json();byId=new Map(problems.map(p=>[p.id,p]));try{health=await(await fetch('/api/health',{signal:AbortSignal.timeout(3500)})).json();}catch{}await render();}catch(e){main.innerHTML=`<h1>加载失败</h1><p>${esc(e.message)}。请使用项目的启动脚本打开本站，而不是直接双击 HTML。</p>`;}
