// Datos del juego Tren de Sílabas
// Clasifica palabras por su número de sílabas:
//   count 1 → Monosílaba | 2 → Bisílaba | 3 → Trisílaba | 4 → Polisílaba (4+)
// 27 ítems por nivel — motor de mazo rotativo.

const ROUNDS = {

  // ── Nivel 1: palabras cortas y muy familiares ─────────────────────────────
  1: [
    // Monosílabas (1)
    { word: "sol",     syllables: ["sol"],                count: 1 },
    { word: "luz",     syllables: ["luz"],                count: 1 },
    { word: "pan",     syllables: ["pan"],                count: 1 },
    { word: "flor",    syllables: ["flor"],               count: 1 },
    { word: "mar",     syllables: ["mar"],                count: 1 },
    { word: "tren",    syllables: ["tren"],               count: 1 },
    // Bisílabas (2)
    { word: "casa",    syllables: ["ca",  "sa"],          count: 2 },
    { word: "gato",    syllables: ["ga",  "to"],          count: 2 },
    { word: "mesa",    syllables: ["me",  "sa"],          count: 2 },
    { word: "árbol",   syllables: ["ár",  "bol"],         count: 2 },
    { word: "niño",    syllables: ["ni",  "ño"],          count: 2 },
    { word: "luna",    syllables: ["lu",  "na"],          count: 2 },
    // Trisílabas (3)
    { word: "camisa",  syllables: ["ca",  "mi",  "sa"],  count: 3 },
    { word: "paloma",  syllables: ["pa",  "lo",  "ma"],  count: 3 },
    { word: "conejo",  syllables: ["co",  "ne",  "jo"],  count: 3 },
    { word: "muñeca",  syllables: ["mu",  "ñe",  "ca"],  count: 3 },
    { word: "bonito",  syllables: ["bo",  "ni",  "to"],  count: 3 },
    { word: "zapato",  syllables: ["za",  "pa",  "to"],  count: 3 },
    // Polisílabas (4+)
    { word: "mariposa",   syllables: ["ma", "ri", "po", "sa"],       count: 4 },
    { word: "dinosaurio", syllables: ["di", "no", "sau", "rio"],     count: 4 },
    { word: "zanahoria",  syllables: ["za", "na", "ho", "ria"],      count: 4 },
    { word: "cocodrilo",  syllables: ["co", "co", "dri", "lo"],      count: 4 },
    { word: "helicóptero",syllables: ["he","li","cóp","te","ro"],    count: 4 },
    { word: "televisión", syllables: ["te", "le", "vi", "sión"],     count: 4 },
    // Repaso bisílabas
    { word: "libro",   syllables: ["li",  "bro"],         count: 2 },
    { word: "perro",   syllables: ["pe",  "rro"],         count: 2 },
    { word: "leche",   syllables: ["le",  "che"],         count: 2 },
  ],

  // ── Nivel 2: palabras menos inmediatas, más variadas ─────────────────────
  2: [
    // Monosílabas
    { word: "voz",    syllables: ["voz"],               count: 1 },
    { word: "cruz",   syllables: ["cruz"],              count: 1 },
    { word: "rey",    syllables: ["rey"],               count: 1 },
    { word: "vez",    syllables: ["vez"],               count: 1 },
    { word: "pez",    syllables: ["pez"],               count: 1 },
    // Bisílabas
    { word: "jardín",   syllables: ["jar",  "dín"],     count: 2 },
    { word: "volcán",   syllables: ["vol",  "cán"],     count: 2 },
    { word: "cohete",   syllables: ["co",   "he", "te"],count: 3 },
    { word: "nieve",    syllables: ["nie",  "ve"],      count: 2 },
    { word: "duende",   syllables: ["duen", "de"],      count: 2 },
    // Trisílabas
    { word: "serpiente",  syllables: ["ser", "pien", "te"],     count: 3 },
    { word: "ventana",    syllables: ["ven", "ta",   "na"],     count: 3 },
    { word: "tortuga",    syllables: ["tor", "tu",   "ga"],     count: 3 },
    { word: "planeta",    syllables: ["pla", "ne",   "ta"],     count: 3 },
    { word: "colegio",    syllables: ["co",  "le",   "gio"],    count: 3 },
    { word: "estudio",    syllables: ["es",  "tu",   "dio"],    count: 3 },
    // Polisílabas
    { word: "teléfono",   syllables: ["te","lé","fo","no"],          count: 4 },
    { word: "biblioteca", syllables: ["bi","blio","te","ca"],        count: 4 },
    { word: "maravilla",  syllables: ["ma","ra","vi","lla"],         count: 4 },
    { word: "paraguas",   syllables: ["pa","ra","guas"],             count: 3 },
    { word: "murciélago", syllables: ["mur","cié","la","go"],        count: 4 },
    { word: "computadora",syllables: ["com","pu","ta","do","ra"],    count: 4 },
    { word: "refrigerador",syllables:["re","fri","ge","ra","dor"],   count: 4 },
    // Más trisílabas
    { word: "verano",    syllables: ["ve",  "ra",  "no"],   count: 3 },
    { word: "camino",    syllables: ["ca",  "mi",  "no"],   count: 3 },
    { word: "trabajo",   syllables: ["tra", "ba",  "jo"],   count: 3 },
    { word: "abuela",    syllables: ["a",   "bue", "la"],   count: 3 },
  ],

  // ── Nivel 3: palabras más complejas, incluye esdrújulas y polisílabas ────
  3: [
    // Monosílabas con estructura compleja
    { word: "tris",    syllables: ["tris"],    count: 1 },
    { word: "clan",    syllables: ["clan"],    count: 1 },
    { word: "bron",    syllables: ["bron"],    count: 1 },
    // Bisílabas con diptongos
    { word: "miedo",    syllables: ["mie",  "do"],           count: 2 },
    { word: "suelo",    syllables: ["sue",  "lo"],           count: 2 },
    { word: "fuente",   syllables: ["fuen", "te"],           count: 2 },
    { word: "puente",   syllables: ["puen", "te"],           count: 2 },
    // Trisílabas esdrújulas
    { word: "pájaro",   syllables: ["pá",  "ja",  "ro"],    count: 3 },
    { word: "música",   syllables: ["mú",  "si",  "ca"],    count: 3 },
    { word: "número",   syllables: ["nú",  "me",  "ro"],    count: 3 },
    { word: "rápido",   syllables: ["rá",  "pi",  "do"],    count: 3 },
    { word: "brújula",  syllables: ["brú", "ju",  "la"],    count: 3 },
    { word: "plátano",  syllables: ["plá", "ta",  "no"],    count: 3 },
    // Polisílabas 4 sílabas
    { word: "matemática",   syllables: ["ma","te","má","ti","ca"],   count: 4 },
    { word: "hipopótamo",   syllables: ["hi","po","pó","ta","mo"],   count: 4 },
    { word: "geografía",    syllables: ["ge","o","gra","fí","a"],    count: 4 },
    { word: "fantástico",   syllables: ["fan","tás","ti","co"],      count: 4 },
    { word: "kilómetro",    syllables: ["ki","ló","me","tro"],       count: 4 },
    { word: "semáforo",     syllables: ["se","má","fo","ro"],        count: 4 },
    { word: "magnífico",    syllables: ["mag","ní","fi","co"],       count: 4 },
    { word: "catedral",     syllables: ["ca","te","dral"],           count: 3 },
    { word: "diccionario",  syllables: ["dic","cio","na","rio"],     count: 4 },
    // Polisílabas 5+ sílabas
    { word: "electrodoméstico", syllables:["e","lec","tro","do","més","ti","co"], count: 4 },
    { word: "supermercado",     syllables:["su","per","mer","ca","do"],          count: 4 },
    { word: "extraordinario",   syllables:["ex","tra","or","di","na","rio"],     count: 4 },
    { word: "comunicación",     syllables:["co","mu","ni","ca","ción"],          count: 4 },
    // Repaso
    { word: "difícil",  syllables: ["di","fí","cil"],         count: 3 },
    { word: "océano",   syllables: ["o","cé","a","no"],       count: 4 },
  ],

};
