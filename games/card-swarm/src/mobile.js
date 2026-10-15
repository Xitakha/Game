/* mobile.js - Swarm Hand en móvil (Nivel 1): G.Sys.
   - Escala: el lienzo 960x540 conserva su proporción 16:9 (letterbox) dentro del área segura (env(safe-area-inset-*)) y se redimensiona con innerWidth/innerHeight
     (arregla el 100vh móvil). Resolución interna = tamaño CSS x DPR (máx. 2) limitado por la calidad; en escritorio sigue siendo 960x540 pixelado como siempre.
   - Vertical: aviso "gira el teléfono" (la partida se pausa). Pantalla completa (Fullscreen API; en iOS Safari no existe: se recomienda instalar la app).
   - Calidad adaptativa: medidor de fps (media móvil), Auto baja efectos si < 45 fps sostenidos; manual Alta / Media / Baja / Auto en Ajustes (se guarda en el save).
   - Ciclo de vida: pausa automática en visibilitychange / pagehide / blur / orientationchange, reloj sin saltos al volver, audio suspendido y reanudado, silencio persistente.
   - Botones de sistema dibujados en el lienzo (pausa, silencio, pantalla completa) con zona táctil de 50 px.
   Parámetros URL de depuración: ?q=alta|media|baja|auto  ?safe=top,right,bottom,left (px, simula la muesca)  ?fps=1 (contador en pantalla)  ?mobile=1 (fuerza modo móvil). */
(function () {
  'use strict';
  var G = window.G, Sys = G.Sys = {};
  var UA = navigator.userAgent || '';
  function q(name) { var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  Sys.isMobile = coarse || /Android|iPhone|iPad|iPod|Mobile|CriOS|FxiOS/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1) || q('mobile') === '1';
  Sys.touchActive = Sys.isMobile;                 // dinámico: el último dispositivo usado decide los textos de ayuda (toque / teclado)
  Sys.isTouch = function () { return Sys.touchActive; };
  Sys.muted = false; Sys.fps = 60; Sys.paused = false;
  Sys.isIOS = /iPad|iPhone|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);

  // ------------------------------------------------------------------ Calidad
  // s = factor de resolución interna máximo; pm = fracción de partículas; flat = sin degradados en zonas / telegrafías; enemyMul = tope de enemigos vivos
  var LV = {
    alta:  { name: 'ALTA',  s: 2,   pm: 1,   cpsCap: 500, partCap: 500, fog: 2, vig: true,  flies: 60, nums: 70, agg: false, flat: false, projCap: 400, enemyMul: 1 },
    media: { name: 'MEDIA', s: 1.5, pm: 0.6, cpsCap: 260, partCap: 220, fog: 1, vig: true,  flies: 24, nums: 40, agg: false, flat: false, projCap: 260, enemyMul: 0.9 },
    baja:  { name: 'BAJA',  s: 1,   pm: 0.3, cpsCap: 110, partCap: 90,  fog: 0, vig: false, flies: 0,  nums: 18, agg: true,  flat: true,  projCap: 150, enemyMul: 0.75 }
  };
  var ORDER = ['alta', 'media', 'baja'];
  var Q = G.Q = {};
  function applyLevel(name) {
    var L = LV[name] || LV.alta; for (var k in L) Q[k] = L[k]; Q.level = name;
  }
  applyLevel('alta');
  G.fg = function (grad, flat) { return Q.flat ? flat : grad; };   // degradado o color plano según la calidad
  Sys.qMode = 'auto';                                              // 'auto' | 'alta' | 'media' | 'baja'
  Sys.qualityLabel = function () { return Sys.qMode === 'auto' ? 'AUTO (' + Q.name + ')' : Q.name; };

  function settings() {
    var S = G.Save && G.Save.data; if (!S) return {};
    if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    return S.settings;
  }
  function saveSettings() { try { G.Save.save(); } catch (e) { /* sin storage */ } }
  Sys.setQuality = function (mode, silent) {
    Sys.qMode = mode;
    var lvl = mode === 'auto' ? (settings().qlast && LV[settings().qlast] ? settings().qlast : (Sys.isMobile ? 'media' : 'alta')) : mode;
    applyLevel(lvl); lowT = 0; cool = 4000;
    if (!silent) { settings().quality = mode; saveSettings(); }
    fit();
  };
  Sys.cycleQuality = function () {
    var order = ['auto', 'alta', 'media', 'baja'];
    Sys.setQuality(order[(order.indexOf(Sys.qMode) + 1) % order.length]);
  };

  // Medidor de fps (media móvil de los últimos 45 fotogramas). Auto: si la media es < 45 fps durante 3 s seguidos, baja un nivel (con 4 s de enfriamiento).
  var ring = [], ringN = 45, lowT = 0, cool = 4000, fpsShow = q('fps') === '1';
  Sys.frame = function (raw) {
    if (!(raw > 0) || raw > 250 || document.hidden || Sys.paused) { lowT = 0; return; }
    ring.push(raw); if (ring.length > ringN) ring.shift();
    if (ring.length < 20) return;
    var sum = 0; for (var i = 0; i < ring.length; i++) sum += ring[i];
    Sys.fps = 1000 / (sum / ring.length);
    if (cool > 0) { cool -= raw; return; }
    if (Sys.qMode !== 'auto') return;
    if (Sys.fps < 45) {
      lowT += raw;
      if (lowT > 3000) {
        var i2 = ORDER.indexOf(Q.level);
        if (i2 < ORDER.length - 1) {
          applyLevel(ORDER[i2 + 1]); settings().qlast = Q.level; saveSettings(); fit();
          Sys.toast('Gráficos: ' + Q.name + ' (automático)', { ms: 2200 });
          ring.length = 0;
        }
        lowT = 0; cool = 4000;
      }
    } else lowT = Math.max(0, lowT - raw * 2);
  };

  // ------------------------------------------------------------------ DOM: estilos, aviso, toast, modal
  function el(tag, css, parent, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  var FONT = 'font:bold 15px "Courier New",monospace;';
  var stage, canvas, rotate, toastBox, safeProbe, insets = { t: 0, r: 0, b: 0, l: 0 };

  Sys.toast = function (text, o) {
    o = o || {};
    if (!toastBox) return;
    toastBox.innerHTML = ''; toastBox.style.display = 'flex';
    el('span', FONT + 'color:#ffe9a0;padding:4px 8px', toastBox, text);
    var done = function () { toastBox.style.display = 'none'; clearTimeout(toastBox._t); };
    if (o.btn) { var b = el('button', btnCss('#2a8a4a'), toastBox, o.btn); b.onclick = function () { done(); if (o.onbtn) o.onbtn(); }; }
    if (o.close) { var x = el('button', btnCss('#3a2f48'), toastBox, 'X'); x.style.minWidth = '48px'; x.onclick = done; }
    clearTimeout(toastBox._t); if (o.ms) toastBox._t = setTimeout(done, o.ms);
  };
  function btnCss(bg) { return FONT + 'min-height:48px;min-width:72px;padding:0 14px;margin-left:6px;border:3px solid #ffd27a;background:' + bg + ';color:#fff;cursor:pointer;touch-action:manipulation'; }
  Sys.btnCss = btnCss;

  // Modal DOM sencillo (texto, área de texto opcional y botones de 48 px). o: { title, text, area: {value, readonly, placeholder}, buttons: [{label, fn, color}] }
  Sys.modal = function (o) {
    var back = el('div', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:30;background:rgba(7,5,12,.88);display:flex;align-items:center;justify-content:center;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));box-sizing:border-box;touch-action:pan-y', document.body);
    var box = el('div', FONT + 'color:#e8dcb0;background:#1a1226;border:3px solid #8a7aa6;max-width:560px;width:100%;max-height:100%;overflow:auto;padding:14px;box-sizing:border-box;-webkit-user-select:text;user-select:text;touch-action:pan-y', back);
    if (o.title) el('div', 'font-size:20px;color:#ffd27a;margin-bottom:8px', box, o.title);
    if (o.text) { var t = el('div', 'font-size:14px;line-height:1.35;white-space:pre-wrap;margin-bottom:8px', box); t.textContent = o.text; }
    var ta = null;
    if (o.area) {
      ta = el('textarea', 'width:100%;height:96px;box-sizing:border-box;background:#0d0a14;color:#9dffb4;border:2px solid #4a3a66;font:12px "Courier New",monospace;-webkit-user-select:text;user-select:text', box);
      ta.value = o.area.value || ''; ta.readOnly = !!o.area.readonly; ta.placeholder = o.area.placeholder || '';
      if (o.area.readonly) ta.onfocus = function () { ta.select(); };
    }
    var row = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px', box);
    var close = function () { if (back.parentNode) back.parentNode.removeChild(back); };
    (o.buttons || [{ label: 'CERRAR' }]).forEach(function (b) {
      var bt = el('button', btnCss(b.color || '#4a3a66') + ';margin-left:0;flex:1 1 120px', row, b.label);
      bt.onclick = function () { if (b.fn) { if (b.fn(ta, close) === false) return; } close(); };
    });
    return { close: close, box: box, area: ta };
  };

  // ------------------------------------------------------------------ Escala, DPR y áreas seguras
  function readInsets() {
    var sf = q('safe');
    if (sf) { var a = sf.split(',').map(Number); insets = { t: a[0] || 0, r: a[1] || 0, b: a[2] || 0, l: a[3] || 0 }; return; }
    var cs = getComputedStyle(safeProbe);
    insets = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  Sys.insets = function () { return insets; };
  Sys.layout = { cw: 0, ch: 0, left: 0, top: 0, dpr: 1 };
  function portrait() { return Sys.isMobile && window.innerHeight > window.innerWidth * 1.05; }
  function fit() {
    if (!canvas) return;
    var vv = window.visualViewport;
    var w = Math.floor(window.innerWidth), h = Math.floor(window.innerHeight);
    if (vv && vv.width && vv.height && Math.abs(vv.scale - 1) < 0.01) { w = Math.floor(vv.width); h = Math.floor(vv.height); }
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    readInsets();
    var aw = Math.max(50, w - insets.l - insets.r), ah = Math.max(50, h - insets.t - insets.b);
    var cw = aw, ch = aw * 9 / 16;
    if (ch > ah) { ch = ah; cw = ah * 16 / 9; }
    cw = Math.floor(cw); ch = Math.floor(ch);
    var left = Math.round(insets.l + (aw - cw) / 2), top = Math.round(insets.t + (ah - ch) / 2);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px'; canvas.style.left = left + 'px'; canvas.style.top = top + 'px';
    // resolución interna: móvil = CSS x DPR (máx. 2) limitado por la calidad; escritorio = 960x540 como siempre (pixelado)
    var dpr = Math.min(window.devicePixelRatio || 1, 2), s = 1;
    if (Sys.isMobile) s = Math.max(1, Math.min(cw * dpr / G.W, Q.s));
    s = Math.round(s * 20) / 20;
    var bw = Math.round(G.W * s), bh = Math.round(G.H * s);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    G.rs = bw / G.W;
    canvas.style.imageRendering = Sys.isMobile && s > 1 ? 'auto' : 'pixelated';
    Sys.layout = { cw: cw, ch: ch, left: left, top: top, dpr: dpr, w: w, h: h };
    var port = portrait();
    rotate.style.display = port ? 'flex' : 'none';
    if (port) autoPause();
  }
  Sys.fit = fit;

  // ------------------------------------------------------------------ Pausa automática, audio y silencio
  function autoPause() {
    if (G.state === 'play') { G.state = 'paused'; try { G.Hud.pauseOpen(); } catch (e) { /* hud */ } }
    if (G.input.releaseAll) G.input.releaseAll();
  }
  Sys.autoPause = autoPause;
  function audioOff() { try { Assets.suspendAudio(); } catch (e) { /* audio */ } try { G.Snd.suspend(); } catch (e2) { /* audio */ } }
  function audioOn() { if (Sys.muted) return; try { Assets.resumeAudio(); } catch (e) { /* audio */ } try { G.Snd.resume(); } catch (e2) { /* audio */ } }
  Sys.toggleMute = function () {
    Sys.muted = !Sys.muted; applyMute(); settings().muted = Sys.muted ? 1 : 0; saveSettings();
    if (!Sys.muted) { try { G.Snd.unlock(); Assets.unlock(); } catch (e) { /* audio */ } }
  };
  // Tras importar un guardado: relee silencio y calidad
  Sys.reloadSettings = function () { var st = settings(); Sys.muted = !!st.muted; applyMute(); Sys.setQuality(st.quality || 'auto', true); };
  function applyMute() { try { Assets.setMuted(Sys.muted); } catch (e) { /* audio */ } try { G.Snd.setMuted(Sys.muted); } catch (e2) { /* audio */ } }
  function kick() { if (Sys.muted) return; try { G.Snd.unlock(); } catch (e) { /* audio */ } try { if (document.visibilityState === 'visible' && !Assets.isUnlocked()) Assets.unlock(); } catch (e2) { /* audio */ } }

  function onHide() { Sys.paused = true; autoPause(); audioOff(); }
  function onShow() { Sys.paused = false; ring.length = 0; lowT = 0; cool = Math.max(cool, 2000); if (G.resetClock) G.resetClock(); audioOn(); setTimeout(fit, 60); }

  // ------------------------------------------------------------------ Pantalla completa
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  Sys.isFullscreen = function () { return !!fsEl(); };
  Sys.fsSupported = function () { var d = document.documentElement; return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !!(d.requestFullscreen || d.webkitRequestFullscreen); };
  Sys.standalone = function () { return !!(window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone === true; };
  Sys.toggleFullscreen = function () {
    if (!Sys.fsSupported()) { Sys.toast(Sys.isIOS ? 'iPhone: usa Compartir > Añadir a pantalla de inicio para jugar a pantalla completa.' : 'Pantalla completa no disponible.', { ms: 3500 }); return; }
    var d = document.documentElement, p;
    try {
      if (fsEl()) { p = (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
      else {
        p = (d.requestFullscreen || d.webkitRequestFullscreen).call(d, { navigationUI: 'hide' });
        Promise.resolve(p).then(function () { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* sin lock */ } }, function () {});
      }
      if (p && p.catch) p.catch(function () { Sys.toast('El navegador no permitió la pantalla completa.', { ms: 2500 }); });
    } catch (e) { Sys.toast('El navegador no permitió la pantalla completa.', { ms: 2500 }); }
  };

  // ------------------------------------------------------------------ Botones de sistema en el lienzo
  var BTN = {
    pause: { x: 246, y: 6, w: 48, h: 48 },
    muteRun: { x: 298, y: 6, w: 48, h: 48 },
    muteAld: { x: 346, y: 6, w: 48, h: 48 },
    fsAld: { x: 398, y: 6, w: 48, h: 48 }
  };
  function barKind() {
    if (G.state === 'play') return 'run';
    if (G.state === 'aldea' && G.Aldea.sysBarOK()) return 'aldea';
    return null;
  }
  function active() {
    var k = barKind(), out = [];
    if (k === 'run') { if (G.Boss && G.Boss.intro) return out; out.push(['pause', BTN.pause]); out.push(['mute', BTN.muteRun]); }   // sin botones durante la intro del jefe
    else if (k === 'aldea') { out.push(['mute', BTN.muteAld]); if (Sys.fsSupported() && !Sys.standalone()) out.push(['fs', BTN.fsAld]); }
    return out;
  }
  Sys.onButton = function (m) { var a = active(); for (var i = 0; i < a.length; i++) if (G.UI.inR(a[i][1], m)) return true; return false; };
  Sys.tap = function (m) {
    var a = active();
    for (var i = 0; i < a.length; i++) {
      if (!G.UI.inR(a[i][1], m)) continue;
      var id = a[i][0];
      if (id === 'pause') { G.state = 'paused'; G.Hud.pauseOpen(); G.sfx('flip', { vol: 0.4 }); }
      else if (id === 'mute') Sys.toggleMute();
      else if (id === 'fs') Sys.toggleFullscreen();
      return true;
    }
    return false;
  };
  function icon(c, id, r) {
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    c.save(); c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
    if (id === 'pause') { c.fillRect(cx - 9, cy - 10, 6, 20); c.fillRect(cx + 3, cy - 10, 6, 20); }
    else if (id === 'mute') {
      c.beginPath(); c.moveTo(cx - 12, cy - 4); c.lineTo(cx - 6, cy - 4); c.lineTo(cx + 1, cy - 11); c.lineTo(cx + 1, cy + 11); c.lineTo(cx - 6, cy + 4); c.lineTo(cx - 12, cy + 4); c.closePath(); c.fill();
      c.lineWidth = 3;
      if (Sys.muted) { c.strokeStyle = '#ff6a6a'; c.beginPath(); c.moveTo(cx + 6, cy - 6); c.lineTo(cx + 15, cy + 6); c.moveTo(cx + 15, cy - 6); c.lineTo(cx + 6, cy + 6); c.stroke(); }
      else { c.beginPath(); c.arc(cx + 2, cy, 7, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(cx + 2, cy, 12, -0.8, 0.8); c.stroke(); }
    } else if (id === 'fs') {
      var o = Sys.isFullscreen() ? -1 : 1; c.lineWidth = 3.5;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (k) {
        var x = cx + k[0] * 11 * (o > 0 ? 1 : 0.55), y = cy + k[1] * 11 * (o > 0 ? 1 : 0.55);
        c.beginPath(); c.moveTo(x - k[0] * 7 * o, y); c.lineTo(x, y); c.lineTo(x, y - k[1] * 7 * o); c.stroke();
      });
    }
    c.restore();
  }
  Sys.drawBar = function (c) {
    var a = active(), m = G.input.mouse, i;
    for (i = 0; i < a.length; i++) {
      var r = a[i][1], hov = G.UI.inR(r, m) && !Sys.isTouch();
      c.save(); c.fillStyle = hov ? '#4a3a66' : 'rgba(10,6,18,0.72)'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = '#8a7aa6'; c.lineWidth = 3; c.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3); c.restore();
      icon(c, a[i][0], r);
    }
    if (fpsShow) G.txt(c, Math.round(Sys.fps) + ' fps  Q:' + Q.level + '  x' + (G.rs || 1).toFixed(2), 480, 528, 11, '#9dffb4', 'center');
  };

  // ------------------------------------------------------------------ Inicio
  Sys.init = function (cv) {
    canvas = cv;
    stage = cv.parentNode;
    safeProbe = el('div', 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)', document.body);
    rotate = el('div', FONT + 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:20;background:#07050c;color:#ffe9a0;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;font-size:20px;line-height:1.4', document.body);
    var ic = el('div', 'font-size:64px;margin-bottom:12px;transform:rotate(90deg);animation:swRot 2s ease-in-out infinite', rotate, '\u{1F4F1}');
    el('div', '', rotate, 'Gira el teléfono');
    el('div', 'font-size:14px;color:#9a8fb0;margin-top:8px', rotate, 'Swarm Hand se juega en horizontal.');
    var sty = el('style', '', document.head); sty.textContent = '@keyframes swRot{0%,30%{transform:rotate(0)}70%,100%{transform:rotate(90deg)}}';
    toastBox = el('div', 'position:fixed;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));z-index:25;display:none;align-items:center;background:rgba(18,12,28,.95);border:3px solid #8a7aa6;max-width:96vw;box-sizing:border-box;touch-action:manipulation', document.body);
    // ajustes guardados / URL
    var st = settings();
    Sys.muted = !!st.muted; applyMute();
    var qu = q('q');
    Sys.setQuality(qu && (qu === 'auto' || LV[qu]) ? qu : (st.quality && (st.quality === 'auto' || LV[st.quality]) ? st.quality : 'auto'), true);
    // lienzo y página: sin zoom, scroll, selección ni menú contextual
    canvas.style.position = 'absolute'; canvas.style.touchAction = 'none';
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });
    document.addEventListener('touchmove', function (e) { if (e.target === canvas || e.target === document.body || e.target === stage) e.preventDefault(); }, { passive: false });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', function () { autoPause(); setTimeout(fit, 120); setTimeout(fit, 500); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', function () { setTimeout(fit, 60); });
    document.addEventListener('webkitfullscreenchange', function () { setTimeout(fit, 60); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) onHide(); else onShow(); });
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', function (e) { if (e.persisted) onShow(); });
    window.addEventListener('blur', function () { if (Sys.isMobile) { autoPause(); audioOff(); } });
    window.addEventListener('focus', function () { if (Sys.isMobile && !document.hidden) { if (G.resetClock) G.resetClock(); audioOn(); } });
    // desbloqueo de audio con el primer toque / tecla (iOS exige touchend / click, no touchstart)
    ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (n) { window.addEventListener(n, kick, { passive: true }); });
    fit();
    if (G.PWA) G.PWA.init();
  };
})();
