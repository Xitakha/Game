/* sw.js de /card-swarm-fusion/ (solo redirección): reemplaza al service worker del prototipo para quien lo tenía instalado.
   Se desregistra y lleva las pestañas abiertas a /card-swarm/. No toca las cachés (son del mismo origen que las del juego nuevo). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach((c) => c.navigate(new URL('../card-swarm/', self.registration.scope).href));
  })());
});
self.addEventListener('fetch', (e) => { e.respondWith(Response.redirect(new URL("../card-swarm/", self.registration.scope).href, 302)); });
