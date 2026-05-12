# Resumen pedagógico del proyecto

Este proyecto es una mini página de perfil / portafolio creada con HTML, CSS y JavaScript vanilla. Está diseñado para que estudiantes de desarrollo web aprendan conceptos front-end básicos sin depender de frameworks ni servidores.

## Objetivo

- Mostrar cómo construir una interfaz completa usando solo tecnologías web estándar.
- Enseñar buenas prácticas de estructura de archivos, estilos y manipulación del DOM.
- Ilustrar conceptos de programación con ejemplos claros y didácticos.

## Archivos principales

- `index.html` — estructura semántica de la página.
- `styles.css` — estilos visuales, tema claro/oscuro, diseño responsivo y componentes.
- `app.js` — lógica de la página: generación dinámica del contenido y comportamiento interactivo.
- `README.md` — descripción general del proyecto.
- `TODOS.md` — seguimiento de tareas y mejoras pendientes.

## Qué contiene la página

1. **Header**
   - Avatar circular con iniciales.
   - Nombre del estudiante.
   - Título profesional.
   - Botón para alternar tema claro/oscuro.

2. **Sección "Sobre mí"**
   - Texto generado desde JavaScript en forma de párrafos.
   - Ejemplo de uso de arrays y renderizado dinámico.

3. **Skills**
   - Pequeñas etiquetas (`chips`) que se crean desde un array.
   - Ejemplo de iteración con `forEach` y manipulación del DOM.

4. **Proyectos destacados**
   - Tarjetas generadas dinámicamente a partir de un array de objetos.
   - Muestra cómo estructurar datos y renderizarlos en HTML.

5. **Formulario de contacto**
   - Captura nombre, email y mensaje.
   - Simula envío de datos con `preventDefault()` y `alert()`.

6. **Footer**
   - Texto final simple de la página.

## Conceptos pedagógicos clave

### HTML

- Uso de etiquetas semánticas como `<header>`, `<main>`, `<section>`, `<footer>`.
- Estructura accesible con `label` y `for` en formularios.
- Inclusión de enlaces y botones.

### CSS

- Variables CSS (`--variable`) para colores y espaciado.
- Tema claro/oscuro usando atributo `data-tema` en `<body>`.
- Diseño responsivo con `flexbox`, `grid` y media queries.
- Estilos para botones, tarjetas y formularios.
- Buenas prácticas de nombres de clases y componentes.

### JavaScript

- Declaración de constantes con `const`.
- Arrays y objetos literales para datos mock.
- Selección de elementos del DOM (`getElementById`, `querySelector`).
- Creación y manipulación de elementos con `createElement`, `textContent` y `appendChild`.
- Uso de funciones auxiliares para simplificar renderizado.
- Eventos: `click` para cambiar tema y `submit` para procesar formulario.
- Prevención del envío por defecto con `preventDefault()`.
- Uso de `FormData` para leer valores de formulario.

## Cómo usar el proyecto

- Abre `index.html` directamente en el navegador.
- No necesita servidor ni instalación.
- Revisa `app.js` para modificar los textos, skills y proyectos.
- Cambia los estilos en `styles.css` para practicar diseño.

## Posibles extensiones didácticas

- Agregar validación de formulario más avanzada.
- Guardar los datos de los proyectos en `localStorage`.
- Añadir navegación fija y secciones de menú.
- Crear animaciones CSS suaves en cards y botones.
- Implementar filtros para skills o proyectos.

---

Este proyecto es ideal para repasar y practicar conceptos básicos de frontend antes de avanzar a frameworks y aplicaciones más complejas.