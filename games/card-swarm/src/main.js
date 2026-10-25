/* main.js - Swarm Hand: núcleo, balance, entrada, bucle de paso fijo y render. Canvas 2D puro.
   Parámetros de depuración por URL: ?speed=4 (acelera el tiempo), ?god=1 (invulnerable), ?t=240 (empieza en el segundo indicado), ?biome=cripta,
   familias v5 (src/families.js): ?fam=0 (roster legado) | ?fam=1 (fuerza familias) ?mat=1|0 (tabla de debilidades por material),
   ?pf=<n> (Puntos de Forja), ?give=, Tundra (P3): ?biome=tundra [&nobos=1 sin jefe, &ice=0 sin hielo, &cold=0 sin Frío, &softice=1 &lightstorm=1 accesibilidad] (src/tundra.js), ?len=, ?reset=1, ?dbg=1, jefes v4: ?boss=pastor|karceron|letea ?peligro=<n> ?phase= ?hp= ?hpcal= ?nointro=1 ?hand=, vista inclinada ?view=iso (src/view.js). Entrada táctil: toque = clic (al soltar), joystick flotante en la mitad izquierda, deslizar = cambiar pestaña. */
(function () {
  'use strict';
  var G = window.G = {};
  G.W = 960; G.H = 540;          // viewport
  G.AW = 1440; G.AH = 810;       // arena (la cámara sigue al jugador)
  G.WALL = 28;                   // margen de pared
  G.STEP = 1000 / 60;            // paso fijo en ms
  G.RUN_LEN = 9 * 60000;         // duración prevista de la run (9:00); G.setLen() la cambia (7 / 9 / 10 min, selector de la Base o ?len=)
  G.BOSS_T = 7.5 * 60000;        // el Pastor aparece a los 7:30 (margen de 1:30 para matarlo); escala con la duración
  G.tk = 1;                      // factor de tiempo del director: 9 / minutos de la run. G.vt() = tiempo "virtual" en la escala de 9:00
  G.setLen = function (min) { G.RUN_LEN = min * 60000; G.BOSS_T = G.RUN_LEN * 7.5 / 9; G.tk = 9 / min; };
  G.runT = 0;                    // reloj de la RUN: se congela mientras el jefe vive (v4). G.time sigue corriendo (temporizadores, animaciones)
  G.vt = function () { return G.runT * G.tk; };

  function qnum(name, def) { var m = new RegExp('[?&]' + name + '=([\\d.]+)').exec(location.search); return m ? parseFloat(m[1]) : def; }
  G.speed = qnum('speed', 1); G.god = qnum('god', 0) > 0; G.t0 = qnum('t', 0) * 1000;
  // Jefes v4: ?boss=pastor salta a la pelea, ?peligro=<n> (1-5), ?phase=2|3, ?hp=0.3, ?nointro=1, ?hand=spark:3,ember:2 (mano de prueba)
  G.bossUrl = (/[?&]boss=(\w+)/.exec(location.search) || [])[1] || null; G.peligro = qnum('peligro', 1);
  // J3: ?hunt=<jefe> arranca una cacería (sin hordas, 6 ofertas de preparación), ?practice=1 la modalidad PRACTICAR (con ?hunt= o ?boss=), ?prep=0 salta las 6 ofertas, ?zoom=0.9 zoom de combate opcional
  G.huntUrl = (/[?&]hunt=(\w+)/.exec(location.search) || [])[1] || null; G.practiceUrl = qnum('practice', 0) > 0; G.noPrep = qnum('prep', 1) === 0;
  G.peligroUrl = /[?&]peligro=/.test(location.search); G.combatZoom = qnum('zoom', 0) || 0; G.mode = 'run';   // G.mode: 'run' | 'hunt' | 'practice'
  G.pelx = (/[?&]pelx=([\w.:,]+)/.exec(location.search) || [])[1] || null;   // ?pelx=hp:1.1,dmg3:1.05,tele:1 sobrescribe la tabla de Peligro (calibración; sufijo = solo ese nivel)
  G.dbgHpCal = qnum('hpcal', 0); G.dbgPhase = qnum('phase', 0); G.dbgHp = qnum('hp', 0); G.nointro = G.nointroUrl = qnum('nointro', 0) > 0;

  // ---------------------------------------------------------------- Balance (único objeto)
  G.B = {
    player: { hp: 100, speed: 190, r: 10, invuln: 600, kb: 60, pickup: 60, heartP: 0.02, heal: 12 },
    anchorSlots: 2,                // cartas ancla con las que parte la expedición (de 5 slots); cambiar a 3 es trivial
    // maxAlive = tope simultáneo por tipo; elite = lo genera el director en un instante fijo (no por presupuesto)
    enemy: {
      worm:    { hp: 14,  spd: 70, dmg: 6,  r: 10, cost: 1, from: 0,      w: 55, spr: 'worm',    xp: 1, ash: 1, maxAlive: 40 },
      archer:  { hp: 10,  spd: 60, dmg: 8,  r: 11, cost: 3, from: 45000,  w: 20, spr: 'archer',  xp: 2, ash: 1, maxAlive: 10 },
      fanner:  { hp: 16,  spd: 55, dmg: 6,  r: 11, cost: 4, from: 90000,  w: 14, spr: 'enemy_fanner',  xp: 3, ash: 1, maxAlive: 8 },
      boar:    { hp: 45,  spd: 55, dmg: 14, r: 15, cost: 5, from: 120000, w: 10, spr: 'boar',    xp: 4, ash: 3, maxAlive: 8 },
      shield:  { hp: 40,  spd: 48, dmg: 10, r: 13, cost: 5, from: 165000, w: 9,  spr: 'enemy_shield',  xp: 5, ash: 3, maxAlive: 6 },
      bomb:    { hp: 8,   spd: 105, dmg: 20, r: 10, cost: 2, from: 210000, w: 10, spr: 'bomb',    xp: 2, ash: 1, maxAlive: 8 },
      moth:    { hp: 14,  spd: 80, dmg: 5,  r: 10, cost: 4, from: 240000, w: 10, spr: 'enemy_moth',    xp: 3, ash: 1, maxAlive: 5 },
      sower:   { hp: 22,  spd: 45, dmg: 6,  r: 12, cost: 5, from: 270000, w: 7,  spr: 'enemy_sower',   xp: 5, ash: 3, maxAlive: 3 },
      blinker: { hp: 18,  spd: 65, dmg: 16, r: 11, cost: 6, from: 315000, w: 7,  spr: 'enemy_blinker', xp: 6, ash: 3, maxAlive: 4 },
      scorcher:{ hp: 30,  spd: 60, dmg: 12, r: 12, cost: 6, from: 360000, w: 6,  spr: 'enemy_scorcher',xp: 6, ash: 3, maxAlive: 3 },
      warlock: { hp: 30,  spd: 50, dmg: 0,  r: 13, cost: 8, from: 405000, w: 5,  spr: 'warlock', xp: 6, ash: 5, maxAlive: 2 },
      // Monstruos NUEVOS de las familias v5 (famOnly: solo existen en la `use` de su bioma; sin familia activa el director nunca los elige). Ver families.js / enemies.js
      dog:        { hp: 24,  spd: 125, dmg: 8, r: 12, cost: 5, from: 165000, w: 8, spr: 'enemy_bos_perro',      xp: 4, ash: 3, maxAlive: 3, famOnly: true },
      salamander: { hp: 30,  spd: 60,  dmg: 8, r: 12, cost: 5, from: 240000, w: 9, spr: 'enemy_cri_salamandra', xp: 5, ash: 3, maxAlive: 4, famOnly: true },
      chainer:    { hp: 60,  spd: 42,  dmg: 6, r: 14, cost: 6, from: 270000, w: 8, spr: 'enemy_cri_guardian_cadenas', xp: 6, ash: 3, maxAlive: 3, famOnly: true },
      // P2 (Asfódelo, A.5): Sanguijuela (emboscada oculta en un charco) y Cabeza menor (brota de un charco, rebrota si no se cauteriza). spd 0 = fija. Ver families.js / enemies.js
      leech:      { hp: 9,   spd: 55,  dmg: 9, r: 9,  cost: 3, from: 45000,  w: 26, spr: 'enemy_asf_sanguijuela',  xp: 2, ash: 1, maxAlive: 10, famOnly: true },
      headlet:    { hp: 30,  spd: 0,   dmg: 12, r: 14, cost: 5, from: 120000, w: 14, spr: 'enemy_asf_cabeza_menor', xp: 4, ash: 3, maxAlive: 5, famOnly: true },
      // P3 (Tundra, B.3): Lobo de escarcha (IA de manada: rodea a 200 px y ataca por turnos; ver enemies_tundra.js)
      frostwolf:  { hp: 20,  spd: 90,  dmg: 8, r: 11, cost: 3, from: 90000,  w: 22, spr: 'enemy_tun_lobo',        xp: 3, ash: 1, maxAlive: 9, famOnly: true },
      mini_bulwark: { hp: 2200, spd: 42, dmg: 22, r: 22, cost: 0, from: Infinity, w: 0, spr: 'enemy_mini_bulwark', xp: 30, ash: 20, elite: true, at: 210000, name: 'COLOSO ESCUDERO' },
      mini_hive:    { hp: 2800, spd: 38, dmg: 14, r: 24, cost: 0, from: Infinity, w: 0, spr: 'enemy_mini_hive',    xp: 40, ash: 25, elite: true, at: 330000, name: 'MADRE COLMENA' },
      // jefe: solo se usan spr/xp/ash; HP, tamaño y IA reales viven en boss.js (G.Boss, DESIGN-v4-jefes.md)
      boss:    { hp: 1400, spd: 60, dmg: 20, r: 24, cost: 0, from: Infinity, w: 0, spr: 'boss',   xp: 60, ash: 30 }
    },
    // Minijefes v5 (antes 420 / 520 HP y 2 ataques cada uno): HP, parte rompible, enrage al 50 % y ataques nuevos con telegrafía >= 400 ms. Toda telegrafía cumple la
    // regla de esquiva (tele >= 250 + 1000 * px_de_salida / 190). Los tiempos son ms, las distancias px. Ver README "Minijefes v5".
    mini: {
      bulwark: { shieldPct: 0.30,     // Escudo rompible: 30 % del HP máximo en daño FRONTAL bloqueado (el golpe por la espalda/área no lo gasta) -> ventana x1,5 + sin bloqueo
        expMul: 1.5, breakExp: 3000, enrageAt: 0.5, enrageSpd: 1.35, recMul: 0.7, atkGap: 1000, enrageGap: 600,
        chargeTele: 800, chargeFix: 500, chargeTele2: 600, chargeFix2: 330, chargeLen: 300, chargeSpd: 340, chargeDmg: 1.1, chargeExp: 1600, ringR: 95, ringMs: 380, ringDmg: 16 / 22,
        orbTele: 650, orbDur: 3200, orbLaunch: 500, orbR: 80, orbOmega: 2.4, orbN: 3, orbN2: 4, orbDmg: 12 / 22, bitSpd: 250 },
      hive: { sacPct: 0.28, sacShare: 0.4,      // Saco de larvas rompible: absorbe el 40 % de TODO el daño recibido hasta el 28 % del HP máx.; al romper: ventana x1,4 y sin lluvia de larvas
        expMul: 1.4, breakExp: 3500, enrageAt: 0.5, enrageSpd: 1.2, atkGap: 3000, enrageGap: 2200, kidsMax: 12,
        rainTele: 750, rainN: 5, rainN2: 7, rainR: 26, rainDmg: 1.0, tideTele: 1000, tideN: 4, tideN2: 5, tideR: 50, burstTele: 1150, burstR: 150, burstN: 8, burstExp: 2200,
        swellGap: 15000, swellGap2: 9000 }
    },
    // Curva del director: multiplicador de PESO de spawn y de TOPE (maxAlive) por tier y minuto (interpolación lineal entre filas).
    // Lo débil sale y lo fuerte entra, con presupuesto total (bp/cap) intacto. Suelo 'floor' = mínimo para no perder variedad.
    // tier 0: worm  1: archer fanner bomb  2: boar shield moth  3: sower blinker scorcher warlock  (cada tipo tiene su 'tier' en B.tier)
    tier: { worm: 0, archer: 1, fanner: 1, bomb: 1, boar: 2, shield: 2, moth: 2, sower: 3, blinker: 3, scorcher: 3, warlock: 3 },
    tierCurve: [   // [minuto, mult tier0, tier1, tier2, tier3]
      [0, 1.0, 1.0, 1.0, 1.0],
      [2, 0.85, 0.85, 1.0, 1.0],
      [3, 0.55, 0.6, 0.9, 1.1],
      [4, 0.35, 0.4, 0.75, 1.3],
      [5, 0.2, 0.25, 0.6, 1.6],
      [6, 0.14, 0.15, 0.45, 1.9],
      [7, 0.12, 0.12, 0.35, 2.2],
      [9, 0.12, 0.12, 0.3, 2.4]
    ],
    tierFloor: 0.12,
    tierMul: function (type, m) {
      var t = G.B.tierOf(type); if (t == null) return 1;   // tierOf: tier de la familia del bioma activo (families.js) o G.B.tier
      var c = G.B.tierCurve, i = 1;
      if (m <= c[0][0]) return c[0][t + 1];
      while (i < c.length - 1 && m > c[i][0]) i++;
      var a = c[i - 1], b = c[i], u = G.clamp((m - a[0]) / (b[0] - a[0]), 0, 1);
      return Math.max(G.B.tierFloor, a[t + 1] + (b[t + 1] - a[t + 1]) * u);
    },
    light: { worm: 1, archer: 1, fanner: 1, bomb: 1, moth: 1 },   // únicos tipos que el director permite con el jefe vivo
    // Multiplicador GLOBAL de daño de cartas (armas, combos, zonas, estados). Aplicado en G.Combat.deal y G.Combat.dot. No afecta a enemigos. 0.98 = -2 %.
    cardDmgMul: 0.98 * (qnum('cmul', 1) || 1),   // ?cmul=1.2 (solo calibración): modela una mano forjada (DPS x1,2) para medir Peligro con el bot
    // Curación por golpe (v5): el robo de vida (Colmillo) y el Pacto ardiente solo curan con esta probabilidad por kill, a cambio de una cantidad mayor.
    // Cura media por kill: Colmillo 1 -> 0,6 HP (-40 %); Pacto ardiente 2 -> 0,8 HP por kill de Fuego (-60 %). Sangre envenenada (4 HP cada 15 kills) no cambia.
    heal: { chance: 0.2, fang: 3, pact: 4, bloodpoison: 4 },
    skipAsh: 5,                                                      // Ceniza que da omitir la elección de carta al subir de nivel
    spawnTelegraph: 400,
    // presupuesto por pulso de 1,5 s; el factor tras el min 3 compensa que los enemigos fuertes cuestan más (densidad total similar)
    bp: function (m) { return (2 + 1.6 * m) * (1 + 0.07 * Math.max(0, m - 3)); },
    cap: function (m) { return Math.min(30 + 10 * m, 110); },       // tope de enemigos
    hpMult: function (m) { return Math.min(3.2, 1 + 0.22 * m); },
    dmgMult: function (m) { return 1 + 0.06 * m; },
    // Velocidad creciente (v5): los enemigos NORMALES (no élites, no jefe, no adds del jefe) ganan +0,8 % de velocidad de movimiento por minuto de la escala de 9:00
    // (G.vt, igual que hpMult/dmgMult: a 7 y 10 min se llega al mismo valor al mismo punto relativo de la run), con tope +25 % (se alcanzaría a los ~31 min virtuales).
    // Solo escala la velocidad de DESPLAZAMIENTO (e.spd): las telegrafías y las velocidades de ataque (carga del jabalí, dash del Ascua, flechas) no cambian.
    speedRamp: { perMin: 0.008, cap: 0.25 },
    speedMul: function (m) { return 1 + Math.min(G.B.speedRamp.cap, G.B.speedRamp.perMin * m); },
    // ---- Experiencia (v5) ----------------------------------------------------------------------------------------------------------------------
    // XP para pasar del nivel L al L+1:  first (L=1)  /  round(base + lin*L + quad*L^2)  (L >= 2).  Antes: 8 + 6L (la build completa llegaba al min 3-4).
    // Cada gema de XP vale  v * gemMul * lenMul(duración)  (x Imán de brasas +20 %).  lenMul compensa que las runs cortas comprimen el director
    // (mas kills por minuto real): 7 min x1,30, 9 min x1,00, 10 min x0,885 (lineal entre puntos). Objetivo: la build completa (5 cartas Nv3 = 15 puntos
    // de nivel de carta, ~nivel 16-17 con el bot) llega al ~82 % de la expedición (hacia el jefe), no a la mitad.
    // Nivel esperado al empezar cada minuto (bot de balance tools/card-swarm-balance-bot, media de 8 runs, god, recoge gemas, fusiona primero) - antes -> ahora.
    //   La subida a Nv3 de las 5 cartas ("build completa") exige 13 elecciones tras las 2 anclas = nivel ~14-15. El jefe aparece al 83 % de la run y congela el reloj.
    //   minuto        1     2     3     4     5     6     7     8     9    10
    //   7 min antes  5,0   8,0  12,0  16,0  20,1  24,0  25,3   (jefe a 5:50)   build completa (5 x Nv3) a los 3:23
    //   7 min ahora  3,0   6,0   8,0  10,0  12,6  14,9  15,0                    build completa a los 5:23  (77 % de la run, 92 % del camino al jefe)
    //   9 min antes  5,0   8,0  11,0  14,1  17,8  21,6  25,3  28,0              build completa a los 3:46
    //   9 min ahora  3,0   5,0   6,0   8,0  10,0  12,0  14,0  15,0  15,0        build completa a los 6:55  (77 %; jefe a 7:30)
    //  10 min antes  5,0   7,9  10,1  13,1  17,0  20,0  24,0  27,9  29,8  30,0  build completa a los 4:02
    //  10 min ahora  3,0   4,0   6,0   7,0   9,0  11,0  12,0  14,0  15,0  15,0  build completa a los 7:46  (78 %; jefe a 8:20)
    xp: { first: 6, base: 26, lin: 0, quad: 0.9, gemMul: 0.5, lenMul: [[7, 1.30], [9, 1.00], [10, 0.885]] },
    xpNeed: function (L) { var x = G.B.xp; return L === 1 ? x.first : Math.round(x.base + x.lin * L + x.quad * L * L); },
    xpGem: function () {   // multiplicador de XP por gema según la duración elegida
      var x = G.B.xp, t = x.lenMul, m = G.RUN_LEN / 60000, i;
      if (m <= t[0][0]) return x.gemMul * t[0][1];
      for (i = 1; i < t.length; i++) if (m <= t[i][0]) { var u = (m - t[i - 1][0]) / (t[i][0] - t[i - 1][0]); return x.gemMul * (t[i - 1][1] + (t[i][1] - t[i - 1][1]) * u); }
      return x.gemMul * t[t.length - 1][1];
    }
  };

  // ---------------------------------------------------------------- Utilidades
  G.rnd = function (a, b) { return a + Math.random() * (b - a); };
  G.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  G.dist = function (ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); };
  G.angDiff = function (a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  G.hasSpr = function (n) { try { return !!Assets.info(n); } catch (e) { return false; } };   // los sprites nuevos pueden no existir aún
  G.dbg = /[?&]dbg=1/.test(location.search) ? { dmg: {} } : null;   // ?dbg=1 cuenta el daño recibido por fuente (window.G.dbg.dmg)
  G.sfx = function (n, o) { try { if (window.Assets) Assets.sfx(n, o); } catch (e) { /* audio opcional */ } };
  G.txt = function (c, s, x, y, size, color, align, stroke) {
    c.font = 'bold ' + size + 'px "Courier New", monospace';
    c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(2, size / 5); c.strokeStyle = stroke || '#0a0610'; c.lineJoin = 'round';
    c.strokeText(s, x, y); c.fillStyle = color || '#fff'; c.fillText(s, x, y);
  };
  G.fmtTime = function (ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s %= 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };

  // ---------------------------------------------------------------- Entrada
  var inp = G.input = { keys: {}, pressed: {}, mouse: { x: 480, y: 270 }, lock: 0 };
  inp.held = function () { for (var i = 0; i < arguments.length; i++) if (inp.keys[arguments[i]]) return true; return false; };
  inp.hit = function () { for (var i = 0; i < arguments.length; i++) if (inp.pressed[arguments[i]]) return true; return false; };
  var canvas, ctx;

  function bindInput() {
    window.addEventListener('keydown', function (e) {
      inp.keys[e.code] = true;
      if (!e.repeat) inp.pressed[e.code] = true;
      if (e.shiftKey) inp.pressed['ShiftDigit' + (e.code.replace('Digit', ''))] = !e.repeat && /^Digit/.test(e.code);
      if (G.Sys) G.Sys.touchActive = false;
      try { G.Snd.unlock(); } catch (x) { /* sin audio */ }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { inp.keys[e.code] = false; });
    window.addEventListener('blur', function () { inp.keys = {}; inp.joy = null; if (G.state === 'play') G.state = 'paused'; });
    window.addEventListener('mouseup', function (e) { inp.keys['Mouse' + e.button] = false; });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    bindPointer();
  }

  // Entrada unificada con Pointer Events: ratón (hover, clic izquierdo / derecho) y táctil / lápiz (varios dedos a la vez, cada uno con su pointerId).
  // Táctil: toque corto = clic (al soltar, en coordenadas del juego); joystick flotante con un dedo que empieza en la mitad izquierda
  // (solo en la aldea caminando o en la expedición); deslizar horizontal = inp.swipe (-1 izquierda / +1 derecha, un paso); arrastre vertical = inp.drag (scroll de listas).
  function bindPointer() {
    var tc = {};
    inp.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
    inp.dragY = 0;
    function pt(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * G.W / r.width, y: (e.clientY - r.top) * G.H / r.height };
    }
    function joyOK(p) {
      if (p.x >= G.W / 2) return false;
      if (G.Sys && G.Sys.onButton(p)) return false;
      if (G.state === 'play') return true;
      return G.state === 'aldea' && G.Aldea.joyOK();
    }
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault(); try { G.Snd.unlock(); } catch (x) { /* audio */ }
      try { canvas.setPointerCapture(e.pointerId); } catch (x2) { /* sin captura */ }
      var p = pt(e);
      if (e.pointerType === 'mouse') {
        if (G.Sys) G.Sys.touchActive = false;
        inp.mouse.x = p.x; inp.mouse.y = p.y; inp.keys['Mouse' + e.button] = true; inp.pressed['Mouse' + e.button] = true;
        return;
      }
      if (G.Sys) G.Sys.touchActive = true;
      tc[e.pointerId] = { x0: p.x, y0: p.y, t0: performance.now(), x: p.x, y: p.y, joy: false };
      inp.mouse.x = p.x; inp.mouse.y = p.y;
      if (!inp.joy.active && joyOK(p)) { tc[e.pointerId].joy = true; inp.joy = { active: true, id: e.pointerId, ox: p.x, oy: p.y, x: 0, y: 0 }; }
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = pt(e);
      if (e.pointerType === 'mouse') { inp.mouse.x = p.x; inp.mouse.y = p.y; return; }
      var o = tc[e.pointerId]; if (!o) return;
      e.preventDefault();
      if (!o.joy) inp.dragY += p.y - o.y;
      o.x = p.x; o.y = p.y; inp.mouse.x = p.x; inp.mouse.y = p.y;
      if (o.joy) {
        var dx = p.x - inp.joy.ox, dy = p.y - inp.joy.oy, d = Math.hypot(dx, dy), R = 56;
        if (d > R) { inp.joy.ox += dx / d * (d - R); inp.joy.oy += dy / d * (d - R); dx = p.x - inp.joy.ox; dy = p.y - inp.joy.oy; d = R; }
        inp.joy.x = d > 8 ? dx / R : 0; inp.joy.y = d > 8 ? dy / R : 0;
      }
    });
    function end(e) {
      if (e.pointerType === 'mouse') { inp.keys['Mouse' + e.button] = false; return; }
      var o = tc[e.pointerId]; if (!o) return;
      e.preventDefault();
      var p = pt(e); delete tc[e.pointerId];
      var moved = Math.hypot(p.x - o.x0, p.y - o.y0), dur = performance.now() - o.t0;
      if (o.joy) inp.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
      inp.mouse.x = p.x; inp.mouse.y = p.y;
      if (e.type === 'pointercancel') return;
      if (moved < 18 && dur < 600) inp.pressed.Mouse0 = true;
      else if (Math.abs(p.x - o.x0) > 90 && Math.abs(p.y - o.y0) < 60 && dur < 700 && !o.joy) inp.swipe = p.x > o.x0 ? 1 : -1;
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', function (e) { if (tc[e.pointerId]) end({ pointerId: e.pointerId, pointerType: e.pointerType, type: 'pointercancel', preventDefault: function () {} }); });
    // suelta todos los dedos / teclas (pausa automática, cambio de pestaña, orientación)
    inp.releaseAll = function () { tc = {}; inp.keys = {}; inp.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; };
  }

  // ---------------------------------------------------------------- Mundo
  G.cam = { x: 0, y: 0 };
  G.state = 'aldea';   // aldea | play | paused | cards | gameover
  G.time = 0; G.kills = 0; G.won = false;

  G.reset = function () {
    G.time = G.t0; G.runT = G.t0; G.kills = 0; G.deadT = 0; G.won = false; G.pendingLevels = 0; G.endT = 0;
    G.enemies = []; G.projectiles = []; G.zones = []; G.gems = [];
    G.fx.clear();
    G.player = G.Player.create();
    G.Cards.reset();
    G.Weapons.reset();
    G.Waves.reset();
    G.Boss.reset();
    G.cam.x = G.clamp(G.player.x - G.W / 2, 0, G.AW - G.W);
    G.cam.y = G.Proj.clampCamY(G.player.y - G.VH / 2);
  };

  G.startGame = function () {
    try { Assets.unlock(); } catch (e) { /* sin audio */ }
    G.setLen(G.lenOverride || G.Save.data.len || 9);
    var pd = G.Save.data.pending;   // compras de Rufo (Tónico / Imán): valen para ESTA expedición
    var prac = (G.launchReq && G.launchReq.mode === 'practice') || (!G.launchReq && G.practiceUrl && (G.huntUrl || G.bossUrl));   // la práctica no gasta compras ni platos
    G.runBuff = { tonic: !prac && !!pd.tonic, magnet: !prac && !!pd.magnet }; if (!prac) { pd.tonic = 0; pd.magnet = 0; } G.Save.save();
    if (prac) { G.runBuff.dish = null; G.runBuff.fx = {}; }
    else try { G.Cook.begin(); } catch (e0) { G.runBuff.dish = null; G.runBuff.fx = {}; }   // Fase 2b: plato de Tía Castaña (consume pending.dish y deja su buff en G.runBuff.fx)
    G.Loot.beginRun();
    G.reset();
    // Destino (bioma) y jefe: el bioma elegido en el Portal decide el jefe (bosque = Pastor, cripta = Karceron, asfodelo = Letea).
    // Cripta exige haber vencido al Pastor y Asfodelo a Karceron (persistido en Save.data.bossKills); ?biome= y ?boss= saltan el bloqueo.
    // Modo de la salida (J3): 'run' normal, 'hunt' (cacería de Vesper: sin hordas) o 'practice' (sin riesgo ni recompensas). G.launchReq lo pide el Portal / el Tablón de Vesper.
    var rq = G.launchReq; G.launchReq = null;
    if (!rq && G.huntUrl) rq = { mode: G.practiceUrl ? 'practice' : 'hunt', boss: G.huntUrl };
    if (!rq && G.practiceUrl && G.bossUrl) rq = { mode: 'practice', boss: G.bossUrl };
    G.lastReq = rq ? { mode: rq.mode, boss: rq.boss, peligro: rq.peligro, phase: rq.phase } : null;
    G.mode = rq ? rq.mode : 'run'; G.nointro = G.nointroUrl; G.huntHpMul = G.mode === 'hunt' ? 0.75 : G.mode === 'practice' ? 0.5 : 1; G.prep = null; G.dbgPhaseReq = 0;
    var biome = G.biomeUrl || G.Save.data.biome || 'bosque', BK = G.Save.data.bossKills;
    if (rq && !G.biomeUrl) biome = ({ pastor: 'bosque', karceron: 'cripta', letea: 'asfodelo', yarlak: 'tundra' })[rq.boss] || biome;
    else if (G.bossUrl && !G.biomeUrl) biome = ({ pastor: 'bosque', karceron: 'cripta', letea: 'asfodelo', yarlak: 'tundra' })[G.bossUrl] || biome;
    else if (!G.biomeUrl) {
      if (biome === 'asfodelo' && !BK.karceron) biome = BK.pastor ? 'cripta' : 'bosque';
      if (biome === 'cripta' && !BK.pastor) biome = 'bosque';
      if (biome === 'tundra' && !BK.letea) biome = BK.karceron ? 'asfodelo' : BK.pastor ? 'cripta' : 'bosque';   // P4: la Tundra se abre al vencer a Letea
    }
    G.curBiome = biome; try { if (!Assets.setBiome(biome)) Assets.setBiome('bosque'); } catch (e2) { /* sin bioma */ }   // la Tundra la registra assets_fam3.js (arena, vignette, nieve); si faltara, usa el bosque y el suelo propio de tundra.js
    G.Tundra.begin(biome);   // P3: hielo, Frío, ventisca, hogueras y estalagmitas solo en la Tundra
    G.B.mat.sync();   // debilidades por material (A.8): solo en biomas con familia activa (ready) salvo ?mat=
    G.Enemies.initPonds();   // P2 (A.5, M5): charcos fijos del Asfódelo (G.ponds), vacío en los demás biomas
    if (G.groundBiome !== biome || biome === 'tundra') { G.ground = buildGround(biome); G.groundBiome = biome; }
    G.bossId = G.Boss.bossFor(biome);
    if (rq) G.bossId = rq.boss;
    else if (G.bossUrl) G.bossId = G.bossUrl;
    // Peligro: el URL manda (pruebas); si no, el elegido en el Portal / Tablón (limitado a lo desbloqueado); ?boss= sin ?peligro= = Peligro I; la práctica no tiene Peligro
    if (G.mode === 'practice') G.peligro = 1;
    else if (rq && rq.peligro) G.peligro = G.peligroUrl ? qnum('peligro', 1) : Math.min(rq.peligro, G.Save.pelMax(G.bossId));
    else if (!G.peligroUrl) G.peligro = G.bossUrl || rq ? 1 : G.Save.pelSel(G.bossId);
    else G.peligro = qnum('peligro', 1);
    G.dbgPhase = (rq && rq.phase) || qnum('phase', 0);
    if (G.bossUrl || rq) { G.time = G.runT = G.BOSS_T - 100; G.Waves.elitesDone = { mini_bulwark: true, mini_hive: true, mini1: true, mini2: true }; }
    if (G.mode !== 'run') {   // cacería / práctica: arena solo con el jefe; 6 ofertas de preparación (la práctica reutiliza la mano del primer intento)
      var sv = G.Save.data, rec = sv.practice[G.bossId] = sv.practice[G.bossId] || { tries: 0, wins: 0 };
      if (G.mode === 'practice') { rec.tries++; G.practiceTries = rec.tries; }
      else G.Save.hunt(G.bossId, Math.round(G.peligro)).tries++;
      G.Save.save();
      G.nointro = G.nointroUrl || (G.mode === 'practice' && rec.tries > 1);
    }
    var hq = /[?&]hand=([^&]+)/.exec(location.search);
    if (G.mode === 'practice' && G.practiceHand && G.practiceHand.boss === G.bossId && !hq) {   // reinicio rápido: misma mano del intento anterior
      G.practiceHand.hand.forEach(function (h) { if (h) for (var n = 0; n < h.lvl; n++) G.Cards.add(h.id); });
      G.Cards.recalc(false);
    } else if (G.mode !== 'run' && !hq && !G.noPrep) G.prep = { left: 6, total: 6 };
    if (hq) { decodeURIComponent(hq[1]).split(',').forEach(function (kv) { var a = kv.split(':'), n = parseInt(a[1], 10) || 1; for (var i = 0; i < n; i++) G.Cards.add(a[0]); }); G.Cards.recalc(false); }
    // Las anclas ya están en la mano (Cards.reset). Si no hay ningún arma, primera decisión: 1 de 3 cartas iniciales
    var armed = G.player.hand.some(function (s) { return s && G.Cards.def(s.id).type === 'attack'; });
    if (G.prep) { try { G.Boss.stinger('prep'); } catch (e3) { /* audio */ } G.pendingLevels = G.prep.left; G.state = 'cards'; G.Cards.open('level'); }   // preparación: 6 ofertas seguidas, sin esperar a la XP
    else if (armed) G.state = 'play';
    else { G.state = 'cards'; G.Cards.open('start'); }
    inp.lock = 250;
    try { Assets.music.setTrack(biome === 'tundra' && Assets.music.tracks().indexOf('tundra') >= 0 ? 'tundra' : 'normal'); Assets.music.setIntensity(0.1); Assets.music.start(); } catch (e) { /* sin audio */ }
  };

  G.finish = function (won) {
    if (G.state === 'gameover') return;
    G.won = won; G.state = 'gameover';
    G.finalHand = G.Cards.snapshot();
    if (G.mode === 'practice') G.Loot.endPractice(won); else G.Loot.endRun(won);   // la práctica no toca el guardado (solo el contador de intentos)
    G.sfx(won ? 'boss_die' : 'game_over');
    if (won) { try { G.Snd.play(G.bossId === 'yarlak' ? 'stg_yarlak_victory' : 'win'); } catch (e) { /* audio */ } }
    try { Assets.music.stop(); } catch (e) { /* sin audio */ }
    G.Tundra.end();   // apaga el viento de la ventisca
  };

  // ---------------------------------------------------------------- Actualización
  function updateWorld(dt) {
    G.time += dt;
    if (!(G.Boss.active || G.Boss.defeated) && G.mode === 'run') G.runT += dt;   // el reloj de la run se congela mientras el jefe vive
    G.Player.update(G.player, dt);
    G.Weapons.update(dt);
    G.Enemies.update(dt);
    G.Combat.update(dt);
    G.Tundra.update(dt);   // Frío, ventisca y hogueras (solo en la Tundra)
    G.Waves.update(dt);
    G.Hud.update(dt);
    G.fx.update(dt);
    var p = G.player;
    var tx = G.clamp(p.x - G.W / 2, 0, G.AW - G.W), ty = G.Proj.clampCamY(p.y - G.VH / 2);
    var ct = G.Boss.camTarget(tx, ty);   // la intro del jefe desplaza la cámara y hace zoom
    G.cam.x += (ct.x - G.cam.x) * 0.15; G.cam.y += (ct.y - G.cam.y) * 0.15;
    if (p.dead) { G.deadT += dt; if (G.deadT > 900) G.finish(false); return; }
    if (G.bossDead) { G.endT += dt; if (G.endT > 3000) G.finish(true); return; }
    if (G.pendingLevels > 0) { G.state = 'cards'; G.Cards.open('level'); }
  }

  function step() {
    var dt = G.STEP;
    if (inp.lock > 0) inp.lock -= dt;
    if (inp.pressed.Mouse0 && G.Sys && G.Sys.tap(inp.mouse)) inp.pressed.Mouse0 = false;   // botones de sistema (pausa, silencio, pantalla completa)
    switch (G.state) {
      case 'aldea':
        G.Aldea.update(dt);
        break;
      case 'play':
        if (inp.hit('KeyP', 'Escape')) { G.state = 'paused'; G.Hud.pauseOpen(); break; }
        if (G.fx.hitstop > 0) { G.fx.hitstop -= dt; G.fx.updateShake(dt); break; }
        updateWorld(dt);
        break;
      case 'paused':
        if (inp.hit('KeyP', 'Escape')) G.state = 'play';
        else if (inp.hit('KeyB')) G.finish(false);   // abandonar: conserva las partes recogidas y va al botín
        else if (inp.hit('KeyR') && G.mode === 'practice') G.Base.retryPractice();   // práctica: reinicio rápido
        else if (inp.hit('Mouse0')) G.Hud.pauseClick(inp.mouse);   // táctil / ratón: CONTINUAR, CALIDAD, SONIDO, REINICIAR, ABANDONAR
        break;
      case 'cards':
        G.fx.updateShake(dt);
        G.Cards.update(dt);
        break;
      case 'gameover':
        G.fx.update(dt);
        G.Base.updateEnd();
        break;
    }
    inp.pressed = {}; inp.swipe = 0; inp.dragY = 0;
  }

  // ---------------------------------------------------------------- Render
  function buildGround(biome) {
    if (biome === 'tundra') { G.torches = []; G.ritual = null; return G.Tundra.buildGround(); }   // P3: suelo de hielo propio (parches de nieve firme, grietas)
    var A = Assets.arena(G.AW, G.AH, { seed: 777, wall: G.WALL });
    G.torches = A.torches; G.ritual = A.ritual;
    return A.canvas;
  }

  function drawJoy(c) {
    var j = inp.joy; if (!j || !j.active) return;
    c.save(); c.globalAlpha = 0.5; c.lineWidth = 4; c.strokeStyle = '#ffe9a0'; c.fillStyle = 'rgba(255,233,160,0.12)';
    c.beginPath(); c.arc(j.ox, j.oy, 52, 0, 6.283); c.fill(); c.stroke();
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(j.ox + j.x * 40, j.oy + j.y * 40, 22, 0, 6.283); c.fill(); c.restore();
  }

  function draw() {
    var rs = G.rs || 1;
    ctx.setTransform(rs, 0, 0, rs, 0, 0);   // el lienzo puede tener más píxeles que 960x540 (móvil / pantallas HiDPI): se dibuja siempre en coordenadas lógicas
    ctx.imageSmoothingEnabled = false;
    if (G.state === 'aldea') { G.Aldea.draw(ctx); drawJoy(ctx); G.Sys.drawBar(ctx); return; }
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, G.W, G.H);
    var off = G.fx.offset();
    ctx.save();
    var zm = G.cam.zoom || 1, P = G.Proj, i, TN = G.Tundra.on;
    if (zm !== 1) { ctx.translate(G.W / 2, G.H / 2); ctx.scale(zm, zm); ctx.translate(-G.W / 2, -G.H / 2); }
    P.begin(ctx, G.ground, G.cam.x, G.cam.y, off.x, off.y);   // vista inclinada: suelo prerrenderizado aplastado y mundo con scale(1, isoK); plana: como siempre
    G.Combat.drawZones(ctx);
    G.Weapons.drawGround(ctx);
    if (TN) G.Tundra.drawGround(ctx);   // P3: hoguera (calor y luz), nieve firme animada, aviso de grietas
    G.Enemies.drawGround(ctx, TN ? 1 : 0);   // Tundra: capa base (la bruma va encima; las telegrafías se dibujan después, por encima de ella)
    if (!TN) G.Boss.drawGround(ctx);
    G.fx.drawCorpses(ctx);
    G.Combat.drawGems(ctx);
    var items = G.enemies.filter(function (q) { return q.type !== 'bosspart'; }); items.push(G.player); G.Boss.items(items);
    if (TN) G.Tundra.items(items);   // estalagmitas y hogueras (ordenadas por y con el resto)
    items.sort(function (a, b) { return (a.sortY != null ? a.sortY : a.y) - (b.sortY != null ? b.sortY : b.y); });
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      P.up(ctx, it.ux != null ? it.ux : it.x, it.uy != null ? it.uy : it.y, P.footOf(it));   // sprites de pie, anclados al punto lógico
      if (it === G.player) G.Player.draw(ctx, G.player); else if (it.draw) it.draw(ctx, it); else G.Enemies.draw(ctx, it);
      P.down(ctx);
    }
    G.Weapons.drawAir(ctx);
    G.Enemies.drawProjectiles(ctx, TN ? 1 : 0);
    G.fx.draw(ctx);
    var tt = performance.now();
    if (G.ritual) Assets.drawRitualGlow(ctx, G.ritual.x, G.ritual.y, tt, G.ritual.r);
    for (var ti = 0; ti < G.torches.length; ti++) {
      var tq = G.torches[ti];
      P.up(ctx, tq.x, tq.y);
      if (P.iso) ctx.translate(0, ((tq.o && tq.o.candle ? Assets.sprite('candle').height * 1.35 : Assets.sprite('torch').height)) * (1 - P.K));   // el poste horneado en el suelo está aplastado: la llama baja con él
      Assets.drawTorchFire(ctx, tq.x, tq.y, tt, tq.o);
      P.down(ctx);
    }
    var Q = G.Q;
    if (Q.flies > 0) Assets.drawFireflies(ctx, G.AW, G.AH, tt, { count: Q.flies, view: { x: G.cam.x, y: G.cam.y, w: G.W, h: G.VH } });
    if (Q.fog > 0) Assets.drawFog(ctx, G.AW, G.AH, tt, { alpha: 0.4, layers: Q.fog });
    ctx.restore();
    if (TN) {   // P3: bruma de la ventisca (pantalla) y, por encima de ella, telegrafías, proyectiles enemigos y jefe (B.1.3: nunca se tapan)
      G.Tundra.drawHaze(ctx);
      ctx.save();
      if (zm !== 1) { ctx.translate(G.W / 2, G.H / 2); ctx.scale(zm, zm); ctx.translate(-G.W / 2, -G.H / 2); }
      P.beginTf(ctx, G.cam.x, G.cam.y, off.x, off.y);
      G.Enemies.drawGround(ctx, 2);
      G.Boss.drawGround(ctx);
      G.Enemies.drawProjectiles(ctx, 2);
      ctx.restore();
    }
    if (Q.vig) ctx.drawImage(Assets.vignette(G.W, G.H, { strength: 0.8 }), 0, 0);
    if (TN) G.Tundra.drawVignette(ctx);   // escarcha del Frío en bordes y esquinas
    G.Hud.draw(ctx);
    drawJoy(ctx);
    if (G.state === 'play') G.Sys.drawBar(ctx);
  }

  // ---------------------------------------------------------------- Bucle
  var last = 0, acc = 0;
  G.resetClock = function () { last = performance.now(); acc = 0; };   // tras una pausa del navegador: sin saltos de tiempo
  function frame(t) {
    var raw = t - last, d = Math.min(100, raw); last = t; acc += d * G.speed;
    G.Sys.frame(raw);
    var n = 0, maxN = Math.ceil(6 * G.speed);
    while (acc >= G.STEP && n < maxN) { step(); acc -= G.STEP; n++; }
    if (n === maxN) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }

  G.init = function () {
    canvas = document.getElementById('game'); ctx = canvas.getContext('2d');
    G.ctx = ctx; canvas.focus();
    bindInput();
    G.Save.applyUrl();
    G.Sys.init(canvas);   // móvil: escala, calidad, pausa automática, audio, pantalla completa (mobile.js)
    G.Proj.initFromUrl();   // vista plana (por defecto) o inclinada (?view=iso / Ajustes)
    G.shakeMul = (G.Save.data.settings && G.Save.data.settings.shake) ? 1 / 3 : 1;   // accesibilidad: reducir sacudidas
    G.Tree.sync();
    var bq = /[?&]biome=(\w+)/.exec(location.search) || (G.Minis && G.Minis.urlBiome() ? [0, G.Minis.urlBiome()] : null); if (bq) { Assets.setBiome(bq[1]); G.biomeUrl = bq[1]; }   // 'tundra' no existe en assets.js: setBiome devuelve false
    else if (G.Save.data.biome) Assets.setBiome(G.Save.data.biome);
    G.ground = buildGround(G.biomeUrl === 'tundra' ? 'tundra' : null); G.groundBiome = G.biomeUrl === 'tundra' ? 'tundra' : Assets.getBiome();   // (el suelo de la Tundra lo hornea tundra.js con Assets.arena)
    G.reset();
    G.Aldea.open(false);
    if (G.bossUrl || G.huntUrl) G.startGame();   // ?boss=pastor / ?hunt=pastor: salta directo a la pelea (cacería con &practice=1: práctica)
    requestAnimationFrame(function (t) { last = t; frame(t); });
  };
})();
