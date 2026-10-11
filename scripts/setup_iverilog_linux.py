"""Bundle the installed Debian/Ubuntu Icarus runtime and its non-glibc libraries.

Run after: sudo apt-get install iverilog binutils
No root access or downloads are performed by this script.
"""
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / '.tools/linux/runtime'


def command(*args):
    return subprocess.check_output(args, text=True, env={**os.environ, 'LC_ALL': 'C'}).strip()


def package_for(path):
    candidates = [str(path), str(Path(path).resolve())]
    for value in list(candidates):
        if value.startswith('/usr/lib/'):
            candidates.append(value[4:])
        elif value.startswith('/lib/'):
            candidates.append('/usr' + value)
    for value in dict.fromkeys(candidates):
        result = subprocess.run(['dpkg-query', '-S', value], text=True, capture_output=True)
        if result.returncode == 0:
            return result.stdout.splitlines()[0].rsplit(': ', 1)[0]
    raise RuntimeError(f'无法确认系统文件所属的软件包：{path}')


def main():
    if platform.system() != 'Linux' or platform.machine() not in ('x86_64', 'amd64'):
        raise SystemExit('此打包脚本需要 Debian/Ubuntu Linux x86_64。')
    for tool in ('iverilog', 'vvp', 'ldd', 'dpkg-query'):
        if not shutil.which(tool):
            raise SystemExit(f'未找到 {tool}。请先安装：sudo apt-get install iverilog binutils')
    listed = command('dpkg-query', '-L', 'iverilog').splitlines()
    ivl = next((Path(p).parent for p in listed if p.endswith('/ivl/ivl')), None)
    if ivl is None:
        raise SystemExit('未找到 Icarus 的 IVL 运行时目录。')
    (DEST / 'bin').mkdir(parents=True, exist_ok=True)
    (DEST / 'lib/native').mkdir(parents=True, exist_ok=True)
    shutil.copytree(ivl, DEST / 'lib/ivl', dirs_exist_ok=True)
    sources = [Path(p) for p in listed if Path(p).is_file() and ivl in Path(p).parents]
    owners = {'iverilog'}
    for name in ('iverilog', 'vvp'):
        source = Path(shutil.which(name))
        if package_for(source).split(':')[0] != 'iverilog':
            raise SystemExit(f'{source} 不是系统软件包提供的 Icarus；请调整 PATH。')
        shutil.copy2(source, DEST / 'bin' / name)
        sources.append(source)
    seen = set()
    while sources:
        source = sources.pop()
        if source in seen:
            continue
        seen.add(source)
        with source.open('rb') as stream:
            if stream.read(4) != b'\x7fELF':
                continue
        result = subprocess.run(['ldd', str(source)], capture_output=True, text=True,
                                env={**os.environ, 'LC_ALL': 'C'})
        if 'not found' in result.stdout:
            raise RuntimeError(f'系统运行时缺少依赖：{source}\n{result.stdout}')
        for filename in re.findall(r'=>\s+(/\S+)', result.stdout):
            library = Path(filename)
            # Keep the host dynamic loader and glibc together; never mix glibc builds.
            if re.match(r'lib(?:c|m|pthread|dl|rt|resolv)\.so', library.name):
                continue
            target = DEST / 'lib/native' / library.name
            if not target.exists():
                shutil.copy2(library, target, follow_symlinks=True)
            owners.add(package_for(library))
            sources.append(library)
    licenses = DEST / 'share/licenses'
    licenses.mkdir(parents=True, exist_ok=True)
    shutil.copytree('/usr/share/common-licenses', licenses / 'common', dirs_exist_ok=True)
    ubuntu = 'ID=ubuntu' in Path('/etc/os-release').read_text()
    manifest = []
    for owner in sorted(owners):
        fields = command('dpkg-query', '-W', '-f=${binary:Package}\t${Version}\t${source:Package}\t${source:Version}', owner).split('\t')
        package, version, source, source_version = fields
        copyright_file = Path('/usr/share/doc') / package.split(':')[0] / 'copyright'
        if not copyright_file.is_file():
            raise RuntimeError(f'未找到许可证：{package}')
        destination = licenses / package.split(':')[0]
        destination.mkdir(exist_ok=True)
        shutil.copy2(copyright_file, destination / 'copyright')
        base = 'https://launchpad.net/ubuntu/+source' if ubuntu else 'https://sources.debian.org/src'
        manifest.append({'package': package, 'version': version,
                         'source': f'{base}/{quote(source)}/{quote(source_version)}/'})
    files = []
    for file in sorted(DEST.rglob('*')):
        if file.is_file():
            files.append({'path': file.relative_to(DEST).as_posix(),
                          'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    manifest[0]['bundledFiles'] = files
    (DEST.parent / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Linux runtime ready: {DEST} ({len(files)} files, {len(manifest)} packages)')


if __name__ == '__main__':
    main()
