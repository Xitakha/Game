/* families.js - Familias de monstruos por bioma (DESIGN-v5-biomas.md, parte A, fase P0 = SOLO infraestructura).
   El tipo es el ROL (las 11 claves de G.B.enemy); el bioma pone la piel y los ajustes. Aquí viven:
   - G.B.fam[bioma]   = { ready, boss, use:{ rol -> ajustes }, packs, light, amb, ponds, star }
   - G.B.famOf / entry / has / val / tierOf   (resolución según el bioma activo G.curBiome)
   - G.B.mat          = tabla de materiales x etiquetas (A.8) + G.B.matMul(e, tag), aplicada en Combat.deal / Combat.dot
   - G.B.packsLegacy  = los 4 packs actuales (estructura de datos que consume waves.js)
   P0 = infraestructura (entradas identidad). P1 (v5.1): Bosque y Cripta tienen su familia propia y `ready:true` (tablas A.3 / A.4 de DESIGN-v5-biomas.md);
   P2 (v5.2): Asfódelo también tiene su familia propia (A.5) y `ready:true`. La tabla de materiales (A.8) se enciende sola solo en biomas con familia activa (G.B.mat.sync()).
   Parámetros de URL: ?fam=0 (fuerza el roster legado), ?fam=1 (fuerza las familias donde existan), ?mat=1|0 (tabla de materiales).
   Ver README, sección "Familias por bioma (P0)". */
(function () {
  'use strict';
  var G = window.G, B = G.B;

  function qnum(name) { var m = new RegExp('[?&]' + name + '=(\\d+)').exec(location.search); return m ? parseInt(m[1], 10) : null; }

  // ---------------------------------------------------------------- Modo
  // 'auto' = solo los biomas con ready:true; 0 = roster legado en todas partes; 1 = familias en todo bioma que tenga `use` no vacío.
  var fq = qnum('fam');
  B.famMode = fq === 0 ? 0 : fq === 1 ? 1 : 'auto';

  // ---------------------------------------------------------------- Materiales (A.8): 13 materiales x 6 etiquetas, +-25 %
  B.mat = {
    on: false,                                   // lo fija G.B.mat.sync() al empezar la run: true si el bioma tiene familia activa (ready) o ?mat=1; ?mat=0 la apaga siempre
    force: null,                                 // ?mat=1|0 (null = automático)
    min: 0.75, max: 1.25,                        // límites del multiplicador
    tags: ['fire', 'ice', 'lightning', 'poison', 'blood', 'steel'],
    //            fuego  hielo  rayo   veneno sangre acero
    table: {
      carne:    [1,    1,    1,    1,    1,    1],
      lana:     [1.25, 0.75, 1,    1,    1,    1],
      vegetal:  [1.25, 1,    1,    0.75, 0.75, 1],
      hueso:    [1,    1,    1,    0.75, 0.75, 1.25],
      metal:    [1,    1,    1.25, 0.75, 1,    0.75],
      magma:    [0.75, 1.25, 1,    0.75, 1,    1],
      espectro: [1,    1,    1.25, 1,    0.75, 0.75],
      pantano:  [1,    0.75, 1.25, 1.25, 1,    1],
      pelaje:   [1,    0.75, 1,    1,    1.25, 1],
      escarcha: [1.25, 0.75, 1,    1,    1,    1.25],
      insecto:  [1.25, 1.25, 1,    0.75, 1,    1],
      cera:     [1.25, 1,    0.75, 1,    1,    1],
      miel:     [1,    1.25, 1,    0.75, 1,    1]
    }
  };
  var mq = qnum('mat'); if (mq != null) { B.mat.force = mq > 0; B.mat.on = mq > 0; }
  B.mat.sync = function () { B.mat.on = B.mat.force != null ? B.mat.force : !!B.famOf(); };   // (famOf: bioma activo con familia ready, o ?fam=1; ?fam=0 -> false)
  B.mat.index = {}; B.mat.tags.forEach(function (t, i) { B.mat.index[t] = i; });

  // Multiplicador de material de un enemigo para una etiqueta (1 si no hay material, la tabla está apagada o la etiqueta no cuenta).
  // Excepciones por monstruo: e.mx = { etiqueta: multiplicador } (p. ej. Anguila: rayo 0,75). Jefes, partes y adds sin `mat`: siempre 1.
  B.matMul = function (e, tag) {
    if (!B.mat.on || !e.mat) return 1;
    var i = B.mat.index[tag]; if (i == null) return 1;
    var v = e.mx && e.mx[tag] != null ? e.mx[tag] : (B.mat.table[e.mat] || B.mat.table.carne)[i];
    return v < B.mat.min ? B.mat.min : v > B.mat.max ? B.mat.max : v;
  };

  // ---------------------------------------------------------------- Packs (A.9): estructura de datos. layout = forma de spawn en waves.js
  // Los 4 packs actuales; la lista de cada bioma puede reemplazarse por la suya (A.9) en P1/P2. parts = [rol, cantidad].
  B.packsLegacy = [
    { id: 'line',   layout: 'line',   parts: [['shield', 3], ['warlock', 1]] },
    { id: 'cross',  layout: 'cross',  parts: [['fanner', 2]] },
    { id: 'pincer', layout: 'pincer', parts: [['scorcher', 2], ['moth', 1]] },
    { id: 'field',  layout: 'field',  parts: [['sower', 2], ['worm', 4]] }
  ];

  // ---------------------------------------------------------------- Familias
  // Entrada de `use`:  { name, spr, skin, tier, from, w, cost, maxAlive, capGrow, hp, spd, dmg, mat, mx, mods, host }
  //   spr  = sprite propio (null/ausente o inexistente -> sprite actual del rol: fallback); skin = { tint, a } tinte opcional sobre el sprite.
  //   from/w/cost/maxAlive ausentes = los de G.B.enemy[rol]. hp/spd/dmg = multiplicadores (ausente = 1). mat = material (G.B.mat.table).
  //   host:true = rol "huésped" que en P1 deja de existir en ese bioma (el Bosque pierde shield/bomb/blinker/scorcher; decisión del dueño).
  // U(): construye una entrada identidad con el tier legado de G.B.tier.
  function U(name, mat, extra) { var o = { name: name, tier: null, mat: mat, hp: 1, spd: 1, dmg: 1, spr: null }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function fill(use) { Object.keys(use).forEach(function (k) { if (use[k].tier == null) use[k].tier = B.tier[k]; }); return use; }
  var LIGHT = { worm: 1, archer: 1, fanner: 1, bomb: 1, moth: 1 };   // tipos permitidos con el jefe vivo (hoy G.B.light); dato por bioma, hoy sin consumidor
  function light() { return Object.assign({}, LIGHT); }
  function amb() { return { flies: 1, fog: 1, vig: 1, tint: null }; }   // ambiente por bioma: multiplicadores sobre la calidad actual (1 = aspecto actual). Sin consumidor en P0.

  B.fam = {
    // ---- BOSQUE (P1, A.3): el rebaño del Pastor. 8 tipos propios; Escudero/Bomba/Espectro/Ascua ya no existen aquí (decisión del dueño) y los guardianes (Coloso, Madre Colmena) se quedan.
    //      Suma de w por tier = 55 / 44 / 29 / 25 (A.2). `proj`/`sfx` = proyectil y SFX propios de la telegrafía; `sc` = escala de cuerpo y sprite.
    bosque: {
      name: 'El rebaño del Pastor', ready: true, boss: 'pastor', ponds: 0, star: null, light: { worm: 1, archer: 1, fanner: 1, moth: 1 }, amb: amb(),
      host: [['plate', 0.009], ['static', 0.014]],   // P2 economía: Placa y Estática ya no caen en el Bosque (sin Escudero / Espectro): tiradas extra pequeñas por baja (la Mecha la da el Perro pastor)
      packs: [
        { id: 'cruce',    layout: 'cross', parts: [['fanner', 2]] },                    // 2 Zarzales mayores en lados opuestos
        { id: 'campo',    layout: 'field', parts: [['sower', 2], ['worm', 4]] },       // 2 Micelios + 4 Corderos
        { id: 'pastoreo', layout: 'cross', parts: [['dog', 2], ['worm', 3]] },         // 2 Perros pastores opuestos + 3 Corderos
        { id: 'zamponero', layout: 'line', parts: [['boar', 2], ['warlock', 1]] }      // 2 Jabalíes en línea + Zampoñero detrás
      ],
      lens: { best: ['fire'], worst: ['ice', 'poison', 'blood'] },                     // lo que ve el jugador en el Portal (A.8, lectura por bioma)
      use: {
        worm:    U('Cordero corrupto', 'lana',    { tier: 0, from: 0,      w: 55, cost: 1, maxAlive: 40, spr: 'enemy_bos_cordero', sfx: { spawn: 'lamb_bleat' } }),
        archer:  U('Zarzal menor',     'vegetal', { tier: 1, from: 45000,  w: 26, cost: 3, maxAlive: 12, hp: 1.2, spr: 'enemy_bos_zarzal', proj: 'proj_thorn_small', fb: 'thorn', sfx: { shoot: 'thorn_shot' } }),
        fanner:  U('Zarzal mayor',     'vegetal', { tier: 1, from: 90000,  w: 18, cost: 4, maxAlive: 8,  spr: 'enemy_bos_zarzal', sc: 1.15, skin: { tint: '#2a1236', a: 0.38 }, sfx: { shoot: 'thorn_shot' } }),
        boar:    U('Jabalí',           'carne',   { tier: 2, from: 120000, w: 14, cost: 5, maxAlive: 8, drop: ['fang', 0.11] }),   // P2 economía: Colmillo 0,14 -> 0,11 (el Perro ya no suelta Colmillo)
        moth:    U('Polilla de lana',  'lana',    { tier: 2, from: 240000, w: 15, cost: 4, maxAlive: 6, spd: 0.9, spr: 'enemy_bos_polilla', proj: 'proj_wool_orb', orbSlow: [0.30, 2000], sfx: { shoot: 'wool_puff', move: 'moth_flutter' } }),
        dog:     U('Perro pastor',     'lana',    { tier: 3, from: 165000, w: 8,  cost: 5, maxAlive: 2, capGrow: 1, drop: ['wick', 0.17], spr: 'enemy_bos_perro' }),   // P2: tope 2 (antes 3 -> 4) para que no pase del 10 % de los enemigos en pantalla (medido 11,9 % de media, 15 % máx.); drop = Mecha (economía inicial, ver loot.js)
        sower:   U('Micelio',          'vegetal', { tier: 3, from: 270000, w: 9,  cost: 5, maxAlive: 3, capGrow: 1.7, sfx: { tele: 'spore_puff' } }),
        warlock: U('Zampoñero',        'carne',   { tier: 3, from: 405000, w: 8,  cost: 8, maxAlive: 2, capGrow: 2, spr: 'enemy_bos_zamponero', sfx: { tele: 'zampona_pipe' } })
      }
    },
    // ---- CRIPTA (P1, A.4): los presos de Karceron. 9 tipos; no usa fanner/moth/sower/warlock. Las invocaciones de Karceron (Ascuas + Alma prisionera) ya son de la familia.
    cripta: {
      name: 'Los presos de Karceron', ready: true, boss: 'karceron', ponds: 0, star: null, light: { worm: 1, archer: 1, bomb: 1 }, amb: amb(), packs: [
        { id: 'presos',  layout: 'line',   parts: [['shield', 3], ['blinker', 1]] },    // Fila de presos: 3 Carceleros + 1 Alma prisionera detrás
        { id: 'hornos',  layout: 'pincer', parts: [['scorcher', 2], ['salamander', 1]] }, // Hornos: 2 Ascuas opuestas + 1 Salamandra
        { id: 'boliche', layout: 'cross',  parts: [['boar', 2], ['worm', 3]] },          // Boliche: 2 Calaveras rodantes opuestas + 3 Esqueletos
        { id: 'cadena',  layout: 'line',   parts: [['shield', 2], ['chainer', 1]] }      // Cadena de presos: 2 Carceleros en línea + Guardián de cadenas detrás
      ],
      lens: { best: ['ice', 'steel', 'lightning'], worst: ['fire', 'poison', 'blood'] },
      use: {
        worm:       U('Esqueleto',          'hueso',    { tier: 0, from: 0,      w: 55, cost: 1, maxAlive: 40, hp: 1.15, spd: 0.95, spr: 'enemy_cri_esqueleto', sfx: { spawn: 'bone_rattle' } }),
        archer:     U('Arquero de huesos',  'hueso',    { tier: 1, from: 45000,  w: 30, cost: 3, maxAlive: 14, spr: 'enemy_cri_arquero', proj: 'proj_bone_arrow', fb: 'arrow', sfx: { shoot: 'bone_arrow' } }),
        bomb:       U('Calavera explosiva', 'hueso',    { tier: 1, from: 90000,  w: 14, cost: 2, maxAlive: 6,  spr: 'enemy_cri_calavera_exp', sfx: { boom: 'skull_explode' } }),
        boar:       U('Calavera rodante',   'hueso',    { tier: 2, from: 120000, w: 10, cost: 5, maxAlive: 6,  hp: 0.8, spr: 'enemy_cri_calavera_rod', roll: true }),
        shield:     U('Carcelero menor',    'metal',    { tier: 2, from: 165000, w: 10, cost: 5, maxAlive: 6,  hp: 1.1, spr: 'enemy_cri_carcelero', sfx: { bash: 'shield_bash' } }),
        salamander: U('Salamandra de lava', 'magma',    { tier: 2, from: 240000, w: 9,  cost: 5, maxAlive: 4,  spr: 'enemy_cri_salamandra' }),
        chainer:    U('Guardián de cadenas','metal',    { tier: 3, from: 270000, w: 8,  cost: 6, maxAlive: 3, capGrow: 1.5, spr: 'enemy_cri_guardian_cadenas' }),
        blinker:    U('Alma prisionera',    'espectro', { tier: 3, from: 315000, w: 9,  cost: 6, maxAlive: 4,  spr: 'enemy_cri_alma' }),
        scorcher:   U('Ascua',              'magma',    { tier: 3, from: 360000, w: 8,  cost: 6, maxAlive: 3 })
      }
    },
    // ---- ASFODELO (P2, A.5): el río de Letea. 8 tipos; no usa archer/fanner/bomb/shield/blinker. 6 charcos fijos (G.ponds, r 36). Las invocaciones de Letea (Plañideras = 3 `moth`) son Medusas heladas.
    //      Suma de w por tier = 55 / 44 / 29 / 25. `fbSpr`/`fbSkin` = sprite existente teñido que se usa mientras el sprite propio no exista (nunca placeholder si hay arte).
    //      nosep = M10 (sin separación entre enemigos), hop = M6 (salto balístico), eel = M8 (línea instantánea), olvido = M9 (zona turquesa + p.cdSlow), regrow = M7 (rebrote / cauterización).
    asfodelo: {
      name: 'El río de Letea', ready: true, boss: 'letea', ponds: 6, bp: 1.0, bpFrom: 2, star: null, light: { worm: 1, leech: 1, boar: 1 }, amb: amb(), packs: [
        { id: 'pantano', layout: 'group',  parts: [['leech', 3], ['worm', 3]] },          // Pantano: 3 Sanguijuelas (cada una en su charco) + 3 Almas errantes
        { id: 'pinza',   layout: 'pincer', parts: [['scorcher', 2], ['moth', 1]] },        // Pinza eléctrica: 2 Anguilas opuestas + 1 Medusa
        { id: 'lirios',  layout: 'field',  parts: [['sower', 2], ['worm', 4]] },           // Campo de lirios: 2 Lirios + 4 Almas
        { id: 'coro',    layout: 'group',  parts: [['warlock', 1], ['worm', 4]] }          // Coro: Sacerdotisa + 4 Almas
      ],
      lens: { best: ['lightning', 'poison'], worst: ['ice', 'steel', 'blood'] },
      use: {
        worm:     U('Alma errante',        'espectro', { tier: 0, from: 0,      w: 55, cost: 1, maxAlive: 40, hp: 0.9, spd: 1.1, nosep: true, alpha: 0.8, spr: 'enemy_asf_alma_errante', fbSpr: 'worm', fbSkin: { tint: '#8fe6d8', a: 0.4 }, sfx: { spawn: 'drown_whisper', die: 'drown_wail' } }),
        leech:    U('Sanguijuela',         'pantano',  { tier: 1, from: 45000,  w: 26, cost: 3, maxAlive: 7, spr: 'enemy_asf_sanguijuela', fbSpr: 'worm', fbSkin: { tint: '#7a1830', a: 0.6 }, sfx: { tele: 'pond_bubble', lunge: 'leech_lunge', swim: 'pond_swim' } }),
        boar:     U('Rana ácida',          'pantano',  { tier: 1, from: 90000,  w: 18, cost: 4, maxAlive: 8,  hp: 0.5, dmg: 10 / 14, hop: true, spr: 'enemy_asf_rana', fbSpr: 'boar', fbSkin: { tint: '#7be34a', a: 0.5 }, sfx: { tele: 'frog_crouch', hop: 'frog_hop', land: 'frog_land', splash: 'frog_splash' } }),
        headlet:  U('Cabeza menor',        'pantano',  { tier: 2, from: 120000, w: 14, cost: 5, maxAlive: 3,  mx: { fire: 1.25 }, regrow: { ms: 8000, hp: 0.6, max: 2 }, spr: 'enemy_asf_cabeza_menor', fbSpr: 'warlock', fbSkin: { tint: '#2f9a8a', a: 0.55 }, sfx: { tele: 'head_emerge', bite: 'head_bite', regrow: 'head_regrow', burn: 'head_burn' } }),
        moth:     U('Medusa helada',       'pantano',  { tier: 2, from: 210000, w: 15, cost: 4, maxAlive: 5,  hp: 1.1, spd: 0.9, mx: { fire: 1.25 }, proj: 'proj_frost_orb', orbSlow: [0.35, 2000], spr: 'enemy_asf_medusa', fbSpr: 'enemy_moth', fbSkin: { tint: '#7fe8e0', a: 0.3 }, sfx: { move: 'medusa_charge', shoot: 'medusa_throw', brk: 'orb_shatter' } }),
        sower:    U('Lirio del olvido',    'vegetal',  { tier: 3, from: 270000, w: 9,  cost: 5, maxAlive: 3, capGrow: 1.7, dmg: 0.5, olvido: true, spr: 'enemy_asf_lirio', fbSpr: 'enemy_sower', fbSkin: { tint: '#7fffe0', a: 0.4 }, sfx: { tele: 'olvido_chime', sow: 'olvido_sow', hum: 'olvido_hum' } }),
        scorcher: U('Anguila eléctrica',   'pantano',  { tier: 3, from: 315000, w: 8,  cost: 6, maxAlive: 3, capGrow: 1.2, hp: 0.9, spd: 1.1, dmg: 14 / 12, mx: { lightning: 0.75, ice: 1 }, eel: true, spr: 'enemy_asf_anguila', fbSpr: 'enemy_scorcher', fbSkin: { tint: '#ffe45a', a: 0.4 }, sfx: { tele: 'eel_charge', zap: 'eel_zap', dash: 'eel_dash' } }),
        warlock:  U('Sacerdotisa ahogada', 'espectro', { tier: 3, from: 405000, w: 8,  cost: 8, maxAlive: 3, capGrow: 1.2, spr: 'enemy_asf_sacerdotisa', fbSpr: 'warlock', fbSkin: { tint: '#33c8b8', a: 0.4 }, sfx: { tele: 'priestess_chant', summon: 'priestess_summon' } })
      }
    },
    // Esqueletos de los biomas nuevos (P3 / P5): use vacío = nunca activos, ni siquiera con ?fam=1 (cae al roster legado).
    tundra: { name: 'La manada de Yarlak', ready: false, boss: 'yarlak', ponds: 0, star: null, light: {}, amb: {}, packs: [], use: {} },
    panal:  { name: 'La colmena de Melaria', ready: false, boss: 'melaria', ponds: 0, star: null, light: {}, amb: {}, packs: [], use: {} }
  };

  // ---------------------------------------------------------------- Resolución según el bioma activo
  // Devuelve la familia a aplicar (o null = roster legado). Regla: ?fam=0 -> null; ?fam=1 -> toda familia con `use` no vacío; auto -> solo ready.
  B.famOf = function (biome) {
    var mode = B.famMode; if (mode === 0) return null;
    var f = B.fam[biome || G.curBiome]; if (!f) return null;
    if (f.nUse == null) f.nUse = Object.keys(f.use).length;
    if (!f.nUse) return null;
    return (mode === 1 || f.ready) ? f : null;
  };
  B.entry = function (type, biome) { var f = B.famOf(biome); return f ? f.use[type] || null : null; };
  // ¿Existe el rol en el bioma activo? (sin familia: todos los roles). Élites y jefe no pasan por aquí.
  // Los roles nuevos (B.enemy[x].famOnly: dog, salamander, chainer...) solo existen dentro de una familia activa.
  B.has = function (type) { var f = B.famOf(); return f ? !!f.use[type] : !B.enemy[type].famOnly; };
  // Parámetro del rol (from, w, cost, maxAlive, capGrow...) con override de la familia y herencia de G.B.enemy.
  B.val = function (type, field) {
    var f = B.famOf(), u = f && f.use[type], v = u && u[field];
    return v != null ? v : B.enemy[type][field];
  };
  B.tierOf = function (type) {
    var f = B.famOf(), u = f && f.use[type];
    return u && u.tier != null ? u.tier : B.tier[type];
  };
  // Entrada de material del rol en el bioma activo: NO exige `ready` (la tabla de materiales se prueba con ?mat=1 aunque la familia aún no esté activa); ?fam=0 la anula.
  B.matEntry = function (type) { if (B.famMode === 0) return null; var f = B.fam[G.curBiome]; return f && f.use[type] ? f.use[type] : null; };
  B.packsOf = function () { var f = B.famOf(); return f && f.packs && f.packs.length ? f.packs : B.packsLegacy; };
  // ---------------------------------------------------------------- Telegrafías de las familias P1 (única fuente de tiempos: las lee enemies.js; las audita B.teleAudit y tools p1_tests.js)
  // ms = aviso (desde que empieza hasta que hace daño); exit = px que el jugador debe recorrer para salir del peligro (radio de contacto incluido);
  // strong = ataque fuerte (>= 400 ms exigidos). Regla de esquiva: ms >= 250 + 1000 * exit / 190 (el jugador va a 190 px/s y tarda 250 ms en reaccionar).
  B.tele = {
    archer:   { name: 'Zarzal menor / Arquero de huesos (aim)', ms: 400, exit: 16, strong: true },
    fanner:   { name: 'Zarzal mayor (cono 40 grados)',          ms: 500, exit: 30, strong: true },
    boar:     { name: 'Jabalí (carga)',                         ms: 600, exit: 50, strong: true },
    moth:     { name: 'Polilla de lana (orbe)',                 ms: 450, exit: 20, strong: true },
    dog:      { name: 'Perro pastor (ladrido)',                 ms: 450, exit: 30, strong: true },
    sower:    { name: 'Micelio (zona de esporas)',              ms: 900, exit: 52, strong: true },
    warlock:  { name: 'Zampoñero (invocación)',                 ms: 500, exit: 0,  strong: false },
    bomb:     { name: 'Calavera explosiva (mecha)',             ms: 700, exit: 70, strong: true },
    roll:     { name: 'Calavera rodante (rueda)',               ms: 600, exit: 50, strong: true },
    bounce:   { name: 'Calavera rodante (2.º tramo tras rebote)', ms: 400, exit: 26, strong: true },
    shield:   { name: 'Carcelero menor (empellón)',             ms: 500, exit: 40, strong: true },
    salamander: { name: 'Salamandra (charco de lava)',          ms: 600, exit: 35, strong: true },
    chainer:  { name: 'Guardián de cadenas (cadena)',           ms: 700, exit: 30, strong: true },
    blinker:  { name: 'Alma prisionera (desvanece + tajo)',     ms: 850, exit: 60, strong: true },
    scorcher: { name: 'Ascua (carga)',                          ms: 600, exit: 30, strong: true },
    // ---- P2 (Asfódelo, A.5)
    leech:    { name: 'Sanguijuela (emboscada: anillo + línea)', ms: 500, exit: 30, strong: true },
    frog:     { name: 'Rana ácida (agacharse + círculo de aterrizaje)', ms: 500, exit: 30, strong: true },
    emerge:   { name: 'Cabeza menor (brota del charco, anillo r 32)',  ms: 700, exit: 42, strong: true },
    headlet:  { name: 'Cabeza menor (mordisco, anillo r 70)',    ms: 500, exit: 40, strong: true },
    eel:      { name: 'Anguila eléctrica (carril 18 x 300)',     ms: 700, exit: 20, strong: true },
    priest:   { name: 'Sacerdotisa ahogada (invocación)',        ms: 500, exit: 0,  strong: false }
  };
  B.teleOf = function (id) { return B.tele[id].ms; };
  B.teleRule = function (t) { return 250 + 1000 * t.exit / 190; };
  B.teleAudit = function () { return Object.keys(B.tele).map(function (k) { var t = B.tele[k], need = Math.round(B.teleRule(t)); return { id: k, name: t.name, ms: t.ms, exit: t.exit, need: need, ok: t.exit === 0 || (t.ms >= need && (!t.strong || t.ms >= 400)) }; }); };

  // Lectura de debilidades de un bioma para el Portal (A.8): { best:[etiquetas], worst:[etiquetas] } (solo si el bioma tiene familia lista y los materiales no están apagados por ?mat=0)
  B.matLens = function (biome) { var f = B.fam[biome]; if (!f || !f.lens || !f.ready || B.famMode === 0 || B.mat.force === false) return null; return f.lens; };
})();
