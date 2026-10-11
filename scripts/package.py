"""Create a source-only archive, excluding caches and installed runtimes."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
destination = root.parent / "hdlbits-zh-source.zip"
directories = ("dist", "data", "scripts", "tests", "desktop")
files = [root / name for name in (
    "server.mjs", "judge.mjs", "package.json", "package-lock.json",
    "README.md", "requirements-dev.txt", "启动中文版.cmd", ".gitignore",
    "test-results.txt", "electron-builder.json",
)]
for directory in directories:
    files.extend(path for path in (root / directory).rglob("*")
                 if path.is_file() and "__pycache__" not in path.parts)
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for path in sorted(files):
        archive.write(path, Path(root.name) / path.relative_to(root))
with ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert not any("/.research/" in name or "/.tools/" in name or "/node_modules/" in name
                   for name in archive.namelist())
print(f"Created {destination} ({destination.stat().st_size:,} bytes, {len(files)} files)")
