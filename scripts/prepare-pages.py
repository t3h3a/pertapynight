from pathlib import Path
import json
import re
import shutil
import sys

base = sys.argv[1].rstrip("/")
if not re.fullmatch(r"(?:/[A-Za-z0-9._-]+)?", base):
    raise SystemExit("Unexpected Pages base path")

output = Path("_pages")
shutil.copytree("preview", output, dirs_exist_ok=True)
entry = output / "index.html"
html = entry.read_text(encoding="utf-8")
html = re.sub(r'(src|href)="/(?!/)', lambda m: f'{m[1]}="{base}/', html)
html = html.replace("</head>", '  <meta name="petra-static-demo" content="true">\n  </head>')
entry.write_text(html, encoding="utf-8")
(output / "404.html").write_text(html, encoding="utf-8")
for path in output.rglob("*.css"):
    css = path.read_text(encoding="utf-8").replace("/assets/petra-", base + "/assets/petra-")
    path.write_text(css, encoding="utf-8")
for path in (output / "assets").glob("index-*.js"):
    js = path.read_text(encoding="utf-8").replace("/assets/petra-", base + "/assets/petra-")
    if 'base:"/".replace' not in js:
        raise SystemExit("Router base missing")
    js = js.replace('base:"/".replace', 'base:' + json.dumps(base + "/") + '.replace')
    path.write_text(js, encoding="utf-8")

