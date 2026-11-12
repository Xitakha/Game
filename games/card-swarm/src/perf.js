/* perf.js - medidor de frame-time OPCIONAL: solo se activa con ?perf=1 (sin el parametro este archivo no hace nada: ni hooks, ni DOM, ni estado).
   Envuelve requestAnimationFrame: intervalo entre frames (fps) y tiempo de trabajo del callback (CPU del frame: logica + dibujo), en ms.
   Overlay arriba-centro (avg / p95 / max y fps de los ultimos ~5 s; tocarlo copia el resumen JSON). Registro exportable:
     window.__perf.summary()  -> { frames, fps, interval:{avg,p50,p95,p99,max}, work:{avg,p95,max}, over33, minutes:[...por minuto...], ... }
     window.__perf.export()   -> el mismo resumen como texto JSON      window.__perf.reset()  -> vuelve a empezar */
(function () {
  'use strict';
  if (!/[?&]perf=1(&|$)/.test(location.search)) return;
  var BIN = 0.5, NB = 400;                       // histograma 0..200 ms en pasos de 0,5 ms (el ultimo cajon agrupa lo mayor)
  var RING = 300, riI = new Float32Array(RING), riW = new Float32Array(RING), rn = 0, rp = 0;   // ventana rodante para el overlay (~5 s)
  var raf = window.requestAnimationFrame.bind(window), now = function () { return performance.now(); };
  var S, lastT = 0, el = null, lastShow = 0;
  function mk() { return { n: 0, sumI: 0, sumW: 0, maxI: 0, maxW: 0, over33: 0, hI: new Uint32Array(NB), hW: new Uint32Array(NB) }; }
  function add(A, di, dw) {
    A.n++; A.sumI += di; A.sumW += dw; if (di > A.maxI) A.maxI = di; if (dw > A.maxW) A.maxW = dw; if (di > 33.4) A.over33++;
    A.hI[Math.min(NB - 1, (di / BIN) | 0)]++; A.hW[Math.min(NB - 1, (dw / BIN) | 0)]++;
  }
  function pct(h, n, q) { if (!n) return 0; var t = Math.ceil(n * q), c = 0; for (var i = 0; i < NB; i++) { c += h[i]; if (c >= t) return +((i + 1) * BIN).toFixed(1); } return NB * BIN; }
  function stat(A) {
    var n = A.n, r = function (v) { return +v.toFixed(2); };
    return { frames: n, fps: n ? r(1000 * n / A.sumI) : 0,
      interval: { avg: n ? r(A.sumI / n) : 0, p50: pct(A.hI, n, 0.5), p95: pct(A.hI, n, 0.95), p99: pct(A.hI, n, 0.99), max: r(A.maxI) },
      work: { avg: n ? r(A.sumW / n) : 0, p95: pct(A.hW, n, 0.95), max: r(A.maxW) }, over33: A.over33 };
  }
  function reset() { S = { t0: now(), all: mk(), cur: mk(), curMin: 0, minutes: [] }; rn = rp = 0; lastT = 0; }
  function closeMin() { if (S.cur.n) { var m = stat(S.cur); m.minute = S.curMin + 1; S.minutes.push(m); if (S.minutes.length > 90) S.minutes.shift(); } S.cur = mk(); }
  function summary() {
    var s = stat(S.all), Q = window.G && window.G.Q;
    s.elapsedS = +((now() - S.t0) / 1000).toFixed(1); s.quality = Q ? Q.level : null; s.state = window.G ? window.G.state : null; s.mode = window.G ? window.G.mode : null; s.biome = window.G ? window.G.curBiome : null;
    s.enemies = window.G && window.G.enemies ? window.G.enemies.length : null; s.ua = navigator.userAgent; s.dpr = window.devicePixelRatio;
    var cur = stat(S.cur); cur.minute = S.curMin + 1; cur.partial = true;
    s.minutes = S.minutes.concat(cur.frames ? [cur] : []); return s;
  }
  function ringStat() {
    var n = Math.min(rn, RING), a = Array.prototype.slice.call(riI, 0, n), b = Array.prototype.slice.call(riW, 0, n), sa = 0, sb = 0, mx = 0, mw = 0, i;
    for (i = 0; i < n; i++) { sa += a[i]; sb += b[i]; if (a[i] > mx) mx = a[i]; if (b[i] > mw) mw = b[i]; }
    a.sort(function (x, y) { return x - y; }); b.sort(function (x, y) { return x - y; });
    return n ? { fps: 1000 * n / sa, ia: sa / n, ip: a[Math.min(n - 1, Math.floor(n * 0.95))], im: mx, wa: sb / n, wp: b[Math.min(n - 1, Math.floor(n * 0.95))], wm: mw } : null;
  }
  function show(t) {
    if (!el) {
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:50%;top:2px;transform:translateX(-50%);z-index:99999;font:11px/1.25 monospace;color:#9f9;background:rgba(0,0,0,.65);padding:2px 6px;border-radius:4px;white-space:pre;text-align:center;touch-action:none';
      el.addEventListener('pointerdown', function (e) { e.stopPropagation(); var txt = JSON.stringify(summary()); try { navigator.clipboard.writeText(txt); el.dataset.c = '1'; } catch (x) { /* sin portapapeles */ } console.log(txt); }, true);
      document.body.appendChild(el);
    }
    var r = ringStat(); if (!r) return;
    el.textContent = 'PERF ' + r.fps.toFixed(0) + ' fps  min ' + (S.curMin + 1) + (el.dataset.c ? '  [copiado]' : '') + '\nframe avg ' + r.ia.toFixed(1) + '  p95 ' + r.ip.toFixed(1) + '  max ' + r.im.toFixed(1) + ' ms\ncpu   avg ' + r.wa.toFixed(1) + '  p95 ' + r.wp.toFixed(1) + '  max ' + r.wm.toFixed(1) + ' ms';
    el.style.color = r.ip > 33.4 ? '#f88' : r.ip > 18 ? '#fd6' : '#9f9';
  }
  reset();
  window.requestAnimationFrame = function (cb) {
    return raf(function (t) {
      var a = now(); cb(t); var w = now() - a;
      if (lastT) {
        var di = t - lastT; if (di > 0 && di < 1000) {   // se ignoran las pausas largas (pestana oculta)
          var m = Math.floor((a - S.t0) / 60000); while (S.curMin < m) { closeMin(); S.curMin++; }
          add(S.all, di, w); add(S.cur, di, w); riI[rp] = di; riW[rp] = w; rp = (rp + 1) % RING; rn++;
        }
      }
      lastT = t;
      if (a - lastShow > 500) { lastShow = a; show(a); }
    });
  };
  window.__perf = { summary: summary, export: function () { return JSON.stringify(summary()); }, reset: reset };
})();
