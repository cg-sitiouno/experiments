/**
 * Audio tipo 8 bits (Web Audio API, sin archivos externos).
 * Expone BubbleMathLabAudio en window para app.js (IIFE sin módulos).
 */
(function (global) {
  "use strict";

  /** @type {AudioContext | null} */
  let ctx = null;

  function getContext() {
    if (ctx) return ctx;
    const Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  }

  /**
   * Garantiza que el contexto esté activo antes de programar notas (formulario / botones
   * a veces disparan con AudioContext aún en "suspended").
   * @param {(audio: AudioContext) => void} schedule
   */
  function whenAudioReady(schedule) {
    const audio = getContext();
    if (!audio) return;
    const run = function () {
      try {
        schedule(audio);
      } catch (_e) {
        /* ignore */
      }
    };
    if (audio.state === "suspended") {
      void audio.resume().then(run, run);
    } else {
      run();
    }
  }

  /**
   * Despierta AudioContext (política de autoplay). Devuelve Promise por si “Comenzar” debe encadenar.
   * @returns {Promise<boolean>}
   */
  function unlockAudio() {
    const audio = getContext();
    if (!audio) return Promise.resolve(false);
    if (audio.state === "suspended") {
      return audio
        .resume()
        .then(function () {
          return audio.state === "running";
        })
        .catch(function () {
          return false;
        });
    }
    return Promise.resolve(true);
  }

  function getAudioContextState() {
    const audio = getContext();
    if (!audio) return "unsupported";
    return audio.state;
  }

  /** Pitido breve tras desbloquear (confirma que el audio va). */
  function playTinyConfirmFromContext(audio) {
    const master = audio.createGain();
    master.gain.value = 0.14;
    master.connect(audio.destination);
    playSquareBlip(audio, master, 880, 0, 0.065, 0.38);
    global.setTimeout(function () {
      try {
        master.disconnect();
      } catch (_e) {
        /* ignore */
      }
    }, 220);
  }

  /**
   * Para el botón “Activar sonido”: resume en el mismo gesto del clic y confirma con un blip.
   * @returns {Promise<boolean>}
   */
  function unlockAndConfirmSound() {
    const audio = getContext();
    if (!audio) return Promise.resolve(false);
    if (audio.state === "suspended") {
      return audio
        .resume()
        .then(function () {
          try {
            playTinyConfirmFromContext(audio);
          } catch (_e) {
            /* ignore */
          }
          return audio.state === "running";
        })
        .catch(function () {
          return false;
        });
    }
    try {
      playTinyConfirmFromContext(audio);
    } catch (_e) {
      /* ignore */
    }
    return Promise.resolve(true);
  }

  /**
   * @param {AudioContext} audio
   * @param {GainNode} bus
   * @param {number} freqHz
   * @param {number} tOffsetSec desde audio.currentTime
   * @param {number} durationSec
   * @param {number} peakGain 0..1 relativo al bus
   */
  function playSquareBlip(audio, bus, freqHz, tOffsetSec, durationSec, peakGain) {
    const t0 = audio.currentTime + tOffsetSec;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freqHz, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peakGain, t0 + 0.008);
    g.gain.linearRampToValueAtTime(0, t0 + Math.max(0.04, durationSec));
    osc.connect(g);
    g.connect(bus);
    const stopAt = t0 + durationSec + 0.04;
    osc.start(t0);
    osc.stop(stopAt);
  }

  /**
   * Nota final más larga (“taaaan”).
   * @param {AudioContext} audio
   * @param {GainNode} bus
   */
  function playSquareFanfareFinal(audio, bus, freqHz, tOffsetSec, durationSec, peakGain) {
    const t0 = audio.currentTime + tOffsetSec;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freqHz, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peakGain * 0.45, t0 + 0.02);
    g.gain.linearRampToValueAtTime(peakGain, t0 + 0.08);
    g.gain.linearRampToValueAtTime(peakGain * 0.75, t0 + durationSec * 0.55);
    g.gain.linearRampToValueAtTime(0, t0 + durationSec);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + durationSec + 0.06);
  }

  function playMergeFromContext(audio) {
    const master = audio.createGain();
    master.gain.value = 0.2;
    master.connect(audio.destination);

    const c5 = 523.25;
    const e5 = 659.25;
    const g5 = 783.99;

    playSquareBlip(audio, master, c5, 0, 0.07, 0.55);
    playSquareBlip(audio, master, e5, 0.055, 0.085, 0.5);
    playSquareBlip(audio, master, g5, 0.11, 0.1, 0.45);

    global.setTimeout(function () {
      try {
        master.disconnect();
      } catch (_e) {
        /* ignore */
      }
    }, 400);
  }

  /**
   * Barrido tipo “splash” + destellos cortos (desintegración).
   * @param {AudioContext} audio
   * @param {GainNode} bus
   * @param {number} startHz
   * @param {number} endHz
   * @param {number} tOffsetSec
   * @param {number} durationSec
   * @param {number} peakGain
   */
  function playTriangleSplashDown(
    audio,
    bus,
    startHz,
    endHz,
    tOffsetSec,
    durationSec,
    peakGain
  ) {
    const t0 = audio.currentTime + tOffsetSec;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(startHz, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(55, endHz), t0 + durationSec);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peakGain, t0 + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + durationSec);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + durationSec + 0.03);
  }

  /** Sonido al partir una burbuja (splash / partículas). */
  function playDecomposeFromContext(audio) {
    const master = audio.createGain();
    master.gain.value = 0.18;
    master.connect(audio.destination);

    const t0 = audio.currentTime;
    playTriangleSplashDown(audio, master, 1650, 320, 0, 0.16, 0.42);
    playTriangleSplashDown(audio, master, 950, 200, 0.022, 0.12, 0.28);

    const crackleFreqs = [2400, 1900, 1550, 1200, 920, 680, 520];
    for (let i = 0; i < crackleFreqs.length; i++) {
      playSquareBlip(
        audio,
        master,
        crackleFreqs[i],
        0.01 + i * 0.028,
        0.035,
        0.32 - i * 0.028
      );
    }

    playSquareBlip(audio, master, 260, 0.11, 0.09, 0.22);

    global.setTimeout(function () {
      try {
        master.disconnect();
      } catch (_e) {
        /* ignore */
      }
    }, 550);
  }

  function playDecomposeSound() {
    whenAudioReady(playDecomposeFromContext);
  }

  /** “Ta-ta-ta-taaaan” al completar el reto. */
  function playLevelCompleteFromContext(audio) {
    const master = audio.createGain();
    master.gain.value = 0.11;
    master.connect(audio.destination);

    const c5 = 523.25;
    const e5 = 659.25;
    const g5 = 783.99;
    const c6 = 1046.5;

    playSquareBlip(audio, master, c5, 0, 0.09, 0.5);
    playSquareBlip(audio, master, e5, 0.1, 0.09, 0.48);
    playSquareBlip(audio, master, g5, 0.2, 0.11, 0.46);
    playSquareFanfareFinal(audio, master, c6, 0.32, 0.62, 0.52);

    global.setTimeout(function () {
      try {
        master.disconnect();
      } catch (_e) {
        /* ignore */
      }
    }, 1200);
  }

  /**
   * Arpegio corto C–E–G (fusión).
   * No usa prefers-reduced-motion: es breve y muchos usuarios tienen “reducir movimiento”
   * activo sin querer silenciar el juego.
   */
  function playMergeSound() {
    whenAudioReady(playMergeFromContext);
  }

  /**
   * Fanfarria victoria; retrasa un poco para no pisar el sonido de fusión del último merge.
   * @param {boolean} [reduceMotion]
   */
  function playLevelCompleteSound(reduceMotion) {
    if (reduceMotion) return;
    whenAudioReady(function (audio) {
      global.setTimeout(function () {
        playLevelCompleteFromContext(audio);
      }, 280);
    });
  }

  global.BubbleMathLabAudio = {
    unlock: unlockAudio,
    unlockAndConfirm: unlockAndConfirmSound,
    getContextState: getAudioContextState,
    playMerge: playMergeSound,
    playDecompose: playDecomposeSound,
    playLevelComplete: playLevelCompleteSound,
  };
})(typeof window !== "undefined" ? window : globalThis);
