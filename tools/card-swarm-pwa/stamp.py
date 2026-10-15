#!/usr/bin/env python3
"""Regenera la lista de precache y la VERSION (hash del contenido) de sw.js de un juego.
Uso:  python3 tools/card-swarm-pwa/stamp.py [carpeta_del_juego]     (por defecto games/card-swarm)
La lista sale de index.html (scripts y estilos locales) + manifest.webmanifest + los iconos del manifest + sw.js no se incluye a sí mismo.
Lo usa también el workflow de GitHub Pages sobre la carpeta ya ensamblada."""
import hashlib, json, os, re, sys

root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "games", "card-swarm"))
html = open(os.path.join(root, "index.html"), encoding="utf-8").read()
files = ["./", "index.html", "manifest.webmanifest"]
files += re.findall(r'<script[^>]+src="([^"]+)"', html)
files += [h for h in re.findall(r'<link[^>]+href="([^"]+)"', html) if not h.startswith(("http", "data:"))]
man = json.load(open(os.path.join(root, "manifest.webmanifest"), encoding="utf-8"))
files += [i["src"] for i in man.get("icons", [])]
seen, out = set(), []
for f in files:
    if f in seen: continue
    seen.add(f)
    if f != "./" and not os.path.isfile(os.path.join(root, f)):
        sys.exit("Falta el archivo del precache: " + f)
    out.append(f if f == "./" else "./" + f)
h = hashlib.sha1()
for f in sorted(out):
    if f == "./": continue
    h.update(f.encode()); h.update(open(os.path.join(root, f), "rb").read())
ver = h.hexdigest()[:10]
p = os.path.join(root, "sw.js")
s = open(p, encoding="utf-8").read()
s = re.sub(r"/\*FILES\*/.*?/\*END\*/", lambda m: "/*FILES*/" + json.dumps(out, indent=2) + "/*END*/", s, flags=re.S)
s = re.sub(r"const VERSION = '[^']*';", "const VERSION = '" + ver + "';", s)
open(p, "w", encoding="utf-8").write(s)
print("sw.js: %d archivos, version %s" % (len(out), ver))
