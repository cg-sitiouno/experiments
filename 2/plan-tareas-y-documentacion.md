# Bubble Math Lab — Plan de tareas y documentación técnica

Este documento se deriva del [spec.md](./spec.md) del producto **Bubble Math Lab** (nombre provisional). Sirve como guía de implementación para el MVP y como referencia detallada de requisitos, reglas y criterios de aceptación.

---

## 1. Resumen del producto

| Aspecto | Detalle |
|--------|---------|
| **Propósito** | App web estática, colorida e interactiva para desarrollar agilidad mental en **sumas** mediante **descomposición y recombinación** visual de números. |
| **Público** | Niños ~6–10 años; dificultad ajustable. |
| **Stack MVP** | HTML, CSS, JavaScript vanilla — sin backend, login, BD ni frameworks. |
| **Estructura de archivos** | `index.html`, `styles.css`, `app.js` (carpeta sugerida: `bubble-math-lab/`). |
| **Alcance MVP** | Solo **sumas**; resta queda para versión posterior. |

**Frase guía:** *“No se trata de adivinar la respuesta; se trata de aprender a transformar los números hasta que la respuesta sea fácil.”*

---

## 2. Lista maestra de tareas

Las tareas están ordenadas por dependencias lógicas. Los identificadores `T-XX` facilitan referencias cruzadas.

### Fase A — Estructura y pantallas estáticas

| ID | Tarea | Verificación |
|----|--------|----------------|
| **T-01** | Crear estructura del proyecto: `index.html`, `styles.css`, `app.js`, enlaces correctos entre archivos. | Abrir `index.html` en navegador sin errores de consola por recursos faltantes. |
| **T-02** | Implementar **pantalla de inicio**: título, breve explicación, selector de nivel (1–3), botón “Jugar”. | Navegación visual coherente; selector persiste elección hasta “Jugar”. |
| **T-03** | Implementar **layout de pantalla de juego** (estructura HTML/CSS): cabecera con nivel/reto/estrellas, fila de operación `[a] + [b]`, área de burbujas, zona de resultado `[?]`, botones Reiniciar / Nuevo reto. | Maquetado responsive básico (prioridad desktop/tablet según spec). |
| **T-04** | Establecer sistema visual base: gradientes, burbujas translúcidas, glow suave, tipografía legible y botones grandes (accesibilidad básica). | Contraste y tamaños revisables; no depender solo del color para estados. |

### Fase B — Modelo de estado y generación de ejercicios

| ID | Tarea | Verificación |
|----|--------|----------------|
| **T-05** | Definir e implementar **estado del juego** alineado al spec: `level`, `operation` (`"addition"` en MVP), `leftNumber`, `rightNumber`, `expectedResult`, `bubbles[]`, `selectedBubble`, `attempts`, `completed`, más campos necesarios (p. ej. índice de reto). | Estado serializable en memoria; transiciones documentadas en código o comentarios mínimos. |
| **T-06** | Definir e implementar **estado de burbuja**: `id`, `value`, `x`, `y`, `type`, `source` (`left` / `right` / `derived`), `decomposed` (o equivalente). | Cada burbuja en DOM o capa visual mapeable a un objeto. |
| **T-07** | Implementar **generación aleatoria de sumas** según nivel: Nivel 1 (operandos en rango acorde a “menores que 10” / tablas del spec), Nivel 2 (hasta 20), Nivel 3 (hasta 50). Para MVP: operandos típicos `2–19` con configuración por dificultad; **resultado máximo recomendado 99**. | Distribución plausible; límites por nivel coinciden con tablas de § “Generación de ejercicios” del spec. |
| **T-08** | Al iniciar partida o “Nuevo reto”: crear **burbujas iniciales** para operandos y **burbuja de resultado vacía** (`?`); posicionar en área de juego. | Tras “Jugar”, se ve operación y dos burbujas numéricas + hueco de resultado. |

### Fase C — Descomposición (click)

| ID | Tarea | Verificación |
|----|--------|----------------|
| **T-09** | Implementar **función de descomposición** con reglas pedagógicas: **&lt;10** → priorizar `5 + (n-5)` para 6–9; **2–5** según tablas del spec; **dos dígitos** → decenas + unidades (`25 → 20 + 5`, etc.); unidades posteriormente descomponibles. | Casos de prueba manuales: 7→5+2, 8→5+3, 25→20+5, 28→20+8 y luego 8→5+3. |
| **T-10** | **Click en burbuja**: si es descomponible, reemplazar por dos burbujas hijas con animación (pulso, partículas o “desintegración”); si no, animación corta de “no se puede dividir”. | Burbuja `1` (o mínimo no descomponible según reglas) no crea hijos inválidos. |
| **T-11** | Mantener **trazabilidad** (opcional pero útil): `source` o genealogía para no mezclar lógica indebida; al reiniciar turno, restaurar operandos iniciales y limpiar burbujas derivadas. | “Reiniciar turno” vuelve al estado del reto actual sin cambiar `leftNumber`/`rightNumber`. |

### Fase D — Arrastre y fusión

| ID | Tarea | Verificación |
|----|--------|----------------|
| **T-12** | Implementar **drag and drop** (mouse; táctil deseable para tablet): burbuja sigue cursor/pointer, escala ~1.08, sombra/glow, `z-index` alto. | Arrastre fluido sin “saltos” graves en MVP. |
| **T-13** | **Detección de proximidad** al soltar: si dos burbujas numéricas compatibles están cerca o una se suelta sobre la otra, iniciar fusión. | Umbrales ajustables (constantes CSS/JS). |
| **T-14** | **Fusión para suma**: `a + b` → una burbuja con valor `a + b`; eliminar las dos originales; animación de acercamiento, brillo y aparición de la nueva burbuja. | Ejemplo ideal del spec: 5+5→10, 2+3→5, 10+5→15. |
| **T-15** | Feedback visual cuando dos burbujas son **candidatas a fusionar** (ambas brillan, aura o línea). | Durante arrastre cerca de compatible, ambas resaltan. |

### Fase E — Zona de resultado y flujo de turno

| ID | Tarea | Verificación |
|----|--------|----------------|
| **T-16** | Definir **zona de resultado** (drop target): al soltar burbuja sobre ella, comparar `bubble.value` con `expectedResult`. | Valores incorrectos no marcan éxito. |
| **T-17** | **Éxito**: animación (confetti de burbujas / explosión suave), mensaje positivo, opcional sonido; actualizar estrellas o contador de retos; permitir “Siguiente” o auto-avance a nuevo ejercicio según diseño. | Coincide con pantalla/modal de éxito del spec. |
| **T-18** | **Error suave**: rebote o shake ligero; mensaje de ayuda **no punitivo** (ej. “Casi. Intenta combinar primero los números que hacen 10.”); incrementar `attempts` si aplica. | No usar textos tipo “Incorrecto / Fallaste / Mal”. |
| **T-19** | Botón **“Nuevo reto”**: nueva suma, reset de burbujas y resultado. **“Reiniciar turno”**: misma suma, estado inicial de burbujas. | Comportamiento distinto verificable entre ambos botones. |

### Fase F — Pulido, accesibilidad y criterios finales

| ID | Tarea | Verificación |
|----|--------|----------------|
| **T-20** | Mensajes de **ayuda contextual** (tooltips, banner o panel): ej. “Busca dos burbujas que sumen 10.”, “Puedes romper el 8 en 5 y 3.” — alineados a § “Mensajes de ayuda”. | Al menos 2–3 mensajes rotativos o por contexto (intentos / valor arrastrado). |
| **T-21** | **Responsive**: reorganizar área de juego en pantallas pequeñas; mantener usabilidad; aceptar que drag sea más cómodo en desktop/tablet (según spec). | Prueba en viewport estrecho sin solapamiento crítico. |
| **T-22** | **Performance**: sin librerías pesadas; animaciones CSS preferibles; número de nodos DOM razonable al descomponer repetidamente. | Sin caídas obvias de FPS en escenario típico. |
| **T-23** | Revisión **checklist de aceptación MVP** (§11 de este documento): marcar cada ítem. | Todos los ítems en verde antes de considerar MVP cerrado. |

---

## 3. Documentación detallada por dominio

### 3.1 Flujo principal del juego (MVP)

1. **Inicio del turno**: se muestra `a + b` con cada número en una burbuja grande; la burbuja de resultado muestra `?` y está vacía de valor.
2. **Descomposición**: click en burbuja numérica → animación → sustitución por dos burbujas según reglas (§3.3).
3. **Manipulación**: todas las burbujas generadas son **draggables** dentro del área de juego.
4. **Fusión**: al acercar/soltar dos burbujas compatibles → una sola burbuja con la **suma** de ambos valores (solo suma en MVP).
5. **Cierre**: arrastrar la burbuja con el valor final correcto a la zona de resultado → validación → feedback → siguiente reto o modal de éxito.

### 3.2 Reglas de descomposición (resumen normativo)

**Números menores que 10**

- `6 → 5 + 1`, `7 → 5 + 2`, `8 → 5 + 3`, `9 → 5 + 4`
- Pequeños: `2 → 1 + 1`, `3 → 2 + 1`, `4 → 2 + 2`, `5 →` no subdividir en 5+0 (el spec indica `5 → 5` como caso límite — interpretar como “no descomponible” o regla explícita en código).

**Dos dígitos**

- Priorizar **decenas + unidades**: `12 → 10 + 2`, `25 → 20 + 5`, etc.
- Las **unidades** pueden descomponerse después (ej. `8 → 5 + 3`).

**Resta**

- Fuera del MVP; la primera versión debe estar **enfocada en sumas** únicamente.

### 3.3 Fusión

- **Operación del turno**: solo suma → fusión siempre `nuevoValor = v1 + v2`.
- **UX**: acercamiento visual, brillo conjunto, nueva burbuja con destello.
- **Resta (futuro)**: el spec advierte complejidad (ej. `15 - 7` con descomposición); no aplicar en MVP.

### 3.4 Niveles de dificultad (contenido pedagógico)

| Nivel | Ejemplos (spec) | Objetivo pedagógico |
|-------|-----------------|---------------------|
| 1 | `2+3`, `4+5`, `7+8` | Descomposición con 5, pares que suman 10 |
| 2 | `12+7`, `14+8`, `9+6` | Decenas, unidades, completar 10 |
| 3 | `25+18`, `34+7`, `28+16` | Decenas/unidades, sumas parciales, redondos |

**Generación (rangos orientativos del spec)**

- Nivel 1: operandos en rangos pequeños (ej. tablas `2–9` según spec).
- Nivel 2: algo como `5–19` u omologado para “hasta 20”.
- Nivel 3: operandos mayores (ej. `10–49`) con suma acotada por **99**.

Implementación concrete: fijar rangos en constantes y documentarlos en `app.js`.

### 3.5 Estados (contrato de datos)

**Juego (ejemplo del spec)**

```js
{
  level: 1,
  operation: "addition",
  leftNumber: 7,
  rightNumber: 8,
  expectedResult: 15,
  bubbles: [],
  selectedBubble: null,
  attempts: 0,
  completed: false
}
```

**Burbuja (ejemplo del spec)**

```js
{
  id: "bubble-1",
  value: 7,
  x: 120,
  y: 240,
  type: "number",
  source: "left",
  decomposed: false
}
```

Notas de implementación:

- `bubbles` puede ser la fuente de verdad; posiciones `x,y` deben sincronizarse con CSS (`transform` o `left/top`).
- Generar `id` únicos (contador, UUID ligero o `crypto.randomUUID()` si disponible).

### 3.6 Interacciones visuales (checklist)

| Estado | Comportamiento esperado |
|--------|-------------------------|
| Normal | Gradiente radial, borde suave, transparencia, sombra/glow, animación flotante sutil |
| Hover | Ligero aumento de escala, más glow, `cursor: pointer` |
| Click (descomponer) | Pulso, partículas, aparición de dos hijas |
| Arrastre | Escala ~1.08, sombra fuerte, z-index alto |
| Pre-fusión | Ambas brillan; aura o línea entre ellas |
| Fusión | Atracción visual, mezcla, nueva burbuja, destello |
| Éxito | Confetti / burbujas pequeñas, mensaje alegre |

### 3.7 Requerimientos no funcionales

- **Accesibilidad básica**: texto legible, contraste, botones claros, tamaños grandes, información no solo por color.
- **Responsive**: desktop, tablet, pantallas pequeñas — MVP prioriza desktop/tablet por comodidad de drag.
- **Performance**: vanilla, animaciones CSS simples, DOM controlado; canvas no obligatorio en MVP.

### 3.8 Fuera de alcance (MVP)

Login, backend, BD, ranking global, sonidos complejos, multijugador, IA, niveles infinitos complejos, restas avanzadas, cuentas de usuario.

---

## 4. Roadmap post-MVP (referencia del spec)

| Versión | Contenido |
|---------|-----------|
| **v2** | Restas guiadas, descomposición para “prestar”, visualización de quitar burbujas, modo “completa hasta”. |
| **v3** | Sistema de progreso: niveles explícitos, estrellas, racha, historial en `localStorage`. |
| **v4** | Sonidos, partículas ricas, modo claro/oscuro, personajes guía. |

---

## 5. Mapa de dependencias entre fases

```text
A (HTML/CSS layout)
    ↓
B (estado + generación + burbujas iniciales)
    ↓
C (descomposición)
    ↓
D (drag + fusión) — puede desarrollarse en paralelo con refinamiento de C una vez B exista
    ↓
E (validación resultado + flujo éxito/error + botones)
    ↓
F (ayudas, responsive, performance, checklist)
```

**Riesgos / puntos de atención**

- **IDs y correspondencia DOM–estado**: definir una sola fuente de verdad para evitar burbujas huérfanas tras fusión/descomposición.
- **Umbrales de fusión**: demasiado estricto = frustración; demasiado laxo = fusiones accidentales.
- **Burbuja “?”**: no debe fusionarse ni descomponerse como número hasta contener un valor real (si el diseño lo permite, mantener tipos separados).

---

## 6. Criterios de aceptación del MVP (trazabilidad)

Checklist derivado del spec; debe poder marcarse al cerrar el proyecto.

- [ ] La app genera una suma aleatoria.
- [ ] Los números aparecen en burbujas.
- [ ] El usuario puede descomponer burbujas con click.
- [ ] La descomposición sigue reglas útiles (5s, decenas/unidades).
- [ ] Las burbujas pueden arrastrarse.
- [ ] Dos burbujas pueden fusionarse.
- [ ] La fusión crea una burbuja con la suma.
- [ ] El usuario puede colocar una burbuja en la zona de resultado.
- [ ] La app valida si el resultado es correcto.
- [ ] Hay feedback visual positivo o de ayuda (tono no punitivo).
- [ ] Existe botón para reiniciar turno.
- [ ] Existe botón para nuevo reto.
- [ ] Todo funciona sin backend.

**Experiencia ideal de validación manual (spec):** `7 + 8` → descomponer 7 y 8 → fusionar 5+5→10, 2+3→5, 10+5→15 → arrastrar 15 al resultado → mensaje de éxito.

---

## 7. Índice de trazabilidad spec → tareas

| Sección del spec | Tareas principales |
|------------------|-------------------|
| Archivos esperados | T-01 |
| Pantalla inicio | T-02 |
| Pantalla juego | T-03, T-04 |
| Estados / burbujas | T-05, T-06 |
| Generación / niveles | T-07, T-08 |
| Descomposición | T-09, T-10, T-11 |
| Drag / fusión | T-12–T-15 |
| Resultado / feedback | T-16–T-19 |
| Ayuda / responsive / performance | T-20–T-22 |
| Criterios finales | T-23 |

---

*Documento generado a partir de `spec.md` para uso interno de implementación. Actualizar este archivo si el spec cambia.*
