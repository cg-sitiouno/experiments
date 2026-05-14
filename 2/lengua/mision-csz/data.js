// Datos del juego Misión C/S/Z
// Cada ítem presenta una oración con ___ donde va la letra c, s o z.
// La respuesta SIEMPRE es "c", "s" o "z" — no hay otras letras.
//
// Niveles:
//   1 → Casos claros: ZA/ZO/ZU, SA/SO/SU, CE/CI (sin ambigüedad)
//   2 → Pares mínimos que exigen leer el contexto (casa/caza, coser/cocer…)
//   3 → Sufijos -ción/-sión/-zón, raíces cultas, posiciones internas complejas

const ROUNDS = {

  // ── Nivel 1: una sola opción tiene sentido ───────────────────────────────
  1: [
    // Z antes de a, o, u
    { sentence: "Me puse los ___apatos nuevos.",            answer: "z", completed: "zapatos"   },
    { sentence: "El ___orro vive en el bosque.",            answer: "z", completed: "zorro"     },
    { sentence: "Comí una ___anahoria del jardín.",         answer: "z", completed: "zanahoria" },
    { sentence: "El ___oo tiene leones, jirafas y pandas.", answer: "z", completed: "zoo"       },
    { sentence: "El ___umo de naranja está fresco.",        answer: "z", completed: "zumo"      },
    { sentence: "Vivo en una ___ona muy tranquila.",        answer: "z", completed: "zona"      },
    { sentence: "El cielo tiene un color a___ul precioso.", answer: "z", completed: "azul"      },
    { sentence: "Bebí agua de la ta___a.",                  answer: "z", completed: "taza"      },
    { sentence: "Hay un la___o en el parque.",              answer: "z", completed: "lazo"      },
    // S antes de a, e, i, o, u
    { sentence: "La ___opa de verduras está caliente.",     answer: "s", completed: "sopa"      },
    { sentence: "El ___ol sale por el este.",               answer: "s", completed: "sol"       },
    { sentence: "La ___emana tiene siete días.",            answer: "s", completed: "semana"    },
    { sentence: "Quiero ___alir a jugar afuera.",           answer: "s", completed: "salir"     },
    { sentence: "Tengo mucha ___uerte hoy.",                answer: "s", completed: "suerte"    },
    { sentence: "La ___alud es muy importante.",            answer: "s", completed: "salud"     },
    { sentence: "Voy a ___altar la cuerda.",                answer: "s", completed: "saltar"    },
    { sentence: "El ___aco de papas pesa mucho.",           answer: "s", completed: "saco"      },
    { sentence: "El ___oldado llevaba una lanza.",          answer: "s", completed: "soldado"   },
    // C antes de e, i
    { sentence: "La ___ebolla pica mucho los ojos.",        answer: "c", completed: "cebolla"   },
    { sentence: "El ___ielo está lleno de estrellas.",      answer: "c", completed: "cielo"     },
    { sentence: "La película es en el ___ine.",             answer: "c", completed: "cine"      },
    { sentence: "Tengo ___inco dedos en cada mano.",        answer: "c", completed: "cinco"     },
    { sentence: "La ___ereza es una fruta roja.",           answer: "c", completed: "cereza"    },
    { sentence: "Vivo en una gran ___iudad.",               answer: "c", completed: "ciudad"    },
    { sentence: "El ___irco tiene payasos y acróbatas.",    answer: "c", completed: "circo"     },
    { sentence: "El ___ésped del estadio está verde.",      answer: "c", completed: "césped"    },
    { sentence: "La ___ebra tiene rayas blancas y negras.", answer: "c", completed: "cebra"     },
  ],

  // ── Nivel 2: contexto necesario para distinguir pares mínimos ────────────
  2: [
    // casa / caza
    { sentence: "La ___a donde vivo tiene jardín.",                      answer: "s", completed: "casa"       },
    { sentence: "El leopardo ___a su presa en la selva.",                answer: "z", completed: "caza"       },
    { sentence: "El ___ador siguió las huellas del tigre.",              answer: "z", completed: "cazador"    },
    // coser / cocer — una sola vocal distingue costura de cocción
    { sentence: "Mi abuela va a co___er el vestido roto.",               answer: "s", completed: "coser"      },
    { sentence: "Hay que co___er bien las papas antes de comerlas.",     answer: "c", completed: "cocer"      },
    // cima / sima
    { sentence: "El alpinista llegó a la ___ima del volcán.",            answer: "c", completed: "cima"       },
    { sentence: "La ___ima es un abismo muy profundo en la tierra.",     answer: "s", completed: "sima"       },
    // cera
    { sentence: "La ___era de abejas sirve para hacer velas.",           answer: "c", completed: "cera"       },
    // azúcar
    { sentence: "El a___úcar endulza el café.",                          answer: "z", completed: "azúcar"     },
    // cena
    { sentence: "La ___ena familiar fue deliciosa.",                     answer: "c", completed: "cena"       },
    // más S
    { sentence: "La ___ardina es un pez pequeño del mar.",               answer: "s", completed: "sardina"    },
    { sentence: "El ___alón de clases estaba lleno de alumnos.",         answer: "s", completed: "salón"      },
    { sentence: "La ___uperficie del lago estaba muy tranquila.",        answer: "s", completed: "superficie" },
    { sentence: "La ___irena cantaba sobre las rocas.",                  answer: "s", completed: "sirena"     },
    { sentence: "El ___andwich lleva jamón y queso.",                    answer: "s", completed: "sandwich"   },
    // más Z
    { sentence: "El ___arzal estaba lleno de espinas.",                  answer: "z", completed: "zarzal"     },
    { sentence: "La ___arpa del oso es enorme.",                         answer: "z", completed: "zarpa"      },
    { sentence: "La vo___ de la cantante llenó el teatro.",              answer: "z", completed: "voz"        },
    // C interna o inicial (ce/ci)
    { sentence: "Aprendí a to___ar la guitarra.",                        answer: "c", completed: "tocar"      },
    { sentence: "La lu___erna ilumina el camino.",                       answer: "c", completed: "lucerna"    },
    { sentence: "El ___entro de la ciudad es muy animado.",              answer: "c", completed: "centro"     },
    { sentence: "La ___eniza queda después del fuego.",                  answer: "c", completed: "ceniza"     },
    { sentence: "El ___ero es el número antes del uno.",                 answer: "c", completed: "cero"       },
    { sentence: "La de___isión fue tomada entre todos.",                 answer: "c", completed: "decisión"   },
    { sentence: "El pro___eso de aprender toma tiempo.",                 answer: "c", completed: "proceso"    },
    // Z interna
    { sentence: "El bra___o me duele después de jugar.",                 answer: "z", completed: "brazo"      },
    { sentence: "El pla___o de entregar el trabajo venció hoy.",         answer: "z", completed: "plazo"      },
  ],

  // ── Nivel 3: sufijos -ción/-sión/-zón, raíces internas complejas ─────────
  3: [
    // Sufijo -ción (verbos en -ar → -ación)
    { sentence: "La celebra___ión duró toda la noche.",                  answer: "c", completed: "celebración"  },
    { sentence: "La narra___ión del cuento fue muy emotiva.",            answer: "c", completed: "narración"    },
    { sentence: "La declara___ión del testigo sorprendió a todos.",      answer: "c", completed: "declaración"  },
    { sentence: "La imagina___ión de los niños no tiene límites.",       answer: "c", completed: "imaginación"  },
    { sentence: "La ac___ión del héroe salvó a muchos.",                 answer: "c", completed: "acción"       },
    { sentence: "La can___ión favorita sonó en la radio.",               answer: "c", completed: "canción"      },
    // Sufijo -sión (verbos en -der, -sar, -ter, -tir → -sión)
    { sentence: "La inva___ión del castillo fue sorpresiva.",            answer: "s", completed: "invasión"     },
    { sentence: "La discu___ión se resolvió con calma.",                 answer: "s", completed: "discusión"    },
    { sentence: "La expan___ión de la ciudad fue rápida.",               answer: "s", completed: "expansión"    },
    { sentence: "La man___ión tiene muchas habitaciones.",               answer: "s", completed: "mansión"      },
    { sentence: "La vi___ión del telescopio es asombrosa.",              answer: "s", completed: "visión"       },
    { sentence: "La emi___ión de gases contamina el ambiente.",          answer: "s", completed: "emisión"      },
    { sentence: "La deci___ión final la tomó el director.",              answer: "s", completed: "decisión"     },
    { sentence: "La conclu___ión del informe fue muy clara.",            answer: "s", completed: "conclusión"   },
    // Sufijo -zón y terminaciones en z
    { sentence: "El cora___ón late muy rápido al correr.",               answer: "z", completed: "corazón"      },
    { sentence: "El ra___onamiento lógico es clave para resolver.",      answer: "z", completed: "razonamiento" },
    { sentence: "La lu___ de la luna era hermosa.",                      answer: "z", completed: "luz"          },
    { sentence: "La nari___ del payaso era roja y redonda.",             answer: "z", completed: "nariz"        },
    // -cio / -cie (palabras cultas)
    { sentence: "El espa___io entre las estrellas es inmenso.",          answer: "c", completed: "espacio"      },
    { sentence: "El nego___io de la familia va muy bien.",               answer: "c", completed: "negocio"      },
    { sentence: "La espe___ie de pájaro está en peligro.",               answer: "c", completed: "especie"      },
    // Palabras con -cer / -cir y raíces complejas
    { sentence: "Voy a aprender a co___er a máquina.",                   answer: "c", completed: "cocer"        },
    { sentence: "La nece___idad de aprender es enorme.",                 answer: "s", completed: "necesidad"    },
    { sentence: "El ejer___icio diario mejora la salud.",                answer: "c", completed: "ejercicio"    },
    { sentence: "Tengo mu___ho sueño hoy.",                              answer: "c", completed: "mucho"        },
    { sentence: "La su___esión de reyes duró varios siglos.",            answer: "c", completed: "sucesión"     },
    { sentence: "La ___ensación de frío era muy intensa.",               answer: "s", completed: "sensación"    },
  ],

};
