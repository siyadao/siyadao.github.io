"""打包宣传页样例，保留跨平台可识别的 UTF-8 文件名。"""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
source = root / "samples" / "山野手记"
archive = root / "public" / "samples" / "siyadao-samples.zip"
archive.parent.mkdir(parents=True, exist_ok=True)

with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
    for item in sorted(source.iterdir()):
        if item.is_file() and not item.name.startswith("."):
            bundle.write(item, arcname=Path("山野手记") / item.name)

with ZipFile(archive) as bundle:
    for info in bundle.infolist():
        assert info.flag_bits & 0x800, "样例文件名必须使用 UTF-8"
    print(f"样例包已生成：{len(bundle.infolist())} 个文件，UTF-8 文件名。")
