/* armor_data.js - Datos puros de la Armera (DESIGN-v8-herrero.md C.1-C.5): 4 slots, tablas por tier, 3 sets del MVP (Aldeano, Esquila de Hierro, Carcelero de Brasa) y 12 piezas.
   Los sets de Letea, Yarlak, Melaria y Cenizar (T3-T6) se añaden aquí como datos (SETS + PIECES + una fila en las tablas); la lógica (armor.js) y la UI (smith.js) no cambian. */
(function () {
  'use strict';
  var G = window.G, D = G.ArmorData = {};
  D.SLOTS = ['Yelmo', 'Peto', 'Grebas', 'Talismán'];
  D.SLOT_DEF = [0.7, 1.0, 0.7, 0.6];        // peso de DEF por slot
  D.SLOT_COST = [0.7, 1.0, 0.7, 0.6];       // peso de coste por slot (Peto = unidad)
  D.DEF = [2, 4, 6, 8, 10, 12, 14];         // DEFbase por tier (T0..T6)
  D.HP = [2, 4, 6, 8, 10, 12, 14];          // Yelmo: +HP máx
  D.PETO = [0.02, 0.03, 0.04, 0.05, 0.065, 0.08, 0.10];   // Peto: resistencia de la familia del set (T0 no está en el doc: 2 %)
  D.APL = [0.03, 0.05, 0.08, 0.12, 0.16, 0.22, 0.28];     // Grebas: Aplomo (T0 3 %)
  D.IMS = [0, 0, 10, 20, 30, 40, 50];                      // Grebas: ms extra de invulnerabilidad
  D.TAL = [0, 0.02, 0.03, 0.04, 0.05, 0.065, 0.08];        // Talismán: Afinidad (+% de daño de la etiqueta del set)
  D.REF = 0.15;                                            // +15 % por refuerzo (+1..+3)
  D.CAP = { mult: 0.55, hp: 25, apl: 0.40, ims: 100, dmg: 0.10, res: 0.15 };
  // Coste por tier (Peto-unidad): parte principal x TREE_PART_MUL de la etiqueta, secundaria, Brasas, trofeo, Esencia
  D.COST = [{ main: 14, sec: 4, brasas: 80, tro: 0, rare: 0 }, { main: 12, sec: 5, brasas: 140, tro: 1, rare: 0 }, { main: 16, sec: 7, brasas: 220, tro: 1, rare: 0 },
    { main: 22, sec: 9, brasas: 320, tro: 1, rare: 0 }, { main: 30, sec: 12, brasas: 440, tro: 1, rare: 1 }, { main: 40, sec: 16, brasas: 600, tro: 1, rare: 1 }, { main: 52, sec: 20, brasas: 800, tro: 2, rare: 2 }];
  D.REF_COST = [null, { parts: 0.5, brasas: 0.2, tro: 1, rare: 0 }, { parts: 0.6, brasas: 0.3, tro: 1, rare: 0 }, { parts: 0.8, brasas: 0.4, tro: 2, rare: 1 }];
  D.PEL_REQ = [0, 0, 2, 3];   // refuerzo n pide haber vencido al jefe del set en Peligro PEL_REQ[n]; +2 pide Rango de forja II y +3 el III (nodos R2 / R3 del Tronco de Grum)

  D.SETS = {
    aldeano:   { id: 'aldeano', name: 'Aldeano', tier: 0, tag: 'neutral', fam: 'melee', boss: null, color: '#b8a878',
      b2: { hp: 4 }, t2: '+4 HP máx.', b4: null, t4: 'Sin bono: es el set de aprendizaje.' },
    esquila:   { id: 'esquila', name: 'Esquila de Hierro', tier: 1, tag: 'steel', fam: 'melee', boss: 'pastor', color: '#9aa4b0', tros: ['horn', 'fleece', 'staff'], mins: ['carnero', 'tejedora'],
      b2: { dmg: 0.04, res: 0.03 }, t2: '+4 % daño de Acero y +3 % de resistencia cuerpo a cuerpo.', b4: 'lana', t4: 'Lana gruesa: cada 25 s el siguiente golpe que recibas hace -50 %.' },
    carcelero: { id: 'carcelero', name: 'Carcelero de Brasa', tier: 2, tag: 'fire', fam: 'blast', boss: 'karceron', color: '#ff6a1a', tros: ['core', 'mace', 'shackle'], mins: ['alcaide', 'centinela'],
      b2: { dmg: 0.04, res: 0.08 }, t2: '+4 % daño de Fuego y +8 % de resistencia a explosiones.', b4: 'grilletes', t4: 'Grilletes ardientes: al recibir un golpe, pulso de radio 70 (20 de daño, quema), 1 vez cada 6 s.' }
  };
  D.SET_ORDER = ['aldeano', 'esquila', 'carcelero'];
  D.FAM_NAME = { melee: 'cuerpo a cuerpo', ranged: 'proyectiles', blast: 'explosiones', big: 'élites y jefes' };
  D.TAG_NAME = { steel: 'Acero', fire: 'Fuego', neutral: '' };
  // slot: 0 Yelmo, 1 Peto, 2 Grebas, 3 Talismán. main / sec: partes (Loot.PARTS). tro: trofeo concreto del jefe (Yelmo, Peto, Grebas); el Talismán pide las 2 Insignias del bioma.
  D.PIECES = [
    { id: 'ald_helm', set: 'aldeano', slot: 0, name: 'Gorro de lana', main: 'thread' },
    { id: 'ald_chest', set: 'aldeano', slot: 1, name: 'Chaleco acolchado', main: 'thread', sec: 'feather' },
    { id: 'ald_boots', set: 'aldeano', slot: 2, name: 'Botas de trapo', main: 'thread' },
    { id: 'ald_amulet', set: 'aldeano', slot: 3, name: 'Amuleto del hogar', main: 'thread', hp: 2 },
    { id: 'esq_helm', set: 'esquila', slot: 0, name: 'Yelmo de cuernos', main: 'plate', tro: 'horn' },
    { id: 'esq_chest', set: 'esquila', slot: 1, name: 'Peto de vellón', main: 'plate', sec: 'thread', tro: 'fleece' },
    { id: 'esq_greaves', set: 'esquila', slot: 2, name: 'Polainas de cayado', main: 'plate', sec: 'feather', tro: 'staff' },
    { id: 'esq_talis', set: 'esquila', slot: 3, name: 'Talismán de pastoreo', main: 'plate', sec: 'fang' },
    { id: 'car_helm', set: 'carcelero', slot: 0, name: 'Cráneo del alcaide', main: 'wick', tro: 'core' },
    { id: 'car_chest', set: 'carcelero', slot: 1, name: 'Coraza de magma', main: 'wick', sec: 'plate', tro: 'mace' },
    { id: 'car_greaves', set: 'carcelero', slot: 2, name: 'Grilletes ardientes', main: 'wick', sec: 'thread', tro: 'shackle' },
    { id: 'car_talis', set: 'carcelero', slot: 3, name: 'Llave de la cripta', main: 'wick', sec: 'static' }
  ];
  D.BY = {}; D.PIECES.forEach(function (p) { D.BY[p.id] = p; });
  D.piece = function (id) { return D.BY[id] || null; };
  D.ofSet = function (sid) { return D.PIECES.filter(function (p) { return p.set === sid; }); };
  D.ofSlot = function (slot) { return D.PIECES.filter(function (p) { return p.slot === slot; }); };
  D.peto = function (sid) { return D.PIECES.filter(function (p) { return p.set === sid && p.slot === 1; })[0]; };
  // Defensa recomendada por bioma (C.7, punto medio del rango) y daño de zona (G.1)
  D.REC_DEF = { bosque: 10, cripta: 21, asfodelo: 28, tundra: 36, panal: 43, crater: 52 };
  D.ZONE = { bosque: 1.0, cripta: 1.10, asfodelo: 1.18, tundra: 1.26, panal: 1.34, crater: 1.44 };
})();
