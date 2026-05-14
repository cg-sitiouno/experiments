# Bubble Math Lab — Spec de Producto y Desarrollo

## 1. Contexto

Bubble Math Lab es una app web estática, colorida e interactiva para reforzar cálculo mental en niños mediante burbujas numéricas que se pueden descomponer, arrastrar y fusionar.

La app actual ya tiene una base funcional importante:

- Pantalla de inicio.
- Modos de juego: solo sumas, solo restas, mixto y tutorial.
- Área de juego con burbujas.
- Burbujas draggables.
- Descomposición de números.
- Fusión de burbujas.
- Modal para comprobar operaciones.
- Puntaje.
- Tutorial guiado.
- Animaciones de glow, partículas, descomposición y confetti.

Este spec define una nueva expansión pedagógica: **Modo Cajita Misteriosa**, inspirado en ejercicios escolares de primer grado donde se usa un cuadrito o cajita para representar un número faltante.

Ejemplos:

```txt
□ + 4 = 8
10 - □ = 6
□ - 9 = 10
```

El objetivo no es introducir álgebra formal, sino ayudar al niño a comprender que la cajita representa un número escondido que hace verdadera la igualdad.

---

## 2. Objetivo del producto

Agregar a Bubble Math Lab un modo de juego llamado:

```txt
Cajita Misteriosa
```

Este modo debe permitir que el niño resuelva operaciones simples con un número faltante usando la misma lógica visual del juego:

- Descomponer números.
- Recomponer partes.
- Formar números convenientes.
- Arrastrar la burbuja correcta hacia una burbuja misteriosa.
- Recibir feedback visual y verbal.

La intención pedagógica es reforzar tres ideas:

1. **Buscar una parte faltante.**
2. **Encontrar cuánto se quitó.**
3. **Reconstruir el número inicial.**

---

## 3. Público objetivo

Niños de aproximadamente 6 a 8 años, especialmente estudiantes que están comenzando con ejercicios de completar números faltantes en operaciones básicas.

Evitar términos como:

```txt
incógnita
variable
despejar
ecuación algebraica
```

Preferir:

```txt
cajita
número escondido
lo que falta
lo que se fue
lo que había al principio
```

---

## 4. Stack técnico

La app debe seguir siendo estática y sin dependencias externas pesadas.

```txt
HTML
CSS
JavaScript vanilla
```

Archivos actuales esperados:

```txt
index.html
styles.css
app.js
```

Restricciones:

- No usar frameworks.
- No agregar backend.
- No agregar base de datos.
- No agregar build step.

---

## 5. Nuevo modo de juego

### 5.1 Nombre visible

```txt
Cajita Misteriosa
```

### 5.2 Valor interno sugerido

```js
playMode: "mystery"
```

### 5.3 Nueva opción en la pantalla inicial

Agregar una nueva opción de radio dentro de `fieldset.mode-options`:

```html
<label class="mode-options__choice mode-options__choice--mystery">
  <input type="radio" name="play-mode" value="mystery" />
  Cajita Misteriosa
</label>
```

Texto opcional:

```txt
Encuentra el número escondido en la operación.
```

---

## 6. Concepto de juego

En los modos actuales, el niño construye el resultado.

Ejemplo:

```txt
7 + 8 = ?
```

En el nuevo modo, el niño debe descubrir el número escondido.

Ejemplos:

```txt
? + 4 = 8
10 - ? = 6
? - 9 = 10
```

Visualmente, el signo `?` debe estar dentro de una burbuja especial: la **burbuja misteriosa**.

---

## 7. Tipos de retos

El modo `mystery` debe soportar tres tipos de retos.

### 7.1 Tipo 1: Missing Addend

Representación:

```txt
□ + a = b
```

Ejemplo:

```txt
□ + 4 = 8
```

Interpretación infantil:

```txt
¿Qué número falta para que junto con 4 llegue a 8?
```

Estrategia matemática:

```txt
b - a
```

Ejemplo:

```txt
8 - 4 = 4
```

Estado sugerido:

```js
{
  playMode: "mystery",
  mysteryType: "missing_addend",
  challengeOp: "add",
  leftNumber: null,
  rightNumber: 4,
  expectedResult: 8,
  hiddenValue: 4,
  hiddenPosition: "left"
}
```

Frase de ayuda:

```txt
Busca la parte que falta.
```

---

### 7.2 Tipo 2: Missing Subtrahend

Representación:

```txt
a - □ = b
```

Ejemplo:

```txt
10 - □ = 6
```

Interpretación infantil:

```txt
Tenía 10. Se fue algo. Quedaron 6. ¿Cuánto se fue?
```

Estrategia matemática:

```txt
a - b
```

Ejemplo:

```txt
10 - 6 = 4
```

Estado sugerido:

```js
{
  playMode: "mystery",
  mysteryType: "missing_subtrahend",
  challengeOp: "subtract",
  leftNumber: 10,
  rightNumber: null,
  expectedResult: 6,
  hiddenValue: 4,
  hiddenPosition: "right"
}
```

Frase de ayuda:

```txt
Busca lo que se fue.
```

---

### 7.3 Tipo 3: Missing Minuend

Representación:

```txt
□ - a = b
```

Ejemplo:

```txt
□ - 9 = 10
```

Interpretación infantil:

```txt
Tenía un número. Quité 9. Quedaron 10. ¿Con cuánto empecé?
```

Estrategia matemática:

```txt
b + a
```

Ejemplo:

```txt
10 + 9 = 19
```

Estado sugerido:

```js
{
  playMode: "mystery",
  mysteryType: "missing_minuend",
  challengeOp: "subtract",
  leftNumber: null,
  rightNumber: 9,
  expectedResult: 10,
  hiddenValue: 19,
  hiddenPosition: "left"
}
```

Frase de ayuda:

```txt
Reconstruye lo que había al principio.
```

---

## 8. Progresión pedagógica

No mezclar los tres tipos desde el primer reto.

### Nivel 1 — Parte faltante

Solo retos:

```txt
□ + a = b
```

Ejemplos:

```txt
□ + 3 = 8
□ + 5 = 9
□ + 2 = 10
```

Objetivo:

```txt
Entender parte + parte = total.
```

### Nivel 2 — Lo que se fue

Solo retos:

```txt
a - □ = b
```

Ejemplos:

```txt
10 - □ = 6
12 - □ = 7
15 - □ = 10
```

Objetivo:

```txt
Entender que la cajita puede representar lo que fue quitado.
```

### Nivel 3 — Número inicial

Solo retos:

```txt
□ - a = b
```

Ejemplos:

```txt
□ - 4 = 6
□ - 7 = 8
□ - 9 = 10
```

Objetivo:

```txt
Reconstruir hacia atrás.
```

### Nivel 4 — Mixto

Combinar los tres tipos.

Ejemplos:

```txt
□ + 4 = 8
10 - □ = 6
□ - 9 = 10
```

Objetivo:

```txt
Identificar qué significa la cajita según su posición.
```

---

## 9. Generación de retos

Agregar una función nueva:

```js
function generateMysteryChallenge(tier) {}
```

Debe devolver un objeto con esta forma:

```js
{
  mysteryType: "missing_addend" | "missing_subtrahend" | "missing_minuend",
  challengeOp: "add" | "subtract",
  leftNumber: number | null,
  rightNumber: number | null,
  expectedResult: number,
  hiddenValue: number,
  hiddenPosition: "left" | "right"
}
```

### 9.1 Generación para `missing_addend`

Generar:

```txt
□ + a = b
```

Reglas sugeridas:

```js
a = randomInt(2, 9);
hiddenValue = randomInt(2, 9);
expectedResult = a + hiddenValue;
```

Resultado:

```js
{
  mysteryType: "missing_addend",
  challengeOp: "add",
  leftNumber: null,
  rightNumber: a,
  expectedResult,
  hiddenValue,
  hiddenPosition: "left"
}
```

### 9.2 Generación para `missing_subtrahend`

Generar:

```txt
a - □ = b
```

Reglas sugeridas:

```js
leftNumber = randomInt(6, 18);
expectedResult = randomInt(2, leftNumber - 2);
hiddenValue = leftNumber - expectedResult;
```

Garantizar:

```txt
hiddenValue > 0
expectedResult > 0
leftNumber > expectedResult
```

Resultado:

```js
{
  mysteryType: "missing_subtrahend",
  challengeOp: "subtract",
  leftNumber,
  rightNumber: null,
  expectedResult,
  hiddenValue,
  hiddenPosition: "right"
}
```

### 9.3 Generación para `missing_minuend`

Generar:

```txt
□ - a = b
```

Reglas sugeridas:

```js
rightNumber = randomInt(2, 9);
expectedResult = randomInt(2, 12);
hiddenValue = rightNumber + expectedResult;
```

Resultado:

```js
{
  mysteryType: "missing_minuend",
  challengeOp: "subtract",
  leftNumber: null,
  rightNumber,
  expectedResult,
  hiddenValue,
  hiddenPosition: "left"
}
```

---

## 10. Estado global

Extender el objeto `state` actual con campos para el modo misterio.

Agregar:

```js
mysteryType: null,
hiddenValue: null,
hiddenPosition: null,
```

Forma esperada:

```js
const state = {
  score: 0,
  playMode: "add_only",
  tutorialStep: 0,
  challengeOp: "add",
  leftNumber: 7,
  rightNumber: 8,
  expectedResult: 15,
  challengeIndex: 1,
  mysteryType: null,
  hiddenValue: null,
  hiddenPosition: null,
  bubbles: []
};
```

---

## 11. Render de la ecuación

Modificar `syncEquation()` para soportar `playMode === "mystery"`.

Actualmente la ecuación muestra:

```txt
leftNumber op rightNumber = ?
```

En modo misterio debe mostrar:

```txt
? + 4 = 8
10 - ? = 6
? - 9 = 10
```

Regla:

```js
if (state.playMode === "mystery") {
  eqLeft.textContent =
    state.hiddenPosition === "left" ? "?" : String(state.leftNumber);

  eqOp.textContent =
    state.challengeOp === "subtract" ? "−" : "+";

  eqRight.textContent =
    state.hiddenPosition === "right" ? "?" : String(state.rightNumber);

  eqResult.textContent = String(state.expectedResult);
}
```

La parte misteriosa debe tener una clase CSS especial:

```css
.equation__part--mystery
```

---

## 12. Burbuja misteriosa / zona objetivo

Agregar una zona visual en el área de juego o debajo de la ecuación.

Nombre sugerido:

```txt
Portal Misterioso
```

Debe representar el lugar donde el niño arrastra la burbuja candidata.

### HTML sugerido

Agregar dentro de la pantalla de juego, cerca de la ecuación o dentro del play area:

```html
<div id="mystery-target" class="mystery-target" hidden>
  <span class="mystery-target__label">Arrastra aquí la burbuja escondida</span>
  <span class="mystery-target__bubble">?</span>
</div>
```

El elemento debe permanecer oculto fuera del modo `mystery`.

---

## 13. Burbujas iniciales en modo misterio

Crear función:

```js
function initialMysteryBubbleLayout() {}
```

Regla general:

```txt
No crear burbuja para el valor escondido.
Solo crear burbujas con los valores visibles y útiles para resolver.
```

### 13.1 Para `□ + a = b`

Ecuación:

```txt
□ + a = b
```

Burbujas iniciales sugeridas:

```txt
[a] [b]
```

Ejemplo:

```txt
□ + 4 = 8
```

Burbujas:

```txt
[4] [8]
```

El niño puede romper `8` en `4 + 4` y elegir la parte faltante.

### 13.2 Para `a - □ = b`

Ecuación:

```txt
a - □ = b
```

Burbujas iniciales sugeridas:

```txt
[a] [b]
```

Ejemplo:

```txt
10 - □ = 6
```

Burbujas:

```txt
[10] [6]
```

El niño debe descubrir qué parte falta para pasar de 10 a 6.

### 13.3 Para `□ - a = b`

Ecuación:

```txt
□ - a = b
```

Burbujas iniciales sugeridas:

```txt
[a] [b]
```

Ejemplo:

```txt
□ - 9 = 10
```

Burbujas:

```txt
[9] [10]
```

El niño debe fusionar `9 + 10` para formar `19`.

---

## 14. Validación del modo misterio

En modo normal, el juego valida automáticamente cuando queda una sola burbuja con `expectedResult`.

En modo misterio, la validación debe ocurrir cuando el usuario arrastra una burbuja sobre `mystery-target`.

Agregar función:

```js
function tryPlaceOnMysteryTarget(bubble) {}
```

Reglas:

```js
if (bubble.value === state.hiddenValue) {
  completeMysteryChallenge(bubble);
} else {
  showMysteryWrongFeedback(bubble);
}
```

### 14.1 Éxito

Mostrar modal según el tipo:

#### `missing_addend`

```txt
¡Excelente! La cajita era 4.
4 + 4 = 8
```

#### `missing_subtrahend`

```txt
¡Bien! Se fueron 4.
10 - 4 = 6
```

#### `missing_minuend`

```txt
¡Excelente! Empezaste con 19.
19 - 9 = 10
```

### 14.2 Error

No penalizar demasiado.

La burbuja debe rebotar o temblar.

Mostrar mensaje suave:

#### `missing_addend`

```txt
Todavía no. Busca qué número falta para llegar al total.
```

#### `missing_subtrahend`

```txt
Casi. La cajita representa lo que se quitó.
```

#### `missing_minuend`

```txt
Recuerda: junta lo que quedó con lo que se quitó.
```

---

## 15. Descomposición contextual para Cajita Misteriosa

El modo misterio necesita una descomposición más guiada que el modo normal.

Agregar una prioridad especial al inicio de `decomposePartsForBubble(b)` cuando `state.playMode === "mystery"`.

Crear función:

```js
function decomposePartsForMysteryBubble(b) {}
```

### 15.1 Caso `missing_addend`

Ecuación:

```txt
□ + a = b
```

Si se hace click sobre la burbuja del total `b`, priorizar:

```txt
b → a + hiddenValue
```

Ejemplo:

```txt
8 → 4 + 4
```

Regla:

```js
if (
  state.mysteryType === "missing_addend" &&
  b.value === state.expectedResult
) {
  return [state.rightNumber, state.hiddenValue].sort((a, b) => a - b);
}
```

### 15.2 Caso `missing_subtrahend`

Ecuación:

```txt
a - □ = b
```

Si se hace click sobre la burbuja inicial `a`, priorizar:

```txt
a → b + hiddenValue
```

Ejemplo:

```txt
10 → 6 + 4
```

Regla:

```js
if (
  state.mysteryType === "missing_subtrahend" &&
  b.value === state.leftNumber
) {
  return [state.expectedResult, state.hiddenValue].sort((a, b) => a - b);
}
```

### 15.3 Caso `missing_minuend`

Ecuación:

```txt
□ - a = b
```

Aquí no se necesita descomposición especial inicialmente.

La estrategia principal es:

```txt
a + b → hiddenValue
```

Ejemplo:

```txt
9 + 10 → 19
```

---

## 16. Fusión en modo misterio

En modo `mystery`, las fusiones pueden seguir la lógica actual de suma, excepto que no deben completar automáticamente por `expectedResult`.

Importante:

```txt
En modo misterio, la burbuja final correcta es hiddenValue, no necesariamente expectedResult.
```

Ejemplo:

```txt
□ - 9 = 10
```

Aquí:

```txt
expectedResult = 10
hiddenValue = 19
```

Por eso `checkPuzzleCompleteAuto()` debe ignorarse en modo `mystery`.

Modificar:

```js
function checkPuzzleCompleteAuto() {
  if (state.playMode === "mystery") return;
  // lógica actual
}
```

La victoria en modo misterio ocurre solo al soltar una burbuja sobre `mystery-target`.

---

## 17. Detección de drop sobre `mystery-target`

Agregar helper:

```js
function isPointInsideMysteryTarget(clientX, clientY) {
  const target = els.mysteryTarget;
  if (!target || target.hidden) return false;
  const rect = target.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}
```

Modificar `onPointerUp(ev)`:

```js
if (state.playMode === "mystery" && isPointInsideMysteryTarget(ev.clientX, ev.clientY)) {
  tryPlaceOnMysteryTarget(b);
  return;
}
```

---

## 18. UI y estilos

### 18.1 Elementos nuevos

Agregar estilos para:

```css
.equation__part--mystery
.mystery-target
.mystery-target__label
.mystery-target__bubble
.mystery-target--active
.mystery-target--success
.mystery-target--wrong
.mode-options__choice--mystery
```

### 18.2 Estética de la burbuja misteriosa

Debe sentirse especial:

```txt
glow dorado
borde punteado
pulso suave
signo ? grande
```

Ejemplo CSS base:

```css
.equation__part--mystery,
.mystery-target__bubble {
  color: #0f172a;
  background: radial-gradient(circle at 30% 25%, #ffffff, #fde047 45%, #f59e0b 100%);
  box-shadow:
    0 0 0 3px rgba(253, 224, 71, 0.45),
    0 0 32px rgba(253, 224, 71, 0.65),
    0 0 56px rgba(192, 132, 252, 0.35);
}
```

### 18.3 Animación sugerida

```css
@keyframes mystery-pulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.06);
    filter: brightness(1.15);
  }
}
```

---

## 19. Help banner en modo misterio

Modificar `buildHelpBannerContent()` para que si `playMode === "mystery"` devuelva mensajes específicos.

Crear función:

```js
function buildMysteryHelpBannerContent() {}
```

Ejemplos:

### `missing_addend`

Primary:

```txt
Cajita + 4 = 8. Encuentra la parte que falta.
```

Secondary:

```txt
Rompe el total para ver qué parte ya tienes y cuál falta.
```

### `missing_subtrahend`

Primary:

```txt
10 − cajita = 6. Encuentra lo que se fue.
```

Secondary:

```txt
Rompe el 10 en lo que quedó y lo que se quitó.
```

### `missing_minuend`

Primary:

```txt
Cajita − 9 = 10. Reconstruye el número inicial.
```

Secondary:

```txt
Junta lo que quedó con lo que se quitó.
```

---

## 20. Modal de éxito

Modificar `openSuccessModal()` para soportar modo misterio.

Crear función:

```js
function mysterySuccessMessage() {
  if (state.mysteryType === "missing_addend") {
    return `¡Excelente! La cajita era ${state.hiddenValue}. ${state.hiddenValue} + ${state.rightNumber} = ${state.expectedResult}.`;
  }

  if (state.mysteryType === "missing_subtrahend") {
    return `¡Bien! Se fueron ${state.hiddenValue}. ${state.leftNumber} − ${state.hiddenValue} = ${state.expectedResult}.`;
  }

  if (state.mysteryType === "missing_minuend") {
    return `¡Excelente! Empezaste con ${state.hiddenValue}. ${state.hiddenValue} − ${state.rightNumber} = ${state.expectedResult}.`;
  }

  return "¡Excelente! Encontraste el número escondido.";
}
```

---

## 21. Puntaje

El modo `mystery` debe otorgar puntos al completar el reto.

Sugerencia:

```js
pointsForOperandSum(state.hiddenValue)
```

O más simple:

```js
state.hiddenValue * SCORE_POINTS_PER_UNIT
```

Recomendación pedagógica para niños pequeños:

```txt
No penalizar el primer error.
Penalizar suavemente después del segundo error.
```

Para MVP:

```txt
Sin penalización en Cajita Misteriosa.
Solo feedback visual.
```

---

## 22. Botón “Ayúdame a empezar”

Agregar botón opcional en modo misterio:

```html
<button type="button" id="btn-mystery-help" class="btn btn--ghost" hidden>
  Ayúdame a empezar
</button>
```

Comportamiento:

### `missing_addend`

Mostrar:

```txt
Rompe el total.
```

Resaltar la burbuja del total.

### `missing_subtrahend`

Mostrar:

```txt
Rompe el número inicial.
```

Resaltar la burbuja del número inicial.

### `missing_minuend`

Mostrar:

```txt
Junta lo que quedó con lo que se quitó.
```

Resaltar las dos burbujas visibles.

Este botón es opcional para el MVP, pero recomendado.

---

## 23. Accesibilidad

Mantener:

- Texto legible.
- Contraste suficiente.
- Botones grandes.
- `aria-live` para mensajes importantes.
- `aria-label` en burbujas.
- `role="button"` en burbujas.

Para la burbuja misteriosa:

```html
aria-label="Zona para colocar el número escondido"
```

Para el modo misterio:

```html
aria-label="Modo Cajita Misteriosa"
```

---

## 24. Criterios de aceptación

### General

```txt
[ ] La pantalla inicial muestra el modo Cajita Misteriosa.
[ ] Al seleccionar el modo, se inicia un reto con número escondido.
[ ] La ecuación se renderiza con ? en la posición correcta.
[ ] El resultado conocido se muestra correctamente.
[ ] Aparece la zona visual para colocar la burbuja misteriosa.
[ ] Las burbujas visibles iniciales no incluyen directamente el hiddenValue salvo que sea parte visible del reto.
[ ] Las burbujas pueden descomponerse, arrastrarse y fusionarse.
[ ] En modo misterio, la victoria no se activa por expectedResult.
[ ] La victoria se activa al soltar una burbuja con value === hiddenValue sobre mystery-target.
[ ] Si la burbuja es incorrecta, se muestra feedback suave.
[ ] El modal de éxito explica la operación completa.
[ ] Nuevo reto genera otro caso válido.
```

### Missing Addend

```txt
[ ] Puede generar retos del tipo □ + a = b.
[ ] El hiddenValue es b - a.
[ ] La ayuda dice “Busca la parte que falta.”
[ ] La descomposición contextual permite b → a + hiddenValue.
```

### Missing Subtrahend

```txt
[ ] Puede generar retos del tipo a - □ = b.
[ ] El hiddenValue es a - b.
[ ] La ayuda dice “Busca lo que se fue.”
[ ] La descomposición contextual permite a → b + hiddenValue.
```

### Missing Minuend

```txt
[ ] Puede generar retos del tipo □ - a = b.
[ ] El hiddenValue es a + b.
[ ] La ayuda dice “Reconstruye lo que había al principio.”
[ ] El niño puede fusionar a + b para formar hiddenValue.
```

---

## 25. Casos de prueba manuales

### Caso 1

```txt
Reto: □ + 4 = 8
hiddenValue: 4
Acción: romper 8 en 4 + 4
Acción: arrastrar 4 al target
Resultado esperado: éxito
```

### Caso 2

```txt
Reto: 10 - □ = 6
hiddenValue: 4
Acción: romper 10 en 6 + 4
Acción: arrastrar 4 al target
Resultado esperado: éxito
```

### Caso 3

```txt
Reto: □ - 9 = 10
hiddenValue: 19
Acción: fusionar 9 + 10
Acción: arrastrar 19 al target
Resultado esperado: éxito
```

### Caso incorrecto

```txt
Reto: □ + 4 = 8
Acción: arrastrar 5 al target
Resultado esperado: no completar, mostrar ayuda suave
```

---

## 26. Fuera de alcance para esta tarea

No implementar todavía:

```txt
x o variables algebraicas formales
multiplicación
división
fracciones
ranking
usuarios
backend
persistencia de progreso
sonidos complejos
sistema avanzado de niveles
```

---

## 27. Orden de implementación sugerido

1. Agregar opción `mystery` en pantalla inicial.
2. Extender `state` con campos mystery.
3. Crear `generateMysteryChallenge(tier)`.
4. Modificar `startChallenge()` para soportar `playMode === "mystery"`.
5. Crear `initialMysteryBubbleLayout()`.
6. Modificar `syncEquation()`.
7. Agregar HTML del `mystery-target`.
8. Agregar estilos del target y de la parte misteriosa.
9. Detectar drop sobre `mystery-target`.
10. Implementar `tryPlaceOnMysteryTarget()`.
11. Desactivar victoria automática por `expectedResult` en modo misterio.
12. Agregar `decomposePartsForMysteryBubble(b)`.
13. Integrar esa descomposición al principio de `decomposePartsForBubble(b)`.
14. Agregar mensajes al `help-banner`.
15. Agregar mensaje de éxito específico.
16. Probar manualmente los tres casos.
17. Ajustar UX visual.

---

## 28. Notas pedagógicas para el agente

No convertir esto en álgebra formal.

No mostrar:

```txt
x
variable
despejar
```

Mostrar:

```txt
?
cajita
número escondido
parte faltante
lo que se fue
lo que había al principio
```

El objetivo es que el niño entienda el significado de cada posición de la cajita.

Frases clave:

```txt
Cajita + número = total → busca lo que falta.
Número - cajita = quedan → busca lo que se fue.
Cajita - número = quedan → reconstruye lo que había al principio.
```

---

## 29. Resultado esperado de la tarea

Al finalizar, Bubble Math Lab debe tener un nuevo modo funcional llamado **Cajita Misteriosa**, integrado visualmente al estilo actual del juego, capaz de generar retos simples con número faltante y validar la burbuja correcta al arrastrarla al portal misterioso.

El niño debe poder jugar, equivocarse sin frustración, recibir pistas y construir visualmente el número escondido mediante descomposición y recombinación de burbujas.