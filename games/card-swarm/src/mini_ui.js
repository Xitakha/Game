/* mini_ui.js - Iconos de las Insignias de minijefe (trofeo menor, P4.5): trophy_mini_<id> 16x16 -> 32x32, 2 frames (0 = conseguida, 1 = bloqueada / silueta).
   Dibujo simple por código (contorno #1b1124), registrados en Assets._h.reg. Se cargan tras assets_mini2.js. */
(function () {
  'use strict';
  var A = window.Assets; if (!A || !A._h) return;
  var S = 2, OL = '#1b1124';
  function cv() { var c = document.createElement('canvas'); c.width = c.height = 16 * S; var x = c.getContext('2d'); x.scale(S, S); x.lineJoin = 'round'; x.lineCap = 'round'; return [c, x]; }
  var SH = {
    carnero: function (x, f, a) { x.beginPath(); x.moveTo(3, 12); x.bezierCurveTo(1, 5, 7, 1, 11, 4); x.bezierCurveTo(13, 6, 12, 9, 9, 9); x.bezierCurveTo(10, 7, 8, 5, 6, 7); x.bezierCurveTo(5, 9, 6, 11, 3, 12); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); x.fillStyle = a; x.fillRect(4, 10, 3, 1.5); },
    tejedora: function (x, f, a) { x.beginPath(); x.moveTo(8, 14); x.bezierCurveTo(1, 10, 3, 3, 8, 1); x.bezierCurveTo(13, 3, 15, 10, 8, 14); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); x.beginPath(); x.moveTo(8, 3); x.lineTo(8, 13); x.moveTo(8, 7); x.lineTo(5, 5); x.moveTo(8, 9); x.lineTo(11, 7); x.strokeStyle = a; x.stroke(); },
    alcaide: function (x, f, a) { x.beginPath(); x.arc(5, 5, 3.4, 0, 6.283); x.fillStyle = f; x.fill(); x.stroke(); x.beginPath(); x.rect(7, 6.5, 7, 2.4); x.fill(); x.stroke(); x.fillStyle = a; x.fillRect(11, 8.5, 1.6, 3); x.fillRect(13.4, 8.5, 1.4, 2.2); x.fillStyle = OL; x.beginPath(); x.arc(5, 5, 1.2, 0, 6.283); x.fill(); },
    centinela: function (x, f, a) { x.beginPath(); x.moveTo(8, 1); x.bezierCurveTo(14, 6, 13, 13, 8, 15); x.bezierCurveTo(3, 13, 2, 6, 8, 1); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); x.beginPath(); x.moveTo(8, 6); x.bezierCurveTo(11, 9, 10, 12, 8, 13); x.bezierCurveTo(6, 12, 5, 9, 8, 6); x.fillStyle = a; x.fill(); },
    hidra: function (x, f, a) { x.beginPath(); x.moveTo(8, 1.5); x.lineTo(14, 5); x.lineTo(14, 11); x.lineTo(8, 14.5); x.lineTo(2, 11); x.lineTo(2, 5); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); x.beginPath(); x.moveTo(8, 4); x.lineTo(11.5, 6); x.lineTo(11.5, 10); x.lineTo(8, 12); x.lineTo(4.5, 10); x.lineTo(4.5, 6); x.closePath(); x.fillStyle = a; x.fill(); },
    planidera: function (x, f, a) { x.beginPath(); x.moveTo(8, 1); x.bezierCurveTo(14, 8, 13, 14, 8, 14.5); x.bezierCurveTo(3, 14, 2, 8, 8, 1); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); x.beginPath(); x.moveTo(5, 9); x.quadraticCurveTo(8, 12, 11, 9); x.strokeStyle = a; x.stroke(); },
    yeti_mayor: function (x, f, a) { [3.5, 7, 10.5].forEach(function (px, i) { x.beginPath(); x.moveTo(px, 13); x.quadraticCurveTo(px - 1.5, 6 - i % 2, px + 1.5, 2 + i % 2); x.quadraticCurveTo(px + 3, 8, px + 2.5, 13); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); }); x.fillStyle = a; x.fillRect(2, 12.5, 12, 1.6); },
    ventisquero: function (x, f, a) { x.beginPath(); x.moveTo(8, 1); x.lineTo(11, 7); x.lineTo(8, 15); x.lineTo(5, 7); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); x.beginPath(); x.moveTo(8, 3); x.lineTo(9.5, 7); x.lineTo(8, 12); x.lineTo(6.5, 7); x.closePath(); x.fillStyle = a; x.fill(); }
  };
  var COL = { carnero: ['#b8a890', '#6a1f2f'], tejedora: ['#4a7a2a', '#c8e85a'], alcaide: ['#aab4c8', '#ffd23a'], centinela: ['#c4501a', '#ffd23a'], hidra: ['#2f6f6a', '#7be34a'], planidera: ['#2f9a9a', '#e8e4d4'], yeti_mayor: ['#dfe8f2', '#7fe8ff'], ventisquero: ['#9fd8ff', '#eef4fc'] };
  Object.keys(SH).forEach(function (id) {
    var fr = [0, 1].map(function (lock) {
      var o = cv(), c = o[0], x = o[1]; x.lineWidth = 1; x.strokeStyle = OL;
      SH[id](x, lock ? '#3a3046' : COL[id][0], lock ? '#2a2236' : COL[id][1]);
      return c;
    });
    A._h.reg['trophy_mini_' + id] = { name: 'trophy_mini_' + id, w: 16 * S, h: 16 * S, frames: fr, anims: { ok: { f: [0], fps: 1 }, locked: { f: [1], fps: 1 } } };
  });
})();
