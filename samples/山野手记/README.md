# 山野手记 · 官网演示样例

这些文件用于思芽岛官网的真实应用截图，不含个人文稿、账号或凭据。2026-10-07 实拍使用最新开发构建；公开安装包可能暂未包含所有功能。

| 文件 | 用途 |
| --- | --- |
| `01-创作手记.md` | Markdown 写作和预览 |
| `02-灵感地图.excalidraw` | Excalidraw 白板 |
| `03-trail.rs` | Rust 源码与语法高亮 |
| `04-路线数据.json` | JSON 工具输入样例 |
| `05-便签墙.md` | 便签内容与布局参考，保留早期样例元数据 |
| `06-TODO待办.md` | 嵌套任务、备注和完成状态的导入样例 |
| `07-路线对比.csv` | CSV 表格 |
| `08-路线分析.ipynb` | Notebook，含真实 Jupyter 内核执行输出 |
| `09-路线实验.py` | Python 运行样例，在执行目录生成 route-summary.json |

文稿、白板、源码、表格和 Notebook 可以直接在样例项目中打开。Rust 导航需配置 rust-analyzer；重新执行 Notebook 需 Python 与 Jupyter 内核。

便签、待办和日历属于默认空间的专用功能，最新版本使用 SQLite 存储。不要将 Markdown 样例复制到旧的 .lance 文件位置来代替当前数据库，也不要覆盖日常工作区。

官网仓库的 `scripts/prepare-capture-workspace.py` 通过生产 CLI 初始化全新的隔离演示空间：导入文件与 TODO，创建便签、五条日历笔记、提醒、模板和词汇条目。新建目录必须不存在。拍摄应用需要使用相同的 SIYADAO_CLI_DATA_DIR，避免连接个人空间。

```sh
python3 scripts/prepare-capture-workspace.py \
  --cli /path/to/siyadao-cli \
  --root /private/tmp/siyadao-new-capture
```

数据库截图使用该演示空间的 SQLite 只读连接，未使用生产数据库。账号截图为未登录状态，未注册演示账号。

网站只展示截图，不读取或改写应用数据。下载包由 `scripts/package-samples.py` 生成，包含九份源文件和本说明。
