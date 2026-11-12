/* cine_intro.js - v9 fase 1: pantalla de título "TOCA PARA JUGAR", guion de la INTRO (~26 s, 6 viñetas) y flujo de arranque.
   Marco: Lanudo, el abuelo carnero, cuenta la historia junto a la fogata de Rescoldo. Tono de cuento junto al fuego, pero OSCURO. Solo texto con bips (sin voz).
   Flujo: abrir el juego -> TÍTULO (el toque desbloquea el audio) -> INTRO si no está vista (la 1.ª vez NO se puede saltar) -> aldea (o, con ?direct= etc. + ?cine=1, la partida).
   ?cine=0 apaga todo; las URLs de prueba y los bots (navigator.webdriver) no ven el título (ver cine.js). El arte de reserva es procedural y simple: cuando exista
   Assets.cine.* (src/assets_cine.js, agente de arte) se usa en su lugar (ver CINE_ART más abajo). */
(function () {
  'use strict';
  var G = window.G, C = G.Cine, TAU = Math.PI * 2;
  var W = 960, H = 540;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------------------------------------------------------------- Arte: reserva procedural (si Assets.cine.* existe, se prefiere)
  var R = C.rng('intro-art'), STARS = [], i;
  for (i = 0; i < 110; i++) STARS.push({ x: R() * W, y: R() * 300, s: R() < 0.2 ? 3 : 2, ph: R() * TAU });
  var EMB = []; for (i = 0; i < 40; i++) EMB.push({ x: R() * W, y: R(), sp: 0.4 + R() * 0.8, ph: R() * TAU });
  function art(name) { try { var A = window.Assets && Assets.cine; return A && typeof A[name] === 'function' ? A[name] : null; } catch (e) { return null; } }

  function sky(c, top, bot, h) { var g = c.createLinearGradient(0, 0, 0, h || H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-200, -100, W + 400, (h || H) + 200); }
  function stars(c, t, a) { c.save(); c.fillStyle = '#e8e4ff'; for (var k = 0; k < STARS.length; k++) { var s = STARS[k]; c.globalAlpha = (a == null ? 1 : a) * (0.35 + 0.35 * Math.sin(t / 700 + s.ph)); c.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s); } c.restore(); }
  function ground(c, y, col) { c.fillStyle = col; c.fillRect(-200, y, W + 400, H - y + 200); }
  function hills(c, y, col, amp, f, ph) { c.fillStyle = col; c.beginPath(); c.moveTo(-200, H + 100); for (var x = -200; x <= W + 200; x += 20) c.lineTo(x, y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph) * amp * 0.4); c.lineTo(W + 200, H + 100); c.closePath(); c.fill(); }
  function glow(c, x, y, r, col, a) { var g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  function flame(c, x, y, s, t, hot) {   // llama simple de 3 lenguas
    glow(c, x, y - 20 * s, 150 * s, 'rgba(255,140,50,A)', 0.42 + 0.08 * Math.sin(t / 90));
    var k, fh = (46 + Math.sin(t / 80) * 6 + Math.sin(t / 47) * 4) * s;
    c.fillStyle = hot || '#ff6a1a'; c.beginPath(); c.moveTo(x - 24 * s, y); c.quadraticCurveTo(x - 14 * s, y - fh * 0.7, x - 4 * s, y - fh); c.quadraticCurveTo(x + 6 * s, y - fh * 0.6, x + 24 * s, y); c.closePath(); c.fill();
    c.fillStyle = '#ffc24a'; c.beginPath(); c.moveTo(x - 13 * s, y); c.quadraticCurveTo(x - 4 * s, y - fh * 0.8, x + 2 * s, y - fh * 0.75); c.quadraticCurveTo(x + 10 * s, y - fh * 0.3, x + 13 * s, y); c.closePath(); c.fill();
    c.fillStyle = '#fff2b0'; c.beginPath(); c.moveTo(x - 6 * s, y); c.quadraticCurveTo(x, y - fh * 0.5, x + 6 * s, y); c.closePath(); c.fill();
    for (k = 0; k < 5; k++) { var u = ((t / 1400) + k * 0.2) % 1; c.fillStyle = 'rgba(255,200,90,' + (1 - u) + ')'; c.fillRect(Math.round(x + Math.sin(k * 2.1 + t / 500) * 18 * s), Math.round(y - 20 * s - u * 90 * s), 3, 3); }
  }
  function logs(c, x, y, s) { c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 3; c.fillStyle = '#4a3020'; [-0.35, 0.35].forEach(function (a) { c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-34 * s, -5 * s, 68 * s, 10 * s); c.strokeRect(-34 * s, -5 * s, 68 * s, 10 * s); c.restore(); }); c.restore(); }
  function npc(c, name, x, y, t, sc, flip, tint) {
    try { if (window.Assets && Assets.drawNPC) { Assets.drawNPC(c, name, x, y, t, { scale: sc, flip: flip, alpha: 1 }); return; } } catch (e) { /* arte */ }
    c.fillStyle = tint || '#6a5a80'; c.beginPath(); c.ellipse(x, y - 30 * sc, 16 * sc, 28 * sc, 0, 0, TAU); c.fill();
  }
  function marlo(c, x, y, t, sc, flip) {   // pies en (x, y)
    try {
      var fn = art('drawMarloPose'); if (fn) { fn(c, 'idle', x, y, t, { flip: flip, scale: sc }); return; }
      var im = Assets.sprite('player', Math.floor(t / 166) % 24 >= 4 ? 1 : 0), s = 48 * sc;
      c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(im, -s / 2, -s, s, s); c.restore();
    } catch (e) { c.fillStyle = '#d8c8b0'; c.beginPath(); c.arc(x, y - 20 * sc, 18 * sc, 0, TAU); c.fill(); }
  }
  function scarf(c, x, y, t, sc) { glow(c, x, y, 70 * sc, 'rgba(255,120,40,A)', 0.45 + 0.2 * Math.sin(t / 260)); c.fillStyle = '#ff7a2a'; c.fillRect(Math.round(x - 12 * sc), Math.round(y - 3 * sc), Math.round(24 * sc), Math.round(6 * sc)); }
  function dark(c, a) { c.fillStyle = 'rgba(6,3,12,' + a + ')'; c.fillRect(-200, -100, W + 400, H + 200); }

  // ---------------------------------------------------------------- Escenas (reserva)
  function sc1(c, p, t) {   // fogata de Rescoldo, de noche
    var f = art('bg'); if (f) { try { f(c, 'fogata', { w: W, h: H, t: t, p: p }); return; } catch (e) { /* reserva */ } }
    sky(c, '#05030f', '#1a1030', 380); stars(c, t); hills(c, 330, '#110a1c', 18, 0.006, 1); hills(c, 380, '#0c0714', 12, 0.01, 3);
    ground(c, 410, '#0a0610'); logs(c, 480, 430, 1); flame(c, 480, 424, 1.2, t);
    npc(c, 'lanudo', 360, 452, t, 2.6, false); marlo(c, 600, 456, t, 3, true);
    dark(c, 0.15);
  }
  function sc2(c, p, t) {   // el Hogar de antes (flashback ámbar)
    var f = art('bg'); if (f) { try { f(c, 'hogar', { w: W, h: H, t: t, p: p }); return; } catch (e) { /* reserva */ } }
    sky(c, '#2a1608', '#6a3a14', 400); ground(c, 410, '#2a180c');
    c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 4; c.fillStyle = '#4a2c18'; c.fillRect(250, 220, 460, 190); c.strokeRect(250, 220, 460, 190);
    c.fillStyle = '#2e1a10'; c.beginPath(); c.moveTo(230, 222); c.lineTo(480, 120); c.lineTo(730, 222); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffb347'; c.fillRect(300, 270, 70, 70); c.fillRect(590, 270, 70, 70); c.strokeRect(300, 270, 70, 70); c.strokeRect(590, 270, 70, 70);
    c.fillStyle = '#3a2418'; c.fillRect(640, 150, 36, 80); c.restore();
    for (var k = 0; k < 4; k++) { var u = ((t / 2400) + k * 0.25) % 1; c.fillStyle = 'rgba(255,190,100,' + (0.6 * (1 - u)) + ')'; c.fillRect(Math.round(654 + Math.sin(k * 3 + t / 800) * 8), Math.round(150 - u * 80), 5, 5); }
    glow(c, 480, 340, 240, 'rgba(255,170,70,A)', 0.35);
    npc(c, 'grum', 330, 440, t, 2, false); npc(c, 'castana', 430, 444, t, 2, false); npc(c, 'vesper', 540, 442, t, 2, true); npc(c, 'ulalume', 640, 440, t, 2, true);
    c.fillStyle = 'rgba(40,20,0,0.35)'; c.fillRect(-200, -100, W + 400, H + 200);
  }
  function sc3(c, p, t) {   // la brasa
    var f = art('bg'); if (f) { try { f(c, 'chimenea', { w: W, h: H, t: t, p: p }); return; } catch (e) { /* reserva */ } }
    sky(c, '#0a0508', '#1a0c0c'); c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 5; c.fillStyle = '#2a2028';
    c.fillRect(300, 120, 360, 340); c.strokeRect(300, 120, 360, 340); c.fillStyle = '#0a0406'; c.fillRect(350, 220, 260, 240); c.restore();
    var e = Math.min(1, p * 1.4), ex = 480 + Math.sin(t / 700) * 14 * e, ey = 440 - e * 250 + Math.sin(t / 300) * 4;
    var col = p < 0.5 ? 'rgba(255,170,60,A)' : 'rgba(210,90,30,A)';
    glow(c, ex, ey, 60 + p * 140, col, 0.6); c.fillStyle = p < 0.5 ? '#ffd27a' : '#ff6a2a'; c.fillRect(Math.round(ex - 5), Math.round(ey - 5), 10, 10);
    glow(c, 480, 450, 90, 'rgba(255,120,40,A)', 0.25); dark(c, 0.25 + p * 0.25);
  }
  var PAN = [['#c090ff', 'pastor'], ['#ff9a3c', 'karceron'], ['#3fc0b0', 'letea'], ['#bfeaff', 'yarlak'], ['#f3a31f', 'melaria']];
  function icon(c, id, x, y, col) {
    c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round';
    if (id === 'pastor') { c.beginPath(); c.arc(0, -40, 18, 0, TAU); c.fill(); c.fillRect(-16, -22, 32, 60); c.beginPath(); c.arc(34, -30, 16, Math.PI, 0.3); c.stroke(); c.beginPath(); c.moveTo(50, -30); c.lineTo(50, 50); c.stroke(); }
    else if (id === 'karceron') { c.beginPath(); c.moveTo(-34, 40); c.lineTo(-34, -20); c.lineTo(-16, -6); c.lineTo(0, -44); c.lineTo(16, -6); c.lineTo(34, -20); c.lineTo(34, 40); c.closePath(); c.fill(); }
    else if (id === 'letea') { for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 26, 40); c.quadraticCurveTo(k * 26 + 14, 0, k * 26, -30); c.stroke(); c.beginPath(); c.arc(k * 26, -36, 8, 0, TAU); c.fill(); } }
    else if (id === 'yarlak') { for (var a = 0; a < 3; a++) { c.save(); c.rotate(a * Math.PI / 3); c.beginPath(); c.moveTo(0, -42); c.lineTo(0, 42); c.stroke(); c.restore(); } }
    else { c.beginPath(); for (var h = 0; h < 6; h++) { var an = h * Math.PI / 3 + 0.5; c.lineTo(Math.cos(an) * 38, Math.sin(an) * 38); } c.closePath(); c.fill(); }
    c.restore();
  }
  function sc4(c, p, t) {   // los cinco rescoldos: panel que se desplaza y se enciende de uno en uno
    var f = art('bg'); if (f) { try { f(c, 'rescoldos', { w: W, h: H, t: t, p: p }); return; } catch (e) { /* reserva */ } }
    sky(c, '#07040c', '#120a1c'); var k;
    for (k = 0; k < 5; k++) {
      var x = 30 + k * 184, lit = cl((t - 600 - k * 700) / 400, 0, 1), col = PAN[k][0];
      c.fillStyle = '#0c0714'; c.fillRect(x, 120, 170, 290); c.strokeStyle = lit > 0 ? col : '#2a2038'; c.lineWidth = 3; c.strokeRect(x + 1.5, 121.5, 167, 287);
      if (lit > 0) { glow(c, x + 85, 265, 120, 'rgba(' + hex(col) + ',A)', 0.35 * lit); c.globalAlpha = 0.35 + 0.65 * lit; icon(c, PAN[k][1], x + 85, 275, col); c.globalAlpha = 1; }
      else { c.globalAlpha = 0.25; icon(c, PAN[k][1], x + 85, 275, '#1a1226'); c.globalAlpha = 1; }
    }
    dark(c, 0.1);
  }
  function hex(h) { var n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
  function sc5(c, p, t) {   // la bufanda
    var f = art('bg'); if (f) { try { f(c, 'bufanda', { w: W, h: H, t: t, p: p }); return; } catch (e) { /* reserva */ } }
    sky(c, '#0a0610', '#2a1408', 440); stars(c, t, 0.5); ground(c, 450, '#120a0c'); glow(c, 480, 380, 300, 'rgba(255,140,50,A)', 0.2 + 0.05 * Math.sin(t / 300));
    npc(c, 'lanudo', 250, 470, t, 3, false); marlo(c, 600, 480, t, 8, true); scarf(c, 590, 300, t, 3);
    dark(c, 0.1);
  }
  function sc6(c, p, t) {   // el Portal y las seis llamas
    var f = art('bg'); if (f) { try { f(c, 'portal', { w: W, h: H, t: t, p: p }); return; } catch (e) { /* reserva */ } }
    sky(c, '#04020a', '#140a22', 330); stars(c, t, 0.7); hills(c, 300, '#0c0714', 14, 0.008, 2); ground(c, 420, '#08050c');
    var cols = ['#c090ff', '#ff9a3c', '#3fc0b0', '#bfeaff', '#f3a31f', '#ffffff'], k;
    for (k = 0; k < 6; k++) { var x = 130 + k * 140, s = k === 5 ? 0.7 : 0.45; glow(c, x, 300, 60 * (s + 0.3), 'rgba(' + hex(cols[k]) + ',A)', 0.4); c.fillStyle = cols[k]; c.beginPath(); c.moveTo(x - 10 * s, 310); c.quadraticCurveTo(x, 270 - 8 * s - Math.sin(t / 200 + k) * 3, x + 10 * s, 310); c.closePath(); c.fill(); }
    c.save(); c.strokeStyle = '#1b1124'; c.lineWidth = 5; c.fillStyle = '#3a3040'; c.fillRect(380, 250, 40, 190); c.fillRect(540, 250, 40, 190);
    c.beginPath(); c.moveTo(380, 270); c.quadraticCurveTo(480, 160, 580, 270); c.lineTo(580, 250); c.quadraticCurveTo(480, 120, 380, 250); c.closePath(); c.fill(); c.stroke(); c.strokeRect(380, 250, 40, 190); c.strokeRect(540, 250, 40, 190);
    var g = c.createRadialGradient(480, 350, 5, 480, 350, 110); g.addColorStop(0, 'rgba(255,220,140,' + (0.2 + 0.7 * cl(p * 2, 0, 1)) + ')'); g.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = g; c.fillRect(420, 260, 120, 180); c.restore();
    for (k = 0; k < 14; k++) { var a = t / 600 + k * 0.45; c.fillStyle = 'rgba(255,190,100,0.7)'; c.fillRect(Math.round(480 + Math.cos(a) * (20 + k * 4)), Math.round(350 + Math.sin(a) * (30 + k * 6) * 0.9), 3, 3); }
    marlo(c, 480 - 160 * (1 - cl(p * 1.4, 0, 1)) + 20 * cl(p * 1.4, 0, 1), 456 - 10 * cl(p * 1.4, 0, 1), t, 2.6 - 1.1 * cl(p * 1.4, 0, 1), false);
    dark(c, 0.15);
  }
  function over(c) {   // viñeta oscura común
    var g = c.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 620); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  var INTRO = {
    id: 'intro', len: 27000, over: over, letterbox: { in: [0, 700], out: [26200, 26900], bar: 44 },
    scenes: [
      { at: 0, dur: 4200, draw: sc1, cam: { from: { x: 0, y: 0, z: 1 }, to: { x: -60, y: 10, z: 1.2 } } },
      { at: 4200, dur: 4200, draw: sc2, cam: { from: { x: -70, y: 0, z: 1.05 }, to: { x: 70, y: 0, z: 1.05 } } },
      { at: 8400, dur: 4200, draw: sc3, cam: { from: { x: 0, y: 0, z: 1 }, to: { x: 0, y: -30, z: 1.45 } } },
      { at: 12600, dur: 5400, draw: sc4, cam: { from: { x: 60, y: 0, z: 1 }, to: { x: -60, y: 0, z: 1.05 } } },
      { at: 18000, dur: 4000, draw: sc5, cam: { from: { x: 0, y: 0, z: 1 }, to: { x: 60, y: -40, z: 1.25 } } },
      { at: 22000, dur: 5000, draw: sc6, cam: { from: { x: 0, y: 0, z: 1.15 }, to: { x: 0, y: 0, z: 1 } } }
    ],
    tracks: [
      { at: 0, type: 'music', track: 'cine_intro' },
      { at: 0, type: 'fade', from: 1, to: 0, dur: 900 },
      { at: 500, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: 'Siéntate, Marlo. Te cuento por qué Rescoldo huele a ceniza.', dur: 3600 },
      { at: 4200, type: 'cine', kind: 'trans', arg: 'in' },
      { at: 4500, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: 'Hubo un Hogar, con una chimenea que nunca se apagaba y un Pastor que cuidaba de todos.', dur: 3800 },
      { at: 8400, type: 'cine', kind: 'trans', arg: 'in' },
      { at: 8700, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: 'Una noche, una brasa se negó a apagarse. Y lo que no se apaga, lo devora todo.', dur: 3800 },
      { at: 10600, type: 'cine', kind: 'trans', arg: 'cut' },
      { at: 10600, type: 'flash', color: '#ff7a2a', a: 0.35, ms: 350 },
      { at: 12600, type: 'cine', kind: 'trans', arg: 'in' },
      { at: 12800, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: 'Prendió el cayado del Pastor. Despertó al Carcelero. Envenenó el río. Heló el norte. Enloqueció a la Reina.', dur: 5000 },
      { at: 13200, type: 'cine', kind: 'spark', arg: 0 }, { at: 13900, type: 'cine', kind: 'spark', arg: 1 },
      { at: 14600, type: 'cine', kind: 'spark', arg: 2 }, { at: 15300, type: 'cine', kind: 'spark', arg: 3 }, { at: 16000, type: 'cine', kind: 'spark', arg: 4 },
      { at: 18000, type: 'cine', kind: 'trans', arg: 'in' },
      { at: 18300, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: 'Y entre las cenizas nació un corderito con una bufanda que arde sin quemar. Tú.', dur: 3600 },
      { at: 22000, type: 'cine', kind: 'trans', arg: 'in' },
      { at: 22300, type: 'dlg', who: 'LANUDO', color: '#e8dcb0', text: 'Seis llamas siguen ardiendo. Apágalas.', dur: 2600 },
      { at: 25000, type: 'cine', kind: 'title' },
      { at: 25000, type: 'flash', color: '#fff2b0', a: 0.5, ms: 400 },
      { at: 25000, type: 'shake', amp: 4, ms: 400 },
      { at: 25000, type: 'title', text: 'SWARM HAND', sub: 'Apaga las seis llamas.', dur: 2000 },
      { at: 26300, type: 'fade', from: 0, to: 1, dur: 600 }
    ]
  };
  C.INTRO = INTRO;

  // ---------------------------------------------------------------- Guardado: marcas de la intro
  function cineSave() { return G.Save && G.Save.data && G.Save.data.cine; }
  C.introSeen = function () { var cs = cineSave(); return !!(cs && cs.introSeen); };
  C.markIntro = function () { var cs = cineSave(); if (cs && !cs.introSeen) { cs.introSeen = true; G.Save.save(); } };

  /* Reproduce la intro. opts: { replay:true (galería: saltable y no escribe en el guardado), onEnd(reason) }.
     La 1.ª vez (cuenta sin introSeen y no replay): bloqueada, sin botón SALTAR. */
  C.playIntro = function (opts) {
    opts = opts || {};
    var first = !opts.replay && !C.introSeen(), cfg = C.cfg();
    return C.play(INTRO, {
      mode: 'full', first: first, skippable: !first, calm: cfg.calm, returnState: opts.returnState || 'aldea',
      onEnd: function (reason) {
        if (!opts.replay && (reason === 'end' || reason === 'skip')) C.markIntro();
        try { Assets.music.stop(); } catch (e) { /* audio */ }
        if (opts.onEnd) opts.onEnd(reason);
      }
    });
  };

  // ---------------------------------------------------------------- Pantalla de título
  var T = null;
  C.titleActive = function () { return !!T; };
  C.openTitle = function (next) { T = { t: 0, next: next, going: false }; G.state = 'title'; };
  function afterTitle() {
    var next = T.next; T = null;
    var go = function () { try { Assets.music.stop(); } catch (e) { /* audio */ } G.state = 'aldea'; if (next) next(); };
    if (C.off) { go(); return; }
    if (!C.introSeen() || C.force) { if (!C.playIntro({ replay: C.introSeen(), onEnd: go })) go(); }
    else go();
  }
  C.titleUpdate = function (dt) {
    if (!T) { G.state = 'aldea'; return; }
    T.t += dt;
    var inp = G.input, any = inp.hit('Mouse0') || Object.keys(inp.pressed).length > 0;
    if (T.t > 400 && !T.going && any) {
      T.going = true;
      try { G.Snd.unlock(); } catch (e) { /* audio */ } try { Assets.unlock(); } catch (e2) { /* audio */ }
      C.snd('tap');   // dentro del gesto: desbloquea el audio; luego la pista del título
      try { Assets.music.setTrack('cine_title'); Assets.music.start(); } catch (e3) { /* audio */ }
      afterTitle();
    }
  };
  C.titleDraw = function (c) {
    var t = T ? T.t : 0, k;
    sky(c, '#05030a', '#1c0e14'); stars(c, t, 0.8);
    for (k = 0; k < EMB.length; k++) { var e = EMB[k], u = ((t * 0.00006 * e.sp * 1000) / 60 + e.y) % 1; c.fillStyle = 'rgba(255,' + (140 + Math.floor(80 * (1 - u))) + ',60,' + (0.7 * (1 - u)) + ')'; c.fillRect(Math.round(e.x + Math.sin(t / 900 + e.ph) * 14), Math.round(H - u * (H + 20)), 3, 3); }
    hills(c, 420, '#0c0714', 16, 0.007, 1.3); ground(c, 470, '#08050c'); flame(c, 480, 478, 0.9, t);
    var fa = cl(t / 900, 0, 1), logo = art('titleLogo');
    c.save(); c.globalAlpha = fa;
    if (logo) { try { logo(c, W / 2, 150, { p: 1, t: t }); } catch (e1) { logo = null; } }
    if (!logo) {
      glow(c, W / 2, 150, 260, 'rgba(255,110,30,A)', 0.25 + 0.05 * Math.sin(t / 400));
      G.txt(c, 'SWARM HAND', W / 2, 150, 76, '#ffb347', 'center', '#2a0a04'); G.txt(c, 'Apaga las seis llamas.', W / 2, 212, 20, '#f0d8b8', 'center');
    }
    c.restore();
    if (t > 700) { c.save(); c.globalAlpha = 0.55 + 0.45 * Math.sin(t / 380); G.txt(c, 'TOCA PARA JUGAR', W / 2, 330, 30, '#fff2b0', 'center'); c.restore(); }
    G.txt(c, 'Mini Estudio  -  v9', W - 14, H - 12, 10, 'rgba(200,190,220,0.4)', 'right');
    var vg = c.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 640); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  };

  /* Arranque desde G.init: devuelve true si el título toma el control (y entonces `next` se llama al terminar el flujo; ahí van ?direct= / ?boss= / ?hunt= cuando se forzó ?cine=1). */
  C.boot = function (next) {
    if (!C.auto) return false;
    C.openTitle(next); return true;
  };
})();
