/* armor_data.js - Datos puros de la Armera (DESIGN-v8-herrero.md C.1-C.5): 4 slots, tablas por tier, 3 sets del MVP (Aldeano, Esquila de Hierro, Carcelero de Brasa) y 12 piezas.
   v8.1: sets de Letea (Escama del Olvido), Yarlak (Pelaje Glacial), Melaria (Jalea Real) y Cenizar (Brasa Primera) + 5 talismanes de minijefe (set 'mini', sin bono de set, DEF x0,4 y una utilidad). */
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
  D.SETS.escama = { id: 'escama', name: 'Escama del Olvido', tier: 3, tag: 'poison', fam: 'ranged', boss: 'letea', color: '#2f6f6a', tros: ['ice', 'acid', 'bolt'], mins: ['hidra', 'planidera'],
    b2: { dmg: 0.04, res: 0.08 }, t2: '+4 % daño de Veneno y +8 % de resistencia a proyectiles.', b4: 'pantano', t4: 'Piel de pantano: charcos y Lirio del olvido pierden la mitad de su efecto; cada 20 s la 1.ª baja con Veneno cura 2 HP.' };
  D.SETS.glacial = { id: 'glacial', name: 'Pelaje Glacial', tier: 4, tag: 'ice', fam: 'melee', boss: 'yarlak', color: '#9fd8ff', tros: ['ytusk', 'yplate', 'yheart'], mins: ['yeti_mayor', 'ventisquero'],
    b2: { dmg: 0.04, cold: 0.15 }, t2: '+4 % daño de Hielo y el Frío sube un 15 % más despacio.', b4: 'hoguera', t4: 'Corazón de hoguera: retroceso -50 % en hielo y las hogueras te curan 1 HP/s dentro de su radio.' };
  D.SETS.jalea = { id: 'jalea', name: 'Jalea Real', tier: 5, tag: 'blood', fam: 'big', boss: 'melaria', color: '#ffd23a', tros: ['mjelly', 'mwing', 'msting'], mins: ['avispon', 'reina_joven'],
    b2: { dmg: 0.04, honey: 0.25 }, t2: '+4 % daño de Sangre y la miel te frena un 25 % menos.', b4: 'reina', t4: 'Reina de la colmena: las curas de nivel suben +5 puntos y cada 20 bajas se crea un escudo de 6 HP.' };
  D.SETS.brasa = { id: 'brasa', name: 'Brasa Primera', tier: 6, tag: 'lightning', fam: 'big', boss: 'cenizar', color: '#ff9a3c', tros: ['cz_cay', 'cz_nuc', 'cz_ojo', 'cz_col', 'cz_cor', 'cz_cora'], mins: ['carnero', 'tejedora', 'alcaide', 'centinela', 'hidra', 'planidera', 'yeti_mayor', 'ventisquero', 'avispon', 'reina_joven'],
    insGroups: [['carnero', 'tejedora'], ['alcaide', 'centinela'], ['hidra', 'planidera'], ['yeti_mayor', 'ventisquero'], ['avispon', 'reina_joven']],
    b2: { dmg: 0.04, res: 0.03 }, t2: '+4 % daño de Rayo y +3 % de resistencia a élites y jefes.', b4: 'ultima', t4: 'Última brasa: 1 vez por expedición un golpe mortal te deja a 1 HP y 1,5 s invulnerable (se gasta el primero que active: este o el Corazón de brasa).' };
  D.SETS.mini = { id: 'mini', name: 'Talismanes de minijefe', tier: 0, tag: 'neutral', fam: 'melee', boss: null, color: '#c8a0ff', noSet: true, b2: null, t2: '', b4: null, t4: '' };
  D.SET_ORDER = ['aldeano', 'esquila', 'carcelero', 'escama', 'glacial', 'jalea', 'brasa', 'mini'];
  D.FAM_NAME = { melee: 'cuerpo a cuerpo', ranged: 'proyectiles', blast: 'explosiones', big: 'élites y jefes' };
  D.TAG_NAME = { steel: 'Acero', fire: 'Fuego', poison: 'Veneno', ice: 'Hielo', blood: 'Sangre', lightning: 'Rayo', neutral: '' };
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
    { id: 'car_talis', set: 'carcelero', slot: 3, name: 'Llave de la cripta', main: 'wick', sec: 'static' },
    { id: 'esc_helm', set: 'escama', slot: 0, name: 'Cresta de perla', main: 'spine', tro: 'ice' },
    { id: 'esc_chest', set: 'escama', slot: 1, name: 'Escamas de hidra', main: 'spine', sec: 'frost', tro: 'acid' },
    { id: 'esc_greaves', set: 'escama', slot: 2, name: 'Sandalias de marea', main: 'spine', sec: 'feather', tro: 'bolt' },
    { id: 'esc_talis', set: 'escama', slot: 3, name: 'Colgante del olvido', main: 'spine', sec: 'static' },
    { id: 'gla_helm', set: 'glacial', slot: 0, name: 'Casco de colmillos', main: 'frost', tro: 'ytusk' },
    { id: 'gla_chest', set: 'glacial', slot: 1, name: 'Placa glacial', main: 'frost', sec: 'plate', tro: 'yplate' },
    { id: 'gla_greaves', set: 'glacial', slot: 2, name: 'Pezuñas de escarcha', main: 'frost', sec: 'thread', tro: 'yheart' },
    { id: 'gla_talis', set: 'glacial', slot: 3, name: 'Garra del yeti', main: 'frost', sec: 'fang' },
    { id: 'jal_helm', set: 'jalea', slot: 0, name: 'Corona de jalea', main: 'fang', tro: 'mjelly' },
    { id: 'jal_chest', set: 'jalea', slot: 1, name: 'Manto de alas', main: 'fang', sec: 'feather', tro: 'mwing' },
    { id: 'jal_greaves', set: 'jalea', slot: 2, name: 'Espolones de aguijón', main: 'fang', sec: 'thread', tro: 'msting' },
    { id: 'jal_talis', set: 'jalea', slot: 3, name: 'Frasco de miel', main: 'fang', sec: 'frost' },
    { id: 'bra_helm', set: 'brasa', slot: 0, name: 'Corona de ceniza', main: 'static', tro: ['cz_cor', 'cz_ojo'] },
    { id: 'bra_chest', set: 'brasa', slot: 1, name: 'Corazón de Brasa Primera', main: 'static', sec: 'wick', tro: ['cz_cora', 'cz_nuc'] },
    { id: 'bra_greaves', set: 'brasa', slot: 2, name: 'Pasos de ceniza', main: 'static', sec: 'feather', tro: ['cz_col', 'cz_cay'] },
    { id: 'bra_talis', set: 'brasa', slot: 3, name: 'Rescoldo', main: 'static', sec: 'rare' },
    // Talismanes de minijefe (alternativas de utilidad, DEF x0,4): las 2 Insignias del bioma + 1 Esencia. tier = el del bioma; boss = el jefe del bioma (requisitos de refuerzo)
    { id: 'mn_bosque', set: 'mini', slot: 3, name: 'Colmillo de arrastre', main: 'thread', tier: 1, boss: 'pastor', mins: ['carnero', 'tejedora'], util: { k: 'magnet', v: 0.10 }, ut: '+10 % de radio del imán', bio: 'Bosque' },
    { id: 'mn_cripta', set: 'mini', slot: 3, name: 'Llave maestra', main: 'wick', tier: 2, boss: 'karceron', mins: ['alcaide', 'centinela'], util: { k: 'heart', v: 1 }, ut: '+1 HP por corazón recogido', bio: 'Cripta' },
    { id: 'mn_asfodelo', set: 'mini', slot: 3, name: 'Perla del río', main: 'spine', tier: 3, boss: 'letea', mins: ['hidra', 'planidera'], util: { k: 'xp', v: 0.10 }, ut: '+10 % de XP de gemas en el Asfódelo', bio: 'Asfódelo' },
    { id: 'mn_tundra', set: 'mini', slot: 3, name: 'Brasa de bolsillo', main: 'frost', tier: 4, boss: 'yarlak', mins: ['yeti_mayor', 'ventisquero'], util: { k: 'cold', v: 0.10 }, ut: 'El Frío sube un 10 % más despacio', bio: 'Tundra' },
    { id: 'mn_panal', set: 'mini', slot: 3, name: 'Gota de ámbar', main: 'fang', tier: 5, boss: 'melaria', mins: ['avispon', 'reina_joven'], util: { k: 'honey', v: 0.15 }, ut: 'La miel te frena un 15 % menos', bio: 'Panal' }
  ];
  D.tierOf = function (p) { return p.tier != null ? p.tier : D.SETS[p.set].tier; };
  D.bossOf = function (p) { return p.boss !== undefined ? p.boss : D.SETS[p.set].boss; };
  D.BY = {}; D.PIECES.forEach(function (p) { D.BY[p.id] = p; });
  D.piece = function (id) { return D.BY[id] || null; };
  D.ofSet = function (sid) { return D.PIECES.filter(function (p) { return p.set === sid; }); };
  D.ofSlot = function (slot) { return D.PIECES.filter(function (p) { return p.slot === slot; }); };
  D.peto = function (sid) { return D.PIECES.filter(function (p) { return p.set === sid && p.slot === 1; })[0]; };
  // Defensa recomendada por bioma (C.7, punto medio del rango) y daño de zona (G.1)
  D.REC_DEF = { bosque: 10, cripta: 21, asfodelo: 28, tundra: 36, panal: 43, crater: 52 };
  D.ZONE = { bosque: 1.0, cripta: 1.10, asfodelo: 1.18, tundra: 1.26, panal: 1.34, crater: 1.44 };
})();
