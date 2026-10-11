// Independently written local reference circuits. This is not HDLBits' hidden judge.
export const references = {
 step_one:"assign one=1'b1;",zero:"assign zero=1'b0;",wire:'assign out=in;',wire4:'assign {w,x,y,z}={a,b,c,c};',notgate:'assign out=~in;',andgate:'assign out=a&b;',norgate:'assign out=~(a|b);',xnorgate:'assign out=~(a^b);',
 wire_decl:'assign out=(a&b)|(c&d); assign out_n=~out;',
 '7458':'assign p1y=(p1a&p1b&p1c)|(p1d&p1e&p1f); assign p2y=(p2a&p2b)|(p2c&p2d);',
 vector0:'assign outv=vec; assign {o2,o1,o0}=vec;',vector1:'assign {out_hi,out_lo}=in;',vector2:'assign out={in[7:0],in[15:8],in[23:16],in[31:24]};',
 vectorgates:'assign out_or_bitwise=a|b; assign out_or_logical=a||b; assign out_not=~{b,a};',gates4:'assign out_and=&in; assign out_or=|in; assign out_xor=^in;',vector3:"assign {w,x,y,z}={a,b,c,d,e,f,2'b11};",vector4:'assign out={{24{in[7]}},in};',vector5:'assign out=~({{5{a}},{5{b}},{5{c}},{5{d}},{5{e}}}^{5{a,b,c,d,e}});',
 alwaysblock1:'assign out_assign=a&b; always @* out_alwaysblock=a&b;',alwaysblock2:'assign out_assign=a^b; always @* out_always_comb=a^b; always @(posedge clk) out_always_ff<=a^b;',
 always_if:'assign out_assign=(sel_b1&sel_b2)?b:a; always @* out_always=(sel_b1&sel_b2)?b:a;',always_if2:'always @* begin shut_off_computer=cpu_overheated; keep_driving=~arrived&~gas_tank_empty; end',
 always_case:'always @* case(sel) 0:out=data0; 1:out=data1; 2:out=data2; 3:out=data3; 4:out=data4; 5:out=data5; default:out=0; endcase',
 always_case2:'integer j; always @* begin pos=0; for(j=3;j>=0;j=j-1) if(in[j]) pos=j; end',always_casez:'integer j; always @* begin pos=0; for(j=7;j>=0;j=j-1) if(in[j]) pos=j; end',
 always_nolatches:"always @* begin left=scancode==16'he06b; down=scancode==16'he072; right=scancode==16'he074; up=scancode==16'he075; end",
 conditional:'wire [7:0] lo1,lo2; assign lo1=a<b?a:b; assign lo2=c<d?c:d; assign min=lo1<lo2?lo1:lo2;',reduction:'assign parity=^in;',gates100:'assign out_and=&in; assign out_or=|in; assign out_xor=^in;',
 'exams/m2014_q4h':'assign out=in;','exams/m2014_q4i':"assign out=1'b0;",'exams/m2014_q4e':'assign out=~(in1|in2);',
 gates:'assign out_and=a&b; assign out_or=a|b; assign out_xor=a^b; assign out_nand=~(a&b); assign out_nor=~(a|b); assign out_xnor=~(a^b); assign out_anotb=a&~b;',
 '7420':'assign p1y=~(p1a&p1b&p1c&p1d); assign p2y=~(p2a&p2b&p2c&p2d);',truthtable1:'assign f=({x3,x2,x1}==2)||({x3,x2,x1}==3)||({x3,x2,x1}==5)||({x3,x2,x1}==7);',mt2015_eq2:'assign z=A==B;',mt2015_q4a:'assign z=(x^y)&x;',
 ringer:'assign ringer=ring&~vibrate_mode; assign motor=ring&vibrate_mode;',thermostat:'assign heater=mode&too_cold; assign aircon=~mode&too_hot; assign fan=heater|aircon|fan_on;',popcount3:'assign out={1\'b0,in[0]}+in[1]+in[2];',
 mux2to1:'assign out=sel?b:a;',mux2to1v:'assign out=sel?b:a;',mux9to1v:"assign out=sel==0?a:sel==1?b:sel==2?c:sel==3?d:sel==4?e:sel==5?f:sel==6?g:sel==7?h:sel==8?i:16'hffff;",mux256to1:'assign out=in[sel];',mux256to1v:'assign out=in[sel*4+:4];',
 hadd:'assign {cout,sum}=a+b;',fadd:'assign {cout,sum}=a+b+cin;',adder100:'assign {cout,sum}=a+b+cin;','exams/m2014_q4j':'assign sum={1\'b0,x}+y;','exams/ece241_2014_q1c':'assign s=a+b; assign overflow=(a[7]==b[7])&&(s[7]!=a[7]);',
 dff:'always @(posedge clk) q<=d;',dff8:'reg [7:0] r; always @(posedge clk) r<=d; assign q=r;',dff8r:'reg [7:0] r; always @(posedge clk) if(reset) r<=0; else r<=d; assign q=r;',dff8p:"reg [7:0] r; always @(negedge clk) if(reset) r<=8'h34; else r<=d; assign q=r;",dff8ar:'reg [7:0] r; always @(posedge clk or posedge areset) if(areset) r<=0; else r<=d; assign q=r;',
 dff16e:'reg [15:0] r; always @(posedge clk) if(!resetn) r<=0; else begin if(byteena[0]) r[7:0]<=d[7:0]; if(byteena[1]) r[15:8]<=d[15:8]; end assign q=r;',
 'exams/m2014_q4a':'reg r; always @* if(ena) r=d; assign q=r;',
 count15:'reg [3:0] r; always @(posedge clk) if(reset) r<=0; else r<=r+1\'b1; assign q=r;',count10:'reg [3:0] r; always @(posedge clk) if(reset) r<=0; else if(r==9) r<=0; else r<=r+1\'b1; assign q=r;',count1to10:'reg [3:0] r; always @(posedge clk) if(reset) r<=1; else if(r==10) r<=1; else r<=r+1\'b1; assign q=r;',countslow:'reg [3:0] r; always @(posedge clk) if(reset) r<=0; else if(slowena) r<=r==9?0:r+1\'b1; assign q=r;',
 shift4:'always @(posedge clk or posedge areset) if(areset) q<=0; else if(load) q<=data; else if(ena) q<=q>>1;',rotate100:'always @(posedge clk) if(load) q<=data; else case(ena) 1:q<={q[0],q[99:1]}; 2:q<={q[98:0],q[99]}; endcase',shift18:'always @(posedge clk) if(load) q<=data; else if(ena) case(amount) 0:q<=q<<1; 1:q<=q<<8; 2:q<=$signed(q)>>>1; 3:q<=$signed(q)>>>8; endcase',
 'sim/circuit1':'assign q=a&b;'
};
for(const [id,n] of [['vectorr',8],['vector100r',100]]) references[id]=`genvar j; generate for(j=0;j<${n};j=j+1) begin assign out[j]=in[${n-1}-j]; end endgenerate`;
references.popcount255='integer j; reg [7:0] n; always @* begin n=0; for(j=0;j<255;j=j+1) n=n+in[j]; end assign out=n;';
for(const [id,n] of [['gatesv',4],['gatesv100',100]]) references[id]=`assign out_both=in[${n-2}:0]&in[${n-1}:1]; assign out_any=in[${n-1}:1]|in[${n-2}:0]; assign out_different=in^{in[0],in[${n-1}:1]};`;
for(const [id,n] of [['adder3',3],['adder100i',100]]) references[id]=`wire [${n}:0] c; assign c[0]=cin; assign cout=c[${n}:1]; genvar j; generate for(j=0;j<${n};j=j+1) begin assign {c[j+1],sum[j]}=a[j]+b[j]+c[j]; end endgenerate`;

export function parsePorts(header){
 const signature=header.match(/module\s+top_module\s*\(([\s\S]*?)\)\s*;/);
 if(!signature) throw new Error('不支持的模块接口');
 let direction,range='';
 return signature[1].split(',').map(part=>{
  part=part.trim();const decl=part.match(/^(input|output|inout)\s+/);
  if(decl){direction=decl[1];range='';part=part.slice(decl[0].length).replace(/\b(wire|reg|logic|signed|unsigned)\b/g,'').trim();const r=part.match(/^\[\s*(\d+)\s*:\s*(\d+)\s*\]/);if(r){range=r[0];part=part.slice(r[0].length).trim();}}
  if(!direction||!/^\w+$/.test(part)) throw new Error('不支持的端口声明：'+part);
  const nums=range.match(/\d+/g); return {name:part,direction,range,width:nums?Math.abs(+nums[0]- +nums[1])+1:1};
 });
}

export function makeTestbench(problem){
 const ref=references[problem.id]; if(!ref) return null;
 const ports=parsePorts(problem.ports),inputs=ports.filter(p=>p.direction==='input'),outputs=ports.filter(p=>p.direction==='output');
 const clock=inputs.find(p=>p.name==='clk');const data=inputs.filter(p=>p!==clock);const bits=data.reduce((n,p)=>n+p.width,0);
 const exhaustive=!clock&&bits<=10;const count=exhaustive?Math.max(1,2**bits):512;
 const refHeader=problem.ports.replace(/`default_nettype\s+none/g,'').replace(/\btop_module\b/,'reference');
 const declarations=inputs.map(p=>`reg ${p.range} ${p.name};`).concat(outputs.flatMap(p=>[`wire ${p.range} got_${p.name};`,`wire ${p.range} exp_${p.name};`])).join('\n');
 const connections=prefix=>ports.map(p=>`.${p.name}(${p.direction==='input'?'':prefix}${p.name})`).join(',');
 const randomize=data.map(p=>{
  const random=`{${Array(Math.ceil(p.width/32)).fill('$random(__seed)').join(',')}}`;
  if(p.name==='reset'||p.name==='areset') return `${p.name}=(__case==0||__case==37||__case==173);`;
  if(p.name==='resetn') return `${p.name}=!(__case==0||__case==37||__case==173);`;
  if(p.name==='load') return `${p.name}=(__case==0||__case%17==0);`;
  if(p.name==='scancode') return `case(__case) 0:scancode=16'he06b; 1:scancode=16'he072; 2:scancode=16'he074; 3:scancode=16'he075; default:scancode=${random}; endcase`;
  return `${p.name}=__case==0?'0:__case==1?'1:${random};`;
 }).join('\n');
 const setInputs=exhaustive?(data.length?`{${data.map(p=>p.name).join(',')}}=__case;`:''):randomize;
 const cols=[...inputs.map(p=>p.name),...outputs.flatMap(p=>['got_'+p.name,'exp_'+p.name])];
 const mismatch=outputs.map(p=>`(got_${p.name} !== exp_${p.name})`).join(' || ');
 const report=`if(${mismatch}) __failures=__failures+1; $display("__ROW__|%0d|${cols.map(()=>'%h').join('|')}|%0d",__case,${cols.join(',')},(${mismatch}));`;
 // Compare on both clock phases after the first cycle, to catch incorrect edges.
 const sample=clock?`#2; clk=1; #2; if(__case>0) begin ${report} end #2; clk=0; #2; if(__case>0) begin ${report} end`:`#1; ${report}`;
 const source=`\n${refHeader}\n${ref}\nendmodule\nmodule __local_tb;\n${declarations}\ninteger __case,__seed,__failures;\ntop_module dut(${connections('got_')});\nreference expected(${connections('exp_')});\ninitial begin __seed=32847; __failures=0; ${inputs.map(p=>`${p.name}=0;`).join(' ')} #1;\nfor(__case=0;__case<${count};__case=__case+1) begin ${setInputs} ${sample} end\n$display("__END__|%0d",__failures); $finish; end\nendmodule\n`;
 return {source,columns:cols,exhaustive,cycles:count};
}

export function checkSource(code){
 if(typeof code!=='string'||code.length>80000) throw new Error('代码须为文本，且不能超过 80,000 字符。');
 const stripped=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 if(/`\s*include\b|\b(?:import|export)\s*"DPI/i.test(stripped)) throw new Error('本地仿真不开放外部文件包含或 DPI。');
 const allowed=new Set(['display','write','monitor','strobe','finish','stop','time','realtime','signed','unsigned','clog2','bits','random','urandom','urandom_range','dumpfile','dumpvars','dumpon','dumpoff','dumplimit','dumpflush','readmemb','readmemh']);
 for(const m of stripped.matchAll(/\$([A-Za-z_]\w*)/g)) if(!allowed.has(m[1])||/^readmem/.test(m[1])) throw new Error('不支持此系统任务：$'+m[1]);
 if(/\$dumpfile\s*\(\s*(?!"trace\.vcd"\s*\))/.test(stripped)) throw new Error('波形文件名须使用 "trace.vcd"。');
 return code;
}
