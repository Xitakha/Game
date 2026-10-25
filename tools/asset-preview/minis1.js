// Vista "Minijefes P4.5 (Bosque y Asfodelo)": anims de ataque/golpe/herido, parte rota (_np), grietas, enrage (tinte), muerte, prueba a 480x270 con 100 enemigos.
(function () {
  var q = new URLSearchParams(location.search); if (q.get('game') !== 'card-swarm') return;
  function init() {
    var A = window.Assets; if (!A || !A.MINI1) return;
    var box = document.createElement('div'); box.id = 'mini1Box';
    box.innerHTML = '<h2>Minijefes P4.5: Bosque y Asfodelo (solo con ?game=card-swarm)</h2><div style="margin-bottom:8px">' +
      '<label>Minijefe <select id="m1Sel"></select></label> <label><input type="checkbox" id="m1Np"> parte rota (_np)</label> ' +
      '<label>Grietas <select id="m1Crack"><option value="-1">sin</option><option value="0">66 %</option><option value="1">33 %</option></select></label> ' +
      '<label><input type="checkbox" id="m1Enr"> enrage (tinte rojo)</label> <label>Zoom <select id="m1Z"><option>1</option><option selected>2</option><option>3</option></select></label> ' +
      '<button id="m1Die">Muerte</button> <span id="m1Cost"></span></div><div id="m1Btns" style="margin-bottom:8px"></div>' +
      '<canvas id="m1Cv" width="960" height="320" style="border:1px solid #444;max-width:100%"></canvas>' +
      '<p class="sub">Prueba de densidad: 480x270 ampliado x2, 100 enemigos de las familias + el minijefe (coste/frame: <span id="m1C2">-</span> ms)</p>' +
      '<canvas id="m1Dn" width="960" height="540" style="border:1px solid #444;max-width:100%"></canvas><div class="grid" id="m1Cards"></div>';
    document.body.appendChild(box);
    var $ = function (id) { return document.getElementById(id); };
    var names = ['enemy_mini_carnero', 'enemy_mini_tejedora', 'enemy_mini_hidra', 'enemy_mini_planidera', 'enemy_mini_pod'];
    names.forEach(function (n) { var o = document.createElement('option'); o.value = n; o.textContent = n.replace('enemy_mini_', ''); $('m1Sel').appendChild(o); });
    var cur = null, dieT = -1, anim = 'idle';
    function base(a) { return a.replace(/_np$/, ''); }
    function btns() {
      $('m1Btns').innerHTML = ''; var n = $('m1Sel').value, it = A.info(n), np = $('m1Np').checked;
      Object.keys(it.anims).forEach(function (a) {
        if (/_np$/.test(a) || a === 'die') return;
        var b = document.createElement('button'); b.textContent = a; b.onclick = function () { anim = a; dieT = -1; }; $('m1Btns').appendChild(b);
      });
      anim = 'idle';
    }
    function pick(n, a, np) { var an = a === 'walk' && !A.hasAnim(n, 'walk') ? 'slither' : a; if (np && A.hasAnim(n, an + '_np')) return an + '_np'; if (np && A.hasAnim(n, 'idle_np') && !A.hasAnim(n, an)) return 'idle_np'; return an; }
    $('m1Sel').onchange = $('m1Np').onchange = btns; $('m1Die').onclick = function () { dieT = performance.now(); };
    // tarjetas con todos los frames
    names.concat(['fx_root_spike', 'fx_mini_thorn_patch', 'fx_horn_shard', 'enemy_mini_hidra_head', 'enemy_mini_hidra_neck', 'fx_mini_crack_carnero', 'fx_mini_crack_tejedora', 'fx_mini_crack_planidera']).filter(function (v, i, a) { return a.indexOf(v) === i; }).forEach(function (n) {
      var it = A.info(n), c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<h3>' + n + '</h3><small>' + it.w / 2 + 'x' + it.h / 2 + ' -> ' + it.w + 'x' + it.h + ', ' + it.frames + ' frames</small>';
      var s = document.createElement('div'); s.className = 'strip';
      for (var i = 0; i < it.frames; i++) { var f = document.createElement('figure'), cv = document.createElement('canvas'), src = A.sprite(n, i); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); f.appendChild(cv); f.appendChild(document.createTextNode(String(i))); s.appendChild(f); }
      c.appendChild(s); $('m1Cards').appendChild(c);
    });
    btns();
    var fam = []; ['FAM1', 'FAM2'].forEach(function (k) { var o = A[k] || {}; Object.keys(o).forEach(function (b) { o[b].forEach(function (n) { if (n.indexOf('enemy_') === 0) fam.push(n); }); }); });
    var sw = [], r = 4242; function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    for (var k = 0; k < 100; k++) { var n = fam[(rnd() * fam.length) | 0], it = A.info(n); sw.push({ n: n, x: 20 + rnd() * 440, y: 40 + rnd() * 220, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 20, ph: rnd() * 999, an: it.anims.walk ? 'walk' : it.anims.swim ? 'swim' : it.anims.slither ? 'slither' : it.anims.fly ? 'fly' : it.anims.float ? 'float' : 'idle' }); }
    var off = document.createElement('canvas'); off.width = 480; off.height = 270; var last = 0, acc = 0, cnt = 0;
    function tint(ctx, f, x, y) { var t = document.createElement('canvas'); t.width = f.width; t.height = f.height; var tx = t.getContext('2d'); tx.drawImage(f, 0, 0); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = 'rgba(255,40,30,0.28)'; tx.fillRect(0, 0, t.width, t.height); ctx2(ctx, t, x, y); }
    function ctx2(c, t, x, y) { c.drawImage(t, x, y); }
    function draw(c, n, t, x, y, z, flip) {
      var np = $('m1Np').checked, a = pick(n, anim, np), f;
      if (dieT >= 0) { var dt = performance.now() - dieT; f = A.animFrame(n, 'die', Math.min(dt, 5 * 111)); if (dt > 1800) dieT = -1; } else f = A.animFrame(n, a, t);
      if ($('m1Enr').checked && dieT < 0) { var t2 = document.createElement('canvas'); t2.width = f.width; t2.height = f.height; var tx = t2.getContext('2d'); tx.drawImage(f, 0, 0); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = 'rgba(255,40,30,0.3)'; tx.fillRect(0, 0, f.width, f.height); f = t2; }
      c.save(); c.translate(x, y); c.scale(flip ? -z : z, z);
      c.drawImage(f, -f.width / 2, -f.height + 4);
      c.restore();
      var cl = +$('m1Crack').value, cn = 'fx_mini_crack_' + n.replace('enemy_mini_', '');
      if (cl >= 0 && !np && dieT < 0 && A.info(cn)) { c.save(); c.translate(x, y); c.scale(flip ? -z : z, z); c.drawImage(A.sprite(cn, cl), -f.width / 2, -f.height + 4); c.restore(); }
    }
    function tick(t) {
      var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; var n = $('m1Sel').value, z = +$('m1Z').value, cv = $('m1Cv'), c = cv.getContext('2d');
      c.fillStyle = '#1a1426'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(480, 296, 40 * z, 9 * z, 0, 0, 6.3); c.fill();
      draw(c, n, t, 480, 300, z, false);
      if (n === 'enemy_mini_hidra' && !$('m1Np').checked && dieT < 0) {
        var nk = A.MINI1.anchors.enemy_mini_hidra.neck, bi = A.info(n), bx = 480 + (nk[0] - bi.w / 2) * z / 2, by = 300 + (nk[1] - bi.h + 4) * z / 2;
        var hx = bx + (anim === 'dive' ? 0 : 20 * z / 2), hy = by - 52 * z / 2, ns = A.sprite('enemy_mini_hidra_neck', 0), i;
        for (i = 1; i <= 3; i++) c.drawImage(ns, bx + (hx - bx) * i / 4 - ns.width * z / 4, by + (hy - by) * i / 4 - ns.height * z / 4, ns.width * z / 2, ns.height * z / 2);
        var hf = A.animFrame('enemy_mini_hidra_head', anim === 'dive' ? 'idle' : (anim === 'tail' ? 'idle' : 'idle'), t), hh = A.MINI1.anchors.enemy_mini_hidra_head.neck;
        c.drawImage(hf, hx - hh[0] * z / 2, hy - hh[1] * z / 2, hf.width * z / 2, hf.height * z / 2);
      }
      c.fillStyle = '#fff'; c.font = '11px monospace'; c.fillText(n + ' / ' + pick(n, anim, $('m1Np').checked) + ($('m1Enr').checked ? ' (enrage)' : ''), 8, 14);
      // densidad
      var p0 = performance.now(), x = off.getContext('2d'); x.fillStyle = '#1a1426'; x.fillRect(0, 0, 480, 270);
      sw.forEach(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; if (s.x < 20 || s.x > 460) s.vx = -s.vx; if (s.y < 40 || s.y > 260) s.vy = -s.vy; var f = A.animFrame(s.n, s.an, t + s.ph); x.save(); x.translate(s.x, s.y); if (s.vx < 0) x.scale(-1, 1); x.drawImage(f, -f.width / 2, -f.height + 4); x.restore(); });
      var f2 = A.animFrame(n, pick(n, 'walk', $('m1Np').checked), t); x.drawImage(f2, 200 - f2.width / 2, 170 - f2.height + 4);
      acc += performance.now() - p0; if (++cnt >= 30) { $('m1C2').textContent = (acc / cnt).toFixed(2); acc = 0; cnt = 0; }
      var d = $('m1Dn').getContext('2d'); d.imageSmoothingEnabled = false; d.drawImage(off, 0, 0, 960, 540);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var g = 'card-swarm';
  if (window.Assets && window.Assets.MINI1) window.addEventListener('load', init);
  else { var s = document.createElement('script'); s.src = '../../games/' + g + '/src/assets_mini1.js'; s.onload = function () { if (document.readyState === 'complete') init(); else window.addEventListener('load', init); }; document.head.appendChild(s); }
})();
