// CENSO de enemigos vivos (DESIGN-v5 A.2). Se inyecta en la página junto al bot (bot_page.js). Muestrea G.Waves.census() cada pulso del director (1,5 s de G.time)
// y acumula por minuto de partida: nº de muestras, vivos totales, por rol, por tier (G.B.tierOf) y por nombre de familia; además el pico por rol y por minuto.
// Censo de reserva para el código anterior a P0 (sin G.Waves.census): permite medir el "antes" con el mismo formato.
function legacyCensus() {
  var out = { alive: 0, byType: {}, byTier: [0, 0, 0, 0], byFam: {}, fam: false };
  G.enemies.forEach(function (e) {
    if (e.dead || e.partOf || e.type === 'boss' || G.B.enemy[e.type].elite) return;
    out.alive++; out.byType[e.type] = (out.byType[e.type] || 0) + 1; out.byTier[G.B.tier[e.type]]++; out.byFam[e.type] = (out.byFam[e.type] || 0) + 1;
  });
  return out;
}
window.installCensus = function () {
  var C = window.__census = { min: {}, peak: {}, fam: !!(G.B.famOf && G.B.famOf()), famMode: G.B.famMode, mat: !!(G.B.mat && G.B.mat.on), biome: G.curBiome, spawns: {}, over: [], t0: G.time };
  var oU = G.Waves.update, last = -1e9, oSp = G.Enemies.spawn;
  G.Enemies.spawn = function (type) { var m = Math.floor((G.time - G.t0) / 60000), S = C.spawns[m] || (C.spawns[m] = {}); S[type] = (S[type] || 0) + 1; return oSp.apply(G.Enemies, arguments); };   // altas por minuto (incluye packs e invocaciones)
  G.Waves.update = function (dt) {
    oU.call(G.Waves, dt);
    if (G.state !== 'play' || G.time - last < 1500) return;
    last = G.time;
    var m = Math.floor((G.time - G.t0) / 60000), c = (G.Waves.census || legacyCensus)(), S = C.min[m] || (C.min[m] = { n: 0, alive: 0, byType: {}, byTier: [0, 0, 0, 0], byFam: {}, boss: 0 }), k;
    S.n++; S.alive += c.alive; if (G.Enemies.boss()) S.boss++;
    for (k in c.byType) S.byType[k] = (S.byType[k] || 0) + c.byType[k];
    for (k in c.byFam) S.byFam[k] = (S.byFam[k] || 0) + c.byFam[k];
    for (var i = 0; i < 4; i++) S.byTier[i] += c.byTier[i];
    for (k in c.byType) { if (!(C.peak[k] >= c.byType[k])) C.peak[k] = c.byType[k]; }
  };
};
// A.7: para cada fase de cada jefe, la intersección de `allow` con la familia del bioma no debe quedar vacía (salvo fases con spawn.mul 0).
window.censusAllowCheck = function () {
  var out = [], B = G.B, D = G.Boss.DEFS; if (!B.fam) return out;
  Object.keys(B.fam).forEach(function (bio) {
    var f = B.fam[bio], bid = f.boss; if (!Object.keys(f.use).length || !D[bid]) return;
    D[bid].phases.forEach(function (ph, i) {
      var sp = ph.spawn || {}; if (!(sp.mul > 0)) return;
      var inter = Object.keys(sp.allow || {}).filter(function (k) { return f.use[k]; });
      out.push({ biome: bio, boss: bid, phase: i + 1, allow: Object.keys(sp.allow || {}), inter: inter, ok: inter.length > 0 });
    });
  });
  return out;
};
