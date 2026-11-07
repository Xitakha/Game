/* dialog.js - Burbujas de diálogo de la aldea: texto con efecto máquina de escribir (35 car/s), máx. 2 líneas x 38 caracteres por página,
   E / Enter / toque avanza (primero completa la página), y al final hasta 3 opciones (botones de >= 44 px de alto).
   Uso: G.Dialog.say({ name, x, y (ancla en la pantalla, sobre la cabeza del NPC), color }, ['frase 1', 'frase 2'], [{ label, fn }], onEnd) */
(function () {
  'use strict';
  var G = window.G, D = G.Dialog = {}, U = G.UI, inp = G.input;
  var CPS = 35, W = 300, LINE_W = 276, LH = 17;
  var st = null;

  function paginate(texts) {
    var c = G.ctx, pages = [];
    texts.forEach(function (t) {
      var ls = U.wrap(c, t, LINE_W, 12);
      for (var i = 0; i < ls.length; i += 2) pages.push(ls.slice(i, i + 2));
    });
    return pages;
  }

  D.say = function (who, texts, choices, onEnd) {
    st = { who: who, pages: paginate(texts), p: 0, n: 0, choices: choices || [], sel: 0, onEnd: onEnd || null, lastBlip: 0 };
    return st;
  };
  D.active = function () { return !!st; };
  D.close = function () { st = null; };
  function pageLen(s) { return s.pages[s.p].join('\n').length; }
  function done(s) { return s.n >= pageLen(s); }
  function lastPage(s) { return s.p >= s.pages.length - 1; }
  function choiceRect(s, i) {
    var b = box(s), n = s.choices.length, bw = Math.min(104, (W - 4 * (n - 1)) / n);
    return { x: b.x + i * (bw + 4), y: b.y + b.h + 6, w: bw, h: 50 };
  }
  function box(s) {
    var h = 62, x = G.clamp(s.who.x - W / 2, 8, G.W - W - 8), y = s.who.y - h - 4 - (s.choices.length ? 58 : 0);
    return { x: x, y: Math.max(8, y), w: W, h: h };
  }

  function advance() {
    var s = st; if (!s) return;
    if (!done(s)) { s.n = pageLen(s); return; }
    if (!lastPage(s)) { s.p++; s.n = 0; G.sfx('flip', { vol: 0.25 }); return; }
    if (s.choices.length) return;
    var cb = s.onEnd; st = null; if (cb) cb();
  }
  function pick(i) {
    var s = st; if (!s || !s.choices[i] || !done(s) || !lastPage(s)) return;
    var ch = s.choices[i]; st = null; G.sfx('card_select', { vol: 0.5 }); if (ch.fn) ch.fn();
  }

  D.update = function (dt) {
    var s = st; if (!s) return;
    var prev = s.n;
    s.n = Math.min(pageLen(s), s.n + CPS * dt / 1000);
    if (Math.floor(s.n / 3) !== Math.floor(prev / 3) && !done(s)) G.sfx('hit', { pitch: 2.4 + (s.who.pitch || 0), vol: 0.05, vary: 0.2 });
    var m = inp.mouse, click = inp.hit('Mouse0'), i;
    if (inp.hit('Escape')) { if (!s.choices.length || true) { st = null; } return; }
    if (done(s) && lastPage(s) && s.choices.length) {
      if (inp.hit('ArrowRight', 'KeyD')) s.sel = (s.sel + 1) % s.choices.length;
      if (inp.hit('ArrowLeft', 'KeyA')) s.sel = (s.sel + s.choices.length - 1) % s.choices.length;
      for (i = 0; i < s.choices.length; i++) if (inp.hit('Digit' + (i + 1))) { pick(i); return; }
      if (inp.hit('KeyE', 'Enter', 'Space')) { pick(s.sel); return; }
      if (click) for (i = 0; i < s.choices.length; i++) if (U.inR(choiceRect(s, i), m)) { pick(i); return; }
      if (click && U.inR(box(s), m)) return;
      return;
    }
    if (inp.hit('KeyE', 'Enter', 'Space') || (click && U.inR(box(s), m))) advance();
  };

  D.draw = function (c) {
    var s = st; if (!s) return;
    var b = box(s), i, shown = Math.floor(s.n), txt = s.pages[s.p].join('\n').slice(0, shown).split('\n');
    c.save();
    // sombra, caja redondeada y cola
    c.fillStyle = 'rgba(0,0,0,0.4)'; rr(c, b.x + 3, b.y + 4, b.w, b.h, 12); c.fill();
    c.fillStyle = '#fff6df'; c.strokeStyle = '#2a1d3a'; c.lineWidth = 3; rr(c, b.x, b.y, b.w, b.h, 12); c.fill(); c.stroke();
    var tx = G.clamp(s.who.x, b.x + 22, b.x + b.w - 22), ty = b.y + b.h;
    var hasCh = s.choices.length && lastPage(s) && done(s);
    if (!s.choices.length) { c.beginPath(); c.moveTo(tx - 9, ty - 1); c.lineTo(tx, ty + 11); c.lineTo(tx + 9, ty - 1); c.closePath(); c.fillStyle = '#fff6df'; c.fill(); c.stroke(); c.fillRect(0, 0, 0, 0); c.strokeStyle = '#fff6df'; c.lineWidth = 4; c.beginPath(); c.moveTo(tx - 7, ty); c.lineTo(tx + 7, ty); c.stroke(); }
    G.txt(c, s.who.name, b.x + 14, b.y + 13, 11, s.who.color || '#a0481c', 'left', '#fff6df');
    for (i = 0; i < txt.length; i++) {
      c.font = 'bold 12px "Courier New", monospace'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#2a1d3a';
      c.fillText(txt[i], b.x + 14, b.y + 31 + i * LH);
    }
    if (done(s) && !hasCh && !(s.choices.length && lastPage(s))) {   // indicador de continuar
      var bob = Math.sin(Date.now() / 150) * 2;
      c.fillStyle = '#a0481c'; c.beginPath(); c.moveTo(b.x + b.w - 24, b.y + b.h - 15 + bob); c.lineTo(b.x + b.w - 14, b.y + b.h - 15 + bob); c.lineTo(b.x + b.w - 19, b.y + b.h - 8 + bob); c.closePath(); c.fill();
    }
    c.restore();
    if (hasCh) {
      for (i = 0; i < s.choices.length; i++) {
        var r = choiceRect(s, i), on = i === s.sel;
        U.button(c, r, s.choices[i].label, { size: 13, color: on ? '#c4601c' : '#4a3a66', hot: '#ff9a3c', border: on ? '#ffe9a0' : '#8a7aa6' });
      }
    }
  };

  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }
  D.rr = rr;
})();
