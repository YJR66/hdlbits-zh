import json,re
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
translations={}
for line in (ROOT/'data/zh.txt').read_text(encoding='utf-8').splitlines():
    if line.strip():
        key,title,description=line.split('|',2)
        translations[key]=(title,description)
groups={'Getting Started':'开始使用','Verilog Language':'Verilog 语言','Basics':'基础语法','Vectors':'向量','Modules: Hierarchy':'模块与层次结构','Procedures':'过程语句','More Verilog Features':'更多 Verilog 特性','Circuits':'电路设计','Combinational Logic':'组合逻辑','Basic Gates':'基本逻辑门','Multiplexers':'多路选择器','Arithmetic Circuits':'算术电路','Karnaugh Map to Circuit':'卡诺图与电路','Sequential Logic':'时序逻辑','Latches and Flip-Flops':'锁存器与触发器','Counters':'计数器','Shift Registers':'移位寄存器','More Circuits':'更多电路','Finite State Machines':'有限状态机','Building Larger Circuits':'构建大型电路','Verification: Reading Simulations':'验证：阅读仿真波形','Finding bugs in code':'查找代码错误','Build a circuit from a simulation waveform':'根据波形构建电路','Verification: Writing Testbenches':'验证：编写测试平台','CS450':'CS450 扩展练习'}
table_words={'State':'状态','Next state':'次态','Output':'输出','Present state':'现态','Left':'左','Center':'中','Right':'右',"Center's next state":'中心下一状态','Scancode':'扫描码','Arrow key':'方向键','left arrow':'左','right arrow':'右','up arrow':'上','down arrow':'下','Anything else':'其他','none':'无'}
def clean_table(html):
    s=BeautifulSoup(html,'html.parser')
    for tag in list(s.find_all()):
        if tag.name not in ['table','thead','tbody','tr','th','td','b','i','code','br','sup','sub']:
            tag.unwrap(); continue
        tag.attrs={k:v for k,v in tag.attrs.items() if k in ['rowspan','colspan']}
    for t in list(s.find_all(string=True)):
        value=str(t)
        for en,zh in sorted(table_words.items(),key=lambda p:-len(p[0])): value=value.replace(en,zh)
        t.replace_with(value)
    return str(s)
source=json.loads((ROOT/'.research/all.json').read_text(encoding='utf-8'))
assets=json.loads((ROOT/'data/assets.json').read_text(encoding='utf-8'))
def plain_label(value):
    if isinstance(value,list):
        return ''.join(plain_label(x) for x in (value[1:] if value and isinstance(value[0],str) and value[0] in ['tspan','text','span'] else value))
    if isinstance(value,dict): return ''
    return str(value)
def normalize_wave(wave):
    for anchor in ['head','foot']:
        if anchor not in wave: continue
        for key in ['tick','tock']:
            val=wave[anchor].get(key)
            if isinstance(val,list): wave[anchor][key]=[plain_label(v) for v in val]
        if isinstance(wave[anchor].get('text'),list): wave[anchor]['text']=plain_label(wave[anchor]['text'])
    def walk(node):
        if isinstance(node,list):
            for item in node: walk(item)
        elif isinstance(node,dict):
            if isinstance(node.get('name'),list): node['name']=plain_label(node['name'])
            if isinstance(node.get('data'),list): node['data']=[plain_label(v) for v in node['data']]
    walk(wave.get('signal',[]))
    return wave
result=[]
for i,p in enumerate(source):
    title,description=translations[p['id']]
    result.append({'id':p['id'],'order':i+1,'slug':p['slug'],'title':title,'titleEn':p['titleEn'],'description':description,'source':p['source'],'path':[groups[g] for g in p['pathEn']],'pathEn':p['pathEn'],'ports':p['ports'],'images':[assets[u] for u in p['images']],'waves':[normalize_wave(w) for w in p.get('waves',[])],'tables':[clean_table(t) for t in p['tables']]})
assert len(result)==len(translations)==182
(ROOT/'dist/problems.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'data/groups.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2),encoding='utf-8')
print('Built',len(result),'Chinese summaries;',sum(len(p['waves']) for p in result),'waveforms')
