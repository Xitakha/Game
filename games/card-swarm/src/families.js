/* families.js - Familias de monstruos por bioma (DESIGN-v5-biomas.md, parte A, fase P0 = SOLO infraestructura).
   El tipo es el ROL (las 11 claves de G.B.enemy); el bioma pone la piel y los ajustes. Aquí viven:
   - G.B.fam[bioma]   = { ready, boss, use:{ rol -> ajustes }, packs, light, amb, ponds, star }
   - G.B.famOf / entry / has / val / tierOf   (resolución según el bioma activo G.curBiome)
   - G.B.mat          = tabla de materiales x etiquetas (A.8) + G.B.matMul(e, tag), aplicada en Combat.deal / Combat.dot
   - G.B.packsLegacy  = los 4 packs actuales (estructura de datos que consume waves.js)
   P0 no cambia nada visible ni de balance: todas las entradas son la identidad (heredan from/w/cost/maxAlive de G.B.enemy, hp/spd/dmg = 1,
   spr = null -> sprite actual), ningún bioma está `ready` y la tabla de materiales está apagada (G.B.mat.on = false).
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
    on: false,                                   // P0: apagado (balance idéntico). Se enciende cuando una familia pase a ready, o con ?mat=1
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
  var mq = qnum('mat'); if (mq != null) B.mat.on = mq > 0;
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
    bosque: {
      name: 'El rebaño del Pastor', ready: false, boss: 'pastor', ponds: 0, star: null, light: light(), amb: amb(), packs: B.packsLegacy,
      use: fill({
        worm: U('Cordero corrupto', 'lana'), archer: U('Zarzal menor', 'vegetal'), fanner: U('Zarzal mayor', 'vegetal'),
        boar: U('Jabalí', 'carne'), moth: U('Polilla de lana', 'lana'), sower: U('Micelio', 'vegetal'), warlock: U('Zampoñero', 'carne'),
        shield: U('Escudero', 'metal', { host: true }), bomb: U('Bomba', 'hueso', { host: true }),
        blinker: U('Espectro', 'espectro', { host: true }), scorcher: U('Ascua', 'magma', { host: true })
      })
    },
    cripta: {
      name: 'Los presos de Karceron', ready: false, boss: 'karceron', ponds: 0, star: null, light: light(), amb: amb(), packs: B.packsLegacy,
      use: fill({
        worm: U('Esqueleto', 'hueso'), archer: U('Arquero de huesos', 'hueso'), bomb: U('Calavera explosiva', 'hueso'),
        boar: U('Calavera rodante', 'hueso'), shield: U('Carcelero menor', 'metal'), blinker: U('Alma prisionera', 'espectro'), scorcher: U('Ascua', 'magma'),
        fanner: U('Arquero ardiente', 'hueso', { host: true }), moth: U('Salamandra de lava', 'magma', { host: true }),
        sower: U('Guardián de cadenas', 'metal', { host: true }), warlock: U('Brujo', 'espectro', { host: true })
      })
    },
    asfodelo: {
      name: 'El río de Letea', ready: false, boss: 'letea', ponds: 0, star: null, light: light(), amb: amb(), packs: B.packsLegacy,
      use: fill({
        worm: U('Alma errante', 'espectro'), archer: U('Sanguijuela', 'pantano'), fanner: U('Rana ácida', 'pantano'),
        boar: U('Cabeza menor', 'pantano', { mx: { fire: 1.25 } }), moth: U('Medusa helada', 'pantano', { mx: { fire: 1.25 } }),
        sower: U('Lirio del olvido', 'vegetal'), warlock: U('Sacerdotisa ahogada', 'espectro'), scorcher: U('Anguila eléctrica', 'pantano', { mx: { lightning: 0.75, ice: 1 } }),
        shield: U('Guardia ahogado', 'pantano', { host: true }), bomb: U('Bomba', 'pantano', { host: true }), blinker: U('Espectro', 'espectro', { host: true })
      })
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
  B.has = function (type) { var f = B.famOf(); return !f || !!f.use[type]; };
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
})();
