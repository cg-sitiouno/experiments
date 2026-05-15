import { CONFIG } from "../config.js";
import { shuffle } from "../utils/shuffle.js";

/**
 * @param {number} level
 * @returns {{ a: number, b: number, product: number, options: number[] }}
 */
export function makeQuestion(level) {
  const cfg = CONFIG.LEVELS[level];
  const a = cfg.tables[Math.floor(Math.random() * cfg.tables.length)];
  const b = Math.floor(Math.random() * cfg.maxMult) + 1;
  const product = a * b;

  const wrongs = new Set();
  let attempts = 0;
  while (wrongs.size < 3 && attempts < 80) {
    attempts++;
    const ta = cfg.tables[Math.floor(Math.random() * cfg.tables.length)];
    const tb = Math.floor(Math.random() * cfg.maxMult) + 1;
    const wp = ta * tb;
    if (wp !== product) wrongs.add(wp);
  }
  for (let f = 1; wrongs.size < 3; f++) {
    if (f !== product) wrongs.add(f);
  }

  return { a, b, product, options: shuffle([product, ...[...wrongs]]) };
}
