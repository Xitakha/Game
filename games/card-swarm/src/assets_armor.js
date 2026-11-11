/*!
 * assets_armor.js - Arte de Carapa la Armera y del sistema de armaduras (Swarm Hand v8, MVP): NPC Carapa, retrato, taller-toldo,
 * maniqui, perchero, iconos de las 12 piezas (3 sets x 4 slots) con marco de rareza/refuerzo, slots vacios e icono de defensa.
 * Se carga DESPUES de assets_village.js (usa Assets._h). Contrato: ASSETS_API.md, seccion "Armaduras v8 (Carapa)".
 * Misma gramatica que assets_village.js: contorno #1b1124, color plano + 1 sombra + 1 brillo; coordenadas base, rasterizado x2.
 * Todo es seguro: si falta algo (Assets, _h, assets_village) las funciones publicas devuelven un dibujo simple de reserva, nunca lanzan.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  var TAU = 6.2832, PI = Math.PI, OLC = '#1b1124';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ============================================================ normalizacion de ids (aceptan alias en es/en)
  var SETS = ['aldeano', 'pastor', 'karceron'];
  var SET_ALIAS = { aldeano: 'aldeano', village: 'aldeano', t0: 'aldeano', pastor: 'pastor', esquila: 'pastor', esquila_de_hierro: 'pastor', karceron: 'karceron', carcelero: 'karceron', carcelero_de_brasa: 'karceron' };
  var SLOTS = ['yelmo', 'peto', 'grebas', 'talisman'];
  var SLOT_ALIAS = { yelmo: 'yelmo', helmet: 'yelmo', head: 'yelmo', peto: 'peto', chest: 'peto', grebas: 'grebas', legs: 'grebas', greaves: 'grebas', talisman: 'talisman', 'talismán': 'talisman', charm: 'talisman', amulet: 'talisman' };
  function normSet(s) { s = String(s == null ? '' : s).toLowerCase().replace(/[ -]/g, '_'); return SET_ALIAS[s] || 'aldeano'; }
  function normSlot(s) { s = String(s == null ? '' : s).toLowerCase(); return SLOT_ALIAS[s] || 'yelmo'; }
  var SET_RARITY = { aldeano: 0, pastor: 1, karceron: 2 };
  var RAR_COL = ['#8f8898', '#4ac86a', '#4a9aff', '#b06aff', '#ffb030'];
  var RAR_NAME = ['comun', 'poco comun', 'raro', 'epico', 'legendario'];
  var REF_COL = [null, '#c98a4a', '#dfe6f4', '#ffd23a'];
  var SET_BG = { aldeano: ['#6a5a3a', '#2c2230'], pastor: ['#5a6a82', '#222838'], karceron: ['#a8381a', '#2a1218'] };

  A = A || {};
  // ============================================================ reserva (sin Assets / sin _h): cuadros simples
  function plainCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fbIcon(set, slot, ref) {
    var c = plainCanvas(64, 64), x = c.getContext('2d');
    x.fillStyle = (SET_BG[normSet(set)] || SET_BG.aldeano)[0]; x.fillRect(4, 4, 56, 56);
    x.strokeStyle = OLC; x.lineWidth = 3; x.strokeRect(4, 4, 56, 56);
    x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText({ yelmo: 'Y', peto: 'P', grebas: 'G', talisman: 'T' }[normSlot(slot)], 32, 32);
    if (ref > 0) x.fillText('+' + ref, 46, 50);
    return x.canvas;
  }
  var WARNED = false;
  function warn(e) { if (!WARNED) { WARNED = true; if (window.console) console.warn('assets_armor: dibujo de reserva (' + (e && e.message ? e.message : e) + ')'); } }
  function safe(fn, fb) { return function () { try { return fn.apply(this, arguments); } catch (e) { warn(e); try { return fb ? fb.apply(this, arguments) : undefined; } catch (e2) { return undefined; } } }; }

  var ready = !!(H && A.sprite && A.animFrame);
  if (!ready) {
    if (window.console) console.error('assets_armor: falta Assets/_h (cargar tras assets.js y assets_village.js); solo reserva');
    A.armorIcon = function (s, sl, r) { return fbIcon(s, sl, r | 0); };
    A.armorSlotIcon = function (sl) { var c = plainCanvas(64, 64), x = c.getContext('2d'); x.strokeStyle = '#6a5a84'; x.setLineDash([4, 4]); x.strokeRect(4, 4, 56, 56); return c; };
    A.drawArmorIcon = function (ctx, s, sl, x, y, size, o) { ctx.drawImage(fbIcon(s, sl, (o && o.ref) | 0), x, y, size || 32, size || 32); };
    A.drawArmorSlotIcon = function (ctx, sl, x, y, size) { ctx.drawImage(A.armorSlotIcon(sl), x, y, size || 32, size || 32); };
    A.drawDefIcon = function (ctx, x, y, size) { size = size || 24; ctx.fillStyle = '#3a8aa0'; ctx.fillRect(x + size * 0.15, y + size * 0.1, size * 0.7, size * 0.8); };
    A.drawCarapa = function (ctx, x, y) { ctx.fillStyle = '#3a7a86'; ctx.fillRect(x - 14, y - 30, 28, 30); };
    A.drawWorkshop = function () { }; A.drawMannequin = function () { }; A.drawCarapaPortrait = function () { };
    A.ARMOR_ART = { ready: false, sets: SETS, slots: SLOTS };
    return;
  }

  var addV = H.addV, Pclosed = H.Pclosed, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, vframe = H.vframe, mkCanvas = H.mkCanvas;

  // ============================================================ CARAPA: armadilla armera azul petroleo (celda 40x42 base -> 80x84; pies en (20,40); mira a la DERECHA)
  function eyesC(v, p, ex, ey) {
    var x = v.ctx, r = p.surprise ? 2.1 : 1.55;
    if (p.eyes === 'happy') { x.strokeStyle = OLC; x.lineWidth = 0.95; x.beginPath(); x.arc(ex, ey + r * 0.55, r * 0.95, PI * 1.12, PI * 1.88); x.stroke(); }
    else if (p.eyes === 'closed') { x.strokeStyle = OLC; x.lineWidth = 0.95; x.beginPath(); x.arc(ex, ey - r * 0.4, r * 0.95, 0.25, PI - 0.25); x.stroke(); }
    else v.eye(ex, ey, r, { white: '#fff', sh: false, lw: 0.45, pr: p.surprise ? 0.42 : 0.62, lx: 0.5 });
  }
  function mouthC(v, p, mx, my, w) {
    var x = v.ctx;
    if (p.mouth >= 1 || p.surprise) {
      var big = p.mouth === 2 || p.surprise;
      v.part(Pblob(mx, my + 0.6, w * 0.5, big ? w * 0.5 : w * 0.26, 77), '#4a0e1c', { lw: 0.6 });
      if (big) v.part(Pblob(mx, my + 1.4, w * 0.3, w * 0.16, 78), '#e8707a', { lw: 0 });
    } else {
      x.strokeStyle = OLC; x.lineWidth = 0.85; x.beginPath();
      if (p.eyes === 'happy') x.arc(mx, my - 0.9, w * 0.55, 0.15, PI - 0.15); else { x.moveTo(mx - w / 2, my); x.quadraticCurveTo(mx, my + 0.8, mx + w / 2, my - 0.2); }
      x.stroke();
    }
  }
  function spark(v, cx, cy, r, col, rot) {
    var P = [], i;
    for (i = 0; i < 8; i++) { var a = (rot || 0) + i * PI / 4, rr = i % 2 ? r * 0.38 : r; P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    v.part(Ppoly(P), col, { lw: 0.5, ol: '#a8401c', so: 0.1, sh: null });
  }
  var C = { body: '#3a7a86', bodyS: '#26565f', bodyH: '#6cb0ba', shell: '#2a6470', shellS: '#1c4750', shellH: '#4e9aa6', belly: '#a8ccd0', bellyS: '#7aa4aa', leather: '#a8794a', leatherS: '#6e4a28', leatherH: '#d09a64', brass: '#e8b84a', brassS: '#a8741a', steel: '#7a8498', steelS: '#4a5468', steelH: '#c0cae0' };
  function carapa(p) {
    return function (v) {
      var x = v.ctx, by = -0.7 * p.b, a = p.act == null ? -1 : p.act, i;
      // cola y patas
      v.part(Ppoly([[10, 30], [1.4, 34.6], [3.6, 37.6], [11.4, 36.4]]), C.shell, { lw: 1.3, sh: C.shellS, so: 0.5 });
      v.part(Prr(9, 36, 8, 5, 2.2), '#1f4a54', { lw: 1.4, sh: '#12303a', so: 0.4 }); v.part(Prr(22, 36, 8.6, 5, 2.2), '#1f4a54', { lw: 1.4, sh: '#12303a', so: 0.4 });
      v.dot(11.6, 40, 0.45, '#d8e8e8'); v.dot(14, 40, 0.45, '#d8e8e8'); v.dot(25.4, 40, 0.45, '#d8e8e8'); v.dot(28, 40, 0.45, '#d8e8e8');
      // caparazon con bandas
      var shell = Pblob(15.5, 24.6 + by * 0.4, 12.6, 12.2 + p.b * 0.3, 31, 0.03, 10);
      v.part(shell, C.shell, { lw: 1.7, sh: C.shellS, hi: C.shellH, so: 1.3 });
      x.save(); x.beginPath(); shell(x); x.clip();
      for (i = 0; i < 6; i++) {
        var bx = 5 + i * 3.7; x.strokeStyle = 'rgba(27,17,36,0.55)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(bx + 3, 11); x.quadraticCurveTo(bx - 2.5, 25, bx + 3, 38); x.stroke();
        x.strokeStyle = 'rgba(150,215,222,0.28)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(bx + 4, 11); x.quadraticCurveTo(bx - 1.5, 25, bx + 4, 38); x.stroke();
      }
      x.restore();
      // vientre + delantal de cuero con bolsillo y herramientas
      v.part(Pblob(23.4, 28.4 + by * 0.3, 8, 9.2, 32, 0.03, 9), C.belly, { lw: 1.4, sh: C.bellyS, so: 0.8 });
      v.part(Prr(18.4, 22.6 + by, 12.4, 14.4, 2.6), C.leather, { lw: 1.4, sh: C.leatherS, hi: C.leatherH, so: 0.8 });
      v.part(Prr(20.6, 29.6, 8, 5.4, 1.2), C.leatherS, { lw: 0.8, sh: '#4a2e18', so: 0.3 });
      v.stick([[22.6, 29.8], [22.4, 26.4]], 1, '#9a6a3a', { lw: 0.6 }); v.part(Prr(21.4, 24.8, 2.4, 2.2, 0.5), C.steel, { lw: 0.6, sh: null });   // martillito asomando
      v.line(25.6, 30, 26.6, 25.8, 0.8, C.brass); v.dot(26.6, 25.4, 0.8, '#f4f0e0');                                                              // aguja con hilo
      v.dot(19.8, 24, 0.5, C.brass); v.dot(29.4, 24, 0.5, C.brass);
      // cabeza: mascara con hocico largo y orejita
      v.part(Ppoly([[23.6, 9.4 + by], [22.4, 3.2 + by], [28, 7.6 + by]]), C.shell, { lw: 1.3, sh: C.shellS, so: 0.4 });
      v.part(Pblob(27.2, 14 + by, 7.4, 6.6, 33, 0.03, 9), C.body, { lw: 1.7, sh: C.bodyS, hi: C.bodyH, so: 1 });
      v.part(Ppoly([[29, 11.6 + by], [39.2, 15.4 + by], [29.6, 19.2 + by]]), C.body, { lw: 1.5, sh: C.bodyS, hi: C.bodyH, so: 0.6 });
      v.part(Pblob(32.6, 16.8 + by, 4.6, 2.1, 34), C.belly, { lw: 0, sh: C.bellyS, so: 0.3 });
      v.part(Pcirc(38.4, 15.4 + by, 1.25), '#14262c', { lw: 0.4 }); v.dot(38, 14.9 + by, 0.35, '#fff');
      // placas de la frente (bandas del casco natural)
      x.save(); x.beginPath(); Pblob(27.2, 14 + by, 7.4, 6.6, 33, 0.03, 9)(x); x.clip();
      x.strokeStyle = 'rgba(27,17,36,0.5)'; x.lineWidth = 0.6; for (i = 0; i < 3; i++) { x.beginPath(); x.moveTo(22 + i * 3.4, 6 + by); x.quadraticCurveTo(24 + i * 3.4, 10 + by, 22.6 + i * 3.4, 12 + by); x.stroke(); }
      x.restore();
      // gafas de taller sobre la frente + cinta
      v.part(Ppoly([[21.2, 9.6 + by], [32, 9.4 + by], [32.4, 11.4 + by], [21.4, 11.8 + by]]), C.leather, { lw: 0.9, sh: C.leatherS, so: 0.3 });
      v.part(Pcirc(25.4, 9.2 + by, 2.5), C.brass, { lw: 0.9, sh: C.brassS, so: 0.4 }); v.part(Pcirc(25.4, 9.2 + by, 1.5), '#bfeef4', { lw: 0.4, sh: '#7ab8c4', so: 0.3 }); v.dot(24.8, 8.6 + by, 0.4, '#fff');
      eyesC(v, p, 29.2, 13.6 + by);
      if (p.surprise) { v.line(27.4, 11.4 + by, 31, 10.8 + by, 0.8, C.shellS); }
      mouthC(v, p, 33.6, 19 + by, 2.6);
      // cinta metrica al cuello
      v.part(Ppoly([[19.4, 19.6 + by], [29.6, 20.6 + by], [29.8, 22.6 + by], [19.6, 21.8 + by]]), '#f0c850', { lw: 0.9, sh: '#c8982a', so: 0.3 });
      for (i = 0; i < 6; i++) v.line(21 + i * 1.6, 20.2 + by + i * 0.15, 21 + i * 1.6, 21.4 + by + i * 0.15, 0.35, '#6a4a14');
      // brazo + martillo de armera (cabeza pequena y plana)
      var hx = 29.6, hy = 25, ang = -1.2, len = 8.5;
      if (a === 0) { hx = 30; hy = 19.4; ang = -1.25; len = 9; }
      else if (a === 1 || a === 2) { hx = 28.6; hy = 25.6; ang = 0.78; len = 8.6; }
      if (p.surprise) { hx = 30.4; hy = 18.6; ang = -0.5; len = 8; }
      v.stick([[24.6, 22 + by], [hx, hy]], 4.6, C.body, { lw: 1.3, hi: C.bodyH });
      v.stick([[hx, hy], [hx + Math.cos(ang) * len, hy + Math.sin(ang) * len]], 2.2, '#9a6a3a', { lw: 1, hi: '#c08a52' });
      x.save(); x.translate(hx + Math.cos(ang) * len, hy + Math.sin(ang) * len); x.rotate(ang);
      v.part(Prr(-2, -3.6, 5.6, 7.2, 1), C.steel, { lw: 1.3, sh: C.steelS, hi: C.steelH, so: 0.6 }); x.restore();
      v.part(Pcirc(hx, hy, 2.5), C.body, { lw: 1.3, sh: C.bodyS, hi: C.bodyH, so: 0.4 });
      if (a === 1) { spark(v, 36.4, 35.6, 3, '#ffd23a', 0.2); v.dot(33.6, 37.6, 0.55, '#ff9a2a'); }
      if (a === 2) { spark(v, 36.6, 35.2, 4, '#fff3b0', 0.5); spark(v, 32.6, 32.6, 1.9, '#ffd23a', 0.1); v.dot(37.6, 31, 0.7, '#ff9a2a'); v.dot(38.6, 35, 0.6, '#ffd23a'); }
      if (p.surprise) { v.dot(21, 4.6, 0.6, '#ffd23a'); v.line(33, 5, 35, 3.4, 0.7, '#ffd23a'); v.line(35.2, 7.2, 37.4, 6.6, 0.7, '#ffd23a'); }
    };
  }
  (function () {
    // frames: 0 idle, 1 idle2, 2 parpadeo, 3-5 martillar (alza, golpe, golpe+chispas), 6 sorpresa, 7-8 hablar, 9 feliz
    var F = [{ b: 0 }, { b: 1 }, { b: 0, eyes: 'closed' }, { b: 0, act: 0 }, { b: 0, act: 1 }, { b: 0, act: 2 }, { b: 0, surprise: 1 }, { b: 0, mouth: 1 }, { b: 0, mouth: 2 }, { b: 0, eyes: 'happy' }];
    var idle = [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 0];
    addV('npc_carapa', 40, 42, F.map(function (p) { return carapa(p); }), { lw: 1.7 }, {
      idle: { f: idle, fps: 4 }, work: { f: [3, 3, 4, 5, 4, 3], fps: 6 }, talk: { f: [7, 8, 7, 8, 0, 8], fps: 8 }, happy: { f: [9], fps: 1 }, surprise: { f: [6], fps: 1 }
    });
    // retrato 48x48 -> 96x96 (mismo marco que portrait_<npc>); cabeza ampliada centrada en (28,13)
    var pf = [{ b: 0 }, { b: 0, eyes: 'happy' }, { b: 0, mouth: 2 }].map(function (p) {
      return function (v) {
        var x = v.ctx, g = x.createLinearGradient(0, 0, 0, 48);
        g.addColorStop(0, '#6fb4bc'); g.addColorStop(1, '#1b4550');
        x.save(); x.beginPath(); Prr(1.5, 1.5, 45, 45, 6)(x); x.clip();
        x.fillStyle = g; x.fillRect(0, 0, 48, 48);
        x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(40, 6, 18, 0, TAU); x.fill();
        x.translate(21, 31); x.scale(1.5, 1.5); x.translate(-28, -14);
        var op = v.part, os = v.stick, oc = v.cluster;
        v.part = function (pa, c, o) { o = Object.assign({}, o || {}); o.lw = (o.lw == null ? v.lw : o.lw) * 0.62; return op.call(v, pa, c, o); };
        v.cluster = function (ps, c, o) { o = Object.assign({}, o || {}); o.lw = (o.lw == null ? v.lw : o.lw) * 0.62; return oc.call(v, ps, c, o); };
        v.stick = function (pts, w, c, o) { o = Object.assign({}, o || {}); o.lw = (o.lw == null ? v.lw : o.lw) * 0.62; return os.call(v, pts, w, c, o); };
        carapa(p)(v);
        v.part = op; v.stick = os; v.cluster = oc;
        x.restore();
        v.outline(Prr(1.5, 1.5, 45, 45, 6), 2.4, OLC);
        x.strokeStyle = 'rgba(255,230,170,0.7)'; x.lineWidth = 0.8; x.beginPath(); Prr(3.6, 3.6, 40.8, 40.8, 4.5)(x); x.stroke();
      };
    });
    addV('portrait_carapa', 48, 48, pf, { lw: 1.7 }, { neutral: { f: [0], fps: 1 }, happy: { f: [1], fps: 1 }, talk: { f: [0, 2, 0, 2], fps: 7 } });
  })();

  // datos de NPC (no se anade a NPC_NAMES: drawVillage NO la pinta sola; el programador decide cuando aparece)
  var VIL = A.VILLAGE;
  if (VIL && VIL.npcs && !VIL.npcs.carapa) VIL.npcs.carapa = { name: 'Carapa', title: 'Armera', x: 262, y: 452, flip: false, color: '#3a7a86', top: 66, sw: 22, off: 1200 };
  var CAR_DATA = { name: 'Carapa', title: 'Armera', x: 262, y: 452, flip: false, color: '#3a7a86', top: 66, sw: 22, off: 1200 };

  // ============================================================ PIEZAS (siluetas por slot x paleta de set), lienzo 32x32 base -> 64x64
  var PAL = {
    aldeano: { m: '#b8a878', s: '#8a7a52', h: '#e4d9ae', a: '#8a5a32', as: '#5e3a1c', ah: '#b07a4a', g: '#ece0b8', gold: '#e8b84a' },
    pastor: { m: '#9aa4b0', s: '#66707e', h: '#d8e0ec', a: '#f4ecd4', as: '#c8bc9c', ah: '#ffffff', k: '#363f4e', horn: '#e8d8a8', hornS: '#b8a468' },
    karceron: { m: '#6a5058', s: '#3e2a34', h: '#9c7a84', a: '#ff6a1a', as: '#b0380e', ah: '#ffd23a', k: '#241820', ch: '#8a8a9a' }
  };
  function stitch(v, x0, y0, x1, y1, n, col) { for (var i = 0; i <= n; i++) { var k = i / n, cx = x0 + (x1 - x0) * k, cy = y0 + (y1 - y0) * k; v.line(cx - 0.5, cy - 0.5, cx + 0.5, cy + 0.5, 0.4, col); } }
  function glow(v, cx, cy, r, c0) { var x = v.ctx, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c0 || '#fff3b0'); g.addColorStop(0.45, '#ff8a2a'); g.addColorStop(1, 'rgba(255,106,26,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function horn(v, pts, w, P) { v.stick(pts, w, P.horn, { lw: 1.1, hi: '#fff6d0', curve: false }); }

  var PIECE = {
    yelmo: function (v, set, P) {
      if (set === 'aldeano') {   // gorro de lana con ala doblada, borla y orejeras
        v.part(Pblob(16, 15.5, 10.4, 9.6, 5, 0.03), P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1.1 });
        v.part(Ppoly([[5.4, 17], [3.4, 25], [7.6, 26.6], [9.4, 19.4]]), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.5 });
        v.part(Ppoly([[26.6, 17], [28.6, 25], [24.4, 26.6], [22.6, 19.4]]), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.5 });
        v.part(Prr(5.2, 16.4, 21.6, 5.6, 2.6), P.a, { lw: 1.5, sh: P.as, hi: P.ah, so: 0.6 });
        stitch(v, 8, 19.2, 24, 19.2, 8, P.as);
        v.part(Pcirc(16, 5.4, 3.2), P.g, { lw: 1.3, sh: '#c8b888', hi: '#fff', so: 0.5 });
        for (var i = 0; i < 3; i++) v.line(10 + i * 2.2, 8.6, 11.8 + i * 1.5, 14, 0.4, P.s);
      } else if (set === 'pastor') {   // casco de acero con cuernos de carnero y borla de lana
        horn(v, [[8, 14], [3.6, 14.6], [2.2, 20], [5.4, 23.4], [8, 21.4]], 3.6, P); horn(v, [[24, 14], [28.4, 14.6], [29.8, 20], [26.6, 23.4], [24, 21.4]], 3.6, P);
        v.part(Pblob(16, 15.6, 10, 9.6, 6, 0.03), P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1.1 });
        v.part(Prr(10.4, 17.4, 11.2, 9.4, 2.4), P.k, { lw: 1.3, sh: null }); v.line(16, 12, 16, 26, 1.4, P.m); v.line(10.8, 18.4, 21.2, 18.4, 0.8, P.s);
        v.part(Pblob(11.6, 6.4, 3, 2.6, 7), P.a, { lw: 1, sh: P.as, so: 0.4 }); v.part(Pblob(16, 4.6, 3.4, 3, 8), P.a, { lw: 1, sh: P.as, so: 0.4 }); v.part(Pblob(20.6, 6.4, 3, 2.6, 9), P.a, { lw: 1, sh: P.as, so: 0.4 });
        v.dot(8.6, 13.8, 0.6, P.s); v.dot(23.4, 13.8, 0.6, P.s);
      } else {   // yelmo de alcaide con rejilla, rendijas de brasa y pinchos
        v.part(Ppoly([[10.4, 9], [11.6, 0.8], [15.4, 7.4]]), P.k, { lw: 1.2, sh: null }); v.part(Ppoly([[21.6, 9], [20.4, 0.8], [16.6, 7.4]]), P.k, { lw: 1.2, sh: null });
        v.part(Pblob(16, 15, 10, 10.6, 10, 0.02), P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        v.part(Prr(8.8, 15, 14.4, 12.6, 3), P.k, { lw: 1.3, sh: null });
        for (var j = 0; j < 4; j++) v.part(Prr(10.6 + j * 3.2, 17, 1.8, 8, 0.8), P.a, { lw: 0.4, sh: null, ol: P.as });
        v.line(8.8, 20, 23.2, 20, 0.9, P.s); v.dot(16, 11.4, 1.3, P.ah); v.line(16, 8.8, 16, 13.4, 0.8, P.a);
      }
    },
    peto: function (v, set, P) {
      var body = [[6, 8], [11.6, 5.4], [14.6, 6.6], [17.4, 6.6], [20.4, 5.4], [26, 8], [27.6, 14], [23.4, 16.6], [23.4, 27.6], [16, 29], [8.6, 27.6], [8.6, 16.6], [4.4, 14]];
      if (set === 'aldeano') {   // jubon de cuero con cordones y cinto
        v.part(Pclosed(body), P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1.1 });
        v.part(Ppoly([[13, 6.2], [16, 12.4], [19, 6.2], [17.6, 5.8], [16, 8.2], [14.4, 5.8]]), P.s, { lw: 1, sh: null });
        for (var i = 0; i < 4; i++) { v.line(14.4, 11 + i * 2.8, 17.6, 12.6 + i * 2.8, 0.7, P.a); v.line(17.6, 11 + i * 2.8, 14.4, 12.6 + i * 2.8, 0.7, P.a); }
        v.part(Prr(8.6, 22.6, 14.8, 3.6, 1.2), P.a, { lw: 1.2, sh: P.as, hi: P.ah, so: 0.4 }); v.part(Prr(14.2, 22, 3.6, 4.8, 0.8), P.gold, { lw: 0.8, sh: '#a8741a', so: 0.3 });
        v.part(Prr(4.4, 9.4, 5.2, 4.2, 1.4), P.a, { lw: 1, sh: P.as, so: 0.3 }); v.part(Prr(22.4, 9.4, 5.2, 4.2, 1.4), P.a, { lw: 1, sh: P.as, so: 0.3 });
      } else if (set === 'pastor') {   // peto de placas con cuello de lana y emblema de cuerno
        v.part(Ppoly([[5.4, 9], [11, 5.8], [21, 5.8], [26.6, 9], [27.6, 15.4], [23.6, 17.4], [23.4, 27.6], [16, 29.4], [8.6, 27.6], [8.4, 17.4], [4.4, 15.4]]), P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        v.line(8.6, 19, 23.4, 19, 0.8, P.s); v.line(9, 23.6, 23, 23.6, 0.7, P.s);
        v.part(Pcirc(16, 15, 3.6), P.k, { lw: 0.9, sh: null }); v.stick([[14, 13.6], [14, 16.4], [16.8, 16.6]], 1.2, P.horn, { lw: 0.5 }); v.stick([[18, 13.6], [18, 16.4], [15.4, 16.6]], 0.9, P.horn, { lw: 0.4 });
        [[9.6, 12], [22.4, 12], [10, 26], [22, 26]].forEach(function (d) { v.dot(d[0], d[1], 0.6, P.h); });
        v.part(Pblob(10.6, 6.6, 3.2, 2.4, 11), P.a, { lw: 1, sh: P.as, so: 0.4 }); v.part(Pblob(14.4, 5.6, 3, 2.4, 12), P.a, { lw: 1, sh: P.as, so: 0.4 });
        v.part(Pblob(17.8, 5.6, 3, 2.4, 13), P.a, { lw: 1, sh: P.as, so: 0.4 }); v.part(Pblob(21.6, 6.6, 3.2, 2.4, 14), P.a, { lw: 1, sh: P.as, so: 0.4 });
      } else {   // coraza oscura con nucleo de brasa, cadena y pinchos de hombrera
        v.part(Ppoly([[5, 5.4], [11, 5.8], [14, 7], [18, 7], [21, 5.8], [27, 5.4], [27.6, 14.6], [23.4, 17], [23.4, 27.4], [16, 29.4], [8.6, 27.4], [8.6, 17], [4.4, 14.6]]), P.m, { lw: 1.7, sh: P.s, hi: P.h, so: 1.2 });
        v.part(Ppoly([[5.6, 5.8], [7.4, 0.8], [9.6, 5.8]]), P.k, { lw: 1.1, sh: null }); v.part(Ppoly([[22.4, 5.8], [24.6, 0.8], [26.4, 5.8]]), P.k, { lw: 1.1, sh: null });
        glow(v, 16, 15.4, 8, '#fff3b0'); v.part(Pcirc(16, 15.4, 3), P.ah, { lw: 1, sh: P.a, so: 0.5 }); v.dot(15.4, 14.6, 0.8, '#fff');
        for (var c = 0; c < 6; c++) v.part(Pblob(8.4 + c * 2.7, 22 + (c % 2) * 0.8, 1.6, 1.2, 20 + c), '#00000000', { lw: 0.9, sh: null, ol: P.ch });
        v.line(9, 24.6, 23, 24.6, 0.8, P.s); v.dot(16, 26.8, 0.8, P.a);
      }
    },
    grebas: function (v, set, P) {
      var legs = [[5.4, 14], [18.2, 14]];
      if (set === 'aldeano') {   // botas de cuero con cana, correa y hebilla
        legs.forEach(function (l, i) {
          v.part(Pclosed([[l[0], 3.4], [l[0] + 8.6, 3.4], [l[0] + 8.4, 19], [l[0] + 11, 22.6], [l[0] + 10.6, 27.8], [l[0] - 1.4, 27.8], [l[0] - 0.6, 20]]), P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 0.9 });
          v.part(Prr(l[0] - 0.4, 3.2, 9.2, 4.4, 1.4), P.a, { lw: 1.1, sh: P.as, hi: P.ah, so: 0.4 });
          v.line(l[0], 13.4, l[0] + 8, 13.4, 1.2, P.a); v.part(Prr(l[0] + 3, 12.2, 2.8, 2.6, 0.5), P.gold, { lw: 0.6, sh: null });
          v.line(l[0] - 1, 25, l[0] + 10.6, 25, 1.3, P.as);
        });
      } else if (set === 'pastor') {   // grebas de acero con rodillera y ribete de lana
        legs.forEach(function (l, i) {
          v.part(Ppoly([[l[0] + 0.4, 6], [l[0] + 8.2, 6], [l[0] + 8, 20], [l[0] + 11, 23.4], [l[0] + 10.8, 28], [l[0] - 1.6, 28], [l[0] - 0.4, 21]]), P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 1 });
          v.line(l[0] + 4.2, 8, l[0] + 4.2, 20, 0.7, P.s);
          v.part(Pcirc(l[0] + 4.2, 11, 3.4), P.h, { lw: 1.1, sh: P.m, so: 0.5 });
          v.part(Pblob(l[0] + 1.8, 4.6, 2.6, 2.2, 30 + i), P.a, { lw: 0.9, sh: P.as, so: 0.3 }); v.part(Pblob(l[0] + 4.6, 3.8, 2.8, 2.4, 33 + i), P.a, { lw: 0.9, sh: P.as, so: 0.3 }); v.part(Pblob(l[0] + 7.2, 4.6, 2.6, 2.2, 36 + i), P.a, { lw: 0.9, sh: P.as, so: 0.3 });
          v.line(l[0] - 0.8, 25.6, l[0] + 10.6, 25.6, 0.8, P.s);
        });
      } else {   // grebas del carcelero: pinchos, rendijas de brasa y cadena de grillete
        legs.forEach(function (l, i) {
          v.part(Ppoly([[l[0] + 0.4, 5], [l[0] + 8.2, 5], [l[0] + 8, 20], [l[0] + 11, 23.4], [l[0] + 10.8, 28], [l[0] - 1.6, 28], [l[0] - 0.4, 21]]), P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1 });
          v.part(Ppoly([[l[0] + 1.4, 9.6], [l[0] + 4.2, 6.6], [l[0] + 7.2, 9.6], [l[0] + 4.2, 12.6]]), P.k, { lw: 1, sh: null }); v.part(Ppoly([[l[0] + 3.2, 9.6], [l[0] + 4.2, 8.4], [l[0] + 5.2, 9.6], [l[0] + 4.2, 10.8]]), P.ah, { lw: 0, sh: null });
          v.line(l[0] + 4.2, 14, l[0] + 4.2, 20, 1.2, P.a); v.part(Ppoly([[l[0] + (i ? 7.8 : 0.6), 8], [l[0] + (i ? 11.2 : -2.6), 10.6], [l[0] + (i ? 7.8 : 0.6), 12]]), P.k, { lw: 0.9, sh: null });
          v.part(Prr(l[0] - 0.6, 22.6, 10.2, 2.6, 0.8), P.k, { lw: 0.8, sh: null });
        });
        v.part(Pblob(16, 21.6, 1.7, 1.3, 51), '#00000000', { lw: 0.9, sh: null, ol: P.ch }); v.part(Pblob(14, 23.4, 1.7, 1.3, 52, 0.05, 9, 1), '#00000000', { lw: 0.9, sh: null, ol: P.ch }); v.part(Pblob(18, 23.4, 1.7, 1.3, 53, 0.05, 9, -1), '#00000000', { lw: 0.9, sh: null, ol: P.ch });
      }
    },
    talisman: function (v, set, P) {
      v.line(7, 1.6, 16, 12, 1.2, '#4a3220'); v.line(25, 1.6, 16, 12, 1.2, '#4a3220'); v.line(7.4, 1.4, 16, 11.6, 0.5, '#a87a4a'); v.line(24.6, 1.4, 16, 11.6, 0.5, '#a87a4a');
      if (set === 'aldeano') {   // amuleto del hogar: disco con casita y llama
        v.part(Pcirc(16, 19.6, 8), P.m, { lw: 1.6, sh: P.s, hi: P.h, so: 1 }); v.part(Pcirc(16, 19.6, 5.6), P.a, { lw: 0.9, sh: P.as, so: 0.5 });
        v.part(Ppoly([[11.4, 20], [16, 15], [20.6, 20], [19.4, 20], [19.4, 24.4], [12.6, 24.4], [12.6, 20]]), P.g, { lw: 0.9, sh: '#c8b888', so: 0.4 });
        v.part(Pblob(16, 21.6, 1.5, 2, 61), '#ff8a2a', { lw: 0.5, sh: '#c8481a', so: 0.2 }); v.dot(16, 22, 0.7, '#ffe45a');
      } else if (set === 'pastor') {   // colgante de pastoreo: cuerno curvo con cascabel
        v.part(Pcirc(16, 13.4, 1.8), P.m, { lw: 1, sh: P.s, so: 0.3 });
        horn(v, [[11.6, 16], [8.6, 21], [9.6, 26.4], [15, 27.4], [19.8, 24.8], [18.6, 20.6]], 4.2, P);
        v.part(Ppoly([[11, 15.4], [20.4, 15.4], [18.8, 19.6], [12.6, 19.6]]), P.m, { lw: 1.2, sh: P.s, hi: P.h, so: 0.6 });
        v.part(Pcirc(22.4, 24, 2.6), P.horn, { lw: 1, sh: P.hornS, so: 0.4 }); v.line(21.2, 24.2, 23.6, 24.2, 0.5, P.hornS); v.dot(22.4, 25.4, 0.5, P.k);
      } else {   // llave de la cripta: argolla, paleta con dientes y brasa
        glow(v, 16, 13, 8, '#ffd23a');
        x2ring(v, 16, 12.6, P);
        v.part(Prr(14.6, 16.4, 2.8, 11.6, 0.8), P.m, { lw: 1.2, sh: P.s, hi: P.h, so: 0.5 });
        v.part(Ppoly([[17, 22], [21.4, 22], [21.4, 24], [18.6, 24], [18.6, 25.2], [21.4, 25.2], [21.4, 27.6], [17, 27.6]]), P.m, { lw: 1.1, sh: P.s, so: 0.4 });
        v.dot(16, 12.6, 1.3, P.ah);
      }
    }
  };
  function x2ring(v, cx, cy, P) { v.part(Pcirc(cx, cy, 5), P.m, { lw: 1.5, sh: P.s, hi: P.h, so: 0.8 }); v.part(Pcirc(cx, cy, 2.4), '#2a1a22', { lw: 0.8, sh: null }); }

  var PIECE_CACHE = {};
  function pieceCanvas(setId, slotId) {   // pieza SOLA sobre transparente (64x64); la usan el icono y el maniqui
    var set = normSet(setId), slot = normSlot(slotId), k = set + '|' + slot;
    if (PIECE_CACHE[k]) return PIECE_CACHE[k];
    return (PIECE_CACHE[k] = vframe(32, 32, function (v) { PIECE[slot](v, set, PAL[set]); }, { lw: 1.5 }));
  }

  // ============================================================ ICONOS 32x32 (64x64 final): fondo del color del set + marco de rareza + refuerzo
  var ICON_CACHE = {};
  function buildIcon(set, slot, ref, rar, locked) {
    return vframe(32, 32, function (v) {
      var x = v.ctx, bg = SET_BG[set], g = x.createLinearGradient(0, 0, 0, 32);
      g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
      x.save(); x.beginPath(); Prr(1.6, 1.6, 28.8, 28.8, 5)(x); x.clip();
      x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(24, 5, 12, 0, TAU); x.fill();
      x.restore();
      x.drawImage(pieceCanvas(set, slot), 0, 0, 32, 32);
      // marco: contorno + borde de rareza + filete de refuerzo
      v.outline(Prr(1.6, 1.6, 28.8, 28.8, 5), 2.2, OLC);
      x.strokeStyle = RAR_COL[rar]; x.lineWidth = 1.5; x.beginPath(); Prr(2.6, 2.6, 26.8, 26.8, 4.2)(x); x.stroke();
      if (ref > 0) { x.strokeStyle = REF_COL[ref]; x.lineWidth = 0.9; x.beginPath(); Prr(4, 4, 24, 24, 3.4)(x); x.stroke(); }
      if (ref === 3) { spark(v, 26.6, 5.4, 3.4, '#fff3b0', 0.4); spark(v, 5.2, 26, 2, '#ffe27a', 0.1); }
      if (ref > 0) {   // chapita +n
        v.part(Prr(17.4, 21.6, 12.6, 8.8, 3), REF_COL[ref], { lw: 1.2, sh: ref === 3 ? '#c8901a' : ref === 2 ? '#8a94ac' : '#8a5428', so: 0.5 });
        x.fillStyle = '#1b1124'; x.font = 'bold 7px system-ui, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+' + ref, 23.8, 26.2);
      }
      if (locked) { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(20,14,30,0.62)'; x.fillRect(0, 0, 32, 32); x.restore(); }
    }, { lw: 1.5 });
  }
  /** Assets.armorIcon(setId, slot, refuerzo, {rarity, locked}) -> canvas 64x64 CACHEADO (no modificar; copiar si hace falta). */
  A.armorIcon = safe(function (setId, slot, ref, o) {
    o = o || {}; var set = normSet(setId), sl = normSlot(slot), r = clamp(ref | 0, 0, 3), rar = clamp(o.rarity == null ? SET_RARITY[set] : o.rarity | 0, 0, 4), lk = o.locked ? 1 : 0, k = [set, sl, r, rar, lk].join('|');
    return ICON_CACHE[k] || (ICON_CACHE[k] = buildIcon(set, sl, r, rar, lk));
  }, function (s, sl, r) { return fbIcon(s, sl, r | 0); });
  /** Assets.drawArmorIcon(ctx, setId, slot, x, y, size=32, {ref, rarity, locked, alpha}) x,y = esquina sup. izq. */
  A.drawArmorIcon = safe(function (ctx, setId, slot, x, y, size, o) {
    o = o || {}; size = size || 32; var im = A.armorIcon(setId, slot, o.ref | 0, o);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.imageSmoothingEnabled = size < 64; ctx.drawImage(im, x, y, size, size); ctx.restore();
  }, function (ctx, s, sl, x, y, size, o) { ctx.drawImage(fbIcon(s, sl, o && o.ref), x, y, size || 32, size || 32); });

  var EMPTY_CACHE = {};
  /** Assets.armorSlotIcon(slot, {hot}) -> canvas 64x64 CACHEADO: silueta tenue del slot sobre casilla discontinua (slot vacio). hot = resaltado (arrastrando/seleccion). */
  A.armorSlotIcon = safe(function (slot, o) {
    var sl = normSlot(slot), hot = o && o.hot ? 1 : 0, k = sl + hot;
    if (EMPTY_CACHE[k]) return EMPTY_CACHE[k];
    return (EMPTY_CACHE[k] = vframe(32, 32, function (v) {
      var x = v.ctx;
      x.save(); x.beginPath(); Prr(1.6, 1.6, 28.8, 28.8, 5)(x); x.clip(); x.fillStyle = hot ? 'rgba(90,74,120,0.65)' : 'rgba(34,24,48,0.78)'; x.fillRect(0, 0, 32, 32); x.restore();
      var t = vframe(32, 32, function (w) { PIECE[sl](w, 'aldeano', PAL.aldeano); }, { lw: 1.5 }), tc = t.getContext('2d');
      tc.globalCompositeOperation = 'source-in'; tc.fillStyle = hot ? '#b8a4e0' : '#6a5a84'; tc.fillRect(0, 0, 64, 64);
      x.globalAlpha = hot ? 0.75 : 0.5; x.drawImage(t, 0, 0, 32, 32); x.globalAlpha = 1;
      x.setLineDash([2.6, 2.2]); x.strokeStyle = hot ? '#d8c8ff' : '#7a6a94'; x.lineWidth = 1.2; x.beginPath(); Prr(2.4, 2.4, 27.2, 27.2, 4.4)(x); x.stroke(); x.setLineDash([]);
    }, { lw: 1.5 }));
  }, function () { return A.armorSlotIcon ? plainCanvas(64, 64) : null; });
  A.drawArmorSlotIcon = safe(function (ctx, slot, x, y, size, o) { size = size || 32; ctx.save(); ctx.imageSmoothingEnabled = size < 64; ctx.drawImage(A.armorSlotIcon(slot, o), x, y, size, size); ctx.restore(); });

  // ============================================================ icono de DEFENSA (HUD): escudo azul petroleo 24x24 -> 48x48
  addV('icon_def', 24, 24, [function (v) {
    var x = v.ctx;
    v.part(Pclosed([[12, 1.8], [20.6, 4.4], [20.4, 12.6], [17, 18.4], [12, 22.4], [7, 18.4], [3.6, 12.6], [3.4, 4.4]]), '#3a8aa0', { lw: 1.7, sh: '#235a6c', hi: '#8ad0dc', so: 1.2 });
    v.part(Ppoly([[12, 5], [17.4, 6.6], [17.2, 12], [12, 18.6], [6.8, 12], [6.6, 6.6]]), '#5cb0c4', { lw: 0.9, sh: '#2c7488', so: 0.6 });
    v.line(12, 5.4, 12, 18, 0.9, '#1b4550'); v.line(7.4, 10.6, 16.6, 10.6, 0.9, '#1b4550');
    v.dot(12, 10.6, 1.5, '#ffd23a'); v.dot(11.6, 10.2, 0.45, '#fff');
  }], { lw: 1.6 });
  /** Assets.drawDefIcon(ctx, x, y, size=24, {alpha}) x,y = esquina sup. izq. */
  A.drawDefIcon = safe(function (ctx, x, y, size, o) { size = size || 24; ctx.save(); if (o && o.alpha != null) ctx.globalAlpha = o.alpha; ctx.drawImage(A.sprite('icon_def', 0), x, y, size, size); ctx.restore(); },
    function (ctx, x, y, size) { size = size || 24; ctx.fillStyle = '#3a8aa0'; ctx.fillRect(x + size * 0.15, y + size * 0.1, size * 0.7, size * 0.8); });

  // ============================================================ TALLER-TOLDO y decorado (coordenadas base; final x2)
  var W = { wood: '#9a6a3a', woodS: '#6e4624', woodH: '#c08a52', teal: '#2f7a86', tealS: '#1f525c', tealH: '#5eb0bc', cream: '#f2e8cc', creamS: '#cdbf96' };
  function awning(v, frame) {
    var x = v.ctx, i, N = 8;
    // postes
    v.part(Prr(5, 22, 4.4, 49, 1), W.wood, { lw: 1.6, sh: W.woodS, hi: W.woodH, so: 0.8 }); v.part(Prr(86.6, 22, 4.4, 49, 1), W.wood, { lw: 1.6, sh: W.woodS, hi: W.woodH, so: 0.8 });
    // interior oscuro
    v.part(Prr(9.4, 22, 77.2, 46, 1), '#3a2c3c', { lw: 1.4, sh: '#241a2a', so: 0.6 });
    v.line(11, 38, 85, 38, 0.6, 'rgba(255,255,255,0.07)'); v.line(11, 52, 85, 52, 0.6, 'rgba(255,255,255,0.07)');
    // toldo a rayas con volante festoneado
    var roof = [[0, 24], [12, 6], [84, 6], [96, 24]];
    v.part(Ppoly(roof), W.teal, { lw: 1.9, sh: W.tealS, hi: W.tealH, so: 1.6 });
    x.save(); x.beginPath(); Ppoly(roof)(x); x.clip();
    for (i = 0; i < N; i += 2) { x.fillStyle = W.cream; x.fillRect(i * 12, 5, 12, 20); }
    x.restore();
    v.outline(Ppoly(roof), 1.9, OLC);
    for (i = 0; i < N; i++) { var sx = i * 12; v.part(Pblob(sx + 6, 24.6, 6, 2.8, 70 + i), i % 2 ? W.teal : W.cream, { lw: 1.3, sh: i % 2 ? W.tealS : W.creamS, so: 0.5 }); }
    v.part(Prr(10, 4.2, 76, 3.4, 1.4), W.woodS, { lw: 1.4, sh: '#3a2410', hi: W.woodH, so: 0.4 });
    if (frame === 3) {   // CERRADO: lona caida + cartel "Vuelvo pronto"
      v.part(Ppoly([[9.4, 25], [86.6, 25], [86.6, 70], [9.4, 70]]), W.cream, { lw: 1.6, sh: W.creamS, hi: '#fff', so: 1.4 });
      for (i = 1; i < 6; i++) v.line(9.4 + i * 12.9, 26, 9.4 + i * 12.9, 69, 0.6, 'rgba(120,100,60,0.35)');
      stitch(v, 10, 68, 86, 68, 28, W.creamS);
      v.stick([[48, 25], [48, 32]], 1, '#4a3220', { lw: 0.6 });
      v.part(Prr(26, 32, 44, 20, 2.4), W.wood, { lw: 1.6, sh: W.woodS, hi: W.woodH, so: 0.9 });
      x.fillStyle = '#2a1a0e'; x.font = 'bold 7px system-ui, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('VUELVO', 48, 38.4); x.fillText('PRONTO', 48, 46.2);
      v.dot(29, 35, 0.8, '#d8c8a0'); v.dot(67, 35, 0.8, '#d8c8a0'); v.dot(29, 49, 0.8, '#d8c8a0'); v.dot(67, 49, 0.8, '#d8c8a0');
      return;
    }
    // pared de fondo: tablero de herramientas, rollos de tela y farolillo
    v.part(Prr(13, 28, 24, 14, 1.4), '#5a4636', { lw: 1.2, sh: '#3a2c20', hi: '#7a6046', so: 0.5 });
    v.part(Prr(15.6, 31, 2.8, 8, 0.8), '#c0cae0', { lw: 0.8, sh: '#7a8498', so: 0.2 }); v.part(Prr(20, 30, 4.2, 9.4, 0.8), '#7a8498', { lw: 0.8, sh: '#4a5468', so: 0.2 }); v.line(28, 30, 28, 40, 1, '#c8c0a0'); v.part(Prr(30.4, 33, 4, 4.6, 1), W.teal, { lw: 0.8, sh: W.tealS, so: 0.2 });
    v.part(Prr(55, 28, 4.6, 24, 2.2), '#a8794a', { lw: 1.2, sh: '#6e4a28', hi: '#d09a64', so: 0.6 }); v.part(Prr(61, 32, 4.6, 20, 2.2), '#7a4a8a', { lw: 1.2, sh: '#4e2a5e', hi: '#a878b8', so: 0.6 }); v.part(Prr(67, 30, 4.6, 22, 2.2), W.teal, { lw: 1.2, sh: W.tealS, hi: W.tealH, so: 0.6 });
    v.line(46, 28, 46, 38, 0.8, '#4a3220');
    // farolillo colgante (frames 1 y 2: parpadeo)
    var lit = frame === 1 ? 1.15 : frame === 2 ? 0.85 : 1;
    v.line(80, 24, 80, 29, 0.8, '#4a3220');
    v.part(Prr(77, 29, 6, 8.4, 1.6), '#4a3a44', { lw: 1.2, sh: '#2a2230', so: 0.4 });
    v.part(Prr(78.2, 30.6, 3.6, 5.2, 1), frame === 2 ? '#ffd870' : '#ffe9a0', { lw: 0.5, sh: null });
    glow(v, 80, 33, 7 * lit, '#fff3b0');
    // mesa de costura con tela, hilo y un yelmo a medio hacer
    v.part(Prr(18, 52, 60, 5, 1.2), W.wood, { lw: 1.6, sh: W.woodS, hi: W.woodH, so: 0.7 });
    v.part(Prr(21, 56.6, 4, 12.4, 0.8), W.woodS, { lw: 1.3, sh: '#3a2410', so: 0.3 }); v.part(Prr(71, 56.6, 4, 12.4, 0.8), W.woodS, { lw: 1.3, sh: '#3a2410', so: 0.3 });
    v.part(Pclosed([[22, 51], [27, 45], [36, 45], [38, 51]]), '#d8c8a0', { lw: 1.1, sh: '#a89870', so: 0.5 }); v.line(26, 48, 34, 48, 0.5, '#8a7a52');
    v.part(Prr(44, 46.4, 11, 5.4, 1.2), '#a8794a', { lw: 1.1, sh: '#6e4a28', so: 0.4 });
    v.part(Pblob(64, 47.6, 5.4, 4.2, 81), '#9aa4b0', { lw: 1.2, sh: '#66707e', hi: '#d8e0ec', so: 0.6 }); v.part(Prr(60, 48.6, 8, 3.2, 0.8), '#363f4e', { lw: 0.7, sh: null });
    v.part(Pcirc(40, 50, 1.4), '#d03a2a', { lw: 0.7, sh: '#8a1e1e', so: 0.2 });
  }
  addV('vil_workshop', 96, 72, [0, 1, 2, 3].map(function (k) { return function (v) { awning(v, k); }; }), { lw: 1.7 }, {
    lamp: { f: [0, 1, 0, 2, 0, 1, 2, 0], fps: 4 }, closed: { f: [3], fps: 1 }
  });
  // maniqui: base de madera + torso de tela (28x48 -> 56x96; ancla bottom-center)
  addV('vil_mannequin', 28, 48, [function (v) {
    v.part(Prr(2, 44.4, 24, 3.4, 1.4), W.wood, { lw: 1.5, sh: W.woodS, hi: W.woodH, so: 0.5 });
    v.part(Prr(12.4, 33, 3.2, 12, 1), W.wood, { lw: 1.4, sh: W.woodS, hi: W.woodH, so: 0.5 });
    v.part(Prr(2, 14.4, 24, 3.6, 1.8), W.wood, { lw: 1.4, sh: W.woodS, hi: W.woodH, so: 0.5 });
    v.part(Pclosed([[6.6, 16], [11, 14], [17, 14], [21.4, 16], [22.4, 24], [20.2, 33.6], [14, 35.4], [7.8, 33.6], [5.6, 24]]), '#d8c8a0', { lw: 1.7, sh: '#a89870', hi: '#f6ecd0', so: 1.1 });
    v.line(14, 16, 14, 34, 0.5, 'rgba(90,70,40,0.5)'); stitch(v, 8, 22, 20, 22, 6, '#8a7a52');
    v.part(Prr(12.4, 9, 3.2, 5.6, 1), W.wood, { lw: 1.2, sh: W.woodS, so: 0.3 });
    v.part(Pcirc(14, 6.4, 4.6), W.wood, { lw: 1.5, sh: W.woodS, hi: W.woodH, so: 0.7 });
    v.part(Pcirc(14, 6.4, 1.4), W.woodS, { lw: 0, sh: null });
  }], { lw: 1.6 });
  // perchero de armaduras (40x56 -> 80x112; ancla bottom-center)
  addV('vil_armorrack', 40, 56, [function (v) {
    v.part(Prr(3, 8, 4, 47, 1), W.wood, { lw: 1.5, sh: W.woodS, hi: W.woodH, so: 0.7 }); v.part(Prr(33, 8, 4, 47, 1), W.wood, { lw: 1.5, sh: W.woodS, hi: W.woodH, so: 0.7 });
    v.part(Prr(1, 5, 38, 4.4, 1.6), W.wood, { lw: 1.5, sh: W.woodS, hi: W.woodH, so: 0.6 });
    v.part(Prr(0, 52, 12, 3.4, 1.2), W.woodS, { lw: 1.2, sh: '#3a2410', so: 0.3 }); v.part(Prr(28, 52, 12, 3.4, 1.2), W.woodS, { lw: 1.2, sh: '#3a2410', so: 0.3 });
    v.line(12, 9, 12, 14, 0.8, '#4a3220'); v.line(28, 9, 28, 14, 0.8, '#4a3220');
    v.part(Pclosed([[12, 13], [17.4, 15], [17.4, 24], [12, 29.4], [6.6, 24], [6.6, 15]]), W.teal, { lw: 1.5, sh: W.tealS, hi: W.tealH, so: 0.9 }); v.dot(12, 20, 1.6, '#ffd23a'); v.dot(11.5, 19.5, 0.45, '#fff');
    v.part(Pblob(28, 21, 6.4, 6.6, 91), '#b8a878', { lw: 1.5, sh: '#8a7a52', hi: '#e4d9ae', so: 0.8 }); v.part(Prr(21.8, 22.6, 12.4, 4, 1.4), '#8a5a32', { lw: 1, sh: '#5e3a1c', so: 0.4 });
    v.part(Pblob(28, 17.4, 2.4, 2.2, 92), '#ece0b8', { lw: 0.9, sh: '#c8b888', so: 0.3 });
    v.part(Ppoly([[24, 36], [32, 36], [31, 48], [25, 48]]), '#a8794a', { lw: 1.3, sh: '#6e4a28', hi: '#d09a64', so: 0.6 }); v.line(24.6, 41, 31.4, 41, 0.9, '#5e3a1c');
  }], { lw: 1.6 });

  // ============================================================ datos de composicion (px del canvas 960x540)
  var WS = A.ARMOR_WORKSHOP = {
    carapa: CAR_DATA,
    workshop: { spr: 'vil_workshop', x: 262, y: 440, sort: 440 },
    mannequin: { spr: 'vil_mannequin', x: 212, y: 455, sort: 455 },
    rack: { spr: 'vil_armorrack', x: 310, y: 452, sort: 452 },
    anvil: { spr: 'vil_anvil', x: 292, y: 454, sort: 454 },   // yunque de trabajo de Carapa (reusa el de la aldea; el golpe cae en ~(291,435))
    hammerTarget: { x: 291, y: 436 },
    sparks: { x: 298, y: 437 },
    colliders: [{ id: 'workshop', x: 166, y: 410, w: 192, h: 30 }, { id: 'mannequin', x: 198, y: 446, w: 28, h: 9 }, { id: 'rack', x: 292, y: 444, w: 36, h: 8 }, { id: 'anvil', x: 270, y: 446, w: 44, h: 8 }],
    lights: [{ x: 342, y: 340, r: 100, c: [255, 196, 100], s: 0.8, fl: 0.5, id: 'workshop' }]   // farolillo (sumar a Assets.VILLAGE.lights si se quiere luz)
  };
  /** Posicion en pantalla de los puntos de cada slot sobre el maniqui (centro de la pieza, px) */
  var MANN = { yelmo: [28, 14, 36], peto: [28, 52, 50], grebas: [28, 80, 40], talisman: [28, 56, 22] };   // [dx desde el centro, dy desde el borde SUP del sprite, tamano]
  function eqEntry(e) { if (!e) return null; if (typeof e === 'string') return { set: e }; return e.set || e.setId ? { set: e.set || e.setId, ref: e.ref | 0 } : null; }
  /** Assets.drawMannequin(ctx, x, y, equip, t, {scale}): x,y = base-centro. equip = {yelmo,peto,grebas,talisman}, cada uno 'aldeano'|'pastor'|'karceron' o {set, ref} o null. */
  A.drawMannequin = safe(function (ctx, x, y, equip, t, o) {
    o = o || {}; var s = o.scale || 1, im = A.sprite('vil_mannequin', 0), w = im.width * s, h = im.height * s, top = y - h, left = x - w / 2;
    ctx.save(); ctx.drawImage(im, left, top, w, h);
    equip = equip || {};
    ['grebas', 'peto', 'yelmo', 'talisman'].forEach(function (sl) {
      var e = eqEntry(equip[sl]); if (!e) return; var m = MANN[sl], sz = m[2] * s;
      ctx.drawImage(pieceCanvas(e.set, sl), left + (m[0] * s) - sz / 2, top + (m[1] * s) - sz / 2, sz, sz);
    });
    ctx.restore();
  });
  /**
   * Assets.drawCarapa(ctx, x, y, t, {anim, flip, scale, shadow, alpha}) = drawNPC con ajustes: x,y = PIES. Por defecto (262,452).
   * anim: 'idle'|'work'|'talk'|'happy'|'surprise'.
   */
  A.drawCarapa = safe(function (ctx, x, y, t, o) {
    o = o || {}; var d = CAR_DATA, sc = o.scale || 1, fr = A.animFrame('npc_carapa', o.anim || 'idle', (t || 0) + d.off);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(20,8,30,0.34)'; ctx.beginPath(); ctx.ellipse(x, y - 1, d.sw * sc, 6 * sc, 0, 0, TAU); ctx.fill(); }
    ctx.translate(x, y); if (o.flip) ctx.scale(-1, 1); ctx.scale(sc, sc); ctx.drawImage(fr, -40, -80); ctx.restore();
  }, function (ctx, x, y) { ctx.fillStyle = '#3a7a86'; ctx.fillRect(x - 14, y - 30, 28, 30); });
  A.drawCarapaPortrait = safe(function (ctx, x, y, o) { o = o || {}; ctx.drawImage(A.sprite('portrait_carapa', o.mood | 0), x, y, o.size || 96, o.size || 96); });
  /**
   * Assets.drawWorkshop(ctx, t, {open:true, carapa:true|false|{anim,flip}, equip, hammer:true, sparks:true})
   * Dibuja TODO el taller en coordenadas de la aldea (960x540): toldo, perchero, yunque, maniqui con el equipo y Carapa, ordenados por y.
   * Pensado para usarse como UN actor de drawVillage: {y: 452, draw: c => Assets.drawWorkshop(c, t, opts)}.
   * open=false -> toldo cerrado con cartel "Vuelvo pronto" (y sin Carapa, maniqui ni perchero).
   */
  A.drawWorkshop = safe(function (ctx, t, o) {
    o = o || {}; t = t || 0; var open = o.open !== false, items = [], img, k;
    function sp(d, anim) { var im = anim ? A.animFrame(d.spr, anim, t) : A.sprite(d.spr, 0); ctx.drawImage(im, Math.round(d.x - im.width / 2), Math.round(d.y - im.height)); }
    items.push({ y: WS.workshop.sort, f: function () { sp(WS.workshop, open ? 'lamp' : 'closed'); } });
    if (open) {
      items.push({ y: WS.rack.sort, f: function () { sp(WS.rack); } });
      items.push({ y: WS.anvil.sort, f: function () { sp(WS.anvil); } });
      items.push({ y: WS.mannequin.sort, f: function () { A.drawMannequin(ctx, WS.mannequin.x, WS.mannequin.y, o.equip, t); } });
      if (o.carapa !== false) {
        var co = typeof o.carapa === 'object' && o.carapa ? o.carapa : {}, an = co.anim || (o.hammer ? 'work' : 'idle');
        items.push({ y: CAR_DATA.y, f: function () {
          A.drawCarapa(ctx, CAR_DATA.x, CAR_DATA.y, t, { anim: an, flip: co.flip });
          if (an === 'work' && o.sparks !== false && !co.flip) { var ph = (t % 1000) / 1000; if (ph < 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,200,70,' + (1 - ph / 0.3).toFixed(2) + ')'; for (var i = 0; i < 4; i++) ctx.fillRect(WS.sparks.x + i * 3 - 4 + ph * 18 * (i - 1.5), WS.sparks.y - ph * 30 + (i % 2) * 4, 2, 2); ctx.restore(); } }
        } });
      }
    }
    items.sort(function (a, b) { return a.y - b.y; });
    ctx.save(); ctx.imageSmoothingEnabled = false; items.forEach(function (it) { it.f(); }); ctx.restore();
  });

  A.ARMOR_ART = {
    ready: true, sets: SETS, slots: SLOTS, setAlias: SET_ALIAS, slotAlias: SLOT_ALIAS, rarityColors: RAR_COL, rarityNames: RAR_NAME, refColors: REF_COL,
    setColors: { aldeano: '#b8a878', pastor: '#9aa4b0', karceron: '#ff6a1a' }, defaultRarity: SET_RARITY,
    normSet: normSet, normSlot: normSlot, pieceCanvas: pieceCanvas
  };
})();
