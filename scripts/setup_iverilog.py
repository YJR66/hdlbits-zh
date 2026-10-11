"""Install project-local Windows Icarus runtime from the official MSYS2 registry."""
import hashlib, io, json, tarfile
from pathlib import Path
import requests, zstandard
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]/'.tools'
ROOT.mkdir(exist_ok=True)
seen=set(); manifest=[]
def install(name):
    if name in seen: return
    seen.add(name)
    url='https://packages.msys2.org/packages/'+name
    r=requests.get(url,timeout=60); r.raise_for_status()
    soup=BeautifulSoup(r.content,'html.parser')
    def field(key):
        return soup.find('dt',string=lambda s:s and s.strip()==key).find_next_sibling('dd')
    link=field('File:').a['href']; digest=field('SHA256:').get_text(strip=True)
    for a in field('Dependencies:').select('a'):
        dep=a.get_text(strip=True)
        if dep.startswith('mingw-w64-ucrt-x86_64-'): install(dep)
    print('Downloading',name,flush=True)
    r=requests.get(link.replace('mirror.msys2.org','repo.msys2.org'),timeout=120); r.raise_for_status()
    assert hashlib.sha256(r.content).hexdigest()==digest, 'Checksum mismatch'
    with zstandard.ZstdDecompressor().stream_reader(io.BytesIO(r.content)) as reader:
        with tarfile.open(fileobj=reader,mode='r|') as tar:
            for member in tar:
                if not member.isfile() or not member.name.startswith('ucrt64/'): continue
                dest=(ROOT/member.name).resolve()
                if not dest.is_relative_to(ROOT.resolve()): raise ValueError('Unsafe archive path')
                dest.parent.mkdir(parents=True,exist_ok=True)
                dest.write_bytes(tar.extractfile(member).read())
    source=field('Source-Only Tarball:').a['href']
    manifest.append({'package':name,'url':link,'sha256':digest,'source':source})
install('mingw-w64-ucrt-x86_64-iverilog')
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Runtime installed at',ROOT,flush=True)
