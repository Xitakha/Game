/*!
 * assets_mini2.js - Arte P4.5: MINIJEFES de la CRIPTA y la TUNDRA (DESIGN-v6-minijefes.md 4.3, 4.4, 4.7, 4.8; solo arte, sin logica).
 * Se carga DESPUES de assets_boss3.js (usa Assets._h). Contrato exacto: ASSETS_API.md, seccion "Minijefes P4.5 (Cripta y Tundra)".
 *   Cripta: enemy_mini_alcaide (rediseno del Coloso: carcelero con escudo-puerta y grilletes), enemy_mini_centinela (sprite propio, roca y magma),
 *           fx_shackle_ball, proj_mini_key, proj_magma_glob.
 *   Tundra: enemy_mini_yeti (+15 frames al final del existente), enemy_mini_ventisquero (+12), fx_blizz_wave.
 * Misma gramatica que fam1/fam3: contorno grueso #1b1124, color plano + 1 sombra + 1 brillo, miran a la DERECHA. Base x2 = final.
 * Todo se precompone una vez al cargar (offscreen): en juego el dibujo es un drawImage.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H || !H.reg) { if (window.console) console.error('assets_mini2: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, dyingFrames = H.dyingFrames, PH = H.PH, OLC = H.OLC;
  var TAU = 6.2832, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  var WALKSEQ = [0, 2, 1, 3, 4, 5], WK = [1, 2, 4, 5];
  function wk(k) { var p = PH[WK[k]]; return { c: Math.round(cos(p)), by: -(Math.abs(sin(p)) > 0.8 ? 1 : 0) }; }
  function withDie(fr, draw, w, h, opt, o) {
    var d0 = fr.length;
    dyingFrames(draw, w, h, opt, o).forEach(function (f) { fr.push(f); });
    return { f: [d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4], fps: 9, loop: false };
  }
  function glow(X, x, y, r, rgb, a) {
    var g = X.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill();
  }
  function eye(v, x, y, r, col) { v.dot(x, y, r + 0.55, OLC); v.dot(x, y, r, col); v.dot(x - r * 0.35, y - r * 0.35, r * 0.42, '#ffffff'); }
  function polyline(X, pts, col, lw) { X.strokeStyle = col; X.lineWidth = lw; X.beginPath(); X.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) X.lineTo(pts[i][0], pts[i][1]); X.stroke(); }
  function star(v, x, y, r, col, ol) { // estrella de impacto
    var pts = [], i; for (i = 0; i < 10; i++) { var a = i / 10 * TAU - 0.3, rr = i % 2 ? r * 0.45 : r; pts.push([x + cos(a) * rr, y + sin(a) * rr]); }
    v.part(Ppoly(pts), col, { lw: 0.7, ol: ol, so: 0.2 });
  }

  // ======================================================================================================
  //  ALCAIDE DE HIERRO 36x36 -> 72x72   (carcelero: yelmo de reja, escudo-puerta de celda, grillete y llaves)
  // ======================================================================================================
  var IR = '#6b7385', IRD = '#3a4050', IRH = '#aab4c8', OR = '#ff6a1a', GD = '#ffd23a', GDS = '#b88a1c', VI = '#4a3a6a', VIS = '#2e2346';
  function keyShape(v, x, y, rot, s) {
    var X = v.ctx; X.save(); X.translate(x, y); X.rotate(rot); X.scale(s || 1, s || 1);
    v.stick([[-0.4, 0], [4, 0]], 1.1, GD, { lw: 0.7 });
    v.part(Pcirc(-1.8, 0, 1.7), GD, { lw: 0.8, sh: GDS, so: 0.3 });
    v.dot(-1.8, 0, 0.6, OLC);
    v.part(Prr(2.2, 0.4, 1, 1.9, 0.2), GD, { lw: 0.5, so: 0 }); v.part(Prr(3.5, 0.4, 0.9, 1.4, 0.2), GD, { lw: 0.5, so: 0 });
    X.restore();
  }
  function link(v, x, y, rot) { var X = v.ctx; X.save(); X.translate(x, y); X.rotate(rot || 0); v.part(Prr(-1.5, -0.9, 3, 1.8, 0.9), IRH, { lw: 0.7, sh: IR, so: 0.2 }); v.dot(0, 0, 0.45, OLC); X.restore(); }
  function door(v, cx, cy, rot, o) { // escudo-puerta de celda (centro cx,cy; alto 25, ancho 12). o: glow, hit, brk (rota: mas baja, agrietada), dark
    o = o || {}; var X = v.ctx, w = 12, h = o.h || 25, S = o.dark ? IRD : IR;
    X.save(); X.translate(cx, cy); X.rotate(rot || 0);
    if (o.glow) glow(X, 0, -h / 2 + 3.6, 9, '255,106,26', 0.55);
    v.part(Prr(-w / 2, -h / 2, w, h, 1.4), S, { lw: 1.7, sh: IRD, hi: IRH, so: 1.1 });
    v.part(Prr(-w / 2 + 1.7, -h / 2 + 1.7, w - 3.4, h - 3.4, 0.8), o.dark ? '#2c303c' : '#505870', { lw: 0.6, sh: '#3a4050', so: 0.5 });
    v.line(-w / 2 + 1.7, -h * 0.12, w / 2 - 1.7, -h * 0.12, 0.9, OLC); v.line(-w / 2 + 1.7, h * 0.26, w / 2 - 1.7, h * 0.26, 0.9, OLC);
    v.line(-0.4, -h / 2 + 5.4, -0.4, h / 2 - 1.7, 0.5, 'rgba(27,17,36,0.7)');
    v.part(Prr(-w / 2 - 1.1, -h / 2 + 3.4, 2.2, 3, 0.5), IRD, { lw: 0.8, so: 0 }); v.part(Prr(-w / 2 - 1.1, h / 2 - 7.6, 2.2, 3, 0.5), IRD, { lw: 0.8, so: 0 });
    v.part(Prr(-2.4, -h / 2 + 2.6, 4.8, 2.8, 0.6), o.glow ? '#ffd23a' : OR, { lw: 0.8, sh: '#c8501c', so: 0.3 });
    [[-3.6, -h * 0.3], [3.6, -h * 0.3], [-3.6, h * 0.4], [3.6, h * 0.4]].forEach(function (p) { v.dot(p[0], p[1], 0.55, IRH); });
    if (o.brk) { polyline(X, [[-w / 2, -h * 0.1], [-1.2, 0.2], [-3, h * 0.2], [2, h * 0.3], [w / 2, h * 0.2]], OLC, 1.1); X.fillStyle = 'rgba(27,17,36,0.9)'; X.beginPath(); X.moveTo(w / 2, -h / 2); X.lineTo(w / 2, -h / 2 + 5); X.lineTo(w / 2 - 4, -h / 2); X.fill(); }
    X.restore();
    if (o.hit) star(v, cx + 9.4, cy - 1, 4.2, '#fff6d0', '#c8501c');
  }
  function alc(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, bx = o.bx || 0, L = o.legs || [0, 0], np = o.np, arm = o.arm || 'down', hy = o.hy || 0, sh = o.sh || {}, lean = o.lean || 0;
      var sx = 26.4 + (sh.dx || 0) + bx, sy = 20.5 + (sh.dy || 0) + by * 0.5, i, hx = 16.6 + bx;
      // piernas (grebas de hierro)
      [0, 1].forEach(function (k) {
        var lx = (k ? 18.2 : 9.8) + L[k] + bx * 0.4;
        v.part(Prr(lx, 25.6, 5.8, 6.4, 1.3), k ? IR : IRD, { lw: 1.4, sh: IRD, hi: IRH, so: 0.5 });
        v.part(Prr(lx - 0.8, 30.4, 7.4, 3.6, 1.3), IRD, { lw: 1.3, sh: '#262a36', so: 0.4 });
      });
      X.save(); X.translate(16, 33); X.rotate(lean); X.translate(-16, -33);
      // brazo libre de atras (con grillete)
      var shx = 9.6 + bx, shy = 16.6 + by;
      function cuff(x, y) { v.part(Pcirc(x, y, 2.5), IRD, { lw: 1.3, sh: '#262a36', hi: IRH, so: 0.4 }); v.dot(x, y, 0.8, OLC); }
      function backArm() {
        if (arm === 'down') {
          v.stick([[shx, shy], [5.8, 20.6 + by], [5.2, 25.4 + by * 0.5]], 4.6, IR, { lw: 1.4, curve: true, hi: IRH }); cuff(5.2, 25.6 + by * 0.5);
          for (i = 0; i < 3; i++) link(v, 4.6 + (i % 2) * 0.5, 28.6 + i * 1.9, i % 2 ? 0 : 1.57);
        } else if (arm === 'keysUp') {
          v.stick([[shx, shy], [5.6, 12.6 + by], [4.6, 8.6 + by]], 4.4, IR, { lw: 1.4, curve: true, hi: IRH }); cuff(4.6, 8.4 + by);
          X.strokeStyle = OLC; X.lineWidth = 2.2; X.beginPath(); X.arc(4.2, 4.6 + by, 2.5, 0, TAU); X.stroke(); X.strokeStyle = GD; X.lineWidth = 1.1; X.beginPath(); X.arc(4.2, 4.6 + by, 2.5, 0, TAU); X.stroke();
          keyShape(v, 2.2, 7.6 + by, 2.3, 1); keyShape(v, 6.6, 7.2 + by, 0.8, 1); keyShape(v, 4.2, 8.6 + by, 1.57, 1.1);
        } else if (arm === 'orbit') {
          v.stick([[shx, shy], [5, 15 + by], [3, 10.4 + by]], 4.4, IR, { lw: 1.4, curve: true, hi: IRH }); cuff(3, 10 + by);
          X.strokeStyle = 'rgba(255,210,58,0.55)'; X.lineWidth = 1; X.beginPath(); X.arc(4, 9, 7.2, -2.7, 1.0); X.stroke();
          X.strokeStyle = 'rgba(255,255,255,0.7)'; X.lineWidth = 0.6; X.beginPath(); X.arc(4, 9, 8.6, -2.2, 0.5); X.stroke();
          keyShape(v, 5 + cos(-1.9) * 7, 9 + sin(-1.9) * 7, -1.9 + 1.57, 1); keyShape(v, 4 + cos(-0.7) * 7.2, 9 + sin(-0.7) * 7.2, -0.7 + 1.57, 1); keyShape(v, 4 + cos(0.6) * 7.2, 9 + sin(0.6) * 7.2, 0.6 + 1.57, 1);
        } else if (arm === 'chainUp') {
          v.stick([[shx, shy], [8.6, 10.6 + by], [10.6, 6.2 + by]], 4.4, IR, { lw: 1.4, curve: true, hi: IRH }); cuff(10.6, 6 + by);
          X.save(); X.translate(12.4, 2.8 + by); X.rotate(-0.25);
          X.strokeStyle = OLC; X.lineWidth = 3; X.beginPath(); X.ellipse(0, 0, 7.4, 2.8, 0, 0, TAU); X.stroke();
          X.strokeStyle = IRH; X.lineWidth = 1.5; X.setLineDash([2.2, 1.1]); X.beginPath(); X.ellipse(0, 0, 7.4, 2.8, 0, 0, TAU); X.stroke(); X.setLineDash([]);
          X.restore(); v.dot(19.2, 1.6 + by, 0.9, OR); v.dot(5.8, 3.8 + by, 0.8, GD); v.dot(15.6, 5.4 + by, 0.7, OR); glow(X, 12, 3 + by, 9, '255,106,26', 0.35);
        } else if (arm === 'pin') {
          v.stick([[shx, shy + 1], [6.2, 22.6 + by], [7, 27.6 + by]], 4.6, IR, { lw: 1.4, curve: true, hi: IRH }); cuff(7, 27.8 + by);
          for (i = 0; i < 7; i++) link(v, 9.4 + i * 3.1, 30.2 + by * 0.2 + (i % 2) * 0.2, i % 2 ? 0 : 1.57);
          v.part(Ppoly([[29.4, 28.6], [32.6, 33.6], [34.6, 33.6], [33.6, 28.4]]), IRD, { lw: 1.2, so: 0.3 }); v.dot(31.8, 31, 1.6, OR);
        } else if (arm === 'pwind') {
          v.stick([[shx, shy], [5, 14 + by], [3.4, 9.6 + by]], 4.8, IR, { lw: 1.4, curve: true, hi: IRH }); v.part(Pcirc(3.4, 8.4 + by, 3.3), IRD, { lw: 1.4, sh: '#262a36', hi: IRH, so: 0.5 });
        }
      }
      if (arm !== 'sweep' && arm !== 'punch') backArm();
      // torso
      v.part(Pblob(hx - 0.2, 20 + by, 7.6, 6.9, 601, 0.04), IR, { lw: 1.7, sh: IRD, hi: IRH, so: 1 });
      v.part(Ppoly([[hx - 5.4, 16 + by], [hx + 5, 16 + by], [hx + 3.4, 22 + by], [hx - 3.4, 22 + by]]), '#808a9f', { lw: 0, sh: IR, so: 0.5 });
      v.line(hx - 0.2, 14.4 + by, hx - 0.2, 21.4 + by, 0.8, IRD);
      // paño violeta bajo el cinto
      v.part(Ppoly([[hx - 5, 24.6 + by], [hx + 5.4, 24.6 + by], [hx + 5, 29.2], [hx + 2.6, 28 + by * 0.3], [hx, 30], [hx - 2.4, 28], [hx - 5, 29.4]]), VI, { lw: 1.3, sh: VIS, so: 0.5 });
      v.part(Prr(hx - 7.4, 23 + by, 14.8, 2.4, 0.8), IRD, { lw: 1.1, sh: '#262a36', so: 0.3 });
      v.part(Prr(hx - 1.4, 23.1 + by, 2.8, 2.2, 0.4), GD, { lw: 0.7, sh: GDS, so: 0.3 });
      if (arm !== 'keysUp' && arm !== 'orbit') { // manojo de llaves al cinto
        v.dot(hx - 6.6, 25.6 + by, 1.1, GD); keyShape(v, hx - 7.6, 27.6 + by, 1.57, 0.8); keyShape(v, hx - 5.4, 27.4 + by, 1.4, 0.8);
      }
      // hombreras
      v.part(Pblob(hx - 7.4, 16.4 + by, 3.6, 3.2, 602, 0.05, 8, -0.3), IRD, { lw: 1.3, sh: '#262a36', hi: IRH, so: 0.5 });
      // brazo del escudo
      if (!np) v.stick([[hx + 6, 16.4 + by], [sx - 5, sy - 6]], 4.6, IR, { lw: 1.4, hi: IRH });
      else v.stick([[hx + 6, 16.8 + by], [sx - 2.4, sy - 4.4]], 4.6, IR, { lw: 1.4, hi: IRH });
      // cabeza: yelmo de reja
      var hY = 9.2 + by + hy;
      v.part(Pblob(hx, hY, 5.9, 6.1, 603, 0.03), IR, { lw: 1.7, sh: IRD, hi: IRH, so: 1 });
      v.part(Ppoly([[hx - 1.2, hY - 6.8], [hx + 1.4, hY - 6.8], [hx + 1.8, hY - 2], [hx - 1.6, hY - 2]]), IRD, { lw: 0.9, so: 0 }); // cresta
      v.part(Prr(hx - 4.4, hY - 1.7, 9.6, 4.6, 0.8), '#1a1020', { lw: 0.9, so: 0 });
      X.fillStyle = o.hurt ? '#ffffff' : (o.rage ? GD : OR); X.fillRect(hx - 3.7, hY - 0.9, 8.2, 2.7);
      X.fillStyle = OLC; for (i = 0; i < 4; i++) X.fillRect(hx - 3.2 + i * 2.1, hY - 1.7, 0.8, 4.6);
      v.line(hx - 4.2, hY + 3.6, hx + 5, hY + 3.6, 0.7, IRD);
      if (o.roar) { v.part(Ppoly([[hx - 3, hY + 3.2], [hx + 4.6, hY + 3.2], [hx + 3.4, hY + 5.2], [hx - 2.2, hY + 5.2]]), '#1a1020', { lw: 0.7, so: 0 }); glow(X, hx + 1, hY + 1, 7, '255,106,26', 0.5); }
      if (!np && (sh.glow || o.rec)) glow(X, hx + 1, hY + 0.4, 5, '255,106,26', 0.35);
      // escudo-puerta
      if (!np) { door(v, sx, sy, sh.rot || 0, { glow: sh.glow, hit: sh.hit }); }
      else {
        // escudo roto: la puerta cuelga del brazo, arrastrando por el suelo
        door(v, sx - 1.6, sy + 5.2, 0.2 + (sh.rot || 0), { h: 19, brk: true, dark: true });
        v.part(Pcirc(sx - 3.2, sy - 3.4, 3), IRD, { lw: 1.3, sh: '#262a36', hi: IRH, so: 0.4 });
      }
      if (arm === 'sweep' || arm === 'punch') {
        if (arm === 'sweep') {
          v.stick([[shx, shy], [18, 14.4 + by], [28.4, 13.6 + by]], 4.6, IR, { lw: 1.4, curve: true, hi: IRH }); cuff(29.6, 13.6 + by);
          for (i = 0; i < 2; i++) link(v, 33 + i * 3, 13.6 + by + (i % 2) * 0.1, i % 2 ? 0 : 1.57);
          v.dot(34.8, 12.2 + by, 0.8, OR); v.dot(32.2, 15.6 + by, 0.7, GD);
        } else {
          v.stick([[shx, shy], [18, 17 + by], [28, 17.6 + by]], 4.8, IR, { lw: 1.4, curve: true, hi: IRH }); v.part(Pcirc(30.2, 17.6 + by, 3.6), IRD, { lw: 1.4, sh: '#262a36', hi: IRH, so: 0.5 });
          star(v, 34.2, 17.6 + by, 3.4, '#fff6d0', '#c8501c');
        }
      }
      X.restore();
      if (o.dust) { v.line(1, 33, 7, 33, 0.8, 'rgba(210,200,190,0.9)'); v.line(25, 33.4, 32, 33.4, 0.8, 'rgba(210,200,190,0.9)'); v.line(3, 31.6, 6.4, 31.6, 0.6, 'rgba(210,200,190,0.8)'); }
      if (o.sweat) { v.dot(22.6, 3.6, 0.7, '#d8f0ff'); v.dot(10, 4.6, 0.6, '#d8f0ff'); v.dot(24.4, 7, 0.55, '#d8f0ff'); }
      if (o.waves) { X.strokeStyle = 'rgba(255,214,150,0.85)'; X.lineWidth = 0.8; [[0, -2.6], [1, 0], [2, 2.6]].forEach(function (a) { X.beginPath(); X.arc(hx + 3, 8, 8 + a[0] * 2.4, -0.55 + a[1] * 0.12, 0.55 + a[1] * 0.12); X.stroke(); }); }
      if (o.flash) { X.strokeStyle = '#ffffff'; X.lineWidth = 1; X.beginPath(); X.moveTo(27, 2); X.lineTo(30, 5); X.moveTo(31, 2); X.lineTo(28, 5); X.moveTo(3, 3); X.lineTo(6, 5.4); X.stroke(); }
    };
  }
  (function () {
    var F = [], k, q;
    function P(o) { return alc(o); }
    F.push(P({}), P({ by: 0.8 }));
    for (k = 0; k < 4; k++) { q = wk(k); F.push(P({ by: q.by * 0.8, legs: [-q.c * 1.3, q.c * 1.3] })); }
    F.push(P({ bx: -1.6, sh: { dx: -3.6, glow: true }, lean: -0.05, by: 0.4 }));                 // 6 bash-wind
    F.push(P({ bx: 0.4, sh: { dx: 1.8, hit: true }, legs: [0, 1.4], lean: 0.05 }));                   // 7 bash
    F.push(P({ arm: 'keysUp', by: -0.4 }));                                                         // 8 keys-wind
    F.push(P({ arm: 'orbit', by: -0.2, bx: -0.6 }));                                                // 9 keys-orbit
    F.push(P({ arm: 'chainUp', by: -0.6, rage: false, sh: { dx: -1.2, glow: true } }));            // 10 chain-wind
    F.push(P({ arm: 'sweep', bx: 0.8, sh: { dx: -3.4, dy: 1.2, rot: -0.12 }, lean: 0.04, legs: [-1, 1.4] })); // 11 chain-sweep
    F.push(P({ arm: 'pin', by: 1.8, hy: 2.2, lean: 0.12, sweat: true, sh: { dy: 1.4, dx: -1.6, rot: 0.06 } })); // 12 rec
    F.push(P({ hurt: true, bx: -2, by: 0.8, lean: -0.1, flash: true, sh: { dx: -1.6, dy: -0.6, rot: -0.1 } })); // 13 hurt
    F.push(P({ roar: true, rage: true, by: -0.8, hy: -1.2, lean: -0.05, waves: true, sh: { dy: -2, glow: true } })); // 14 roar
    var dieA = withDie(F, P({}), 36, 36, { lw: 1.5 });                                              // 15-19
    var np = { np: true };
    function N(o) { o.np = true; return P(o); }
    F.push(N({ sh: { rot: 0 } }), N({ by: 0.8 }));                                                  // 20-21 idle_np
    for (k = 0; k < 4; k++) { q = wk(k); F.push(N({ by: q.by * 0.8, legs: [-q.c * 1.3, q.c * 1.3] })); } // 22-25 walk_np
    F.push(N({ arm: 'pwind', bx: -1.4, by: 0.4, lean: -0.05 }));                                    // 26 punch-wind_np
    F.push(N({ arm: 'punch', bx: 1.2, legs: [0, 1.4], lean: 0.05 }));                               // 27 punch_np
    F.push(N({ arm: 'chainUp', by: -0.6, rage: true }));                                            // 28 chain-wind_np
    F.push(N({ arm: 'sweep', bx: 0.8, legs: [-1, 1.4], lean: 0.04, rage: true }));                  // 29 chain-sweep_np
    F.push(N({ arm: 'pin', by: 1.8, hy: 2.2, lean: 0.12, sweat: true }));                           // 30 rec_np
    addV('enemy_mini_alcaide', 36, 36, F, { lw: 1.5 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, bash: { f: [6, 7], fps: 8 }, keys: { f: [8, 9], fps: 8 }, chain: { f: [10, 11], fps: 8 },
      rec: { f: [12], fps: 1 }, hurt: { f: [13], fps: 1 }, roar: { f: [14], fps: 1 }, die: dieA,
      idle_np: { f: [20, 21], fps: 3 }, walk_np: { f: [20, 22, 21, 23, 24, 25], fps: 6 }, bash_np: { f: [26, 27], fps: 8 }, chain_np: { f: [28, 29], fps: 8 }, rec_np: { f: [30], fps: 1 }
    });
  })();

  // ======================================================================================================
  //  CENTINELA DE BRASA 32x40 -> 64x80   (soldado de roca negra agrietada, pecho de rejilla con el nucleo, hombrera de hierro asimetrica)
  // ======================================================================================================
  var ROC = '#241c34', ROCS = '#150f20', ROCH = '#54476e', MG = '#ff6a1a', LV = '#ffd23a', CORE = '#ff9a2a', COLD = '#5a3a30';
  function cen(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, c = o.c || 0, lean = o.lean || 0, np = o.np, hot = o.hot == null ? 0.5 : o.hot, hy = o.hy || 0, i;
      var CR = np ? COLD : MG, CRH = np ? '#7a5a4c' : LV, arm = o.arm || 'down', open = o.open, em = o.em || 0;
      var gy = 37.4;
      // piernas
      [0, 1].forEach(function (k) {
        var lx = (k ? 17.4 - c * 1.3 : 10.4 + c * 1.3) + (o.wide ? (k ? 1.6 : -1.6) : 0);
        v.part(Prr(lx, 27.6 + by * 0.4, 4.8, 8.6, 1.4), ROC, { lw: 1.5, sh: ROCS, hi: ROCH, so: 0.6 });
        v.part(Prr(lx - 0.8, 34.2, 6.4, 3.4, 1.2), k ? IR : IRD, { lw: 1.4, sh: IRD, hi: IRH, so: 0.4 });
        polyline(X, [[lx + 1, 29.6 + by * 0.4], [lx + 2.6, 31.4], [lx + 1.6, 33]], CR, 0.8);
        if (!np && hot > 0.5) glow(X, lx + 2.4, 30.6, 3.4, '255,106,26', 0.45);
      });
      X.save(); X.translate(16, gy); X.rotate(lean); X.translate(-16, -gy);
      // brazo de atras
      var back = o.backArm || 'down';
      if (back === 'down') {
        v.stick([[9.4, 13.4 + by], [6.2, 19.4 + by], [6.4, 25.8 + by]], 4.2, ROC, { lw: 1.5, curve: true, hi: ROCH }); v.part(Pcirc(6.4, 26.6 + by, 2.5), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      } else {
        v.stick([[9.4, 13.4 + by], [5.6, 17 + by], [4.6, 22.6 + by]], 4.2, ROC, { lw: 1.5, curve: true, hi: ROCH }); v.part(Pcirc(4.4, 23.4 + by, 2.5), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      }
      // torso
      v.part(Ppoly([[9, 12 + by], [23, 12 + by], [21.4, 28.4 + by], [10.6, 28.4 + by]]), ROC, { lw: 1.8, sh: ROCS, hi: ROCH, so: 1.2 });
      v.part(Prr(10.2, 26.2 + by, 11.6, 2.6, 0.9), IRD, { lw: 1.2, sh: '#262a36', hi: IRH, so: 0.3 });
      polyline(X, [[11.4, 13.4 + by], [13, 17 + by], [11.8, 21.6 + by], [14, 26 + by]], CR, 0.9);
      polyline(X, [[21, 13.4 + by], [19.2, 18.4 + by], [20.6, 23.6 + by]], CR, 0.9);
      if (!np) { polyline(X, [[11.4, 13.4 + by], [13, 17 + by], [11.8, 21.6 + by]], LV, 0.3); }
      // pecho de rejilla / nucleo
      var cy = 18.4 + by;
      if (!open) {
        v.part(Prr(12.2, 14.2 + by, 7.8, 8.6, 1.2), '#0e0818', { lw: 1.3, so: 0 });
        var cc = np ? '90,58,48' : '255,150,40';
        glow(X, 16.1, cy, np ? 4 : 6.2 + (o.cw || 0), cc, np ? 0.5 : 0.55 + (o.cw || 0) * 0.08);
        v.dot(16.1, cy, 1.9 + (o.cw ? 0.6 : 0), np ? COLD : CORE); if (!np) v.dot(15.6, cy - 0.5, 0.8, '#fff2b0');
        X.strokeStyle = np ? '#3a3040' : '#7a8398'; X.lineWidth = 0.8; X.beginPath(); for (i = 0; i < 4; i++) { X.moveTo(12.4, 15.6 + by + i * 2); X.lineTo(19.8, 15.6 + by + i * 2); } X.stroke();
        X.strokeStyle = OLC; X.lineWidth = 0.5; X.beginPath(); for (i = 0; i < 4; i++) { X.moveTo(12.4, 16.2 + by + i * 2); X.lineTo(19.8, 16.2 + by + i * 2); } X.stroke();
        if (o.cw) { polyline(X, [[16, 12 + by], [14.6, 14 + by]], LV, 0.7); polyline(X, [[16.2, 24 + by], [17.6, 26.4 + by]], LV, 0.7); polyline(X, [[11.8, 18.4 + by], [9.6, 17.6 + by]], LV, 0.7); polyline(X, [[20.4, 18.4 + by], [22.6, 19.4 + by]], LV, 0.7); }
      } else {
        glow(X, 16.1, cy, 12, '255,170,50', 0.8);
        v.part(Prr(12.2, 13.8 + by, 7.8, 9.4, 1.2), '#1a0c10', { lw: 1.3, so: 0 });
        v.part(Ppoly([[12.2, 13.6 + by], [7.4, 11.6 + by], [6.2, 24 + by], [12.2, 23.4 + by]]), ROC, { lw: 1.4, sh: ROCS, hi: ROCH, so: 0.6 });
        v.part(Ppoly([[20, 13.6 + by], [24.8, 11.6 + by], [26, 24 + by], [20, 23.4 + by]]), ROC, { lw: 1.4, sh: ROCS, hi: ROCH, so: 0.6 });
        polyline(X, [[8.2, 13.4 + by], [9, 18 + by], [8, 22 + by]], MG, 0.8); polyline(X, [[24, 13.4 + by], [23.2, 18 + by], [24.4, 22 + by]], MG, 0.8);
        v.part(Pcirc(16.1, cy, 3.9), CORE, { lw: 1.1, sh: LV, hi: '#ffffff', so: 0.7 }); v.dot(15.4, cy - 0.8, 1.5, '#fffbe0');
        X.strokeStyle = 'rgba(255,240,170,0.9)'; X.lineWidth = 0.7; X.beginPath(); for (i = 0; i < 8; i++) { var a = i / 8 * TAU + 0.2; X.moveTo(16.1 + cos(a) * 5.2, cy + sin(a) * 5.2); X.lineTo(16.1 + cos(a) * 7.4, cy + sin(a) * 7.4); } X.stroke();
      }
      // hombrera de hierro asimetrica (derecha, grande) y puas de roca (izquierda)
      v.part(Ppoly([[7, 13 + by], [8.4, 8.6 + by], [10.8, 12.6 + by], [10.2, 14.6 + by]]), ROC, { lw: 1.2, sh: ROCS, hi: ROCH, so: 0.4 });
      v.part(Pblob(23.4, 12.6 + by, 5.4, 3.8, 701, 0.05, 9, -0.28), IR, { lw: 1.5, sh: IRD, hi: IRH, so: 0.8 });
      v.part(Ppoly([[21.4, 10.4 + by], [23.6, 6.4 + by], [25.6, 10.4 + by]]), IRD, { lw: 1.1, hi: IRH, so: 0.3 });
      v.dot(24.6, 12.8 + by, 0.7, IRH);
      // cabeza
      var hY = 7.8 + by + hy;
      v.part(Pblob(16.4, hY, 4.9, 5.2, 702, 0.04), ROC, { lw: 1.6, sh: ROCS, hi: ROCH, so: 0.8 });
      v.part(Ppoly([[12.4, hY - 3.8], [16.4, hY - 6.6], [20.4, hY - 3.8], [20.2, hY - 2.6], [12.6, hY - 2.6]]), IRD, { lw: 1, hi: IRH, so: 0.3 });
      var ec = o.hurt ? '#ffffff' : (np ? '#8a5a48' : '#ff9a2a');
      v.part(Ppoly([[13.2, hY - 0.8], [16, hY - 0.2], [16, hY + 0.9], [13.4, hY + 0.5]]), ec, { lw: 0.5, so: 0 });
      v.part(Ppoly([[16.8, hY - 0.2], [19.6, hY - 0.8], [19.4, hY + 0.5], [16.8, hY + 0.9]]), ec, { lw: 0.5, so: 0 });
      if (!np) { glow(X, 16.4, hY, 6, '255,120,30', 0.3); polyline(X, [[16.4, hY + 2], [16.2, hY + 4]], CR, 0.7); }
      if (o.roar) { v.part(Ppoly([[13.6, hY + 2.4], [19.4, hY + 2.4], [18.6, hY + 4.4], [14.4, hY + 4.4]]), np ? COLD : '#ff9a2a', { lw: 0.7, so: 0 }); }
      // brazo delantero (derecha)
      if (arm === 'down') {
        v.stick([[22.4, 14.6 + by], [25.6, 20 + by], [25.8, 26 + by]], 4.8, ROC, { lw: 1.5, curve: true, hi: ROCH }); v.part(Pcirc(25.8, 26.8 + by, 2.7), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      } else if (arm === 'back') {
        v.stick([[22.4, 14.6 + by], [20, 19.6 + by], [16.4, 23 + by]], 4.8, ROC, { lw: 1.5, curve: true, hi: ROCH }); v.part(Pcirc(15.6, 23.6 + by, 2.7), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      } else if (arm === 'fanWind') {
        v.stick([[22.4, 13.4 + by], [26.6, 8.4 + by], [27.4, 4.4 + by]], 4.6, ROC, { lw: 1.5, curve: true, hi: ROCH });
        if (!np) { glow(X, 27.6, 3 + by, 7, '255,106,26', 0.7); v.part(Pcirc(27.6, 3 + by, 3.1), MG, { lw: 1.2, sh: '#c8501c', hi: LV, so: 0.6 }); v.dot(27.2, 2.6 + by, 1.1, '#fff2b0'); }
        else v.part(Pcirc(27.6, 3 + by, 3.1), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      } else if (arm === 'fanCast') {
        v.stick([[22.4, 14.2 + by], [25.4, 15.2 + by], [27.8, 15 + by]], 4.8, ROC, { lw: 1.5, curve: true, hi: ROCH });
        if (!np) { glow(X, 28.4, 15 + by, 7, '255,106,26', 0.75); v.part(Pcirc(28.4, 15 + by, 3), MG, { lw: 1.2, sh: '#c8501c', hi: LV, so: 0.6 }); star(v, 28.8, 15 + by, 2.8, '#fff2b0', MG); }
        else v.part(Pcirc(28.2, 15 + by, 3), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      } else if (arm === 'up') {
        v.stick([[22.4, 13.4 + by], [27.4, 9.6 + by], [28.4, 5.4 + by]], 4.8, ROC, { lw: 1.5, curve: true, hi: ROCH }); v.part(Pcirc(28.4, 4.6 + by, 2.7), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 });
      }
      if (o.roar) { v.stick([[9.4, 13.4 + by], [4.4, 9.4 + by], [3.2, 5 + by]], 4.2, ROC, { lw: 1.5, curve: true, hi: ROCH }); v.part(Pcirc(3.2, 4.4 + by, 2.5), ROC, { lw: 1.3, sh: ROCS, hi: ROCH, so: 0.4 }); }
      // brasas que gotean por las juntas
      if (!np) {
        [[9.6, 24.6], [22.8, 25], [16, 29.4], [12.4, 33.6], [20.4, 33.4]].forEach(function (p, j) {
          var yy = p[1] + by + ((em * 1.6 + j * 1.1) % 3.2); v.dot(p[0] + (j % 2 ? 0.6 : -0.4), yy, 0.55, j % 2 ? LV : MG); });
      }
      if (o.heat) { [[9, 24], [23, 24.6], [16, 27.6], [10, 15], [22.4, 16]].forEach(function (p) { glow(X, p[0], p[1] + by, 4.6, '255,106,26', 0.6); }); }
      X.restore();
      if (o.trail) { X.strokeStyle = 'rgba(255,150,40,0.85)'; X.lineWidth = 0.9; [[0, 16], [1, 22], [2, 28], [0.5, 33]].forEach(function (t, j) { X.beginPath(); X.moveTo(t[0] + 1, t[1]); X.lineTo(t[0] + 5.6, t[1] + (j % 2 ? 0.6 : -0.6)); X.stroke(); }); v.dot(2, 19, 0.8, LV); v.dot(1, 26, 0.7, MG); v.dot(5, 31, 0.7, LV); v.dot(8, 35, 0.6, MG); }
      if (o.steam) { X.fillStyle = 'rgba(232,226,240,0.85)'; [[24.6, 5.4, 1.5], [26.8, 3, 1.1], [7.6, 6, 1.3], [5.8, 3.4, 1]].forEach(function (b) { X.beginPath(); X.arc(b[0], b[1], b[2], 0, TAU); X.fill(); }); }
      if (o.flash) { X.strokeStyle = '#ffffff'; X.lineWidth = 1; X.beginPath(); X.moveTo(26, 3); X.lineTo(29, 6); X.moveTo(30, 3); X.lineTo(27, 6); X.moveTo(3, 4); X.lineTo(6, 6.4); X.stroke(); }
      if (o.waves) { X.strokeStyle = 'rgba(255,190,110,0.85)'; X.lineWidth = 0.8; [0, 1].forEach(function (a) { X.beginPath(); X.arc(18.4, 8, 9 + a * 2.4, -0.55, 0.55); X.stroke(); }); }
    };
  }
  (function () {
    var F = [], k, q;
    function P(o) { return cen(o); }
    F.push(P({}), P({ by: 0.8, em: 1 }));
    for (k = 0; k < 4; k++) { q = wk(k); F.push(P({ by: q.by * 0.8, c: q.c, em: k + 1 })); }
    F.push(P({ heat: true, by: 2, lean: -0.1, hot: 1, wide: true, arm: 'back', cw: 0.5, hy: 1 }));                       // 6 charge-wind
    F.push(P({ lean: 0.24, by: 1, arm: 'back', backArm: 'back', trail: true, c: 1, hot: 1, hy: 1.4, heat: true }));        // 7 charge
    F.push(P({ arm: 'fanWind', by: -0.4, lean: -0.05 }));                                                                  // 8 fan-wind
    F.push(P({ arm: 'fanCast', by: 0.4, lean: 0.06, c: 1 }));                                                              // 9 fan-cast
    F.push(P({ cw: 1, heat: true, by: -0.4, hy: -0.6, arm: 'down', em: 2 }));                                              // 10 core-wind
    F.push(P({ open: true, by: -0.6, hy: -0.6, arm: 'up', backArm: 'back', wide: true }));                                 // 11 core-open
    F.push(P({ lean: 0.22, by: 2.2, hy: 2.4, arm: 'down', steam: true, em: 1 }));                                          // 12 rec
    F.push(P({ hurt: true, lean: -0.12, by: 0.6, flash: true, arm: 'back' }));                                             // 13 hurt
    F.push(P({ roar: true, arm: 'up', by: -0.8, hy: -1.2, lean: -0.05, waves: true, cw: 1 }));                             // 14 roar
    var dieA = withDie(F, P({}), 32, 40, { lw: 1.5 });                                                                      // 15-19
    function N(o) { o.np = true; return P(o); }
    F.push(N({}), N({ by: 0.8 }));                                                                                         // 20-21
    for (k = 0; k < 4; k++) { q = wk(k); F.push(N({ by: q.by * 0.8, c: q.c })); }                                          // 22-25
    F.push(N({ by: 2, lean: -0.1, wide: true, arm: 'back', hy: 1 }));                                                      // 26 charge-wind_np
    F.push(N({ arm: 'fanWind', by: -0.4, lean: -0.05 }));                                                                  // 27
    F.push(N({ arm: 'fanCast', by: 0.4, lean: 0.06, c: 1 }));                                                              // 28
    addV('enemy_mini_centinela', 32, 40, F, { lw: 1.5 }, {
      idle: { f: [0, 1], fps: 3 }, walk: { f: WALKSEQ, fps: 6 }, charge: { f: [6, 7], fps: 8 }, fan: { f: [8, 9], fps: 8 }, core: { f: [10, 11], fps: 6 },
      rec: { f: [12], fps: 1 }, hurt: { f: [13], fps: 1 }, roar: { f: [14], fps: 1 }, die: dieA,
      idle_np: { f: [20, 21], fps: 3 }, walk_np: { f: [20, 22, 21, 23, 24, 25], fps: 6 }, charge_np: { f: [26], fps: 1 }, fan_np: { f: [27, 28], fps: 8 }
    });
  })();

  // ======================================================================================================
  //  AUXILIARES DE LA CRIPTA
  // ======================================================================================================
  // bola de grillete 24x24 -> 48x48: 0 volando, 1 clavada
  addV('fx_shackle_ball', 24, 24, [0, 1].map(function (k) {
    return function (v) {
      var X = v.ctx, i, rot = k ? 0.3 : 0.9;
      if (!k) { X.strokeStyle = 'rgba(255,255,255,0.8)'; X.lineWidth = 0.9; [[1, 6, 8], [0, 12, 9], [2, 18, 8]].forEach(function (l) { X.beginPath(); X.moveTo(l[0], l[1]); X.lineTo(l[0] + l[2] * 0.7, l[1]); X.stroke(); }); }
      v.stick([[1.4, 12], [5, 12]], 2, IRH, { lw: 0.9 }); v.part(Pcirc(2.6, 12, 2.2), IRH, { lw: 1, sh: IR, so: 0.2 }); v.dot(2.6, 12, 0.8, OLC);
      for (i = 0; i < 8; i++) { var a = rot + i / 8 * TAU; v.part(Ppoly([[13 + cos(a - 0.22) * 6.4, 12 + sin(a - 0.22) * 6.4], [13 + cos(a) * 10.6, 12 + sin(a) * 10.6], [13 + cos(a + 0.22) * 6.4, 12 + sin(a + 0.22) * 6.4]]), IRD, { lw: 1, hi: IRH, so: 0.3 }); }
      v.part(Pcirc(13, 12, 7.4), k ? '#4a5062' : IR, { lw: 1.6, sh: IRD, hi: IRH, so: 1 });
      v.part(Pcirc(13, 12, 3), IRD, { lw: 0.8, so: 0.3 }); v.dot(13, 12, 1.2, k ? '#c8501c' : OR);
      if (k) { polyline(X, [[8, 7], [10.4, 10], [9.4, 13]], OLC, 0.8); star(v, 20.6, 19.2, 2.4, '#fff6d0', '#c8501c'); v.dot(4, 21, 0.7, GD); v.dot(22.4, 5.6, 0.7, OR); }
    };
  }), { lw: 1 }, { fly: { f: [0], fps: 1 }, pin: { f: [1], fps: 1 }, loop: { f: [0, 1], fps: 6 } });
  // llave dorada 12x12 -> 24x24 (giro)
  addV('proj_mini_key', 12, 12, [0, 1].map(function (k) {
    return function (v) {
      var X = v.ctx; X.translate(6, 6); X.rotate(k ? 0.8 : 0); X.translate(-6, -6);
      glow(X, 6, 6, 6, '255,210,58', 0.3);
      v.stick([[4, 6], [10.2, 6]], 1.5, GD, { lw: 0.9 });
      v.part(Pcirc(3, 6, 2.3), GD, { lw: 0.9, sh: GDS, so: 0.3 }); v.dot(3, 6, 0.8, OLC);
      v.part(Prr(7.6, 6.4, 1.3, 2.6, 0.2), GD, { lw: 0.6, so: 0 }); v.part(Prr(9.4, 6.4, 1.2, 1.8, 0.2), GD, { lw: 0.6, so: 0 });
    };
  }), { lw: 0.8 }, { loop: { f: [0, 1], fps: 10 } });
  // globulo de magma 16x16 -> 32x32: 0 vuelo (cola a la izquierda), 1 impacto
  addV('proj_magma_glob', 16, 16, [0, 1].map(function (k) {
    return function (v) {
      var X = v.ctx;
      if (!k) {
        glow(X, 9, 8, 8, '255,106,26', 0.4);
        v.part(Ppoly([[1, 8], [5.4, 4.8], [6, 11.2]]), '#c8501c', { lw: 1, so: 0 }); v.dot(2.4, 5.4, 0.7, MG); v.dot(1.6, 11.4, 0.6, LV);
        v.part(Pblob(9.6, 8, 5, 4.6, 801, 0.07), MG, { lw: 1.4, sh: '#c8501c', hi: LV, so: 0.8 });
        v.dot(10.4, 7.2, 2, LV); v.dot(10.8, 6.8, 0.9, '#fffbe0');
      } else {
        glow(X, 8, 8, 8, '255,106,26', 0.4);
        v.part(Pblob(8, 10.6, 6.6, 2.8, 802, 0.1), MG, { lw: 1.3, sh: '#c8501c', hi: LV, so: 0.5 });
        v.part(Pblob(8, 10.4, 3, 1.2, 803), LV, { lw: 0, so: 0 });
        [[2.6, 4.4], [13.4, 4], [8, 1.8], [4.4, 7], [11.8, 7]].forEach(function (p, j) { v.part(Pcirc(p[0], p[1], j % 2 ? 1 : 1.3), j % 2 ? LV : MG, { lw: 0.8, so: 0 }); });
      }
    };
  }), { lw: 1 }, { loop: { f: [0, 1], fps: 8 }, fly: { f: [0], fps: 1 }, splash: { f: [1], fps: 1 } });

  // ======================================================================================================
  //  TUNDRA: copia ampliada de los guardianes de P3 (mismo esqueleto; anade las poses nuevas al final)
  // ======================================================================================================
  var FUR = '#e8eef5', FUR_S = '#8fa4bf', FUR_H = '#ffffff', ICE = '#9fd8ff', ICE_M = '#5aa8e8', ICE_D = '#2a4f8a', ICE_DD = '#1b2f66', IVO = '#f1ead2', CY = '#5ff0ff';
  function spikes(cx, cy, rx, ry, n, amp, seed) {
    var pts = [], i, r = H.rrand(seed || 1);
    for (i = 0; i < n * 2; i++) { var a = i / (n * 2) * TAU, k = (i % 2 ? 1 : 1 + amp) * (1 + (r() - 0.5) * 0.12); pts.push([cx + cos(a) * rx * k, cy + sin(a) * ry * k]); }
    return Ppoly(pts);
  }
  function plate(v, px, py, o) {
    var X = v.ctx; X.save(); X.translate(px, py); X.rotate(o.prot || 0);
    v.part(Ppoly([[-3.6, -11], [3, -9], [4.2, 9], [0.4, 12.4], [-4.2, 8.6], [-4.8, -6]]), ICE, { lw: 1.6, sh: ICE_M, hi: '#ffffff', so: 1 });
    v.part(Ppoly([[-2.4, -8.4], [1.6, -7], [2.2, 6], [-1, 8.4], [-2.8, 5.4]]), '#cfeeff', { lw: 0, sh: '#8ccaf2', so: 0.5 });
    v.line(-2, -6, -0.8, 5.4, 0.5, '#ffffff'); X.restore();
  }
  function yeti2(o) {
    return function (v) {
      var X = v.ctx, by = o.by || 0, c = o.c || 0, lean = o.lean || 0, np = o.np, au = o.au || 0, sl = o.slam || 0, wet = np;
      var FY = wet ? '#c3d1e4' : '#dfe8f2', FS = wet ? '#7f95b4' : FUR_S, w = o.wide || 0, fw = o.fwd || 0;
      v.part(Prr(7.4 + c - w + fw, 26 + by * 0.4, 6.4, 5.2, 1.6), FS, { lw: 1.4, sh: '#5a6a88', so: 0.4 });
      v.part(Prr(18.6 - c + w + fw, 26 + by * 0.4, 6.4, 5.2, 1.6), wet ? '#a8bad2' : FUR, { lw: 1.4, sh: FS, so: 0.4 });
      X.save(); X.translate(16, 30); X.rotate(lean); X.translate(-16, -30);
      v.stick([[6.4, 14 + by], [2.8, 19 - au * 6 + by], [3.6, 24 - au * 14 + sl * 3 + by]], 5.6, FS, { lw: 1.4, curve: true });
      v.part(Pcirc(3.6, 24.4 - au * 14 + sl * 3 + by, 3), ICE_M, { lw: 1.2, sh: ICE_D, hi: ICE, so: 0.4 });
      v.part(spikes(16, 18.6 + by, 12.4, 9.8, 10, wet ? 0.03 : 0.1, 401), FY, { lw: 1.8, sh: FS, hi: wet ? '#e8f0fa' : FUR_H, so: 1.3 });
      X.strokeStyle = CY; X.lineWidth = 0.9; X.beginPath(); X.moveTo(13.4, 17 + by); X.lineTo(15.2, 20 + by); X.lineTo(14, 23 + by); X.moveTo(15.2, 20 + by); X.lineTo(18, 21.6 + by); X.stroke();
      if (wet) { // pelo mojado: mechones colgando y gotas
        X.strokeStyle = '#8fa4bf'; X.lineWidth = 0.7; X.beginPath(); [[8, 22], [12, 25], [20, 26], [24, 23], [16, 27]].forEach(function (p) { X.moveTo(p[0], p[1] + by - 3); X.lineTo(p[0] - 0.4, p[1] + by); }); X.stroke();
        v.dot(8.6, 25.4 + by + (o.drip || 0), 0.7, ICE); v.dot(23.8, 24.4 + by + (o.drip || 0) * 0.6, 0.7, ICE);
      }
      // hombreras
      if (!np) {
        v.part(Ppoly([[3.4, 13.6 + by], [6, 8 + by], [10, 10.4 + by], [8.4, 15.4 + by]]), ICE, { lw: 1.4, sh: ICE_M, hi: '#ffffff', so: 0.6 });
        v.part(Ppoly([[21.4, 11 + by], [26, 7.4 + by], [28.4, 12.4 + by], [24, 15.4 + by]]), ICE, { lw: 1.4, sh: ICE_M, hi: '#ffffff', so: 0.6 });
      } else { // derretidas: charcos de hielo pequenos
        v.part(Pblob(7, 13 + by, 3, 1.8, 421), ICE_M, { lw: 1.1, sh: ICE_D, so: 0.3 }); v.part(Pblob(25, 12 + by, 3, 1.8, 422), ICE_M, { lw: 1.1, sh: ICE_D, so: 0.3 });
      }
      var hy = 9.6 + by + (o.hy || 0);
      if (!np) v.part(Ppoly([[11.4, hy - 2], [12.4, hy - 7.6], [14.2, hy - 3.6], [16, hy - 8.8], [17.8, hy - 3.6], [19.8, hy - 7.2], [20.6, hy - 1.6]]), ICE, { lw: 1.2, sh: ICE_M, hi: '#ffffff', so: 0.4 });
      v.part(spikes(16.4, hy + 0.4, 6.8, 5.6, 7, wet ? 0.05 : 0.12, 402), FY, { lw: 1.5, sh: FS, hi: wet ? '#e8f0fa' : FUR_H, so: 0.9 });
      if (np) { X.strokeStyle = '#8fa4bf'; X.lineWidth = 0.8; X.beginPath(); [[12.6, -3], [15, -4], [18, -4], [20.4, -2.6]].forEach(function (p) { X.moveTo(p[0], hy + p[1] + 1.4); X.lineTo(p[0] + (p[0] < 16 ? -0.9 : 0.9), hy + p[1] + 4.2); }); X.stroke(); v.dot(12, hy + 4.8 + (o.drip || 0), 0.6, ICE); }
      v.part(Pblob(17.8, hy + 1.2, 4.6, 3.8, 403), '#5a78b0', { lw: 1.1, sh: '#3a5488', hi: '#8aa8d8', so: 0.5 });
      v.part(Ppoly([[13.6, hy - 1.6], [21.6, hy - 1.2], [21.6, hy + 0.2], [14, hy - 0.2]]), ICE_DD, { lw: 0.7, so: 0 });
      eye(v, 16.4, hy + 0.6, 1, o.hurt ? '#ffffff' : CY); eye(v, 19.8, hy + 0.8, 0.9, o.hurt ? '#ffffff' : CY);
      var mo = o.mouth || 0;
      v.part(Pblob(18.2, hy + 3.4, 2.7, 0.9 + mo, 404), OLC, { lw: 0.4 });
      v.part(Ppoly([[16.2, hy + 2.8], [15.8, hy + 5.8 + mo], [17.6, hy + 3]]), IVO, { lw: 0.6, so: 0 });
      v.part(Ppoly([[19.4, hy + 3], [20.8, hy + 5.6 + mo], [21, hy + 2.6]]), IVO, { lw: 0.6, so: 0 });
      var sx = 25.4 + (o.sx || 0), sy = 17.6 + by + (o.sy || 0) - au * 9;
      v.stick([[22, 13.6 + by], [25, 16 + by], [sx - 1, sy + 2]], 5.8, wet ? '#a8bad2' : FUR, { lw: 1.4, curve: true, hi: FUR_H });
      if (!o.fist && !np) plate(v, sx + 1.4, sy, { prot: 0 });
      else v.part(Pcirc(sx + 1, sy + 1, 3.6 + (o.fistR || 0)), np ? '#7f95b4' : ICE, { lw: 1.4, sh: np ? '#5a6a88' : ICE_M, hi: np ? '#a8bad2' : '#ffffff', so: 0.6 });
      X.restore();
      if (sl) { var sd = [[2, 30], [5, 28.6], [27, 30], [30, 28.4], [14, 31], [22, 31.2]]; sd.forEach(function (p) { v.dot(p[0], p[1], 0.9, '#ffffff'); }); v.line(0.6, 31, 7, 31, 0.8, 'rgba(232,238,245,0.9)'); v.line(25, 31, 31.4, 31, 0.8, 'rgba(232,238,245,0.9)'); }
      if (o.lines) { v.line(0.4, 12, 5, 12, 0.8, 'rgba(232,238,245,0.9)'); v.line(0.2, 18, 4.4, 18, 0.8, 'rgba(232,238,245,0.7)'); v.line(0.8, 24, 5, 24, 0.7, 'rgba(232,238,245,0.6)'); }
      if (o.slide) { // nieve levantada por el derrape: rayas y polvo a la izquierda y delante
        X.strokeStyle = 'rgba(232,242,255,0.9)'; X.lineWidth = 0.9; X.beginPath(); [[0.4, 22, 7], [0, 26, 8], [1, 30, 7]].forEach(function (l) { X.moveTo(l[0], l[1]); X.lineTo(l[0] + l[2], l[1]); }); X.stroke();
        [[28, 31, 1.5], [30.4, 29, 1.1], [26.6, 32, 1.1], [5, 32, 1.4], [8.4, 33, 1]].forEach(function (b) { X.fillStyle = 'rgba(232,242,255,0.92)'; X.beginPath(); X.arc(b[0], b[1], b[2], 0, TAU); X.fill(); });
      }
      if (o.breath) { X.fillStyle = 'rgba(232,242,255,0.85)'; [[27, 5, 1.6], [29.4, 3, 1.2]].forEach(function (b) { X.beginPath(); X.arc(b[0], b[1], b[2], 0, TAU); X.fill(); }); }
      if (o.flash) { X.strokeStyle = '#ffffff'; X.lineWidth = 1; X.beginPath(); X.moveTo(26, 3); X.lineTo(29, 6); X.moveTo(30, 3); X.lineTo(27, 6); X.moveTo(3, 4); X.lineTo(6, 6.4); X.stroke(); }
      if (o.waves) { X.strokeStyle = 'rgba(207,238,255,0.9)'; X.lineWidth = 0.8; [0, 1].forEach(function (a) { X.beginPath(); X.arc(18, hy + 2, 9 + a * 2.6, -0.6, 0.6); X.stroke(); }); }
    };
  }
  (function () {
    var E = H.reg['enemy_mini_yeti'], k, q, n0;
    if (!E || E.frames.length !== 16) { if (window.console) console.error('assets_mini2: enemy_mini_yeti inesperado (' + (E && E.frames.length) + ' frames)'); return; }
    var D = [];
    function Y(o) { D.push(yeti2(o)); }
    function N(o) { o.np = true; Y(o); }
    N({ drip: 0 }); N({ by: 0.8, mouth: 0.4, drip: 1.2 });                                                         // 16-17 idle_np
    for (k = 0; k < 4; k++) { q = wk(k); N({ by: q.by * 0.8, c: q.c * 1.4, drip: k * 0.4 }); }                      // 18-21 walk_np
    N({ lean: -0.1, sx: -3, sy: -5, hy: -0.6, mouth: 0.8, by: -0.4, fist: true });                                 // 22 bash-wind_np
    N({ lean: 0.15, sx: 2, sy: 1.6, hy: 1.4, mouth: 1, lines: true, by: 0.4 });                                    // 23 bash_np
    N({ au: 0.95, hy: -1, mouth: 1, by: -1.4, fist: true, fistR: 0.6 });                                           // 24 stomp-wind_np
    N({ slam: 1, lean: 0.08, hy: 1.6, mouth: 0.8, by: 1.2, fist: true, fistR: 0.8, au: 0, sy: 6 });                // 25 stomp_np
    N({ lean: 0.2, hy: 2.8, by: 1.4, mouth: 0.4, breath: true, sx: -2, sy: 3 });                                   // 26 rec_np
    Y({ by: 2.6, wide: 2.4, lean: -0.08, hy: 1.2, mouth: 0.8, sx: -3.2, sy: 1.4, fist: true });                     // 27 charge-wind
    Y({ by: 1.4, lean: 0.22, fwd: 3.4, hy: 2, mouth: 1, slide: true, sx: -1, sy: 1, fist: true });                   // 28 charge-slide
    Y({ hurt: true, lean: -0.16, by: 0.6, hy: 0.4, mouth: 0.8, sx: -4.6, sy: 2, flash: true });                      // 29 hurt
    Y({ au: 0.8, hy: -1.6, mouth: 1.4, by: -1.2, fist: true, fistR: 0.7, lean: -0.06, waves: true, breath: true }); // 30 roar
    var cv = D.map(function (fn) { return H.vframe(32, 32, fn, { lw: 1.7 }); });
    n0 = E.frames.length; cv.forEach(function (c) { E.frames.push(c); });
    var A0 = E.anims;
    A0.charge = { f: [27, 28], fps: 8 }; A0.idle_np = { f: [16, 17], fps: 3 }; A0.walk_np = { f: [16, 18, 17, 19, 20, 21], fps: 6 };
    A0.bash_np = { f: [22, 23], fps: 8 }; A0.stomp_np = { f: [24, 25], fps: 8 }; A0.rec_np = { f: [26], fps: 1 }; A0.hurt = { f: [29], fps: 1 }; A0.roar = { f: [30], fps: 1 };
  })();

  function vent2(o) {
    return function (v) {
      var X = v.ctx, by = (o.by || 0) + 1.2, sw = o.sw || 0, sc = o.sc || 1, mo = o.mouth || 0, fl = o.flap || 0, np = o.np, i;
      X.save(); X.translate(16, 15 + by); X.scale(sc, sc); X.translate(-16, -15 - by);
      [[10.4, 4.6], [16, 7], [21.4, 4.8]].forEach(function (s, j) {
        var L = s[1] + (j === 1 ? 2 : 0) + (o.hang || 0) - (np && j === 2 ? 3 : 0);
        v.part(Ppoly([[s[0] - 2, 21 + by], [s[0] + sw * (j - 1) * 0.4, 21 + L + by], [s[0] + 2, 21 + by]]), np ? '#a8c4dc' : '#cfeeff', { lw: 1.2, sh: ICE, hi: '#ffffff', so: 0.4 });
      });
      v.part(H.Pclosed([[4.4, 17 + by], [8, 22.4 + by], [16, 24 + by + sw * 0.3], [24, 22.4 + by], [27.6, 17 + by], [16, 20 + by]]), np ? '#c9d6e6' : '#dfe8f6', { lw: 1.4, sh: '#9ab0d0', hi: '#ffffff', so: 0.8 });
      X.strokeStyle = 'rgba(120,150,200,0.8)'; X.lineWidth = 0.7; X.beginPath(); X.moveTo(7, 19.4 + by); X.quadraticCurveTo(10, 21.4 + by, 13, 20.4 + by); X.moveTo(18, 21 + by); X.quadraticCurveTo(22, 22 + by, 25, 19.6 + by); X.stroke();
      // brazos: o.arms = 'out' (abiertos), 'fwd' (hacia delante, soplando), 'up'
      var ar = o.arms;
      if (ar === 'out') {
        v.stick([[6.6, 14 + by], [2, 13.4 + by], [-0.6, 10.4 + by]], 2.8, ICE_M, { lw: 1.2, curve: true, hi: ICE });
        v.stick([[25.4, 14 + by], [30, 13.4 + by], [32.4, 10.4 + by]], 2.8, ICE_M, { lw: 1.2, curve: true, hi: ICE });
      } else if (ar === 'fwd') {
        v.stick([[6.6, 14 + by], [4, 12 + by], [8, 9.6 + by]], 2.8, ICE_M, { lw: 1.2, curve: true, hi: ICE });
        v.stick([[25.4, 14 + by], [29.6, 14.4 + by], [33.4, 14 + by]], 3, ICE_M, { lw: 1.2, curve: true, hi: ICE });
      } else if (ar === 'up') {
        v.stick([[6.6, 14 + by], [2.4, 9 + by], [2.6, 3.6 + by]], 2.8, ICE_M, { lw: 1.2, curve: true, hi: ICE });
        v.stick([[25.4, 14 + by], [29.6, 9 + by], [29.4, 3.6 + by]], 2.8, ICE_M, { lw: 1.2, curve: true, hi: ICE });
      } else {
        v.stick([[6.6, 14 + by], [3 - fl, 16 + by + sw * 0.4], [2 - fl, 12 + by - fl]], 2.6, ICE_M, { lw: 1.2, curve: true, hi: ICE });
        v.stick([[25.4, 14 + by], [29 + fl, 16 + by - sw * 0.4], [30 + fl, 12 + by - fl]], 2.6, ICE_M, { lw: 1.2, curve: true, hi: ICE });
      }
      v.part(Pblob(16, 13.4 + by, 9.4, 8.8, 411, 0.04, 10), np ? '#d3deec' : '#eef4fc', { lw: 1.7, sh: '#a8bcdc', hi: '#ffffff', so: 1.2 });
      [[9.4, 4.4, 6.2], [12.8, 3, 8.4], [16, 2.4, 9.6], [19.2, 3, 8.4], [22.6, 4.4, 6.2]].forEach(function (s, j) {
        var hh = s[2] * (np && (j === 1 || j === 4) ? 0.45 : 1) + (o.crown && j === 2 ? 2 : 0);
        v.part(Ppoly([[s[0] - 1.5, 7 + by], [s[0] + (np && j === 4 ? 1 : 0), 7 - hh + by], [s[0] + 1.5, 7 + by]]), j % 2 ? '#cfeeff' : ICE, { lw: 1, sh: ICE_M, hi: '#ffffff', so: 0.3 });
      });
      v.part(Pblob(16, 13.4 + by, 6.6, 5.4, 412), '#2a4f8a', { lw: 0.9 });
      v.part(Ppoly([[10.4, 9.6 + by], [14.6, 11.6 + by], [14.6, 10.4 + by], [10.6, 8.6 + by]]), ICE_DD, { lw: 0.5, so: 0 });
      v.part(Ppoly([[21.6, 9.6 + by], [17.4, 11.6 + by], [17.4, 10.4 + by], [21.4, 8.6 + by]]), ICE_DD, { lw: 0.5, so: 0 });
      var ec = o.hurt ? '#ffffff' : (np ? '#6a9ab8' : CY);
      if (o.hurt) { X.strokeStyle = '#ffffff'; X.lineWidth = 1.1; X.beginPath(); X.moveTo(11.2, 11.4 + by); X.lineTo(14.2, 13 + by); X.moveTo(11.2, 13.6 + by); X.lineTo(14.2, 12.2 + by); X.moveTo(20.8, 11.4 + by); X.lineTo(17.8, 13 + by); X.moveTo(20.8, 13.6 + by); X.lineTo(17.8, 12.2 + by); X.stroke(); }
      else { eye(v, 12.8, 12.4 + by, 1.3, ec); eye(v, 19.2, 12.4 + by, 1.3, ec); }
      v.part(Pblob(16, 16.8 + by, 2.4 + mo * 0.8, 1 + mo * 1.8, 413), '#0f1a3a', { lw: 0.5 });
      if (mo > 0.5) v.part(Ppoly([[15, 16 + by], [16, 20.4 + by], [17, 16 + by]]), '#ffffff', { lw: 0.7, so: 0 });
      if (np) { // corazon roto: pecho agrietado, sin brillo
        X.strokeStyle = OLC; X.lineWidth = 0.9; X.beginPath(); X.moveTo(16, 18.6 + by); X.lineTo(14.4, 21 + by); X.lineTo(16, 22.2 + by); X.lineTo(15, 24 + by); X.moveTo(14.4, 21 + by); X.lineTo(11.6, 21.8 + by); X.moveTo(16, 22.2 + by); X.lineTo(19.4, 21.4 + by); X.stroke();
        X.strokeStyle = '#8fa4bf'; X.lineWidth = 0.4; X.beginPath(); X.moveTo(15.6, 18.8 + by); X.lineTo(14.1, 21.2 + by); X.stroke();
        v.dot(15, 25.4 + by + (o.drip || 0), 0.6, ICE);
      }
      X.restore();
      if (o.blow) { X.strokeStyle = 'rgba(255,255,255,0.95)'; X.lineWidth = 1; [[4, 6], [7, 28], [27, 6], [29, 26], [2, 19]].forEach(function (s, j) { X.beginPath(); X.moveTo(s[0], s[1]); X.quadraticCurveTo(s[0] + 3, s[1] - 2, s[0] + 6, s[1] + 0.4 * (j % 2 ? 1 : -1)); X.stroke(); }); }
      if (o.gust) { // rafaga horizontal hacia la derecha
        [[19, 12.4, 32], [20, 15.2, 32.6], [20.6, 17.8, 31], [19, 20.4, 32.2]].forEach(function (g, j) {
          X.strokeStyle = OLC; X.lineWidth = 2.6; X.beginPath(); X.moveTo(g[0], g[1]); X.lineTo(g[2], g[1] + (j % 2 ? 0.6 : -0.4)); X.stroke();
          X.strokeStyle = j % 2 ? '#cfeeff' : '#ffffff'; X.lineWidth = 1.5; X.beginPath(); X.moveTo(g[0], g[1]); X.lineTo(g[2], g[1] + (j % 2 ? 0.6 : -0.4)); X.stroke();
        });
      }
      if (o.windup) { X.strokeStyle = 'rgba(255,255,255,0.85)'; X.lineWidth = 0.9; [[9, 3, 3], [27, 4, -3], [5, 25, 3], [30, 24, -3]].forEach(function (s) { X.beginPath(); X.arc(s[0], s[1], 2.6, 0.5, 4.2 + (s[2] > 0 ? 0 : 0.4)); X.stroke(); }); }
      if (o.flash) { X.strokeStyle = '#ffffff'; X.lineWidth = 1; X.beginPath(); X.moveTo(26, 2); X.lineTo(29, 5); X.moveTo(30, 2); X.lineTo(27, 5); X.moveTo(3, 3); X.lineTo(6, 5.4); X.stroke(); }
    };
  }
  (function () {
    var E = H.reg['enemy_mini_ventisquero'], k, q;
    if (!E || E.frames.length !== 15) { if (window.console) console.error('assets_mini2: enemy_mini_ventisquero inesperado (' + (E && E.frames.length) + ' frames)'); return; }
    var D = [];
    function V(o) { D.push(vent2(o)); }
    function N(o) { o.np = true; V(o); }
    V({ arms: 'out', mouth: 0.5, sc: 1.02, by: 0.2, windup: true, hang: 0.6 });                          // 15 wave-wind
    V({ arms: 'fwd', mouth: 1, sc: 1.02, by: 0.2, gust: true, sw: 1.2 });                                // 16 wave-cast
    V({ hurt: true, sw: -1.6, by: 0.4, flash: true, mouth: 0.4, flap: 1 });                                         // 17 hurt
    V({ arms: 'up', sc: 1.04, mouth: 1.2, by: 0.4, hang: 1.2, blow: true });                             // 18 roar
    N({ drip: 0 }); N({ by: -1, sw: 1, drip: 1.4 });                                                                // 19-20 idle_np
    for (k = 0; k < 4; k++) N({ by: [-1.4, -0.4, 0.8, -0.2][k], sw: [1.2, 0.2, -1.2, -0.2][k], flap: k % 2, drip: k * 0.5 }); // 21-24 float_np
    N({ blow: true, mouth: 0.8, sw: 1.4, hang: 1.4 });                                                              // 25 blow_np
    N({ arms: 'out', mouth: 0.5, sc: 1.05, by: -0.6, windup: true });                                               // 26 wave-wind_np
    D.forEach(function (fn) { E.frames.push(H.vframe(32, 32, fn, { lw: 1.6 })); });
    var A0 = E.anims;
    A0.wave = { f: [15, 16], fps: 8 }; A0.hurt = { f: [17], fps: 1 }; A0.roar = { f: [18], fps: 1 }; A0.idle_np = { f: [19, 20], fps: 3 };
    A0.float_np = { f: [19, 21, 20, 22, 23, 24], fps: 7 }; A0.blow_np = { f: [25], fps: 1 }; A0.wave_np = { f: [26, 16], fps: 8 };
  })();

  // loseta de la banda de la ola 32x32 -> 64x64 (SIN costuras en x e y; el bucle desplaza las rayas a lo largo de +x)
  addV('fx_blizz_wave', 32, 32, [0, 1, 2, 3].map(function (k) {
    return function (v) {
      var X = v.ctx, streaks = [[3, 14, 0.6], [8, 11, 0.9], [14, 6, 0.5], [19, 15, 1], [24, 8, 0.7], [28, 12, 0.5], [5, 25, 0.8], [18, 29, 0.6]], i, dx;
      X.fillStyle = 'rgba(207,238,255,0.34)'; X.fillRect(0, 0, 32, 32);
      X.fillStyle = 'rgba(255,255,255,0.14)'; X.fillRect(0, 9, 32, 5); X.fillRect(0, 21, 32, 4);
      streaks.forEach(function (s, j) {
        var x0 = (s[1] * 0 + j * 7 + k * 8) % 32, len = 8 + (j % 3) * 4, y = s[0] + (j % 2 ? 0.5 : 0);
        for (dx = -32; dx <= 32; dx += 32) {
          X.strokeStyle = 'rgba(255,255,255,' + (0.55 + s[2] * 0.3) + ')'; X.lineWidth = 0.9 + (j % 2) * 0.5; X.beginPath(); X.moveTo(x0 + dx, y); X.lineTo(x0 + dx + len, y + (j % 2 ? 0.8 : -0.8)); X.stroke();
          X.strokeStyle = 'rgba(90,168,232,0.35)'; X.lineWidth = 0.6; X.beginPath(); X.moveTo(x0 + dx + 2, y + 1.6); X.lineTo(x0 + dx + len - 2, y + 1.6); X.stroke();
        }
      });
      for (i = 0; i < 7; i++) { var px = (i * 11 + k * 8 + (i % 2) * 4) % 32, py = (i * 13 + 3) % 32; X.fillStyle = 'rgba(255,255,255,0.9)'; X.beginPath(); X.arc(px, py, 0.7, 0, TAU); X.fill(); }
    };
  }), { lw: 0 }, { loop: { f: [0, 1, 2, 3], fps: 10 } });

  // ------------------------------------------------------------------------------------------ indice
  A.MINI2 = {
    cripta: ['enemy_mini_alcaide', 'enemy_mini_centinela', 'fx_shackle_ball', 'proj_mini_key', 'proj_magma_glob'],
    tundra: ['enemy_mini_yeti', 'enemy_mini_ventisquero', 'fx_blizz_wave']
  };
})();
