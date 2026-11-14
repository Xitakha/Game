#!/usr/bin/env python3
"""Servidor local sin caché para probar los juegos.
Uso (desde la raíz del repo):  python tools/serve.py card-swarm 8001
Para servir el empaquetado de producción (tools/build):  python tools/serve.py dist/card-swarm 8001
(si el primer argumento es una carpeta existente se sirve esa carpeta; si no, games/<nombre>)
"""
import http.server, os, sys

game = sys.argv[1] if len(sys.argv) > 1 else "card-swarm"
port = int(sys.argv[2]) if len(sys.argv) > 2 else 8001
repo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
root = os.path.abspath(game) if os.path.isdir(game) else os.path.join(repo, "games", game)
os.chdir(root)


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


print(f"Sirviendo {os.path.relpath(root, repo)} en http://localhost:{port}  (Ctrl+C para parar)")
http.server.ThreadingHTTPServer(("", port), NoCache).serve_forever()
