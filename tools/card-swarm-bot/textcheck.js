// Auditoría de texto de Swarm Hand: graba cada G.txt / U.panel / U.button de UN fotograma y detecta solapes, desbordes, fuentes pequeñas y bajo contraste.
// Uso desde tests.js (modo 'text') y desde la herramienta de capturas. Todo en coordenadas LÓGICAS (960x540).
const REC = () => {
  if (window.__TC) return;
  const T = window.__TC = { on: false, list: [], boxes: [] };
  const cvm = document.createElement('canvas').getContext('2d');
  const origTxt = G.txt;
  const lg = (c) => { const m = c.getTransform(), rs = G.rs || 1; return { m, rs }; };
  G.txt = function (c, s, x, y, size, color, align) {
    if (T.on) {
      const { m, rs } = lg(c); s = String(s); if (G.minFont && size < G.minFont) size = G.minFont;
      cvm.font = 'bold ' + size + 'px "Courier New", monospace';
      const w = cvm.measureText(s).width, sc = m.a / rs, px = (m.a * x + m.c * y + m.e) / rs, py = (m.b * x + m.d * y + m.f) / rs;
      const W = w * sc, H = size * sc, al = align || 'left', x0 = al === 'center' ? px - W / 2 : al === 'right' ? px - W : px;
      if (m.b === 0 && m.c === 0 && !(sc < 0.05)) T.list.push({ s, x0, x1: x0 + W, y0: py - H * 0.5, y1: py + H * 0.5, size: size * sc, color: (G.minFont ? G.liftColor(color) : color) || '#fff', al, py });
    }
    return origTxt.apply(this, arguments);
  };
  const oP = G.UI.panel, oB = G.UI.button;
  G.UI.panel = function (c, x, y, w, h, o) { if (T.on) { const { m, rs } = lg(c); if (m.b === 0 && m.c === 0) T.boxes.push({ k: 'panel', x0: (m.a * x + m.e) / rs, y0: (m.d * y + m.f) / rs, x1: (m.a * (x + w) + m.e) / rs, y1: (m.d * (y + h) + m.f) / rs }); } return oP.apply(this, arguments); };
  G.UI.button = function (c, r, label, o) { if (T.on) { const { m, rs } = lg(c); if (m.b === 0 && m.c === 0) T.boxes.push({ k: 'button', label, x0: (m.a * r.x + m.e) / rs, y0: (m.d * r.y + m.f) / rs, x1: (m.a * (r.x + r.w) + m.e) / rs, y1: (m.d * (r.y + r.h) + m.f) / rs }); } return oB.apply(this, arguments); };
};
// Graba 2 fotogramas (uno basta; el 2.º ayuda con animaciones) y devuelve los textos únicos
async function snap(pg, frames = 2) {
  await pg.evaluate(REC);
  return pg.evaluate(async n => {
    const T = window.__TC; T.list = []; T.boxes = []; T.on = true; if (G.state === 'paused') n = 1;
    for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r));
    T.on = false;
    if (G.state === 'paused') { const k = T.list.findIndex(t => t.s === 'PAUSA'); if (k > 0) T.list = T.list.slice(k); T.boxes = T.boxes.filter(b => b.k === 'button'); }   // el HUD de debajo queda tapado por el velo
    const seen = new Set(), out = [];
    for (const t of T.list) { const k = t.s + '|' + Math.round(t.x0) + '|' + Math.round(t.py); if (!seen.has(k)) { seen.add(k); out.push(t); } }
    return { texts: out, boxes: T.boxes };
  }, frames);
}
// contraste WCAG aproximado contra un fondo oscuro estimado (los fondos del juego son #07050c .. #2a1d3a); todos los textos llevan contorno oscuro
const lum = (hex) => { let h = String(hex).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); if (!/^[0-9a-f]{6}$/i.test(h)) { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(hex); if (!m) return 1; h = [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join(''); }
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(parseInt(h.slice(0, 2), 16)) + 0.7152 * f(parseInt(h.slice(2, 4), 16)) + 0.0722 * f(parseInt(h.slice(4, 6), 16)); };
const contrast = (fg, bg = '#1a1226') => { const a = lum(fg), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
// opciones: minSize (px lógicos), W/H pantalla
function analyze(d, o = {}) {
  const minSize = o.minSize || 11, W = o.W || 960, H = o.H || 540, issues = [], T = d.texts;
  for (const t of T) {
    if (t.size < minSize - 0.01 && !/^\s*$/.test(t.s)) issues.push({ k: 'size', msg: `fuente ${t.size.toFixed(1)} < ${minSize}: "${t.s.slice(0, 40)}"` });
    if (t.x1 < 0 || t.x0 > W || t.y1 < 0 || t.y0 > H) continue;   // fuera por completo (texto flotante del mundo): invisible
    if (t.x0 < -1 || t.x1 > W + 1 || t.y0 < -1 || t.y1 > H + 1) issues.push({ k: 'fuera', msg: `fuera de pantalla (${Math.round(t.x0)}..${Math.round(t.x1)}, y ${Math.round(t.py)}): "${t.s.slice(0, 40)}"` });
    if (lum(t.color) >= 0.03 && contrast(t.color) < 4.5 && t.s.trim()) issues.push({ k: 'contraste', msg: `contraste ${contrast(t.color).toFixed(1)} (${t.color}): "${t.s.slice(0, 40)}"` });
  }
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j];
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0); if (ox <= 1) continue;
    const dy = Math.abs(a.py - b.py), mh = Math.max(a.size, b.size), mn = Math.min(a.size, b.size), need = (a.size + b.size) / 2 + 0.25 * mn;   // hueco visual >= 25 % del cuerpo menor (= interlineado 1,25 con el mismo tamaño)
    if (dy < mh * 0.55) issues.push({ k: 'solape', msg: `se pisan (${Math.round(ox)} px): "${a.s.slice(0, 28)}" / "${b.s.slice(0, 28)}"` });
    else if (dy < need - 0.01 && dy > 0.5) issues.push({ k: 'pegadas', msg: `lineas pegadas (dy ${dy.toFixed(1)} < ${need.toFixed(1)}): "${a.s.slice(0, 28)}" / "${b.s.slice(0, 28)}"` });
  }
  for (const bx of d.boxes) {
    if (bx.k !== 'button') continue;
    for (const t of T) if (t.py > bx.y0 && t.py < bx.y1 && (t.x0 + t.x1) / 2 > bx.x0 && (t.x0 + t.x1) / 2 < bx.x1 && (t.x0 < bx.x0 + 2 || t.x1 > bx.x1 - 2)) issues.push({ k: 'desborde', msg: `texto desborda su boton (${Math.round(bx.x0)}-${Math.round(bx.x1)}): "${t.s.slice(0, 40)}" (${Math.round(t.x0)}..${Math.round(t.x1)})` });
  }
  return issues;
}
module.exports = { snap, analyze, contrast };
