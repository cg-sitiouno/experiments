// Datos del juego Fuerza Vocal
// Cada ítem muestra una VOCAL con una palabra de ejemplo.
// El jugador clasifica la vocal como "fuerte" (a, e, o) o "debil" (i, u).
// 27 ítems por nivel — el motor usa mazo rotativo para evitar repeticiones.

const ROUNDS = {

  // ── Nivel 1: palabras cortas y familiares ─────────────────────────────────
  1: [
    // Vocales fuertes: a, e, o
    { vowel: "a", word: "gato",   answer: "fuerte" },
    { vowel: "a", word: "mano",   answer: "fuerte" },
    { vowel: "a", word: "rana",   answer: "fuerte" },
    { vowel: "a", word: "árbol",  answer: "fuerte" },
    { vowel: "a", word: "tabla",  answer: "fuerte" },
    { vowel: "e", word: "mesa",   answer: "fuerte" },
    { vowel: "e", word: "queso",  answer: "fuerte" },
    { vowel: "e", word: "tren",   answer: "fuerte" },
    { vowel: "e", word: "verde",  answer: "fuerte" },
    { vowel: "o", word: "boca",   answer: "fuerte" },
    { vowel: "o", word: "rojo",   answer: "fuerte" },
    { vowel: "o", word: "globo",  answer: "fuerte" },
    { vowel: "o", word: "lobo",   answer: "fuerte" },
    { vowel: "o", word: "mono",   answer: "fuerte" },
    // Vocales débiles: i, u
    { vowel: "i", word: "pino",   answer: "debil" },
    { vowel: "i", word: "libro",  answer: "debil" },
    { vowel: "i", word: "niño",   answer: "debil" },
    { vowel: "i", word: "isla",   answer: "debil" },
    { vowel: "i", word: "silla",  answer: "debil" },
    { vowel: "u", word: "uva",    answer: "debil" },
    { vowel: "u", word: "nube",   answer: "debil" },
    { vowel: "u", word: "dulce",  answer: "debil" },
    { vowel: "u", word: "nudo",   answer: "debil" },
    { vowel: "u", word: "pulpo",  answer: "debil" },
    { vowel: "a", word: "casa",   answer: "fuerte" },
    { vowel: "e", word: "leche",  answer: "fuerte" },
    { vowel: "o", word: "toro",   answer: "fuerte" },
  ],

  // ── Nivel 2: palabras más largas y menos inmediatas ───────────────────────
  2: [
    { vowel: "a", word: "camisa",    answer: "fuerte" },
    { vowel: "a", word: "paloma",    answer: "fuerte" },
    { vowel: "a", word: "naranja",   answer: "fuerte" },
    { vowel: "a", word: "manzana",   answer: "fuerte" },
    { vowel: "a", word: "banana",    answer: "fuerte" },
    { vowel: "e", word: "cerezo",    answer: "fuerte" },
    { vowel: "e", word: "peine",     answer: "fuerte" },
    { vowel: "e", word: "veneno",    answer: "fuerte" },
    { vowel: "e", word: "espejo",    answer: "fuerte" },
    { vowel: "o", word: "cohete",    answer: "fuerte" },
    { vowel: "o", word: "cocodrilo", answer: "fuerte" },
    { vowel: "o", word: "corona",    answer: "fuerte" },
    { vowel: "o", word: "contorno",  answer: "fuerte" },
    { vowel: "o", word: "fotógrafo", answer: "fuerte" },
    { vowel: "i", word: "girasol",   answer: "debil" },
    { vowel: "i", word: "pingüino",  answer: "debil" },
    { vowel: "i", word: "difícil",   answer: "debil" },
    { vowel: "i", word: "camino",    answer: "debil" },
    { vowel: "i", word: "violin",    answer: "debil" },
    { vowel: "u", word: "cumpleaños",answer: "debil" },
    { vowel: "u", word: "murciélago",answer: "debil" },
    { vowel: "u", word: "brusco",    answer: "debil" },
    { vowel: "u", word: "brújula",   answer: "debil" },
    { vowel: "u", word: "nublado",   answer: "debil" },
    { vowel: "a", word: "zanahoria", answer: "fuerte" },
    { vowel: "e", word: "semáforo",  answer: "fuerte" },
    { vowel: "i", word: "misión",    answer: "debil" },
  ],

  // ── Nivel 3: vocales en diptongos y posiciones menos evidentes ───────────
  // La vocal indicada aparece junto a otra vocal — el jugador debe identificar
  // si la vocal señalada es fuerte o débil en ese contexto.
  3: [
    // Vocales fuertes en diptongo
    { vowel: "a", word: "maíz",      answer: "fuerte" },
    { vowel: "e", word: "reino",     answer: "fuerte" },
    { vowel: "e", word: "peina",     answer: "fuerte" },
    { vowel: "o", word: "boina",     answer: "fuerte" },
    { vowel: "a", word: "traición",  answer: "fuerte" },
    { vowel: "e", word: "deuda",     answer: "fuerte" },
    { vowel: "o", word: "heroína",   answer: "fuerte" },
    { vowel: "a", word: "bailar",    answer: "fuerte" },
    { vowel: "e", word: "Europa",    answer: "fuerte" },
    // Vocales débiles en diptongo (forman una sola sílaba con la fuerte)
    { vowel: "i", word: "cielo",     answer: "debil" },
    { vowel: "i", word: "fiesta",    answer: "debil" },
    { vowel: "u", word: "suave",     answer: "debil" },
    { vowel: "u", word: "cuadro",    answer: "debil" },
    { vowel: "i", word: "hielo",     answer: "debil" },
    { vowel: "u", word: "fuego",     answer: "debil" },
    { vowel: "i", word: "viaje",     answer: "debil" },
    { vowel: "u", word: "guardar",   answer: "debil" },
    { vowel: "i", word: "nación",    answer: "debil" },
    // Repaso mixto
    { vowel: "a", word: "galaxia",   answer: "fuerte" },
    { vowel: "e", word: "pradera",   answer: "fuerte" },
    { vowel: "o", word: "proceso",   answer: "fuerte" },
    { vowel: "i", word: "idioma",    answer: "debil" },
    { vowel: "u", word: "musical",   answer: "debil" },
    { vowel: "a", word: "planeta",   answer: "fuerte" },
    { vowel: "e", word: "efecto",    answer: "fuerte" },
    { vowel: "i", word: "rapidez",   answer: "debil" },
    { vowel: "u", word: "tributo",   answer: "debil" },
  ],

};
