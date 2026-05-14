# Mystery Box (Cajita Misteriosa) — Plan de tareas

Juego **independiente** en esta carpeta. El producto de referencia está en [`../spec_mistery_box.md`](../spec_mistery_box.md) (redactado como expansión de Bubble Math Lab; aquí se interpreta como **app solo-misterio**: sin sumas/restas “clásicas” ni tutorial de burbujas genéricas).

**Stack:** HTML + CSS + JS vanilla, sin build, sin backend (spec §4).

---

## Fase 0 — Proyecto y criterios

- [ ] **0.1** Estructura mínima: `index.html`, `styles.css`, `app.js` en esta carpeta.
- [ ] **0.2** Definir nombre de producto en UI: “Mystery Box” / “Cajita Misteriosa” (coherente con copy infantil del spec §3).
- [ ] **0.3** Relevar del spec los **criterios de aceptación** §24 y los **casos manuales** §25 como checklist final de QA.

---

## Fase 1 — Pantallas y marco visual

- [ ] **1.1** Pantalla de **inicio**: título, tagline corta, botón “Jugar” (o equivalente; no hace falta el patrón radio de Bubble Math si el juego es único).
- [ ] **1.2** Pantalla de **juego**: cabecera (puntos, número de reto, indicador de nivel o tipo).
- [ ] **1.3** Pie de juego: “Nuevo reto”, “Reiniciar turno”, “Inicio” (spec implícito + UX esperada).
- [ ] **1.4** Sistema visual base (tipografía legible, contraste, responsive) alineado a §23.

---

## Fase 2 — Estado global y progresión pedagógica

- [ ] **2.1** Objeto `state` con al menos: puntaje, índice de reto, `mysteryType`, `challengeOp`, `leftNumber` / `rightNumber` (nullable), `expectedResult`, `hiddenValue`, `hiddenPosition`, lista de burbujas (spec §10).
- [ ] **2.2** **Progresión** §8: no mezclar los tres tipos al inicio — p. ej. bloques por fase (Nivel 1 → solo `missing_addend`; Nivel 2 → solo `missing_subtrahend`; Nivel 3 → solo `missing_minuend`; Nivel 4 → mixto) o criterio equivalente documentado en código.
- [ ] **2.3** `generateMysteryChallenge(tier | stage)` §9: generación válida para los tres tipos, con reglas de rangos y fallback seguro ante reintentos.
- [ ] **2.4** (Opcional recomendado) Progresión por **dominio** (aciertos seguidos o %), no solo por número de reto, para evitar saltos si el niño falla.

---

## Fase 3 — Ecuación y “cajita” en pantalla

- [ ] **3.1** Render de la igualdad con `?` en la posición correcta y resultado conocido visible (spec §11).
- [ ] **3.2** Estilo distintivo para la parte misteriosa (`equation__part--mystery` o similar §11/§18).
- [ ] **3.3** Copy: evitar jerga algebraica; preferir “cajita”, “lo que falta”, etc. (§3).

---

## Fase 4 — Área de juego, portal y burbujas

- [ ] **4.1** Contenedor de juego con **lienzo único**: burbujas y **portal / zona de respuesta dentro del mismo área** (evita fricción de arrastre fuera del `overflow`; lección del prototipo en Bubble Math).
- [ ] **4.2** Implementar `initialMysteryBubbleLayout()` §13 para los tres tipos (pares `[a,b]`, `[a,b]`, `[a,b]` con roles/fuentes acordes a suma/resta en mesa).
- [ ] **4.3** Burbujas arrastrables, colisiones/fusiones según reglas del diseño (spec §16: en minuendo faltante la fusión útil es **suma** de las piezas visibles → `hiddenValue`).
- [ ] **4.4** **No** colocar en mesa una burbuja inicial con valor `hiddenValue`, salvo que coincida con dato visible del enunciado (§24 general).

---

## Fase 5 — Descomposición contextual (Cajita)

- [ ] **5.1** `decomposePartsForMysteryBubble` o equivalente §15: prioridad al split pedagógico (`b → a + hidden`, `a → b + hidden`, etc.).
- [ ] **5.2** Para `missing_minuend` §15.3: estrategia principal por **fusión** `a + b` (sin depender de descomposición mágica del total inexistente).
- [ ] **5.3** (Opcional) Nivel de ayuda graduado: split “fuerte” solo tras botón de ayuda o segundo intento, para no guiar de más.

---

## Fase 6 — Victoria, derrota suave y modales

- [ ] **6.1** **No** declarar victoria solo por tener una burbuja igual a `expectedResult` si eso no es la meta (spec §16); victoria al validar `hiddenValue`.
- [ ] **6.2** `tryPlaceOnMysteryTarget` §14: si valor correcto → éxito + retirar burbuja / animación; si no → feedback suave §14.2 (spec §21 MVP: sin penalización dura).
- [ ] **6.3** Hit-test del portal: rect sensible o **margen extra / snap** si el puntero está cerca (mejora UX táctil, no está en spec pero recomendado).
- [ ] **6.4** `mysterySuccessMessage()` §20 en modal de éxito + acción “Siguiente reto”.
- [ ] **6.5** Puntos al completar §21 (fórmula simple documentada).

---

## Fase 7 — Ayuda contextual y barra opcional

- [ ] **7.1** Banner o zona de texto con mensajes por tipo §19 (`buildMysteryHelpBannerContent` o similar).
- [ ] **7.2** Botón **“Ayúdame a empezar”** §22 con resaltado de burbujas según tipo.
- [ ] **7.3** Si hay fusión con comprobación numérica (modal tipo Bubble Math), valorar **aliviar fricción** en este juego (p. ej. autofusión para pares triviales) para no competir con el objetivo “cajita”.

---

## Fase 8 — Accesibilidad y pulido

- [ ] **8.1** `aria-live` en mensajes clave; `aria-label` en portal y piezas interactivas §23.
- [ ] **8.2** Animaciones respetando `prefers-reduced-motion` donde aplique.
- [ ] **8.3** Revisión visual del portal (glow, estados active / wrong / success §18).

---

## Fase 9 — QA y alcance

- [ ] **9.1** Ejecutar casos §25 (y variantes con número incorrecto al portal).
- [ ] **9.2** Marcar explícitamente **fuera de alcance** §26 (álgebra formal, mult/div, etc.).
- [ ] **9.3** Actualizar este plan si el spec cambia (`spec_mistery_box.md`).

---

## Notas de diseño (fuente del spec + feedback previo)

1. **Un solo propósito:** toda la app encarna “número escondido”; no mezclar con el loop “llegá al resultado de 7+8” de Bubble Math.
2. **Portal dentro del lienzo** desde el primer diseño para ni Touch + `overflow: hidden`.
3. **Coherencia verbal:** “cajita” en ayudas si la ecuación muestra `?`.
4. **Progresión:** priorizar sensación de práctica antes de mezclar tipos (§8).

---

## Orden sugerido de implementación (resumen)

0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, alineado con §27 del spec donde aplique al proyecto standalone.
