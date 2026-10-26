# 思芽岛产品宣传页

原生 HTML、CSS 和少量 JavaScript。没有 React、Vue、Vinext、组件库、npm 依赖、打包步骤或托管运行时。

## 本地预览

在仓库根目录运行：

```sh
python3 -m http.server 3001 --bind 127.0.0.1 --directory .
```

打开 `http://127.0.0.1:3001/`，修改后刷新即可。直接打开 `index.html` 可以查看静态页面，但下载菜单需要 HTTP 本地预览和后端允许的 CORS 来源。只监听本机，不上传、不推送、不部署，不使用隧道或外网调试。详细检查项见 [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md)。

## 线上站点

中文站为 <https://studio.siyadao.cn/>。英文站为 <https://siyadao.github.io/>。英文站由 `siyadao/siyadao.github.io` 的 Actions 读取本仓库 `main` 后渲染发布，不经过中文站服务器。

## 文件结构

- `index.html`：产品介绍、三组十二场景、按需展开的说明、下载入口和原生弹窗。
- `styles.css`：原有蓝色视觉、浅色与深色主题、叠窗展示、移动端适配和减少动画支持。
- `theme.js`：在样式加载前恢复主题；首次访问默认深色。
- `i18n.js`：中文站与英文站。线上中文站的 EN 打开 GitHub Pages，英文站的「中文」回到中文站。本机预览仍在本页切换，`?lang=en` 可直接打开英文。
- `robots.txt`、`sitemap.xml`：允许抓取，并收录中文首页与英文地址。
- `public/og.png`：1200×630 分享图，供链接预览使用。
- `app.js`：主题与对应截图切换、分组页签、滚动渐进展示、键盘操作、截图放大、下载菜单及反馈入口。
- `downloads.js`：官方版本 API、数据校验、按需请求和安装包匹配。
- `public/screenshots/`：原始产品截图及 `provenance.json` 拍摄记录。
- `samples/山野手记/`：九份样例源文件和使用说明，长期与源码一起保留。
- `public/samples/siyadao-samples.zip`：全部样例和说明的下载副本。
- `scripts/package-samples.py`：重新生成 UTF-8 文件名样例包。
- `LICENSE-icons.txt`：页面内嵌线性 SVG 图标的许可证；图标无需运行时依赖或外部请求。

## 样例与真实截图

样例覆盖 Markdown、Excalidraw、Rust、JSON、便签参考、嵌套 TODO、CSV、Notebook 和 Python。维护以 `samples/山野手记/` 的源文件为准。

当前场景图于 2026-10-25 从本机调试构建实拍，来源提交 `d1794abd`，工作区另有未提交改动；2026-10-26 同隔离空间补拍文稿旁的公众号手机预览（浅色 / 深色）。演示内容由生产 CLI 写入新建空间，未读取或改写个人工作区。`samples/山野手记/` 的九份源文件和 Notebook 里已有的内核输出原样保留，没有重新执行或改写。月历、日视图、文稿、手机预览、白板、代码、Notebook、表格、便签、待办、工具集、设置和自动化工作流都是主窗口实拍。日视图时间线小卡只裁出左侧时间线，放大仍打开完整日视图。数据库画面是工作台和系统库，不是一条已执行的查询结果。没有拼接、重画、改色或文字替换。尺寸、动作和 SHA-256 见 `public/screenshots/provenance.json`。

页面恢复原有蓝色视觉与叠窗构图。场景按「日常记录」「创作与开发」「更多功能」浏览，每组只展示四个页签；详细说明默认收起，区块随滚动逐步出现。页眉太阳 / 月亮按钮切换主题，同时更换全部截图预览与原图链接，使用 300 毫秒颜色过渡与轻量淡入；只等待可见截图解码，最多 250 毫秒，不暂停页面输入。减少动画时立即切换。选择保存在浏览器本地，刷新后保持；禁用本地存储时仍可切换本页主题。

功能介绍参考 MacBook 产品页的展示节奏，保留原有叠窗构图。场景切换时截图按前后方向滑入、轻微缩放，文案延后 140 毫秒浮现，整段约 560 毫秒；只有展示区域变化，页面保持稳定。分类、页签、左右箭头及画面横向拖动 / 触屏滑动共用同一选中状态；箭头可连续浏览十二个场景并自动切换分类，首尾禁用，显示当前位置。向下滚动时，展示区保持在视口中并依次经过全部十二个场景，最后一个出现后才进入下面的内容；向上滚动按相反顺序返回。横向拖动仍切换场景，不会误开原图，普通点击继续支持放大。使用 Web Animations 叠放退出与进入的画面；退出画面不接收点击或焦点，也不进入辅助功能树。快速切换取消旧过渡并合并未执行的图片准备，选中状态和计数立即响应。详细说明展开、收起使用原生 `details` 的高度与透明度过渡；不支持原生高度插值的浏览器只在展开时淡入。减少动画时这些交互立即完成。

页面展示准备发布的新版本实际画面。下载菜单仍指向已经公开的安装包，新版本上线后自动换成对应安装包。同步为十类逐项开关，首次总开关关闭；文件按需补齐和临时中继不等同于永久云备份。

复现内容可运行 `scripts/prepare-capture-workspace.py`，要求新建隔离目录，并让拍摄应用使用相同的 `SIYADAO_CLI_DATA_DIR`。不能用旧 Markdown 文件位置替代 SQLite 存储。详情见样例 README。

更新样例下载包：

```sh
python3 scripts/package-samples.py
```

## 安装包与反馈

保留 macOS M 芯片、macOS Intel、Windows x86_64、Windows ARM64、Linux x86_64、Linux ARM64 六种平台入口。

版本名和各平台链接来自官方服务 `GET https://studioapi.siyadao.cn/v1/app/releases`，包括稳定版与预览版。官网正式使用同源 `/api/app/releases`，结果缓存一分钟；本地预览直接请求官方 API，后端需允许官网和本机 HTTP 预览的 CORS 来源。

旧 `/api/releases` 仍供已安装旧客户端升级过渡；官网不使用它，新协议不回退旧字段。旧客户端无法访问 GitHub 时，仍需从官网下载并安装一次新版。

用户打开下载菜单时才发起匿名请求，多个入口合并请求，浏览器成功结果缓存一分钟。各平台主下载优先使用 GitHub 完整地址；官网与 GitHub 都有时，旁边显示「备用」并指向 `https://download.siyadao.cn/v<version>/<name>`。只有 GitHub 时不显示「备用」；GitHub 为 null 时主下载落到官网，旁边不再重复「备用」。浏览器不探测 GitHub 可达性。各平台独立选择自己最近可用的安装包，允许版本不一致，并在每一项上标明该平台版本；同版本优先 DMG、Windows Setup、AppImage 等安装包。缺少的架构禁用。`window.SIYADAO_REPOSITORY` 仅控制问题反馈入口，默认指向 `siyadao/studio` 的 GitHub Issues，不控制元数据或下载来源。

接口返回最多 20 个发布的 JSON 数组，每条具有 `version`（不含 `v` 的 SemVer）、`prerelease`、`published_at`（RFC3339）、`notes` 和 `assets`。每个附件包含 `name`、`size`（正整数且不超过 1 GiB）、`sha256`（64 位十六进制）、`sources: { official, github }`。`github` 为完整 URL 或明确的 `null`；`official` 必须为 `https://download.siyadao.cn/v<version>/<name>`，`github` 非空时必须为 `https://github.com/siyadao/studio/releases/download/v<version>/<name>`。有 `github` 时菜单主按钮使用该地址；同时有 `official` 时旁边「备用」使用官网地址。文件名使用 `siyadao-v<version>-<macos|windows|linux>-<arm64|x64>` 加对应系统的安装格式后缀。响应限制 2 MiB、每发布最多 64 个附件；错误字段、大小、哈希、版本或地址使整次请求失败，不回退旧 GitHub 数据格式。

服务器上传并校验文件后才发布版本，官网不需要逐版修改。首次失败显示重试；已有结果刷新失败时保留上次有效版本并明确提示。服务端返回过期缓存时通过 `X-Release-Cache` 显示同样提示，不伪装成最新版本。`public/releases/` 仅保留历史记录，已不参与下载逻辑。浏览器直接下载文件，SHA-256 在这里校验的是元数据格式，实际文件内容校验由发布服务和桌面更新器负责。

聚焦测试：`node --test tests/downloads.test.mjs`。浏览器交互验收应另行运行，不能用解析测试代替。

## 迁移说明

旧框架源码及托管配置已在本机临时目录备份后从项目移除，不再参与预览。2026-10-26 已把更新后的说明、滚动场景、书脊与 Git 实拍发布到生产站点。下载菜单仍读取已经公开的安装包。
