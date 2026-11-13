/* ending.js - v9 fase 3: CIERRE de la historia (DESIGN-v9-cinematicas.md sec. 6). Se dispara al vencer a Cenizar por 1.a vez (no Práctica; ?cine=0, bots y URLs de prueba lo saltan salvo ?cine=1).
   Secuencia:  1) VICTORIA in-world (~6 s, sobre el mundo congelado: barras, desaturado, la última brasa se apaga; la gestiona main.js con G.endT; saltable tras 1,5 s)
               2) EPÍLOGO en el Hogar (cinemática 'full' G.Cine, ~44 s: Marlo reenciende el fuego con su brasa mansa; llegan Lanudo, Carapa, Vesper, Castaña, Rufo, Grum y Ulalume; amanece).
                  La 1.a vez NO se puede saltar; después (galería) sí.
               3) CRÉDITOS (~25,6 s: Xitakha Studio y los agentes con nombres cómicos; saltables tras 3 s)
               4) pantalla de botín (G.state = 'gameover') y la aldea cambiada (aldea.js: nivel de aldea + cartel "Amanece en Rescoldo").
   Todo es dibujo y audio (G.Cine): nunca G.rng, nunca G.time. Contrato antiguo conservado: G.Ending.begin() / G.Ending.active().
   Arreglos respecto al final anterior: pausa en segundo plano (la lleva G.Cine), destello blanco de 300 ms eliminado (halo cálido; los destellos pasan por Reducir destellos),
   orden de jingles (death -> silencio -> cine3 'victory' -> epílogo; ya no suenan stg_cenizar_win y stg_cenizar_ending a la vez) y aldea.js lee endingSeen. */
(function () {
  'use strict';
  var G = window.G, En = G.Ending = {}, C = G.Cine, W = 960, H = 540, TAU = Math.PI * 2;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = cl(u, 0, 1); return u * u * (3 - 2 * u); }
  function cs() { return G.Save && G.Save.data && G.Save.data.cine; }
  function art3(name) { try { var A = window.Assets && Assets.cine3; return A && typeof A[name] === 'function' ? A[name] : null; } catch (e) { return null; } }   // Assets.cine3.* = arte (assets_cine3.js); el audio vive en G.Snd.cine3

  // ---------------------------------------------------------------- Disparo
  En.eligible = function () { return !C.off && C.auto && G.bossId === 'cenizar' && G.mode !== 'practice' && !!(G.cenizarFinal && G.cenizarFinal.first); };
  En.waitMs = function () { return G.bossDead && En.eligible() ? 6000 : 3000; };   // espera tras la muerte (main.js): la victoria in-world dura 6 s
  var vic = null;
  En.victoryOn = function () { return !!G.bossDead && En.eligible() && G.endT < 6000; };

  // ---- 1) Victoria in-world: se llama desde updateWorld (reloj de la simulación: respeta la pausa) y desde draw()
  En.victoryUpdate = function () {
    if (!vic) vic = { zoom0: G.cam.zoom || 1 };
    var t = G.endT;
    G.cam.zoom = 1 + 0.18 * ease(t / 3500);   // la cámara se acerca al pecho (solo vista)
    if (t > 1500 && G.input.hit('Space', 'Enter', 'KeyE', 'Mouse0')) G.endT = 6001;   // saltable tras 1,5 s
  };
  En.drawVictory = function (c) {
    var t = G.endT, u = ease((t - 300) / 1500), bar = Math.round(48 * ease(t / 500)), D = G.Boss && G.Boss.dying, i;
    if (u > 0) {   // desaturado (todo salvo la brasa) + viñeta
      c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = 0.92 * u; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H); c.restore();
      c.save(); var g = c.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 620); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,2,8,' + (0.6 * u) + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    }
    if (D && t < 5200) {   // la última brasa: late cada vez más despacio y se apaga
      var a = 1 - cl((t - 4200) / 900, 0, 1), per = 380 + t / 6, beat = 0.55 + 0.45 * Math.max(0, Math.sin(t / per * Math.PI)), x = W / 2 + (D.x - G.cam.x - W / 2) * (G.cam.zoom || 1), y = H / 2 + (D.y - 36 - G.cam.y - H / 2) * (G.cam.zoom || 1);
      c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(x, y, 2, x, y, 90 * (0.7 + 0.3 * beat)); gr.addColorStop(0, 'rgba(255,190,90,' + (0.7 * a * beat * u) + ')'); gr.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gr; c.fillRect(x - 100, y - 100, 200, 200); c.restore();
    }
    c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    if (t > 1200 && t < 4400) { var ta = Math.min(1, (t - 1200) / 600, (4400 - t) / 500); c.save(); c.globalAlpha = Math.max(0, ta); G.txt(c, 'La última brasa parpadea...', W / 2, H - bar - 34, 20, '#ffd9a0', 'center'); c.restore(); }
    if (t > 5300) { c.fillStyle = 'rgba(0,0,0,' + cl((t - 5300) / 700, 0, 1) + ')'; c.fillRect(0, 0, W, H); }
    if (t > 1500 && t < 5300) G.txt(c, 'Toca: saltar', W - 16, H - bar - 10, 10, 'rgba(200,190,220,0.6)', 'right');
  };

  // ---------------------------------------------------------------- 2) Epílogo
  var VOICE = { LANUDO: '#e8dcb0', VESPER: '#ffb08a', 'CASTAÑA': '#ffd0dc', GRUM: '#c8d0d8', CARAPA: '#7fd0d8', RUFO: '#c8c0a0', ULALUME: '#c8a8ff' };
  var LINES = [
    ['LANUDO', 'El fuego vuelve. Y las cenizas, al fin, descansan.'],
    ['VESPER', 'Sabía que eras tú. La apuesta la perdí encantado.'],
    ['CASTAÑA', 'Ven, cielo, hay caldo caliente. Y no huele a humo.'],
    ['GRUM', 'Reconstruir lleva tiempo, chaval. Pero ya hay un hogar.'],
    ['CARAPA', 'Te he tejido una bufanda nueva. Por si la otra se queda a vivir en la chimenea.'],
    ['RUFO', 'El mejor trato de mi vida: cero monedas y un invierno menos.'],
    ['ULALUME', 'Las cartas lo dicen, Marlo: la mano ganadora eres tú.']
  ];
  var T_MUSIC = 6200, T_FIRE = T_MUSIC + 16000, T_GIVE = T_FIRE - 1600, T_DLG = 26400;   // pista cine_epilogo (35 s): el fuego prende a los 16 s de pista
  var PMAP = [[0, 0], [T_FIRE, 0.14], [T_FIRE + 8800, 0.45], [T_FIRE + 14800, 0.7], [T_FIRE + 19800, 0.9], [T_FIRE + 21800, 1]];
  var WHO = [   // amigos: nombre de NPC (Assets.drawNPC), x final, lado, llegada (ms)
    ['lanudo', 80, false], ['carapa', 178, false], ['vesper', 276, false], ['castana', 660, true], ['rufo', 750, true], ['grum', 836, true], ['ulalume', 918, true]
  ];
  function pOf(t) { for (var i = 1; i < PMAP.length; i++) if (t <= PMAP[i][0]) return lerp(PMAP[i - 1][1], PMAP[i][1], (t - PMAP[i - 1][0]) / (PMAP[i][0] - PMAP[i - 1][0])); return 1; }
  function dlgTracks() {
    var out = [], at = T_DLG, i;
    for (i = 0; i < LINES.length; i++) { var d = Math.round(LINES[i][1].length * 31 + 800); out.push({ at: at, type: 'dlg', who: LINES[i][0], color: VOICE[LINES[i][0]], text: LINES[i][1], dur: d }); at += d + 150; }
    out.end = at; return out;
  }
  var DT = dlgTracks();
  // Arte de assets_cine3.js (Assets.cine3.epilogue): se usan 5 de sus 6 viñetas (la 1.a, 'victoria', es la victoria in-world de este motor) con duraciones estiradas para casar con la pista cine_epilogo (el fuego prende a los 16 s de pista)
  var AM = DT.end - 4200, SEG = [['apagado', 800, 9000], ['brasa', 9000, 21000], ['renace', 21000, 26000], ['reunidos', 26000, AM], ['amanecer', AM, AM + 6000]];
  var EP_LEN = Math.max(T_FIRE + 21800, AM + 6200);
  function epArt(c, t) {
    var A3 = art3('epilogue'); if (!A3) return false;
    for (var i = 0; i < SEG.length; i++) {
      var sg = SEG[i]; if (t >= sg[1] && (t < sg[2] || i === SEG.length - 1)) {
        var p = cl((t - sg[1]) / (sg[2] - sg[1]), 0, 1), nx = SEG[i + 1];
        if (nx && !SEG[i].pre && sg[2] - t < 1800) { SEG[i].pre = 1; try { Assets.cine3.preload(nx[0], W, H, { calm: C.cfg().calm }); } catch (e0) { /* arte */ } }
        try { return A3(sg[0], c, W, H, p * (Assets.cine3.dur ? Assets.cine3.dur(sg[0]) : 6000), { p: p, calm: C.cfg().calm, bars: 0, vignette: false }) !== false; } catch (e) { return false; }
      }
    }
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return true;
  }

  function npcDraw(c, name, x, y, t, sc, flip, al) {
    try { if (window.Assets && Assets.drawNPC) { Assets.drawNPC(c, name, x, y, t, { scale: sc, flip: flip, alpha: al }); return; } } catch (e) { /* arte */ }
    c.save(); c.globalAlpha = al; c.fillStyle = '#6a5a80'; c.beginPath(); c.ellipse(x, y - 30 * sc, 16 * sc, 28 * sc, 0, 0, TAU); c.fill(); c.restore();
  }
  function marloDraw(c, pose, x, y, t, flip) {
    try {
      var A = window.Assets && Assets.cine, fn = A && typeof A.drawMarloPose === 'function' ? A.drawMarloPose : null;
      if (fn) { fn(c, pose, x, y, t, { flip: flip, scale: 2.6, calm: C.cfg().calm }); return; }
      var im = Assets.sprite('player', Math.floor(t / 166) % 24 >= 4 ? 1 : 0), s = 48 * 2.6; c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(im, -s / 2, -s, s, s); c.restore();
    } catch (e) { c.fillStyle = '#d8c8b0'; c.beginPath(); c.arc(x, y - 40, 24, 0, TAU); c.fill(); }
  }
  function glow(c, x, y, r, rgb, a) { var g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }

  var HX = 420, FL = 421, FEET = 480, MX = 560;   // posiciones en la escena del arte (hogar a x 420, suelo a y 421)
  function epScene(c, p, t) {
    var done = epArt(c, t);
    if (done) { epText(c, t); return; }
    if (!done) { try { Assets.drawEndingScene(c, W, H, pOf(t), { t: t, noFriends: true }); done = true; } catch (e2) { c.fillStyle = '#07040a'; c.fillRect(0, 0, W, H); } }
    // brasa mansa: sale de la bufanda de Marlo y cae en la chimenea (halo cálido, SIN destello blanco)
    var calm = C.cfg().calm, walkU = ease((t - 2500) / 11000), mx = lerp(-60, MX, walkU), walking = t > 2500 && t < 13500;
    if (t > 1200) {
      var pose = walking ? 'walk' : (t < T_FIRE + 600 ? 'scarf' : 'idle');
      marloDraw(c, pose, mx, FEET, t, !walking);   // camina hacia la derecha; frente al fuego mira a la izquierda
    }
    var gu = (t - T_GIVE) / 1600;
    if (gu > 0 && gu < 1) {   // la brasa vuela de la bufanda (mx - 14, 410) a la chimenea
      var ex = lerp(mx - 14, HX, ease(gu)), ey = 410 - Math.sin(gu * Math.PI) * 60 + 30 * gu;
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, ex, ey, 40, '255,170,60', 0.8); c.restore(); c.fillStyle = '#fff2b0'; c.fillRect(Math.round(ex - 3), Math.round(ey - 3), 6, 6);
    }
    var hu = cl((t - T_GIVE) / 3000, 0, 1) * (1 - cl((t - T_FIRE - 6000) / 4000, 0, 1));   // halo cálido sobre la chimenea (no blanco, no a pantalla completa)
    if (hu > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, HX, 380, 260, '255,150,50', (calm ? 0.2 : 0.35) * hu); c.restore(); }
    // los amigos llegan alrededor del fuego (Assets.drawNPC, sprites reales)
    var i;
    for (i = 0; i < WHO.length; i++) {
      var w = WHO[i], at = T_FIRE + 1200 + i * 700, u = ease((t - at) / 1400); if (u <= 0) continue;
      var dir = w[2] ? 1 : -1, x = w[1] + dir * 70 * (1 - u);
      npcDraw(c, w[0], Math.round(x), FEET + (i % 2) * 6, t, 1.6, w[2], u);
    }
    epText(c, t);
  }
  function epText(c, t) {
    var dw = SEG[4][1] + 600;
    if (t > dw) { c.save(); c.globalAlpha = Math.min(1, (t - dw) / 1200) * (1 - cl((t - (EP_LEN - 1500)) / 1200, 0, 1)); G.txt(c, 'Amanece en Rescoldo.', W / 2, 150, 28, '#fff0c8', 'center'); c.restore(); }
    if (t < 1800) {   // negro inicial: "Cenizar se apaga..." (el silencio de 1 s antes del stinger)
      c.fillStyle = 'rgba(0,0,0,' + (t < 1000 ? 1 : 1 - (t - 1000) / 800) + ')'; c.fillRect(0, 0, W, H);
      c.save(); c.globalAlpha = Math.min(1, t / 500) * (t < 1000 ? 1 : 1 - (t - 1000) / 800); G.txt(c, 'Cenizar se apaga...', W / 2, H / 2, 24, '#ffc88c', 'center'); c.restore();
    }
  }
  var EPILOGUE = {
    id: 'epilogue', dlgTop: true, len: EP_LEN, letterbox: { in: [0, 800], out: [EP_LEN - 900, EP_LEN], bar: 36 },
    scenes: [{ at: 0, dur: EP_LEN, draw: epScene }],
    tracks: [
      { at: 1000, type: 'fn', fn: function () { C.snd3('victory'); } },   // ~6 s de stinger sobre el negro; después la pista del epílogo
      { at: T_MUSIC, type: 'music', track: 'cine_epilogo', intensity: 0.2 },
      { at: T_GIVE, type: 'fn', fn: function () { C.snd3('fire'); } },   // el fuego prende 1,6 s después = T_FIRE (16 s de pista)
      { at: T_FIRE + 6000, type: 'shake', amp: 2, ms: 400 }
    ].concat(DT)
  };
  C.EPILOGUE = EPILOGUE;

  // ---------------------------------------------------------------- 3) Créditos (tarjetas, ~25,6 s; la pista cine_creditos cierra en Mi mayor a 22,4 s)
  var CREDITS = [   // [inicio ms, duración ms, título|null, [[rol, nombre], ...]]
    [0, 3400, 'XITAKHA STUDIO', [['presenta', 'SWARM HAND']]],
    [3600, 3000, null, [['Dirección', 'Capitán Cafelito'], ['Diseño de juego', 'Idea Burbuja']]],
    [6700, 3000, null, [['Programación', 'Teclón Compilas'], ['Herramientas', 'Llavín Inglés']]],
    [9800, 3000, null, [['Música y sonido', 'Bip Armónico'], ['Pruebas', 'Pulsa-Todo Gómez']]],
    [12900, 3000, null, [['Estudio de mercado', 'Lupa Tendencias'], ['Búsqueda de recursos', 'Husmeo Hallazgos']]],
    [16200, 4200, 'Y a ti, Marlo,', [['', 'que apagaste las seis llamas.']]],
    [20800, 4800, 'GRACIAS POR JUGAR', []]
  ];
  En.CREDITS = CREDITS;
  var credArt = false;
  function credOver(c, t) {
    if (credArt) return;   // con el arte (créditos con scroll de assets_cine3.js) no hacen falta las tarjetas de reserva
    c.fillStyle = 'rgba(6,3,12,' + (0.5 * Math.min(1, t / 1500)) + ')'; c.fillRect(0, 0, W, H);
    for (var i = 0; i < CREDITS.length; i++) {
      var k = CREDITS[i], u = (t - k[0]) / k[1]; if (u < 0 || u > 1) continue;
      var a = Math.min(1, u * 6, (1 - u) * 5); if (i === CREDITS.length - 1) a = Math.min(1, u * 5);
      c.save(); c.globalAlpha = Math.max(0, a);
      var y = H / 2 - (k[2] ? 30 : 56) + (k[3].length ? 0 : 20);
      if (k[2]) { G.txt(c, k[2], W / 2, y, i === 0 ? 52 : i === CREDITS.length - 1 ? 44 : 30, i === 5 ? '#f0e8d8' : '#ffd27a', 'center', '#2a0a04'); y += i === 0 ? 50 : 40; }
      for (var j = 0; j < k[3].length; j++) {
        var r = k[3][j];
        if (r[0]) { G.txt(c, r[0], W / 2, y, 16, '#c8b8e8', 'center'); y += 28; }
        G.txt(c, r[1], W / 2, y, r[0] ? 30 : 28, r[0] === 'presenta' ? '#fff2b0' : '#fff2dc', 'center', '#1b1124'); y += 58;
      }
      c.restore();
    }
  }
  function credScene(c, p, t) {
    var A3 = art3('credits'), done = false; credArt = false;
    if (A3) { try { done = A3(c, W, H, t, { p: cl(t / 25600, 0, 1), dur: 25600, calm: C.cfg().calm, fadeOut: true }) !== false; credArt = done; } catch (e) { done = false; } }
    if (!done) { try { Assets.drawEndingScene(c, W, H, 0.88, { t: t + 40000 }); } catch (e2) { c.fillStyle = '#10080c'; c.fillRect(0, 0, W, H); } }
  }
  var CRED = { id: 'credits', len: 25600, over: credOver, scenes: [{ at: 0, dur: 25600, draw: credScene }],
    tracks: [{ at: 0, type: 'music', track: 'cine_creditos', intensity: 0.3 }, { at: 24800, type: 'fade', from: 0, to: 1, dur: 800 }] };
  C.CREDITS_SCRIPT = CRED;

  // ---------------------------------------------------------------- Reproducción y marcas del guardado
  function markEpilogue() { var S = G.Save.data; S.endingSeen = true; if (S.cine) S.cine.epilogueSeen = true; G.Save.save(); }
  function markCredits() { var S = G.Save.data; if (S.cine) S.cine.creditsSeen = true; G.Save.save(); }
  /* opts: { replay (galería: saltable, no escribe en el guardado), returnState, onEnd() } */
  En.playEpilogue = function (opts, then) {
    opts = opts || {}; var first = !opts.replay; EPILOGUE.dlgTop = !art3('epilogue');   // con el arte el diálogo va en la franja inferior; sin él, arriba (la reserva ocupa el suelo)
    var ok = C.play(EPILOGUE, { mode: 'full', first: first, skippable: !first, calm: C.cfg().calm, returnState: opts.returnState || 'gameover', stopMusic: false,
      onSkip: function () { C.snd3('stop'); try { Assets.music.stop(); } catch (e) { /* audio */ } },
      onEnd: function (r) { try { Assets.cine3.free(); } catch (e) { /* arte */ } if (!opts.replay && (r === 'end' || r === 'skip')) markEpilogue(); if (then) then(r); } });
    return ok;
  };
  En.playCredits = function (opts, then) {
    opts = opts || {};
    return C.play(CRED, { mode: 'full', skippable: false, skipAfter: 3000, calm: C.cfg().calm, returnState: opts.returnState || 'gameover',
      onSkip: function () { C.snd3('stop'); },
      onEnd: function (r) { try { Assets.music.stop(); } catch (e) { /* audio */ } try { Assets.cine3.free(); } catch (e2) { /* arte */ } if (!opts.replay && (r === 'end' || r === 'skip')) markCredits(); if (then) then(r); } });
  };
  En.playAll = function (opts) {   // epílogo + créditos; opts.onEnd al final
    opts = opts || {};
    var fin = function () { if (opts.onEnd) opts.onEnd(); };
    var cred = function () { if (!En.playCredits(opts, fin)) fin(); };
    if (!En.playEpilogue(opts, cred)) cred();
    return true;
  };
  En.dawn = false;   // aldea.js: tras el final, el primer regreso muestra "Amanece en Rescoldo"
  En.begin = function () {
    G.cam.zoom = 1; vic = null; En.dawn = true;
    var go = function () { G.state = 'gameover'; };
    En.playAll({ returnState: 'gameover', onEnd: go });
    if (!C.active()) go();
  };
  En.active = function () { var i = C.info(); return !!(i && (i.id === 'epilogue' || i.id === 'credits')); };
  En.update = function () { if (!En.active() && G.state === 'ending') G.state = 'gameover'; };   // estado antiguo 'ending': ya no se usa
  En.draw = function () { };
})();
