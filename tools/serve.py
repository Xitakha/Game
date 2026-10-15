#!/usr/bin/env python3
"""Servidor local sin caché para probar los juegos.
Uso (desde la raíz del repo):  python tools/serve.py card-swarm 8001
"""
import http.server, os, sys

game = sys.argv[1] if len(sys.argv) > 1 else "card-swarm"
port = int(sys.argv[2]) if len(sys.argv) > 2 else 8001
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "games", game)
os.chdir(root)


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


print(f"Sirviendo games/{game} en http://localhost:{port}  (Ctrl+C para parar)")
http.server.ThreadingHTTPServer(("", port), NoCache).serve_forever()
