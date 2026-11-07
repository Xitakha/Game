/*!
 * assets_tree.js - Arte del ARBOL DE FORJA (Fase 2b) y trofeos de jefe (Karceron, Letea). Solo arte, sin logica.
 * Script clasico que EXTIENDE window.Assets; cargar tras assets.js (usa Assets._h). Contrato: games/card-swarm/ASSETS_API.md, seccion "Arbol de forja (Fase 2b)".
 * Todo dibuja con canvas 2D (sin shadowBlur); iconos centrados y tenibles por color.
 */
(function () {
  'use strict';
  var A = window.Assets, H = A && A._h;
  if (!H) { if (window.console) console.error('assets_tree: falta Assets._h (cargar tras assets.js)'); return; }
  var addV = H.addV, Ppoly = H.Ppoly, Pblob = H.Pblob, Prr = H.Prr, Pcirc = H.Pcirc, OLC = H.OLC, TAU = Math.PI * 2, OUT = '#0c0814';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var TAGC = { fire: '#ff7a2a', ice: '#6ac8ff', lightning: '#ffe45a', poison: '#7be34a', blood: '#d02048', steel: '#b8c0cc', neutral: '#c8b8e8' };
  A.TREE_TAGS = TAGC;
  function col(tag) { return TAGC[tag] || TAGC.neutral; }

  // ===================================================================== iconos (c = ctx trasladado al centro, s = radio, k = color)
  var ICON = {};
  function fs(c, s) { c.lineWidth = Math.max(1.4, s * 0.15); c.stroke(); c.fill(); }
  function path(c, pts) { c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); }
  ICON.root = function (c, s, k) { c.fillStyle = k; path(c, [[0, -s], [s * 0.7, 0], [0, s], [-s * 0.7, 0]]); fs(c, s); c.fillStyle = 'rgba(255,255,255,0.55)'; path(c, [[0, -s * 0.7], [s * 0.3, 0], [0, s * 0.2], [-s * 0.3, 0]]); c.fill(); c.fillStyle = OUT; c.beginPath(); c.arc(0, s * 0.18, s * 0.14, 0, TAU); c.fill(); };
  ICON.card = function (c, s, k) {
    c.save(); c.rotate(-0.22); c.fillStyle = k; c.beginPath(); c.moveTo(-s * 0.6, -s * 0.8); c.lineTo(s * 0.6, -s * 0.8); c.lineTo(s * 0.6, s * 0.8); c.lineTo(-s * 0.6, s * 0.8); c.closePath(); fs(c, s);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-s * 0.4, -s * 0.6, s * 0.8, s * 0.55); c.fillStyle = OUT; c.beginPath(); c.arc(-s * 0.3, -s * 0.58, s * 0.1, 0, TAU); c.fill(); c.restore();
  };
  ICON.upgrade = function (c, s, k) {
    c.fillStyle = k; [[-0.05, 0.1], [0.45, 0.62]].forEach(function (d, i) { path(c, [[-s * 0.8, s * (d[0] + 0.2)], [0, -s * (0.55 - d[0])], [s * 0.8, s * (d[0] + 0.2)], [s * 0.8, s * (d[0] + 0.55)], [0, -s * (0.55 - d[0]) + s * 0.35], [-s * 0.8, s * (d[0] + 0.55)]]); fs(c, s); });
  };
  ICON.passive = function (c, s, k) { c.fillStyle = k; path(c, [[0, -s], [s * 0.28, -s * 0.28], [s, 0], [s * 0.28, s * 0.28], [0, s], [-s * 0.28, s * 0.28], [-s, 0], [-s * 0.28, -s * 0.28]]); fs(c, s); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(-s * 0.1, -s * 0.1, s * 0.16, 0, TAU); c.fill(); };
  ICON.branch = function (c, s, k) {
    c.strokeStyle = OUT; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s * 0.5; c.beginPath(); c.moveTo(0, s * 0.9); c.lineTo(0, 0); c.lineTo(-s * 0.7, -s * 0.7); c.moveTo(0, 0); c.lineTo(s * 0.7, -s * 0.7); c.stroke();
    c.strokeStyle = k; c.lineWidth = s * 0.28; c.stroke(); c.fillStyle = k; c.lineWidth = Math.max(1.4, s * 0.14); c.strokeStyle = OUT;
    [[-s * 0.78, -s * 0.78, -1], [s * 0.78, -s * 0.78, 1]].forEach(function (a) { c.beginPath(); c.moveTo(a[0] + a[2] * s * 0.34, a[1] - s * 0.1); c.lineTo(a[0] - a[2] * s * 0.1, a[1] - s * 0.34); c.lineTo(a[0] - a[2] * s * 0.12, a[1] + s * 0.3); c.closePath(); c.fill(); c.stroke(); });
  };
  ICON.set = function (c, s, k) {
    [[-0.55, 0.35], [0.55, 0.35], [0, -0.55]].forEach(function (p, i) { c.fillStyle = k; c.beginPath(); c.arc(p[0] * s, p[1] * s, s * 0.34, 0, TAU); fs(c, s * 0.8); });
    c.strokeStyle = OUT; c.lineWidth = Math.max(1.2, s * 0.14); c.beginPath(); c.moveTo(-s * 0.2, s * 0.35); c.lineTo(s * 0.2, s * 0.35); c.moveTo(-s * 0.4, s * 0.1); c.lineTo(-s * 0.15, -s * 0.28); c.moveTo(s * 0.4, s * 0.1); c.lineTo(s * 0.15, -s * 0.28); c.stroke();
  };
  ICON.mastery = function (c, s, k) {
    c.fillStyle = k; c.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? s * 0.42 : s, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); fs(c, s);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-s * 0.1, -s * 0.15, s * 0.16, 0, TAU); c.fill();
  };
  ICON.rank = function (c, s, k) { // yunque
    c.fillStyle = k; path(c, [[-s, -s * 0.55], [s * 0.7, -s * 0.55], [s, -s * 0.2], [s * 0.4, -s * 0.05], [s * 0.4, s * 0.35], [s * 0.75, s * 0.8], [-s * 0.75, s * 0.8], [-s * 0.4, s * 0.35], [-s * 0.4, -s * 0.05], [-s, -s * 0.2]]); fs(c, s);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-s * 0.8, -s * 0.48, s * 1.3, s * 0.14);
  };
  ICON.trunk = function (c, s, k) { // tronco con anillos
    c.fillStyle = k; c.beginPath(); c.ellipse(0, 0, s * 0.95, s * 0.8, 0, 0, TAU); fs(c, s);
    c.strokeStyle = OUT; c.lineWidth = Math.max(1, s * 0.1); [0.6, 0.32].forEach(function (r) { c.beginPath(); c.ellipse(0, 0, s * 0.95 * r, s * 0.8 * r, 0, 0, TAU); c.stroke(); }); c.fillStyle = OUT; c.beginPath(); c.arc(0, 0, s * 0.08, 0, TAU); c.fill();
  };
  ICON.tag_fire = function (c, s, k) {
    c.fillStyle = k; c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.35, -s * 0.45, s * 0.55, -s * 0.1); c.quadraticCurveTo(s * 0.95, s * 0.5, 0, s); c.quadraticCurveTo(-s * 0.95, s * 0.5, -s * 0.55, -s * 0.1); c.quadraticCurveTo(-s * 0.4, -s * 0.2, -s * 0.2, -s * 0.5); c.quadraticCurveTo(-s * 0.1, -s * 0.8, 0, -s); c.closePath(); fs(c, s);
    c.fillStyle = 'rgba(255,240,170,0.9)'; c.beginPath(); c.moveTo(0, s * 0.1); c.quadraticCurveTo(s * 0.4, s * 0.4, 0, s * 0.82); c.quadraticCurveTo(-s * 0.4, s * 0.4, 0, s * 0.1); c.fill();
  };
  ICON.tag_ice = function (c, s, k) {
    c.strokeStyle = OUT; c.lineCap = 'round'; for (var pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? k : OUT; c.lineWidth = pass ? s * 0.22 : s * 0.46; c.beginPath(); for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3; c.moveTo(Math.cos(a) * s, Math.sin(a) * s); c.lineTo(-Math.cos(a) * s, -Math.sin(a) * s); } c.stroke(); }
    c.strokeStyle = '#eaf8ff'; c.lineWidth = s * 0.1; c.beginPath(); for (var j = 0; j < 6; j++) { var b = j * Math.PI / 3; c.moveTo(Math.cos(b) * s * 0.55, Math.sin(b) * s * 0.55); c.lineTo(Math.cos(b + 0.5) * s * 0.78, Math.sin(b + 0.5) * s * 0.78); c.moveTo(Math.cos(b) * s * 0.55, Math.sin(b) * s * 0.55); c.lineTo(Math.cos(b - 0.5) * s * 0.78, Math.sin(b - 0.5) * s * 0.78); } c.stroke();
  };
  ICON.tag_lightning = function (c, s, k) { c.fillStyle = k; path(c, [[s * 0.35, -s], [-s * 0.65, s * 0.15], [-s * 0.05, s * 0.2], [-s * 0.4, s], [s * 0.7, -s * 0.25], [s * 0.1, -s * 0.2]]); fs(c, s); c.fillStyle = 'rgba(255,255,255,0.55)'; path(c, [[s * 0.28, -s * 0.78], [-s * 0.3, s * 0.0], [s * 0.05, s * 0.02]]); c.fill(); };
  ICON.tag_poison = function (c, s, k) {
    c.fillStyle = k; c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.2, -s * 0.5, s * 0.6, s * 0.1); c.quadraticCurveTo(s * 0.95, s * 0.8, 0, s); c.quadraticCurveTo(-s * 0.95, s * 0.8, -s * 0.6, s * 0.1); c.quadraticCurveTo(-s * 0.2, -s * 0.5, 0, -s); c.closePath(); fs(c, s);
    c.fillStyle = OUT; c.beginPath(); c.arc(-s * 0.18, s * 0.28, s * 0.14, 0, TAU); c.arc(s * 0.18, s * 0.28, s * 0.14, 0, TAU); c.fill(); c.fillRect(-s * 0.1, s * 0.5, s * 0.2, s * 0.18); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-s * 0.35, -s * 0.05, s * 0.1, s * 0.2, 0.4, 0, TAU); c.fill();
  };
  ICON.tag_blood = function (c, s, k) {
    c.fillStyle = k; c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.9, s * 0.1, s * 0.55, s * 0.55); c.quadraticCurveTo(0, s * 1.1, -s * 0.55, s * 0.55); c.quadraticCurveTo(-s * 0.9, s * 0.1, 0, -s); c.closePath(); fs(c, s);
    c.fillStyle = '#f4ecd8'; path(c, [[-s * 0.3, s * 0.1], [-s * 0.08, s * 0.1], [-s * 0.2, s * 0.55]]); c.fill(); path(c, [[s * 0.08, s * 0.1], [s * 0.3, s * 0.1], [s * 0.2, s * 0.55]]); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-s * 0.3, -s * 0.15, s * 0.1, s * 0.22, 0.4, 0, TAU); c.fill();
  };
  ICON.tag_steel = function (c, s, k) {
    [-1, 1].forEach(function (sg) { c.save(); c.rotate(sg * 0.7); c.fillStyle = k; path(c, [[-s * 0.16, -s], [s * 0.16, -s], [s * 0.16, s * 0.3], [-s * 0.16, s * 0.3]]); fs(c, s * 0.8); c.fillStyle = '#6a4a30'; c.fillRect(-s * 0.4, s * 0.3, s * 0.8, s * 0.14); c.strokeStyle = OUT; c.lineWidth = Math.max(1, s * 0.1); c.strokeRect(-s * 0.4, s * 0.3, s * 0.8, s * 0.14); c.fillRect(-s * 0.1, s * 0.44, s * 0.2, s * 0.5); c.restore(); });
  };
  A.drawTreeIcon = function (ctx, name, x, y, s, o) {
    var fn = ICON[name]; if (!fn) return false; o = o || {}; var tag = name.indexOf('tag_') === 0 ? name.slice(4) : null;
    var k = o.color || (tag ? col(tag) : '#ffffff');
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; if (o.dim) ctx.globalAlpha = 0.4; fn(ctx, s, k); ctx.restore(); return true;
  };
  // sprites: tree_ico_<name> (32x32, blanco, para teñir) y tree_tag_<tag> (48x48, 0 color, 1 apagado)
  ['root', 'card', 'upgrade', 'passive', 'branch', 'set', 'mastery', 'rank', 'trunk'].forEach(function (n) {
    addV('tree_ico_' + n, 16, 16, [function (v) { v.ctx.save(); v.ctx.translate(8, 8); v.ctx.strokeStyle = OUT; ICON[n](v.ctx, 6.6, '#ffffff'); v.ctx.restore(); }], { lw: 1.4 });
  });
  ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel', 'neutral'].forEach(function (tg) {
    function fr(dim) {
      return function (v) {
        var c = v.ctx, k = dim ? '#5a5068' : col(tg);
        c.fillStyle = dim ? '#1c1626' : '#241a32'; c.beginPath(); c.arc(12, 12, 10.6, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.8; c.stroke();
        c.strokeStyle = k; c.lineWidth = 1.3; c.beginPath(); c.arc(12, 12, 9.2, 0, TAU); c.stroke();
        c.save(); c.translate(12, 12); c.strokeStyle = OUT; c.lineJoin = 'round'; c.lineCap = 'round'; (ICON['tag_' + tg] || ICON.trunk)(c, 6, k); c.restore();
      };
    }
    addV('tree_tag_' + tg, 24, 24, [fr(false), fr(true)], { lw: 1.4 }, { lit: { f: [0], fps: 1 }, dim: { f: [1], fps: 1 } });
  });

  // ===================================================================== marco de nodo
  A.drawTreeNode = function (ctx, x, y, o) {
    o = o || {}; var r = o.r || 28, tag = o.tag || 'neutral', k = col(tag), st = o.state || 'locked', type = o.type || 'C', t = o.t != null ? o.t : performance.now(), sel = !!o.sel;
    var owned = st === 'owned', dim = st === 'locked' || st === 'excluded' || !!o.dim, pulse = 0.5 + 0.5 * Math.sin(t / 190), i;
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    function shape(rr) { ctx.beginPath(); if (type === 'R') { for (i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(Math.cos(a) * rr * 1.08, Math.sin(a) * rr * 1.08); } ctx.closePath(); } else ctx.arc(0, 0, rr, 0, TAU); }
    if (st === 'avail') { var g = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r + 16); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, k); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.18 + 0.2 * pulse; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r + 16, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    if (sel) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r + 9 + pulse * 1.5, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, r * 0.86, r * 0.9, r * 0.28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; shape(r + 2.5); ctx.stroke();
    shape(r); var gr = ctx.createLinearGradient(0, -r, 0, r);
    if (owned) { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, k); gr.addColorStop(1, k); } else { gr.addColorStop(0, dim ? '#262032' : '#3a2a50'); gr.addColorStop(1, dim ? '#15101c' : '#241a34'); }
    ctx.fillStyle = gr; ctx.fill();
    if (owned) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(r * 0.18, r * 0.2, r * 0.95, 0, TAU); ctx.save(); shape(r); ctx.clip(); ctx.fill(); ctx.restore(); }
    if (type === 'M') { // mitades A | B
      ctx.save(); shape(r - 3); ctx.clip(); var ch = o.choice;
      ctx.fillStyle = ch === 'A' ? 'rgba(255,243,192,0.95)' : (owned ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.07)'); ctx.fillRect(-r, -r, r, r * 2);
      ctx.fillStyle = ch === 'B' ? 'rgba(255,243,192,0.95)' : (owned ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.13)'); ctx.fillRect(0, -r, r, r * 2); ctx.restore();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -r + 2); ctx.lineTo(0, r - 2); ctx.stroke();
      if (!dim) { ctx.fillStyle = owned ? '#1a1024' : 'rgba(255,255,255,0.55)'; ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', -r * 0.62, -r * 0.66); ctx.fillText('B', r * 0.62, -r * 0.66); }
    }
    ctx.strokeStyle = owned ? '#fff3c0' : (st === 'avail' ? k : (dim ? '#4a4058' : k)); ctx.lineWidth = sel ? 5 : 3.5; ctx.globalAlpha = st === 'avail' ? 0.65 + 0.35 * pulse : 1; shape(r); ctx.stroke(); ctx.globalAlpha = 1;
    if (owned) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r - 5, 3.5, 4.6); ctx.stroke(); var sp = (t / 900) % 1; if (sp < 0.3) { var sa = -2.2, sx = Math.cos(sa) * (r - 4), sy = Math.sin(sa) * (r - 4), ss = 4 * Math.sin(sp / 0.3 * Math.PI); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(sx, sy - ss); ctx.lineTo(sx + ss * 0.3, sy - ss * 0.3); ctx.lineTo(sx + ss, sy); ctx.lineTo(sx + ss * 0.3, sy + ss * 0.3); ctx.lineTo(sx, sy + ss); ctx.lineTo(sx - ss * 0.3, sy + ss * 0.3); ctx.lineTo(sx - ss, sy); ctx.lineTo(sx - ss * 0.3, sy - ss * 0.3); ctx.closePath(); ctx.fill(); } }
    if (type === 'X') { ctx.strokeStyle = dim ? '#4a4058' : k; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (type === 'Ma' || type === 'S') {
      ctx.strokeStyle = dim ? '#4a4058' : '#ffd24a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, r + 5.5, 0, TAU); ctx.stroke();
      if (type === 'Ma') { ctx.fillStyle = dim ? '#4a4058' : '#ffd24a'; for (i = 0; i < 4; i++) { var a = i * Math.PI / 2 + Math.PI / 4; ctx.save(); ctx.translate(Math.cos(a) * (r + 5.5), Math.sin(a) * (r + 5.5)); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-2, -3.4); ctx.lineTo(-2, 3.4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); } }
    }
    if (st === 'locked') { // candado
      var lx = r * 0.66, ly = r * 0.66; ctx.fillStyle = '#6a5a86'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.fillRect(lx - 5, ly - 2, 10, 8); ctx.strokeRect(lx - 5, ly - 2, 10, 8);
      ctx.strokeStyle = '#8a7aa6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly - 2, 3.4, Math.PI, 0); ctx.stroke(); ctx.fillStyle = OUT; ctx.fillRect(lx - 1, ly + 1, 2, 3);
    }
    if (st === 'excluded') { ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.moveTo(r * 0.7, -r * 0.7); ctx.lineTo(-r * 0.7, r * 0.7); ctx.stroke(); ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  };

  // ===================================================================== conectores
  A.drawTreeLink = function (ctx, x0, y0, x1, y1, o) {
    o = o || {}; var st = o.state || 'locked', k = o.color || '#c8b8e8', kind = o.kind || 'and', ins = o.inset == null ? 28 : o.inset, t = o.t != null ? o.t : performance.now();
    var dx = x1 - x0, dy = y1 - y0, d = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / d, uy = dy / d, ax = x0 + ux * ins, ay = y0 + uy * ins, bx = x1 - ux * ins, by = y1 - uy * ins, i;
    if (d <= ins * 2) return;
    ctx.save(); ctx.lineCap = 'round';
    if (kind === 'xor') {
      ctx.setLineDash([2, 7]); ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = st === 'locked' ? '#4a3a5a' : '#ff8a8a'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
    } else if (st === 'owned') {
      ctx.strokeStyle = OUT; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = k; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
      var L = d - ins * 2, n = Math.max(1, Math.floor(L / 34)); ctx.fillStyle = '#fff';
      for (i = 0; i < n; i++) { var u = ((t / 1400) + i / n) % 1; ctx.beginPath(); ctx.arc(ax + (bx - ax) * u, ay + (by - ay) * u, 2.4, 0, TAU); ctx.fill(); }
    } else if (st === 'avail') {
      ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t / 50; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = k; ctx.globalAlpha = 0.85; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = '#3a2f4a'; ctx.lineWidth = 2.4; ctx.stroke();
    }
    if (kind === 'or') { // rombo "o" en el centro
      var mx = (ax + bx) / 2, my = (ay + by) / 2; ctx.fillStyle = st === 'locked' ? '#3a2f4a' : (st === 'owned' ? '#fff3c0' : k); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(mx, my - 5); ctx.lineTo(mx + 5, my); ctx.lineTo(mx, my + 5); ctx.lineTo(mx - 5, my); ctx.closePath(); ctx.stroke(); ctx.fill();
    }
    ctx.restore();
  };

  // ===================================================================== pestanas, destello, iconos de debilidad
  A.drawTreeTab = function (ctx, x, y, tag, o) {
    o = o || {}; var k = col(tag), sel = !!o.sel, t = o.t != null ? o.t : performance.now(), sp = A.sprite('tree_tag_' + (TAGC[tag] ? tag : 'neutral'), sel || !o.dim ? 0 : 1);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = sel ? 'rgba(' + hex(k) + ',0.22)' : 'rgba(20,14,28,0.85)'; ctx.fillRect(0, 0, 48, 48);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.strokeRect(0.5, 0.5, 47, 47); ctx.strokeStyle = sel ? k : '#3a2f4a'; ctx.lineWidth = 2; ctx.strokeRect(2.5, 2.5, 43, 43);
    ctx.drawImage(sp, 0, 0, 48, 48);
    if (sel) { ctx.fillStyle = k; ctx.beginPath(); ctx.moveTo(24, 48); ctx.lineTo(18, 55); ctx.lineTo(30, 55); ctx.closePath(); ctx.fill(); }
    if (o.badge) { ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(41, 7, 8, 0, TAU); ctx.stroke(); ctx.fill(); ctx.fillStyle = '#2a1a00'; ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(o.badge), 41, 7.5); }
    ctx.restore();
  };
  function hex(h) { return parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16); }
  A.drawTreeBurst = function (ctx, x, y, p, color) {
    p = clamp(p, 0, 1); var k = color || '#ffd24a', i; ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = k; ctx.globalAlpha = 1 - p; ctx.lineWidth = 6 * (1 - p) + 1; ctx.beginPath(); ctx.arc(0, 0, 22 + 54 * p, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (i = 0; i < 10; i++) { var a = i * TAU / 10 + 0.3, r0 = 20 + 40 * p, r1 = r0 + 14 * (1 - p); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); }
    ctx.globalAlpha = (1 - p) * 0.5; ctx.fillStyle = k; ctx.beginPath(); ctx.arc(0, 0, 30 * (1 - p) + 8, 0, TAU); ctx.fill(); ctx.restore();
  };
  A.drawWeakIcon = function (ctx, tag, x, y, o) {
    o = o || {}; var sz = o.size || 24, sp = A.sprite('tree_tag_' + (TAGC[tag] ? tag : 'neutral'), o.resist ? 1 : 0), ar = A.sprite(o.resist ? 'icon_resist' : 'icon_weak');
    ctx.drawImage(sp, x, y, sz, sz); if (ar) ctx.drawImage(ar, x + sz - sz * 0.5, y + sz - sz * 0.55, sz * 0.55, sz * 0.55);
    if (o.mult) { ctx.save(); ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.fillStyle = o.resist ? '#cfc8dc' : '#9dffb4'; ctx.strokeText('x' + o.mult, x + sz + 3, y + sz / 2); ctx.fillText('x' + o.mult, x + sz + 3, y + sz / 2); ctx.restore(); }
  };

  // ===================================================================== trofeos de Karceron y Letea: 16x16 base = 32x32. frame 0 normal, 1 ROTO (gris con aspa roja)
  var BONE = '#d8cfae', BONES = '#a89c78', BONEH = '#f2ecd2';
  function badge(v, broken) {
    v.part(Pcirc(8, 8, 7), broken ? '#2c2832' : '#2a2038', { lw: 1.5, ol: OLC, sh: broken ? '#1a1820' : '#18101f', so: 0.8 });
    v.ctx.strokeStyle = broken ? '#6a6272' : '#c8a050'; v.ctx.lineWidth = 0.7; v.ctx.beginPath(); v.ctx.arc(8, 8, 5.9, 0, TAU); v.ctx.stroke();
  }
  function cross(v) {
    var x = v.ctx; x.strokeStyle = OLC; x.lineWidth = 3.2; x.beginPath(); x.moveTo(3, 3); x.lineTo(13, 13); x.moveTo(13, 3); x.lineTo(3, 13); x.stroke();
    x.strokeStyle = '#ff3b30'; x.lineWidth = 1.8; x.stroke();
  }
  function trophy(drawFn) { return [function (v) { badge(v, false); drawFn(v, false); }, function (v) { badge(v, true); v.ctx.save(); v.ctx.globalAlpha = 0.45; drawFn(v, true); v.ctx.restore(); cross(v); }]; }
  var TR = { ok: { f: [0], fps: 1 }, broken: { f: [1], fps: 1 } };
  addV('trophy_karceron_mace', 16, 16, trophy(function (v, b) {
    v.stick([[10.8, 6.4], [5, 13]], 1.6, '#6a4a30', { lw: 0.8, hi: '#9a7048' });
    v.part(Prr(7.4, 2.6, 6.6, 6, 1.2), b ? '#6a6272' : '#3a3044', { lw: 1, sh: '#241c30', hi: '#5a4c6a', so: 0.4 });
    v.ctx.strokeStyle = '#ff6a1a'; v.ctx.lineWidth = 0.6; v.ctx.beginPath(); v.ctx.moveTo(9, 3.4); v.ctx.lineTo(10.4, 6); v.ctx.lineTo(9.4, 8); v.ctx.stroke();
  }), { lw: 1 }, TR);
  addV('trophy_karceron_shackle', 16, 16, trophy(function (v, b) {
    v.ctx.strokeStyle = OLC; v.ctx.lineWidth = 3.4; v.ctx.beginPath(); v.ctx.arc(8, 8.4, 3.8, 0, TAU); v.ctx.stroke(); v.ctx.strokeStyle = b ? '#8a8494' : '#6b7385'; v.ctx.lineWidth = 1.8; v.ctx.stroke();
    v.ctx.strokeStyle = b ? '#aaa4b4' : '#aab4cc'; v.ctx.lineWidth = 0.5; v.ctx.beginPath(); v.ctx.arc(8, 8.4, 3.8, 3.6, 5); v.ctx.stroke();
    v.part(Prr(6, 2.8, 4, 2.6, 0.8), b ? '#8a8494' : '#40475a', { lw: 0.8, so: 0.2 }); v.dot(8, 12.6, 1, b ? '#8a8494' : '#ff6a1a');
  }), { lw: 1 }, TR);
  addV('trophy_karceron_core', 16, 16, trophy(function (v, b) {
    v.part(Ppoly([[8, 2.6], [12.4, 5.4], [12.4, 10], [8, 13.2], [3.6, 10], [3.6, 5.4]]), b ? '#8a7a70' : '#ff6a1a', { lw: 1.1, sh: b ? '#5a4a40' : '#b8340c', hi: b ? '#aa9a90' : '#ff9a4a', so: 0.6 });
    v.part(Ppoly([[8, 5.4], [10.4, 7], [10, 9.6], [8, 11], [6, 9.6], [5.6, 7]]), b ? '#aa9a90' : '#ffd23a', { lw: 0, sh: b ? '#8a7a70' : '#ff9a2a', so: 0.4 }); v.dot(6.8, 6, 0.7, '#fff');
  }), { lw: 1 }, TR);
  addV('trophy_letea_acid', 16, 16, trophy(function (v, b) {
    v.part(Ppoly([[4.4, 3], [11.4, 3.6], [8.6, 12.6]]), b ? '#aaa49a' : '#f4ecd8', { lw: 1, sh: '#c8b898', hi: '#ffffff', so: 0.4 });
    v.part(Pblob(8.4, 12.4, 1.8, 2.2, 861, 0.1, 6), b ? '#8a9a80' : '#7be34a', { lw: 0.8, sh: '#3f8a28', hi: '#d0ff9a', so: 0.3 });
    v.part(Ppoly([[3.6, 2.8], [12.4, 2.8], [12.4, 4.4], [3.6, 4.4]]), b ? '#8a9a80' : '#7be34a', { lw: 0.8, sh: '#3f8a28', so: 0.3 });
  }), { lw: 1 }, TR);
  addV('trophy_letea_ice', 16, 16, trophy(function (v, b) {
    v.part(Pcirc(8, 8, 4.6), b ? '#8a9aaa' : '#6ac8ff', { lw: 1.1, sh: b ? '#5a6a7a' : '#2a78a8', hi: b ? '#c0d0e0' : '#d8f4ff', so: 0.8 });
    v.dot(6.4, 6.2, 1.1, '#ffffff'); v.ctx.strokeStyle = b ? '#c0d0e0' : '#eaf8ff'; v.ctx.lineWidth = 0.5; v.ctx.beginPath(); v.ctx.moveTo(8, 4.6); v.ctx.lineTo(8, 11.4); v.ctx.moveTo(4.8, 8); v.ctx.lineTo(11.2, 8); v.ctx.stroke();
  }), { lw: 1 }, TR);
  addV('trophy_letea_bolt', 16, 16, trophy(function (v, b) {
    v.part(Pblob(8, 8, 5.4, 4.4, 862, 0.03, 9), b ? '#aaa49a' : '#fff6c8', { lw: 1.1, sh: '#d8c878', so: 0.5 });
    v.part(Ppoly([[9.2, 4.2], [6.2, 8.4], [8, 8.4], [6.8, 12], [10.6, 7.4], [8.6, 7.4]]), b ? '#8a8a70' : '#ffe45a', { lw: 0.7, sh: '#b49a1c', so: 0.3 });
  }), { lw: 1 }, TR);
})();
