"""Check the built RPM's dependency declarations, payload and security metadata."""
import json
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
package = Path(sys.argv[1]).resolve()
config = json.loads((root / "electron-builder.linux.json").read_text(encoding="utf-8"))["rpm"]
version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]


def query(*args):
    return subprocess.check_output(["rpm", "-qp", *args, str(package)], text=True).strip()


assert query("--queryformat", "%{NAME}|%{VERSION}|%{ARCH}") == f"hdlbits-zh-local|{version}|x86_64"
requires = set(query("--requires").splitlines())
assert set(config["depends"]) <= requires, set(config["depends"]) - requires
# Debian-built private libraries must never be advertised as system RPM provides.
provides = query("--provides").splitlines()
assert provides and all(p.startswith(("hdlbits-zh-local = ", "hdlbits-zh-local(x86-64) = ")) for p in provides), provides
assert not any("iverilog" in p or "libreadline.so" in p for p in requires), requires

records = query("--queryformat", "[%{FILENAMES}\t%{FILEMODES:octal}\t%{FILEUSERNAME}\t%{FILEGROUPNAME}\n]")
files = {parts[0]: parts[1:] for row in records.splitlines() if (parts := row.split("\t"))}
for name in ["/opt/HDLBits/hdlbits-zh", "/opt/HDLBits/resources/app.asar",
             "/opt/HDLBits/resources/runtime/bin/iverilog", "/opt/HDLBits/resources/runtime/bin/vvp",
             "/opt/HDLBits/resources/runtime-manifest.json", "/usr/share/applications/hdlbits-zh.desktop"]:
    assert name in files, name
for name, mode in [("/usr/bin/hdlbits-zh", 0o755), ("/opt/HDLBits/chrome-sandbox", 0o4755)]:
    actual_mode, user, group = files[name]
    assert int(actual_mode, 8) & 0o7777 == mode, (name, actual_mode)
    assert (user, group) == ("root", "root"), (name, user, group)
assert not any("/.build-id/" in p or "/ucrt64/" in p for p in files), "Unexpected global build IDs or Windows runtime"
print(json.dumps({"rpm": package.name, "version": version, "files": len(files),
                  "requires": len(requires), "provides": provides, "metadataValid": True}, indent=2))
