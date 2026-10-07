"""Populate an isolated native capture workspace through the production CLI."""
import argparse
import json
from pathlib import Path
import subprocess

WEBSITE = Path(__file__).resolve().parents[1]
SAMPLES = WEBSITE / "samples" / "山野手记"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cli", required=True, type=Path)
    parser.add_argument("--root", required=True, type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    root.mkdir(mode=0o700)
    data, workspace = root / "app-data", root / "拾光录"

    def cli(*command):
        result = subprocess.run([str(args.cli.resolve()), "--data-dir", str(data),
            "--json", *command], check=True, capture_output=True, text=True)
        response = json.loads(result.stdout)
        if not response["ok"]:
            raise RuntimeError(response["error"]["message"])
        return response["result"]

    cli("workspace", "init", str(workspace), "--default")
    cli("settings", "set", "theme", "light")
    cli("file", "create", "山野手记", "--directory")
    for source in SAMPLES.iterdir():
        if source.is_file() and source.name != "README.md":
            cli("file", "import", str(source), "山野手记")
    cli("todo", "import", "--input", str(SAMPLES / "06-TODO待办.md"))
    notes = [
        ("把山野，写进日常\n\n一周一条路线，一篇手记。", "yellow", 80, 70),
        ("本周：山脊日落线\n\n6.8 km · 爬升 460 m\n周六 15:00 出发", "green", 400, 70),
        ("随身清单\n\n相机 · 水壶 · 离线路线\n手记本 · 备用电池", "cyan", 720, 70),
        ("文章大纲\n\n出发 → 溪谷 → 山脊\n把路上的光，写进故事。", "pink", 80, 330),
        ("下次再去\n\n雨后的溪谷轻徒步\n带朋友一起，走慢一点。", "blue", 400, 330),
        ("分享前检查\n\n整理笔记与照片\n公众号预检、复制排版", "neutral", 720, 330),
    ]
    for body, color, x, y in notes:
        cli("sticky", "add", body, "--color", color, "--x", str(x), "--y", str(y))
    for date, body, reminder in [
        ("2026-10-03", "# 溪谷轻徒步\n\n3.2 km，拍到了雨后的苔藓。\n\n今天的关键词：慢下来。", None),
        ("2026-10-07", "# 整理山野手记\n\n- 选出本周路线\n- 完成文章大纲\n- 复查相机与电池", "19:30"),
        ("2026-10-10", "# 山脊日落线\n\n15:00 出发，预留 3 小时。\n\n带水壶、相机和手记本。", "15:00"),
        ("2026-10-14", "# 发布本周手记\n\n检查封面、排版与图片，确认后发布。", "20:00"),
        ("2026-10-18", "# 环山摄影线\n\n10.5 km，优先记录林间光线。", None),
    ]:
        command = ["calendar", "note", "add", body, "--date", date]
        if reminder:
            command += ["--reminder", reminder]
        cli(*command)
    cli("calendar", "template", "add", "每日山野手记", "# 今日见闻\n\n## 记下来的事\n\n## 下一步\n")
    cli("glossary", "entry", "add", "借用检查：在编译期检查引用的生命周期与可变性。")
    cli("glossary", "entry", "add", "Golden hour：日出后、日落前的柔和光线。")
    print(json.dumps({"data_dir": str(data), "workspace": str(workspace),
        "sample_project": str(workspace / "山野手记"), "personal_data_used": False}, ensure_ascii=False))


if __name__ == "__main__":
    main()
