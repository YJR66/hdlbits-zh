#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' '未找到 Node.js。请先安装 Node.js 20.11 或更高版本，或下载免安装的 Linux AppImage。' >&2
  exit 1
fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<20 || (a===20 && b<11)){console.error("需要 Node.js 20.11 或更高版本。");process.exit(1)}'
exec node server.mjs "$@"
