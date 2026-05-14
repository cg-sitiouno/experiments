// Datos del juego Máquina del Tiempo Verbal
// 27 oraciones por nivel — el motor usa un mazo rotativo para evitar repeticiones.

const ROUNDS = {

  // ── Nivel 1: verbos simples y muy claros ─────────────────────────────────
  1: [
    // Pasado
    { text: "Yo corrí en el parque.",              answer: "pasado"   },
    { text: "Ella comió una manzana.",              answer: "pasado"   },
    { text: "Ayer llovió mucho.",                   answer: "pasado"   },
    { text: "El perro ladró fuerte.",               answer: "pasado"   },
    { text: "Juan salió de casa.",                  answer: "pasado"   },
    { text: "La niña durmió temprano.",             answer: "pasado"   },
    { text: "Nosotros jugamos en el patio.",        answer: "pasado"   },
    { text: "Tú comiste todo el postre.",           answer: "pasado"   },
    { text: "Mi mamá llegó tarde.",                 answer: "pasado"   },
    // Presente
    { text: "Ella salta muy alto.",                 answer: "presente" },
    { text: "La niña canta una canción.",           answer: "presente" },
    { text: "El sol brilla hoy.",                   answer: "presente" },
    { text: "Yo leo un cuento.",                    answer: "presente" },
    { text: "Los pájaros cantan en el árbol.",      answer: "presente" },
    { text: "Mi hermano dibuja muy bien.",          answer: "presente" },
    { text: "Nosotros comemos en familia.",         answer: "presente" },
    { text: "El gato duerme en el sofá.",           answer: "presente" },
    { text: "La maestra escribe en la pizarra.",    answer: "presente" },
    // Futuro
    { text: "Nosotros jugaremos mañana.",           answer: "futuro"   },
    { text: "Tú viajarás en avión.",                answer: "futuro"   },
    { text: "Papá comprará un regalo.",             answer: "futuro"   },
    { text: "Iremos al cine el sábado.",            answer: "futuro"   },
    { text: "Ella cantará en el festival.",         answer: "futuro"   },
    { text: "Mañana estudiaré mis lecciones.",      answer: "futuro"   },
    { text: "Esta noche lloverá.",                  answer: "futuro"   },
    { text: "El próximo mes visitaré a mi abuela.", answer: "futuro"   },
    { text: "Mañana será mi cumpleaños.",           answer: "futuro"   },
  ],

  // ── Nivel 2: imperfecto, habitual y frases con contexto ──────────────────
  2: [
    // Pasado
    { text: "Estudiaba en casa todas las tardes.",        answer: "pasado"   },
    { text: "De niño jugaba en la plaza.",                answer: "pasado"   },
    { text: "Antes dormía muy tarde.",                    answer: "pasado"   },
    { text: "Ayer fui al mercado con mamá.",              answer: "pasado"   },
    { text: "Siempre cantaba cuando cocinaba.",           answer: "pasado"   },
    { text: "Mi papá trabajaba en el campo.",             answer: "pasado"   },
    { text: "El año pasado viajamos a la playa.",         answer: "pasado"   },
    { text: "Cuando era niña, corría mucho.",             answer: "pasado"   },
    { text: "La semana pasada visité al médico.",         answer: "pasado"   },
    // Presente
    { text: "Los pájaros vuelan alto en el cielo.",       answer: "presente" },
    { text: "Ahora mismo leo un libro interesante.",      answer: "presente" },
    { text: "Todos los días camino al colegio.",          answer: "presente" },
    { text: "En este momento hace calor afuera.",         answer: "presente" },
    { text: "Mi abuela cocina muy rico.",                 answer: "presente" },
    { text: "Siempre que llueve, me quedo en casa.",      answer: "presente" },
    { text: "Hoy tenemos clase de música.",               answer: "presente" },
    { text: "El perro ladra cuando llega alguien.",       answer: "presente" },
    { text: "Nosotros vivimos cerca del parque.",         answer: "presente" },
    // Futuro
    { text: "Ella viajará pronto al campo.",              answer: "futuro"   },
    { text: "El año que viene iré a la playa.",           answer: "futuro"   },
    { text: "Cuando sea grande seré doctor.",             answer: "futuro"   },
    { text: "Pronto habrá vacaciones escolares.",         answer: "futuro"   },
    { text: "La semana que viene tendremos examen.",      answer: "futuro"   },
    { text: "Mañana iremos todos juntos al parque.",      answer: "futuro"   },
    { text: "El próximo año cambiaré de colegio.",        answer: "futuro"   },
    { text: "Esta tarde jugaremos al fútbol.",            answer: "futuro"   },
    { text: "En diciembre celebraremos las fiestas.",     answer: "futuro"   },
  ],

  // ── Nivel 3: oraciones complejas con marcadores temporales variados ───────
  3: [
    // Pasado
    { text: "El perro había corrido toda la tarde.",                    answer: "pasado"   },
    { text: "La maestra explicó el tema dos veces.",                    answer: "pasado"   },
    { text: "Hace mucho tiempo vivían dinosaurios.",                    answer: "pasado"   },
    { text: "Los romanos construyeron el Coliseo.",                     answer: "pasado"   },
    { text: "Cuando llegamos, la fiesta ya había terminado.",           answer: "pasado"   },
    { text: "El equipo había entrenado mucho antes del partido.",       answer: "pasado"   },
    { text: "La civilización maya desarrolló un sistema matemático.",   answer: "pasado"   },
    { text: "En aquellos tiempos la gente viajaba a caballo.",          answer: "pasado"   },
    { text: "Mis abuelos se conocieron en un baile del pueblo.",        answer: "pasado"   },
    // Presente
    { text: "En este momento está lloviendo fuerte.",                   answer: "presente" },
    { text: "Los niños juegan en el patio ahora.",                      answer: "presente" },
    { text: "Hoy celebramos el día del maestro.",                       answer: "presente" },
    { text: "Siempre que llueve, ella canta en la ventana.",            answer: "presente" },
    { text: "El volcán activo libera gases constantemente.",            answer: "presente" },
    { text: "En esta ciudad viven más de un millón de personas.",       answer: "presente" },
    { text: "La ciencia avanza más rápido cada año.",                   answer: "presente" },
    { text: "Los científicos investigan la vida en Marte.",             answer: "presente" },
    { text: "El español se habla en muchos países del mundo.",          answer: "presente" },
    // Futuro
    { text: "El próximo año visitaremos a los abuelos.",                answer: "futuro"   },
    { text: "Mañana habrá una fiesta en el salón.",                     answer: "futuro"   },
    { text: "La semana que viene empezarán las vacaciones.",            answer: "futuro"   },
    { text: "Para mañana habré terminado la tarea.",                    answer: "futuro"   },
    { text: "El próximo siglo traerá grandes cambios tecnológicos.",    answer: "futuro"   },
    { text: "Cuando termine el colegio, estudiaré medicina.",           answer: "futuro"   },
    { text: "En el futuro los cohetes viajarán a Marte.",               answer: "futuro"   },
    { text: "La reunión de mañana definirá el plan de trabajo.",        answer: "futuro"   },
    { text: "Cuando crezcas, entenderás muchas cosas de la vida.",      answer: "futuro"   },
  ],

};
