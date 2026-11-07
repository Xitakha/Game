/* view.js - Proyección de la VISTA INCLINADA tipo Hades (Nivel 1). SOLO cambia el dibujo: posiciones, colisiones, daño y entrada siguen en el plano lógico plano.
   Activación: ?view=iso (o ?view=flat) y la opción "Vista inclinada" de Ajustes (guardada en settings.view). Por defecto, vista plana de siempre.
   Idea: el mundo se dibuja con ctx.scale(1, isoK) (suelo aplastado). Todo lo que es SUELO (zonas, telegrafías, conos, anillos, ondas, rayos, suelo prerrenderizado)
   se dibuja tal cual dentro de esa transformación, así su borde coincide con el área lógica de daño. Todo lo que está DE PIE (sprites, barras, números, gemas, proyectiles)
   se envuelve en Proj.up(c, x, y) ... Proj.down(c): deshace el aplastado alrededor del punto lógico (x, y), de modo que el sprite se ve sin deformar con su centro en (x, y*isoK).
   Para una futura vista isométrica de 45° (Nivel 2) basta cambiar aquí la matriz (Proj.base / Proj.up / Proj.ang / Proj.un*) y el pre-render del suelo (Proj.flatten).
   HUD, cartas y UI no se proyectan nunca. La aldea (Rescoldo) es un fondo pintado con su propia perspectiva: no se proyecta. */
(function () {
  'use strict';
  var G = window.G, P = G.Proj = {};
  G.B.isoK = 0.62;               // aplastado vertical del suelo (0,5 - 0,75): menor = más inclinada
  P.iso = false; P.K = 1; P.mode = 'flat';
  G.VH = G.H;                    // alto LÓGICO visible (H / K): la cámara, el culling y el apuntado auto lo usan

  P.set = function (mode) {
    P.iso = mode === 'iso'; P.mode = P.iso ? 'iso' : 'flat'; P.K = P.iso ? G.B.isoK : 1;
    G.VH = G.H / P.K;
    P._gsrc = null; P._gdst = null;
  };
  P.initFromUrl = function () {
    var m = /[?&]view=(\w+)/.exec(location.search), s = G.Save && G.Save.data && G.Save.data.settings;
    P.set(m ? (m[1] === 'iso' ? 'iso' : 'flat') : (s && s.view === 'iso' ? 'iso' : 'flat'));
  };
  // Ajustes: alterna y guarda (try/catch dentro de Save.save)
  P.toggle = function () {
    var S = G.Save.data; if (!S.settings) S.settings = (function () { try { return Assets.getVolume(); } catch (e) { return { master: 0.8, music: 0.6, sfx: 0.8 }; } })();
    S.settings.view = P.iso ? 'flat' : 'iso'; P.set(S.settings.view);
    try { G.Save.save(); } catch (e) { /* sin storage */ }
  };

  // lógico -> mundo aplastado (coordenadas "de suelo"); y a la inversa (apuntado con ratón: y_lógica = y_pantalla / K)
  P.x = function (x) { return x; };
  P.y = function (x, y) { return y * P.K; };
  P.unx = function (sx) { return sx; };
  P.uny = function (sx, sy) { return sy / P.K; };
  // ángulo lógico -> ángulo visual de un sprite de pie que apunta en esa dirección
  P.ang = function (a) { return P.iso ? Math.atan2(Math.sin(a) * P.K, Math.cos(a)) : a; };

  // Cámara: la y de la cámara es lógica (borde superior visible). Si la arena aplastada cabe entera en pantalla, se centra.
  P.clampCamY = function (v) { var hi = G.AH - G.VH; return hi < 0 ? hi / 2 : G.clamp(v, 0, hi); };

  // Prepara el contexto: traslada la cámara (en píxeles de pantalla), dibuja el suelo prerrenderizado y deja el contexto en "mundo aplastado".
  P.begin = function (c, ground, cx, cy, ox, oy) {
    if (!P.iso) { c.translate(-Math.round(cx + ox), -Math.round(cy + oy)); c.drawImage(ground, 0, 0); return; }
    c.translate(-Math.round(cx + ox), -Math.round(cy * P.K + oy));
    c.drawImage(P.flatten(ground), 0, 0);
    c.scale(1, P.K);
  };
  // Solo la transformación de cámara (sin dibujar el suelo): segunda pasada de la Tundra (telegrafías por encima de la bruma)
  P.beginTf = function (c, cx, cy, ox, oy) {
    if (!P.iso) { c.translate(-Math.round(cx + ox), -Math.round(cy + oy)); return; }
    c.translate(-Math.round(cx + ox), -Math.round(cy * P.K + oy));
    c.scale(1, P.K);
  };
  // Suelo prerrenderizado UNA vez (cacheado por canvas de origen): el canvas de la arena aplastado a K en vertical.
  P.flatten = function (src) {
    if (P._gsrc === src && P._gdst) return P._gdst;
    var d = document.createElement('canvas'); d.width = src.width; d.height = Math.ceil(src.height * P.K);
    var g = d.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, src.width, src.height * P.K);
    P._gsrc = src; P._gdst = d; return d;
  };

  // De pie: deshace el aplastado alrededor del punto lógico (x, y) (anclado a píxel de pantalla entero). Siempre emparejar con Proj.down.
  // foot (opcional): distancia lógica del centro a los pies; el pivote se pone en los pies (y + foot), así los pies de un sprite grande (jefe: 88) caen en (y + foot) * K
  // y no 88 px por debajo del centro proyectado. Con foot = 0 el centro del sprite queda en (x, y * K).
  P.up = function (c, x, y, foot) {
    if (!P.iso) return;
    var yy = y + (foot || 0);
    c.save(); c.translate(x, Math.round(yy * P.K) / P.K); c.scale(1, 1 / P.K); c.translate(-x, -yy);
  };
  P.footOf = function (it) { return it.foot != null ? it.foot : it.type === 'boss' ? 88 : (it.type === 'mini_bulwark' || it.type === 'mini_hive') ? 24 : 0; };
  P.down = function (c) { if (P.iso) c.restore(); };

  // Elipse de suelo en coordenadas de PANTALLA para un círculo lógico (r) en (x, y): para dibujar UI/overlays ya proyectados (no se usa en el mundo aplastado)
  P.ellipse = function (c, x, y, r) { c.ellipse(x, y * P.K, r, r * P.K, 0, 0, 6.283); };

  // Sombra elíptica suave en el suelo (se llama dentro del mundo aplastado): w = ancho en px, alpha. Proporción final en pantalla ~0,43.
  P.drawShadow = function (c, x, y, w, alpha) {
    var sh = Assets.sprite('shadow', 0);
    c.save(); c.globalAlpha = alpha == null ? 0.5 : alpha;
    c.drawImage(sh, x - w / 2, y - w * 0.215 / P.K, w, w * 0.43 / P.K);
    c.restore();
  };
})();
