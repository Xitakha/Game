/* res.js - G.Res: la economía presentada por pasos (T-F1-07, studio/docs/SPEC-T-F1-07.md). Solo UI: NUNCA toca G.rng ni la simulación; todo se gana, guarda y gasta igual.
   - Registro central de visibilidad: cada sitio que dibuja un recurso pregunta G.Res.visible(id) con id en ceniza, brasas, partes, esencia, pf, trofeos, insignias.
   - Disparadores (n = salidas contadas de G.Fte, J = algún jefe vencido): Partes y Brasas siempre; PF con n >= 2 o J (Grum); Ceniza con n >= 3 o J (Rufo; antes no hay REROLL);
     Esencia con el Rango de forja III o Yarlak vencido; trofeos e Insignias con Carapa (G.Armor.smithOn()).
   - Activo solo en cuentas del flujo nuevo de T-F1-02 (step != '' y sin legacy). Cuentas con progreso anterior, bots y URLs de prueba que no pasan por la intro: todo visible.
   - Interruptor: G.B.resSteps = false, ?dev=1&res=0 o ?fte=0 -> todo visible como antes, REROLL incluido, y sin líneas de primera vez.
   - Estado en Save.data.flags.res = { v: 1, intro: { id: 1 } } (sin subir la versión del guardado). Textos en G.Res.TXT (claves res.*), listos para la capa de traducción. */
(function () {
  'use strict';
  var G = window.G, R = G.Res = {}, D = window.Dev || { on: false, search: location.search };
  var SEARCH = D.search || location.search || '';
  if (G.B && G.B.resSteps == null) G.B.resSteps = !(D.on && /[?&]res=0/.test(SEARCH));
  R.IDS = ['ceniza', 'brasas', 'partes', 'esencia', 'pf', 'trofeos', 'insignias'];

  // ------------------------------------------------------------- Textos (español). t('clave', a, b...) sustituye {0}, {1}...
  R.TXT = {
    'res.partes.first': 'Cada bicho deja algo: hebras, plumas, púas. Grum sabe darles forma.',
    'res.brasas.first': 'Las Brasas son el calor que traes a casa. Con ellas se paga la forja.',
    'res.pf.first': 'Un Punto de Forja es la chispa del herrero: sin ella, el hierro no aprende.',
    'res.pf.stored': 'Has traído {0} chispas de forja sin saberlo. Gástalas aquí, conmigo.',
    'res.pf.stored1': 'Has traído una chispa de forja sin saberlo. Gástala aquí, conmigo.',
    'res.ceniza.first': 'La Ceniza solo vive en la expedición: cambia cartas antes de que se enfríe.',
    'res.ceniza.rufo': '¿Ceniza? Se te escapa entre los dedos cada vuelta. Con un Tónico empiezas con más.',
    'res.esencia.first': 'La Esencia rara casi nunca cae. El Rango III te deja forjar con ella.',
    'res.esencia.stored': 'Guardabas {0} Esencias raras entre las partes. Ahora sirven.',
    'res.esencia.stored1': 'Guardabas una Esencia rara entre las partes. Ahora sirve.',
    'res.trofeos.first': 'Cada parte que rompes a un jefe deja su trofeo. Carapa cose con ellos.',
    'res.trofeos.stored': 'Traes {0} trofeos del Pastor: dan para un yelmo, un peto o unas grebas.',
    'res.trofeos.stored1': 'Traes un trofeo del Pastor: da para un yelmo, un peto o unas grebas.',
    'res.insignias.first': 'Los guardianes dejan insignias. Con las dos de un bosque, te coso un talismán.',
    'res.guardDown': '¡GUARDIÁN DERRIBADO!',
    'res.rareAsPart': '1 parte rara',
    'res.rapidaTag': 'Menos botín, jefe antes',
    'res.locked.esencia': 'Pide Rango de forja III',
    'res.locked.ruta': 'Se abre tras vencer a Yarlak',
    'res.locked.ash': 'Se abre cuando Rufo vuelva',
    'res.tab': 'RECURSOS', 'res.soon': 'Lo conocerás más adelante', 'res.have': 'Tienes {0}', 'res.only': 'Solo en la expedición',
    'res.ceniza.name': 'Ceniza', 'res.ceniza.how': 'La sueltan los bichos durante la expedición. No se guarda.', 'res.ceniza.use': 'Cambiar la oferta de cartas. Al volver, un poco se vuelve Brasas.',
    'res.brasas.name': 'Brasas', 'res.brasas.how': 'Las traes al volver: más cuanto más aguantas.', 'res.brasas.use': 'Pagar la forja, la armadura, la cocina y a Rufo.',
    'res.partes.name': 'Partes', 'res.partes.how': 'Las sueltan los bichos: cada familia, la suya.', 'res.partes.use': 'Forjar nodos, coser armadura, cocinar y cambiar con Rufo.',
    'res.esencia.name': 'Esencia rara', 'res.esencia.how': 'Casi nunca cae: guardianes, jefes y bichos fuertes. Cada trofeo trae una.', 'res.esencia.use': 'Nodos de Rango III, cartas épicas y armadura alta.',
    'res.pf.name': 'Puntos de Forja', 'res.pf.how': 'Primer guardián de cada hueco, jefes, encargos y logros.', 'res.pf.use': 'Aprender nodos del árbol de Grum.',
    'res.trofeos.name': 'Trofeos', 'res.trofeos.how': 'Romper partes de un jefe.', 'res.trofeos.use': 'Armadura de Carapa y nodos de Ruta.',
    'res.insignias.name': 'Insignias', 'res.insignias.how': 'Derribar guardianes.', 'res.insignias.use': 'Talismanes de Carapa.'
  };
  R.t = function (k) { var s = R.TXT[k] != null ? R.TXT[k] : k, a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { var v = a[+i + 1]; return v == null ? '' : String(v); }); };

  // ------------------------------------------------------------- Estado
  function SV() { return G.Save.data; }
  function d() {
    var fl = SV().flags || (SV().flags = {});
    if (!fl.res || typeof fl.res !== 'object' || Array.isArray(fl.res)) fl.res = { v: 1, intro: {} };
    if (!fl.res.intro || typeof fl.res.intro !== 'object') fl.res.intro = {};
    return fl.res;
  }
  R.data = d;
  function save() { try { G.Save.save(); } catch (e) { /* sin guardado */ } }
  // ¿Presentación por pasos activa en esta cuenta?
  R.on = function () {
    if (!G.B || G.B.resSteps === false || !G.Fte || !G.Fte.enabled()) return false;
    var f = G.Fte.data(); return !f.legacy && f.step !== '';
  };
  function runs() { return G.Fte.data().runs || 0; }
  function anyBoss() { var k = SV().bossKills || {}; return Object.keys(k).some(function (b) { return k[b] > 0; }); }
  R.visible = function (id) {
    if (!R.on()) return true;
    var S = SV();
    switch (id) {
      case 'partes': case 'brasas': return true;
      case 'pf': return anyBoss() || runs() >= 2;
      case 'ceniza': return anyBoss() || runs() >= 3;
      case 'esencia': return !!(S.nodes && S.nodes.R3) || ((S.bossKills || {}).yarlak || 0) > 0;
      case 'trofeos': case 'insignias': return !!(G.Armor && G.Armor.smithOn());
    }
    return true;
  };
  var vis = R.visible;
  // Saldo actual de cada recurso (Archivo y líneas "stored")
  R.have = function (id) {
    var S = SV(), n = 0, k;
    if (id === 'brasas') return S.brasas || 0;
    if (id === 'partes') { for (k in S.parts) if (k !== 'rare') n += S.parts[k] || 0; return n; }
    if (id === 'esencia') return (S.parts && S.parts.rare) || 0;
    if (id === 'pf') return G.Tree ? G.Tree.pfFree() : 0;
    if (id === 'trofeos') { for (k in S.trophies || {}) n += S.trophies[k] || 0; return n; }
    if (id === 'insignias') { for (k in S.insignias || {}) n += S.insignias[k] || 0; return n; }
    return null;   // ceniza: solo existe en la expedición
  };
  // Línea(s) de primera vez: una sola vez por cuenta y clave; null si el flag está apagado, el recurso no es visible o ya se dijo.
  // key: clave de intro (por defecto el id); devuelve un array de líneas (la principal y, si hay saldo, la de lo guardado)
  R.first = function (id, key) {
    key = key || id;
    if (!R.on() || !vis(id)) return null;
    var st = d(); if (st.intro[key]) return null;
    st.intro[key] = 1; save();
    var out = [], n = R.have(id);
    if (key === 'rufo') out.push(R.t('res.ceniza.rufo'));
    else if (key === 'cenizaOffer') out.push(R.t('res.ceniza.first'));
    else out.push(R.t('res.' + id + '.first'));
    if ((id === 'pf' || id === 'esencia' || id === 'trofeos') && key === id && n > 0) out.push(n === 1 ? R.t('res.' + id + '.stored1') : R.t('res.' + id + '.stored', n));
    return out;
  };
  R.said = function (key) { return !!d().intro[key]; };
  // Fin de la 1.ª expedición: las dos líneas de LO GANADO (null con el flag apagado: se queda la frase de siempre)
  // (se repiten mientras siga siendo la 1.ª expedición: un abandono de menos de 60 s no cuenta como salida)
  R.endLines = function () {
    if (!R.on()) return null;
    R.first('partes'); R.first('brasas');
    return [R.t('res.partes.first'), R.t('res.brasas.first')];
  };
  // Subtítulo de la 1.ª oferta de carta con la Ceniza ya visible (mismo hueco que el aviso 'pick' de T-F1-02)
  R.offerHint = function (O) {
    if (!O) return null;
    if (O.resHint) return O.resHint;
    var l = R.first('ceniza', 'cenizaOffer'); if (!l) return null;
    O.resHint = l[0]; return O.resHint;
  };
  // Se puede usar el REROLL (sin Ceniza visible no hay botón ni tecla)
  R.reroll = function () { return vis('ceniza'); };
  // "1 Esencia" -> "1 parte rara" mientras la Esencia no se vea (textos de recompensa)
  R.fix = function (s) { if (typeof s !== 'string' || vis('esencia')) return s; return s.replace(/\b1 Esencia( rara)?/g, R.t('res.rareAsPart')).replace(/\+1 Esencia/g, '+' + R.t('res.rareAsPart')); };
  // Forja: texto que sustituye al coste de un nodo (o null)
  R.nodeLock = function (n) {
    if (!R.on() || !n) return null;
    if (n.id === 'ASH' && !vis('ceniza')) return R.t('res.locked.ash');
    if (n.ruta && !(((SV().bossKills || {}).yarlak || 0) > 0)) return R.t('res.locked.ruta');
    var c = G.Tree.cost(n); if (c.parts && c.parts.rare && !vis('esencia')) return R.t('res.locked.esencia');
    return null;
  };
  // Forja: nodo que de momento no se puede comprar por la presentación (solo "Ceniza viva": el resto ya está bloqueado por sus reglas)
  R.buyLock = function (n) { return R.on() && n && n.id === 'ASH' && !vis('ceniza') ? R.t('res.locked.ash') : null; };
  // Fugas de la sección 3.6 (cuentas del flujo nuevo): el Diario llega con Vesper; el reto diario pide 3 salidas contadas (o un jefe vencido)
  R.objOpen = function () { return !R.on() || G.Fte.npcVisible('vesper'); };
  R.retoOpen = function () { return !R.on() || anyBoss() || runs() >= 3; };

  // ------------------------------------------------------------- Registro de lo dibujado (pruebas): conjunto por fotograma
  R.cur = {}; R.last = {};
  R.mark = function (id) { R.cur[id] = 1; };
  R.frame = function () { R.last = R.cur; R.cur = {}; };
  R.shown = function () { var o = {}, k; for (k in R.last) o[k] = 1; for (k in R.cur) o[k] = 1; return Object.keys(o).sort(); };
  // Archivo, pestaña RECURSOS: las 7 filas (siempre, con o sin el flag)
  R.rows = function () {
    return R.IDS.map(function (id) {
      var n = R.have(id);
      return { id: id, name: R.t('res.' + id + '.name'), have: n, haveTxt: n == null ? R.t('res.only') : R.t('res.have', n), how: R.t('res.' + id + '.how'), use: R.t('res.' + id + '.use'), soon: R.on() && !vis(id) };
    });
  };
})();
