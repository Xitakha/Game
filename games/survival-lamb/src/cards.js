/* cards.js - Mejoras (12 cartas) y pantalla de selección entre oleadas. */
(function () {
  'use strict';
  var G = window.G, C = G.Cards = {};
  var RAR = { common: { name: 'Común', color: '#9aa0aa', w: 60 }, rare: { name: 'Rara', color: '#4f9bff', w: 30 }, epic: { name: 'Épica', color: '#b46bff', w: 10 } };
  C.RAR = RAR;

  // max = máximo de copias (1 = no apilable)
  C.defs = [
    { id: 'fang', name: 'Colmillo afilado', rar: 'common', max: 5, icon: 'slash', desc: '+20% de daño melee.', apply: function (p) { p.stats.dmg += 0.2; } },
    { id: 'hooves', name: 'Pezuñas ligeras', rar: 'common', max: 99, icon: 'dust', desc: '+12% de velocidad de movimiento.', apply: function (p) { p.stats.speed += 0.12; } },
    { id: 'wool', name: 'Corazón de lana', rar: 'common', max: 99, icon: 'heart', desc: '+25 vida máxima y cura 25.', apply: function (p) { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
    { id: 'ash', name: 'Pies de ceniza', rar: 'common', max: 5, icon: 'smoke', desc: 'Roll: enfriamiento -150 ms (mín. 400).', apply: function (p) { p.stats.rollCd = Math.max(400, p.stats.rollCd - 150); } },
    { id: 'eye', name: 'Ojo de brasa', rar: 'common', max: 5, icon: 'spark', desc: '+10% de probabilidad de crítico.', apply: function (p) { p.stats.crit += 0.1; } },
    { id: 'hungry', name: 'Brasas hambrientas', rar: 'rare', max: 4, icon: 'ember', desc: 'Cada kill reduce 0,5 s el enfriamiento de la Llama.', apply: function (p) { p.stats.killCdr += 0.5; } },
    { id: 'heavy', name: 'Remate pesado', rar: 'rare', max: 1, icon: 'slash', desc: 'El golpe 3 hace +50% de daño y su arco sube a 160°.', apply: function (p) { p.stats.heavy = true; } },
    { id: 'smoke', name: 'Roll de humo', rar: 'rare', max: 1, icon: 'flame', desc: 'El roll deja una estela de fuego (5 dps) y +60 ms de i-frames.', apply: function (p) { p.stats.smoke = true; } },
    { id: 'wide', name: 'Llama ampliada', rar: 'rare', max: 3, icon: 'explosion', desc: 'La Llama Sagrada: +40% de radio y +15 de daño.', apply: function (p) { p.stats.novaR += 0.4; p.stats.novaDmg += 15; } },
    { id: 'blood', name: 'Sed de sangre', rar: 'epic', max: 3, icon: 'drop', desc: 'Robas el 4% del daño infligido (mín. 1 vida).', apply: function (p) { p.stats.lifesteal += 0.04; } },
    { id: 'twin', name: 'Llama doble', rar: 'epic', max: 1, icon: 'flame2', desc: 'La Llama Sagrada tiene 2 cargas.', apply: function (p) { p.stats.maxCharges = 2; p.charges = Math.min(2, p.charges + 1); } },
    { id: 'comet', name: 'Cometa espectral', rar: 'epic', max: 1, icon: 'fireball', desc: 'Cada 3 s, tu golpe 1 lanza un proyectil de fuego (12 de daño, atraviesa).', apply: function (p) { p.stats.comet = true; } }
  ];

  C.hand = []; C.afterBoss = false; C.t = 0;
  C.reset = function () { C.hand = []; C.t = 0; };

  C.count = function (id) { return (G.player && G.player.cards[id]) || 0; };

  C.roll = function (afterBoss) {
    var pool = C.defs.filter(function (d) { return C.count(d.id) < d.max; });
    var hand = [];
    for (var n = 0; n < 3 && pool.length; n++) {
      var wts = pool.map(function (d) { return afterBoss ? (d.rar === 'common' ? 0 : d.rar === 'rare' ? 70 : 30) : RAR[d.rar].w; });
      var tot = wts.reduce(function (a, b) { return a + b; }, 0);
      if (tot <= 0) wts = wts.map(function () { return 1; }), tot = wts.length;
      var r = Math.random() * tot, idx = 0;
      for (var i = 0; i < wts.length; i++) { r -= wts[i]; if (r <= 0) { idx = i; break; } }
      hand.push(pool[idx]); pool.splice(idx, 1);
    }
    return hand;
  };

  C.open = function (afterBoss) {
    C.afterBoss = afterBoss; C.hand = C.roll(afterBoss); C.t = 0;
    if (!C.hand.length) { G.state = 'play'; G.Waves.next(); return; } // todo conseguido
    G.sfx('card_select', { pitch: 0.7, vol: 0.5 });
  };

  // Geometría de cartas (coordenadas de pantalla)
  C.rect = function (i) { var w = 230, h = 300, gap = 28, x0 = (G.W - (3 * w + 2 * gap)) / 2; return { x: x0 + i * (w + gap), y: 130, w: w, h: h }; };

  C.pick = function (i) {
    var d = C.hand[i]; if (!d) return;
    var p = G.player;
    d.apply(p); p.cards[d.id] = (p.cards[d.id] || 0) + 1;
    G.sfx('card_select');
    C.hand = [];
    G.state = 'play'; G.input.lock = 300;
    G.Waves.next();
  };

  C.update = function (dt) {
    C.t += dt;
    var inp = G.input;
    if (C.t < 250) return; // evita elegir sin querer
    for (var i = 0; i < C.hand.length; i++) {
      if (inp.hit('Digit' + (i + 1), 'Numpad' + (i + 1))) { C.pick(i); return; }
      var r = C.rect(i), m = inp.mouse;
      if (inp.hit('Mouse0') && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) { C.pick(i); return; }
    }
  };

  // Icono de carta (sprites del juego o formas simples)
  C.drawIcon = function (c, name, x, y, sz) {
    var t = G.time || 0;
    c.save();
    if (name === 'heart' || name === 'drop') {
      c.fillStyle = name === 'heart' ? '#ff5a7a' : '#d01830';
      c.beginPath();
      if (name === 'heart') {
        c.moveTo(x, y + sz * 0.35); c.bezierCurveTo(x - sz * 0.6, y - sz * 0.1, x - sz * 0.3, y - sz * 0.5, x, y - sz * 0.2);
        c.bezierCurveTo(x + sz * 0.3, y - sz * 0.5, x + sz * 0.6, y - sz * 0.1, x, y + sz * 0.35);
      } else {
        c.moveTo(x, y - sz * 0.4); c.bezierCurveTo(x + sz * 0.5, y + sz * 0.05, x + sz * 0.35, y + sz * 0.4, x, y + sz * 0.4);
        c.bezierCurveTo(x - sz * 0.35, y + sz * 0.4, x - sz * 0.5, y + sz * 0.05, x, y - sz * 0.4);
      }
      c.fill();
    } else {
      var nm = name === 'flame2' ? 'flame' : name;
      var cv = Assets.sprite(nm, Math.floor(t / 150) % 3);
      var sc = sz / Math.max(cv.width, cv.height) * ((nm === 'spark' || nm === 'ember') ? 0.8 : 1.25);
      c.translate(Math.round(x), Math.round(y)); if (nm === 'slash') c.rotate(0.5); c.scale(sc, sc);
      if (name === 'flame2') { c.drawImage(cv, -cv.width / 2 - 8, -cv.height / 2); c.drawImage(cv, -cv.width / 2 + 8, -cv.height / 2); }
      else c.drawImage(cv, -cv.width / 2, -cv.height / 2);
    }
    c.restore();
  };

  C.draw = function (c) {
    c.save();
    c.fillStyle = 'rgba(8,4,14,0.78)'; c.fillRect(0, 0, G.W, G.H);
    G.txt(c, C.afterBoss ? '¡JEFE DERROTADO!' : 'OLEADA SUPERADA', G.W / 2, 62, 30, '#ffd27a', 'center');
    G.txt(c, 'Elige una mejora  (teclas 1 / 2 / 3 o click)', G.W / 2, 98, 16, '#d8cfe8', 'center');
    var m = G.input.mouse;
    for (var i = 0; i < C.hand.length; i++) {
      var d = C.hand[i], r = C.rect(i), rar = RAR[d.rar];
      var hov = m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
      var lift = hov ? -10 : 0, y = r.y + lift;
      c.fillStyle = hov ? '#2c2142' : '#1d1530'; c.strokeStyle = rar.color; c.lineWidth = hov ? 4 : 3;
      c.fillRect(r.x, y, r.w, r.h); c.strokeRect(r.x, y, r.w, r.h);
      c.fillStyle = rar.color; c.globalAlpha = 0.22; c.fillRect(r.x, y, r.w, 34); c.globalAlpha = 1;
      G.txt(c, rar.name.toUpperCase(), r.x + r.w / 2, y + 17, 14, rar.color, 'center');
      G.txt(c, '[' + (i + 1) + ']', r.x + 22, y + r.h - 18, 16, '#8a7fa0', 'center');
      // icono
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(r.x + r.w / 2, y + 92, 38, 0, 6.283); c.fill();
      C.drawIcon(c, d.icon, r.x + r.w / 2, y + 92, 52);
      G.txt(c, d.name, r.x + r.w / 2, y + 160, 17, '#fff', 'center');
      // descripción con ajuste de línea
      c.font = 'bold 14px "Courier New", monospace';
      var words = d.desc.split(' '), line = '', ly = y + 192;
      for (var k = 0; k < words.length; k++) {
        var test = line ? line + ' ' + words[k] : words[k];
        if (c.measureText(test).width > r.w - 28 && line) { G.txt(c, line, r.x + r.w / 2, ly, 14, '#d8cfe8', 'center'); ly += 20; line = words[k]; } else line = test;
      }
      if (line) G.txt(c, line, r.x + r.w / 2, ly, 14, '#d8cfe8', 'center');
      var have = C.count(d.id);
      if (have > 0) G.txt(c, 'Tienes x' + have, r.x + r.w / 2, y + r.h - 18, 13, '#ffd27a', 'center');
    }
    c.restore();
  };
})();
