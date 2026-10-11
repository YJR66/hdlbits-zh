#!/usr/bin/env bash
# Run as a normal desktop user (or with xvfb-run in CI); never disable the sandbox.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
if [[ "$(uname -s)" != Linux ]]; then echo '此检查需要 Linux。' >&2; exit 1; fi
app=${1:-release/linux-unpacked/hdlbits-zh}
if [[ ! -x "$app" ]]; then echo "未找到可执行文件：$app" >&2; exit 1; fi
app=$(realpath "$app")
mkdir -p output
report=$(realpath output)/linux-packaged-smoke.json
# Do not inherit custom Icarus paths. The package must use its own compiler.
env -u IVERILOG_PATH -u VVP_PATH -u HDLBITS_RUNTIME_ROOT "$app" --smoke-test "$report"
python3 - "$report" <<'PY'
import json,sys
report=json.load(open(sys.argv[1]))
assert report['ok'], report
assert report['isPackaged'], report
print(json.dumps(report,ensure_ascii=False,indent=2))
PY
