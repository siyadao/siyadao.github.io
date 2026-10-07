# 阿里云静态站点部署

生产地址：<https://studio.siyadao.cn/>。本目录只维护宣传页，不修改主站、控制台和 API 的配置。

## 已配置的运行路径

| 项目 | 位置 |
| --- | --- |
| SSH 连接 | `root@47.122.118.98`，使用已配置本机密钥，密钥不进项目 |
| 版本目录 | `/var/www/siyadao-studio/releases/<UTC版本号>/` |
| 生效目录 | `/var/www/siyadao-studio/current`，指向一个完整版本 |
| Nginx 配置 | `/etc/nginx/sites-available/studio.siyadao.cn` |
| Nginx 启用入口 | `/etc/nginx/sites-enabled/studio.siyadao.cn` |
| HTTPS 证书 | `/etc/letsencrypt-studio/live/studio.siyadao.cn/` |
| ACME HTTP 验证目录 | `/var/www/_letsencrypt/.well-known/acme-challenge/` |
| 访问与错误日志 | `/var/log/nginx/siyadao-studio.{access,error}.log` |
| 证书续期任务 | `siyadao-studio-certbot-renew.timer` |

只发布 HTML、CSS、JavaScript、图标许可证和 `public/` 中已审核的产品截图、图标、样例 ZIP。项目源码、原始样例目录、测试、部署文件、SSH 密钥和应用数据不进入 Web 根目录。原始样例继续保留在 `samples/`，公开 ZIP 提供下载副本。安装包由独立下载虚拟主机提供，不进入官网静态版本目录。

备案链接使用用户确认且与主站一致的「粤ICP备2026108587号-1」。安装包公开备用仓库为 `siyadao/studio`。下载菜单按需读取官方版本 API，包含 preview，按发布时间确定展示版本；各平台独立选择最近可用安装包并标注旧版本。平台主项直接下载 `download.siyadao.cn` 的附件，旁边的 GitHub 备用仅在该包具有备用地址时出现。

每次发布安装包不再修改或部署官网页面/版本清单。打开菜单才查询，浏览器成功结果缓存一分钟并合并并发请求。官网同源 `GET /api/app/releases` 由 Nginx 按需代理固定本机上游 `http://127.0.0.1:8081/v1/app/releases`，成功响应共用一分钟缓存和并发锁；不转发客户端请求头、认证、请求体或查询参数，不配置 GitHub Token，不增加后台轮询或额外常驻进程。缓存目录为 `/var/cache/nginx/siyadao-releases`，容量上限 10 MB；使用新缓存键，不复用旧 GitHub JSON。

上游错误时允许返回服务端的上次有效缓存，使用 `X-Release-Cache: STALE/UPDATING` 驱动明确的缓存提示；浏览器也可保留本页面已获取的结果。首次请求没有缓存且遇到上游故障时仍会显示失败和重试。正常新发布通常两分钟内可见。接口契约和地址校验见项目 README。旧 `public/releases/` 文件仅保留历史记录，不参与生产下载逻辑。

旧 `GET /api/releases` 必须保留，供已安装旧版客户端检测升级。它继续代理 `https://api.github.com/repos/siyadao/studio/releases?per_page=20`，原缓存键 `siyadao-public-releases-20`、两分钟缓存、方法限制、请求隔离、TLS 校验、超时和过期缓存策略均保持不变。新旧路径使用不同缓存键和协议；官网只请求 `/api/app/releases`，新协议保持严格，不依赖旧路径，也不回退旧字段格式。

升级过渡期需继续在 `siyadao/studio` 发布支持新下载源的 GitHub Release 和安装包，使仍可访问 GitHub 的旧版客户端能够检测并升级。GitHub 不可达的旧版客户端仍需从官网下载、安装一次新版，再使用自有下载源更新。不能仅更新官方 API 就认为所有旧客户端都能升级；发布验收需分别核对两条元数据路径。

部署前需先确认 `studio-server` 的公开版本路由已运行、安装包在 `download.siyadao.cn` 可用，再更新官网 Nginx 和页面；后端 API 的本地预览 CORS 需允许 `localhost`/`127.0.0.1` 的 HTTP 预览来源，正式同源菜单不依赖 CORS。2026-10-07 已按此顺序完成部署，实际验收见下方记录。

## HTTPS 与续期

`nginx-http.conf` 仅用于首次签发证书前的 ACME 验证；签发后改用 `nginx.conf`，HTTP 自动跳转 HTTPS，ACME 验证路径除外。

原有证书续期使用全局停止/启动 Nginx 钩子。宣传页的 Certbot 配置、工作目录和日志独立，避免执行旧钩子；`/etc/letsencrypt-studio/accounts` 仅在服务器上链接既有 ACME 账号目录，账号私钥没有复制到本机或项目。

新任务每天服务器本地时间 04:00、16:00 检查续期，各加最多 30 分钟随机延迟。采用 webroot 验证，不停止 Nginx；续期成功后先校验配置，再平滑重载。没有修改原站点的续期任务。

```sh
ssh root@47.122.118.98 'sudo systemctl list-timers siyadao-studio-certbot-renew.timer; sudo systemctl status siyadao-studio-certbot-renew.service --no-pager'
ssh root@47.122.118.98 'sudo certbot certificates --config-dir /etc/letsencrypt-studio --work-dir /var/lib/letsencrypt-studio --logs-dir /var/log/letsencrypt-studio'
```

## 后续更新

需要用户明确授权后才执行。纯静态文件无构建步骤，不需要 npm、Docker 或额外常驻进程。以下命令从仓库根目录运行：

```sh
studio_release=$(date -u +%Y%m%dT%H%M%SZ)
studio_archive=$(mktemp /tmp/siyadao-studio.XXXXXX)
COPYFILE_DISABLE=1 tar --format=ustar -czf "$studio_archive" -C . \
  index.html styles.css app.js theme.js downloads.js LICENSE-icons.txt \
  public/favicon.svg public/samples/siyadao-samples.zip \
  public/screenshots/writing-current.jpg public/screenshots/sticky-current.jpg \
  public/screenshots/todo-current.jpg public/screenshots/calendar-current.jpg \
  public/screenshots/timeline-current.png public/screenshots/timeline-preview.png \
  public/screenshots/canvas-current.jpg \
  public/screenshots/notebook-current.jpg public/screenshots/database-current.jpg \
  public/screenshots/code-current.jpg public/screenshots/table-current.jpg \
  public/screenshots/tools-current.jpg public/screenshots/account-current.jpg \
  public/screenshots/writing-dark.jpg public/screenshots/sticky-dark.jpg \
  public/screenshots/todo-dark.jpg public/screenshots/calendar-dark.jpg \
  public/screenshots/timeline-dark.png public/screenshots/timeline-dark-preview.png \
  public/screenshots/canvas-dark.jpg public/screenshots/notebook-dark.jpg \
  public/screenshots/database-dark.jpg public/screenshots/code-dark.jpg \
  public/screenshots/table-dark.jpg public/screenshots/tools-dark.jpg \
  public/screenshots/account-dark.jpg \
  public/screenshots/provenance.json
shasum -a 256 "$studio_archive"
scp "$studio_archive" "root@47.122.118.98:/tmp/siyadao-studio-${studio_release}.tar.gz"
ssh root@47.122.118.98 "sha256sum /tmp/siyadao-studio-${studio_release}.tar.gz"
```

确认本机和远程 SHA-256 一致后，创建独立版本并原子切换。下面的 `test` 防止覆盖已有版本或另一项待切换部署：

```sh
ssh root@47.122.118.98 "
  set -eu
  sudo test ! -e /var/www/siyadao-studio/releases/${studio_release}
  sudo test ! -e /var/www/siyadao-studio/next
  sudo test ! -L /var/www/siyadao-studio/next
  sudo install -d -m 755 /var/www/siyadao-studio/releases/${studio_release}
  sudo tar --no-same-owner -xzf /tmp/siyadao-studio-${studio_release}.tar.gz -C /var/www/siyadao-studio/releases/${studio_release}
  sudo chmod -R u=rwX,go=rX /var/www/siyadao-studio/releases/${studio_release}
  sudo ln -s releases/${studio_release} /var/www/siyadao-studio/next
  sudo mv -Tf /var/www/siyadao-studio/next /var/www/siyadao-studio/current
"
curl --fail --silent --show-error --head https://studio.siyadao.cn/
```

更新静态文件无需重载 Nginx。若改动服务器配置，应备份现有宣传页配置，再执行 `sudo /usr/sbin/nginx -t`，通过后才 `sudo systemctl reload nginx`。不要替换整个 `/etc/nginx/nginx.conf` 或旧站点的 `little-seed` 配置。

旧版本保留，必要时确认旧版本路径后，用新的临时符号链接和 `mv -Tf` 将 `current` 切回。不要清空 Web 根目录后再上传。

## 发布验收边界

分别核对 DNS、HTTPS 域名与证书链、HTTP 重定向、页面及全部静态资源响应、公开文件 SHA-256、备案链接、样例 ZIP 和原有站点状态。Nginx 配置检查、HTTP 检查、单元测试和浏览器交互验收是不同证据，不能互相替代。

测试按受影响行为选择；页面交互只有实际验证后才能标记通过。证书尚未到期时，续期服务正常退出仅说明任务能够运行，不等同于已经完成一次到期续期。

### 2026-09-06 首次发布记录

- 版本：`20260906T151815Z`。权威 DNS 的 A 记录为 `47.122.118.98`，未配置 AAAA。
- 公网 HTTPS 返回 200，证书域名为 `studio.siyadao.cn`，证书有效期截止 2026-12-05；HTTP 返回 301 并保留原路径和查询参数。
- 全部 16 个公开文件经 HTTPS 下载后，SHA-256 与本机一致。样例 ZIP 包含六份源文件和 README，CSS、JS、ZIP 的响应类型正确。
- `.git`、部署配置、项目 README 和不存在的路径返回 404。临时 ACME 验证文件已清理。
- Nginx 配置校验通过，发布前后主进程 PID 均为 `50388`；旧 `little-seed` 配置 SHA-256 未改变。主站与控制台仍返回 200，API 根路径仍返回原有的 404。
- 独立续期定时器已启用，手动运行续期检查返回成功；本次新证书尚未到续期窗口，未强制续期或执行续期演练。
- 本次只做语法、配置与发布链路验证，未执行单元测试或整页浏览器交互验收。

### 2026-09-07 双平台下载入口更新

- GitHub 已公开 `v0.1.0-preview.1`，同时提供 macOS ARM64 DMG、Windows x64 ZIP 和 SHA-256 清单。
- 服务器版本切换为 `20260906T181350Z`。上传归档 SHA-256 为 `ca2df99ed4919c673300f17a3400ddf3986556668c0fd3b4f2c8a607b5916966`，本机与远程一致。旧版本 `20260906T151815Z` 保留，可回滚；没有重载 Nginx。
- 仅更新 `app.js`、`downloads.js` 并新增 `public/releases/v0.1.0-preview.1.json`。其余 14 个公开文件与旧版逐项一致，原始样例仍保留在项目中。
- 全部 17 个公开文件经 HTTPS 下载校验一致；JSON 响应类型正确，主站继续返回 200，旧 `little-seed` 配置 SHA-256 不变。
- 两个附件的匿名 HTTP 完整下载与 SHA-256 验证通过，响应为文件附件，不是 GitHub 版本页面。菜单在实际浏览器中显示这两条直链；自动化 Chrome 的实际 Windows 下载被客户端拦截，随后下载事件失败，因此不能记录为浏览器下载验收通过。未修改浏览器安全设置。
- 未执行单元测试方法；浏览器点击下载限制与 HTTP 下载验证是不同证据。

### 2026-09-07 动态版本与同源缓存

- 静态站点版本 `20260907T120929Z`，此前动态下载版本 `20260907T114617Z` 保留。新增缓存部署只变更 `downloads.js`，页面、样例、截图和样式保持原样。
- `downloads.js` 的本地、服务器及公网 SHA-256 均为 `79ab11c39538caf9b748c8b7f5b601484d405e98b40d6b575a65ed198c5e6d95`。
- 旧 Nginx 虚拟主机配置保留在 `/etc/nginx/studio-before-release-cache-20260907T120929Z.conf`；新配置 SHA-256 为 `115adc8ec2897b9ebaea1dc12a590485dd769fa9e238cb661894bd56ec9fc1fe`。配置检查通过后平滑重载，主进程 PID 仍为 `50388`。
- `/api/releases` 实际匿名请求返回 200，首次 `MISS`、随后 `HIT`；POST 返回 403。旧 `little-seed` 配置 SHA-256 仍为 `802727b36aa47ca22a47ea13f2a57ca8b754b8419b8add115175df455d854e89`，主站仍返回 200。
- 浏览器刷新后首次打开菜单读取成功，显示 `v0.1.1-preview` 及对应 macOS 直链。Windows 当时仍在构建，正确显示旧包及旧版本号；新版附件上传后由同一逻辑自动选取，不另改页面。
- 已通过 JavaScript 语法检查，未执行单元测试方法；没有对生产上游实施故障注入，服务端过期缓存提示仅新增聚焦用例，不能标记为已完成故障演练。

### 2026-10-07 官方安装包下载

- 官网与后端部署版本均为 `20261007T072713Z`，官网此前版本 `20260907T120929Z` 保留。静态归档 SHA-256 为 `66c8dcba8b0695c4647b072f8a1ea583447838d197692c98612ffef8cead9008`；Nginx 配置 SHA-256 为 `faa1afff03a9d5aba31b0ecd4c72becf9a4e8e83ba172d60fa63a6cf8cd43b19`。
- `download.siyadao.cn` 权威 A 记录为 `47.122.118.98`。独立 HTTPS 证书有效至 2027-01-05，自动续期定时器已启用；手动检查成功，尚未发生到期续期。
- 已完整镜像原 `v0.1.1-preview` 的 macOS ARM64 DMG、Windows x64 安装 EXE 和 ZIP，共约 94 MiB。没有重打包、替换或新增桌面版本；原 GitHub 文件大小和 SHA-256 与官方 HTTPS 完整下载一致。
- 官网菜单通过 `/api/app/releases` 获取正式契约，两次请求正常并命中 `HIT`；原 `/api/releases` 的 GitHub 契约仍可访问并命中 `HIT`。全部 16 个公开静态文件的公网 SHA-256 与发布源文件一致。
- 实际浏览器点击已展示 macOS 和 Windows 官网直链及 GitHub 备用，未发布架构保持不可下载。26 个下载单元测试通过。HTTP 验收覆盖完整包哈希、HEAD、Range/206、ETag/304、附件响应、缓存及隐藏文件/目录拒绝；没有把 HTTP 验证记作浏览器下载安装验收。
- 主站、控制台、LittleSeed readiness、Studio 健康检查均保持 HTTP 200；原 LittleSeed Nginx 配置 SHA-256 不变。原官网配置和版本指向已保存于服务器 `/var/backups/studio-server/20261007T072713Z/`，可单独恢复官网。
- 桌面端新下载源与自动更新逻辑尚未打包发布；当前镜像安装包仍是原版本。需要发布新桌面版本后，该逻辑才能进入用户安装的应用。

### 2026-10-07 功能说明与最新日历展示

- 官网版本 `20261007T085202Z`，上一版本 `20261007T072713Z` 保留，可原子切回。归档 SHA-256 为 `a792ec436cab0832a7e2058bc3b6964bd015a741534795e11b1b7f0244659047`，本机与上传文件一致；只切换静态版本，没有重载 Nginx，配置哈希保持 `faa1afff03a9d5aba31b0ecd4c72becf9a4e8e83ba172d60fa63a6cf8cd43b19`。
- 依据当前源码更新日历、笔记时间线、文稿、白板、代码、Python / Notebook、数据库、书库、词汇表、CLI、16 项工具、账号、九类可选同步与更新说明。说明默认空间无需 Git、首次同步总开关关闭、临时中继不是永久云备份，并区分开发功能与公开安装包。
- 十二个场景：十一张隔离演示应用的真实 CUA 截图；最新独立时间线由同一生产视图的原生验证程序渲染为透明 PNG。时间线预览只裁去外围透明空白，完整原图保留；页面和 provenance 明确区分其来源，没有界面合成。月历使用最终最新桌面构建重新拍摄，未发布旧内嵌时间线图片。
- 新增 CSV、含真实内核运行输出的 Notebook 和 Python 样例；更新 SQLite 与生产 CLI 复现说明。样例 ZIP 包含九份源文件和 README，共十个 UTF-8 文件。
- 实际浏览器验证十二页签点击、方向键 / Home / End、原图弹窗关闭 / Escape / 背景点击及焦点返回、三个下载菜单互斥与官网 / GitHub 链接。检查 320、390、1440、1920 像素宽度，页面无横向溢出，下载菜单未越出视口；新时间线 PNG 的展示与放大另行复验。
- JavaScript 语法及 diff 检查通过，26 个现有下载测试通过。全部 21 个公开文件经 HTTPS 下载后 SHA-256 与本机一致；新旧版本 API、原主站、控制台和 LittleSeed readiness 均为 HTTP 200。没有执行新版安装验收，也没有打包或发布新桌面安装包。

### 2026-10-07 原有风格恢复、渐进浏览与双主题

- 官网版本 `20261007T123333Z`，上一版本 `20261007T085202Z` 保留。静态归档 SHA-256 为 `ae4165b2ce314c30da9a1db6359168f1f7d0b0fcbe3e6a7fa76702ab54feb8b6`，本机与远程一致；切换前逐项校验版本文件，使用原子链接切换，没有重载 Nginx。官网配置 SHA-256 仍为 `faa1afff03a9d5aba31b0ecd4c72becf9a4e8e83ba172d60fa63a6cf8cd43b19`。
- 恢复原有蓝色视觉、首屏布局与叠窗构图，保留更新后的功能说明、日历、独立笔记时间线、样例和官方下载。十二场景分为三组，每次显示四个页签；十四项详细说明默认收起，区块随滚动显露，开发与同步说明采用组内互斥展开。
- 新增页眉浅色 / 深色切换，首次访问默认深色，浏览器本地保留选择。页面配色、所有截图预览和放大原图同步切换；新增十一张深色原生应用实拍及深色独立时间线原生窗口 PNG，保留浅色原图，不通过滤镜改色。二十二张 CUA 实拍及两张时间线原图的来源与哈希记录在 `provenance.json`。
- 本地实际浏览器验证两种主题的三组十二场景、方向键 / Home / End 的组内焦点、时间线完整原图 / Escape / 焦点返回、说明展开与互斥、滚动显露、三个下载入口和官方直链。检查 320、390、1280、1920 像素宽度，无页面横向溢出；窄屏下载菜单保持在视口内。
- 线上实际浏览器验证默认深色、浅色切换、刷新保留选择、对应日历截图及安装包菜单。全部 35 个公开静态文件通过 HTTPS 下载后 SHA-256 与本机一致；官网新旧版本 API、Studio API / 健康检查、主站、控制台和 LittleSeed readiness 均返回 HTTP 200。
- JavaScript 语法、diff 检查及 26 个现有下载测试通过。本次没有发布新桌面安装包，官网仍明确区分开发版展示与现有公开安装包；未执行新版安装验收。

### 2026-10-07 主题与功能介绍切换动画

- 官网版本 `20261007T152533Z`，归档 SHA-256 为 `db19bd95b7bdc4ef303773996f79d4e784a22744967ab19ba663e37f20dd5464`。前一动画版本 `20261007T151803Z` 与原有双主题版本 `20261007T123333Z` 保留；切换前校验归档和全部 35 个服务器文件，使用原子链接切换，没有修改或重载 Nginx。
- 主题使用 300 毫秒整页淡入淡出，只对可见截图等待解码，最多 250 毫秒；不支持整页 View Transition 时使用背景颜色过渡与轻量淡入。动画结束恢复交互，快速切换取消旧的淡入。
- 分类与场景切换时，截图和文案使用 260 毫秒淡入及 10px 位移；选中入口同步过渡。详情使用原生 details 的高度与透明度过渡，不支持高度插值的浏览器只在展开时淡入。减少动画设置下立即切换。
- 实际浏览器验证场景动画的初始透明度 / 位移和结束后恢复、连续场景切换、分类切换、Home 键焦点、详情展开 / 收起 / 互斥；只有一个场景可见，无横向溢出。主题切换后截图来源匹配主题。未改动系统减少动画设置做原生验收。
- JavaScript 语法与 diff 检查通过；变更的 app.js、styles.css 经 HTTPS 下载后 SHA-256 与本机一致，官网及新旧下载 API 均返回 HTTP 200。没有修改下载协议或发布桌面安装包。

### 2026-10-08 MacBook 风格的功能展示过渡

- 官网版本 `20261007T161942Z`，归档 SHA-256 为 `fd4c3d757d24502982698a6b2b7f6a48cd83f316c1fb4f74665f7a58705a6a56`。前一版本 `20261007T160258Z` 和原风格版本 `20261007T123333Z` 保留；校验归档与全部 35 个服务器文件后原子切换。Nginx 配置 SHA-256 保持不变，没有重载服务。
- 功能截图按浏览方向滑入并轻微缩放，旧画面退出，文案延后 140 毫秒浮现；整段约 560 毫秒。使用 Web Animations 叠放两幅画面，退出画面不接收点击或焦点。移除会影响连续点击响应的整页快照方案，快速操作取消旧动画，只呈现最后一次选择。
- 增加左右箭头与十二个场景的计数，跨分类自动选组，首尾禁用并正确转移焦点；截图支持横向拖动，阻止浏览器默认拖拽链接，普通点击继续放大。主题使用 300 毫秒颜色过渡与轻量淡入，截图准备最多等待 250 毫秒，其他入口仍能操作。
- 本地实际浏览器验证全部十二个场景连续前进及返回、反向动画帧、分类切换、Home / End 焦点、主题切换时选择其他场景、鼠标横向拖动且不误开放大、普通点击放大及关闭后的焦点恢复。320px 宽度下十二个展示区域均高 483.75px，无横向溢出；390px 布局亦无横向溢出。
- 线上实际浏览器验证连续切换、跨分类、主题过渡时切换场景和深浅截图来源。动画完成后只显示最终场景。公开 HTML、CSS、JavaScript 的 HTTPS SHA-256 与发布源一致，官网及新旧两个下载接口均为 HTTP 200。JavaScript 语法、diff 检查通过，原有 26 个下载测试通过。
- 未进行实体手机触屏、系统减少动画设置或其他浏览器内核的原生验收。本次没有发布新的桌面安装包。
