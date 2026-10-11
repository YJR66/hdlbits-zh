"""Download the host's Electron runtime with the npm-pinned SHA-256 (stdlib only)."""
import hashlib
import json
import platform
import urllib.request
import zipfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
package=root/'node_modules/electron'
version=json.loads((package/'package.json').read_text())['version']
system={'Windows':'win32','Linux':'linux'}.get(platform.system())
arch={'AMD64':'x64','x86_64':'x64','aarch64':'arm64','ARM64':'arm64'}.get(platform.machine())
if not system or not arch:raise SystemExit('Supported hosts: Windows / Linux x64 or arm64')
filename=f'electron-v{version}-{system}-{arch}.zip'
checksum=json.loads((package/'checksums.json').read_text())[filename]
archive=root/'.tools/downloads'/filename
archive.parent.mkdir(parents=True,exist_ok=True)
def sha(path):
    with path.open('rb') as f:
        digest=hashlib.sha256()
        for chunk in iter(lambda:f.read(1024*1024),b''):digest.update(chunk)
        return digest.hexdigest()
if not archive.exists() or sha(archive)!=checksum:
    url=f'https://github.com/electron/electron/releases/download/v{version}/{filename}'
    with urllib.request.urlopen(url,timeout=60) as response:
        with archive.open('wb') as f:
            for chunk in iter(lambda:response.read(1024*1024),b''):f.write(chunk)
assert sha(archive)==checksum,'Electron SHA-256 mismatch'
destination=package/'dist'
destination.mkdir(exist_ok=True)
with zipfile.ZipFile(archive) as bundle:
    for member in bundle.infolist():
        (destination/member.filename).resolve().relative_to(destination.resolve())
    bundle.extractall(destination)
    if system=='linux':
        for member in bundle.infolist():
            mode=(member.external_attr>>16)&0o777
            if mode:(destination/member.filename).chmod(mode)
(package/'path.txt').write_text('electron.exe' if system=='win32' else 'electron',encoding='utf-8')
print(f'Electron {version} verified and installed ({archive.stat().st_size:,} bytes)',flush=True)
