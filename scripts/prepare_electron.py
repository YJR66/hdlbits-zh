"""Download the official Windows Electron runtime with the npm-pinned SHA-256."""
import hashlib
import json
import zipfile
from pathlib import Path
import requests

root=Path(__file__).resolve().parents[1]
package=root/'node_modules/electron'
version=json.loads((package/'package.json').read_text())['version']
filename=f'electron-v{version}-win32-x64.zip'
checksum=json.loads((package/'checksums.json').read_text())[filename]
archive=root/'.tools/downloads'/filename
archive.parent.mkdir(parents=True,exist_ok=True)
def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest()
if not archive.exists() or sha(archive)!=checksum:
    url=f'https://github.com/electron/electron/releases/download/v{version}/{filename}'
    with requests.get(url,stream=True,timeout=(20,60)) as response:
        response.raise_for_status()
        with archive.open('wb') as f:
            for chunk in response.iter_content(1024*1024):f.write(chunk)
assert sha(archive)==checksum,'Electron SHA-256 mismatch'
destination=package/'dist'
destination.mkdir(exist_ok=True)
with zipfile.ZipFile(archive) as bundle:
    for member in bundle.infolist():
        (destination/member.filename).resolve().relative_to(destination.resolve())
    bundle.extractall(destination)
(package/'path.txt').write_text('electron.exe',encoding='utf-8')
print(f'Electron {version} verified and installed ({archive.stat().st_size:,} bytes)',flush=True)
