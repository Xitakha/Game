/* cine.js - G.Cine: mini motor de cinemáticas (v9, DESIGN-v9-cinematicas.md). SOLO dibujo y audio: nunca llama a G.rng, nunca avanza G.time / G.runT ni toca la simulación.
   - Reloj propio: avanza únicamente con el paso fijo (G.STEP) en G.Cine.update(dt). Su azar sale de un mulberry32 propio (C.rng(id)).
   - Guion = tabla de datos:  { id, len, letterbox:{ in:[ms,ms], out:[ms,ms], bar }, scenes:[{ at, dur, draw(c, p, t, S), cam:{ from:{x,y,z}, to:{x,y,z}, ease }, layers:[{ draw(c,p,t,S), par, bake:{w,h} }] }],
                tracks:[{ at, type, ... }] }
     Pistas (cada una se dispara UNA vez cuando el reloj pasa de `at`):  dlg {who,color,text,dur}  title {text,sub,dur}  sfx {name,vol,pitch}  music {track,intensity|stop}  stinger {name}
                flash {color,a,ms}  shake {amp,ms}  fade {from,to,dur,color}  tween {prop,from,to,dur,ease}  fn {fn}.
   - Capas con paralaje (par 0 = fija, 1 = sigue la cámara); `bake` hornea la capa una vez en un canvas fuera de pantalla (se libera al cambiar de escena, <= 3 vivos).
   - Texto máquina de escribir (32 car/s, un bip por palabra); subtítulos SIEMPRE (el diálogo es texto). Un toque completa la línea y otro pasa a la siguiente escena.
   - Saltar: botón SALTAR (>= 104x40) y Esc, solo si opts.skippable (la 1.ª vez la intro va bloqueada). Pausa en segundo plano (visibilitychange / blur / pagehide) con "TOCA PARA CONTINUAR".
   - Accesibilidad: opts.calm (Reducir destellos): destellos <= 25 % de alfa y como mucho 2 por segundo; las sacudidas obedecen a G.shakeMul y se acotan a 4 px.
   - Perillas (?cine=): 0 apaga todo (play() llama a onEnd('off') al instante), 1 fuerza título + intro, short = fuerza entradas cortas (fase 2). Sin ?cine=, el flujo automático (título e intro)
     solo corre con la URL "limpia" de un jugador (sin parámetros de prueba) y fuera de navegadores automatizados (navigator.webdriver). */
(function () {
  'use strict';
  var G = window.G, C = G.Cine = {}, TAU = Math.PI * 2;
  var S = null;   // reproducción activa

  // ---------------------------------------------------------------- Perillas por URL
  var m = /[?&]cine=(\w+)/.exec(location.search), P = m ? m[1] : null;
  C.param = P;
  C.off = P === '0' || P === 'off';
  C.force = P === '1' || P === 'short' || P === 'on';
  C.shortForced = P === 'short';
  var BENIGN = /^(utm_\w+|source|v|ref|fbclid|gclid)$/;
  function cleanUrl() {
    var q = location.search.replace(/^\?/, ''); if (!q) return true;
    return q.split('&').every(function (kv) { return !kv || BENIGN.test(kv.split('=')[0]); });
  }
  // ¿corre el flujo automático (título + intro) al abrir el juego?
  C.auto = !C.off && (C.force || (cleanUrl() && !navigator.webdriver));

  // ---------------------------------------------------------------- Ajustes (settings.cine; el guardado v12 los crea con las demás claves)
  function mqCalm() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  C.cfg = function () {
    var s = G.Save && G.Save.data && G.Save.data.settings, c = (s && s.cine) || {};
    return { calm: c.calm == null ? mqCalm() : !!c.calm, textSpeed: c.textSpeed == null ? 1 : c.textSpeed, soundCaps: c.soundCaps !== false };
  };
  C.setCalm = function (v) {
    var Sv = G.Save.data; if (!Sv.settings) Sv.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    if (!Sv.settings.cine || typeof Sv.settings.cine !== 'object') Sv.settings.cine = { calm: null, textSpeed: 1, soundCaps: true };
    Sv.settings.cine.calm = !!v; G.Save.save();
  };

  // ---------------------------------------------------------------- Utilidades
  C.rng = function (id) {   // mulberry32 propio sembrado con el id del guion (NUNCA G.rng ni Math.random)
    var h = 2166136261 >>> 0, s = String(id), i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var a = h || 1;
    return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  var EASE = {
    lin: function (u) { return u; },
    inout: function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; },
    out: function (u) { return 1 - Math.pow(1 - u, 3); },
    back: function (u) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  };
  C.EASE = EASE;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }

  // ---------------------------------------------------------------- Audio (si falta el recurso: silencio / sonido de reserva)
  C.blip = function (who) {
    try {
      if (G.Snd && G.Snd.cine && typeof G.Snd.cine.blip === 'function') G.Snd.cine.blip(who);
      else G.sfx('flip', { vol: 0.1, pitch: who === 'LANUDO' ? 0.7 : 1 });
    } catch (e) { /* audio opcional */ }
  };
  function cineSfx(name, o) {
    try {
      if (G.Snd && G.Snd.cine && typeof G.Snd.cine.play === 'function' && G.Snd.cine.has && G.Snd.cine.has(name)) G.Snd.cine.play(name, o);
      else if (G.Snd && G.Snd.has && G.Snd.has(name)) G.Snd.play(name, o);
      else if (window.Assets && Assets.sfx) Assets.sfx(name, o);
    } catch (e) { /* audio opcional */ }
  }
  function musicStop() { try { Assets.music.stop(); } catch (e) { /* audio */ } }

  // ---------------------------------------------------------------- Reproducción
  /* C.play(script, opts)  opts: { mode:'full'|'overlay', first:bool (bloqueada, sin salto), skippable:bool, calm:bool, replay:bool, onEnd(reason), onSkip() }  reason = 'end' | 'skip' | 'off' */
  C.play = function (script, opts) {
    opts = opts || {};
    if (C.off && !opts.ignoreOff) { if (opts.onEnd) opts.onEnd('off'); return false; }
    if (S) finish('skip');
    var cfg = C.cfg();
    S = { script: script, opts: opts, mode: opts.mode || 'full', t: 0, paused: false, locked: !!opts.first || opts.skippable === false, fired: new Array((script.tracks || []).length),
      nFired: 0, vars: {}, tweens: [], line: null, title: null, fades: [], flashes: [], lastFlash: -1e9, shake: null, rng: C.rng(script.id), baked: {}, silent: false,
      calm: opts.calm != null ? !!opts.calm : cfg.calm, speed: cfg.textSpeed, maxFlashA: 0, flashCount: 0, shakePx: 0, advAt: 0, sceneIdx: -1, ended: false, bips: 0 };
    S.tracks = (script.tracks || []).map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return a.e.at - b.e.at || a.i - b.i; });
    if (S.mode === 'full') { S.prevState = G.state; G.state = 'cine'; }
    if (G.input) G.input.lock = Math.max(G.input.lock || 0, 200);
    fireDue();
    return true;
  };
  C.active = function () { return !!S; };
  C.info = function () { return S ? { id: S.script.id, t: S.t, len: S.script.len, locked: S.locked, paused: S.paused, fired: S.nFired, scene: S.sceneIdx, maxFlashA: S.maxFlashA, flashCount: S.flashCount, shakePx: S.shakePx, bakedCanvases: Object.keys(S.baked).length, line: S.line ? S.line.text : null } : null; };
  C.pause = function (b) {
    if (!S) return;
    b = !!b; if (S.paused === b) return; S.paused = b;
    try { if (b) { Assets.suspendAudio(); G.Snd.suspend(); } else if (!(G.Sys && G.Sys.muted)) { Assets.resumeAudio(); G.Snd.resume(); } } catch (e) { /* audio */ }
  };
  C.skip = function () { if (!S || S.locked) return false; finish('skip'); return true; };
  C.end = function () { if (S) finish('end'); };   // cierre forzado por el código (no por el jugador)

  function finish(reason) {
    var s = S; if (!s || s.ended) return; s.ended = true; S = null;
    Object.keys(s.baked).forEach(function (k) { s.baked[k].width = 0; });   // libera los canvases horneados
    if (s.opts.stopMusic !== false) musicStop();
    var o = s.opts;
    if (s.mode === 'full' && G.state === 'cine') G.state = o.returnState || 'aldea';
    if (reason === 'skip' && o.onSkip) o.onSkip();
    if (o.onEnd) o.onEnd(reason);
  }

  // ---- pistas
  function fireDue() {
    var tr = S.tracks;
    for (var i = 0; i < tr.length && S; i++) {
      var e = tr[i].e, k = tr[i].i;
      if (e.at > S.t) break;
      if (S.fired[k]) continue;
      S.fired[k] = true; S.nFired++; run(e);
    }
  }
  function run(e) {
    var o = S.silent;
    switch (e.type) {
      case 'dlg': S.line = { who: e.who || '', color: e.color || '#f0e8d8', text: e.text, t0: S.t, until: e.dur ? S.t + e.dur : 1e9, shown: 0, bipAt: -1 }; break;
      case 'clear': S.line = null; break;
      case 'title': S.title = { text: e.text, sub: e.sub || '', t0: S.t, dur: e.dur || 3000, color: e.color || '#ffd27a' }; break;
      case 'sfx': if (!o) cineSfx(e.name, { vol: e.vol, pitch: e.pitch }); break;
      case 'stinger': if (!o) { try { G.Snd.play(e.name); } catch (x) { /* audio */ } } break;
      case 'music':
        try {
          if (e.stop) Assets.music.stop();
          else if (Assets.music.tracks().indexOf(e.track) >= 0) { Assets.music.setTrack(e.track); if (e.intensity != null) Assets.music.setIntensity(e.intensity); Assets.music.start(); }
          else if (e.intensity != null) Assets.music.setIntensity(e.intensity);
        } catch (x2) { /* audio */ }
        break;
      case 'flash':
        if (o) break;
        if (S.calm && S.t - S.lastFlash < 500) break;   // Reducir destellos: como mucho 2 por segundo
        S.lastFlash = S.t; S.flashCount++; S.flashes.push({ color: e.color || '#fff2b0', a: S.calm ? Math.min(e.a == null ? 0.6 : e.a, 0.25) : (e.a == null ? 0.6 : e.a), ms: e.ms || 300, t0: S.t });
        break;
      case 'shake': if (!o) { S.shake = { amp: Math.min(4, (e.amp || 4) * (G.shakeMul == null ? 1 : G.shakeMul)), ms: e.ms || 300, t0: S.t }; } break;
      case 'fade': S.fades.push({ from: e.from == null ? 1 : e.from, to: e.to == null ? 0 : e.to, dur: e.dur || 500, color: e.color || '#000', t0: S.t }); break;
      case 'tween': S.tweens.push({ prop: e.prop, from: e.from, to: e.to, dur: e.dur || 1000, ease: EASE[e.ease] || EASE.inout, t0: S.t }); break;
      case 'fn': try { e.fn(S, C); } catch (x3) { /* guion */ } break;
    }
  }

  // ---- escena y cámara
  function sceneAt(t) {
    var sc = S.script.scenes || [], i;
    for (i = sc.length - 1; i >= 0; i--) if (t >= sc[i].at) return i;
    return -1;
  }
  function camOf(sc, t) {
    var cm = sc.cam; if (!cm) return { x: 0, y: 0, z: 1 };
    var u = cl((t - sc.at) / (sc.dur || 1), 0, 1), e = (EASE[cm.ease] || EASE.inout)(u), f = cm.from || { x: 0, y: 0, z: 1 }, to = cm.to || f;
    return { x: lerp(f.x || 0, to.x || 0, e), y: lerp(f.y || 0, to.y || 0, e), z: lerp(f.z || 1, to.z || 1, e) };
  }

  // ---------------------------------------------------------------- Actualización
  function advance() {   // 1.er toque completa la línea; 2.º pasa a la siguiente escena
    var L = S.line, sc = S.script.scenes || [], i = S.sceneIdx;
    if (L && L.shown < L.text.length) { L.shown = L.text.length; L.manual = true; return; }
    if (i >= 0 && i + 1 < sc.length && S.t - sc[i].at > 700) {
      S.silent = true; S.t = sc[i + 1].at; fireDue(); S.silent = false;
    }
  }
  C.advance = function () { if (S) advance(); };
  function skipRect() { return { x: G.W - 116, y: 52, w: 104, h: 40 }; }
  C.skipRect = skipRect;

  C.update = function (dt) {
    if (!S) return;
    var inp = G.input, tap = inp.hit('Mouse0'), kb = inp.hit('Space', 'Enter', 'KeyE');
    if (S.paused) { if (tap || kb) C.pause(false); return; }
    if (!S.locked && (inp.hit('Escape') || (tap && G.UI && G.UI.inR(skipRect(), inp.mouse)))) { finish('skip'); return; }
    if (inp.lock <= 0 && (tap || kb)) advance();
    if (!S) return;
    S.t += dt;
    var i = sceneAt(S.t); if (i !== S.sceneIdx) { S.prevIdx = S.sceneIdx; S.sceneIdx = i; S.sceneT0 = S.t; freeBaked(); }
    fireDue(); if (!S) return;
    var L = S.line;
    if (L) {
      var cps = 32 * (S.speed || 1), n = S.speed === 0 ? L.text.length : Math.min(L.text.length, Math.floor((S.t - L.t0) * cps / 1000));
      if (n > L.shown) {
        for (var k = L.shown; k < n; k++) if (k === 0 || L.text.charAt(k - 1) === ' ') { S.bips++; if (!S.silent && S.speed !== 0) C.blip(L.who); }
        L.shown = n;
      }
      if (S.t > L.until) S.line = null;
    }
    if (S.t >= S.script.len) finish('end');
  };
  function freeBaked() {   // máx. 3 canvases vivos: se liberan los de escenas que ya no se ven
    var keep = {}, k; keep[S.sceneIdx] = 1; keep[S.prevIdx] = 1;
    for (k in S.baked) if (!keep[k.split('.')[0]]) { S.baked[k].width = 0; delete S.baked[k]; }
  }

  // ---------------------------------------------------------------- Dibujo
  function drawScene(c, idx, t, alpha) {
    var sc = S.script.scenes[idx]; if (!sc) return;
    var p = cl((t - sc.at) / (sc.dur || 1), 0, 1), lt = Math.max(0, t - sc.at), cam = camOf(sc, t), layers = sc.layers || [{ draw: sc.draw, par: 1 }], i;
    c.save(); if (alpha < 1) c.globalAlpha = alpha;
    for (i = 0; i < layers.length; i++) {
      var ly = layers[i], par = ly.par == null ? 1 : ly.par, z = 1 + (cam.z - 1) * (0.35 + 0.65 * par);
      c.save();
      c.translate(G.W / 2, G.H / 2); c.scale(z, z); c.translate(-G.W / 2 - cam.x * par, -G.H / 2 - cam.y * par);
      if (ly.bake) {
        var key = idx + '.' + i, cv = S.baked[key];
        if (!cv) { cv = document.createElement('canvas'); cv.width = ly.bake.w; cv.height = ly.bake.h; ly.draw(cv.getContext('2d'), 0, 0, S); S.baked[key] = cv; }
        c.drawImage(cv, ly.bake.x || 0, ly.bake.y || 0);
      } else ly.draw(c, p, lt, S);
      c.restore();
    }
    c.restore();
  }
  function wrapText(c, text, maxW, size) {
    c.font = 'bold ' + size + 'px "Courier New", monospace';
    var words = text.split(' '), lines = [], line = '', i;
    for (i = 0; i < words.length; i++) { var tst = line ? line + ' ' + words[i] : words[i]; if (c.measureText(tst).width > maxW && line) { lines.push(line); line = words[i]; } else line = tst; }
    if (line) lines.push(line);
    return lines;
  }
  C.wrap = wrapText;

  C.draw = function (c) {
    if (!S) return;
    var W = G.W, H = G.H, t = S.t, sc = S.script, i, sh = { x: 0, y: 0 };
    c.fillStyle = '#05030a'; c.fillRect(0, 0, W, H);
    if (S.shake) {
      var u = (t - S.shake.t0) / S.shake.ms;
      if (u >= 1) S.shake = null; else { var a = S.shake.amp * (1 - u); sh.x = Math.sin(t * 0.09) * a; sh.y = Math.cos(t * 0.13) * a; S.shakePx = Math.max(S.shakePx, Math.hypot(sh.x, sh.y)); }
    }
    c.save(); if (sh.x || sh.y) c.translate(Math.round(sh.x), Math.round(sh.y));
    // tweens (valores en S.vars)
    for (i = S.tweens.length - 1; i >= 0; i--) { var tw = S.tweens[i], uu = cl((t - tw.t0) / tw.dur, 0, 1); S.vars[tw.prop] = lerp(tw.from, tw.to, tw.ease(uu)); if (uu >= 1) S.tweens.splice(i, 1); }
    var idx = S.sceneIdx;
    if (idx >= 0) {
      var sc0 = sc.scenes[idx], fu = idx > 0 ? cl((t - sc0.at) / 450, 0, 1) : 1;
      if (fu < 1) drawScene(c, idx - 1, sc0.at - 1, 1);   // fundido cruzado con el final de la escena anterior
      drawScene(c, idx, t, fu);
    }
    c.restore();
    if (sc.over) sc.over(c, t, S);   // capa común (viñeta, grano...)
    // barras de cine
    var lb = sc.letterbox;
    if (lb) {
      var bu = 1, bar = lb.bar || 44;
      if (lb.in) bu = cl((t - lb.in[0]) / Math.max(1, lb.in[1] - lb.in[0]), 0, 1);
      if (lb.out && t > lb.out[0]) bu = Math.min(bu, 1 - cl((t - lb.out[0]) / Math.max(1, lb.out[1] - lb.out[0]), 0, 1));
      var bh = Math.round(bar * EASE.out(bu)); c.fillStyle = '#000'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
    }
    // cartel
    if (S.title) {
      var T = S.title, tu = (t - T.t0) / T.dur;
      if (tu >= 1) S.title = null;
      else {
        var ta = Math.min(1, tu * 5, (1 - tu) * 4); c.save(); c.globalAlpha = Math.max(0, ta);
        G.txt(c, T.text, W / 2, H / 2 - 10, 54, T.color, 'center'); if (T.sub) G.txt(c, T.sub, W / 2, H / 2 + 38, 20, '#f0e8d8', 'center'); c.restore();
      }
    }
    // fundidos
    for (i = S.fades.length - 1; i >= 0; i--) {
      var fd = S.fades[i], fu2 = cl((t - fd.t0) / fd.dur, 0, 1), fa = lerp(fd.from, fd.to, fu2);
      c.save(); c.globalAlpha = fa; c.fillStyle = fd.color; c.fillRect(0, 0, W, H); c.restore();
      if (fu2 >= 1 && fd.to <= 0.001) S.fades.splice(i, 1);
    }
    // destellos (filtrados por Reducir destellos en run())
    for (i = S.flashes.length - 1; i >= 0; i--) {
      var fl = S.flashes[i], fu3 = (t - fl.t0) / fl.ms;
      if (fu3 >= 1) { S.flashes.splice(i, 1); continue; }
      var al = fl.a * (1 - fu3); if (al > S.maxFlashA) S.maxFlashA = al;
      c.save(); c.globalAlpha = al; c.fillStyle = fl.color; c.fillRect(0, 0, W, H); c.restore();
    }
    // subtítulo / diálogo (siempre visible)
    var L = S.line;
    if (L) drawLine(c, L);
    // botón SALTAR o pista de avance
    if (!S.locked) {
      var r = skipRect(), hov = G.UI && G.UI.inR(r, G.input.mouse);
      c.save(); c.fillStyle = hov ? 'rgba(90,70,120,0.92)' : 'rgba(20,12,32,0.8)'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = '#bfa8e8'; c.lineWidth = 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); c.restore();
      G.txt(c, 'SALTAR', r.x + r.w / 2, r.y + r.h / 2, 16, '#fff', 'center');
    }
    G.txt(c, S.locked ? 'Toca: avanzar' : 'Toca: avanzar  -  Esc: saltar', 14, H - 12, 10, 'rgba(200,190,220,0.55)', 'left');
    if (S.paused) {
      c.fillStyle = 'rgba(5,3,10,0.82)'; c.fillRect(0, 0, W, H);
      G.txt(c, 'PAUSA', W / 2, H / 2 - 24, 34, '#ffd27a', 'center'); G.txt(c, 'TOCA PARA CONTINUAR', W / 2, H / 2 + 22, 20, '#f0e8d8', 'center');
    }
  };
  function drawLine(c, L) {
    var W = G.W, H = G.H, txt = L.text.slice(0, L.shown), full = wrapText(c, L.text, 760, 18), n = full.length, bh = 30 + n * 26 + (L.who ? 14 : 0), y = H - 52 - bh, i;
    c.save(); c.fillStyle = 'rgba(8,4,14,0.86)'; c.fillRect(60, y, 840, bh); c.strokeStyle = L.color; c.lineWidth = 2; c.strokeRect(61, y + 1, 838, bh - 2);
    var ty = y + 22;
    if (L.who) { G.txt(c, L.who, 84, ty, 14, L.color, 'left'); ty += 22; }
    var shown = 0;
    for (i = 0; i < n; i++) {
      var part = full[i].slice(0, Math.max(0, txt.length - shown)); shown += full[i].length + 1;
      if (part) G.txt(c, part, 84, ty + i * 26, 18, '#f4ecdc', 'left');
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Pausa en segundo plano
  function bg() { if (S && !S.paused) C.pause(true); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) bg(); });
  window.addEventListener('blur', bg);
  window.addEventListener('pagehide', bg);
})();
