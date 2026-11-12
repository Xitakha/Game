/* cine_entry.js - v9 fase 2: ENTRADAS DE JEFE. Capa de cinemática SOBRE la intro in-world de boss.js (H.intro, cadT = 1200 y telegrafías intactos), el prerrollo de Cenizar
   (cinemática 'full' justo antes de S.spawn) y la galería de AJUSTES > CINEMÁTICAS > Ver entradas de jefe.
   Reglas (DESIGN-v9 5.6): solo dibujo y audio; nada de G.rng; la simulación recibe los mismos pasos que sin cine (ver G.Boss.introGate en boss.js:
   el presagio de la entrada larga NO avanza el mundo y la corta lo acelera con varios pasos de STEP), así el estado tras la entrada es idéntico con ?cine=0, corta y larga.
   Versiones: 'off' (intro de siempre, 3,5 s) | 'short' (~1,6 s, saltable desde 800 ms) | 'long' (~4,5 s, 1.ª vez, NO saltable, con subtítulo de lore).
   Arte: Assets.cine2.* (assets_cine2.js; si falta, se usa el cartel de siempre). Audio: G.Snd.cine2 (sfx_cine2.js; si falta, silencio). */
(function () {
  'use strict';
  var G = window.G, C = G.Cine, W = 960, H = 540;
  C.PRE = 1000; C.SHORT = 1600; C.LONG = 4500;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function A2() { try { return window.Assets && Assets.cine2 && typeof Assets.cine2.card === 'function' ? Assets.cine2 : null; } catch (e) { return null; } }

  // ---------------------------------------------------------------- Lore (Lanudo, tono oscuro, una línea por jefe)
  C.LORE = {
    pastor: 'Cuidaba de todos. La brasa lo eligió el primero.',
    karceron: 'Despertó entre sus grilletes. Aún los arrastra.',
    letea: 'El río del olvido tiene tres voces. Ninguna perdona.',
    yarlak: 'Guardaba la última hoguera del norte. La dejó helarse.',
    melaria: 'Devoró la jalea de sus hermanas. Aún tiene hambre.',
    cenizar: 'Lo que no se apaga, lo devora todo.'
  };
  C.PREROLL_LORE = [   // prerrollo de Cenizar (6 s): coherente con DESIGN-v7 (el Incendio Primero) y la brasa mansa de Marlo
    { at: 300, dur: 1800, text: 'El Hogar ardió hasta los huesos.' },
    { at: 2000, dur: 2000, text: 'Cinco llamas se apagaron. Tu brasa mansa late sola.' },
    { at: 4300, dur: 1500, text: 'La primera de todas sigue esperando.' }
  ];
  var PITCH = { pastor: 1, karceron: 0.85, letea: 1, yarlak: 0.9, melaria: 1.1, cenizar: 0.8 };

  // ---------------------------------------------------------------- Audio (cine2 si existe; si no, silencio)
  C.snd2 = function (kind, id, opts, pitch) { try { if (G.Snd && typeof G.Snd.cine2 === 'function') return G.Snd.cine2(kind, id, opts, pitch); } catch (e) { /* audio opcional */ } return false; };

  // ---------------------------------------------------------------- ¿Qué versión toca?
  function seenEntry(id) { var s = G.Save.data, cs = s.cine; return !!((cs && cs.entrySeen && cs.entrySeen[id]) || (s.bossSeen && s.bossSeen[id])); }
  C.entrySeen = seenEntry;
  C.entryMode = function (id) {
    if (C.off || !C.auto) return 'off';   // ?cine=0, URLs de prueba (?direct/?boss/?hunt/?assault/?practice) y bots: la intro de siempre
    if (G.nointro) return 'off';
    if (C.shortForced || G.mode === 'practice') return 'short';
    return seenEntry(id) ? 'short' : 'long';
  };
  C.prerollWanted = function (id) { return id === 'cenizar' && !!A2() && C.entryMode('cenizar') === 'long' && G.mode !== 'practice'; };

  // ---------------------------------------------------------------- Capa sobre la intro in-world
  var PLATE = { long: [1000, 2800], short: [200, 1300] };
  C.entryStart = function (e, I) {
    var short = I.mode === 'short';
    I.cv = { plate: false, shown: 0, bips: 0, lore: short ? '' : (C.LORE[e.id] || ''), speed: C.cfg().textSpeed };
    C.snd2('appear', e.id, short ? { short: true } : undefined);
  };
  C.entryTick = function (I) {   // desde G.Boss.introGate, una vez por tick (reloj de la simulación: respeta la pausa)
    var cv = I.cv; if (!cv) return;
    var pl = PLATE[I.mode === 'short' ? 'short' : 'long'];
    if (!cv.plate && I.real >= pl[0]) { cv.plate = true; C.snd2('plate', G.Boss.e && G.Boss.e.id); }
    if (cv.lore && I.real >= 500) {
      var cps = 32 * (cv.speed || 1), n = cv.speed === 0 ? cv.lore.length : Math.min(cv.lore.length, Math.floor((I.real - 500) * cps / 1000));
      for (var k = cv.shown; k < n; k++) if (k === 0 || cv.lore.charAt(k - 1) === ' ') { cv.bips++; if (cv.speed !== 0) C.blip('LANUDO'); }
      cv.shown = Math.max(cv.shown, n);
    }
  };
  C.entrySkip = function () { C.snd2('stop'); };
  C.entryEnd = function () { /* nada que limpiar: todo vive en I */ };
  C.entryDraw = function (c, e, I) {
    var a2 = A2(); if (!a2) return false;
    var short = I.mode === 'short', len = short ? C.SHORT : C.LONG, real = I.real, p = cl(real / len, 0, 1), calm = C.cfg().calm, id = e.id, D = e.def, cv = I.cv || {};
    // presagio sobre el mundo real (se desvanece antes del final para que la pelea empiece limpia)
    var fade = 1 - cl((p - 0.55) / 0.4, 0, 1);
    if (fade > 0.01) {
      var cx = cl(e.x - G.cam.x, 80, W - 80), gy = cl(e.y + (D.gy || 88) - G.cam.y, H * 0.5, H * 0.9) / H;
      c.save(); c.globalAlpha = fade; a2.omen(id, c, W, H, p, { short: short, calm: calm, cx: cx, gy: gy }); c.restore();
    }
    // barras de cine
    var bar = 48, inB = cl(real / 300, 0, 1), outB = I.t > 2400 ? cl((I.t - 2400) / 400, 0, 1) : 0, b = Math.round(bar * G.Boss.u.ease(inB) * (1 - G.Boss.u.ease(outB)));
    c.fillStyle = '#000'; c.fillRect(0, 0, W, b); c.fillRect(0, H - b, W, b);
    // cartel
    var pl = PLATE[short ? 'short' : 'long'], cp = (real - pl[0]) / pl[1];
    if (cp >= 0 && cp <= 1) a2.card(id, c, W, H, cp, { short: short, calm: calm, lore: false, y: 0.27 });
    // subtítulo de lore (solo la entrada larga)
    if (cv.lore && cv.shown > 0 && real < len - 200) {
      var txt = cv.lore.slice(0, cv.shown), lines = C.wrap(c, cv.lore, 740, 18), n = lines.length, bh = 44 + n * 26, y = H - b - 16 - bh, i, shown = 0, al = real > len - 700 ? cl((len - 200 - real) / 500, 0, 1) : 1;
      c.save(); c.globalAlpha = al; c.fillStyle = 'rgba(8,4,14,0.86)'; c.fillRect(60, y, 840, bh); c.strokeStyle = '#e8dcb0'; c.lineWidth = 2; c.strokeRect(61, y + 1, 838, bh - 2);
      G.txt(c, 'LANUDO', 84, y + 20, 14, '#e8dcb0', 'left');
      for (i = 0; i < n; i++) { var part = lines[i].slice(0, Math.max(0, txt.length - shown)); shown += lines[i].length + 1; if (part) G.txt(c, part, 84, y + 44 + i * 26, 18, '#f4ecdc', 'left'); }
      c.restore();
    }
    if (short && real >= 800 && I.t < 3400) G.txt(c, 'Espacio / toque: saltar', W - 20, H - b - 12, 11, '#9a8fb0', 'right');
    return true;
  };

  // ---------------------------------------------------------------- Prerrollo de Cenizar (cinemática 'full', ~6 s, antes de S.spawn; no avanza G.time ni la simulación)
  function lineTracks() { return C.PREROLL_LORE.map(function (l) { return { at: l.at, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: l.text, dur: l.dur }; }); }
  var PRE = {
    id: 'cenizar-preroll', len: 6000, letterbox: { in: [0, 500], out: [5500, 6000], bar: 40 },
    scenes: [{ at: 0, dur: 6000, draw: function (c, p, t) { var a = A2(); if (!a || !a.prelude(c, W, H, p, { calm: C.cfg().calm })) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); if (p > 0.7) G.txt(c, 'CENIZAR', W / 2, H / 2, 54, '#fff2b0', 'center'); } } }],
    tracks: [{ at: 0, type: 'fn', fn: function () { C.snd2('preroll', 'cenizar'); try { Assets.music.setIntensity(0.05); } catch (e) { /* audio */ } } }].concat(lineTracks())
  };
  C.PREROLL = PRE;
  C.playPreroll = function (opts) {   // opts: { replay, onEnd }: la 1.ª vez NO es saltable
    opts = opts || {};
    return C.play(PRE, { mode: 'full', first: !opts.replay, skippable: !!opts.replay, calm: C.cfg().calm, returnState: opts.returnState || 'play', stopMusic: false,
      onSkip: function () { C.snd2('stop'); }, onEnd: function (r) { if (opts.onEnd) opts.onEnd(r); } });
  };

  // ---------------------------------------------------------------- Galería (AJUSTES > CINEMÁTICAS > Ver entradas de jefe): la toma de aparición a pantalla completa; saltable; no escribe en el guardado
  function galleryScript(id) {
    var lore = C.LORE[id] || '';
    return {
      id: 'entry-' + id, len: 4700, letterbox: { in: [0, 400], out: [4300, 4700], bar: 40 },
      scenes: [{ at: 0, dur: 4700, draw: function (c, p, t) {
        var a = A2(), pp = cl(t / 4500, 0, 1), calm = C.cfg().calm;
        if (!a || !a.entry(id, c, W, H, pp, { calm: calm })) { c.fillStyle = '#0a0610'; c.fillRect(0, 0, W, H); }
      } }],
      over: function (c, t) { var a = A2(); if (!a) return; var cp = (t - 1000) / 2800; if (cp >= 0 && cp <= 1) a.card(id, c, W, H, cp, { calm: C.cfg().calm, lore: false, y: 0.27 }); },
      tracks: [{ at: 0, type: 'fn', fn: function () { C.snd2('appear', id); } }, { at: 1000, type: 'fn', fn: function () { C.snd2('plate', id); } },
        { at: 500, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: lore, dur: 3800 }]
    };
  }
  C.entryIds = ['pastor', 'karceron', 'letea', 'yarlak', 'melaria', 'cenizar'];
  C.playEntry = function (id, opts) {   // galería
    opts = opts || {};
    var go = function () {
      C.play(galleryScript(id), { mode: 'full', skippable: true, replay: true, calm: C.cfg().calm, returnState: 'aldea', stopMusic: false,
        onSkip: function () { C.snd2('stop'); }, onEnd: function (r) { if (opts.onEnd) opts.onEnd(r); } });
    };
    if (id === 'cenizar' && A2()) C.playPreroll({ replay: true, returnState: 'aldea', onEnd: function (r) { if (r === 'skip') { if (opts.onEnd) opts.onEnd(r); } else go(); } });
    else go();
    return true;
  };
})();
