# 阿里云静态站点部署

生产地址：<https://studio.siyadao.cn/>。本目录只维护宣传页，不修改主站、控制台和 API 的配置。

## 已配置的运行路径

| 项目 | 位置 |
| --- | --- |
| 本机 SSH 别名 | `aliyun-siyadao`，使用本机专用密钥，密钥不进项目 |
| 版本目录 | `/var/www/siyadao-studio/releases/<UTC版本号>/` |
| 生效目录 | `/var/www/siyadao-studio/current`，指向一个完整版本 |
| Nginx 配置 | `/etc/nginx/sites-available/studio.siyadao.cn` |
| Nginx 启用入口 | `/etc/nginx/sites-enabled/studio.siyadao.cn` |
| HTTPS 证书 | `/etc/letsencrypt-studio/live/studio.siyadao.cn/` |
| ACME HTTP 验证目录 | `/var/www/_letsencrypt/.well-known/acme-challenge/` |
| 访问与错误日志 | `/var/log/nginx/siyadao-studio.{access,error}.log` |
| 证书续期任务 | `siyadao-studio-certbot-renew.timer` |

只发布 HTML、CSS、JavaScript、图标许可证和 `public/` 中已审核的产品截图、图标、样例 ZIP、公开版本清单。项目源码、原始样例目录、测试、部署文件、SSH 密钥和应用数据不进入 Web 根目录。原始样例继续保留在 `samples/`，公开 ZIP 提供下载副本。

备案链接使用用户确认且与主站一致的「粤ICP备2026108587号-1」。安装包公开仓库为 `siyadao/studio`。下载菜单按需读取 GitHub 最近 20 个公开 Release，包含 preview，按发布时间确定展示版本；各平台独立选择最近可用安装包并标注旧版本。草稿地址不得上线，平台按钮直接下载附件。

自此次动态下载改造后，每次发布安装包不再修改或部署官网页面/版本清单。打开菜单才查询，浏览器成功结果缓存一分钟并合并并发请求。官网同源 `/api/releases` 由 Nginx 按需代理固定公开仓库，成功响应共用两分钟缓存和并发锁；不转发客户端请求头、认证、请求体或查询参数，不配置 GitHub Token，不增加后台轮询或额外常驻进程。缓存目录为 `/var/cache/nginx/siyadao-releases`，容量上限 10 MB。

上游错误或限流时允许返回服务端的上次有效缓存，使用 `X-Release-Cache: STALE/UPDATING` 驱动明确的缓存提示；浏览器也可保留本页面已获取的结果。首次请求没有缓存且遇到上游故障时仍会显示失败和重试，不能宣称绝对实时或永不限流。正常新发布通常数分钟内可见。旧 `public/releases/` 文件仅保留为历史记录，不再参与生产下载逻辑。

## HTTPS 与续期

`nginx-http.conf` 仅用于首次签发证书前的 ACME 验证；签发后改用 `nginx.conf`，HTTP 自动跳转 HTTPS，ACME 验证路径除外。

原有证书续期使用全局停止/启动 Nginx 钩子。宣传页的 Certbot 配置、工作目录和日志独立，避免执行旧钩子；`/etc/letsencrypt-studio/accounts` 仅在服务器上链接既有 ACME 账号目录，账号私钥没有复制到本机或项目。

新任务每天服务器本地时间 04:00、16:00 检查续期，各加最多 30 分钟随机延迟。采用 webroot 验证，不停止 Nginx；续期成功后先校验配置，再平滑重载。没有修改原站点的续期任务。

```sh
ssh aliyun-siyadao 'sudo systemctl list-timers siyadao-studio-certbot-renew.timer; sudo systemctl status siyadao-studio-certbot-renew.service --no-pager'
ssh aliyun-siyadao 'sudo certbot certificates --config-dir /etc/letsencrypt-studio --work-dir /var/lib/letsencrypt-studio --logs-dir /var/log/letsencrypt-studio'
```

## 后续更新

需要用户明确授权后才执行。纯静态文件无构建步骤，不需要 npm、Docker 或额外常驻进程。以下命令从仓库根目录运行：

```sh
studio_release=$(date -u +%Y%m%dT%H%M%SZ)
studio_archive=$(mktemp /tmp/siyadao-studio.XXXXXX)
COPYFILE_DISABLE=1 tar --format=ustar -czf "$studio_archive" -C . \
  index.html styles.css app.js downloads.js LICENSE-icons.txt \
  public/favicon.svg public/samples/siyadao-samples.zip \
  public/screenshots/canvas.jpg public/screenshots/code.jpg \
  public/screenshots/writing.jpg public/screenshots/tools.jpg \
  public/screenshots/sticky-notes.jpg public/screenshots/todo.jpg \
  public/screenshots/magic-ring.jpg public/screenshots/magic-orb.jpg \
  public/screenshots/provenance.json \
  public/releases/v0.1.0-preview.1.json
shasum -a 256 "$studio_archive"
scp "$studio_archive" "aliyun-siyadao:/tmp/siyadao-studio-${studio_release}.tar.gz"
ssh aliyun-siyadao "sha256sum /tmp/siyadao-studio-${studio_release}.tar.gz"
```

确认本机和远程 SHA-256 一致后，创建独立版本并原子切换。下面的 `test` 防止覆盖已有版本或另一项待切换部署：

```sh
ssh aliyun-siyadao "
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

依照项目约定，单元测试方法不默认执行；页面交互只有实际验证后才能标记通过。证书尚未到期时，续期服务正常退出仅说明任务能够运行，不等同于已经完成一次到期续期。

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
