// 中文写在页面里。英文官网是 https://siyadao.github.io/ 。本机预览仍可在本页切换，并用 ?lang=en 分享。
(() => {
  const storageKey = "siyadao.website.lang";
  const catalog = [
    ["思芽岛 — 让想法，即刻发生", "Siyadao — Ideas, as they happen"],
    ["思芽岛，原生桌面工作台", "Siyadao, a native desktop workspace"],
    ["思芽岛原生桌面工作台：便签、待办、日历与笔记时间线，连接写作、白板、代码、数据和自动化。离线使用个人空间，按需启用账号与内容同步。", "Siyadao is a native desktop workspace for notes, tasks, a calendar, and a daily timeline, connected to writing, whiteboards, code, data, and automation. The personal space works offline. Sign in when you want to sync."],
    ["跳转到正文", "Skip to content"],
    ["思芽岛首页", "Siyadao home"],
    ["主导航", "Main"],
    ["切换到浅色主题", "Switch to the light theme"],
    ["切换到深色主题", "Switch to the dark theme"],
    ["魔法球", "Magic Ball"],
    ["工作台", "Workspace"],
    ["亮点功能", "Highlights"],
    ["应用下载", "Download"],
    ["选择你的平台", "Choose a platform"],
    ["macOS（M 芯片）", "macOS (Apple silicon)"],
    ["macOS（Intel）", "macOS (Intel)"],
    ["Windows（x86_64）", "Windows (x64)"],
    ["Windows（ARM64）", "Windows (ARM64)"],
    ["Linux（x86_64）", "Linux (x64)"],
    ["Linux（ARM64）", "Linux (ARM64)"],
    ["未发布", "Not available"],
    ["安装包发布准备中，敬请期待。", "Installers are not listed yet."],
    ["重新获取", "Retry"],
    ["版本记录", "Releases"],
    ["先下载创作样例", "Download the sample project"],
    ["让想法，", "Ideas,"],
    ["即刻发生。", "as they happen."],
    ["灵感、待办、创作，一处相连。", "Notes, tasks, and writing, in one place."],
    ["让魔法球，找到你的下一步。", "Magic Ball suggests what to do next."],
    ["问题反馈", "Feedback"],
    ["探索工作台", "Explore the workspace"],
    ["本地智能 · 原生性能 · 多维创作", "Local intelligence · Native performance · Many kinds of work"],
    ["日常记录", "Daily notes"],
    ["创作与开发", "Create and build"],
    ["更多功能", "More"],
    ["便签", "Notes"],
    ["待办", "Tasks"],
    ["日历", "Calendar"],
    ["时间线", "Timeline"],
    ["文稿", "Writing"],
    ["白板", "Board"],
    ["代码", "Code"],
    ["数据库", "Database"],
    ["表格", "Table"],
    ["工具", "Tools"],
    ["账号", "Account"],
    ["新版本 · 实际画面", "Current build · real UI"],
    ["构思", "Sketch"],
    ["思芽岛 · 原生应用实拍", "Siyadao · real app"],
    ["山野手记 · 演示空间", "Field Notes · demo space"],
    ["让灵感留在眼前", "Keep the note in sight"],
    ["为便签选择颜色，整理位置与尺寸。需要常驻时，可以定住到屏幕右缘，或挂到当前文件。", "Color a note, then move and resize it. Pin it to the right edge of the screen, or attach it to the current file."],
    ["把计划拆成下一步", "Break the plan into a next step"],
    ["按分组组织任务，补充备注、拆分子任务；完成后归档，需要时再恢复。支持 Markdown 导入与导出。", "Group tasks, add notes, and split subtasks. Archive what is done, and restore it later. Import and export Markdown."],
    ["每天都有可回看的记录", "Each day leaves a record"],
    ["月历串起日常记录。同一天可以写多条笔记，复用模板，并为重要事项设置提醒。", "The month view lines up daily notes. A day can hold several entries. Reuse a template, and set a reminder."],
    ["日视图 · 笔记时间线", "Day view · note timeline"],
    ["沿时间回看你的记录", "Read the day back along the timeline"],
    ["日视图左侧按日期串起笔记，点击记录即可打开。需要时也可以把一篇笔记盯住，浮在其他应用之上。", "The day view lists notes by date. Click one to open it. Pin a note so it stays above other apps."],
    ["山野手记 · 手机预览", "Field Notes · phone preview"],
    ["写作时，先看手机稿", "Check the phone layout while you write"],
    ["块编辑器旁打开公众号手机预览，按竖屏检查标题、段落和主题色。确认排版后再复制或发布。", "Open the WeChat article preview beside the editor. Check the title, paragraphs, and theme on a phone-sized page, then copy or publish."],
    ["把想法画在一张画布上", "Draw the idea on one canvas"],
    ["原生 .syd 画布与 Excalidraw 承接图形、连线和草图，也可以在画板里放下 Markdown 卡片。思维导图支持 XMind 读取和保存。", "Native .syd canvases and Excalidraw hold shapes, connectors, and sketches, including Markdown cards. Mind maps open and save XMind files."],
    ["从记录自然走向开发", "Move from notes into the code"],
    ["Rust、Go、Python 编辑，结合语言服务完成导航与诊断；项目内还可使用搜索、Git 和真实终端。", "Edit Rust, Go, and Python with language-server navigation and diagnostics. Search, Git, and a real terminal stay in the project."],
    ["代码、结果和笔记放在一起", "Code, output, and notes together"],
    ["在 Notebook 中编辑与执行单元，查看实际输出；配合 Python 环境管理和实验记录，保留探索过程。", "Edit and run notebook cells, and keep the output. Manage Python environments and save experiment notes."],
    ["连接数据，直接查询", "Connect, then query"],
    ["连接 SQLite、PostgreSQL、MySQL、MariaDB、ClickHouse 或 Redis，按连接浏览对象，编写 SQL，查看和导出结果。", "Connect to SQLite, PostgreSQL, MySQL, MariaDB, ClickHouse, or Redis. Browse objects, write SQL, and export the result."],
    ["让零散信息变得可比较", "Make scattered rows comparable"],
    ["查看和编辑 CSV、TSV，选中单元格或整行后复制，也可以切换成只读文本。", "View and edit CSV and TSV. Copy a cell or a whole row, or switch to read-only text."],
    ["常用转换，随手就做", "Small conversions, close at hand"],
    ["JSON、时间戳、Cron、编码、二维码、正则等 15 项工具集中在工具集里。密码库单独打开。", "JSON, timestamps, cron, encoding, QR codes, regular expressions, and the rest of the 15 tools live in the toolset. The vault opens separately."],
    ["本地开始，按需连接", "Start local. Connect when you want."],
    ["不登录也能使用。设置里可以切换外观、八套文稿排版和中英文界面。登录后管理设备，并选择要同步的内容。", "Use it without an account. Settings cover appearance, eight article themes, and Chinese or English. After you sign in, manage devices and choose what to sync."],
    ["继续探索", "Continue"],
    ["下载创作样例", "Download the sample project"],
    ["记下来。", "Write it down."],
    ["做得到。", "Get it done."],
    ["便签墙", "Note wall"],
    ["让灵感，贴在眼前。", "Keep the idea on the wall."],
    ["自由摆放 · 彩色分类 · 桌面置顶", "Place freely · Color · Pin to the desktop"],
    ["便签的更多用法", "More about notes"],
    ["选择颜色，整理位置与尺寸。需要常驻提醒时，可以把便签定住到屏幕右缘，或挂到正在看的文件上。", "Choose a color, then set the position and size. Pin a note to the right edge, or attach it to the file you are reading."],
    ["TODO 待办", "Tasks"],
    ["把想做的，一件件做到。", "Finish the list, one item at a time."],
    ["分组与子任务 · 完成进度 · 归档恢复", "Groups and subtasks · Progress · Archive and restore"],
    ["待办的更多用法", "More about tasks"],
    ["按分组组织任务，添加子任务与备注。完成后归档，需要时恢复；支持 Markdown 导入、导出，当前数据保存在本地数据库。", "Group tasks, add subtasks and notes. Archive finished items and restore them later. Import and export Markdown. The list stays in a local database."],
    ["让每一天，", "Every day"],
    ["有迹可循。", "leaves a trace."],
    ["日历记录当下，时间线连接过往。", "The calendar holds today. The timeline connects what came before."],
    ["笔记时间线 · 日视图", "Note timeline · day view"],
    ["日历与时间线", "Calendar and timeline"],
    ["同一天记录多条笔记，复用模板并设置提醒。日视图左侧按日期串起记录，点击即可打开。重要笔记可以盯住，浮在其他应用之上。", "Keep several notes on one day, reuse a template, and set a reminder. The day view lists them by date. Pin an important note above other apps."],
    ["魔法球。", "Magic Ball."],
    ["随叫随到。", "Right there."],
    ["单击展开工具，双击说出想法。", "Click once for tools. Double-click to say what you want."],
    ["待办 · 分组与子任务", "Tasks · groups and subtasks"],
    ["从一个入口，连接常用工具。", "One entry, the tools you use often."],
    ["本地意图识别", "Local intent"],
    ["功能名与模糊匹配", "Names and fuzzy match"],
    ["本机表达学习", "Learned on this computer"],
    ["表达学习可关闭、可清除，数据留在本机。", "Phrase learning can be turned off or cleared. It stays on this computer."],
    ["常用工具与密码库", "Tools and the vault"],
    ["JSON、时间戳、Cron、进制转换、Base64 文本与图片、GZip、JWT、二维码、URL 编解码、哈希、密码生成、UUID、图片转换、正则表达式，共 15 项。密码库是独立模块，不在这个列表里。", "JSON, timestamps, cron, base conversion, Base64 text and images, GZip, JWT, QR codes, URL encode and decode, hashes, password generation, UUID, image conversion, and regular expressions: 15 tools. The vault is separate."],
    ["密码库把加密后的密码字段留在本地，登录后可选择同步密码库。公众号发布凭据也放在密码库，但只留在本机，不进入内容同步。模型 API Key 同样不进入内容同步；模型服务为可选配置，需要时再连接。", "The vault stores encrypted password fields locally. After you sign in, syncing the vault is optional. WeChat publishing credentials stay in the vault on this computer and are not part of content sync. Model API keys are also excluded. Model access is optional."],
    ["从灵感，", "From an idea"],
    ["到作品。", "to a finished piece."],
    ["白板 · 思维导图", "Board · mind map"],
    ["自由构思，有序展开。", "Sketch freely, then give it a shape."],
    [".syd 画布 · Excalidraw · XMind", ".syd canvas · Excalidraw · XMind"],
    ["画布与思维导图", "Canvas and mind map"],
    ["用形状、连线和文字组织灵感，也可以在画板里放下 Markdown 卡片。原生 .syd 画布与 Excalidraw 可编辑保存；XMind 支持读取、编辑与保存。思维导图也可以直接打开。", "Arrange an idea with shapes, connectors, and text, and drop Markdown cards on the board. Native .syd canvases and Excalidraw open and save. XMind files open, edit, and save. Mind maps open directly."],
    ["Markdown · 公众号创作", "Markdown · WeChat articles"],
    ["写下来，分享出去。", "Write it, then share it."],
    ["手机预览 · 富文本复制 · 草稿同步", "Phone preview · Rich copy · Draft sync"],
    ["公众号同步需配置账号，发布由你确认。", "WeChat sync needs your account. You confirm before it publishes."],
    ["文稿与公众号", "Articles and WeChat"],
    ["在块编辑器里写作，用大纲跳转，也可以在正文里查找。支持 Mermaid 图和数学公式。八套排版主题同时用于编辑和公众号复制。写作时可打开手机预览，按竖屏检查标题、段落与主题色；配置自己的公众号后，还可预检图片、保存草稿，并在确认后发布。最多保存 10 个公众号。", "Write in the block editor, jump from the outline, and find text in the draft. Mermaid diagrams and math are included. Eight themes apply to editing and to the WeChat copy. Preview the phone layout, check images, save a draft, and publish only after you confirm. Up to 10 WeChat accounts."],
    ["想到，", "Think it."],
    ["也能做到。", "Then build it."],
    ["代码、终端、数据和自动化，接住下一步。", "Code, a terminal, data, and automation take the next step."],
    ["代码、终端与 Git", "Code, terminal, and Git"],
    ["Rust、Go、Python 高亮、项目导航与语言服务诊断。真实 PTY 终端支持独立会话，可按环境运行 Agent CLI，也可以管理 SSH 连接。代码项目可以查看变更、暂存、提交、分支、历史和差异。上方的 Git 画面是打开 go 工程后的提交历史和文件差异。", "Rust, Go, and Python get highlighting, project navigation, and language-server diagnostics. Each terminal session has its own PTY, can run an Agent CLI, and can open SSH connections. Review changes, stage, commit, switch branches, and read history. The Git picture is a Go repository’s commits and a file diff."],
    ["代码导航需要配置 rust-analyzer、gopls 或 Pyright。个人默认空间无需安装 Git。", "Code navigation needs rust-analyzer, gopls, or Pyright. The default personal space does not need Git."],
    ["自动化工作流", "Workflows"],
    ["用节点把命令、条件和通知连成一条流程。可以套用预置模板，手动运行，或按 Cron 定时执行，并用应用内通知、钉钉、飞书或企微提醒。", "Connect commands, conditions, and notices into a flow. Start from a template, run it yourself, or schedule it with cron. Notify in the app, DingTalk, Feishu, or WeCom."],
    ["Python、Notebook 与数据库", "Python, notebooks, and databases"],
    ["管理 Python 解释器、环境和依赖，连接 Jupyter 内核运行 Notebook，归档和比较实验记录。运行需要对应解释器和内核。", "Manage Python interpreters, environments, and packages. Run notebooks through a Jupyter kernel, then archive and compare experiments. Running needs that interpreter and kernel."],
    ["数据库工作台支持 SQLite、PostgreSQL、MySQL、MariaDB、ClickHouse 和 Redis，按连接展开对象树，补全 SQL，查看和导出结果。已保存的表格文件可以用 DuckDB 做可取消的 SQL 分析。", "The database workspace connects to SQLite, PostgreSQL, MySQL, MariaDB, ClickHouse, and Redis. Browse the object tree, complete SQL, and export results. Saved table files can be queried with DuckDB, and that query can be cancelled."],
    ["文件、阅读与检索", "Files, reading, and search"],
    ["查看、编辑 CSV / TSV，预览、旋转、压缩和转换图片；macOS 支持 PDF 阅读、高亮与批注。按文件名、正文或代码符号搜索，查看和恢复本地文件历史。", "View and edit CSV or TSV. Preview, rotate, compress, and convert images. On macOS, read, highlight, and annotate PDFs. Search by name, text, or code symbol, and restore a file from local history."],
    ["书库整理标签、收藏、评分和阅读进度。书架可导入 EPUB、PDF、AZW3、TXT、Markdown 和 CBZ，并能按书脊排开。上方画面是把 ebooks 仓库里的书导入后的书脊模式。阅读时左侧查看目录。词汇表按领域和词表管理条目，支持导入、导出。删除的内容可以在回收站恢复。", "The library keeps tags, favorites, ratings, and reading progress. Import EPUB, PDF, AZW3, TXT, Markdown, and CBZ, and line the books up by the spine. The picture is that spine view after importing an ebooks folder. The contents stay on the left while you read. Glossaries group entries by field and list, and they import and export. Deleted items can be restored from the trash."],
    ["CLI 与脚本", "CLI and scripts"],
    ["siyadao-cli 与桌面端共用真实工作区数据和操作，可以打开文件、管理内容或调用应用操作。结构化 JSON 输出便于接入脚本。", "siyadao-cli uses the same workspace data and actions as the desktop app. Open files, manage content, or call app actions. JSON output is there for scripts."],
    ["换一台设备，", "Another device,"],
    ["接着来。", "continue there."],
    ["本地开始，需要时再连接。", "Start on this computer. Connect when you need to."],
    ["你的内容，", "Your content,"],
    ["由你选择。", "your choice."],
    ["不登录也能使用本地空间。登录同一账号，选择需要同步的内容，延续另一台设备上的工作。", "The local space works without an account. Sign in to the same account, choose what to sync, and continue on another device."],
    ["了解同步范围", "What can sync"],
    ["账号与设备", "Account and devices"],
    ["账号密码登录；关注公众号获取注册、找回密码的验证码，支持粘贴。登录后查看和管理设备。", "Sign in with the account password. Follow the WeChat account to get a code for registration or password reset, and paste it in. After sign-in, view and manage devices."],
    ["十类可选同步", "Ten sync switches"],
    ["待办、便签、日历、词汇表、文稿与画布、文件与附件、书库、书架、密码库、通用偏好。类别默认全部勾选；首次同步总开关关闭，由你确认并启用。随时关闭不需要同步的类别。", "Tasks, notes, calendar, glossaries, articles and canvases, files and attachments, library, bookshelf, vault, and general preferences. All categories start checked. The master switch stays off until you turn sync on. Turn off any category you do not want."],
    ["同步、冲突与文件恢复", "Sync, conflicts, and file restore"],
    ["启用后，内容变更触发同步，也可手动立即同步。冲突时查看差异，选择保留本机或云端内容。", "After you enable it, changes start a sync, and you can also sync now. If there is a conflict, compare the two copies and keep the local or the cloud one."],
    ["结构化记录同步最新状态；文件从同账号在线设备按需补齐，服务器只作临时中继。外部代码项目和本机窗口布局不参与同步。", "Structured records sync their latest state. Files are filled in on demand from another signed-in device that is online. The server only relays them for a while. External code projects and this computer’s window layout are not synced."],
    ["同步不等同于永久云备份：原文件设备全部丢失、临时副本也已清理时，无法恢复文件。重要资料请另行备份。", "Sync is not a permanent cloud backup. If every device that had the original file is gone, and the temporary copy has been cleared, the file cannot be restored. Keep your own backup of anything important."],
    ["下一步，", "Next,"],
    ["从你的想法开始。", "start with the idea."],
    ["下载演示样例", "Download the sample project"],
    ["下载与自动更新", "Download and updates"],
    ["主下载走 GitHub，旁边的「备用」指向官网。菜单显示各平台可用安装包及真实版本。", "The main download uses GitHub. Mirror uses the official site. Each platform shows its own latest installer and version."],
    ["发现更新时，标题栏目录位置出现蓝色下载图标。点击开始下载，悬停查看进度并可取消；失败可重试。受支持的 macOS DMG、Windows 安装 EXE 下载完成后，处理未保存内容，再自动替换并重启。其他包或无法写入的安装位置提供手动入口。", "When an update is available, a blue download icon appears where the folder button sits. Click to start, hover for progress, and cancel if you want. A failed download can be retried. After a supported macOS DMG or Windows setup EXE finishes, unsaved work is handled, then the app replaces itself and restarts. Other packages, or a folder the app cannot write, offer a manual install."],
    ["页面展示准备发布的新版本实际画面。下载菜单仍指向已经公开的安装包；新版本上线后会自动换成对应安装包，实际版本以菜单为准。", "The page shows the real UI of the version being prepared. The download menu still points at the installers already published. When a newer build is published, the menu switches to it. The version in the menu is the one you get."],
    ["让智能，融入每一次创作。", "Intelligence, in the work itself."],
    ["回到顶部 ↑", "Back to top ↑"],
    ["查看原始截图", "Open original"],
    ["公开反馈渠道正在准备中。你仍然可以下载完整创作样例，了解思芽岛的实际工作流。", "Public feedback is not open yet. You can still download the sample project and see the workflow."],
    ["产品展示", "Product"],
    ["展示分类", "Categories"],
    ["选择产品展示场景", "Scenes"],
    ["放大查看：便签墙", "Enlarge: note wall"],
    ["六张演示便签的颜色、布局和实际内容。", "Six demo notes: color, layout, and text."],
    ["放大查看：待办", "Enlarge: tasks"],
    ["待办里的分组、嵌套任务与完成状态。", "Groups, nested tasks, and completion in the task list."],
    ["放大查看：日历", "Enlarge: calendar"],
    ["2026 年 10 月月历及五条真实演示记录。", "October 2026, with five demo entries."],
    ["放大查看：笔记时间线", "Enlarge: note timeline"],
    ["2026 年 10 月 25 日的日视图，左侧时间线列出五条演示笔记。", "Day view for 25 October 2026, with five demo notes on the timeline."],
    ["放大查看：文稿手机预览", "Enlarge: article phone preview"],
    ["块编辑器旁的公众号手机预览，山野手记以竖屏排版显示。", "WeChat phone preview beside the editor. Field Notes is laid out as a vertical article."],
    ["放大查看：白板", "Enlarge: board"],
    ["应用内打开并渲染 Excalidraw 路线规划样例。", "The Excalidraw route sketch, opened in the app."],
    ["放大查看：Rust 编辑器", "Enlarge: Rust editor"],
    ["真实 Rust 源文件与语法高亮；截图不用于证明语言服务运行。", "A real Rust file with highlighting. The picture does not show the language server running."],
    ["放大查看：Notebook", "Enlarge: notebook"],
    ["真实 Jupyter 内核运行后保留的路线分析结果。", "Route analysis kept after a real Jupyter kernel run."],
    ["放大查看：数据库", "Enlarge: database"],
    ["数据库工作台实拍：左侧是演示空间的系统库，右侧是 SQL 编辑器。", "Database workspace: the demo system library on the left, SQL editor on the right."],
    ["放大查看：表格", "Enlarge: table"],
    ["CSV 路线数据在真实表格视图中打开。", "Route CSV opened in the real table view."],
    ["放大查看：工具箱", "Enlarge: tools"],
    ["工具集中的 15 项实际工具。", "The 15 tools in the toolset."],
    ["放大查看：账号设置", "Enlarge: account settings"],
    ["未登录的设置页，不含个人账号或凭据。", "Settings while signed out. No personal account or credentials."],
    ["功能展示导航", "Scene navigation"],
    ["上一个功能", "Previous feature"],
    ["下一个功能", "Next feature"],
    ["查看便签墙原始产品截图", "Open the original note-wall picture"],
    ["六张山野手记样例便签在思芽岛真实画布上自由排列", "Six Field Notes samples placed on the real Siyadao canvas"],
    ["查看 TODO 待办原始产品截图", "Open the original task picture"],
    ["山野手记创作计划在真实 TODO 界面中显示三级任务、备注和完成进度", "The Field Notes plan in the real task view: three levels, notes, and progress"],
    ["2026 年 10 月月历，五条山野手记演示笔记。", "October 2026, with five Field Notes entries."],
    ["日视图时间线裁切，保留五条山野手记演示笔记。", "A crop of the day-view timeline, with five Field Notes entries."],
    ["查看快速访问工具的真实截图", "Open the real quick-tools picture"],
    ["思芽岛工具集中的 15 项实际工具", "The 15 tools in the Siyadao toolset"],
    ["待办分组、嵌套任务与完成状态", "Task groups, nested tasks, and completion"],
    ["查看真实白板截图", "Open the real board picture"],
    ["思芽岛真实白板，展示发现、记录、分享的灵感地图", "The real board: a map of noticing, recording, and sharing"],
    ["查看文稿手机预览截图", "Open the article phone-preview picture"],
    ["块编辑器旁打开公众号手机预览，山野手记以竖屏排版显示", "WeChat phone preview beside the editor, with Field Notes in a vertical layout"],
    ["放大查看：自动化工作流", "Enlarge: workflow"],
    ["自动化工作流实拍：Git 状态、暂存、提交和推送四个节点。", "Workflow picture: Git status, stage, commit, and push."],
    ["放大查看：书架书脊", "Enlarge: bookshelf spines"],
    ["书脊模式实拍：ebooks 仓库里的书排在两层架上。", "Spine view: books from an ebooks folder on two shelves."],
    ["放大查看：Git 面板", "Enlarge: Git panel"],
    ["go 工程的 Git 面板：提交历史和选中文件的差异。", "Git panel in a Go project: commit history and the selected file’s diff."],
    ["未登录的设置页：外观、八套文稿排版、界面语言，以及账号、设备与同步。未使用个人账号或凭据。", "Signed-out settings: appearance, eight article themes, language, plus account, devices, and sync. No personal account or credentials."],
    ["版本说明", "Release notes"],
    ["关闭截图", "Close image"],
    ["关闭反馈窗口", "Close feedback"],
    ["便签墙", "Note wall"],
    ["待办", "Tasks"],
    ["日历", "Calendar"],
    ["笔记时间线", "Note timeline"],
    ["文稿 · 手机预览", "Article · phone preview"],
    ["白板", "Board"],
    ["Rust 编辑器", "Rust editor"],
    ["数据库", "Database"],
    ["表格", "Table"],
    ["工具箱", "Tools"],
    ["账号设置", "Account settings"],
    ["日视图实拍：左侧时间线列出五条山野手记演示笔记。", "Day view: five Field Notes entries on the left timeline."],
    ["块编辑器旁打开公众号手机预览：山野手记实时排成竖屏阅读稿。", "WeChat phone preview beside the editor. Field Notes is composed into a vertical reading layout."],
    ["真实 Rust 源文件与语法高亮；截图不用于证明语言服务运行。", "A real Rust file with highlighting. The picture does not show the language server running."],
    ["真实 Jupyter 内核运行后保留的路线分析结果。", "Route analysis kept after a real Jupyter kernel run."],
    ["数据库工作台实拍：左侧是演示空间的系统库，右侧是 SQL 编辑器。", "Database workspace: the demo system library on the left, SQL editor on the right."],
    ["CSV 路线数据在真实表格视图中打开。", "Route CSV opened in the real table view."],
    ["工具集中的 15 项实际工具。", "The 15 tools in the toolset."],
    ["未登录的设置页，不含个人账号或凭据。", "Settings while signed out. No personal account or credentials."],
    ["思芽岛实际运行画面。", "The real Siyadao window."],
    ["从日视图裁出的时间线。放大查看完整日视图。", "Timeline cropped from the day view. Enlarge it for the full day."],
    ["快速访问窗口里的真实分组与嵌套待办。", "Real groups and nested tasks in the quick window."],
    ["块编辑器旁的公众号手机预览实拍。", "WeChat phone preview beside the block editor."],
    ["预置模板「Git 状态与同步」：四个命令节点连成一条流程。", "The “Git status and sync” template: four command nodes in one flow."],
    ["从 ebooks 导入的书，以书脊模式排在架上。", "Books imported from an ebooks folder, lined up by the spine."],
    ["打开 go 工程后的提交历史和文件差异。", "Commit history and a file diff after opening a Go project."],
    ["正在准备…", "Preparing…"],
    ["查询中", "Checking"],
    ["暂不可用", "Unavailable"],
    ["暂无安装包", "No installer"],
    ["GitHub 下载", "GitHub"],
    ["官网下载", "Official"],
    ["官网备用下载", "Official mirror"],
    ["备用", "Mirror"],
    ["正在获取最新版本…", "Checking the latest versions…"],
    ["暂时无法刷新，当前显示上次获取的版本。", "Could not refresh. Showing the last versions we loaded."],
    ["各平台使用各自最新可用版本。", "Each platform uses its own latest installer."],
    ["官方发布 · 测试版", "Official release · Preview"],
    ["官方发布 · 稳定版", "Official release · Stable"],
    ["暂未获取到公开版本。", "No public release yet."],
    ["暂时无法获取版本，请稍后重试。", "Could not load versions. Try again shortly."],
  ];
  const messages = new Map(catalog);

  function normalizeLang(value) {
    return value === "en" || value === "zh" ? value : null;
  }

  const chineseSite = "https://studio.siyadao.cn/";
  const englishSite = "https://siyadao.github.io/";

  function resolveLang({ stored, query } = {}) {
    return normalizeLang(query) || normalizeLang(stored) || "zh";
  }

  function siteKind() {
    let host = "";
    try {
      host = location.hostname;
    } catch {
      host = "";
    }
    if (host === "siyadao.github.io") return "en";
    if (host === "studio.siyadao.cn") return "zh";
    return "local";
  }

  function translate(language, value) {
    if (language !== "en" || typeof value !== "string") return value;
    return messages.get(value) || value;
  }

  function readStored() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function writeStored(value) {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // 浏览器禁用存储时，当前页面仍可切换语言。
    }
  }

  function readQuery() {
    try {
      return new URLSearchParams(location.search).get("lang");
    } catch {
      return null;
    }
  }

  let lang = resolveLang({
    stored: typeof document !== "undefined" ? document.documentElement?.dataset?.lang : null,
    query: null,
  });
  if (lang !== "en" && lang !== "zh") lang = "zh";
  if (typeof document !== "undefined" && !document.documentElement?.dataset?.lang) {
    lang = resolveLang({ stored: readStored(), query: readQuery() });
  }

  const originals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const attributes = ["alt", "aria-label", "title", "content", "data-title", "data-description"];

  function blocked(node) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    return !element || Boolean(element.closest("script, style, svg, [data-no-i18n]"));
  }

  function translateText(node) {
    if (blocked(node)) return;
    const current = node.nodeValue;
    const key = current.trim();
    let record = originals.get(node);
    if (messages.has(key)) record = { raw: current, key };
    if (!record) return;
    originals.set(node, record);
    const next = lang === "en" ? record.raw.replace(record.key, messages.get(record.key)) : record.raw;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(element) {
    if (blocked(element)) return;
    const saved = attributeOriginals.get(element) || {};
    for (const attribute of attributes) {
      if (!element.hasAttribute?.(attribute)) continue;
      const current = element.getAttribute(attribute);
      if (messages.has(current)) saved[attribute] = current;
      const key = saved[attribute];
      if (!key || !messages.has(key)) continue;
      const next = lang === "en" ? messages.get(key) : key;
      if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
    }
    attributeOriginals.set(element, saved);
  }

  function apply(root) {
    if (typeof document === "undefined" || !document.createTreeWalker) return;
    const scope = root || document.documentElement;
    if (!scope) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let node = scope; node; node = walker.nextNode()) {
      if (node.nodeType === 3) translateText(node);
      else if (node.nodeType === 1) translateAttributes(node);
    }
    const pageUrl = lang === "en" ? englishSite : chineseSite;
    const canonical = document.querySelector?.('link[rel="canonical"]');
    if (canonical) canonical.href = pageUrl;
    const ogUrl = document.querySelector?.('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", pageUrl);
    const locale = document.querySelector?.('meta[property="og:locale"]');
    if (locale) locale.setAttribute("content", lang === "en" ? "en_US" : "zh_CN");
    const alternate = document.querySelector?.('meta[property="og:locale:alternate"]');
    if (alternate) alternate.setAttribute("content", lang === "en" ? "zh_CN" : "en_US");
    const structured = document.getElementById?.("site-jsonld");
    if (!structured) return;
    const descriptionKey = catalog.find(([key]) => key.startsWith("思芽岛原生桌面工作台："))?.[0];
    structured.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "思芽岛",
      alternateName: "SIYADAO",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "macOS, Windows",
      description: descriptionKey ? translate(lang, descriptionKey) : "",
      url: pageUrl,
      downloadUrl: `${pageUrl}#downloads`,
      inLanguage: lang === "en" ? "en" : "zh-CN",
      image: `${pageUrl}public/og.png`,
    });
  }

  function syncUrl() {
    if (siteKind() !== "local") return;
    if (typeof location === "undefined" || !location.href || typeof history === "undefined") return;
    try {
      const url = new URL(location.href);
      if (lang === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (next !== current) history.replaceState(null, "", next);
    } catch {
      // 地址栏保持原样，语言选择仍然生效。
    }
  }

  function updateToggle() {
    const button = document.querySelector?.("[data-lang-toggle]");
    if (!button) return;
    const kind = siteKind();
    const toEnglish = kind === "en" ? false : kind === "zh" ? true : lang !== "en";
    button.textContent = toEnglish ? "EN" : "中文";
    const label = toEnglish ? "Switch to English" : "切换到中文";
    button.setAttribute("aria-label", label);
    button.title = label;
    if (button.tagName === "A") {
      if (kind === "local") {
        try {
          const url = new URL(location.href);
          if (toEnglish) url.searchParams.set("lang", "en");
          else url.searchParams.delete("lang");
          button.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
        } catch {
          button.setAttribute("href", toEnglish ? "?lang=en" : "./");
        }
      } else {
        button.setAttribute("href", toEnglish ? englishSite : chineseSite);
      }
    }
  }

  function setLang(next) {
    if (next !== "en" && next !== "zh") return;
    lang = next;
    writeStored(next);
    if (typeof document !== "undefined") {
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.lang = next;
    syncUrl();
    updateToggle();
    apply();
    document.dispatchEvent(new CustomEvent("siyadao:lang", { detail: next }));
    document.documentElement.classList.add("i18n-ready");
    }
  }

  function boot() {
    if (typeof document === "undefined") return;
    const kind = siteKind();
    const fromPage = normalizeLang(document.documentElement.dataset.lang);
    if (kind === "en") lang = "en";
    else if (kind === "zh") lang = "zh";
    else lang = fromPage || resolveLang({ stored: readStored(), query: readQuery() });
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.lang = lang;
    if (kind === "local" && normalizeLang(readQuery())) writeStored(lang);
    apply();
    updateToggle();
    syncUrl();
    document.documentElement.classList.add("i18n-ready");
    document.querySelector("[data-lang-toggle]")?.addEventListener("click", (event) => {
      if (siteKind() !== "local") return;
      event.preventDefault();
      setLang(lang === "en" ? "zh" : "en");
    });
  }

  const api = {
    catalog,
    resolveLang,
    translate,
    t(value) { return translate(lang, value); },
    get lang() { return lang; },
    setLang,
    apply,
  };
  if (typeof window !== "undefined") window.SiyadaoI18n = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})();
