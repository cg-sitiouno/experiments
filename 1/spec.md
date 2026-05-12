Problema de referencia — Perfil de estudiante
Este documento es la especificación del caso que usamos para practicar el mecanismo: requerimiento → análisis con IA → backlog de TODOs → implementación por capas → verificación en navegador.

Usuario
Estudiante universitario que quiere una página tipo CV/portfolio muy simple.

Pantallas / secciones
Encabezado con nombre, título pretendido (ej. “Desarrolladora web en formación”) y foto placeholder (cuadrado con iniciales si no hay imagen).
Sobre mí — dos párrafos cortos (texto fijo en HTML o desde un string en JS).
Skills — lista de chips (HTML + CSS + JS, Git, Figma…).
Proyectos destacados — tarjetas con título, descripción de una línea y link “Ver” (puede ser href="#").
Contacto — formulario solo visual (nombre, email, mensaje) que al “enviar” muestra un alert() o un mensaje en pantalla (no hay backend).
Datos mockeados
En app.js, array de proyectos:

const proyectos = [
  { titulo: '…', descripcion: '…' },
  // …
];
Renderizar las tarjetas desde JS al cargar la página.

Interacción mínima
- Botón “Cambiar tema” que alterna clase en <body> (theme-light / theme-dark) con estilos distintos en CSS.

Relación con Fase 1 y Fase 2
Los archivos numerados en project-briefs/ (15 briefs disponibles) definen Fase 1 (fin del encuentro, ya en GitHub) y Fase 2 (hasta el domingo; confirmar hora con el docente). Este perfil estudiante es el caso de referencia en el salón: lo anterior equivale, en espíritu, a un MVP de Fase 1. Si se usara como proyecto oficial, la Fase 2 sería una ampliación acordada (por ejemplo: más proyectos mock, localStorage en el formulario, navegación fija).

Resultado esperado
- Se ve bien en 375px de ancho y en escritorio básico.

- Sin consola roja.

- Tres archivos en la raíz del repo del caso de referencia.
