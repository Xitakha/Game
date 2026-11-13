/* diag.js - Registro de errores en el dispositivo (T-F0-11). Se carga el primero para captar también los fallos de arranque.
   Guarda los últimos 20 errores (mensaje, archivo, línea, estado del juego, versión) en localStorage ('swarmhand.fusion.errlog');
   nunca envía nada a la red. Se ve y se copia desde Ajustes > Informe de errores.
   API: Diag.log(msg, {kind, src, line, col, stack}) / Diag.entries() / Diag.count() / Diag.clear() / Diag.text() / Diag.copy() -> Promise<bool>
        Diag.drawNotice(ctx) (aviso discreto tras un error) / Diag.build (hash de la versión, de sw.js) */
(function () {
  'use strict';
  var KEY = 'swarmhand.fusion.errlog', MAX = 20, D = window.Diag = { MAX: MAX, build: 'dev', noticeT: 0 }, list = [];
  try { var raw = localStorage.getItem(KEY); if (raw) { var p = JSON.parse(raw); if (Array.isArray(p)) list = p.slice(-MAX); } } catch (e) { list = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* sin espacio o sin permiso: se queda en memoria */ } }
  // versión del juego: el hash que estampa stamp.py en sw.js (si no se puede leer, 'dev')
  try { fetch('sw.js').then(function (r) { return r.text(); }).then(function (t) { var m = /const VERSION = '([0-9a-f]+)'/.exec(t); if (m) D.build = m[1]; }).catch(function () { /* sin red y sin caché */ }); } catch (e) { /* fetch no disponible */ }
  function ctx() {
    var o = {}, G = window.G;
    try { if (G) { o.state = G.state; o.mode = G.mode; o.t = Math.round((G.time || 0) / 100) / 10; if (G.Save && G.Save.VERSION) o.save = G.Save.VERSION; } } catch (e) { /* estado no disponible */ }
    return o;
  }
  D.log = function (msg, o) {
    o = o || {}; msg = String(msg == null ? 'error' : msg).slice(0, 300);
    var src = String(o.src || '').replace(/^.*\/(?=[^\/]+$)/, ''), last = list[list.length - 1];
    if (last && last.msg === msg && last.src === src && last.line === (o.line || 0)) { last.n = (last.n || 1) + 1; last.at = new Date().toISOString(); }   // el mismo fallo en bucle: se cuenta, no se repite
    else { list.push({ at: new Date().toISOString(), kind: o.kind || 'error', msg: msg, src: src, line: o.line || 0, col: o.col || 0, stack: String(o.stack || '').slice(0, 400), build: D.build, ctx: ctx(), n: 1 }); if (list.length > MAX) list = list.slice(-MAX); }
    D.noticeT = Date.now(); save();
  };
  D.entries = function () { return list.slice(); };
  D.count = function () { return list.length; };
  D.clear = function () { list = []; save(); D.noticeT = 0; };
  D.text = function () {
    var head = 'Swarm Hand - informe de errores\nversion: ' + D.build + '  guardado v' + ((window.G && G.Save && G.Save.VERSION) || '?') + '\nnavegador: ' + (navigator.userAgent || '?') + '\n' + list.length + ' errores (max ' + MAX + ')\n';
    return head + list.map(function (e, i) { return '\n#' + (i + 1) + ' ' + e.at + ' [' + e.kind + (e.n > 1 ? ' x' + e.n : '') + ']\n' + e.msg + '\n' + (e.src ? e.src + ':' + e.line + ':' + e.col + '\n' : '') + 'estado: ' + JSON.stringify(e.ctx) + ' build ' + e.build + (e.stack ? '\n' + e.stack : ''); }).join('\n');
  };
  D.copy = function () {
    var t = D.text();
    function legacy() { try { var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.appendChild(a); a.select(); var ok = document.execCommand('copy'); document.body.removeChild(a); return ok; } catch (e) { return false; } }
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(); }); } catch (e) { /* cae al método antiguo */ }
    return Promise.resolve(legacy());
  };
  D.drawNotice = function (c) {
    if (!D.noticeT || Date.now() - D.noticeT > 6000 || !window.G || !G.txt) return;
    G.txt(c, 'Error registrado  -  Ajustes > Informe de errores', 12, G.H - 14, 12, '#ff9a8a', 'left');
  };
  window.addEventListener('error', function (e) { D.log(e.message || (e.error && e.error.message), { kind: 'error', src: e.filename, line: e.lineno, col: e.colno, stack: e.error && e.error.stack }); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; D.log(r && r.message ? r.message : String(r), { kind: 'promesa', stack: r && r.stack }); });
})();
