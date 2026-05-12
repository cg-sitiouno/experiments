/* ============================================
   JAVASCRIPT VANILLA — GUÍA PEDAGÓGICA
   ============================================

   TEMAS CUBIERTOS:
   1. Constantes y Arrays
   2. Objetos literales
   3. Seleccionar elementos del DOM
   4. template literals (backticks)
   5. forEach para iterar
   6. createElement y appendChild
   7. addEventListener
   8. preventDefault en formularios
   9. Funciones
   10. toggle para clases CSS

   ============================================ */

/* --------------------------------------------
   1. DATOS MOCKEADOS — CONSTANTES Y ARRAYS
   --------------------------------------------
   const crea una variable que NO puede ser reasignada.
   Arrays ([]) guardan listas ordenadas de valores.
   Usamos mock data porque aún no hay backend real.
*/
const skills = [
    'HTML',
    'CSS',
    'JavaScript',
    'Git',
    'Figma',
    'React'
];

const proyectos = [
    {
        titulo: 'Portafolio personal',
        descripcion: 'Sitio web para mostrar mis proyectos y habilidades.',
        enlace: '#'
    },
    {
        titulo: 'App de tareas',
        descripcion: 'Lista de tareas con opción de marcar como completadas.',
        enlace: '#'
    },
    {
        titulo: 'Landing page',
        descripcion: 'Página de presentación para un negocio local.',
        enlace: '#'
    }
];

/* Sobre mí como array de párrafos (más fácil de mantener y traducir) */
const sobreMi = [
    'Soy estudiante de desarrollo web con pasión por crear experiencias digitales funcionales y atractivas.',
    'Estoy en constante aprendizaje de nuevas tecnologías.',
    'Me interesa el diseño UI/UX y la accesibilidad web. Busco oportunidades para aplicar mis conocimientos en proyectos reales.'
];

/* Inicial para el avatar: primeras letras del nombre (mock) */
const nombreCompleto = 'Ana García';
const inicial = nombreCompleto.split(' ').map(p => p[0]).join('');

/* --------------------------------------------
   2. SELECCIONAR ELEMENTOS DEL DOM
   --------------------------------------------
   document.getElementById('id') busca un elemento por su atributo id.
   El id es único en el documento, por eso es el selector más rápido.
   Si el elemento no existe, retorna null (podemos verificarlo con if).
*/
const avatarEl = document.getElementById('avatar');
const skillsListaEl = document.getElementById('skills-lista');
const proyectosGridEl = document.getElementById('proyectos-grid');
const sobreMiContenidoEl = document.querySelector('.sobre-mi__contenido');
const btnTemaEl = document.getElementById('btn-tema');
const formEl = document.getElementById('form-contacto');

/* También podemos usar querySelector para selectores CSS:
   document.querySelector('.clase') — primero que coincida
   document.querySelectorAll('.clase') — todos como NodeList
*/

/* --------------------------------------------
   3. MODIFICAR CONTENIDO DE ELEMENTOS
   --------------------------------------------
   textContent setter cambia el texto visible de un elemento.
   Es seguro contra XSS (no interpreta HTML).
   innerHTML podría interpretar HTML (evitar con datos de usuario).
*/
avatarEl.textContent = inicial;

/* --------------------------------------------
   4. CREAR Y AGREGAR ELEMENTOS AL DOM
   --------------------------------------------
   Flujo para crear nodos dinámicamente:
   1. document.createElement('tipo') — crea el elemento vacío
   2. Asignar propiedades (textContent, className, href, etc.)
   3. elementoPadre.appendChild(elemento) — lo agrega al DOM

   Ventaja: no requiere strings de HTML (más seguro y legible).
*/

/**
 * Crea un elemento HTML con texto y opcionalmente una clase.
 * @param {string} tag — Tipo de elemento (div, span, a, etc.)
 * @param {string} texto — Contenido de texto
 * @param {string} [clase] — Clase CSS opcional
 * @returns {HTMLElement} — El elemento creado
 */
function crearElemento(tag, texto, clase) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;
    if (clase) {
        elemento.className = clase;
    }
    return elemento;
}

/* Renderizar skills */
skills.forEach(function(skill) {
    const chip = crearElemento('span', skill, 'skill-chip');
    skillsListaEl.appendChild(chip);
});

/* Renderizar proyectos con más datos */
proyectos.forEach(function(proy) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';

    const titulo = document.createElement('h3');
    titulo.className = 'tarjeta__titulo';
    titulo.textContent = proy.titulo;

    const desc = document.createElement('p');
    desc.className = 'tarjeta__descripcion';
    desc.textContent = proy.descripcion;

    const link = document.createElement('a');
    link.className = 'tarjeta__link';
    link.href = proy.enlace;
    link.textContent = 'Ver proyecto →';

    tarjeta.appendChild(titulo);
    tarjeta.appendChild(desc);
    tarjeta.appendChild(link);
    proyectosGridEl.appendChild(tarjeta);
});

/* Renderizar párrafos de "Sobre mí" */
sobreMi.forEach(function(parrafo) {
    const p = crearElemento('p', parrafo);
    sobreMiContenidoEl.appendChild(p);
});

/* --------------------------------------------
   5. EVENT LISTENERS
   --------------------------------------------
   addEventListener(evento, funcion) adjunta un detector de eventos.
   La función se ejecuta cada vez que ocurre el evento.

   'click' — cuando el usuario hace clic
   'submit' — cuando se envía un formulario
   'input' — cuando el usuario escribe en un input
   'load' — cuando la página termina de cargar
*/

/* Toggle tema claro/oscuro */
btnTemaEl.addEventListener('click', function() {
    const body = document.body;

    if (body.getAttribute('data-tema') === 'dark') {
        body.removeAttribute('data-tema');
        btnTemaEl.textContent = 'Cambiar tema';
    } else {
        body.setAttribute('data-tema', 'dark');
        btnTemaEl.textContent = 'Tema claro';
    }
});

/* Formulario de contacto */
formEl.addEventListener('submit', function(evento) {
    /* preventDefault() evita que el formulario se envíe realmente.
       Sin esto, la página se recargaría y perderíamos el mensaje. */
    evento.preventDefault();

    /* Los datos del formulario están en evento.target (el form).
       new FormData(form) extrae los valores de cada campo con name. */
    const datos = new FormData(evento.target);

    const nombre = datos.get('nombre');
    const email = datos.get('email');

    /* alert() muestra una ventana emergente nativa del navegador.
       Es útil para debugging pero NO para producción (mejores alternativas: toast, modal). */
    alert('¡Gracias ' + nombre + '! Tu mensaje fue enviado (simulación).');

    /* reset() limpia todos los campos del formulario */
    formEl.reset();
});

/* --------------------------------------------
   6. FUNCIONES UTILITARIAS
   --------------------------------------------
   Funciones son bloques de código reutilizables.
   Pueden recibir parámetros (entrada) y retornar valores (salida).

   Función flecha (arrow function): forma más concisa de escribir funciones.
   function() {} === () => {}
*/

/* Ejemplo: función para formatear texto */
function formatearTexto(texto) {
    return texto.trim().toLowerCase();
}

/* --------------------------------------------
   7. MANIPULACIÓN DE ATRIBUTOS
   --------------------------------------------
   setAttribute(nombre, valor) — establece un atributo
   getAttribute(nombre) — lee un atributo
   removeAttribute(nombre) — elimina un atributo
   classList.toggle(clase) — agrega o quita una clase
*/

/* En el toggle de arriba usamos getAttribute/setAttribute.
   classList.toggle es más limpio para clases: toggle() agrega si no existe,
   la quita si ya existe. */

/* Ejemplo alternativo del toggle con classList (comentado):
btnTemaEl.addEventListener('click', function() {
    document.body.classList.toggle('theme-dark');
});
*/

/* --------------------------------------------
   8. CONSOLA PARA DEBUG
   --------------------------------------------
   console.log() imprime valores en la consola del navegador.
   Útil para verificar que el código se ejecuta y ver valores de variables.
   En VS Code: F12 o click derecho > Inspeccionar > Consola.
*/

/* Log al cargar para verificar que el script funciona */
/* console.log('app.js cargado. Skills:', skills.length); */
/* console.log('Proyectos:', proyectos); */

/* --------------------------------------------
   CONCEPTOS CLAVE PARA RECORDAR
   --------------------------------------------

   1. CONST vs LET:
      const — no se puede reasignar (para datos que no cambian)
      let — se puede reasignar (para contadores, valores temporales)
      var — obsoleto, evitar

   2. ARRAYS: Lista ordenada. Métodos útiles:
      - forEach(fn) — ejecutar función para cada item
      - map(fn) — transformar cada item
      - filter(fn) — mantener solo los que cumplen condición
      - find(fn) — buscar primero que cumple condición

   3. OBJETOS: Pares clave-valor. Acceso con obj.clave o obj['clave'].

   4. DOM:
      getElementById — más rápido, para elementos únicos
      querySelector — CSS selectors, flexibility
      querySelectorAll — todos los que coinciden (NodeList)

   5. CREAR ELEMENTOS:
      createElement → asignar propiedades → appendChild

   6. EVENTOS:
      addEventListener(evento, funcion)
      preventDefault() en formularios
      La función recibe el evento como parámetro

   7. FORMULARIOS:
      FormData(form) extrae los datos
      reset() limpia el formulario
      preventDefault() evita recarga

   8. TEMPLATE LITERALS:
      `Hola ${nombre}` vs 'Hola ' + nombre
      Los backticks permiten interpolar variables y multilínea
*/