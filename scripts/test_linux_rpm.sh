#!/usr/bin/env bash
# Validate the RPM payload without installing it onto the build host.
# Run under xvfb-run in headless CI, as an unprivileged user.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
if [[ "$(uname -s)" != Linux ]]; then echo '此检查需要 Linux。' >&2; exit 1; fi
version=$(python3 -c 'import json; print(json.load(open("package.json"))["version"])')
package=$(realpath "${1:-release/HDLBits-zh-$version-linux-x64.rpm}")
for command in rpm rpm2cpio cpio desktop-file-validate; do
    command -v "$command" >/dev/null || { echo "缺少测试工具：$command" >&2; exit 1; }
done
rpm --checksig "$package"
python3 scripts/verify_linux_rpm.py "$package"
mkdir -p output
extracted=$(mktemp -d "$(realpath output)/rpm-extracted.XXXXXXXX")
rpm2cpio "$package" | (cd "$extracted" && cpio -idm --quiet --no-absolute-filenames)
python3 - "$extracted/opt/HDLBits/resources" <<'PY'
import hashlib,json,sys
from pathlib import Path
resources=Path(sys.argv[1])
runtime=(resources/'runtime').resolve()
manifest=json.loads((resources/'runtime-manifest.json').read_text())
count=0
for package in manifest:
    for entry in package.get('bundledFiles', []):
        file=(runtime/entry['path']).resolve()
        assert file.is_relative_to(runtime), entry
        assert hashlib.sha256(file.read_bytes()).hexdigest() == entry['sha256'], entry
        count+=1
assert count > 0, 'Empty runtime manifest'
print(f'Runtime manifest: {count} SHA-256 checks passed')
PY
desktop-file-validate "$extracted/usr/share/applications/hdlbits-zh.desktop"
bash scripts/test_linux_package.sh "$extracted/opt/HDLBits/hdlbits-zh" output/linux-rpm-smoke.json
echo "RPM 内容验证通过：$package"
