/* dev.js - Parámetros de depuración cerrados en producción (T-F0-03, versión reducida).
   Los parámetros de URL que dan recursos, desbloquean contenido, borran el guardado o cambian la dificultad solo valen con ?dev=1.
   Sin ?dev=1 se ignoran: el resto del código lee Dev.search (la query ya filtrada) en vez de location.search.
   NO se tocan: ?god (la inmortalidad por defecto sigue hasta T-FIN-01) ni los de arranque/vista/pruebas (boss, hunt, seed, nointro, direct, cine, view, q...). */
(function () {
  'use strict';
  var CLOSED = [
    'reset', 'give', 'pf', 'len', 'all', 'manual', 'smith', 'quests', 'brasasmin',   // progreso y economía
    'cmul', 'hand', 'actives', 'hp', 'hpcal', 'phase', 'peligro', 'speed', 'xpfirst', 'xpmul', 'pelx', 'txc', 'zoom', 'nonew',   // dificultad y ventajas
    'bdmg', 'bcd', 'pcd', 'pinf', 'pmul', 'vdmg', 'vmax', 'vpow', 'vstep', 'infmul', 'corr', 'lvheal', 'fuseheal', 'fuseAsh', 'bosscap', 'bossmul', 'aux', 'auxcd', 'auxmul',
    'dq', 'dn', 'dh', 'dd', 'ds', 'dx',   // perfil de dificultad por calidad (T-F0-05)
    'arm', 'armk', 'armcap', 'armcost', 'armhp', 'armdmg', 'armset', 'armtier', 'armref', 'zdmg', 'zdmgall', 'mdmg', 'ydmg', 'ycad', 'yheart'
  ];
  var q = location.search, on = /[?&]dev=1(&|$)/.test(q);
  window.Dev = {
    on: on, closed: CLOSED,
    search: on ? q : q.replace(new RegExp('([?&])(' + CLOSED.join('|') + ')=[^&]*', 'g'), '$1').replace(/&&+/g, '&')
  };
})();
