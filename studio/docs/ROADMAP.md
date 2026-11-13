# Roadmap del estudio

## Plan vigente (2026-11): Swarm Hand divertido, adictivo y monetizable
Detalle de cada tarea, responsable y modelo en [`PLAN-MAESTRO.md`](PLAN-MAESTRO.md). Lo que sigue más abajo es histórico.
- [x] Revisión integral del proyecto y plan maestro
- [x] Agentes nuevos: balance-designer, performance-engineer, ux-designer, art-director, monetization-analyst, release-manager, marketing-manager
- [ ] **F0 Limpieza y deudas** (13 tareas): reparar las pruebas (ruta del navegador), CI antes de desplegar, retirar la inmortalidad por defecto, simulación reproducible, pistas de teclado en táctil, Marlo, créditos, documentación, empaquetado, registro de errores, sesión en móvil real, Ember Flock
- [ ] **F1 Retención y primera sesión** (11 tareas): analítica mínima, combate en menos de 60 s, ritmo del primer minuto, pantalla de fin, reto diario, objetivos diarios, economía por pasos, legibilidad móvil, respuesta háptica, modo corto, guardado a prueba de pérdidas
- [ ] **F2 Balance final** (8 tareas): banco de balance, daño por zona y armadura, Peligro IV-V, Corrosión, simulador de progresión (meta ~16 h), playtest humano, rendimiento en combate denso, presupuesto en CI
- [ ] **F3 Monetización y publicación** (10 tareas): decisión de modelo y privacidad, capa de plataforma, recompensas opcionales, inglés, builds por destino, itch.io, portales web, marca, evaluación de Play Store, compra de apoyo
- [ ] **F4 Contenido y eventos** (6 tareas): mutadores semanales, final extendido, cosméticos, más builds, repaso de arte, música por bioma
- Primeros pasos: T-F0-01, T-F0-12, T-F0-02 + T-F0-03, T-F0-05, T-F1-01 + T-F1-02
- Decisiones del dueño (2026-11-13): las 17 preguntas están respondidas y registradas en la sección "Decisiones del dueño" del plan. Pendiente de aclarar: las cifras de "reto" por nivel de Peligro (antes de F2)

## Histórico
> Todo lo que sigue es histórico. `games/survival-lamb` (Ember Flock) y `games/card-swarm-clasico` se retiraron de `main` el 2026-11-13; siguen en el historial de git (el clásico, también en la rama `archive/card-swarm-clasico-v5.6`). Las rutas citadas abajo ya no existen en `main`.

- [x] Estructura del estudio y agentes
- [x] Primer juego: Ember Flock (MVP jugable en games/survival-lamb)
- [ ] QA y balance del MVP
- [ ] Biblioteca inicial de recursos CC0
- [ ] Primera herramienta interna (según necesidad)

- [x] Estudio de juegos virales (studio/research/)
- [x] Prototipo Swarm Hand (games/card-swarm-clasico, hoy archivado)
- [ ] Playtest humano y balance de Swarm Hand
- [x] Crafteo Fase 1 (Base, forja, botin, anclas) en games/card-swarm-clasico
- [ ] Playtest humano de la Fase 1; decidir Fase 2 (sets, encargos, desmontar) y version movil
- [x] Fase 2a: aldea Rescoldo, arbol de Fuego, economia v2
- [ ] Jefes J1 (Pastor rediseñado): arte en curso, logica pendiente

## Swarm Hand: Fusión reemplaza al clásico (2026-11)
- [x] El dueño aprobó el prototipo Fusión y sustituye al clásico: `games/card-swarm/` = Fusión; el clásico v5.6 archivado en `games/card-swarm-clasico/` y en la rama `archive/card-swarm-clasico-v5.6`. Las rutas de abajo (hitos P0-P8) se refieren al clásico.
- [ ] Playtest humano de la Fusión y balance (ver README de Swarm Hand); PWA en teléfono real

## Cola de trabajo de Swarm Hand clásico (orden, histórico)
1. [x] Jefe Pastor J1 (arte + lógica)
2. [x] Ajustes de balance del playtest: menos XP por gema / curva más lenta; minijefes con más habilidades y presión; carta de curación (20% de prob. por golpe); velocidad de enemigos creciente con el tiempo (con tope); bajar de nuevo drops y costes (meta: 1 craft o 1 mejora de talento por expedición de 7 min)
3. [x] Vista inclinada tipo Hades (Nivel 1) detrás de ?view=iso: suelo aplastado ~0.6, telegrafías elípticas, sprites en pie ordenados por y, sombras; lógica sin cambios
4. [x] Jefes J2, J3 (Peligro I-V, cacería, guardianes) + Fase 2b (Karceron, Letea), J3 (Peligro, cacería) y Fase 2b de la aldea (resto de árboles, Archivista, cocinera)
5. [x] Versión móvil (web móvil + PWA + workflow de Pages) — falta probar en teléfono real
6. [x] Familias por bioma P0-P2 (Bosque, Cripta, Asfódelo)
7. [x] P3 Tundra y P4 Yarlak
8. [x] P4.5: 2 minijefes por bioma (DESIGN-v6-minijefes.md)
9. [x] P5-P8: Panal + Reina Abeja, Cenizar, integración (Portal, Ruta, platos, Peligro de los 6 jefes) y **P8 balance, rendimiento y cierre (v5.6)** (ver DESIGN-v5-biomas.md y README de Swarm Hand)
10. [ ] Backlog post v5.6: playtest humano y reajuste de dificultad, bot que esquive la horda, cache del HUD, PWA en teléfono real, Peligro VI / jefes nuevos
