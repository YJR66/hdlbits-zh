@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20.11 或更高版本，然后重新运行。
  pause
  exit /b 1
)
echo 正在启动 HDLBits 中文本地学习版…
echo 请在浏览器打开 http://127.0.0.1:4173
node server.mjs
pause
