/* manual.js - MANUAL de cartas y combinaciones (G.Manual). Se abre desde la pausa, el Menú de la aldea y Ajustes.
   - Lista todas las cartas (28) y las 15 fusiones, con efecto, niveles, etiquetas, receta, cooldown, daño / duración y consejos. Páginas de 5 entradas con botones o deslizando,
     filtro por etiqueta (un toque cambia) y buscador de texto (ventana nativa: teclado del móvil). Desbloqueo gradual: solo muestra lo descubierto (carta desbloqueada en la forja /
     fusión ya creada), el resto sale como '???'. ?manual=all lo muestra todo.
   - DEMOSTRACIÓN ANIMADA ("video") de cada entrada: escena corta, en bucle y determinista dibujada con el arte de los poderes (G.FusionArt / G.FusionArt2 / G.ManualArt). No hay
     ficheros de vídeo. La demo NO toca la simulación: reloj propio (st.demoT, avanza solo cuando se dibuja, con tope por fotograma), sin G.rng ni Math.random, sin entidades ni
     partículas (solo llamadas de dibujo, <= ~25 por fotograma). Como el arte lee G.time para ondular, se sustituye G.time por el reloj de la demo SOLO durante el dibujo y se restaura
     enseguida (en pausa o en la aldea la simulación no corre). Se pausa sola fuera de pantalla (si no se dibuja, no avanza) y con Reducir destellos (Ajustes > Cinemáticas)
     arranca en pausa sobre un fotograma clave, va a 0,6x, sin destellos de lanzamiento / rayos y con menos opacidad. Respeta Reducir sacudidas (no hay sacudida alguna).
   - Guardado: Save.data.manualSeen { id: 1 } (entradas ya abiertas; marca NUEVO). Se normaliza al cargar, sin subir la versión del guardado.
   API: open(from), close(), isOpen(), update(dt) -> true si hay que cerrar, draw(c), entries(), isKnown(entry), renderDemo(c, entry, t) (puro; pruebas), setQuery(q), setFilter(tag). */
(function () {
  'use strict';
  var G = window.G, M = G.Manual = {}, U = G.UI, inp = G.input, TAU = 6.283185;
  var st = { open: false, from: null, tab: 0, filter: 'all', q: '', page: 0, sel: 0, demoT: 0, last: 0, paused: false, msg: '', modal: null };
  var T = { vw: 440, vh: 248, loop: 5 };
  var VIEW = { x: 292, y: 58, w: 440, h: 248 }, SIDE = { x: 744, y: 58, w: 202, h: 248 }, R_CLOSE = { x: 896, y: 2, w: 60, h: 50 };
  var PER = 5, TAGS = ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel'];
  function tabR(i) { return { x: 14 + i * 136, y: 58, w: 130, h: 44 }; }
  var R_FIL = { x: 14, y: 108, w: 266, h: 44 }, R_SRCH = { x: 14, y: 158, w: 266, h: 44 };
  function rowR(i) { return { x: 14, y: 210 + i * 46, w: 266, h: 42 }; }
  var R_PREV = { x: 14, y: 446, w: 80, h: 44 }, R_NEXT = { x: 200, y: 446, w: 80, h: 44 };
  var ALL = /[?&]manual=all/.test(location.search);
  function SV() { return G.Save.data; }
  function tagName(t) { return (G.TAGS[t] || { name: t }).name; }
  function tagCol(t) { return (G.TAGS[t] || { color: '#c8c0d8' }).color; }
  function fmt(n) { return String(n).replace('.', ','); }

  // ------------------------------------------------------------- Datos de las entradas
  // Cifras de los poderes tal como están en README / fusion.js (R.lv). cd en segundos.
  var FX = {
    vapor: { n1: 'Nube de radio 90 durante 4 s en el grupo más denso: ciega (a élites y jefes les hace +20 % de daño), ralentiza 30 % y hace 6 de daño cada 0,25 s.', n2: 'Radio 110, 5 s, 8 por tick.',
      tip: 'Lánzala sobre la horda que te rodea: aguanta 4 s y te da aire para esquivar. Combina muy bien con Rayo en el básico.' },
    plasma: { n1: 'Rayo perforante (largo 260, ancho 14) que gira 180 grados/s durante 2,5 s: 10 de daño cada 0,14 s, hasta 12 objetivos, y quema.', n2: '3,5 s y ancho 20 (12 por tick).',
      tip: 'Colócate para que el barrido pase por el grupo y por el jefe. Mientras gira puedes seguir andando.' },
    gas: { n1: 'Granada que deja una nube de gas de radio 80 durante 5 s (+1 veneno cada 0,5 s) y detona al final: 45 de daño y quema.', n2: 'Radio 100 y detonación de 70 + 6 por cada stack de veneno.',
      tip: 'Cuanto más se quede el enemigo dentro, más veneno acumula y más fuerte detona. Ideal contra enemigos lentos y el jefe quieto.' },
    sed: { n1: '3 dagas orbitan 6 s (8 por contacto, sangrado). Tu básico dispara un 40 % más rápido y cada 5 golpes curas 1 HP (máx. 6).', n2: '8 s y hasta 10 HP de curación.',
      tip: 'Es tu poder de supervivencia: úsalo cuando haya muchos enemigos cerca para acumular golpes y curarte.' },
    tormenta: { n1: 'Zona de radio 110 que te sigue 5 s: ralentiza 40 % y cada 0,5 s cae un rayo de 18 (x1,5 sobre ralentizados) que aturde 0,5 s. Sin ralentizados, cae al azar.', n2: 'Radio 130, 7 s y 24 de daño.',
      tip: 'Funciona mejor con Hielo en el básico: lo ralentizado recibe el rayo reforzado.' },
    escarcha: { n1: '3 esporas heladas explotan (radio 50, 14 de daño, ralentizan 50 % y aplican 2 stacks). El veneno dura +3 s en ralentizados y salta a 3 enemigos al morir.', n2: '5 esporas y 18 de daño.',
      tip: 'Excelente contra hordas: un solo enemigo envenenado que muera contagia a los de al lado.' },
    pacto: { n1: 'Pagas el 12 % de tu vida (nunca bajas de 20) y estallas en una nova de radio 120 (30 + 0,8 x vida pagada), con quemadura y empuje. Después +25 % de daño 6 s.', n2: 'Pagas 10 %, nova de 45 y bonus de 8 s.',
      tip: 'No lo uses con poca vida. Ideal para abrirte paso y encadenar un buen momento de daño.' },
    iman: { n1: 'Tira de los enemigos pequeños 1,2 s (radio 150), destruye las flechas durante 3 s y descarga 3 cadenas de 3 saltos (20 de daño). Aturde 0,4 s (no a los jefes).', n2: 'Radio 190, 5 saltos y tirón de 1,8 s.',
      tip: 'Agrupa la horda para que Vapor, Gas o Tóxica den más resultado. También sirve para cortar un aluvión de flechas.' },
    forja: { n1: 'Hacha gigante incandescente, ida y vuelta (3 s): perfora, 35 de daño por pasada y quema. Ignora el escudo frontal y rompe placas.', n2: '2 hachas y 45 de daño.',
      tip: 'La respuesta a los escudos. Lánzala en línea recta hacia el enemigo acorazado: pega a la ida y a la vuelta.' },
    filo: { n1: 'Abanico de 7 lanzas de hielo (alcance 220, 16 de daño cada una). Crítico x2 contra enemigos ralentizados.', n2: '12 lanzas y 20 de daño.',
      tip: 'Dispara de cerca para que impacten varias lanzas a la vez. Con Hielo en el básico, casi todo es crítico.' },
    hemo: { n1: 'Marca hasta 6 enemigos durante 6 s: sangrado y veneno. Al morir curan 2 HP y propagan el veneno.', n2: '9 marcas y curan 3 HP.',
      tip: 'Márcalos antes de pelear: te curas con cada baja y el veneno salta al resto.' },
    descarga: { n1: 'Un rayo cae sobre cada enemigo envenenado visible: 12 + 8 por stack, y consume el veneno.', n2: '12 + 12 por stack.',
      tip: 'Primero envenena (Dardo, Gas, Tóxica) y después descarga: cuantos más stacks, más daño. Fantástica contra el jefe envenenado.' },
    cristal: { n1: 'Coraza de cristal carmesí de 30 PV durante 6 s: ralentiza a quien te toca y, al romperse, estalla en esquirlas heladas (radio 100, 20 de daño).', n2: '45 PV, 8 s, 30 de daño y radio 120.',
      tip: 'Úsalo justo antes de un golpe fuerte: absorbe y devuelve daño. Si se rompe, las esquirlas despejan a tu alrededor.' },
    zancada: { n1: 'Embestida eléctrica de 180 px: invulnerable un instante, 24 de daño a lo que cruzas, cura 4 HP y deja una estela que aturde.', n2: '240 px, 30 de daño, 2 cargas y cura 6.',
      tip: 'Es tu esquiva ofensiva: atraviesa los ataques del jefe (aviso rojo) y sal con el enemigo aturdido a tu espalda.' },
    virote: { n1: 'Virote al enemigo más fuerte: atraviesa 3, hace 55 de daño, envenena y oxida su armadura (+20 % de daño recibido durante 6 s).', n2: 'Atraviesa 5, 80 de daño, +25 % durante 8 s.',
      tip: 'Dispáralo al jefe o al élite y aprovecha esos 6 s de vulnerabilidad con tus otros poderes.' }
  };
  var TAGTIP = {
    fire: 'Fuego: quema. Va bien contra jefes con mucha vida y para llevar Vapor, Plasma, Gas, Pacto o Forja.',
    ice: 'Hielo: ralentiza. Sube el daño de Filo, Tormenta y Escarcha; imprescindible para esquivar.',
    lightning: 'Rayo: encadena. Reparte daño entre la horda y alimenta Plasma, Tormenta, Imán, Descarga y Zancada.',
    poison: 'Veneno: daño con el tiempo. Apila stacks que luego consumen Descarga tóxica o potencia el Gas.',
    blood: 'Sangre: cura al golpear. Mantiene vivo el build y da Sed de hierro, Pacto, Hemotoxina, Cristal o Zancada.',
    steel: 'Acero: atraviesa y críticos. Es el mejor contra escudos y enemigos blindados (Forja, Filo, Imán, Virote).'
  };
  var INF = { fire: 'Quema (3 dps). Nv3: el impacto explota.', ice: 'Ralentiza 25 %. Nv3: congela 0,5 s la 1.ª vez.', lightning: 'Encadena 1 salto (-20 %). Nv3: 2 saltos.',
    poison: 'Aplica 1 stack de veneno (apila 3).', blood: '20 % de curar 1 HP al impactar. Nv3: sangrado.', steel: 'Atraviesa 1 enemigo y 10 % de crítico. Nv3: atraviesa 2.' };

  var cache = null;
  M.entries = function () {
    if (cache) return cache;
    var out = [];
    G.Cards.defs.forEach(function (d) { if (d.id) out.push({ k: 'card', id: d.id, name: d.name, tag: d.tag, def: d }); });
    G.Fusion.recipes.forEach(function (r) { out.push({ k: 'fx', id: r.id, name: r.name, tag: r.a, tag2: r.b, rec: r }); });
    return (cache = out);
  };
  M.isKnown = function (e) {
    if (ALL) return true;
    if (e.k === 'card') return !!G.Fusion.unlockedCard(e.id);
    var cs = SV().combosSeen || {}; return !!cs[e.id];
  };
  function visible() {
    var q = st.q.trim().toLowerCase();
    return M.entries().filter(function (e) {
      if ((e.k === 'card' ? 0 : 1) !== st.tab) return false;
      if (st.filter !== 'all' && e.tag !== st.filter && e.tag2 !== st.filter) return false;
      if (q) { if (!M.isKnown(e)) return false; var d = e.k === 'card' ? e.def.desc : e.rec.desc + ' ' + (FX[e.id] ? FX[e.id].n1 : ''); return (e.name + ' ' + tagName(e.tag) + ' ' + (e.tag2 ? tagName(e.tag2) : '') + ' ' + d).toLowerCase().indexOf(q) >= 0; }
      return true;
    });
  }
  function counts() { var n = 0, t = 0; M.entries().forEach(function (e) { t++; if (M.isKnown(e)) n++; }); return { n: n, t: t }; }
  function seenMark(e) { var S = SV(); if (!S.manualSeen) S.manualSeen = {}; if (!S.manualSeen[e.id]) { S.manualSeen[e.id] = 1; try { G.Save.save(); } catch (x) { /* sin guardado */ } } }
  function isNew(e) { return M.isKnown(e) && !(SV().manualSeen || {})[e.id]; }
  function calm() { try { return !!G.Cine.cfg().calm; } catch (e) { return false; } }

  // ------------------------------------------------------------- Apertura / cierre
  M.open = function (from) {
    st.open = true; st.from = from || null; st.demoT = 0; st.last = 0; st.msg = ''; st.modal = null; st.paused = calm(); st.sel = 0; st.page = 0;
    if (st.q === undefined) st.q = '';
  };
  M.close = function () { st.open = false; if (st.modal) { try { st.modal.close(); } catch (e) { /* ya cerrado */ } st.modal = null; } };
  M.isOpen = function () { return st.open; };
  M.setQuery = function (q) { st.q = q || ''; st.page = 0; st.sel = 0; };
  M.setFilter = function (t) { st.filter = t; st.page = 0; st.sel = 0; };
  M.setTab = function (n) { st.tab = n; st.page = 0; st.sel = 0; };
  M.state = function () { return { tab: st.tab, filter: st.filter, q: st.q, page: st.page, sel: st.sel, demoT: st.demoT, paused: st.paused, n: visible().length }; };
  M.select = function (i) { var l = visible(); st.sel = G.clamp(i, 0, Math.max(0, l.length - 1)); st.page = Math.floor(st.sel / PER); st.demoT = 0; };
  function pages() { return Math.max(1, Math.ceil(visible().length / PER)); }
  function go(i) { var l = visible(); if (!l.length) return; M.select((i + l.length) % l.length); G.sfx('flip', { vol: 0.3 }); }
  function search() {
    if (!G.Sys || !G.Sys.modal) return;
    st.modal = G.Sys.modal({ title: 'Buscar en el Manual', text: 'Escribe una palabra (fuego, veneno, escudo...). Solo busca en lo descubierto.', area: { value: st.q, placeholder: 'buscar...' }, buttons: [
      { label: 'BUSCAR', color: '#2a8a4a', fn: function (ta) { M.setQuery(ta ? ta.value.replace(/\s+/g, ' ').slice(0, 24) : ''); } },
      { label: 'LIMPIAR', fn: function () { M.setQuery(''); } }, { label: 'CANCELAR' }] });
  }

  M.update = function (dt) {
    if (st.modal && st.modal.box && !st.modal.box.parentNode) st.modal = null;
    if (st.modal) return false;
    var m = inp.mouse, hit = inp.hit('Mouse0'), l = visible(), i;
    if (inp.hit('Escape') || (hit && U.inR(R_CLOSE, m))) return true;
    if (inp.hit('ArrowRight', 'KeyD') || inp.swipe < 0) go(st.sel + 1);       // deslizar a la izquierda = siguiente
    if (inp.hit('ArrowLeft', 'KeyA') || inp.swipe > 0) go(st.sel - 1);
    if (inp.hit('ArrowDown', 'KeyS')) go(st.sel + 1);
    if (inp.hit('ArrowUp', 'KeyW')) go(st.sel - 1);
    if (inp.hit('KeyQ', 'KeyE', 'Tab')) { M.setTab(1 - st.tab); G.sfx('flip', { vol: 0.4 }); }
    if (inp.hit('KeyF')) { var fi = TAGS.indexOf(st.filter); M.setFilter(fi + 1 >= TAGS.length ? 'all' : TAGS[fi + 1]); }
    if (inp.hit('Space')) st.paused = !st.paused;
    if (!hit) return false;
    for (i = 0; i < 2; i++) if (U.inR(tabR(i), m)) { M.setTab(i); G.sfx('flip', { vol: 0.4 }); return false; }
    if (U.inR(R_FIL, m)) { var k = TAGS.indexOf(st.filter); M.setFilter(k + 1 >= TAGS.length ? 'all' : TAGS[k + 1]); G.sfx('flip', { vol: 0.4 }); return false; }
    if (U.inR(R_SRCH, m)) { search(); return false; }
    if (U.inR(R_PREV, m)) { st.page = (st.page + pages() - 1) % pages(); st.sel = st.page * PER; st.demoT = 0; return false; }
    if (U.inR(R_NEXT, m)) { st.page = (st.page + 1) % pages(); st.sel = st.page * PER; st.demoT = 0; return false; }
    for (i = 0; i < PER; i++) { var idx = st.page * PER + i; if (idx < l.length && U.inR(rowR(i), m)) { st.sel = idx; st.demoT = 0; G.sfx('flip', { vol: 0.3 }); return false; } }
    if (U.inR(VIEW, m)) st.paused = !st.paused;
    return false;
  };

  // ------------------------------------------------------------- Escenas de la demo (dibujo puro, función del tiempo t en segundos)
  var P0 = { x: 90, y: 178 };
  function ease(u) { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  // posiciones deterministas de la horda (sin azar): rejilla desordenada por una fórmula
  function crowd(n, cx, cy, spread) { var o = [], i; for (i = 0; i < n; i++) { var a = i * 2.399 + 0.5, r = spread * Math.sqrt((i + 0.6) / n); o.push({ x: cx + Math.cos(a) * r * 1.25, y: cy + Math.sin(a) * r * 0.7 }); } return o; }
  function Kit(c, t, calmMode) {
    var A1 = G.FusionArt, A2 = G.FusionArt2 || {}, MA = G.ManualArt;
    return {
      c: c, t: t, calm: calmMode, A1: A1, A2: A2, MA: MA,
      player: function (x, y) { MA.player(c, x == null ? P0.x : x, y == null ? P0.y : y, t); },
      enemy: function (x, y, tint, sc) { MA.enemy(c, x, y, t, tint, sc); },
      st: function (kind, x, y) { if (A2.status) A2.status(c, kind, x, y - 12, 11, t); },
      pop: function (x, y, s, col, t0) { var u = (t - t0) / 0.8; if (u < 0 || u > 1) return; c.save(); c.globalAlpha = 1 - u * u; G.txt(c, s, Math.round(x), Math.round(y - 22 - u * 18), 13, col || '#fff', 'center'); c.restore(); },
      flash: function (fn) { if (!calmMode) fn(); },
      sorted: function (list, fn) { list.slice().sort(function (a, b) { return a.y - b.y; }).forEach(fn); }
    };
  }
  function ring(c, x, y, r, col, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.stroke(); c.restore(); }
  function disc(c, x, y, r, col, a) { c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.fill(); c.restore(); }
  function near(a, b, d) { return Math.hypot(a.x - b.x, (a.y - b.y) * 1.6) < d; }

  var SCENE = {};
  // ----- 15 fusiones
  SCENE.vapor = function (K) {
    var t = K.t, en = crowd(6, 330, 170, 46), u = ease((t - 0.9) / 0.4) * (t > 4.5 ? clamp01((5 - t) / 0.5) : 1);
    K.sorted(en, function (e, i) { K.enemy(e.x + Math.sin(t * 2 + i) * 3 - (t > 1 ? 0 : t * 10), e.y, t > 1.2 ? '#6ac8ff' : null); });
    K.player();
    if (t > 0.3 && t < 0.9) { var q = (t - 0.3) / 0.6, gx = lerp(P0.x, 330, q), gy = lerp(P0.y - 20, 165, q) - Math.sin(q * Math.PI) * 60; K.A1.nade(K.c, gx, gy, q * 12); }
    if (u > 0) K.A1.cloud(K.c, 330, 168, 90, t, 'vapor', u);
    if (t > 1.2 && t < 4.5) { for (var i = 0; i < 3; i++) K.pop(en[i].x, en[i].y, '6', '#bfeaff', 1.3 + ((t - 1.3) > 0 ? Math.floor((t - 1.3) / 0.75) * 0.75 : 0) + i * 0.25); K.st('blind', en[0].x, en[0].y); K.st('slow', en[2].x, en[2].y); }
    return 'Vapor: la nube ciega y ralentiza al grupo';
  };
  SCENE.plasma = function (K) {
    var t = K.t, en = [{ x: 250, y: 120 }, { x: 290, y: 150 }, { x: 330, y: 178 }, { x: 300, y: 205 }, { x: 360, y: 140 }, { x: 345, y: 214 }], act = t > 0.5 && t < 3.0, ang = -0.75 + 3.14 * clamp01((t - 0.5) / 2.5) * 0.85;
    K.sorted(en, function (e) { var hit = act && Math.abs(Math.atan2((e.y - P0.y + 20) / 1, e.x - P0.x) - ang) < 0.22; K.enemy(e.x, e.y, hit ? '#ff8a2a' : null); if (hit) K.st('burn', e.x, e.y); });
    K.player();
    if (act) K.A1.beam(K.c, P0.x + 10, P0.y - 20, P0.x + 10 + Math.cos(ang) * 260, P0.y - 20 + Math.sin(ang) * 260, 14, t);
    return 'Plasma: el rayo gira 2,5 s y perfora a todos';
  };
  SCENE.gas = function (K) {
    var t = K.t, en = crowd(5, 330, 172, 44);
    K.sorted(en, function (e, i) { K.enemy(e.x, e.y, t > 1.3 && t < 4 ? '#7be34a' : null); });
    K.player();
    if (t > 0.3 && t < 1) { var q = (t - 0.3) / 0.7; K.A1.nade(K.c, lerp(P0.x, 330, q), lerp(P0.y - 20, 165, q) - Math.sin(q * Math.PI) * 70, q * 14); }
    if (t > 1 && t < 4) K.A1.cloud(K.c, 330, 170, 80, t, 'gas', ease((t - 1) / 0.4) * (t > 3.6 ? clamp01((4 - t) / 0.4) : 1));
    if (t > 1.5 && t < 4) { K.st('poison', en[0].x, en[0].y); K.st('poison', en[3].x, en[3].y); K.pop(en[1].x, en[1].y, '+1 veneno', '#9bff5a', Math.floor(t * 2) / 2); }
    if (t >= 4 && t < 4.6) { var u = (t - 4) / 0.6; K.A2.nova(K.c, 330, 168, 80, u, 'pact'); K.pop(330, 150, '45', '#ffb347', 4); }
    return 'Gas: la nube envenena y al final detona';
  };
  SCENE.sed = function (K) {
    var t = K.t, base = [{ x: 330, y: 150 }, { x: 350, y: 190 }, { x: 300, y: 210 }, { x: 380, y: 215 }], en = base.map(function (b, i) { var u = ease((t - 0.3 - i * 0.2) / 2.2); return { x: lerp(b.x, P0.x + 52 + i * 8, u), y: lerp(b.y, P0.y - 10 + i * 6, u) }; });
    K.sorted(en, function (e) { K.enemy(e.x, e.y, near(e, { x: P0.x, y: P0.y }, 78) ? '#d02048' : null); });
    K.player();
    if (t > 0.3) for (var i = 0; i < 3; i++) { var a = t * 5 + i * 2.094; K.A1.dagger(K.c, P0.x + Math.cos(a) * 42, P0.y - 20 + Math.sin(a) * 26, a + 1.57); }
    if (t > 2.3) { K.st('bleed', en[0].x, en[0].y); K.pop(P0.x, P0.y, '+1 HP', '#ff7a8a', 3.2); K.pop(en[1].x, en[1].y, '8', '#ff7a8a', 2.6); }
    return 'Sed de hierro: 3 dagas orbitan, sangran y te curan';
  };
  SCENE.tormenta = function (K) {
    var t = K.t, en = [{ x: 250, y: 160 }, { x: 290, y: 200 }, { x: 230, y: 215 }, { x: 175, y: 140 }].map(function (e, i) { return { x: e.x - Math.min(t, 3) * (14 + i * 3), y: e.y }; });
    if (t > 0.3 && t < 4.7) K.A2.storm(K.c, P0.x, P0.y - 8, 110, t, ease((t - 0.3) / 0.4) * (t > 4.3 ? clamp01((4.7 - t) / 0.4) : 1));
    K.sorted(en.concat([{ x: 0, y: 0 }]).slice(0, 4), function (e) { var inz = near(e, { x: P0.x, y: P0.y - 8 }, 110); K.enemy(e.x, e.y, inz ? '#6ac8ff' : null); });
    K.player();
    if (t > 1.0 && t < 4.5) { var k = Math.floor((t - 1) / 0.5), u = ((t - 1) % 0.5) / 0.4, e = en[k % 4]; if (u < 1) K.flash(function () { K.A2.strike(K.c, e.x, e.y, u, false); }); K.st('stun', en[(k + 1) % 4].x, en[(k + 1) % 4].y); K.pop(e.x, e.y, '18', '#8fe0ff', 1 + k * 0.5); }
    return 'Tormenta de escarcha: zona que te sigue y rayos sobre lo ralentizado';
  };
  SCENE.escarcha = function (K) {
    var t = K.t, en = [{ x: 300, y: 150 }, { x: 340, y: 185 }, { x: 290, y: 205 }, { x: 375, y: 150 }], tg = [en[0], en[1], en[2]];
    K.sorted(en, function (e, i) { var dead = i === 0 && t > 3.2 && t < 3.7; if (!(i === 0 && t > 3.7)) K.enemy(e.x, e.y, t > 1.4 ? '#a8e86a' : null, dead ? 0.7 : 1); });
    K.player();
    tg.forEach(function (e, i) { if (t > 0.3 && t < 1.2) { var q = (t - 0.3) / 0.9; K.A2.spore(K.c, lerp(P0.x, e.x, q), lerp(P0.y - 20, e.y - 8, q) - Math.sin(q * Math.PI) * 40, t, 8); } else if (t >= 1.2 && t < 1.7) K.A2.sporeBurst(K.c, e.x, e.y - 8, 50, (t - 1.2) / 0.5); });
    if (t > 1.5 && t < 5) { K.st('slow', en[0].x, en[0].y); K.st('poison', en[1].x, en[1].y); K.st('poison', en[2].x, en[2].y); }
    if (t > 3.4 && t < 4.6) { K.st('poison', en[3].x, en[3].y); ring(K.c, en[0].x, en[0].y, lerp(10, 60, (t - 3.4) / 1.2), '#a8e86a', 1 - (t - 3.4) / 1.2); }
    return 'Escarcha tóxica: esporas que ralentizan y el veneno salta al morir';
  };
  SCENE.pacto = function (K) {
    var t = K.t, en = crowd(5, 300, 175, 50).map(function (e) { var kb = ease((t - 0.7) / 0.5) * 30; return { x: e.x + kb, y: e.y }; });
    K.sorted(en, function (e) { K.enemy(e.x, e.y, t > 0.8 ? '#ff7a2a' : null); });
    K.player();
    if (t > 1) K.A2.aura(K.c, P0.x, P0.y - 14, t, 1, 26);
    if (t > 0.3 && t < 0.7) K.flash(function () { K.A2.cast(K.c, 'pacto', P0.x, P0.y - 14, (t - 0.3) / 0.4); });
    if (t > 0.6 && t < 1.2) K.A2.nova(K.c, P0.x, P0.y - 8, 120, (t - 0.6) / 0.6, 'pact');
    K.pop(P0.x, P0.y - 6, '-12 % PV', '#ff6a6a', 0.3); K.pop(en[0].x, en[0].y, '30', '#ffb347', 0.9); K.pop(P0.x + 30, P0.y - 30, '+25 % daño', '#ffe9a0', 1.6);
    return 'Pacto ardiente: pagas vida, estallas y ganas +25 % de daño';
  };
  SCENE.iman = function (K) {
    var t = K.t, base = [{ x: 330, y: 130 }, { x: 380, y: 170 }, { x: 340, y: 215 }, { x: 260, y: 120 }, { x: 395, y: 215 }], pu = ease((t - 0.6) / 2), en = base.map(function (b, i) { return { x: lerp(b.x, P0.x + 65 + (i % 2) * 14, pu), y: lerp(b.y, P0.y - 14 + i * 5 - 10, pu) }; });
    if (t > 0.3 && t < 3.4) K.A2.magnet(K.c, P0.x, P0.y - 14, 150, t, ease((t - 0.3) / 0.3) * (t > 3.1 ? clamp01((3.4 - t) / 0.3) : 1));
    K.sorted(en, function (e) { K.enemy(e.x, e.y, null); });
    K.player();
    if (t > 2.4 && t < 3.6) K.A2.chain(K.c, [{ x: P0.x + 10, y: P0.y - 20 }, { x: en[0].x, y: en[0].y - 12 }, { x: en[1].x, y: en[1].y - 12 }, { x: en[2].x, y: en[2].y - 12 }], t, '255,255,160');
    if (t > 2.5 && t < 4) K.st('stun', en[0].x, en[0].y);
    if (t > 2.5 && t < 3.4) K.pop(en[1].x, en[1].y, '20', '#d0d8ff', 2.5);
    return 'Imán: tira de la horda y la electrocuta en cadena';
  };
  SCENE.forja = function (K) {
    var t = K.t, en = [{ x: 220, y: 150 }, { x: 270, y: 180 }, { x: 330, y: 160 }, { x: 380, y: 200 }, { x: 310, y: 215 }], u = clamp01((t - 0.4) / 3), ax = P0.x + 20 + 300 * Math.sin(u * Math.PI), ay = P0.y - 26 + Math.sin(u * 6.28) * 6;
    K.sorted(en, function (e) { var hit = u > 0 && u < 1 && Math.abs(e.x - ax) < 26; K.enemy(e.x, e.y, hit ? '#ff8a2a' : null); if (hit) { K.st('burn', e.x, e.y); } });
    K.player();
    if (u > 0 && u < 1) { K.A2.axe(K.c, ax, ay, t, 1); en.forEach(function (e) { if (Math.abs(e.x - ax) < 22) K.flash(function () { K.A2.impact(K.c, 'forja', e.x, e.y - 14, 0.4, 14); }); }); }
    if (u > 0.2 && u < 0.45) K.pop(en[2].x, en[2].y, '35', '#ffb347', 1.4 + 0);
    return 'Forja: el hacha va y vuelve, perfora y quema';
  };
  SCENE.filo = function (K) {
    var t = K.t, en = [{ x: 300, y: 130 }, { x: 330, y: 160 }, { x: 350, y: 190 }, { x: 320, y: 215 }, { x: 395, y: 170 }], u = clamp01((t - 0.5) / 0.9);
    K.sorted(en, function (e, i) { K.enemy(e.x, e.y, u >= 1 && t < 4 ? '#bfefff' : null); });
    K.player();
    if (t > 0.3 && t < 0.9) K.A2.fan(K.c, P0.x + 14, P0.y - 20, 0, 2.09, 220, (t - 0.3) / 0.6);
    if (u > 0 && u < 1) for (var i = 0; i < 7; i++) { var a = -1.04 + i * 0.347, d = 40 + u * 200; K.A2.lance(K.c, P0.x + 14 + Math.cos(a) * d, P0.y - 20 + Math.sin(a) * d * 0.7, a * 0.8, i === 3); }
    if (t > 1.4 && t < 3.5) { K.st('slow', en[1].x, en[1].y); K.pop(en[2].x, en[2].y, '32', '#ffd24a', 1.5); K.pop(en[1].x, en[1].y, '16', '#bfefff', 1.5); }
    return 'Filo gélido: 7 lanzas; las doradas son críticos x2';
  };
  SCENE.hemo = function (K) {
    var t = K.t, en = [{ x: 280, y: 130 }, { x: 330, y: 160 }, { x: 380, y: 190 }, { x: 300, y: 210 }, { x: 250, y: 170 }, { x: 395, y: 135 }];
    K.sorted(en, function (e, i) { var dies = (i === 0 && t > 2.8) || (i === 1 && t > 3.4); if (!dies) K.enemy(e.x, e.y, t > 0.9 ? '#b0206a' : null); });
    K.player();
    if (t > 0.6) en.forEach(function (e, i) { if (!((i === 0 && t > 2.8) || (i === 1 && t > 3.4))) { K.A2.mark(K.c, e.x, e.y - 14, 12, t); } });
    if (t > 1.2 && t < 5) { K.st('bleed', en[2].x, en[2].y); K.st('poison', en[3].x, en[3].y); }
    [[0, 2.8], [1, 3.4]].forEach(function (p) { var u = (t - p[1]) / 0.7; if (u > 0 && u < 1) { K.A2.drain(K.c, en[p[0]].x, en[p[0]].y - 10, P0.x, P0.y - 20, u); } });
    K.pop(P0.x, P0.y, '+2 HP', '#ff7a8a', 3.4); K.pop(P0.x, P0.y, '+2 HP', '#ff7a8a', 4);
    return 'Hemotoxina: marca 6 enemigos; al morir te curan';
  };
  SCENE.descarga = function (K) {
    var t = K.t, en = [{ x: 270, y: 135 }, { x: 330, y: 165 }, { x: 390, y: 135 }, { x: 300, y: 205 }, { x: 375, y: 205 }];
    K.sorted(en, function (e, i) { K.enemy(e.x, e.y, t < 2.2 ? '#5be03a' : null); });
    K.player();
    if (t < 2.2) en.forEach(function (e, i) { if (i !== 4) K.st('poison', e.x, e.y); });
    if (t > 1.6) K.flash(function () { K.A2.cast(K.c, 'descarga', P0.x, P0.y - 14, clamp01((t - 1.6) / 0.4)); });
    en.forEach(function (e, i) { if (i === 4) return; var u = (t - 2.2 - i * 0.12) / 0.4; if (u > 0 && u < 1) { K.flash(function () { K.A2.strike(K.c, e.x, e.y, u, true); }); K.A2.impact(K.c, 'descarga', e.x, e.y - 14, u, 14); } K.pop(e.x, e.y, '36', '#c8ff4a', 2.3 + i * 0.12); });
    return 'Descarga tóxica: un rayo sobre cada envenenado';
  };
  SCENE.cristal = function (K) {
    var t = K.t, hp = t < 1 ? 1 : t < 3.8 ? 1 - (t - 1) / 2.8 : 0, en = [{ x: 190, y: 170 }, { x: 175, y: 205 }, { x: 210, y: 140 }].map(function (e, i) { var b = t > 3.8 ? 1 : 0; return { x: lerp(e.x + 120, e.x, ease((t - 0.3) / 1.2)) + b * (t - 3.8) * 90, y: e.y }; });
    K.sorted(en, function (e) { K.enemy(e.x, e.y, t > 1.6 && t < 4 ? '#d86a98' : null); });
    K.player();
    if (t > 0.4 && t < 3.9) K.A2.ward(K.c, P0.x, P0.y - 22, 60, t, ease((t - 0.4) / 0.3), hp);
    if (t >= 3.9 && t < 4.5) K.A2.shatter(K.c, P0.x, P0.y - 14, 100, (t - 3.9) / 0.6);
    if (t > 1.6 && t < 3.8) K.pop(P0.x + 20, P0.y - 20, 'absorbe', '#d86a98', 1.6 + 0);
    if (t > 4) K.pop(en[0].x, en[0].y, '20', '#aee0ff', 4);
    return 'Cristal de sangre: coraza que ralentiza y estalla al romperse';
  };
  SCENE.zancada = function (K) {
    var t = K.t, u = ease((t - 0.8) / 0.3), x = lerp(P0.x, P0.x + 180, u), en = [{ x: 170, y: 175 }, { x: 215, y: 180 }, { x: 255, y: 172 }, { x: 330, y: 150 }];
    K.sorted(en, function (e) { var crossed = x > e.x - 10 && t > 0.8; K.enemy(e.x, e.y, crossed ? '#ff6a7a' : null); if (crossed && t > 1.2 && t < 4) K.st('stun', e.x, e.y); });
    if (t > 1.1 && t < 4.5) K.A2.trail(K.c, P0.x, P0.y - 8, P0.x + 180, P0.y - 8, clamp01((t - 1.1) / 2.5));
    K.player(x, P0.y);
    if (t > 0.8 && t < 1.1) K.A2.dashGhost(K.c, x, P0.y - 14, 0, (t - 0.8) / 0.3);
    if (t > 1.1) { K.pop(en[1].x, en[1].y, '24', '#ff6a7a', 1.1); K.pop(x, P0.y, '+4 HP', '#ff7a8a', 1.3); }
    return 'Zancada carmesí: embestida invulnerable con estela que aturde';
  };
  SCENE.virote = function (K) {
    var t = K.t, en = [{ x: 250, y: 172 }, { x: 310, y: 172 }, { x: 370, y: 172 }, { x: 330, y: 215 }], u = clamp01((t - 0.5) / 0.7), bx = lerp(P0.x + 20, 420, u);
    K.sorted(en, function (e, i) { var hit = bx > e.x && t > 0.5 && i < 3; K.enemy(e.x, e.y, hit && t < 4.5 ? '#9ad05a' : null); if (hit && t > 1.3 && t < 5) { K.st('corrode', e.x, e.y); K.st('poison', e.x, e.y - 14); } });
    K.player();
    if (u > 0 && u < 1) K.A2.virote(K.c, bx, P0.y - 20, 0, u);
    if (t > 1) { K.pop(en[0].x, en[0].y, '55', '#c8f08a', 1.0); K.pop(en[1].x, en[1].y, '55', '#c8f08a', 1.2); K.pop(en[2].x, en[2].y, '55', '#c8f08a', 1.4); }
    if (t > 2.5 && t < 4.5) K.pop(en[2].x + 20, en[2].y, '+20 % daño', '#ffe9a0', 2.5);
    return 'Virote corrosivo: atraviesa 3 y oxida la armadura';
  };

  // ----- cartas: disparo del básico con el efecto de la etiqueta, o escena del arma propia / pasiva
  var TAGCOL = { fire: '#ff7a2a', ice: '#6ac8ff', lightning: '#ffe45a', poison: '#7be34a', blood: '#d02048', steel: '#c8d0e0' };
  function infusionScene(K, tag, d) {
    var t = K.t, col = TAGCOL[tag] || '#fff', e0 = { x: 300, y: 170 }, e1 = { x: 345, y: 140 }, e2 = { x: 380, y: 195 }, ph = t % 1.6, shot = ph < 0.6, q = ph / 0.6, hitT = t - Math.floor(t / 1.6) * 1.6 - 0.6, steel = tag === 'steel';
    var ens = [e0, e1, e2];
    K.sorted(ens, function (e, i) { var st = hitT > 0 && (i === 0 || (tag === 'lightning' && i === 1) || (steel && i === 2)); K.enemy(e.x, e.y, st ? col : null); });
    K.player();
    if (shot) { var ex = steel ? 400 : e0.x; K.MA.shot(K.c, lerp(P0.x + 18, ex, q), lerp(P0.y - 22, steel ? 170 - 22 : e0.y - 16, q), 0, col, 5); }
    if (hitT > 0 && hitT < 1.0) {
      var k = tag === 'fire' ? 'burn' : tag === 'ice' ? 'slow' : tag === 'poison' ? 'poison' : tag === 'blood' ? 'bleed' : tag === 'lightning' ? 'stun' : 'mark';
      if (tag !== 'steel') K.st(k, e0.x, e0.y);
      if (tag === 'lightning') K.A2.chain(K.c, [{ x: e0.x, y: e0.y - 14 }, { x: e1.x, y: e1.y - 14 }], K.t, '255,235,120');
      if (tag === 'blood') K.pop(P0.x, P0.y, '+1 HP', '#ff7a8a', t - hitT + 0.1);
      if (tag === 'steel') { K.pop(e0.x, e0.y, 'x2', '#ffe9a0', t - hitT + 0.05); K.pop(e2.x, e2.y, '10', '#fff', t - hitT + 0.05); }
      K.pop(e0.x, e0.y, '10', '#fff', t - hitT + 0.05);
    }
    return 'Infusión: cada disparo del básico lleva este efecto';
  }
  function cardScene(K, d) {
    var t = K.t, col = TAGCOL[d.tag] || '#fff', en = [{ x: 290, y: 150 }, { x: 330, y: 185 }, { x: 260, y: 205 }, { x: 370, y: 155 }];
    var c = K.c;
    if (d.type !== 'attack') {   // pasiva: aura de la etiqueta sobre el jugador y la mano que sube
      K.enemy(300, 180, null); K.player();
      ring(c, P0.x, P0.y - 8, 28 + Math.sin(t * 4) * 3, col, 0.9); ring(c, P0.x, P0.y - 8, 44 + Math.sin(t * 4 + 1) * 3, col, 0.5);
      if (K.A2.infuse) K.A2.infuse(c, d.tag === 'neutral' ? 'steel' : d.tag, P0.x, P0.y - 70 - Math.sin(t * 3) * 4, 16, 1);
      K.pop(P0.x + 30, P0.y - 20, 'pasiva activa', col, Math.floor(t / 1.6) * 1.6);
      return 'Pasiva: siempre activa mientras la llevas en la mano';
    }
    if (d.kind === 'proj') return infusionScene(K, d.tag, d);
    var ph = t % 2.5, p = ph / 2.5, pr = d.pulseR || d.auraR || 80;
    K.sorted(en, function (e) { K.enemy(e.x, e.y, null); }); K.player();
    switch (d.kind) {
      case 'orbital': for (var i = 0; i < (d.n || 2); i++) { var a = t * 3.5 + i * TAU / (d.n || 2); disc(c, P0.x + Math.cos(a) * (d.orbR || 50), P0.y - 12 + Math.sin(a) * (d.orbR || 50) * 0.6, 8, col, 0.95); } break;
      case 'aura': disc(c, P0.x, P0.y - 8, d.auraR || 70, col, 0.18 + 0.06 * Math.sin(t * 4)); ring(c, P0.x, P0.y - 8, d.auraR || 70, col, 0.8); break;
      case 'pulse': ring(c, P0.x, P0.y - 8, 14 + p * pr, col, 1 - p); disc(c, P0.x, P0.y - 8, 14 + p * pr, col, 0.15 * (1 - p)); break;
      case 'lob': var qq = clamp01(ph / 1.2), bx = lerp(P0.x + 12, 300, qq), by = lerp(P0.y - 22, 170, qq) - Math.sin(qq * Math.PI) * 70; if (qq < 1) K.MA.shot(c, bx, by, 0.3, col, 7); else if (ph < 1.7) { disc(c, 300, 172, (d.boomR || 40) * (0.4 + (ph - 1.2)), col, 0.5 * (1.7 - ph) / 0.5); } break;
      case 'chain': var u2 = ph < 1 ? ph : 1; if (ph < 1.6) K.A2.chain(c, [{ x: P0.x + 12, y: P0.y - 24 }, { x: en[0].x, y: en[0].y - 12 }, { x: en[1].x, y: en[1].y - 12 }, { x: en[3].x, y: en[3].y - 12 }], t, '255,235,120'); break;
      case 'strike': if (ph < 0.5) K.flash(function () { K.A2.strike(c, en[1].x, en[1].y, ph / 0.5, false); }); break;
      case 'pool': disc(c, en[0].x, en[0].y + 2, d.poolR || 40, col, 0.35); ring(c, en[0].x, en[0].y + 2, d.poolR || 40, col, 0.8); K.st('poison', en[0].x, en[0].y); break;
      case 'slash': if (ph < 0.5) { c.save(); c.strokeStyle = col; c.lineWidth = 5; c.globalAlpha = 1 - ph / 0.5; c.beginPath(); c.arc(P0.x + 10, P0.y - 14, 55, -0.8 + ph * 2, 0.8 + ph * 2); c.stroke(); c.restore(); } break;
      case 'mark': for (var j = 0; j < 3; j++) { K.A2.mark(c, en[j].x, en[j].y - 14, 12, t); if (ph > 0.5) K.st('bleed', en[j].x, en[j].y); } break;
      case 'fan': for (var f = 0; f < 3; f++) { var fa = (f - 1) * 0.3, fd = 30 + (ph < 1.2 ? ph : 1.2) * 200; if (ph < 1.4) K.MA.shot(c, P0.x + 14 + Math.cos(fa) * fd, P0.y - 22 + Math.sin(fa) * fd * 0.7, fa * 0.7, col, 4); } break;
      case 'boomerang': var qb = clamp01(ph / 2.2), bxx = P0.x + 20 + 220 * Math.sin(qb * Math.PI); if (qb < 1) K.A2.axe(c, bxx, P0.y - 24, t, 0.8); break;
      default: ring(c, P0.x, P0.y - 8, 30 + p * 50, col, 1 - p);
    }
    return 'Arma propia de la carta (además de su infusión)';
  }
  M.renderDemo = function (c, e, t) {   // pura: dibuja la escena de la entrada e en el instante t (s) dentro de (0,0,vw,vh). Devuelve la leyenda.
    var K = Kit(c, t, calm()), cap = '';
    c.save(); c.beginPath(); c.rect(0, 0, T.vw, T.vh); c.clip();
    var g = c.createLinearGradient(0, 0, 0, T.vh); g.addColorStop(0, '#1a1426'); g.addColorStop(1, '#0c0814'); c.fillStyle = g; c.fillRect(0, 0, T.vw, T.vh);
    c.fillStyle = 'rgba(70,56,92,0.35)'; c.fillRect(0, 130, T.vw, 118); c.strokeStyle = 'rgba(120,100,150,0.25)'; c.lineWidth = 1; for (var i = 0; i < 8; i++) { c.beginPath(); c.moveTo(0, 130 + i * 16); c.lineTo(T.vw, 130 + i * 16); c.stroke(); }
    if (K.calm) c.globalAlpha = 0.75;
    var gt = G.time; G.time = t * 1000;   // el arte ondula con G.time: se sustituye SOLO durante este dibujo y se restaura (no hay simulación corriendo aquí)
    try { cap = e.k === 'fx' ? (SCENE[e.id] || function () { return ''; })(K) : cardScene(K, e.def); } catch (er) { M.lastError = er; }
    G.time = gt;
    c.restore();
    return cap;
  };

  // ------------------------------------------------------------- Dibujo de la pantalla
  function wrapLines(c, text, w, size, max) { var l = U.wrap(c, text, w, size); if (max && l.length > max) { l = l.slice(0, max); l[max - 1] = l[max - 1].replace(/\s*\S{0,3}$/, '') + '...'; } return l; }
  function para(c, y, label, text, col, size, max, x, w) {
    x = x || 292; w = w || 654; size = size || 13;
    var ls = wrapLines(c, (label ? label + ' ' : '') + text, w, size, max), lh = Math.round(size * 1.45);
    ls.forEach(function (ln, i) { G.txt(c, ln, x, y + i * lh, size, col, 'left'); });
    return y + ls.length * lh;
  }
  function chip(c, tag, x, y) {
    c.fillStyle = tagCol(tag); c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); c.strokeStyle = '#0c0814'; c.lineWidth = 2; c.stroke();
  }
  function lockedView(c, e) {
    c.fillStyle = '#0c0814'; c.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
    G.ManualArt.icon(c, 'lock', VIEW.x + VIEW.w / 2, VIEW.y + 100, 34);
    G.txt(c, '???', VIEW.x + VIEW.w / 2, VIEW.y + 158, 30, '#a89cc0', 'center');
    G.txt(c, e.k === 'fx' ? 'Aún no has creado esta fusión' : 'Aún no has desbloqueado esta carta', VIEW.x + VIEW.w / 2, VIEW.y + 198, 13, '#c8c0d8', 'center');
  }
  M.draw = function (c) {
    G.minFont = G.MIN_UI;
    var l = visible(), now = performance.now(), dt = st.last ? Math.min(50, now - st.last) : 0; st.last = now;
    if (st.sel >= l.length) st.sel = Math.max(0, l.length - 1);
    var e = l[st.sel], known = e && M.isKnown(e), m = inp.mouse, i, cn = counts();
    if (!st.paused && !st.modal) st.demoT += dt / 1000 * (calm() ? 0.6 : 1);
    var tt = st.demoT % T.loop;
    c.fillStyle = 'rgb(10,5,16)'; c.fillRect(0, 0, G.W, G.H);
    G.ManualArt.icon(c, 'book', 26, 26, 14); G.txt(c, 'MANUAL', 52, 24, 24, '#ffd27a', 'left');
    G.txt(c, 'Descubierto ' + cn.n + '/' + cn.t + (ALL ? '  (todo visible)' : ''), 200, 24, 13, '#b4a8c8', 'left');
    U.button(c, R_CLOSE, 'X', { size: 20, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
    ['CARTAS', 'FUSIONES'].forEach(function (n, k) { U.button(c, tabR(k), n, { size: 16, color: st.tab === k ? '#2a6aa8' : '#2c2438', hot: '#3a8ad0', border: st.tab === k ? '#bfeaff' : '#6a5a80' }); });
    U.button(c, R_FIL, 'ETIQUETA: ' + (st.filter === 'all' ? 'TODAS' : tagName(st.filter).toUpperCase()), { size: 14, color: '#3a2f48', hot: '#5a4a76', border: st.filter === 'all' ? '#8a7aa6' : tagCol(st.filter) });
    U.button(c, R_SRCH, 'BUSCAR: ' + (st.q ? st.q.slice(0, 14) : '(todo)'), { size: 14, color: '#3a2f48', hot: '#5a4a76', border: st.q ? '#ffd27a' : '#8a7aa6' });
    // lista
    for (i = 0; i < PER; i++) {
      var idx = st.page * PER + i, r = rowR(i); if (idx >= l.length) break;
      var en = l[idx], kn = M.isKnown(en), on = idx === st.sel, hov = U.inR(r, m);
      c.fillStyle = on ? '#3a2a5a' : hov ? '#2a2038' : '#1a1226'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = on ? '#ffe9a0' : kn ? tagCol(en.tag) : '#3a2f48'; c.lineWidth = on ? 3 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      if (kn) { chip(c, en.tag, r.x + 18, r.y + r.h / 2); if (en.tag2) chip(c, en.tag2, r.x + 34, r.y + r.h / 2); }
      else G.ManualArt.icon(c, 'lock', r.x + 22, r.y + r.h / 2, 9);
      G.txt(c, kn ? en.name : '???', r.x + (en.tag2 ? 50 : 36), r.y + r.h / 2, 14, kn ? '#fff' : '#a89cc0', 'left');
      if (isNew(en)) { c.fillStyle = '#ffd24a'; c.fillRect(r.x + r.w - 48, r.y + 12, 44, 18); G.txt(c, 'NUEVO', r.x + r.w - 26, r.y + 21, 12, '#2a1a00', 'center'); }
    }
    if (!l.length) para(c, 232, '', 'Nada coincide con el filtro o la búsqueda (solo se busca en lo descubierto).', '#c8c0d8', 13, 5, 18, 256);
    U.button(c, R_PREV, '', { size: 16, off: pages() < 2, color: '#3a2f48' }); G.ManualArt.icon(c, 'arrow', R_PREV.x + 40, R_PREV.y + 22, 10);
    U.button(c, R_NEXT, '', { size: 16, off: pages() < 2, color: '#3a2f48' }); c.save(); c.translate(R_NEXT.x + 40, R_NEXT.y + 22); c.scale(-1, 1); G.ManualArt.icon(c, 'arrow', 0, 0, 10); c.restore();
    G.txt(c, 'pág ' + (st.page + 1) + '/' + pages(), 147, 468, 13, '#c8c0d8', 'center');
    if (!e) return;
    // visor de la demo
    var cap = '';
    if (known) {
      c.save(); c.translate(VIEW.x, VIEW.y); cap = M.renderDemo(c, e, tt); c.restore();
      c.fillStyle = 'rgba(8,4,14,0.72)'; c.fillRect(VIEW.x, VIEW.y + VIEW.h - 24, VIEW.w, 24); cap = cap.replace(/^[^:]*:\s*/, ''); G.txt(c, cap.charAt(0).toUpperCase() + cap.slice(1), VIEW.x + 8, VIEW.y + VIEW.h - 12, 12, '#ffe9a0', 'left');
      G.ManualArt.icon(c, st.paused ? 'play' : 'pause', VIEW.x + VIEW.w - 16, VIEW.y + 16, 8);
      if (st.paused && calm()) G.txt(c, 'Toca para animar (Reducir destellos activo)', VIEW.x + VIEW.w / 2, VIEW.y + 30, 12, '#ffe9a0', 'center');
    } else lockedView(c, e);
    c.strokeStyle = known ? tagCol(e.tag) : '#3a2f48'; c.lineWidth = 3; c.strokeRect(VIEW.x - 1.5, VIEW.y - 1.5, VIEW.w + 3, VIEW.h + 3);
    // panel lateral
    U.panel(c, SIDE.x, SIDE.y, SIDE.w, SIDE.h, { border: known ? tagCol(e.tag) : '#3a2f48' });
    var cx = SIDE.x + SIDE.w / 2;
    if (!known) { G.txt(c, '???', cx, SIDE.y + 110, 30, '#a89cc0', 'center'); }
    else if (e.k === 'card') {
      G.Cards.drawCard(c, { id: e.id, lvl: 1 }, cx - 46, SIDE.y + 10, 92, 120, { nocd: true });
      G.txt(c, tagName(e.tag).toUpperCase(), cx, SIDE.y + 146, 14, tagCol(e.tag), 'center');
      G.txt(c, e.def.type === 'attack' ? 'INFUSIÓN' : 'PASIVA', cx, SIDE.y + 168, 13, '#e8dff8', 'center');
      var rk = G.Save.rank ? G.Save.rank(e.id) : 0; G.txt(c, rk ? 'Rango ' + U.roman(rk) : 'Sin forjar', cx, SIDE.y + 190, 12, '#b4a8c8', 'center');
      G.txt(c, 'Cd ' + (e.def.cd ? fmt(e.def.cd / 1000) + ' s' : '-'), cx, SIDE.y + 212, 12, '#b4a8c8', 'center');
    } else {
      chip(c, e.tag, cx - 44, SIDE.y + 20); G.txt(c, '+', cx - 24, SIDE.y + 20, 16, '#fff', 'center'); chip(c, e.tag2, cx - 4, SIDE.y + 20);
      G.txt(c, tagName(e.tag) + ' + ' + tagName(e.tag2), cx, SIDE.y + 44, 12, '#e8dff8', 'center');
      try { G.FusionArt.icon(c, e.id, cx, SIDE.y + 104, 38); } catch (x0) { /* sin icono */ }
      G.txt(c, e.rec.short, cx, SIDE.y + 160, 16, e.rec.color, 'center');
      G.txt(c, 'Recarga ' + fmt(e.rec.lv[0].cd / 1000) + ' s' + (e.rec.lv[1].cd !== e.rec.lv[0].cd ? ' / ' + fmt(e.rec.lv[1].cd / 1000) + ' s' : ''), cx, SIDE.y + 186, 13, '#ffe9a0', 'center');
      G.txt(c, 'Nv1 y Nv2 (re-fusiona)', cx, SIDE.y + 212, 12, '#b4a8c8', 'center');
    }
    // texto
    var y = 330;
    G.txt(c, known ? e.name : '???', 292, y, 20, known ? '#ffd27a' : '#a89cc0', 'left'); y += 28;
    if (!known) {
      para(c, y, '', e.k === 'fx' ? 'Descubre esta fusión juntando en la mano dos cartas de etiquetas distintas que tengan receta y fusionándolas durante una expedición.' : 'Esta carta se desbloquea en el árbol de la Forja de Grum (o en el Archivo de Ulalume cuando ya es tuya).', '#c8c0d8', 14, 4);
      return;
    }
    seenMark(e);
    if (e.k === 'fx') {
      var X = FX[e.id] || { n1: '', n2: '', tip: '' };
      y = para(c, y, '', e.rec.desc, '#e8dff8', 13, 2); y += 3;
      y = para(c, y, 'Nv1:', X.n1 + ' Recarga ' + fmt(e.rec.lv[0].cd / 1000) + ' s.', '#ffe9a0', 13, 3); y += 3;
      y = para(c, y, 'Nv2:', X.n2 + (e.rec.lv[1].cd !== e.rec.lv[0].cd ? ' Recarga ' + fmt(e.rec.lv[1].cd / 1000) + ' s.' : ''), '#ffe9a0', 13, 2); y += 3;
      para(c, y, 'Consejo:', X.tip, '#9dffb4', 13, 3);
    } else {
      var d = e.def, aux = d.type === 'attack' && d.kind !== 'proj';
      y = para(c, y, '', d.desc, '#e8dff8', 13, 3); y += 3;
      if (d.type === 'attack') {
        var b = aux ? ['+10 %', '+17,5 %', '+25 %'] : ['+20 %', '+35 %', '+50 %'];
        y = para(c, y, 'Niveles:', 'Nv1 ' + b[0] + ', Nv2 ' + b[1] + ', Nv3 ' + b[2] + ' de daño al básico. Dos cartas iguales = refuerzo de nivel. Efecto: ' + (INF[d.tag] || '') , '#ffe9a0', 13, 3); y += 3;
        if (aux) y = para(c, y, 'Arma propia:', 'además dispara al ' + Math.round(G.Fusion.AUX.dmg * 100) + ' % de daño' + (d.cd ? ' cada ' + fmt(d.cd * G.Fusion.AUX.cd / 1000) + ' s' : '') + '.', '#ffe9a0', 13, 2);
      } else y = para(c, y, 'Niveles:', 'Nv1 x1, Nv2 x1,5, Nv3 x2 del efecto indicado.', '#ffe9a0', 13, 2);
      y += 3;
      var combos = G.Fusion.recipes.filter(function (r) { return r.a === e.tag || r.b === e.tag; }).map(function (r) { var cs = SV().combosSeen || {}; return (ALL || cs[r.id]) ? r.name : '???'; });
      if (combos.length && e.tag !== 'neutral') y = para(c, y, 'Se fusiona en:', combos.join(', ') + '.', '#bfeaff', 13, 2); y += 3;
      para(c, y, 'Consejo:', TAGTIP[e.tag] || 'Carta neutral: sirve en cualquier build.', '#9dffb4', 13, 2);
    }
  };
})();
