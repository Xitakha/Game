/* assets_kits.js - Emblemas y sonidos de los 8 kits semanales del reto diario (DESIGN-v10-retencion.md sección 7). Todo procedural, sin archivos.
   - Assets.kitEmblem(c, id, x, y, size): insignia redonda partida en los colores de las 2 etiquetas del kit (G.TAGS) con un símbolo propio de silueta distinta
     (no solo color): Fragua yunque, Ventisca copo, Pantano gota, Carmesí colmillo, Lana y Hierro escudo, Tempestad rayo, Alquimia matraz, Hogar casa.
     Pensado para 16, 24 y 32 px lógicos (centrado en x, y). Solo dibujo: no toca la simulación.
   - G.Snd.V.kit_<id>: firma corta (< 0,6 s) de cada kit, hecha con el timbre de sus 2 etiquetas (como los sonidos por etiqueta de sfx.js). Suenan solo en menús
     (aviso de kit nuevo en la pestaña del reto, abrir VER KIT y su pestaña), nunca en combate: no tapan telegrafías. Assets.kitSnd(id) los reproduce. */
(function () {
  'use strict';
  var G = window.G, A = window.Assets;
  if (!A || A._kits) return;
  A._kits = true;
  var INK = '#1b1124', PAPER = '#fff6df';
  function tagCol(t) { return (G.TAGS && G.TAGS[t] && G.TAGS[t].color) || '#8a7aa6'; }
  function kitOf(id) { return G.Kit && G.Kit.get ? G.Kit.get(id) : null; }

  // ---- símbolos en coordenadas unidad (-1..1); se rellenan en PAPER con contorno INK
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); }
  var SYM = {
    fragua: function (c) { poly(c, [-0.72, -0.42, 0.72, -0.42, 0.5, -0.12, 0.22, -0.08, 0.22, 0.26, 0.5, 0.56, -0.5, 0.56, -0.22, 0.26, -0.22, -0.08, -0.62, -0.16]); },   // yunque
    ventisca: function (c) {   // copo de 6 brazos (trazo grueso)
      c.beginPath(); for (var k = 0; k < 3; k++) { var a = k * Math.PI / 3 + Math.PI / 2, dx = Math.cos(a) * 0.72, dy = Math.sin(a) * 0.72; c.moveTo(-dx, -dy); c.lineTo(dx, dy); }
      return 'stroke';
    },
    pantano: function (c) { c.beginPath(); c.moveTo(0, -0.74); c.bezierCurveTo(0.2, -0.36, 0.56, -0.06, 0.56, 0.24); c.arc(0, 0.24, 0.56, 0, Math.PI); c.bezierCurveTo(-0.56, -0.06, -0.2, -0.36, 0, -0.74); c.closePath(); },   // gota
    carmesi: function (c) { c.beginPath(); c.moveTo(-0.66, -0.5); c.lineTo(0.66, -0.5); c.quadraticCurveTo(0.5, 0.1, 0.06, 0.74); c.quadraticCurveTo(0.12, 0.1, -0.2, -0.12); c.quadraticCurveTo(-0.5, 0, -0.66, -0.5); c.closePath(); },   // colmillo
    lana: function (c) { c.beginPath(); c.moveTo(-0.6, -0.6); c.lineTo(0.6, -0.6); c.lineTo(0.6, 0); c.quadraticCurveTo(0.56, 0.5, 0, 0.76); c.quadraticCurveTo(-0.56, 0.5, -0.6, 0); c.closePath(); },   // escudo
    tempestad: function (c) { poly(c, [0.18, -0.8, -0.5, 0.1, -0.06, 0.1, -0.22, 0.8, 0.5, -0.16, 0.06, -0.16]); },   // rayo
    alquimia: function (c) { poly(c, [-0.2, -0.74, 0.2, -0.74, 0.2, -0.24, 0.64, 0.6, -0.64, 0.6, -0.2, -0.24]); },   // matraz
    hogar: function (c) { poly(c, [0, -0.78, 0.72, -0.08, 0.5, -0.08, 0.5, 0.66, 0.14, 0.66, 0.14, 0.24, -0.14, 0.24, -0.14, 0.66, -0.5, 0.66, -0.5, -0.08, -0.72, -0.08]); }   // casa (con puerta)
  };
  A.KIT_SYMBOLS = Object.keys(SYM);
  // Insignia: disco partido en diagonal (etiqueta 1 arriba-izquierda, etiqueta 2 abajo-derecha), anillo oscuro, símbolo claro con contorno
  A.kitEmblem = function (c, id, x, y, size) {
    var k = kitOf(id); if (!k || !SYM[id]) return false;
    var r = (size || 16) / 2, lw = Math.max(1.5, r / 6);
    c.save(); c.translate(x, y);
    c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fillStyle = INK; c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, r - lw * 0.6, 0, 6.2832); c.clip();
    c.fillStyle = tagCol(k.tags[0]); c.fillRect(-r, -r, 2 * r, 2 * r);
    c.fillStyle = tagCol(k.tags[1]); c.beginPath(); c.moveTo(r, -r); c.lineTo(r, r); c.lineTo(-r, r); c.closePath(); c.fill();
    c.fillStyle = 'rgba(16,8,24,0.45)'; c.beginPath(); c.arc(0, 0, r * 0.74, 0, 6.2832); c.fill();   // centro oscurecido: el símbolo se lee sobre cualquier color
    c.restore();
    c.save(); c.scale(r * 0.72, r * 0.72);
    var mode = SYM[id](c), u = 1 / (r * 0.72);
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (mode === 'stroke') { c.strokeStyle = INK; c.lineWidth = Math.max(0.42, 4.2 * u); c.stroke(); c.strokeStyle = PAPER; c.lineWidth = Math.max(0.24, 2.2 * u); c.stroke(); }
    else { c.strokeStyle = INK; c.lineWidth = Math.max(0.2, 2.6 * u); c.stroke(); c.fillStyle = PAPER; c.fill(); }
    c.restore();
    c.strokeStyle = k.color || PAPER; c.lineWidth = Math.max(1, r / 10); c.beginPath(); c.arc(0, 0, r - lw * 0.3, 0, 6.2832); c.stroke();   // filo con el color del kit
    c.restore();
    return true;
  };

  // ---- Sonidos (G.Snd, sfx.js): dos golpes cortos con el timbre de cada etiqueta del kit y un remate propio. Duración total < 0,6 s, volumen bajo
  var S = G.Snd;
  if (S && S.V && S.tone && S.hiss) {
    var tone = S.tone, hiss = S.hiss, V = S.V;
    var TAGF = {   // timbre por etiqueta (d = retardo)
      fire: function (d, p) { hiss('lowpass', 1100 * p, 260, 0.16, 0.12, d); tone('sine', 180 * p, 90, 0.14, 0.1, d); },
      ice: function (d, p) { tone('sine', 1760 * p, 1500, 0.16, 0.06, d); tone('triangle', 2640 * p, 2400, 0.1, 0.03, d + 0.02); },
      lightning: function (d, p) { tone('sawtooth', 1200 * p, 260, 0.1, 0.05, d); hiss('highpass', 3200, 1800, 0.08, 0.06, d); },
      poison: function (d, p) { tone('sine', 260 * p, 520, 0.11, 0.08, d); tone('sine', 200 * p, 400, 0.09, 0.06, d + 0.05); },
      blood: function (d, p) { tone('sine', 150 * p, 70, 0.16, 0.12, d); hiss('lowpass', 600, 180, 0.1, 0.07, d); },
      steel: function (d, p) { tone('triangle', 1500 * p, 1300, 0.18, 0.06, d); tone('triangle', 2250 * p, 2000, 0.12, 0.03, d); hiss('bandpass', 4800, 3400, 0.05, 0.06, d); }
    };
    var NOTE = { fragua: 392, ventisca: 659, pantano: 330, carmesi: 294, lana: 349, tempestad: 523, alquimia: 440, hogar: 587 };   // remate: nota propia de cada kit
    Object.keys(NOTE).forEach(function (id) {
      V['kit_' + id] = function () {
        var k = kitOf(id); if (!k) return;
        var f = NOTE[id], a = TAGF[k.tags[0]], b = TAGF[k.tags[1]];
        if (a) a(0, 1); if (b) b(0.12, 1.12);
        tone('triangle', f, f, 0.22, 0.06, 0.24); tone('triangle', f * 1.5, f * 1.5, 0.28, 0.045, 0.3);
      };
    });
  }
  A.kitSnd = function (id) {
    try { if (G.Snd && G.Snd.V && G.Snd.V['kit_' + id] && G.Snd.state && G.Snd.state() === 'running') { G.Snd.play('kit_' + id); return true; } } catch (e) { /* audio opcional */ }
    try { G.sfx('card_select', { vol: 0.6 }); } catch (e2) { /* audio opcional */ }
    return false;
  };
})();
