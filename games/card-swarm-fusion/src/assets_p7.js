/*!
 * assets_p7.js - Arte mínimo de la P7 (Integración), procedural y con la misma gramática que assets_village.js (contorno #1b1124, color plano + 1 sombra + 1 brillo):
 *   Assets.drawDestIcon(ctx, id, cx, cy, size, o)      icono de destino del Portal ('bosque' | 'cripta' | 'asfodelo' | 'tundra' | 'panal' | 'crater'); o.dim = apagado (destino cerrado)
 *   Assets.drawHearthStatue(ctx, x, y, t, o)           estatua del Hogar de la plaza (pies en x, y; ~110 x 120 px): 6 cuencos de brasa en un anillo de piedra y la 'Brasa Primera'
 *                                                      en el centro; o.lit = 0..6 llamas encendidas (una por jefe vencido), o.final = brasa dorada (Cenizar vencido)
 * Sin dependencias de datos del juego: solo Assets y un contexto 2D. Si este archivo faltara, el Portal y la aldea usan su dibujo de reserva.
 */
(function () {
  'use strict';
  var A = window.Assets; if (!A) return;
  var OL = '#1b1124', TAU = Math.PI * 2;

  function poly(c, pts, fill, lw) { c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = OL; c.lineJoin = 'round'; c.stroke(); }
  function circ(c, x, y, r, fill, lw) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OL; c.stroke(); } }

  // ---------------------------------------------------------------- iconos de destino (base 32x32, se escalan a `size`)
  var ICONS = {
    bosque: function (c) {   // abeto
      poly(c, [[16, 3], [25, 15], [20, 15], [27, 24], [5, 24], [12, 15], [7, 15]], '#4aa060', 1.6); poly(c, [[16, 3], [20, 9], [16, 8]], '#7ad08a', 0);
      c.fillStyle = '#7a4a2a'; c.fillRect(14, 24, 4, 6); c.lineWidth = 1.4; c.strokeStyle = OL; c.strokeRect(14, 24, 4, 6);
    },
    cripta: function (c) {   // lápida con cruz
      c.beginPath(); c.moveTo(7, 29); c.lineTo(7, 12); c.arc(16, 12, 9, Math.PI, 0); c.lineTo(25, 29); c.closePath(); c.fillStyle = '#8a8fa0'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = OL; c.stroke();
      c.fillStyle = '#b8bdd0'; c.fillRect(9, 12, 3, 15); c.fillStyle = OL; c.fillRect(14.5, 8, 3, 14); c.fillRect(11, 12, 10, 3);
    },
    asfodelo: function (c) {   // flor de asfódelo con tallo
      c.strokeStyle = OL; c.lineWidth = 4.4; c.beginPath(); c.moveTo(16, 29); c.lineTo(16, 14); c.stroke(); c.strokeStyle = '#4ac0a0'; c.lineWidth = 2; c.beginPath(); c.moveTo(16, 29); c.lineTo(16, 14); c.stroke();
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + (i - 2) * 0.62, px = 16 + Math.cos(a) * 7, py = 11 + Math.sin(a) * 7; circ(c, px, py, 4.2, i % 2 ? '#e8d8ff' : '#c9a8ff', 1.4); }
      circ(c, 16, 11, 3, '#ffe27a', 1.2);
    },
    tundra: function (c) {   // copo de nieve
      c.lineCap = 'round'; [[1.5, OL], [0.5, '#bfeaff']].forEach(function (s, pass) {
        c.strokeStyle = s[1]; c.lineWidth = pass ? 2.2 : 4.6;
        for (var i = 0; i < 6; i++) { var a = i * TAU / 6; c.beginPath(); c.moveTo(16, 16); c.lineTo(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12); c.stroke();
          var bx = 16 + Math.cos(a) * 7.5, by = 16 + Math.sin(a) * 7.5; [-0.6, 0.6].forEach(function (d) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a + d) * 4.5, by + Math.sin(a + d) * 4.5); c.stroke(); }); }
      });
      circ(c, 16, 16, 2.4, '#ffffff', 0);
    },
    panal: function (c) {   // hexágono de cera con gota de miel
      var P = []; for (var i = 0; i < 6; i++) P.push([16 + Math.cos(i * TAU / 6 + TAU / 12) * 13, 16 + Math.sin(i * TAU / 6 + TAU / 12) * 13]);
      poly(c, P, '#f0c040', 1.8);
      var Q = []; for (i = 0; i < 6; i++) Q.push([16 + Math.cos(i * TAU / 6 + TAU / 12) * 7, 16 + Math.sin(i * TAU / 6 + TAU / 12) * 7]);
      poly(c, Q, '#b8741c', 1.2);
      c.beginPath(); c.moveTo(16, 11); c.quadraticCurveTo(21, 17, 16, 21); c.quadraticCurveTo(11, 17, 16, 11); c.fillStyle = '#ffe08a'; c.fill();
    },
    crater: function (c) {   // llama sobre brasa
      poly(c, [[5, 28], [9, 22], [23, 22], [27, 28]], '#4a4352', 1.6);
      c.beginPath(); c.moveTo(8, 23); c.quadraticCurveTo(6, 12, 16, 3); c.quadraticCurveTo(15, 11, 21, 10); c.quadraticCurveTo(28, 16, 24, 23); c.closePath(); c.fillStyle = '#ff6a1a'; c.fill(); c.lineWidth = 1.7; c.strokeStyle = OL; c.stroke();
      c.beginPath(); c.moveTo(12, 23); c.quadraticCurveTo(11, 17, 16, 13); c.quadraticCurveTo(20, 17, 20, 23); c.closePath(); c.fillStyle = '#ffd24a'; c.fill();
    }
  };
  A.drawDestIcon = function (c, id, cx, cy, size, o) {
    var f = ICONS[id]; if (!f) return false;
    c.save(); c.translate(cx - size / 2, cy - size / 2); c.scale(size / 32, size / 32);
    if (o && o.dim) c.globalAlpha = 0.35;
    f(c); c.restore(); return true;
  };

  // ---------------------------------------------------------------- estatua del Hogar
  A.drawHearthStatue = function (c, x, y, t, o) {
    o = o || {}; var lit = o.lit == null ? 6 : o.lit, fin = !!o.final, now = (t || 0) / 1000, i;
    c.save(); c.translate(x, y); c.lineJoin = 'round';
    // resplandor
    var gr = c.createRadialGradient(0, -52, 6, 0, -52, fin ? 130 : 90); gr.addColorStop(0, fin ? 'rgba(255,225,150,0.5)' : 'rgba(255,170,80,0.38)'); gr.addColorStop(1, 'rgba(255,106,26,0)');
    c.fillStyle = gr; c.fillRect(-140, -190, 280, 230);
    // sombra y base de dos peldaños
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(0, 4, 58, 11, 0, 0, TAU); c.fill();
    poly(c, [[-52, 2], [-46, -10], [46, -10], [52, 2]], '#7a7488', 2.2);
    poly(c, [[-38, -10], [-33, -22], [33, -22], [38, -10]], '#9a94a8', 2.2);
    c.fillStyle = '#b8b2c4'; c.fillRect(-30, -20, 60, 2);
    // fuste con muescas
    poly(c, [[-14, -22], [-10, -62], [10, -62], [14, -22]], '#8a8498', 2.2);
    c.strokeStyle = OL; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6, -30); c.lineTo(-5, -54); c.moveTo(6, -28); c.lineTo(5, -50); c.stroke();
    // 6 cuencos: 5 llamas de los jefes + la Brasa Primera arriba
    var pos = [[-40, -34, 0], [-26, -50, 1], [26, -50, 2], [40, -34, 3], [0, -74, 4]];
    function bowl(bx, by, k, big) {
      var on = k < lit, w = big ? 12 : 9;
      poly(c, [[bx - w, by], [bx + w, by], [bx + w * 0.6, by + 8], [bx - w * 0.6, by + 8]], '#5a5468', 1.8);
      if (!on) { circ(c, bx, by - 1, w * 0.5, '#2a2630', 1); return; }
      var fl = Math.sin(now * 9 + k * 1.7) * 1.6, h = (big ? 22 : 15) + fl;
      c.beginPath(); c.moveTo(bx - w * 0.8, by); c.quadraticCurveTo(bx - w * 0.5, by - h * 0.7, bx + fl * 0.3, by - h); c.quadraticCurveTo(bx + w * 0.5, by - h * 0.5, bx + w * 0.8, by); c.closePath();
      c.fillStyle = fin && big ? '#fff2b0' : ['#ff7a2a', '#7ad0ff', '#c8a0ff', '#9be34a', '#ff5a7a'][k % 5]; c.fill(); c.lineWidth = 1.6; c.strokeStyle = OL; c.stroke();
      c.beginPath(); c.moveTo(bx - w * 0.35, by); c.quadraticCurveTo(bx, by - h * 0.55, bx + w * 0.35, by); c.closePath(); c.fillStyle = '#ffe8a0'; c.fill();
    }
    // brazos de piedra hacia los cuencos
    c.strokeStyle = OL; c.lineWidth = 5; c.lineCap = 'round'; pos.forEach(function (p) { c.beginPath(); c.moveTo(0, -48); c.lineTo(p[0] * 0.85, p[1] + 8); c.stroke(); });
    c.strokeStyle = '#8a8498'; c.lineWidth = 2.6; pos.forEach(function (p) { c.beginPath(); c.moveTo(0, -48); c.lineTo(p[0] * 0.85, p[1] + 8); c.stroke(); });
    for (i = 0; i < 4; i++) bowl(pos[i][0], pos[i][1], pos[i][2], false);
    bowl(0, -66, 4, false);
    // Brasa Primera: gema dorada flotando sobre el fuste
    var by = -92 + Math.sin(now * 2.4) * 2.5;
    c.beginPath(); c.moveTo(0, by - 12); c.lineTo(9, by); c.lineTo(0, by + 12); c.lineTo(-9, by); c.closePath(); c.fillStyle = fin ? '#ffd24a' : '#6a5a3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    if (fin) { c.beginPath(); c.moveTo(0, by - 12); c.lineTo(4, by - 2); c.lineTo(0, by + 3); c.lineTo(-4, by - 2); c.closePath(); c.fillStyle = '#fff2b0'; c.fill(); }
    c.restore();
  };
})();
