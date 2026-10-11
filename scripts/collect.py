"""Collect public catalog metadata and technical interfaces; not a prose mirror."""
import concurrent.futures, hashlib, json, re, time
from pathlib import Path
from urllib.parse import urljoin, unquote
import requests, json5
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
BASE='https://hdlbits.01xz.net'
CACHE=ROOT/'.research'
CACHE.mkdir(exist_ok=True)

def get(url):
    for attempt in range(4):
        try:
            r=requests.get(url,timeout=40,headers={'User-Agent':'HDLBits-Chinese-Local-Study/1.0'})
            r.raise_for_status()
            return r
        except requests.RequestException:
            if attempt==3: raise
            time.sleep(2+attempt*2)

def collect():
    doc=BeautifulSoup(get(BASE+'/wiki/Problem_sets').content,'html.parser')
    out=[]; hierarchy={}
    for node in doc.select_one('.mw-parser-output').children:
        if node.name in ['h2','h3','h4']:
            level=int(node.name[1]); hierarchy={k:v for k,v in hierarchy.items() if k<level}
            hierarchy[level]=node.get_text(' ',strip=True)
        elif node.name in ['ul','ol']:
            for a in node.select('a.vlgstat_link'):
                slug=unquote(a['href'].split('/wiki/')[-1])
                out.append({'id':slug.lower(),'slug':slug,'titleEn':a.get_text(' ',strip=True),'pathEn':list(hierarchy.values()),'source':BASE+a['href']})
    for a in doc.select('.mw-parser-output div[style="display:none"] a.vlgstat_link'):
        slug=unquote(a['href'].split('/wiki/')[-1])
        out.append({'id':slug.lower(),'slug':slug,'titleEn':slug,'pathEn':['CS450'],'source':BASE+a['href']})
    assert len(out)==182, len(out)
    (ROOT/'data/catalog.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
    def detail(p):
        cache=CACHE/(p['id'].replace('/','__')+'.json')
        if cache.exists():
            saved=json.loads(cache.read_text(encoding='utf-8'))
            if saved.get('version')==2: return saved
        s=BeautifulSoup(get(p['source']).content,'html.parser')
        c=s.select_one('.mw-parser-output')
        pl=c.select_one('#portlistbox')
        code=pl.get_text() if pl else ''
        p['ports']=re.sub(r'//[^\n]*|/\*[\s\S]*?\*/','',code).strip()
        images=[]; paragraphs=[]; tables=[]; waves=[]
        for child in list(c.children):
            if child.name and child.get('id') in ['portlistouterbox','submitbox']: break
            if not child.name or child.name in ['style','script']: continue
            if child.name=='div' and child.select('a.vlgstat_link') and not child.select('img'): continue
            for wave in child.select('script[type="WaveDrom"]'):
                waves.append(json5.loads(wave.string))
            for im in child.select('img'):
                src=urljoin(BASE,im.get('src',''))
                if src not in images: images.append(src)
            if child.name=='table': tables.append(str(child))
            else: tables.extend(str(t) for t in child.select('table'))
            paragraphs.append(child.get_text(' ',strip=True))
        p['research']='\n'.join(paragraphs)
        p['images']=images
        p['tables']=tables
        p['waves']=waves
        p['version']=2
        cache.write_text(json.dumps(p,ensure_ascii=False,indent=2),encoding='utf-8')
        print(p['id'],flush=True)
        time.sleep(.15)
        return p
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results=list(pool.map(detail,out))
    (CACHE/'all.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    assets={}
    for p in results:
        for src in p['images']:
            if src in assets: continue
            ext=Path(src.split('?')[0]).suffix
            name=hashlib.sha256(src.encode()).hexdigest()[:12]+ext
            dest=ROOT/'dist/assets'/name
            if not dest.exists(): dest.write_bytes(get(src).content)
            assets[src]='/assets/'+name
    home=BeautifulSoup(get(BASE+'/wiki/Main_Page').content,'html.parser')
    for im in home.select('img'):
        src=urljoin(BASE,im.get('src',''))
        name=Path(src).name
        if name.startswith(('Logo_','logo270')):
            (ROOT/'dist/assets'/name).write_bytes(get(src).content)
    (ROOT/'data/assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
    print('DONE',len(results),'pages',len(assets),'images',flush=True)

if __name__=='__main__': collect()
