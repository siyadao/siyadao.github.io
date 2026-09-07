# 思芽岛产品宣传页

原生 HTML、CSS 和少量 JavaScript。没有 React、Vue、Vinext、组件库、npm 依赖、打包步骤或托管运行时。

## 本地预览

在仓库根目录运行：

```sh
python3 -m http.server 3001 --bind 127.0.0.1 --directory .
```

打开 `http://127.0.0.1:3001/`，修改后刷新即可。也可以直接打开 `index.html` 查看页面。只监听本机，不上传、不推送、不部署，不使用隧道或外网调试。详细检查项见 [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md)。

## 阿里云发布

生产地址为 <https://studio.siyadao.cn/>。2026-09-06 经用户明确授权，使用现有阿里云服务器的 Nginx 发布纯静态文件，不使用 Sites、Docker 或 Node.js 服务。

本地预览仍是默认工作方式，后续部署和 Git 推送需要各自明确授权。服务器目录、独立证书续期和更新步骤见 [deploy/README.md](deploy/README.md)。

## 文件结构

- `index.html`：产品介绍、六场景截图、下载入口和原生弹窗。
- `styles.css`：完整静态样式，保留深色科技感、悬浮叠图、移动端适配和减少动画支持。
- `app.js`：页签切换、键盘操作、截图放大、下载菜单及反馈入口。
- `downloads.js`：公开发布仓库配置、按需请求和安装包匹配。
- `public/screenshots/`：原始产品截图及 `provenance.json` 拍摄记录。
- `samples/山野手记/`：六份样例源文件和使用说明，长期与源码一起保留。
- `public/samples/siyadao-samples.zip`：全部样例和说明的下载副本。
- `scripts/package-samples.py`：重新生成 UTF-8 文件名样例包。
- `LICENSE-icons.txt`：页面内嵌线性 SVG 图标的许可证；图标无需运行时依赖或外部请求。

## 样例与真实截图

样例覆盖 Markdown、Excalidraw 白板、Rust、JSON、便签墙和三级 TODO。维护时以 `samples/山野手记/` 的源文件为准，不把它们当作拍摄后的临时文件。

七张主要产品截图于 2026-09-06 在现有“思芽岛 QA”macOS 应用中拍摄（应用构建时间 2026-09-05），未经合成或文字替换；魔法球收起状态的小尺寸原图也作为素材保留。便签和 TODO 拍摄经用户授权临时使用演示数据，拍完恢复原文件并逐字节核对一致。网站只显示截图，不读取或改写应用数据。

更新样例下载包：

```sh
python3 scripts/package-samples.py
```

## 安装包与反馈

保留 macOS M 芯片、macOS Intel、Windows x86_64、Windows ARM64、Linux x86_64、Linux ARM64 六种平台入口。

`downloads.js` 顶部的 `window.SIYADAO_REPOSITORY` 指向公开安装包仓库 `siyadao/studio`。版本名和各平台链接自动读取 GitHub 最近 20 个公开 Release（包含 preview），不再写死版本或依赖每次手动更新同源清单。

用户打开下载菜单时才发起一次匿名请求，不需要后端、API Key 或 Token；多个入口合并请求，成功结果缓存一分钟。各平台独立选择最近可用安装包，并明确显示旧版本；只接受所属公开仓库及对应版本的 `/releases/download/` 链接。草稿不会出现，缺少的架构禁用，问题反馈指向 GitHub Issues。

建议附件名包含版本、平台和架构，例如 `siyadao-v0.1.1-preview-macos-arm64.dmg`。以后在 GitHub 完成新版附件上传并公开发布即可，官网不需要逐版修改。匿名 API 有限流与网络可用性限制：首次失败显示重试；已有结果刷新失败时显示上次有效版本及明确的缓存提示，不能宣称绝对实时。`public/releases/` 仅保留历史记录，已不参与下载逻辑。

## 迁移说明

旧框架源码及托管配置已在本机临时目录备份后从项目移除，不再参与预览。框架迁移本身未改动远程站点；随后按用户单独授权发布到上述阿里云地址。截图、样例源文件和 ZIP 保持原样。
