/* pwa.js - Swarm Hand como app (Nivel 2): G.PWA.
   - Service worker (sw.js, rutas relativas: vale en la raíz y en una subruta de GitHub Pages) con aviso "hay una versión nueva" y recarga solo si el jugador lo pide.
   - Instalación: botón Instalar (beforeinstallprompt en Android / Chrome / Edge) y ayuda para iOS (Compartir > Añadir a pantalla de inicio). ?install=1 lo abre al primer toque.
   - Guardado: aviso si el navegador bloquea localStorage y exportar / importar el progreso como texto o archivo (G.Save.exportText / importText).
   - T-F1-11: aviso si el arranque recuperó una copia, copia de IndexedDB al arrancar (G.Save.checkIdb), navigator.storage.persist() con progreso,
     recordatorio de exportar cada 10 expediciones (en iPhone / iPad sin instalar, aviso propio y el primero a las 3) y la ventana Copias de seguridad.
   ?nosw=1 desactiva y borra el service worker (desarrollo). */
(function () {
  'use strict';
  var G = window.G, P = G.PWA = {};
  var deferred = null, wantReload = false, regRef = null;

  // ------------------------------------------------------------------ Service worker
  function swInit() {
    if (!('serviceWorker' in navigator)) return;
    if (/[?&]nosw=1/.test(location.search)) {
      navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
      if (window.caches) caches.keys().then(function (ks) { ks.forEach(function (k) { if (/^fusionhand-/.test(k)) caches.delete(k); }); });
      return;
    }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
      regRef = reg;
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg);
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', function () { if (nw.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(reg); });
      });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update().catch(function () {}); });
      setInterval(function () { reg.update().catch(function () {}); }, 3600 * 1000);
    }).catch(function () { /* sin SW: se juega igual, solo en línea */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (wantReload) location.reload(); });
  }
  // El aviso espera a que no haya una expedición en curso (recargar la perdería)
  function offerUpdate(reg) {
    var tries = 0;
    (function tick() {
      if (G.state === 'aldea' || G.state === 'gameover' || ++tries > 60) {
        G.Sys.toast('Hay una versión nueva del juego.', { btn: 'RECARGAR', close: true, onbtn: function () {
          wantReload = true;
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); else location.reload();
        } });
      } else setTimeout(tick, 5000);
    })();
  }
  P.update = function () { return regRef ? regRef.update() : Promise.resolve(); };

  // ------------------------------------------------------------------ Instalar
  function installInit() {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); deferred = e;
      if (!sessionStorageGet('sw.instOffered') && !G.Sys.standalone()) {
        sessionStorageSet('sw.instOffered', '1');
        setTimeout(function () { if (deferred) G.Sys.toast('Instala Swarm Hand para jugar a pantalla completa y sin conexión.', { btn: 'INSTALAR', close: true, onbtn: P.install }); }, 4000);
      }
    });
    window.addEventListener('appinstalled', function () { deferred = null; G.Sys.toast('Swarm Hand instalada.', { ms: 2500 }); });
    if (/[?&]install=1/.test(location.search)) {
      var once = function () { window.removeEventListener('pointerup', once); setTimeout(P.install, 200); };
      window.addEventListener('pointerup', once);
    }
  }
  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin storage */ } }
  P.canPrompt = function () { return !!deferred; };
  P.install = function () {
    if (G.Sys.standalone()) { G.Sys.toast('Ya estás jugando la app instalada.', { ms: 2500 }); return; }
    if (deferred) {
      var d = deferred; deferred = null;
      d.prompt(); if (d.userChoice) d.userChoice.then(function (c) { if (c && c.outcome !== 'accepted') G.Sys.toast('Puedes instalarla cuando quieras desde Ajustes.', { ms: 2500 }); });
      return;
    }
    if (G.Sys.isIOS) {
      G.Sys.modal({ title: 'Instalar en iPhone / iPad', text: '1. Abre esta página en Safari.\n2. Toca el botón Compartir (el cuadrado con la flecha hacia arriba).\n3. Elige "Añadir a pantalla de inicio".\n4. Abre Swarm Hand desde el icono: se juega a pantalla completa y sin conexión.' });
    } else {
      G.Sys.modal({ title: 'Instalar la app', text: 'Si tu navegador no ofrece el botón automático:\n- Chrome / Edge (Android): menú de tres puntos > "Instalar aplicación" o "Añadir a pantalla de inicio".\n- Firefox: menú > "Instalar".\nNecesitas abrir el juego una vez con conexión; después funciona sin ella.' });
    }
  };

  // ------------------------------------------------------------------ Guardado: exportar / importar
  function download(name, text) {
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
      return true;
    } catch (e) { return false; }
  }
  function copy(text, ta) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () { G.Sys.toast('Copiado.', { ms: 1500 }); }, function () { fallback(); }); return; }
    } catch (e) { /* sigue */ }
    fallback();
    function fallback() {
      try { ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); var ok = document.execCommand('copy'); G.Sys.toast(ok ? 'Copiado.' : 'Selecciona el texto y cópialo a mano.', { ms: 2000 }); }
      catch (e2) { G.Sys.toast('Selecciona el texto y cópialo a mano.', { ms: 2500 }); }
    }
  }
  P.exportSave = function () {
    var text = G.Save.exportText(), m;
    m = G.Sys.modal({
      title: 'Exportar guardado', text: 'Guarda este texto (o el archivo) donde quieras. Sirve para pasar tu progreso a otro móvil o recuperarlo si el navegador borra los datos.',
      area: { value: text, readonly: true },
      buttons: [
        { label: 'COPIAR', color: '#2a6aa8', fn: function (ta) { copy(text, ta); return false; } },
        { label: 'DESCARGAR', color: '#2a8a4a', fn: function () { if (!download('swarm-hand-guardado.txt', text)) G.Sys.toast('No se pudo descargar; copia el texto.', { ms: 2500 }); return false; } },
        { label: 'CERRAR' }
      ]
    });
    if (navigator.share) {
      var row = m.box.lastChild, b = document.createElement('button'); b.textContent = 'COMPARTIR'; b.style.cssText = G.Sys.btnCss('#4a3a66') + ';margin-left:0;flex:1 1 120px';
      b.onclick = function () { navigator.share({ title: 'Swarm Hand - guardado', text: text }).catch(function () {}); };
      row.insertBefore(b, row.lastChild);
    }
  };
  // Tras sustituir el guardado (importar, restaurar o recuperar de IndexedDB): que el resto del juego lea los datos nuevos
  P.refresh = function () {
    try { G.Tree.sync(); } catch (e) { /* árbol */ }
    try { G.Sys.reloadSettings(); G.Proj.initFromUrl(); G.Aldea.applySettings(); G.shakeMul = (G.Save.data.settings && G.Save.data.settings.shake) ? 1 / 3 : 1; } catch (e2) { /* ajustes */ }
    try { if (G.state === 'aldea') G.Aldea.open(false); } catch (e3) { /* aldea ya cargada */ }
  };
  function ago(t) {
    if (!t) return '';
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 2 ? ' (de hace un momento)' : m < 120 ? ' (de hace ' + m + ' min)' : m < 2880 ? ' (de hace ' + Math.round(m / 60) + ' h)' : ' (de hace ' + Math.round(m / 1440) + ' días)';
  }
  var SRC = { reciente: 'la copia más reciente', dia: 'la copia de ayer', semana: 'la copia de la semana', idb: 'la copia interna del navegador', principal: 'lo que se pudo leer del guardado dañado' };
  P.recoveredText = function (rc) {
    if (!rc) return '';
    if (rc.reason === 'futuro') return 'Tu guardado es de una versión más nueva del juego. Recarga para actualizar; mientras tanto no se guarda nada para no estropearlo.';
    var why = rc.reason === 'ausente' ? 'No se encontró tu guardado' : 'Tu guardado estaba dañado';
    if (!rc.from) return why + ' y no había copias: empiezas de cero. Si exportaste tu progreso, impórtalo en Ajustes.';
    var src = SRC[rc.from] || ('la copia de la versión ' + String(rc.from).replace(/^v/, ''));
    return why + ': se recuperó ' + src + ago(rc.t) + '. Puede faltar lo último que hiciste.';
  };
  P.importSave = function () {
    var m = G.Sys.modal({
      title: 'Importar guardado', text: 'Pega aquí el texto exportado o elige el archivo. ATENCIÓN: sustituye tu progreso actual (se guarda una copia por si acaso).',
      area: { value: '', placeholder: 'SWARM1:...' },
      buttons: [
        { label: 'ARCHIVO...', color: '#2a6aa8', fn: function (ta) { fileIn.click(); return false; } },
        { label: 'IMPORTAR Y SUSTITUIR', color: '#a02030', fn: function (ta, close) {
          var r = G.Save.importText(ta.value);
          if (!r.ok) { G.Sys.toast(r.err, { ms: 4000 }); return false; }
          P.refresh(); try { G.Aldea.open(false); } catch (e) { /* aldea ya cargada */ }
          G.Sys.toast(r.saved ? 'Guardado importado.' : 'Guardado importado, pero el navegador no deja guardarlo: exporta antes de cerrar.', { ms: 4000 });
          G.Save.persist();
        } },
        { label: 'CANCELAR' }
      ]
    });
    var fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = '.txt,.json,text/plain,application/json'; fileIn.style.display = 'none';
    fileIn.onchange = function () {
      var f = fileIn.files && fileIn.files[0]; if (!f) return;
      if (f.size > 1024 * 1024) { G.Sys.toast('Ese archivo es demasiado grande para ser un guardado.', { ms: 3000 }); return; }
      var rd = new FileReader(); rd.onload = function () { m.area.value = String(rd.result || ''); }; rd.readAsText(f);
    };
    m.box.appendChild(fileIn);
  };

  // ------------------------------------------------------------------ Copias de seguridad (Ajustes)
  P.backups = function () {
    var Sv = G.Save, list = Sv.backups(), lines = [], btns = [];
    var when = function (t) { if (!t) return 'fecha desconocida'; var d = new Date(t); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5); };
    if (Sv.recovered) lines.push('AVISO: ' + P.recoveredText(Sv.recovered), '');
    if (!list.length) lines.push('No hay copias en este navegador.');
    list.forEach(function (b) {
      lines.push(b.label + ': ' + (b.ok ? when(b.t) + ' - ' + b.runs + ' expediciones, ' + b.brasas + ' Brasas' + (b.v < G.Save.VERSION ? ' (v' + b.v + ')' : '') : 'DAÑADA'));
      if (b.ok && b.name !== 'main' && btns.length < 4) btns.push({ label: 'RESTAURAR: ' + b.label.toUpperCase(), color: '#7a4a2a', fn: function () {
        var r = Sv.restore(b.name);
        if (!r.ok) { G.Sys.toast(r.err, { ms: 3500 }); return false; }
        P.refresh(); try { G.Aldea.open(false); } catch (e) { /* aldea */ }
        G.Sys.toast(r.saved ? 'Copia restaurada. Tu guardado anterior queda en "Antes de importar / restaurar".' : 'Copia restaurada solo en memoria: el navegador no deja guardar.', { close: true, ms: 6000 });
      } });
    });
    lines.push('', 'También hay una copia interna (IndexedDB) que se usa sola si el guardado desaparece.');
    lines.push('Almacenamiento persistente: ' + (Sv.persisted === true ? 'sí' : Sv.persisted === false ? 'no (el navegador puede borrar los datos si falta espacio)' : 'no disponible'));
    lines.push('Lo más seguro sigue siendo Exportar guardado y conservar el texto o el archivo.');
    btns.push({ label: 'CERRAR' });
    G.Sys.modal({ title: 'Copias de seguridad', text: lines.join('\n'), buttons: btns });
  };

  // ------------------------------------------------------------------ Recordatorio de exportar (cada 10 expediciones; en iPhone / iPad sin instalar, aviso propio y el primero a las 3)
  P.remindCheck = function () {
    var Sv = G.Save, d = Sv.data; if (!d || !d.flags || G.state !== 'aldea' || P.reminded) return false;
    var ios = G.Sys.isIOS && !G.Sys.standalone(), last = Math.max(d.flags.expAt || 0, d.flags.remAt || 0), runs = d.runs || 0;
    var every = ios && !last ? 3 : 10;
    if (runs - last < every) return false;
    P.reminded = true; d.flags.remAt = runs; Sv.save();
    G.Sys.toast(ios ? 'En iPhone, Safari puede borrar los datos de las webs no instaladas tras 7 días sin abrirlas. Instala el juego o exporta tu guardado.' : 'Llevas ' + (runs - last) + ' expediciones sin exportar tu guardado. Haz una copia por si el navegador lo borra.',
      { btn: 'EXPORTAR', onbtn: P.exportSave, close: true, ms: 12000 });
    return true;
  };

  P.init = function () {
    swInit(); installInit();
    var Sv = G.Save;
    try { localStorage.setItem('swarmhand.fusion.probe', '1'); localStorage.removeItem('swarmhand.fusion.probe'); } catch (e) { Sv.ok = false; }
    P.started = true;
    if (Sv.recovered) G.Sys.toast(P.recoveredText(Sv.recovered), Sv.hold ? { btn: 'RECARGAR', onbtn: function () { location.reload(); }, close: true } : { close: true, ms: 15000 });
    else if (Sv.ok === false) G.Sys.toast('Tu navegador bloquea el guardado (modo privado?). Se juega igual, pero no se guarda: exporta tu progreso en Ajustes.', { close: true, ms: 9000 });
    else if (Sv.pendingWarn) G.Sys.toast(Sv.pendingWarn, { close: true, ms: 9000 });
    Sv.pendingWarn = null;
    Sv.checkIdb(function (rc) { P.refresh(); G.Sys.toast(P.recoveredText(rc), { close: true, ms: 15000 }); });
    // Persistente cuando ya hay algo que perder (cuenta con progreso o app instalada): así no se pregunta en la primera visita
    Sv.persist(null, Sv.hasProgress(Sv.data) || G.Sys.standalone());
    if (!navigator.webdriver || /[?&]remind=1/.test(location.search)) setInterval(P.remindCheck, 4000);   // los bots no ven el recordatorio salvo ?remind=1
  };
})();
