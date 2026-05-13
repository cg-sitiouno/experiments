 

# Spec del producto

## Nombre provisional

**Bubble Math Lab**

Alternativas:

* **Math Bubbles**
* **Burbuja Mental**
* **Sumas con Burbujas**
* **Bubble Numbers**

## Propósito

Crear una app web estática, colorida e interactiva para ayudar a niños a desarrollar agilidad mental en **sumas y restas**, usando estrategias de **descomposición y recombinación de números**.

La app no busca que el niño memorice resultados, sino que visualice cómo puede transformar un cálculo difícil en cálculos más simples.

Ejemplo:

```txt
7 + 8
```

Puede convertirse en:

```txt
7 = 5 + 2
8 = 5 + 3
5 + 5 = 10
2 + 3 = 5
10 + 5 = 15
```

La intención pedagógica es reforzar:

```txt
números redondos
composición y descomposición
pares que suman 10
pensamiento flexible
cálculo mental visual
```

---

# Tipo de aplicación

App web estática.

## Stack

```txt
HTML
CSS
JavaScript vanilla
```

Sin backend, sin login, sin base de datos y sin frameworks para la primera versión.

## Archivos esperados

```txt
bubble-math-lab/
├── index.html
├── styles.css
└── app.js
```

---

# Público objetivo

Niños en etapa inicial de cálculo mental.

Rango sugerido:

```txt
6 a 10 años
```

Pero la dificultad debe ser ajustable para permitir ejercicios simples y progresivos.

---

# Concepto visual

La app debe sentirse como un pequeño laboratorio de burbujas matemáticas.

## Estilo

Colorido, alegre, luminoso y dinámico.

Características visuales:

```txt
fondo con gradientes suaves
burbujas translúcidas
efectos glow
animaciones flotantes
colores vivos
microinteracciones al hacer hover/click
efecto de fusión entre burbujas
efecto de desintegración al descomponer
```

La estética debe ser más cercana a un juego educativo que a una calculadora.

## Referencias visuales conceptuales

```txt
burbujas de jabón
neón suave
partículas flotantes
laboratorio mágico
interfaz tipo playground
```

---

# Problema que resuelve

Muchos niños resuelven sumas y restas contando de uno en uno.

Ejemplo:

```txt
7 + 8
```

Pueden intentar:

```txt
8, 9, 10, 11, 12, 13, 14, 15
```

Pero el objetivo es que aprendan estrategias más ágiles:

```txt
7 + 8
= 7 + 3 + 5
= 10 + 5
= 15
```

O también:

```txt
7 = 5 + 2
8 = 5 + 3
5 + 5 = 10
2 + 3 = 5
10 + 5 = 15
```

La app hace visible este proceso.

---

# Objetivo principal

Permitir que el niño manipule números como piezas visuales, descomponiéndolos y recombinándolos hasta construir el resultado correcto.

---

# Flujo principal del juego

## 1. Inicio del turno

La app genera una operación aleatoria:

```txt
a + b
```

o

```txt
a - b
```

Cada número aparece dentro de una burbuja grande.

Ejemplo:

```txt
[ 7 ]   +   [ 8 ]   =   [ ? ]
```

La burbuja de resultado empieza vacía.

---

## 2. Descomposición de burbujas

Al hacer click sobre una burbuja numérica, la burbuja se descompone en partes.

Ejemplo:

```txt
25
```

Se transforma en:

```txt
20 + 5
```

Ejemplo:

```txt
8
```

Puede transformarse en:

```txt
5 + 3
```

Ejemplo:

```txt
7
```

Puede transformarse en:

```txt
5 + 2
```

Las nuevas burbujas aparecen con una animación de separación o desintegración.

---

# Regla de descomposición

La primera versión debe favorecer descomposiciones útiles para cálculo mental.

## Para números menores que 10

Priorizar descomposición usando 5.

```txt
6 → 5 + 1
7 → 5 + 2
8 → 5 + 3
9 → 5 + 4
```

Para números pequeños:

```txt
2 → 1 + 1
3 → 2 + 1
4 → 2 + 2
5 → 5
```

## Para números de dos dígitos

Priorizar decenas y unidades.

```txt
12 → 10 + 2
25 → 20 + 5
38 → 30 + 8
47 → 40 + 7
```

Luego, las unidades también pueden descomponerse.

Ejemplo:

```txt
28
```

Primera descomposición:

```txt
20 + 8
```

Segunda descomposición sobre el `8`:

```txt
5 + 3
```

---

# 3. Burbujas draggables

Cada burbuja generada puede moverse libremente dentro del área de juego.

El niño puede arrastrar burbujas para acercarlas a otras.

Ejemplo:

```txt
[5]      [2]      [5]      [3]
```

El niño arrastra:

```txt
[5] + [5]
```

y las combina para formar:

```txt
[10]
```

Luego combina:

```txt
[2] + [3]
```

para formar:

```txt
[5]
```

Finalmente combina:

```txt
[10] + [5]
```

para formar:

```txt
[15]
```

---

# 4. Fusión de burbujas

Cuando dos burbujas compatibles se acercan o una se suelta encima de la otra, la app puede fusionarlas.

## Regla base para suma

Si el turno es una suma, al fusionar dos burbujas:

```txt
a + b → a + b
```

Ejemplo:

```txt
5 + 5 → 10
2 + 3 → 5
10 + 5 → 15
```

Visualmente:

```txt
dos burbujas se acercan
brillan
se fusionan
aparece una burbuja nueva con el resultado
```

## Regla base para resta

Para primera versión, la resta debe ser más guiada.

Ejemplo:

```txt
15 - 7
```

Puede trabajarse como:

```txt
15 = 10 + 5
7 = 5 + 2
10 + 5 - 5 - 2
10 - 2 = 8
```

Pero esto puede ser complejo para una primera versión.

Recomendación para MVP:

Primera versión enfocada en **sumas**.

Luego se agrega resta en una versión posterior.

---

# 5. Burbuja de resultado

La pantalla tiene una burbuja de resultado.

Ejemplo:

```txt
[ ? ]
```

El niño debe arrastrar la burbuja final hacia la burbuja de resultado.

Si el valor es correcto:

```txt
animación de éxito
sonido opcional
confetti de burbujas
mensaje positivo
nuevo turno
```

Si es incorrecto:

```txt
la burbuja rebota
mensaje suave de ayuda
no penaliza agresivamente
```

Ejemplo de mensaje:

```txt
“Casi. Intenta combinar primero los números que hacen 10.”
```

---

# MVP recomendado

Para la primera versión, limitaría el alcance para que sea implementable y fácil de probar.

## MVP funcional

La app debe permitir:

```txt
1. Generar una suma aleatoria.
2. Mostrar dos números en burbujas.
3. Hacer click en una burbuja para descomponerla.
4. Arrastrar burbujas.
5. Fusionar dos burbujas al soltarlas cerca.
6. Crear una nueva burbuja con la suma.
7. Arrastrar una burbuja al resultado.
8. Validar si el resultado es correcto.
9. Mostrar feedback visual.
10. Pasar al siguiente ejercicio.
```

## Operaciones del MVP

Solo sumas:

```txt
a + b
```

Rango sugerido:

```txt
a, b entre 2 y 19
```

Pero con configuración por dificultad.

---

# Niveles de dificultad

## Nivel 1: Sumas menores que 10

```txt
2 + 3
4 + 5
7 + 8
```

Objetivo:

```txt
descomposición con 5
pares que hacen 10
```

## Nivel 2: Sumas hasta 20

```txt
12 + 7
14 + 8
9 + 6
```

Objetivo:

```txt
decenas
unidades
completar 10
```

## Nivel 3: Sumas hasta 50

```txt
25 + 18
34 + 7
28 + 16
```

Objetivo:

```txt
decenas y unidades
sumas parciales
números redondos
```

---

# Pantallas

## 1. Pantalla de inicio

Elementos:

```txt
Título del juego
Breve explicación
Selector de nivel
Botón “Jugar”
```

Ejemplo:

```txt
Bubble Math Lab
Rompe, combina y descubre el resultado.
```

---

## 2. Pantalla de juego

Elementos:

```txt
Operación actual
Área de burbujas
Burbuja de resultado
Botón “Nuevo reto”
Botón “Reiniciar turno”
Indicador de nivel
Indicador de intentos o estrellas
```

Estructura visual:

```txt
------------------------------------------------
Nivel 1        Reto 3        ⭐ ⭐ ⭐

        [ 7 ]        +        [ 8 ]

              área de burbujas

                 [ ? ]
              resultado

[Reiniciar]                         [Nuevo reto]
------------------------------------------------
```

---

## 3. Pantalla o modal de éxito

Elementos:

```txt
Mensaje positivo
Resultado correcto
Botón “Siguiente”
```

Ejemplo:

```txt
¡Excelente!
7 + 8 = 15
Usaste descomposición para llegar al resultado.
```

---

# Estados principales

## Estado del juego

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

## Estado de una burbuja

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

---

# Reglas funcionales

## Generación de ejercicios

La app genera dos números según el nivel.

Ejemplo:

```js
level 1: 2 a 9
level 2: 5 a 19
level 3: 10 a 49
```

Para el MVP:

```txt
solo sumas
resultado máximo recomendado: 99
```

---

## Click en burbuja

Al hacer click:

```txt
si la burbuja se puede descomponer, desaparece y se crean nuevas burbujas
si no se puede descomponer, hace una pequeña animación indicando que no se divide más
```

Ejemplo:

```txt
7 → 5 + 2
18 → 10 + 8
25 → 20 + 5
```

---

## Drag and drop

Al arrastrar:

```txt
la burbuja sigue el cursor
se eleva visualmente
aparece glow
si está cerca de otra burbuja compatible, ambas brillan
```

Al soltar cerca de otra:

```txt
se fusionan
se eliminan las dos burbujas originales
se crea una nueva burbuja con la suma
```

---

## Validación del resultado

Si una burbuja se arrastra a la zona de resultado:

```txt
si bubble.value === expectedResult
  éxito
si no
  feedback de error suave
```

---

# Reglas pedagógicas

La app debe incentivar estrategias útiles.

## Mensajes de ayuda

Ejemplos:

```txt
“Busca dos burbujas que sumen 10.”
“Puedes romper el 8 en 5 y 3.”
“Combinar números redondos hace la suma más fácil.”
“Primero forma 10, luego suma lo que sobra.”
```

## No castigar demasiado

No usar mensajes como:

```txt
Incorrecto
Fallaste
Mal
```

Preferir:

```txt
“Todavía no. Prueba otra combinación.”
“Casi. Mira si puedes formar un número redondo.”
“Intenta descomponer una burbuja primero.”
```

---

# Interacciones visuales

## Burbuja normal

```txt
gradiente radial
borde suave
transparencia
sombra glow
animación flotante
```

## Burbuja al hover

```txt
aumenta ligeramente
más glow
cursor pointer
```

## Burbuja al hacer click

```txt
pulso
partículas pequeñas
descomposición en dos burbujas hijas
```

## Burbuja al arrastrar

```txt
escala 1.08
sombra fuerte
z-index alto
```

## Burbujas listas para fusionar

```txt
ambas brillan
línea o aura entre ellas
```

## Fusión

```txt
se atraen visualmente
se mezclan
aparece nueva burbuja
pequeño destello
```

## Resultado correcto

```txt
explosión de burbujas pequeñas
confetti circular
mensaje alegre
```

---

# Requerimientos no funcionales

## Accesibilidad básica

Aunque sea un juego visual, debe cuidar:

```txt
texto legible
contraste suficiente
botones claros
tamaños grandes
no depender solo del color
```

## Responsive

Debe funcionar en:

```txt
desktop
tablet
pantallas pequeñas
```

Para MVP, priorizar desktop/tablet porque drag and drop es más cómodo.

## Performance

Debe ser liviana.

```txt
sin librerías pesadas
sin canvas obligatorio en MVP
CSS animations simples
DOM controlado
```

---

# Fuera de alcance para MVP

No incluir inicialmente:

```txt
login
backend
base de datos
ranking global
sonidos complejos
multijugador
IA generativa
niveles infinitos complejos
restas avanzadas
sistema de cuentas
```

---

# Roadmap sugerido

## Versión 1 — MVP de sumas

```txt
sumas aleatorias
burbujas descomponibles
drag and drop
fusión
validación de resultado
feedback visual
```

## Versión 2 — Restas guiadas

```txt
restas simples
descomposición para prestar
visualización de quitar burbujas
modo “completa hasta”
```

## Versión 3 — Sistema de progreso

```txt
niveles
estrellas
racha de aciertos
historial local con localStorage
```

## Versión 4 — Mejoras sensoriales

```txt
sonidos
partículas
animaciones más ricas
modo oscuro/claro
personajes guía
```

---

# Criterios de aceptación del MVP

El MVP se considera listo cuando:

```txt
[ ] La app genera una suma aleatoria.
[ ] Los números aparecen en burbujas.
[ ] El usuario puede descomponer burbujas con click.
[ ] La descomposición sigue reglas útiles: 5s, decenas y unidades.
[ ] Las burbujas pueden arrastrarse.
[ ] Dos burbujas pueden fusionarse.
[ ] La fusión crea una burbuja con la suma.
[ ] El usuario puede colocar una burbuja en la zona de resultado.
[ ] La app valida si el resultado es correcto.
[ ] Hay feedback visual positivo o de ayuda.
[ ] Existe botón para reiniciar turno.
[ ] Existe botón para nuevo reto.
[ ] Todo funciona sin backend.
```

---

# Ejemplo de experiencia ideal

Operación:

```txt
7 + 8
```

Pantalla inicial:

```txt
[7] + [8] = [?]
```

El niño hace click en `7`:

```txt
[5] [2] + [8] = [?]
```

Hace click en `8`:

```txt
[5] [2] + [5] [3] = [?]
```

Arrastra `5` sobre `5`:

```txt
[10] [2] [3] = [?]
```

Arrastra `2` sobre `3`:

```txt
[10] [5] = [?]
```

Arrastra `10` sobre `5`:

```txt
[15] = [?]
```

Arrastra `15` al resultado:

```txt
¡Excelente! 7 + 8 = 15
```

---

# Frase guía del producto

> “No se trata de adivinar la respuesta; se trata de aprender a transformar los números hasta que la respuesta sea fácil.”
