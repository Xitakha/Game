# Ember Flock (survival-lamb)

Action roguelite por oleadas, vista cenital. Eres un corderito con una llama sagrada que defiende un claro maldito.
Canvas 2D puro, sin librerías externas: sprites y audio salen de `src/assets.js`.

## Ejecutar
```
cd games/survival-lamb
python3 -m http.server 8000   # y abrir http://localhost:8000
```
(También funciona abriendo `index.html` directamente.) El audio arranca tras el primer click o tecla.

## Controles
| Acción | Tecla |
|---|---|
| Mover | WASD / flechas |
| Atacar (combo x3, mantener para encadenar) | Click izquierdo (hacia el cursor) o J (hacia la última dirección) |
| Roll con i-frames | Espacio |
| Llama Sagrada (nova de fuego) | Click derecho o K |
| Elegir carta | 1 / 2 / 3 o click |
| Pausa | P o Esc |
| Reintentar (game over) | R, Enter o botón |

## Cómo se juega
- Sobrevive a las oleadas: al limpiar una, recuperas vida (+15, +30 tras jefe) y eliges 1 de 3 mejoras (12 en total, con rarezas).
- Esquiva un golpe durante los i-frames del roll para hacer un "roll perfecto" (recupera parte del enfriamiento de la Llama).
- Enemigos: Gusano, Arquero, Jabalí (carga telegrafiada y queda aturdido), Bomba, Brujo (invoca gusanos).
- Cada 5 oleadas aparece el jefe Pastor Corrupto (cayado, salto aplastante, abanico de espinas; fase de furia bajo el 50% de vida).

## Estructura
`src/main.js` (núcleo, balance `G.B`, entrada, bucle de paso fijo, render), `player.js`, `enemies.js`, `waves.js`, `cards.js`, `hud.js`, `fx.js` (hit-stop, shake, partículas, números de daño).
