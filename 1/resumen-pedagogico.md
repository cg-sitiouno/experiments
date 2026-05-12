# Resumen pedagógico del proyecto

## Objetivo del proyecto
Este proyecto es un portafolio/CV de estudiante diseñado como caso práctico de frontend. Su propósito es enseñar los conceptos básicos de HTML, CSS y JavaScript vanilla, sin frameworks ni dependencias externas.

## Estructura del proyecto
- `index.html`: estructura semántica de la página con secciones de encabezado, sobre mí, skills, proyectos, contacto y pie de página.
- `styles.css`: estilos del diseño, temas claro/oscuro, layout responsive, y explicaciones pedagógicas en comentarios.
- `app.js`: datos mock, renderizado dinámico de contenido, eventos de interacción y lógica del formulario.

## Secciones principales
1. **Header**
   - Avatar circular con iniciales.
   - Nombre y título profesional.
   - Botón para alternar el tema oscuro.
2. **Sobre mí**
   - Párrafos generados desde JavaScript.
3. **Skills**
   - Chips de tecnologías generadas desde un array.
4. **Proyectos destacados**
   - Tarjetas con título, descripción y enlace.
5. **Contacto**
   - Formulario visual que muestra una alerta al enviar.
6. **Footer**
   - Mensaje breve de pie de página.

## Conceptos pedagógicos
- HTML semántico: uso de `header`, `main`, `section`, `footer`.
- CSS moderno: variables, selectores de atributos, flexbox, grid, media queries y transiciones.
- JavaScript vanilla: arrays, objetos literales, DOM API, listeners de eventos, `preventDefault()` y `FormData`.
- Separación de responsabilidades: contenido en HTML, presentación en CSS y comportamiento en JS.

## Funcionalidades clave
- Tema claro/oscuro con atributo `data-tema` en el `body`.
- Renderizado dinámico de skills, proyectos y párrafos de sobre mí.
- Formulario de contacto simulado sin backend.
- Diseño responsive para móvil y escritorio.

## Valor de aprendizaje
Este proyecto permite practicar:
- crear una interfaz completa desde cero,
- trabajar con datos mock en JavaScript,
- manipular el DOM de forma segura,
- gestionar eventos y formularios,
- aplicar buenas prácticas de diseño y estructura.

## Extensiones sugeridas
- Guardar datos del formulario en `localStorage`.
- Añadir validación más robusta.
- Incluir navegación fija o scroll suave.
- Ampliar el listado de proyectos.
