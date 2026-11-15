/* track_ui.js - Tarjeta del aviso de privacidad (T-F1-01), componente reutilizable.
   API: G.TrackUI.open(cb)  -> muestra la tarjeta (G.state = 'privacy'); al elegir llama a G.Track.consent(true|false, 'aviso'), restaura el estado anterior y llama a cb(elección).
        G.TrackUI.TEXT / G.TrackUI.choose(bool) (pruebas) / G.TrackUI.isOpen().
   Dos botones del MISMO tamaño, color y peso visual; sin casillas premarcadas; Esc o cualquier otra salida = "No, gracias". Nada de analítica sale antes de elegir.
   Los textos son los de REVISION-PRIVACIDAD.md 11.1 (versión G.Track.PV). Si se cambia un texto, hay que cambiar G.Track.PV. */
(function () {
  'use strict';
  var G = window.G, U = G.UI, UI = G.TrackUI = {}, cur = null;
  var TEXT = {
    es: {
      title: '¿Nos ayudas a mejorar Swarm Hand?',
      body: ['Si aceptas, el juego enviará estadísticas de partida (bioma, duración, qué jefe te vence, errores del juego) a nuestro servicio de analítica, PostHog, con servidores en la Unión Europea. No enviamos tu nombre, ni tu correo, ni ningún identificador que te siga entre sesiones o dispositivos. Tu dirección IP llega al servidor al enviar, pero hemos configurado el servicio para no guardarla. Sin aceptar, nada sale de tu dispositivo y el juego es exactamente igual.',
        'Puedes retirar tu permiso cuando quieras en Ajustes > Privacidad.', 'Si tienes menos de 18 años, pulsa "No, gracias".'],
      yes: 'Acepto (tengo 18 años o más)', no: 'No, gracias', link: 'Política de privacidad', url: 'privacidad.html'
    },
    en: {
      title: 'Help us improve Swarm Hand?',
      body: ['If you accept, the game will send gameplay statistics (biome, run length, which boss beats you, game errors) to our analytics service, PostHog, with servers in the European Union. We never send your name, your email or any identifier that follows you across sessions or devices. Your IP address reaches the server when data is sent, but we have set the service not to store it. If you don\'t accept, nothing leaves your device and the game is exactly the same.',
        'You can withdraw your permission at any time in Settings > Privacy.', 'If you are under 18, please tap "No, thanks".'],
      yes: 'I accept (I am 18 or older)', no: 'No, thanks', link: 'Privacy policy', url: 'privacy.html'
    }
  };
  UI.TEXT = TEXT;
  UI.lang = function () { return /^en/i.test(navigator.language || '') ? 'en' : 'es'; };
  UI.policyUrl = function () { return TEXT[UI.lang()].url; };
  UI.openPolicy = function () { try { window.open(UI.policyUrl(), '_blank', 'noopener'); } catch (e) { /* bloqueado */ } };
  // Mismo rectángulo, color y borde para los dos botones (consentimiento explícito, sin patrón oscuro)
  var BY = { x: 120, y: 392, w: 340, h: 84 }, BN = { x: 500, y: 392, w: 340, h: 84 }, LK = { x: 330, y: 340, w: 300, h: 44 };
  UI.rects = { yes: BY, no: BN, link: LK };
  UI.isOpen = function () { return !!cur; };
  // opts.fte (T-F1-02): tarjeta "Antes de salir" tras la intro. Mismo texto legal y mismos botones; solo se añade el rótulo y una nota igual para los dos botones
  // (los dos lanzan la 1.ª expedición, así que la elección no se empuja hacia ninguno). Fondo oscuro, sin aldea.
  UI.open = function (cb, opts) {
    cur = { t: 0, prev: G.state === 'privacy' ? 'aldea' : G.state, cb: cb, lines: null, fte: !!(opts && opts.fte) };
    G.state = 'privacy';
  };
  UI.choose = function (yes) {
    if (!cur) return;
    var c = cur; cur = null;
    try { G.Track.consent(!!yes, 'aviso'); } catch (e) { /* nada */ }
    G.state = c.prev || 'aldea'; G.input.lock = 250;
    if (c.cb) c.cb(!!yes);
  };
  UI.update = function (dt) {
    if (!cur) { G.state = 'aldea'; return; }
    cur.t += dt;
    var inp = G.input, m = inp.mouse;
    if (cur.t < 450) return;   // un toque arrastrado de la pantalla anterior no elige por el jugador
    if (inp.hit('Escape')) { UI.choose(false); return; }
    if (!inp.hit('Mouse0')) return;
    if (U.inR(BY, m)) UI.choose(true); else if (U.inR(BN, m)) UI.choose(false); else if (U.inR(LK, m)) UI.openPolicy();
  };
  UI.draw = function (c) {
    if (G.Aldea && cur && cur.prev === 'aldea' && !cur.fte) { try { G.Aldea.draw(c); } catch (e) { /* fondo opcional */ } }
    else { c.fillStyle = '#0d0a14'; c.fillRect(0, 0, G.W, G.H); }
    c.fillStyle = 'rgba(6,3,12,0.78)'; c.fillRect(0, 0, G.W, G.H);
    var X = TEXT[UI.lang()], mf = G.minFont; G.minFont = G.MIN_UI;
    U.panel(c, 90, 24, 780, 492, { border: '#ffd27a' });
    if (cur.fte) G.txt(c, UI.lang() === 'en' ? 'BEFORE YOU GO' : 'ANTES DE SALIR', 480, 39, 14, '#b4a8c8', 'center');
    G.txt(c, X.title, 480, 64, 24, '#ffd27a', 'center');
    if (!cur.lines) { cur.lines = []; X.body.forEach(function (p, i) { U.wrap(c, p, 720, 14).forEach(function (l) { cur.lines.push(l); }); cur.lines.push(''); }); }
    for (var i = 0; i < cur.lines.length; i++) G.txt(c, cur.lines[i], 120, 104 + i * 19, 14, '#e8e0f0', 'left');
    var hov = U.inR(LK, G.input.mouse);
    G.txt(c, X.link, 480, LK.y + 22, 15, hov ? '#cfeaff' : '#9dd8ff', 'center');
    c.fillStyle = hov ? '#cfeaff' : '#9dd8ff'; c.fillRect(480 - Math.round(X.link.length * 4.5), LK.y + 32, Math.round(X.link.length * 9), 2);
    U.button(c, BY, X.yes, { size: 17, color: '#3a2f48', hot: '#5a4a70', border: '#ffd27a' });
    U.button(c, BN, X.no, { size: 17, color: '#3a2f48', hot: '#5a4a70', border: '#ffd27a' });
    if (cur.fte) G.txt(c, UI.lang() === 'en' ? 'Either button starts your first expedition.' : 'Cualquiera de los dos botones empieza tu primera expedición.', 480, 498, 14, '#d8cfe8', 'center');
    G.minFont = mf;
  };
})();
