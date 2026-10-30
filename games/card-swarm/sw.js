/* sw.js - Service worker de Swarm Hand: precache versionado y cache-first (funciona sin conexión).
   La lista FILES y la VERSION las regenera tools/card-swarm-pwa/stamp.py (la VERSION es un hash del contenido: cualquier cambio en el juego
   cambia este archivo, el navegador instala el worker nuevo y el juego avisa "hay una versión nueva" sin recargar por su cuenta).
   Todas las rutas son relativas al propio sw.js, así que sirve igual en / que en una subruta (https://usuario.github.io/Game/card-swarm/). */
const VERSION = '4a21ef9af1';
const CACHE = 'swarmhand-' + VERSION;
const FILES = /*FILES*/[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/assets.js",
  "./src/assets_enemies2.js",
  "./src/assets_fam1.js",
  "./src/assets_fam2.js",
  "./src/assets_fam3.js",
  "./src/main.js",
  "./src/families.js",
  "./src/mobile.js",
  "./src/pwa.js",
  "./src/view.js",
  "./src/fx.js",
  "./src/sfx.js",
  "./src/sfx_fam1.js",
  "./src/sfx_fam2.js",
  "./src/sfx_fam3.js",
  "./src/sfx_yarlak.js",
  "./src/sfx_minis.js",
  "./src/sfx_fam4.js",
  "./src/sfx_melaria.js",
  "./src/sfx_cenizar.js",
  "./src/assets_peligro.js",
  "./src/player.js",
  "./src/combat.js",
  "./src/enemies.js",
  "./src/tundra.js",
  "./src/panal.js",
  "./src/enemies_tundra.js",
  "./src/enemies_panal.js",
  "./src/weapons.js",
  "./src/waves.js",
  "./src/cards.js",
  "./src/loot.js",
  "./src/save.js",
  "./src/assets_ui.js",
  "./src/assets_village.js",
  "./src/assets_boss.js",
  "./src/assets_boss2.js",
  "./src/assets_boss3.js",
  "./src/assets_boss4.js",
  "./src/assets_mini1.js",
  "./src/assets_mini2.js",
  "./src/assets_fam4.js",
  "./src/assets_boss5.js",
  "./src/mini_ui.js",
  "./src/assets_tree.js",
  "./src/boss.js",
  "./src/boss_karceron.js",
  "./src/boss_letea.js",
  "./src/boss_yarlak.js",
  "./src/boss_melaria.js",
  "./src/boss_cenizar.js",
  "./src/boss_cenizar_b.js",
  "./src/boss_cenizar_chain.js",
  "./src/quests.js",
  "./src/tree.js",
  "./src/dialog.js",
  "./src/panels.js",
  "./src/aldea.js",
  "./src/base.js",
  "./src/hud.js",
  "./src/ending.js",
  "./src/minis.js",
  "./src/minis_atk.js",
  "./src/minis_panal.js",
  "./icons/icon-192.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png"
]/*END*/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
  // sin skipWaiting: el worker nuevo espera a que el jugador pulse RECARGAR (o a que cierre la app)
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('swarmhand-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })).catch(() => (req.mode === 'navigate' ? caches.match('./index.html', { ignoreSearch: true }) : Response.error()))
  );
});
