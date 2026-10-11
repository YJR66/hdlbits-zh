# HDLBits 中文本地学习版

参考 [HDLBits](https://hdlbits.01xz.net/wiki/Main_Page) 的布局和题库结构实现的本地学习工作台，**不是原站完整镜像或逐字翻译版**。网站仅在本地运行，不部署到公网。

## 启动

### Windows 单文件桌面版

从 [Windows 发布页](https://github.com/YJR66/hdlbits-zh/releases/tag/v1.0.0) 下载 `HDLBits-zh-Windows-x64.exe`（与本地构建的 `HDLBits-中文练习.exe` 相同）。源码仓库不包含生成的 EXE 或第三方运行时二进制。

双击 `HDLBits-中文练习.exe` 即可打开独立桌面窗口，无需安装 Node.js、Python、浏览器或 Icarus Verilog。适用于 Windows 10/11 x64；题库、图像、波形组件及编译仿真运行时均已内置，使用时无需联网。

程序通过内置协议读取资源，不启动 HTTP 服务、不占用 4173 端口。可与网页版同时运行。单文件启动器会自动解压到临时目录，无需手动解压或安装，也不需要管理员权限。

学习记录保存在 `%APPDATA%\HDLBits-Desktop`，关闭后再次打开仍保留。网页版已有进度可在“资料与备份”导出 JSON，再导入桌面版；两者不会自动共享浏览器记录。

### Linux 桌面版（x86_64）

从 [Releases](https://github.com/YJR66/hdlbits-zh/releases/latest) 下载 Linux AppImage 或 `.deb`。两者内置 Node/Electron、题库、图像与 Linux 原生 Icarus Verilog，无需另装 Node.js、Python 或编译器，启动后可离线使用。

**AppImage 单文件运行：**

```bash
chmod +x HDLBits-zh-1.1.0-linux-x64.AppImage
./HDLBits-zh-1.1.0-linux-x64.AppImage
```

也可在文件属性中勾选“允许作为程序执行”，之后双击启动。需要有图形桌面的 Linux x86_64；构建基线为 Ubuntu 22.04（glibc 2.35），不适用于 ARM64、Alpine/musl 或纯命令行服务器。

若系统缺少 FUSE 2，可在 Ubuntu 22.04 安装 `sudo apt install libfuse2`，或不安装 FUSE，使用 AppImage 自解压运行：

```bash
./HDLBits-zh-1.1.0-linux-x64.AppImage --appimage-extract-and-run
```

**Ubuntu/Debian 安装包：**

```bash
sudo apt install ./HDLBits-zh-1.1.0-linux-x64.deb
hdlbits-zh
```

安装后也能从应用菜单打开“HDLBits 中文练习”。对于限制非特权用户命名空间的系统（如部分 Ubuntu 24.04 配置），优先使用 `.deb` 安装包，让系统正确配置 Electron 沙箱；不要以 root 身份启动桌面程序。

AppImage 仍使用系统的图形桌面库；精简桌面系统若提示缺少 GTK/NSS/音频库，请使用 `.deb`，由包管理器处理依赖。学习记录默认保存在 `~/.config/HDLBits-Desktop`，设置 `XDG_CONFIG_HOME` 时位于该目录下的 `HDLBits-Desktop`。跨平台迁移可使用界面中的 JSON 导出/导入。

### 网页版

双击 `启动中文版.cmd`，再打开 **http://127.0.0.1:4173**。

也可在本目录执行：

```powershell
npm start
```

需要 Node.js 20.11 或更高版本。日常运行不需要 npm 安装步骤、Python、外部 CDN 或网络连接。

首次从源码克隆后，Windows 上的编译与仿真还需要准备 Icarus Verilog 运行时（此步骤需要 Python 和网络；仅安装到项目的 `.tools/`，不修改系统 PATH）：

```powershell
python -m pip install -r requirements-dev.txt
python scripts/setup_iverilog.py
```

非 Windows 系统可安装 Icarus Verilog，并确保 `iverilog`、`vvp` 位于 PATH 中。

Linux 源码启动（先准备 Node.js 20.11+）：

```bash
sudo apt install iverilog  # Ubuntu / Debian
bash start-linux.sh
# 浏览器打开 http://127.0.0.1:4173
# 修改端口：PORT=4174 bash start-linux.sh
```

Fedora 可用 `sudo dnf install iverilog`，Arch 可用 `sudo pacman -S iverilog`。源码网页版不依赖桌面环境，可在 Linux 上使用系统 Icarus；预编译桌面包目前仅提供 x86_64。

停止服务：在启动窗口按 Ctrl+C。端口冲突时可使用 `$env:PORT=4174; npm start`，并打开对应端口。不同端口与 `localhost`/`127.0.0.1` 属于不同的浏览器存储空间，迁移时请先导出备份。

## 收录内容

- 182 道题：178 道主线练习、4 道 CS450 扩展练习。
- 中文标题、题意说明及 Verilog 顶层端口声明。题目正文保留，仅移除“中文题意摘要”标题和“查看英文原题”入口；来源地址仍保留在数据文件中。
- 75 张不同的电路图、52 组 WaveDrom 参考波形，以及参考表格。
- 首页、完整分类目录、搜索、前后题导航、侧边题库、学习统计、资料与帮助页。
- 代码编辑、语法着色、行号、Tab 缩进、Ctrl+Enter 运行、自动保存、源码导入/下载、学习笔记。
- 每题最多六次本地运行历史；学习数据可通过 JSON 导出、导入。
- 本地 Icarus Verilog 编译与仿真实验台；VCD 波形预览、下载。
- 72 道练习的独立本地输出测试。具体清单由 `judge.mjs` 中的 `references` 定义。

## 不包含的部分

1. 中文题面是重新组织的摘要，不是原站完整正文的逐字译文。部分复杂题的详细条件需核对原题。
2. 没有原站账号、用户记录、在线排名、服务器数据库或隐藏测试用例。
3. 不包含 Quartus 综合及 ModelSim 原站判题服务；本地 Icarus 编译/仿真与原站并不等价。
4. 本地测试检查采样输出，不检查门类型、模块实例数等结构限制。宽向量和时序电路采用有限采样，不是形式验证。
5. 暂无本地测试的题目只提供编译检查，不会被自动标记为通过。
6. 原站提供的子模块实现并不公开包含在本项目内。涉及 `mod_a`、`add16`、`my_dff` 等依赖时，应在本地代码中加入自己的实现。缺失依赖会得到真实编译错误。
7. 调试题收录中文任务摘要，不包含原站完整错误代码或答案。

## 数据与目录

```text
dist/                   可直接运行的前端、中文题库及本地图像
  app.js                路由、交互、浏览器存储、编辑器、波形查看
  style.css             桌面和窄屏样式
  problems.json         182 道练习的数据
  vendor/               WaveDrom 与许可证
data/zh.txt              中文题意摘要源文件
data/catalog.json        题库目录与来源链接
data/assets.json         图像源地址与本地文件的映射
server.mjs               Node 本地 HTTP 服务、Icarus 调用及诊断
judge.mjs                独立参考电路、测试平台生成器与代码限制
runtime.mjs              Windows / Linux 原生运行时选择与路径处理
tests/                   数据、后端与前端交互测试
scripts/                 数据构建、资源准备、运行时安装与检查
desktop/                 Electron 窗口、内部协议与打包诊断
electron-builder.json    Windows 单文件可执行程序打包配置
electron-builder.linux.json  Linux AppImage / deb 打包配置
start-linux.sh           Linux 源码网页版启动入口
.github/workflows/linux.yml  Linux 构建、测试与产物归档
release/                 桌面版构建产物（不包含在源码归档中）
.tools/                  本项目 Windows 私有运行时及来源校验清单
.research/               构建时的参考资料缓存，不参与前端服务和源码打包
```

数据保存在浏览器 `localStorage`，不会上传到 HDLBits 或其他远端。仿真提交临时写入系统临时目录，运行后清理。不共享原站登录状态。

## 开发与测试

先按上述说明准备 Icarus Verilog，再运行：

```powershell
npm ci
npm test
npm run check
```

构建 Windows 单文件版（开发环境需要 Node.js 22.12 或更高版本；生成的 EXE 不需要用户安装 Node.js）：

```powershell
npm ci
npm run desktop:runtime
# 若尚无 .tools/ucrt64，请先运行 python scripts/setup_iverilog.py
npm run desktop:pack
```

输出为 `release/HDLBits-中文练习.exe`。开发预览使用 `npm run desktop`。构建产物会保留 Electron、WaveDrom、Icarus 及其运行时依赖的许可证；编译器来源与 SHA-256 清单随程序内置。

若 Node 下载 Electron 较慢，可改用 `python scripts/prepare_electron.py`（Linux 使用 `python3`）；它自动识别当前系统，从官方 GitHub Release 下载同一版本，并使用已固定 npm 包提供的 SHA-256 校验。

### 构建 Linux 桌面包

在 Ubuntu 22.04 x86_64 上执行，使用 Node.js 22.12+；请勿与 Windows 共用 `node_modules`：

```bash
sudo apt update
sudo apt install iverilog binutils python3 libgtk-3-0 libnss3 libasound2 libgbm1 libxss1 libfuse2 xvfb xauth fonts-noto-cjk
npm ci
npm run desktop:runtime
npm run linux:runtime
npm run check
npm test
npm run desktop:linux
xvfb-run -a npm run desktop:smoke:linux
```

`linux:runtime` 将系统软件包提供的 Icarus、IVL/VPI 模块、非 glibc 依赖库和许可证复制到 `.tools/linux/runtime`，并记录源代码地址及 SHA-256；不需要 root，也不修改系统文件。打包后通过独立路径加载这些文件，不依赖目标机安装的 `iverilog`。系统 glibc、图形库和内核由 Linux 发行版提供。

生成的 `.AppImage` 和 `.deb` 位于 `release/`。打包诊断使用临时测试资料，检查真实编译、错误答案、VCD、编辑器提交、记录保存和参考波形；报告与截图保存在 `output/`。GitHub Actions 会在 Linux 上执行相同的构建与测试，并保存安装包及校验文件。

可使用 `HDLBits-中文练习.exe --smoke-test <绝对 JSON 输出路径>` 运行打包诊断，验证内置题库、资源、真实编译和 VCD 仿真；诊断使用独立数据目录，不影响学习记录。

前端已构建，无需构建器。`npm ci` 仅用于开发工具与重新准备 WaveDrom；日常 `npm start` 不依赖 `node_modules`。

修改题意摘要后，利用本地参考缓存重建：

```powershell
python -m pip install -r requirements-dev.txt
python scripts/build_data.py
```

从公开页面重新收集技术元数据与图表：`python scripts/collect.py`。有缓存时会复用。采集脚本是构建辅助，不会在用户浏览时联网抓取内容。

重新复制波形组件：`node scripts/vendor.mjs`。

Windows 重新准备运行时：`python scripts/setup_iverilog.py`。该脚本从官方 MSYS2 仓库下载依赖包并核对 SHA-256，仅解压到 `.tools/`。许可证与对应源码链接保存在运行时包及 `.tools/manifest.json`。

其他系统可安装 Icarus Verilog 并把 `iverilog`、`vvp` 加入 PATH，或分别设置 `IVERILOG_PATH`、`VVP_PATH`。无需 Windows `.tools` 目录。

## 本地服务边界

服务只绑定 `127.0.0.1`，限制请求来源、代码大小、运行时长及并发数；拒绝外部文件包含、DPI 和文件读取等系统任务。**它不是面向不可信用户的隔离执行沙箱，不应直接暴露到公网。**

Icarus 运行结果中的英文编译诊断保留原文，方便查错；界面状态与说明为中文。

## 来源

题号、接口、电路图、参考波形与表格来自 [HDLBits 题目集](https://hdlbits.01xz.net/wiki/Problem_sets)，来源地址保留在题库数据文件中。本站不代表原作者或原站。

- WaveDrom 3.7.0：MIT，许可证见 `dist/vendor/wavedrom-LICENSE.txt`。
- Icarus Verilog：GPL-2.0-or-later。Windows 来源及依赖记录见 `.tools/manifest.json`，许可证位于 `.tools/ucrt64/share/licenses/`；Linux 对应文件为 `.tools/linux/manifest.json` 和 `.tools/linux/runtime/share/licenses/`。桌面包内统一位于 `resources/runtime-manifest.json` 和 `resources/runtime/share/licenses/`。

源码归档不含研究缓存、第三方运行时二进制或 `node_modules`，可用以上命令重建运行时。
