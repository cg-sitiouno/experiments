/**
 * Física y resolución de colisiones del minijuego arcade (sin DOM).
 * Los callbacks permiten al host aplicar merge/peel/remove y sincronizar vista.
 */

/** @param {number} v */
export function arcadeRadiusPx(v) {
  const n = typeof v === "number" && v > 0 ? v : 1;
  return 14 + Math.min(28, Math.sqrt(n) * 4.25);
}

/**
 * Radio usado en física / colisiones. El proyectil −1 (`peelBolt`, value −1) cuenta como talla 1
 * (misma regla que `syncArcadeBodyDom` en la vista).
 * @param {{ value: number, peelBolt?: boolean }} b
 */
export function effectiveArcadeRadius(b) {
  return arcadeRadiusPx(b.peelBolt ? 1 : b.value);
}

export function bounceNonMerge(a, b, ra, rb, d) {
  const minD = ra + rb;
  if (d >= minD) return;
  const overlap = minD - d + 0.5;
  const nx = (b.x - a.x) / (d || 0.001);
  const ny = (b.y - a.y) / (d || 0.001);
  a.x -= nx * overlap * 0.55;
  a.y -= ny * overlap * 0.55;
  b.x += nx * overlap * 0.55;
  b.y += ny * overlap * 0.55;
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const rel = rvx * nx + rvy * ny;
  if (rel < 0) {
    a.vx += nx * rel * 0.55;
    a.vy += ny * rel * 0.55;
    b.vx -= nx * rel * 0.55;
    b.vy -= ny * rel * 0.55;
  }
}

/**
 * Un frame de física: integración, bordes, fusión/rebote.
 * @param {Array<{ x: number, y: number, vx: number, vy: number, value: number, peelBolt?: boolean }>} bodies
 * @param {{
 *   fieldW: number,
 *   fieldH: number,
 *   dt: number,
 *   friction: number,
 *   wallBounce: number,
 *   maxSpeed: number,
 *   syncDom: (b: object) => void,
 *   removeBolt: (bolt: object) => void,
 *   peelBubbleHitByBolt: (bubble: object) => void,
 *   annihilateOneWithBolt: (bolt: object, bubble: object) => void,
 *   mergeBodiesKeepFirst: (keep: object, drop: object) => void,
 * }} ctx
 */
export function arcadePhysicsStep(bodies, ctx) {
  const {
    fieldW: fw,
    fieldH: fh,
    dt,
    friction,
    wallBounce,
    maxSpeed,
    syncDom,
    removeBolt,
    peelBubbleHitByBolt,
    annihilateOneWithBolt,
    mergeBodiesKeepFirst,
  } = ctx;

  for (const b of bodies) {
    b.vx *= friction;
    b.vy *= friction;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > maxSpeed) {
      b.vx = (b.vx / sp) * maxSpeed;
      b.vy = (b.vy / sp) * maxSpeed;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const r = effectiveArcadeRadius(b);
    // Proyectil −1: no rebota; si toca pared (tras resolver burbujas) se elimina sin efecto.
    if (!b.peelBolt) {
      if (b.x - r < 0) {
        b.x = r;
        b.vx *= -wallBounce;
      } else if (b.x + r > fw) {
        b.x = fw - r;
        b.vx *= -wallBounce;
      }
      if (b.y - r < 0) {
        b.y = r;
        b.vy *= -wallBounce;
      } else if (b.y + r > fh) {
        b.y = fh - r;
        b.vy *= -wallBounce;
      }
    }
    syncDom(b);
  }

  let mergedAny = true;
  let guard = 0;
  while (mergedAny && guard++ < 14) {
    mergedAny = false;
    outer: for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const ra = effectiveArcadeRadius(a);
        const rb = effectiveArcadeRadius(b);
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d >= ra + rb - 1) continue;
        const pa = !!a.peelBolt;
        const pb = !!b.peelBolt;
        if (pa && pb) {
          bounceNonMerge(a, b, ra, rb, d || 0.001);
          syncDom(a);
          syncDom(b);
          continue;
        }
        // Proyectil −1 vs burbuja: 1 + (−1) → 0; 0 rebota; si > 1, pelar.
        if (pa !== pb) {
          const bolt = pa ? a : b;
          const bubble = pa ? b : a;
          if (bubble.value === 1) {
            annihilateOneWithBolt(bolt, bubble);
            mergedAny = true;
            break outer;
          }
          if (bubble.value < 1) {
            bounceNonMerge(a, b, ra, rb, d || 0.001);
            syncDom(a);
            syncDom(b);
            continue;
          }
          removeBolt(bolt);
          peelBubbleHitByBolt(bubble);
          mergedAny = true;
          break outer;
        }
        if (a.value === 0 || b.value === 0) {
          mergeBodiesKeepFirst(a, b);
          mergedAny = true;
          break outer;
        }
        if (a.value !== 1 && b.value !== 1) {
          bounceNonMerge(a, b, ra, rb, d || 0.001);
          syncDom(a);
          syncDom(b);
          continue;
        }
        mergeBodiesKeepFirst(a, b);
        mergedAny = true;
        break outer;
      }
    }
  }

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const ra = effectiveArcadeRadius(a);
        const rb = effectiveArcadeRadius(b);
        if (a.peelBolt || b.peelBolt) continue;
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
        if (d < ra + rb - 0.5 && a.value !== 1 && b.value !== 1 && a.value !== 0 && b.value !== 0) {
          bounceNonMerge(a, b, ra, rb, d);
          syncDom(a);
          syncDom(b);
        }
      }
    }
  }

  for (let i = bodies.length - 1; i >= 0; i--) {
    const b = bodies[i];
    if (!b.peelBolt) continue;
    const r = effectiveArcadeRadius(b);
    if (b.x - r < 0 || b.x + r > fw || b.y - r < 0 || b.y + r > fh) {
      removeBolt(b);
    }
  }
}
