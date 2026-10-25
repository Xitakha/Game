/* tree.js - Árbol de forja de Grum (Fase 2b): datos de nodos (Tronco + los 6 árboles de etiqueta: Fuego, Hielo, Rayo, Veneno, Sangre y Acero, 11-12 nodos
   cada uno), reglas (PF, prerrequisitos, ramas excluyentes, reespecializar) y el panel de UI por pestañas. Los efectos viven en T.fx (flags) y los leen cards.js,
   combat.js, weapons.js y player.js. Costes por nivel en Loot.NODE_TIER (x L.COST_MUL.node x L.TREE_PART_MUL); nada de balance está aquí salvo los textos y la disposición. */
(function () {
  'use strict';
  var G = window.G, T = G.Tree = {}, L = G.Loot, U = G.UI, inp = G.input;

  // ------------------------------------------------------------- Datos
  // type: C carta, M mejora A/B, P pasivo, X rama excluyente, S set, Ma maestría, R rango/tronco. col,row = posición en la rejilla (100 x 68 px).
  // req: { all: [...] } o { any: [...] } (F0 = raíz, siempre comprada). tier: T1..T4 (T2 pide Rango II, T3/T4 piden Rango III). cost: coste propio (tronco).
  var NODES = [
    { id: 'F0', tree: 'fire', tag: 'fire', type: 'root', name: 'Chispa', col: 2.5, row: 0, icon: 'flame', desc: 'Carta inicial de Fuego (Rango I): proyectil al enemigo más cercano con quemadura. Raíz del árbol.' },
    { id: 'F1', tree: 'fire', tag: 'fire', type: 'M', tier: 'T1', name: 'Chispa II', col: 1, row: 1, icon: 'flame', card: 'spark', req: { all: ['F0'] },
      desc: 'Chispa sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Pavesa', fx: 'pavesa', desc: 'La quemadura de Chispa dura +2 s y hace +30 % de su daño.' }, B: { name: 'Ráfaga', fx: 'rafaga', desc: 'El cooldown de Chispa baja un 15 %.' } } },
    { id: 'F2', tree: 'fire', tag: 'fire', type: 'C', tier: 'T1', name: 'Bola de brasa', col: 4, row: 1, icon: 'burst', card: 'ember', req: { all: ['F0'] },
      desc: 'Desbloquea la carta Bola de brasa (común): bola lenta que explota en área.' },
    { id: 'F4', tree: 'fire', tag: 'fire', type: 'P', tier: 'T1', name: 'Pulmón de fragua', col: 0, row: 2, icon: 'flame', fx: 'lung', req: { all: ['F1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Fuego.' },
    { id: 'F5', tree: 'fire', tag: 'fire', type: 'C', tier: 'T2', name: 'Manto de ceniza', col: 2, row: 2, icon: 'mantle', card: 'mantle', req: { any: ['F1', 'F2'] },
      desc: 'Desbloquea la carta pasiva Manto de ceniza (rara): las cartas Fuego hacen +25 % de daño.' },
    { id: 'F3', tree: 'fire', tag: 'fire', type: 'M', tier: 'T2', name: 'Bola II', col: 4, row: 2, icon: 'burst', card: 'ember', req: { all: ['F2'] },
      desc: 'Bola de brasa sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Metralla', fx: 'metralla', desc: 'Al explotar lanza además 3 fragmentos de 8 de daño.' }, B: { name: 'Napalm', fx: 'napalm', desc: 'Deja suelo ardiente 2 s (4 dps, radio 40).' } } },
    { id: 'F6', tree: 'fire', tag: 'fire', type: 'X', tier: 'T2', name: 'Cenizas ardientes', col: 1, row: 3, icon: 'cloud', fx: 'cenizas', req: { all: ['F5'] }, xor: 'F7',
      desc: 'Un enemigo quemado que muere deja 3 s de fuego en el suelo (radio 35). Para enjambres. Excluye a Fundición.' },
    { id: 'F7', tree: 'fire', tag: 'fire', type: 'X', tier: 'T2', name: 'Fundición', col: 3, row: 3, icon: 'shield', fx: 'fundicion', req: { all: ['F5'] }, xor: 'F6',
      desc: 'Fuego ignora la mitad del escudo del Escudero (x0,2 pasa a x0,5) y hace +15 % a élites y jefe. Excluye a Cenizas ardientes.' },
    { id: 'F8', tree: 'fire', tag: 'fire', type: 'C', tier: 'T3', name: 'Anillo ardiente', col: 4, row: 3, icon: 'ring', card: 'ring', req: { all: ['F3', 'F5'] },
      desc: 'Desbloquea la carta épica Anillo ardiente: 2 llamas orbitan a tu alrededor. Exige 1 Esencia rara.' },
    { id: 'F10', tree: 'fire', tag: 'fire', type: 'S', tier: 'T2', name: 'Emblema de Fuego', col: 2, row: 4, icon: 'burst', fx: 'emblem', req: { any: ['F6', 'F7'] },
      desc: 'Set: con 3 cartas Fuego en la mano, +25 % de daño de Fuego. Con 4 o más, "Pira": las quemaduras se propagan al morir.' },
    { id: 'F9', tree: 'fire', tag: 'fire', type: 'M', tier: 'T2', name: 'Anillo II', col: 4, row: 4, icon: 'ring', card: 'ring', req: { all: ['F8'] },
      desc: 'Anillo ardiente sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Corona', fx: 'corona', desc: '3 llamas orbitales en vez de 2.' }, B: { name: 'Cometa', fx: 'cometa', desc: 'Órbita +25 % de radio y +20 % de daño.' } } },
    { id: 'F11', tree: 'fire', tag: 'fire', type: 'Ma', tier: 'T4', name: 'Corazón de brasa', col: 3, row: 5, icon: 'heart', fx: 'heart', req: { all: ['F9', 'F10'] },
      desc: 'Maestría: una vez por expedición, al llegar a 0 HP revives con el 40 % de vida y una explosión de radio 120 (60 de daño).' },
    // ================= HIELO (12 nodos, ~20 PF): control y ralentización. Debilidad de Karceron.
    { id: 'H0', tree: 'ice', tag: 'ice', type: 'root', name: 'Esquirla', col: 2.5, row: 0, icon: 'flake', desc: 'Carta inicial de Hielo (Rango I): proyectil que ralentiza al enemigo. Raíz del árbol.' },
    { id: 'H1', tree: 'ice', tag: 'ice', type: 'M', tier: 'T1', name: 'Esquirla II', col: 1, row: 1, icon: 'flake', card: 'shard', req: { all: ['H0'] },
      desc: 'Esquirla sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Perforante', fx: 'perfora', desc: 'La Esquirla atraviesa a todos los enemigos de su trayectoria.' }, B: { name: 'Escarcha densa', fx: 'helada', desc: 'La Esquirla ralentiza +15 puntos y 1 s más.' } } },
    { id: 'H2', tree: 'ice', tag: 'ice', type: 'C', tier: 'T1', name: 'Nova helada', col: 4, row: 1, icon: 'nova', card: 'nova', req: { all: ['H0'] },
      desc: 'Desbloquea la carta Nova helada (común): pulso de radio 85 a tu alrededor que daña y ralentiza.' },
    { id: 'H4', tree: 'ice', tag: 'ice', type: 'P', tier: 'T1', name: 'Aliento gélido', col: 0, row: 2, icon: 'snow', fx: 'aliento', req: { all: ['H1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Hielo.' },
    { id: 'H5', tree: 'ice', tag: 'ice', type: 'C', tier: 'T2', name: 'Cristal de escarcha', col: 2, row: 2, icon: 'flake', card: 'frost', req: { any: ['H1', 'H2'] },
      desc: 'Desbloquea la carta pasiva Cristal de escarcha (rara): ralentizaciones +15 puntos de intensidad y +1 s.' },
    { id: 'H3', tree: 'ice', tag: 'ice', type: 'M', tier: 'T2', name: 'Nova II', col: 4, row: 2, icon: 'nova', card: 'nova', req: { all: ['H2'] },
      desc: 'Nova helada sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Onda ancha', fx: 'novaAncha', desc: 'El radio del pulso crece un 25 %.' }, B: { name: 'Doble pulso', fx: 'novaDoble', desc: 'Un segundo pulso (70 % de daño) 0,4 s después.' } } },
    { id: 'H6', tree: 'ice', tag: 'ice', type: 'X', tier: 'T2', name: 'Permafrost', col: 1, row: 3, icon: 'snow', fx: 'permafrost', req: { all: ['H5'] }, xor: 'H7',
      desc: 'Toda ralentización es de al menos el 45 %. Para controlar enjambres. Excluye a Quebradizo.' },
    { id: 'H7', tree: 'ice', tag: 'ice', type: 'X', tier: 'T2', name: 'Quebradizo', col: 3, row: 3, icon: 'burst', fx: 'quebradizo', req: { all: ['H5'] }, xor: 'H6',
      desc: 'Cualquier carta hace +25 % de daño a enemigos ralentizados. Para matar élites. Excluye a Permafrost.' },
    { id: 'H8', tree: 'ice', tag: 'ice', type: 'C', tier: 'T3', name: 'Ventisca', col: 4, row: 3, icon: 'snow', card: 'blizzard', req: { all: ['H3', 'H5'] },
      desc: 'Desbloquea la carta épica Ventisca: aura permanente de radio 70 que daña y ralentiza. Exige 1 Esencia rara.' },
    { id: 'H10', tree: 'ice', tag: 'ice', type: 'S', tier: 'T2', name: 'Cripta de hielo', col: 2, row: 4, icon: 'flake', fx: 'setIce', req: { any: ['H6', 'H7'] },
      desc: 'Set: con 3 cartas de Hielo en la mano, +25 % de daño de Hielo. Con 4 o más, "Cripta": los ralentizados con menos del 15 % de vida mueren congelados.' },
    { id: 'H9', tree: 'ice', tag: 'ice', type: 'M', tier: 'T2', name: 'Ventisca II', col: 4, row: 4, icon: 'snow', card: 'blizzard', req: { all: ['H8'] },
      desc: 'Ventisca sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Ventisca ancha', fx: 'ventAncha', desc: 'El radio del aura crece un 30 %.' }, B: { name: 'Escarcha eterna', fx: 'ventDura', desc: 'El aura hace +40 % de daño por segundo.' } } },
    { id: 'H11', tree: 'ice', tag: 'ice', type: 'Ma', tier: 'T4', name: 'Era glacial', col: 3, row: 5, icon: 'nova', fx: 'eraGlacial', req: { all: ['H9', 'H10'] },
      desc: 'Maestría: cada 60 s un pulso congela 2 s a todos los enemigos en pantalla (los jefes y élites solo se ralentizan).' },
    // ================= RAYO (12 nodos, ~20 PF): cadenas y área. Debilidad de Karceron. La raíz es virtual: el primer nodo es la carta Chispazo.
    { id: 'Z0', tree: 'lightning', tag: 'lightning', type: 'root', name: 'Tormenta lejana', col: 2.5, row: 0, icon: 'bolt', desc: 'Raíz del árbol de Rayo. Aún no tienes ninguna carta de Rayo: Chispazo (a la izquierda) abre el camino.' },
    { id: 'Z1', tree: 'lightning', tag: 'lightning', type: 'C', tier: 'T1', name: 'Chispazo', col: 1, row: 1, icon: 'bolt', card: 'zap', req: { all: ['Z0'] },
      desc: 'Desbloquea la carta Chispazo (común): rayo que salta entre 3 enemigos (-20 % de daño por salto).' },
    { id: 'Z5', tree: 'lightning', tag: 'lightning', type: 'C', tier: 'T2', name: 'Cascabel conductor', col: 4, row: 1, icon: 'bell', card: 'bell', req: { all: ['Z0'] },
      desc: 'Desbloquea la carta pasiva Cascabel conductor (rara): las cartas de Rayo -20 % de cooldown y +1 salto.' },
    { id: 'Z2', tree: 'lightning', tag: 'lightning', type: 'M', tier: 'T1', name: 'Chispazo II', col: 0, row: 2, icon: 'bolt', card: 'zap', req: { all: ['Z1'] },
      desc: 'Chispazo sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Chispa viva', fx: 'chispaViva', desc: 'El cooldown de Chispazo baja un 15 %.' }, B: { name: 'Sin pérdida', fx: 'sinPerdida', desc: 'El rayo no pierde daño en cada salto.' } } },
    { id: 'Z4', tree: 'lightning', tag: 'lightning', type: 'P', tier: 'T1', name: 'Pararrayos', col: 2, row: 2, icon: 'bolt', fx: 'pararrayos', req: { all: ['Z1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Rayo.' },
    { id: 'Z8', tree: 'lightning', tag: 'lightning', type: 'C', tier: 'T2', name: 'Bobina', col: 4, row: 2, icon: 'coil', card: 'coil', req: { all: ['Z5'] },
      desc: 'Desbloquea la carta nueva Bobina (rara): coloca una torreta 5 s que dispara 7 de daño cada 0,4 s al enemigo más cercano.' },
    { id: 'Z6', tree: 'lightning', tag: 'lightning', type: 'X', tier: 'T2', name: 'Cadena larga', col: 1, row: 3, icon: 'bolt', fx: 'cadenaLarga', req: { all: ['Z4'] }, xor: 'Z7',
      desc: 'Los rayos en cadena dan +1 salto y su alcance sube a 150. Para enjambres. Excluye a Un solo rayo.' },
    { id: 'Z7', tree: 'lightning', tag: 'lightning', type: 'X', tier: 'T2', name: 'Un solo rayo', col: 3, row: 3, icon: 'storm', fx: 'unRayo', req: { all: ['Z4'] }, xor: 'Z6',
      desc: 'El rayo en cadena hace x2 de daño pero un salto menos. Para blindados y jefes. Excluye a Cadena larga.' },
    { id: 'Z3', tree: 'lightning', tag: 'lightning', type: 'C', tier: 'T3', name: 'Tormenta', col: 4, row: 3, icon: 'storm', card: 'storm', req: { all: ['Z4', 'Z8'] },
      desc: 'Desbloquea la carta épica Tormenta: cae un rayo de 32 de daño en área sobre un enemigo visible. Exige 1 Esencia rara.' },
    { id: 'Z10', tree: 'lightning', tag: 'lightning', type: 'S', tier: 'T2', name: 'Eco de tormenta', col: 2, row: 4, icon: 'bolt', fx: 'setLight', req: { any: ['Z6', 'Z7'] },
      desc: 'Set: con 3 cartas de Rayo en la mano, +25 % de daño de Rayo. Con 4 o más, "Eco": cada 8.º rayo (Chispazo, Tormenta) se repite solo.' },
    { id: 'Z9', tree: 'lightning', tag: 'lightning', type: 'M', tier: 'T2', name: 'Tormenta II', col: 4, row: 4, icon: 'storm', card: 'storm', req: { all: ['Z3'] },
      desc: 'Tormenta sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Dos rayos', fx: 'dobleRayo', desc: 'Cae un segundo rayo (60 % de daño) sobre otro enemigo.' }, B: { name: 'Rayo ancho', fx: 'rayoAncho', desc: 'Área x1,5 y +10 % de daño.' } } },
    { id: 'Z11', tree: 'lightning', tag: 'lightning', type: 'Ma', tier: 'T4', name: 'Ojo de la tormenta', col: 3, row: 5, icon: 'storm', fx: 'ojoTormenta', req: { all: ['Z9', 'Z10'] },
      desc: 'Maestría: cada 10 s cae un rayo (150 de daño) sobre cada élite y jefe.' },
    // ================= VENENO (12 nodos, ~20 PF): daño sostenido. Debilidad de Letea (tras mudar la sangre).
    { id: 'V0', tree: 'poison', tag: 'poison', type: 'root', name: 'Dardo tóxico', col: 2.5, row: 0, icon: 'dart', desc: 'Carta inicial de Veneno (Rango I): proyectil con veneno que apila. Raíz del árbol.' },
    { id: 'V1', tree: 'poison', tag: 'poison', type: 'M', tier: 'T1', name: 'Dardo II', col: 1, row: 1, icon: 'dart', card: 'dart', req: { all: ['V0'] },
      desc: 'Dardo tóxico sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Dosis doble', fx: 'dosisDoble', desc: 'Cada Dardo aplica 2 stacks de veneno en vez de 1.' }, B: { name: 'Punta afilada', fx: 'puntaAfilada', desc: 'El daño inicial del Dardo se duplica.' } } },
    { id: 'V2', tree: 'poison', tag: 'poison', type: 'C', tier: 'T1', name: 'Charco', col: 4, row: 1, icon: 'pool', card: 'pool', req: { all: ['V0'] },
      desc: 'Desbloquea la carta Charco (común): charco de 5 s bajo el enemigo más cercano, 6 dps + veneno.' },
    { id: 'V4', tree: 'poison', tag: 'poison', type: 'P', tier: 'T1', name: 'Savia amarga', col: 0, row: 2, icon: 'flask', fx: 'savia', req: { all: ['V1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Veneno y de su daño por veneno.' },
    { id: 'V5', tree: 'poison', tag: 'poison', type: 'C', tier: 'T2', name: 'Frasco de bilis', col: 2, row: 2, icon: 'flask', card: 'bile', req: { any: ['V1', 'V2'] },
      desc: 'Desbloquea la carta pasiva Frasco de bilis (rara): veneno +50 % de daño y apila hasta 5.' },
    { id: 'V3', tree: 'poison', tag: 'poison', type: 'M', tier: 'T2', name: 'Charco II', col: 4, row: 2, icon: 'pool', card: 'pool', req: { all: ['V2'] },
      desc: 'Charco sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Pantano', fx: 'pantano', desc: 'El charco dura 8 s en vez de 5.' }, B: { name: 'Charco amplio', fx: 'charcoAncho', desc: 'El radio del charco crece un 30 %.' } } },
    { id: 'V6', tree: 'poison', tag: 'poison', type: 'X', tier: 'T2', name: 'Pandemia', col: 1, row: 3, icon: 'cloud', fx: 'pandemia', req: { all: ['V5'] }, xor: 'V7',
      desc: 'Un enemigo envenenado que muere pasa su veneno (hasta 2 stacks) a 3 enemigos cercanos. Para enjambres. Excluye a Neurotoxina.' },
    { id: 'V7', tree: 'poison', tag: 'poison', type: 'X', tier: 'T2', name: 'Neurotoxina', col: 3, row: 3, icon: 'dart', fx: 'neurotoxina', req: { all: ['V5'] }, xor: 'V6',
      desc: 'El veneno apila hasta 5 y, al llegar a 5 stacks, aturde 1 s al enemigo (cada 3 s). Para élites. Excluye a Pandemia.' },
    { id: 'V8', tree: 'poison', tag: 'poison', type: 'C', tier: 'T3', name: 'Nube pútrida', col: 4, row: 3, icon: 'cloud', card: 'cloud', req: { all: ['V3', 'V5'] },
      desc: 'Desbloquea la carta Nube pútrida (aura permanente de radio 60: 3 dps + veneno). Exige 1 Esencia rara.' },
    { id: 'V10', tree: 'poison', tag: 'poison', type: 'S', tier: 'T2', name: 'Foco de infección', col: 2, row: 4, icon: 'flask', fx: 'setPoison', req: { any: ['V6', 'V7'] },
      desc: 'Set: con 3 cartas de Veneno en la mano, +25 % de daño de Veneno. Con 4 o más, "Epidemia": un envenenado que muere deja un charco venenoso 2,5 s.' },
    { id: 'V9', tree: 'poison', tag: 'poison', type: 'M', tier: 'T2', name: 'Nube II', col: 4, row: 4, icon: 'cloud', card: 'cloud', req: { all: ['V8'] },
      desc: 'Nube pútrida sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Nube densa', fx: 'nubeAncha', desc: 'El radio del aura crece un 30 %.' }, B: { name: 'Miasma', fx: 'miasma', desc: 'El aura hace x1,5 de daño por segundo.' } } },
    { id: 'V11', tree: 'poison', tag: 'poison', type: 'Ma', tier: 'T4', name: 'Plaga', col: 3, row: 5, icon: 'cloud', fx: 'plaga', req: { all: ['V9', 'V10'] },
      desc: 'Maestría: el veneno nunca expira en élites y jefes (los stacks se mantienen hasta que mueren).' },
    // ================= SANGRE (11 nodos, ~17 PF): el árbol menor, 4 cartas. Debilidad de Letea.
    { id: 'S0', tree: 'blood', tag: 'blood', type: 'root', name: 'Colmillo', col: 2.5, row: 0, icon: 'fang', desc: 'Carta inicial de Sangre (Rango I): tajo en arco que a veces cura. Raíz del árbol.' },
    { id: 'S1', tree: 'blood', tag: 'blood', type: 'M', tier: 'T1', name: 'Colmillo II', col: 1, row: 1, icon: 'fang', card: 'fang', req: { all: ['S0'] },
      desc: 'Colmillo sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Hemorragia', fx: 'hemorragia', desc: 'La curación del Colmillo se duplica (3 a 6 HP).' }, B: { name: 'Arco amplio', fx: 'arcoAmplio', desc: 'El tajo cubre 120 grados en vez de 90.' } } },
    { id: 'S2', tree: 'blood', tag: 'blood', type: 'C', tier: 'T1', name: 'Sangría', col: 4, row: 1, icon: 'drop', card: 'bleed', req: { all: ['S0'] },
      desc: 'Desbloquea la carta Sangría (común): marca a 3 enemigos cercanos con sangrado de 5 dps durante 3 s.' },
    { id: 'S4', tree: 'blood', tag: 'blood', type: 'P', tier: 'T1', name: 'Ansia', col: 0, row: 2, icon: 'drop', fx: 'ansia', req: { all: ['S1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Sangre y en el sangrado.' },
    { id: 'S5', tree: 'blood', tag: 'blood', type: 'C', tier: 'T2', name: 'Corazón de lana', col: 2, row: 2, icon: 'heart', card: 'heart', req: { any: ['S1', 'S2'] },
      desc: 'Desbloquea la carta pasiva Corazón de lana: +30 de vida máxima y curación inmediata de 30.' },
    { id: 'S3', tree: 'blood', tag: 'blood', type: 'M', tier: 'T2', name: 'Sangría II', col: 4, row: 2, icon: 'drop', card: 'bleed', req: { all: ['S2'] },
      desc: 'Sangría sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Cuatro marcas', fx: 'cuatroMarcas', desc: 'Marca a 4 enemigos en vez de 3.' }, B: { name: 'Sangrado profundo', fx: 'sangradoHondo', desc: 'El sangrado hace 7 dps en vez de 5 (+40 %).' } } },
    { id: 'S9', tree: 'blood', tag: 'blood', type: 'C', tier: 'T2', name: 'Murciélago', col: 4, row: 3, icon: 'bat', card: 'bat', req: { all: ['S3'] },
      desc: 'Desbloquea la carta nueva Murciélago (rara): persigue a un enemigo (13 de daño + sangrado) y rebota a otro.' },
    { id: 'S6', tree: 'blood', tag: 'blood', type: 'X', tier: 'T2', name: 'Vampiro', col: 1, row: 3, icon: 'heart', fx: 'vampiro', req: { all: ['S5'] }, xor: 'S7',
      desc: 'Matar con una carta de Sangre tiene un 12 % de curar 3 HP. Para aguantar. Excluye a Berserker.' },
    { id: 'S7', tree: 'blood', tag: 'blood', type: 'X', tier: 'T2', name: 'Berserker', col: 3, row: 3, icon: 'fang', fx: 'berserker', req: { all: ['S5'] }, xor: 'S6',
      desc: 'Todas tus cartas hacen +35 % de daño con menos del 40 % de vida. Para jugar al límite. Excluye a Vampiro.' },
    { id: 'S10', tree: 'blood', tag: 'blood', type: 'S', tier: 'T2', name: 'Pacto de sed', col: 2, row: 4, icon: 'drop', fx: 'setBlood', req: { any: ['S6', 'S7'] },
      desc: 'Set: con 3 cartas de Sangre en la mano, +25 % de daño de Sangre. Con 4, "Sed": cada 3 kills ganas un escudo de 10 HP (tope 20).' },
    { id: 'S11', tree: 'blood', tag: 'blood', type: 'Ma', tier: 'T4', name: 'Pacto de sangre', col: 3, row: 5, icon: 'heart', fx: 'pactoSangre', req: { all: ['S9', 'S10'] },
      desc: 'Maestría: cada 25 kills recuperas 15 HP y ganas +10 % de daño durante 5 s.' },
    // ================= ACERO (12 nodos, ~20 PF): críticos y defensa. Debilidad del Pastor.
    { id: 'A0', tree: 'steel', tag: 'steel', type: 'root', name: 'Daga', col: 2.5, row: 0, icon: 'dagger', desc: 'Carta inicial de Acero (Rango I): tres dagas en abanico. Raíz del árbol.' },
    { id: 'A1', tree: 'steel', tag: 'steel', type: 'M', tier: 'T1', name: 'Daga II', col: 1, row: 1, icon: 'dagger', card: 'dagger', req: { all: ['A0'] },
      desc: 'Daga sube a Rango II (+8 % de daño). Elige una mejora permanente.',
      ch: { A: { name: 'Cinco dagas', fx: 'quintuple', desc: 'Lanza 5 dagas (80 % de daño cada una) en vez de 3.' }, B: { name: 'Perforante', fx: 'perforante', desc: 'Las dagas atraviesan a todos los enemigos.' } } },
    { id: 'A2', tree: 'steel', tag: 'steel', type: 'C', tier: 'T1', name: 'Escudo de púas', col: 4, row: 1, icon: 'shield', card: 'thorns', req: { all: ['A0'] },
      desc: 'Desbloquea la carta Escudo de púas (común): 3 escudos orbitan a tu alrededor, dañan y empujan.' },
    { id: 'A4', tree: 'steel', tag: 'steel', type: 'P', tier: 'T1', name: 'Temple', col: 0, row: 2, icon: 'whet', fx: 'temple', req: { all: ['A1'] },
      desc: 'Pasivo: +8 % de daño en todas las cartas de Acero.' },
    { id: 'A5', tree: 'steel', tag: 'steel', type: 'C', tier: 'T2', name: 'Piedra de afilar', col: 2, row: 2, icon: 'whet', card: 'whet', req: { any: ['A1', 'A2'] },
      desc: 'Desbloquea la carta pasiva Piedra de afilar (rara): Acero +25 % de daño y +10 % de crítico (x2).' },
    { id: 'A3', tree: 'steel', tag: 'steel', type: 'M', tier: 'T2', name: 'Púas II', col: 4, row: 2, icon: 'shield', card: 'thorns', req: { all: ['A2'] },
      desc: 'Escudo de púas sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Cuatro escudos', fx: 'cuatroEscudos', desc: 'Un escudo orbital más (4 en vez de 3).' }, B: { name: 'Empuje doble', fx: 'empuje', desc: 'El empuje de los escudos se duplica.' } } },
    { id: 'A6', tree: 'steel', tag: 'steel', type: 'X', tier: 'T2', name: 'Filo', col: 1, row: 3, icon: 'dagger', fx: 'filo', req: { all: ['A5'] }, xor: 'A7',
      desc: 'Las cartas de Acero ganan +15 % de probabilidad de crítico (x2). Para quien ataca. Excluye a Bastión.' },
    { id: 'A7', tree: 'steel', tag: 'steel', type: 'X', tier: 'T2', name: 'Bastión', col: 3, row: 3, icon: 'shield', fx: 'bastion', req: { all: ['A5'] }, xor: 'A6',
      desc: 'Recibes un 10 % menos de daño de cualquier fuente. Para quien aguanta. Excluye a Filo.' },
    { id: 'A8', tree: 'steel', tag: 'steel', type: 'C', tier: 'T3', name: 'Hacha giratoria', col: 4, row: 3, icon: 'axe', card: 'axe', req: { all: ['A3', 'A5'] },
      desc: 'Desbloquea la carta épica Hacha giratoria: boomerang que atraviesa, 22 de daño. Exige 1 Esencia rara.' },
    { id: 'A10', tree: 'steel', tag: 'steel', type: 'S', tier: 'T2', name: 'Filo eterno', col: 2, row: 4, icon: 'whet', fx: 'setSteel', req: { any: ['A6', 'A7'] },
      desc: 'Set: con 3 cartas de Acero en la mano, +25 % de daño de Acero. Con 4 o más, "Filo eterno": cada crítico recorta 0,3 s todos los cooldowns.' },
    { id: 'A9', tree: 'steel', tag: 'steel', type: 'M', tier: 'T2', name: 'Hacha II', col: 4, row: 4, icon: 'axe', card: 'axe', req: { all: ['A8'] },
      desc: 'Hacha giratoria sube a Rango II. Elige una mejora permanente.',
      ch: { A: { name: 'Hoja ancha', fx: 'hojaAncha', desc: 'El Hacha es un 50 % más grande y golpea a más enemigos.' }, B: { name: 'Hacha veloz', fx: 'hachaVeloz', desc: 'El cooldown del Hacha baja un 20 %.' } } },
    { id: 'A11', tree: 'steel', tag: 'steel', type: 'Ma', tier: 'T4', name: 'Tormenta de acero', col: 3, row: 5, icon: 'axe', fx: 'tormentaAcero', req: { all: ['A9', 'A10'] },
      desc: 'Maestría: las dagas rebotan una vez hacia otro enemigo y el Hacha dobla la ida de su arco.' },
    // ---- Tronco común
    { id: 'R2', tree: 'trunk', tag: 'neutral', type: 'R', name: 'Rango de forja II', col: 2, row: 0, icon: 'II', fx: 'rank2', cost: { pf: 0, parts: { thread: 30, feather: 10 }, brasas: 60 },
      desc: 'Abre los nodos de nivel T2 de todos los árboles.' },
    { id: 'R3', tree: 'trunk', tag: 'neutral', type: 'R', name: 'Rango de forja III', col: 2, row: 1, icon: 'III', fx: 'rank3', req: { all: ['R2'] }, cost: { pf: 0, parts: { thread: 60, feather: 20, plate: 10 }, brasas: 120 },
      desc: 'Abre los nodos de nivel T3 (cartas épicas) y T4 (maestrías).' },
    { id: 'ASH', tree: 'trunk', tag: 'neutral', type: 'P', name: 'Ceniza viva', col: 4, row: 1, icon: 'burst', fx: 'ash', cost: { pf: 1, parts: { thread: 20 }, brasas: 30 },
      desc: 'Pasivo: empiezas cada expedición con +20 de Ceniza.' },
    { id: 'ANC', tree: 'trunk', tag: 'neutral', type: 'S', name: 'Tercera ancla', col: 2, row: 2, icon: '3', fx: 'anchor3', req: { all: ['R3'] }, cost: { pf: 3, parts: { rare: 2 }, brasas: 60 },
      desc: 'Llevas 3 cartas ancla ya en la mano al salir, en vez de 2.' },
    { id: 'N1', tree: 'trunk', tag: 'neutral', type: 'C', tier: 'T1', name: 'Pezuñas veloces', col: 1, row: 4, icon: 'boots', card: 'hooves',
      desc: 'Desbloquea la pasiva Pezuñas veloces: +12 % de velocidad de movimiento.' },
    { id: 'N2', tree: 'trunk', tag: 'neutral', type: 'C', tier: 'T1', name: 'Imán de brasas', col: 2, row: 4, icon: 'magnet', card: 'magnet',
      desc: 'Desbloquea la pasiva Imán de brasas: radio de recogida x2 y +20 % de XP.' },
    { id: 'N3', tree: 'trunk', tag: 'neutral', type: 'C', tier: 'T1', name: 'Alforja de ceniza', col: 3, row: 4, icon: 'bag', card: 'satchel',
      desc: 'Desbloquea la pasiva Alforja de ceniza: +50 % de Ceniza y rerolls 5 más baratos.' }
  ];
  var BY = {}; NODES.forEach(function (n) { BY[n.id] = n; });
  T.NODES = NODES; T.node = function (id) { return BY[id]; };
  T.treeCards = {}; NODES.forEach(function (n) { if (n.card) T.treeCards[n.card] = 1; });   // cartas que se obtienen en el árbol (el resto: set básico)
  T.TABS = [{ id: 'fire', name: 'FUEGO', color: G.TAGS.fire.color }, { id: 'ice', name: 'HIELO', color: G.TAGS.ice.color }, { id: 'lightning', name: 'RAYO', color: G.TAGS.lightning.color },
    { id: 'poison', name: 'VENENO', color: G.TAGS.poison.color }, { id: 'blood', name: 'SANGRE', color: G.TAGS.blood.color }, { id: 'steel', name: 'ACERO', color: G.TAGS.steel.color },
    { id: 'trunk', name: 'TRONCO', color: '#c8b8e8' }];
  T.tabOf = function (id) { return T.TABS.filter(function (t) { return t.id === id; })[0]; };
  var TYPE_NAME = { root: 'RAÍZ', C: 'CARTA', M: 'MEJORA A / B', P: 'PASIVO', X: 'RAMA EXCLUYENTE', S: 'SET', Ma: 'MAESTRÍA', R: 'RANGO DE FORJA' };

  // ------------------------------------------------------------- Estado y reglas
  function SV() { return G.Save.data; }
  T.fx = {};
  T.owned = function (id) { var n = BY[id]; return (n && n.type === 'root') || !!SV().nodes[id]; };
  T.choice = function (id) { var o = SV().nodes[id]; return o ? o.c : null; };
  T.pfEarned = function () { return SV().pf.earned; };
  T.pfUsed = function () { var u = 0, N = SV().nodes; for (var id in N) if (!N[id].free && BY[id]) u += T.cost(BY[id]).pf; return u; };
  T.pfFree = function () { return T.pfEarned() - T.pfUsed(); };
  T.addPF = function (n) {
    var S = SV(), before = S.pf.earned; S.pf.earned = Math.min(L.PF_CAP, before + n);
    return S.pf.earned - before;
  };
  // Primer élite abatido de cada tipo: +1 PF
  // v5: además, cada kill de un minijefe da 1 fragmento de PF (2 fragmentos = 1 PF)
  T.onElite = function (type, e) {
    var S = SV(), got = 0;
    S.pf.frag = Math.round(((S.pf.frag || 0) + (G.mode === 'practice' ? 1 : L.dur().pf)) * 100) / 100;   // fragmento x pf de la duración (Rápida 1,4)
    if (S.pf.frag >= L.PF_SOURCES.miniFrag) { S.pf.frag -= L.PF_SOURCES.miniFrag; got += T.addPF(1); }
    var ek = e && e.mini ? 'mini_slot' + e.slot : type === 'mini_bulwark' ? 'mini_slot1' : type === 'mini_hive' ? 'mini_slot2' : type;   // P4.5: primer élite por SLOT (como mucho +2 PF de por vida)
    if (!S.elites[ek]) { S.elites[ek] = 1; got += T.addPF(L.PF_SOURCES.firstElite); }
    G.Save.save();
    if (got) L.run.pf = (L.run.pf || 0) + got;
    try {
      G.fx.num(e.x, e.y - 40, got ? '+' + got + ' PF' : 'Fragmento de PF ' + (+(S.pf.frag || 0).toFixed(1)) + '/' + L.PF_SOURCES.miniFrag, '#ffd24a', true);
      G.Hud.banner(got ? '+' + got + ' PUNTO' + (got > 1 ? 'S' : '') + ' DE FORJA' : 'FRAGMENTO DE PUNTO DE FORJA ' + (+(S.pf.frag || 0).toFixed(1)) + '/' + L.PF_SOURCES.miniFrag, 1800, '#ffd24a');
    } catch (x) { /* fx */ }
  };

  // Coste de un nodo: tabla L.NODE_TIER / coste fijo del Tronco x L.COST_MUL (partes y Brasas; PF y Esencias raras no se escalan)
  T.cost = function (n) {
    var M = L.COST_MUL.node, parts = {}, k;
    if (n.cost) {
      for (k in n.cost.parts) parts[k] = k === 'rare' ? n.cost.parts[k] : Math.ceil(n.cost.parts[k] * M.parts);
      return { pf: n.cost.pf, parts: parts, brasas: Math.round(n.cost.brasas * M.brasas) };
    }
    var t = L.NODE_TIER[n.tier || 'T1'], main = L.MAIN[n.tag], sec = L.SEC[n.tag];
    parts[main] = Math.ceil(t.main * M.parts * (L.TREE_PART_MUL[n.tag] || 1)); if (sec !== main) parts[sec] = Math.ceil(t.sec * M.parts);
    if (t.rare) parts.rare = t.rare;
    return { pf: t.pf, parts: parts, brasas: Math.round(t.brasas * M.brasas) };
  };
  function nodeOK(id, set) { var n = BY[id]; return (n && n.type === 'root') || (set ? !!set[id] : !!SV().nodes[id]); }
  function reqOK(n, set) {
    if (!n.req) return true;
    var r = n.req, i;
    if (r.all) { for (i = 0; i < r.all.length; i++) if (!nodeOK(r.all[i], set)) return false; return true; }
    for (i = 0; i < r.any.length; i++) if (nodeOK(r.any[i], set)) return true;
    return false;
  }
  function tierOK(n, set) {
    if (n.tier === 'T2') return nodeOK('R2', set);
    if (n.tier === 'T3' || n.tier === 'T4') return nodeOK('R3', set);
    return true;
  }
  T.reason = function (n) {
    if (n.xor && T.owned(n.xor)) return 'Excluido por ' + BY[n.xor].name + '.';
    if (n.req && !reqOK(n)) {
      var names = (n.req.all || n.req.any).map(function (i) { return BY[i].name; });
      return 'Requiere ' + names.join(n.req.all ? ' y ' : ' o ') + '.';
    }
    if (!tierOK(n)) return 'Requiere ' + (n.tier === 'T2' ? 'Rango de forja II (Tronco)' : 'Rango de forja III (Tronco)') + '.';
    return '';
  };
  // 'owned' | 'excluded' | 'locked' | 'avail'
  T.status = function (n) {
    if (T.owned(n.id)) return 'owned';
    if (n.xor && T.owned(n.xor)) return 'excluded';
    if (!reqOK(n) || !tierOK(n)) return 'locked';
    return 'avail';
  };
  // ¿Se puede pagar? Devuelve '' si sí, o el texto de lo que falta
  T.afford = function (n) {
    var c = T.cost(n), S = SV(), k;
    if (c.pf > T.pfFree()) return 'Faltan Puntos de Forja.';
    for (k in c.parts) if ((S.parts[k] || 0) < c.parts[k]) return 'Faltan partes.';
    if (S.brasas < c.brasas) return 'Faltan Brasas.';
    return '';
  };
  T.availableCount = function () {
    var n = 0; NODES.forEach(function (x) { if (x.type !== 'root' && T.status(x) === 'avail' && !T.afford(x)) n++; });
    return n;
  };

  T.buy = function (id, choice) {
    var n = BY[id], S = SV(); if (!n || n.type === 'root') return { ok: false, msg: '' };
    var st = T.status(n);
    if (st !== 'avail') return { ok: false, msg: T.reason(n) || 'Ya comprado.' };
    if (n.type === 'M' && !n.ch[choice]) return { ok: false, msg: 'Elige A o B.' };
    var why = T.afford(n); if (why) return { ok: false, msg: why };
    var c = T.cost(n), k;
    for (k in c.parts) S.parts[k] -= c.parts[k];
    S.brasas -= c.brasas;
    var o = { c: n.type === 'M' ? choice : '1' };
    if (n.card) {
      if (n.type === 'C') S.cards[n.card] = Math.max(1, S.cards[n.card] || 0);
      else if ((S.cards[n.card] || 1) < L.MAXRANK) { S.cards[n.card] = (S.cards[n.card] || 1) + 1; o.r = 1; }
    }
    S.nodes[id] = o;
    var msg = n.type === 'M' ? n.name + ': ' + n.ch[choice].name : n.name;
    if (!S.ever[id]) {   // hito "Maestría de oficio": cada 4 nodos distintos forjados, +1 PF
      S.ever[id] = 1;
      var m = Math.floor(Object.keys(S.ever).length / L.PF_SOURCES.milestoneEvery);
      if (m > S.mile) { S.mile = m; if (T.addPF(1)) msg += '  -  Maestría de oficio: +1 PF'; }
    }
    T.sync(); G.Save.save();
    return { ok: true, msg: n.type === 'C' ? '¡Forjada: ' + msg + '!' : '¡Forjado: ' + msg + '!', card: n.card };
  };

  // Conjunto de nodos que caen si se quita `id` (él y sus dependientes). Los heredados (free) nunca caen.
  function removalSet(ids) {
    var set = {}, N = SV().nodes, id, ch = true;
    for (id in N) set[id] = true;
    ids.forEach(function (i) { delete set[i]; });
    while (ch) {
      ch = false;
      for (id in set) if (!N[id].free && (!reqOK(BY[id], set) || !tierOK(BY[id], set))) { delete set[id]; ch = true; }
    }
    var out = []; for (id in N) if (!set[id]) out.push(id);
    return out;
  }
  function refundInfo(ids) {
    var pf = 0, parts = {};
    ids.forEach(function (id) {
      var c = T.cost(BY[id]), k; pf += c.pf;
      for (k in c.parts) parts[k] = (parts[k] || 0) + Math.floor(c.parts[k] * L.RESPEC.refund);
    });
    return { pf: pf, parts: parts };
  }
  // Coste de quitar un nodo (y dependientes): 40 Brasas por PF devuelto; el primer reespecializado es gratis
  T.undoPlan = function (id) {
    var N = SV().nodes; if (!N[id] || N[id].free) return null;
    var ids = removalSet([id]), r = refundInfo(ids);
    return { ids: ids, pf: r.pf, parts: r.parts, brasas: SV().respecFree ? 0 : L.RESPEC.brasasPerPF * r.pf };
  };
  T.treePlan = function (tree) {
    var N = SV().nodes, base = Object.keys(N).filter(function (id) { return !N[id].free && BY[id].tree === tree; });
    if (!base.length) return null;
    var ids = removalSet(base), r = refundInfo(ids);
    return { ids: ids, pf: r.pf, parts: r.parts, brasas: SV().respecFree ? 0 : L.RESPEC.tree };
  };
  T.applyPlan = function (plan) {
    var S = SV();
    if (S.brasas < plan.brasas) return { ok: false, msg: 'Faltan Brasas para reespecializar (' + plan.brasas + ').' };
    S.brasas -= plan.brasas; S.respecFree = 0;
    plan.ids.forEach(function (id) {
      var n = BY[id], o = S.nodes[id];
      if (n.card) {
        if (n.type === 'C') { S.cards[n.card] = 0; S.anchors = S.anchors.filter(function (a) { return a !== n.card; }); }
        else if (o.r) S.cards[n.card] = Math.max(1, (S.cards[n.card] || 1) - 1);
      }
      delete S.nodes[id];
    });
    for (var k in plan.parts) G.Save.add(k, plan.parts[k]);
    T.sync(); G.Save.save();
    return { ok: true, msg: 'Reespecializado: +' + plan.pf + ' PF y el 50 % de las partes.' };
  };

  // Recalcula efectos y sincroniza con el guardado (nodos heredados de v1, ranuras de ancla, anclas válidas)
  T.sync = function () {
    var S = SV(), fx = {};
    NODES.forEach(function (n) {   // migración: una carta ya desbloqueada marca su nodo de carta como heredado (sin PF)
      if (n.type === 'C' && n.card && (S.cards[n.card] || 0) > 0 && !S.nodes[n.id]) S.nodes[n.id] = { c: '1', free: 1 };
    });
    for (var id in S.nodes) {
      var n = BY[id], o = S.nodes[id]; if (!n) { delete S.nodes[id]; continue; }
      if (n.fx) fx[n.fx] = true;
      if (n.type === 'M' && n.ch[o.c]) fx[n.ch[o.c].fx] = true;
    }
    T.fx = fx;
    G.B.anchorSlots = fx.anchor3 ? 3 : 2;
    S.anchors = S.anchors.filter(function (id2, i, a) { return G.Loot.unlocked(id2) && a.indexOf(id2) === i; }).slice(-G.B.anchorSlots);
  };
  T.startAsh = function () { return (T.fx.ash ? 20 : 0) + (G.runBuff && G.runBuff.tonic ? 40 : 0); };
  T.cdMul = function (id) {
    return (id === 'spark' && T.fx.rafaga ? 0.85 : 1) * (id === 'zap' && T.fx.chispaViva ? 0.85 : 1) * (id === 'axe' && T.fx.hachaVeloz ? 0.8 : 1);
  };
  // Nodos comprables ahora en una pestaña (para el aviso de las pestañas y el aviso de Grum)
  T.availableIn = function (tab) { var n = 0; NODES.forEach(function (x) { if (x.tree === tab && x.type !== 'root' && T.status(x) === 'avail' && !T.afford(x)) n++; }); return n; };
  // Puntos de Forja gastados en un árbol
  T.pfIn = function (tab) { var u = 0, N = SV().nodes; for (var id in N) if (!N[id].free && BY[id] && BY[id].tree === tab) u += T.cost(BY[id]).pf; return u; };
  // ¿Está completo el árbol? (todos los nodos comprables, salvo la rama excluyente no elegida)
  T.complete = function (tab) {
    return NODES.every(function (n) { return n.tree !== tab || n.type === 'root' || T.owned(n.id) || (n.xor && T.owned(n.xor)); });
  };

  // ------------------------------------------------------------- UI
  var ui = { tab: 'fire', sel: 'F1', msg: '', msgT: 0, confirm: '', confirmT: 0, flash: null, flashT: 0, fade: 0 };
  var R_CLOSE = { x: 896, y: 2, w: 60, h: 50 };
  var R_TAB = function (i) { return { x: 8 + i * 134, y: 44, w: 128, h: 48 }; };
  var R_RESET = { x: 590, y: 4, w: 156, h: 38 };
  var DET = { x: 644, y: 100, w: 306, h: 432 };
  var R_BUY = { x: 654, y: 470, w: 286, h: 52 };
  var R_CH = [{ x: 654, y: 470, w: 140, h: 52 }, { x: 800, y: 470, w: 140, h: 52 }];
  var R_UNDO = { x: 754, y: 416, w: 186, h: 48 };
  var NX = 72, NY = 138, SX = 100, SY = 65, NR = 28;
  function pos(n) { return { x: NX + n.col * SX, y: NY + n.row * SY }; }
  function say(t) { ui.msg = t; ui.msgT = 3200; }
  function tabNodes() { return NODES.filter(function (n) { return n.tree === ui.tab; }); }

  T.open = function (tab) { ui.tab = tab || ui.tab; ui.msg = ''; ui.msgT = 0; ui.confirm = ''; fixSel(); };
  function fixSel() {
    if (!BY[ui.sel] || BY[ui.sel].tree !== ui.tab) { var tn = tabNodes(); ui.sel = (tn.filter(function (n) { return n.type !== 'root'; })[0] || tn[0]).id; }
  }
  function setTab(t) { if (t === ui.tab) return; ui.tab = t; ui.confirm = ''; fixSel(); G.sfx('flip', { vol: 0.4 }); }
  T.setTab = setTab; T.selectNode = function (id) { if (BY[id]) { ui.tab = BY[id].tree; ui.sel = id; } };

  function moveSel(dx, dy) {
    var cur = BY[ui.sel], p = pos(cur), best = null, bd = 1e9;
    tabNodes().forEach(function (n) {
      if (n === cur) return;
      var q = pos(n), vx = q.x - p.x, vy = q.y - p.y;
      if (dx && Math.sign(vx) !== dx) return;
      if (dy && Math.sign(vy) !== dy) return;
      var d = dx ? Math.abs(vx) + Math.abs(vy) * 2.5 : Math.abs(vy) + Math.abs(vx) * 2.5;
      if (d < bd) { bd = d; best = n; }
    });
    if (best) { ui.sel = best.id; G.sfx('flip', { vol: 0.3 }); }
  }

  function doBuy(choice) {
    var n = BY[ui.sel], r = T.buy(n.id, choice);
    if (!r.ok) { say(r.msg); G.sfx('discard', { vol: 0.5 }); return; }
    say(r.msg); ui.flash = n.id; ui.flashT = 800;
    try { G.Snd.play('fuse'); } catch (e) { /* audio */ }
    if (G.Aldea && G.Aldea.onForged) G.Aldea.onForged(n);
  }
  function doUndo(plan) {
    if (!plan) return;
    var r = T.applyPlan(plan); say(r.msg);
    if (r.ok) { try { G.Snd.play('discard'); } catch (e) { /* audio */ } }
    ui.confirm = '';
  }
  // Devuelve true si hay que cerrar el panel
  T.update = function (dt) {
    var m = inp.mouse, click = inp.hit('Mouse0'), i;
    if (ui.msgT > 0) ui.msgT -= dt; if (ui.flashT > 0) ui.flashT -= dt; if (ui.confirmT > 0) ui.confirmT -= dt; else ui.confirm = '';
    if (inp.hit('Escape') || (click && U.inR(R_CLOSE, m))) return true;
    var NT = T.TABS.length;
    for (i = 0; i < NT; i++) if (inp.hit('Digit' + (i + 1)) || (click && U.inR(R_TAB(i), m))) { setTab(T.TABS[i].id); }
    var ti = T.TABS.map(function (t) { return t.id; }).indexOf(ui.tab);
    if (inp.hit('KeyQ') || inp.swipe === 1) setTab(T.TABS[(ti + NT - 1) % NT].id);
    if (inp.hit('KeyE') || inp.swipe === -1) setTab(T.TABS[(ti + 1) % NT].id);

    var n = BY[ui.sel];
    if (inp.hit('ArrowRight', 'KeyD')) moveSel(1, 0);
    if (inp.hit('ArrowLeft', 'KeyA')) moveSel(-1, 0);
    if (inp.hit('ArrowDown', 'KeyS')) moveSel(0, 1);
    if (inp.hit('ArrowUp', 'KeyW')) moveSel(0, -1);
    if (n.type === 'M') { if (inp.hit('KeyF')) doBuy('A'); if (inp.hit('KeyG')) doBuy('B'); }
    else if (inp.hit('KeyF')) doBuy('1');
    var plan = T.undoPlan(ui.sel), tplan = T.treePlan(ui.tab);
    if (inp.hit('KeyU')) tryConfirm('u' + ui.sel, plan);
    if (inp.hit('KeyR')) tryConfirm('t' + ui.tab, tplan);
    if (click) {
      if (U.inR(R_RESET, m)) { tryConfirm('t' + ui.tab, tplan); return false; }
      var tn = tabNodes();
      for (i = 0; i < tn.length; i++) { var p = pos(tn[i]); if (Math.hypot(m.x - p.x, m.y - p.y) <= NR + 4) { ui.sel = tn[i].id; G.sfx('flip', { vol: 0.4 }); return false; } }
      if (n.type === 'M') { if (U.inR(R_CH[0], m)) doBuy('A'); else if (U.inR(R_CH[1], m)) doBuy('B'); }
      else if (U.inR(R_BUY, m)) doBuy('1');
      if (U.inR(R_UNDO, m) && T.owned(n.id)) tryConfirm('u' + ui.sel, plan);
    }
    return false;
  };
  function tryConfirm(key, plan) {
    if (!plan) { say(key.charAt(0) === 'u' ? 'Este nodo no se puede deshacer.' : 'Nada que reespecializar en este árbol.'); return; }
    if (ui.confirm === key) { doUndo(plan); return; }
    ui.confirm = key; ui.confirmT = 3500;
    say('Pulsa otra vez para confirmar: +' + plan.pf + ' PF, ' + (plan.brasas ? plan.brasas + ' Brasas' : 'GRATIS (primera vez)') + ', 50 % de partes.');
  }

  // ------------------------------------------------------------- Dibujo
  function pfIcon(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.fillStyle = col || '#ffd24a'; c.strokeStyle = '#0c0814'; c.lineWidth = Math.max(1.5, s * 0.14); c.lineJoin = 'round';
    c.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(Math.cos(a) * s, Math.sin(a) * s); } c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#7a4a00'; c.fillRect(-s * 0.2, -s * 0.5, s * 0.4, s * 0.8); c.fillRect(-s * 0.5, -s * 0.5, s, s * 0.22); c.restore();
  }
  T.pfIcon = pfIcon;
  function costRow(c, cost, x, y) {
    var S = SV(), items = [], k, i;
    if (cost.pf) items.push({ k: 'pf', have: T.pfFree(), need: cost.pf });
    for (k in cost.parts) items.push({ k: k, have: S.parts[k] || 0, need: cost.parts[k] });
    if (cost.brasas) items.push({ k: 'brasa', have: S.brasas, need: cost.brasas });
    if (!items.length) { G.txt(c, 'Sin coste', x, y, 12, '#9a8fb0', 'left'); return true; }
    var ok = true;
    for (i = 0; i < items.length; i++) {
      var it = items[i], cx = x + (i % 4) * 70, cy = y + Math.floor(i / 4) * 26, good = it.have >= it.need;
      if (!good) ok = false;
      if (it.k === 'pf') pfIcon(c, cx + 10, cy, 9); else U.part(c, it.k, cx + 10, cy, 10);
      G.txt(c, (it.have >= 1000 ? Math.floor(it.have / 1000) + 'k' : it.have) + '/' + it.need, cx + 22, cy + 1, 11, good ? '#9dffb4' : '#ff8a8a', 'left');
    }
    return ok;
  }
  T.costRow = costRow;

  var TYPE_ICON = { P: 'passive', X: 'branch', S: 'set', Ma: 'mastery', R: 'rank' };
  function drawNodeShape(c, n, st, p, selected, t) {
    var tag = G.TAGS[n.tag] || G.TAGS.neutral, col = tag.color, owned = st === 'owned', pulse = 0.5 + 0.5 * Math.sin(t * 5);
    var dim = st === 'locked' || st === 'excluded';
    if (window.Assets && Assets.drawTreeNode) {   // marco con el arte del árbol (assets_tree.js): el icono lo pongo yo (glifo de la carta o icono de tipo)
      Assets.drawTreeNode(c, p.x, p.y, { type: n.type, tag: n.tag, state: st, choice: T.choice(n.id), sel: selected, t: Date.now(), r: NR });
      var ik = owned ? '#1a1024' : col;
      if (TYPE_ICON[n.type] && n.icon !== 'II' && n.icon !== 'III' && n.icon !== '3' && Assets.drawTreeIcon) Assets.drawTreeIcon(c, TYPE_ICON[n.type], p.x, p.y, 14, { color: ik, dim: dim });
      else { c.save(); if (dim) c.globalAlpha = 0.4;
        if (n.icon === 'II' || n.icon === 'III' || n.icon === '3') G.txt(c, n.icon, p.x, p.y + 1, n.icon.length > 1 ? 16 : 22, owned ? '#1a1024' : '#fff', 'center');
        else G.Cards.glyph(c, n.icon, p.x, p.y + (n.type === 'M' ? 2 : 0), n.type === 'M' ? 11 : 15, ik);
        c.restore(); }
      if (!owned) { var cc0 = T.cost(n); if (cc0.pf) { pfIcon(c, p.x + 24, p.y - 22, 10, dim ? '#6a5a3a' : '#ffd24a'); G.txt(c, String(cc0.pf), p.x + 24, p.y - 21, 10, '#fff', 'center'); } }
      return;   // la etiqueta con el nombre se dibuja después de todos los nodos (T.draw) para que ningún marco la tape
    }
    c.save(); c.translate(p.x, p.y);
    if (st === 'avail') { c.shadowColor = col; c.shadowBlur = 10 + 8 * pulse; }
    c.fillStyle = owned ? col : (dim ? '#1c1626' : '#2a1d3a');
    c.beginPath(); c.arc(0, 0, NR, 0, 6.283); c.fill(); c.shadowBlur = 0;
    if (n.type === 'M') {   // círculo partido en dos mitades A / B
      var chosen = T.choice(n.id);
      c.save(); c.beginPath(); c.arc(0, 0, NR - 3, 0, 6.283); c.clip();
      c.fillStyle = chosen === 'A' ? '#fff3c0' : (owned ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.08)'); c.fillRect(-NR, -NR, NR, NR * 2);
      c.fillStyle = chosen === 'B' ? '#fff3c0' : (owned ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.14)'); c.fillRect(0, -NR, NR, NR * 2);
      c.restore();
      c.strokeStyle = '#0c0814'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -NR + 2); c.lineTo(0, NR - 2); c.stroke();
    }
    c.lineWidth = selected ? 5 : 3.5;
    c.strokeStyle = owned ? '#fff3c0' : (st === 'avail' ? col : (dim ? '#4a4058' : col));
    if (st === 'avail') c.globalAlpha = 0.65 + 0.35 * pulse;
    c.beginPath(); c.arc(0, 0, NR, 0, 6.283); c.stroke(); c.globalAlpha = 1;
    if (n.type === 'X') { c.strokeStyle = dim ? '#4a4058' : col; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(0, 0, NR + 5, 0, 6.283); c.stroke(); c.setLineDash([]); }
    if (n.type === 'Ma' || n.type === 'S') { c.strokeStyle = dim ? '#4a4058' : '#ffd24a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, NR + 4, 0, 6.283); c.stroke(); }
    c.restore();
    c.save(); if (dim) c.globalAlpha = 0.4;
    if (n.icon === 'II' || n.icon === 'III' || n.icon === '3') G.txt(c, n.icon, p.x, p.y + 1, n.icon.length > 1 ? 16 : 22, owned ? '#1a1024' : '#fff', 'center');
    else G.Cards.glyph(c, n.icon, p.x, p.y, n.type === 'M' ? 12 : 15, owned ? '#1a1024' : col);
    c.restore();
    if (st === 'excluded') { c.strokeStyle = '#ff6a6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x - 20, p.y - 20); c.lineTo(p.x + 20, p.y + 20); c.stroke(); }
    // coste en PF (chapa dorada) y estrella de nivel
    if (!owned) { var cc = T.cost(n); if (cc.pf) { pfIcon(c, p.x + 24, p.y - 22, 10, dim ? '#6a5a3a' : '#ffd24a'); G.txt(c, String(cc.pf), p.x + 24, p.y - 21, 10, '#fff', 'center'); } }
    G.txt(c, n.name.length > 15 ? n.name.slice(0, 14) + '.' : n.name, p.x, p.y + NR + 7, 10, dim ? '#6f6480' : '#d8cfe8', 'center');
  }

  T.draw = function (c) {
    var S = SV(), m = inp.mouse, t = Date.now() / 1000, i;
    c.fillStyle = '#08040e'; c.fillRect(0, 0, G.W, G.H);
    // cabecera
    G.txt(c, 'FORJA DE GRUM', 14, 22, 24, '#ffd27a', 'left');
    pfIcon(c, 262, 22, 11); G.txt(c, 'PF libres ' + T.pfFree(), 280, 22, 16, T.pfFree() > 0 ? '#ffd24a' : '#9a8fb0', 'left');
    G.txt(c, T.pfEarned() + '/' + L.PF_CAP + ' ganados', 280, 38, 10, '#9a8fb0', 'left');
    U.part(c, 'brasa', 430, 22, 10); G.txt(c, 'Brasas ' + S.brasas, 446, 22, 16, '#ff9a3c', 'left');
    var pk = ['thread', 'feather', 'spine', 'fang', 'plate', 'wick', 'frost', 'static', 'rare'];
    // fila de partes (compacta)
    pk.forEach(function (k, j) { var x = 14 + j * 52; U.part(c, k, x + 7, 100, 7); G.txt(c, String(S.parts[k] || 0), x + 18, 101, 11, (S.parts[k] || 0) ? '#fff' : '#6a5f78', 'left'); });
    U.button(c, R_CLOSE, 'X', { size: 20, color: '#7a2a3a', hot: '#c03a4a', border: '#ff8a8a' });
    var ART = !!(window.Assets && Assets.drawTreeNode), now = Date.now();
    for (i = 0; i < T.TABS.length; i++) {
      var tb = T.TABS[i], r = R_TAB(i), on = tb.id === ui.tab, av = T.availableIn(tb.id), done = tb.id !== 'trunk' && T.complete(tb.id), pu = tb.id === 'trunk' ? 0 : T.pfIn(tb.id);
      c.fillStyle = on ? '#2a1d3a' : '#150f20'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = on ? tb.color : '#3a2f48'; c.lineWidth = on ? 4 : 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      if (ART && Assets.drawTreeTab) Assets.drawTreeTab(c, r.x, r.y, tb.id === 'trunk' ? 'neutral' : tb.id, { sel: on, dim: !on, t: now, badge: av || 0 });
      else { if (av > 0) { c.fillStyle = '#7dff9a'; c.beginPath(); c.arc(r.x + r.w - 10, r.y + 10, 8, 0, 6.283); c.fill(); G.txt(c, String(av), r.x + r.w - 10, r.y + 11, 10, '#102014', 'center', 'rgba(0,0,0,0)'); } }
      var tx = ART ? r.x + 54 : r.x + r.w / 2 + 4, al = ART ? 'left' : 'center';
      G.txt(c, tb.name, tx, r.y + 16, 13, on ? tb.color : '#8a7f96', al);
      G.txt(c, done ? 'COMPLETO' : tb.id === 'trunk' ? 'Rangos' : pu + ' PF', ART ? tx : r.x + r.w / 2, r.y + 32, 10, done ? '#ffd24a' : '#7a6f88', al);
      G.txt(c, String(i + 1), r.x + r.w - 9, r.y + r.h - 9, 9, '#5a4f68', 'center');
    }
    // mensaje
    if (ui.msgT > 0 && ui.msg) G.txt(c, ui.msg, 320, 508, 12, '#ffe9a0', 'center');
    var nodes = tabNodes(), n = BY[ui.sel];
    // reespecializar árbol
    var tp = T.treePlan(ui.tab);
    U.button(c, R_RESET, ui.confirm === 't' + ui.tab ? 'SEGURO? OTRA VEZ' : 'REESPECIALIZAR', { size: 12, off: !tp, color: '#3a2f48', hot: '#6a3a8a', border: '#8a6a8a',
      sub: tp ? (S.respecFree ? 'primera vez GRATIS' : L.RESPEC.tree + ' Brasas') : 'nada que deshacer' });
    // aristas (con Assets.drawTreeLink si existe el arte del árbol)
    nodes.forEach(function (nd) {
      if (!nd.req) return;
      var tcol = (G.TAGS[nd.tag] || G.TAGS.neutral).color;
      (nd.req.all || nd.req.any).forEach(function (pid) {
        var a = pos(BY[pid]), b = pos(nd), on = T.owned(pid) && T.owned(nd.id), ok = T.owned(pid), stt = T.status(nd);
        if (ART && Assets.drawTreeLink) { Assets.drawTreeLink(c, a.x, a.y, b.x, b.y, { state: on ? 'owned' : (ok && stt === 'avail' ? 'avail' : 'locked'), color: tcol, kind: nd.req.any ? 'or' : 'and', inset: NR, t: now }); return; }
        c.strokeStyle = on ? '#ffe9a0' : (ok ? '#7a6aa0' : '#3a2f48'); c.lineWidth = on ? 4 : 3;
        if (nd.req.any) c.setLineDash([6, 5]);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]);
      });
      if (nd.xor && nd.id < nd.xor) {   // "V" punteada entre hermanos excluyentes
        var q1 = pos(nd), q2 = pos(BY[nd.xor]);
        if (ART && Assets.drawTreeLink) Assets.drawTreeLink(c, q1.x, q1.y, q2.x, q2.y, { state: T.owned(nd.id) || T.owned(nd.xor) ? 'owned' : 'avail', kind: 'xor', inset: NR + 6, t: now });
        else { c.strokeStyle = '#ff6a6a'; c.lineWidth = 2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(q1.x + NR, q1.y); c.lineTo(q2.x - NR, q2.y); c.stroke(); c.setLineDash([]); }
        G.txt(c, 'O', (q1.x + q2.x) / 2, q1.y, 12, '#ff8a8a', 'center');
      }
    });
    if (ui.tab === 'trunk') G.txt(c, 'CARTAS NEUTRAS', NX + 2 * SX, NY + 3 * SY + 10, 12, '#9a8fb0', 'center');
    nodes.forEach(function (nd) { drawNodeShape(c, nd, T.status(nd), pos(nd), nd.id === ui.sel, t); });
    if (ART) nodes.forEach(function (nd) { var q = pos(nd), dm = T.status(nd) === 'locked' || T.status(nd) === 'excluded'; G.txt(c, nd.name.length > 17 ? nd.name.slice(0, 16) + '.' : nd.name, q.x, q.y + NR + 9, 10, dm ? '#7a6f8a' : '#e8dff8', 'center'); });
    if (ui.flashT > 0 && BY[ui.flash]) {
      var fp = pos(BY[ui.flash]), u = 1 - ui.flashT / 800;
      if (ART && Assets.drawTreeBurst) Assets.drawTreeBurst(c, fp.x, fp.y, u, (G.TAGS[BY[ui.flash].tag] || G.TAGS.neutral).color);
      else { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,224,120,' + (1 - u) + ')'; c.lineWidth = 5; c.beginPath(); c.arc(fp.x, fp.y, NR + u * 40, 0, 6.283); c.stroke(); c.restore(); }
    }
    // selección
    if (!ART) { var sp = pos(n); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.setLineDash([4, 4]); c.lineDashOffset = -t * 20; c.beginPath(); c.arc(sp.x, sp.y, NR + 8, 0, 6.283); c.stroke(); c.setLineDash([]); }
    drawDetail(c, n, m);
    G.txt(c, G.Sys.isTouch() ? 'Toca un nodo para verlo  -  desliza para cambiar de árbol  -  X para salir' : 'Flechas: mover  F/G: forjar  U: deshacer  R: respec.  Q/E o 1-7: pestaña  Esc: salir', 14, 526, 10, '#6f6480', 'left');
  };

  function drawDetail(c, n, m) {
    var S = SV(), st = T.status(n), tag = G.TAGS[n.tag] || G.TAGS.neutral, i, y;
    U.panel(c, DET.x, DET.y, DET.w, DET.h, { border: tag.color });
    G.txt(c, n.name, DET.x + 14, DET.y + 22, 18, '#ffd27a', 'left');
    G.txt(c, (TYPE_NAME[n.type] || '') + (n.tier ? '  -  ' + n.tier : '') + '  -  ' + (n.tree === 'trunk' ? 'TRONCO' : tag.name), DET.x + 14, DET.y + 44, 11, tag.color, 'left');
    var stTxt = st === 'owned' ? (n.type === 'root' ? 'INICIAL' : 'COMPRADO' + (n.type === 'M' ? ': ' + n.ch[T.choice(n.id)].name : '') + (S.nodes[n.id] && S.nodes[n.id].free ? ' (heredado)' : '')) :
      st === 'avail' ? 'DISPONIBLE' : T.reason(n);
    G.txt(c, stTxt, DET.x + 14, DET.y + 64, 12, st === 'owned' ? '#9dffb4' : st === 'avail' ? '#ffe9a0' : '#ff8a8a', 'left');
    var lines = U.wrap(c, n.desc, DET.w - 28, 12); y = DET.y + 88;
    for (i = 0; i < lines.length && i < 6; i++) G.txt(c, lines[i], DET.x + 14, y + i * 16, 12, '#d8cfe8', 'left');
    y += Math.min(lines.length, 6) * 16 + 8;
    if (n.type === 'M') {
      ['A', 'B'].forEach(function (k, j) {
        var ch = n.ch[k], picked = T.choice(n.id) === k;
        G.txt(c, k + ' - ' + ch.name + (picked ? '  (elegida)' : ''), DET.x + 14, y, 12, picked ? '#9dffb4' : '#ffe9a0', 'left');
        var ls = U.wrap(c, ch.desc, DET.w - 28, 11);
        for (var q = 0; q < ls.length && q < 3; q++) G.txt(c, ls[q], DET.x + 14, y + 16 + q * 14, 11, '#bdb2d0', 'left');
        y += 20 + Math.min(ls.length, 3) * 14 + 6;
      });
    }
    if (n.type === 'root') return;
    var cost = T.cost(n);
    if (st !== 'owned') {
      G.txt(c, 'COSTE', DET.x + 14, 392, 11, '#9a8fb0', 'left');
      costRow(c, cost, DET.x + 12, 410);
    } else {
      var plan = T.undoPlan(n.id);
      G.txt(c, plan ? 'Deshacer: +' + plan.pf + ' PF, 50 % de partes' : 'No se puede deshacer', DET.x + 14, 392, 11, '#9a8fb0', 'left');
      G.txt(c, plan ? (plan.brasas ? plan.brasas + ' Brasas' : 'GRATIS (primera vez)') + (plan.ids.length > 1 ? '  (+' + (plan.ids.length - 1) + ' dependientes)' : '') : '', DET.x + 14, 410, 11, '#ff9a3c', 'left');
      U.button(c, R_UNDO, ui.confirm === 'u' + n.id ? 'SEGURO? OTRA VEZ' : 'DESHACER [U]', { size: 13, off: !plan, color: '#3a2f48', hot: '#6a3a8a', border: '#8a6a8a' });
    }
    var why = st === 'avail' ? T.afford(n) : '';
    var can = st === 'avail' && !why;
    if (n.type === 'M') {
      ['A', 'B'].forEach(function (k, j) {
        U.button(c, R_CH[j], 'ELEGIR ' + k, { size: 15, off: st !== 'avail' || !can, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: n.ch[k].name + (j ? ' [G]' : ' [F]') });
      });
    } else if (st === 'owned') {
      /* nada */
    } else {
      U.button(c, R_BUY, st === 'avail' ? (n.type === 'C' ? 'FORJAR' : 'COMPRAR') : 'BLOQUEADO', { size: 18, off: !can, color: '#2a8a4a', hot: '#3aba66', border: '#9dffb4', sub: why || (st === 'avail' ? '[F]' : '') });
    }
  }
})();
