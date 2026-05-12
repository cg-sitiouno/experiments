# Perfil de Estudiante — Caso de Referencia

Proyecto simple de página CV/portfolio para estudiantes, usado como caso práctico para aprender desarrollo frontend con HTML, CSS y JavaScript vanilla.

---

## Archivos del proyecto

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Estructura HTML semántica de la página |
| `styles.css` | Estilos CSS + guía pedagógica integrada |
| `app.js` | Lógica JavaScript + guía pedagógica integrada |
| `TODOS.md` | Seguimiento de tareas implementadas |
| `README.md` | Este archivo |

---

## Cómo funciona

Abre `index.html` en un navegador (doble click o `file:///`). No requiere servidor.

### Secciones de la página

1. **Header** — Avatar circular con iniciales (generadas desde el nombre), nombre, título y botón para cambiar tema.
2. **Sobre mí** — Dos párrafos renderizados desde JavaScript.
3. **Skills** — Chips de tecnologías, generados desde array JS.
4. **Proyectos** — Tarjetas con título, descripción y enlace, generadas desde array JS.
5. **Contacto** — Formulario visual. Al enviar muestra un alert con los datos (simulación, sin backend).
6. **Footer** — Pie de página simple.

---

## Tecnologías usadas

- HTML5 semántico (header, main, section, footer)
- CSS3: variables, flexbox, grid, media queries, transiciones
- JavaScript ES6: arrays, objetos, DOM API, event listeners
- **Sin frameworks, sin CDNs, sin dependencias**

---

## Estructura de datos (en app.js)

```javascript
const skills = ['HTML', 'CSS', 'JavaScript', ...];
const proyectos = [{ titulo: '...', descripcion: '...', enlace: '...' }, ...];
const sobreMi = ['Párrafo 1', 'Párrafo 2'];
const nombreCompleto = 'Ana García'; // genera la inicial del avatar
```

Los datos están mockeados. Para cambiarlos, editá los arrays en `app.js`.

---

## Responsive (breakpoints)

| Viewport | Comportamiento |
|----------|----------------|
| < 768px | Mobile: tarjetas en 1 columna |
| 768px+ | Tablet: tarjetas en 2 columnas |
| 1024px+ | Desktop: mayor espaciado |

---

## Tema claro / oscuro

El botón "Cambiar tema" alterna el atributo `data-tema` en el `<body>`:
- Sin atributo → tema claro (default)
- `data-tema="dark"` → tema oscuro

Los colores se definen en variables CSS en `:root`, reescritas con `[data-tema="dark"]`.

---

## Aprendiendo con este proyecto

Cada archivo incluye comentarios pedagógicos explicando los conceptos usados:

### styles.css
- Variables CSS (Custom Properties)
- Selectores de atributos `[data-tema="dark"]`
- BEM naming (`.bloque__elemento--modificador`)
- Flexbox (`display: flex`, `align-items`, `justify-content`)
- CSS Grid (`display: grid`, `grid-template-columns`)
- Media queries mobile-first
- Transiciones y pseudoclases (`:hover`, `:focus`)
- Reset y box-sizing

### app.js
- Constantes y arrays
- Objetos literales
- DOM: `getElementById`, `querySelector`, `createElement`, `appendChild`
- Template literals (backticks)
- `forEach` para iterar arrays
- `addEventListener` para eventos
- `preventDefault` en formularios
- `FormData` para extraer datos de inputs
- Funciones y arrow functions

---

## Extensiones sugeridas (Fase 2)

- Guardar datos en localStorage (persistencia en navegador)
- Añadir navegación fija
- Más proyectos en el array mock
- Validación de email más robusta
- Animaciones CSS adicionales

---

## Requisitos verificados

- Se ve bien en 375px de ancho y en escritorio
- Sin errores en consola del navegador
- Tres archivos en la raíz del proyecto