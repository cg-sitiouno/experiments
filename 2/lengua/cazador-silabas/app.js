"use strict";

// ROUNDS is loaded from data.js (must be included before this script)

// ========== DECK — cicla todo el pool antes de repetir ===================
// Cada nivel tiene su propio mazo. Cuando se agota, se rellena barajado.

const _deck = { 1: [], 2: [], 3: [] };

function drawRounds(level, count) {
  if (_deck[level].length < count) {
    _deck[level].push(...shuffle([...ROUNDS[level]]));
  }
  return _deck[level].splice(0, count);
}

const RESULT_MSGS = [
  "¡Sigue practicando, ya vas a mejorar!",
  "¡Bien! Tu oído va afinándose.",
  "¡Muy bien! Tienes buen oído para las sílabas.",
  "¡Perfecto! Eres un cazador experto. 🏆",
];

const TOTAL_ROUNDS = 10;
const POINTS_PER_CORRECT = 10;

// ========== STATE ==========

let st = { level: 1, rounds: [], idx: 0, points: 0, answered: false };

// ========== DOM ==========

let els;

function initEls() {
  els = {
    screens: {
      start:  document.getElementById("screen-start"),
      game:   document.getElementById("screen-game"),
      result: document.getElementById("screen-result"),
    },
    levelBtns:   document.querySelectorAll("[data-level]"),
    hudPoints:   document.getElementById("hud-points"),
    hudRound:    document.getElementById("hud-round"),
    hudLevel:    document.getElementById("hud-level"),
    wordDisplay: document.getElementById("word-display"),
    syllablesCt: document.getElementById("syllables-container"),
    feedbackBar: document.getElementById("feedback-bar"),
    feedbackTxt: document.getElementById("feedback-text"),
    resultStars: document.getElementById("result-stars"),
    resultPts:   document.getElementById("result-points"),
    resultMsg:   document.getElementById("result-msg"),
    btnPlayAgain: document.getElementById("btn-play-again"),
    btnMenu:      document.getElementById("btn-menu"),
  };
}

// ========== SCREENS ==========

function showScreen(name) {
  Object.entries(els.screens).forEach(([k, el]) => {
    el.hidden = k !== name;
  });
}

// ========== GAME ==========

function startGame(level) {
  st.level    = level;
  st.rounds   = drawRounds(level, TOTAL_ROUNDS);
  st.idx      = 0;
  st.points   = 0;
  st.answered = false;
  showScreen("game");
  renderRound();
}

function renderRound() {
  const round = st.rounds[st.idx];

  els.hudPoints.textContent = st.points;
  els.hudRound.textContent  = `${st.idx + 1} / ${TOTAL_ROUNDS}`;
  els.hudLevel.textContent  = `Nivel ${st.level}`;
  els.wordDisplay.textContent = round.word;

  els.feedbackBar.hidden = true;
  els.feedbackBar.className = "feedback-bar";

  // Build syllable buttons
  els.syllablesCt.innerHTML = "";
  round.syllables.forEach((syl, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "syllable-block";
    btn.textContent = syl;
    btn.setAttribute("aria-label", `Sílaba ${syl}`);
    btn.addEventListener("click", () => handleAnswer(i));
    els.syllablesCt.appendChild(btn);
  });

  st.answered = false;
}

function handleAnswer(selectedIdx) {
  if (st.answered) return;
  st.answered = true;

  const round = st.rounds[st.idx];
  const correct = selectedIdx === round.ans;
  const blocks = els.syllablesCt.querySelectorAll(".syllable-block");

  blocks.forEach(b => { b.disabled = true; });

  if (correct) {
    st.points += POINTS_PER_CORRECT;
    blocks[selectedIdx].classList.add("syllable-block--correct");
    els.feedbackTxt.textContent = "¡Correcto! 🎉";
    els.feedbackBar.className = "feedback-bar feedback-bar--ok";
  } else {
    blocks[selectedIdx].classList.add("syllable-block--wrong");
    blocks[round.ans].classList.add("syllable-block--correct");
    els.feedbackTxt.textContent = `Era: "${round.syllables[round.ans]}"`;
    els.feedbackBar.className = "feedback-bar feedback-bar--no";
  }

  els.feedbackBar.hidden = false;
  setTimeout(nextRound, 1450);
}

function nextRound() {
  st.idx++;
  if (st.idx >= TOTAL_ROUNDS) {
    showResult();
  } else {
    renderRound();
  }
}

// ========== RESULT ==========

function showResult() {
  const pct   = st.points / (TOTAL_ROUNDS * POINTS_PER_CORRECT);
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;

  els.resultStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  els.resultPts.textContent   = `${st.points} / ${TOTAL_ROUNDS * POINTS_PER_CORRECT} puntos`;
  els.resultMsg.textContent   = RESULT_MSGS[stars];

  showScreen("result");
}

// ========== UTILS ==========

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== INIT ==========

document.addEventListener("DOMContentLoaded", () => {
  initEls();

  els.levelBtns.forEach(btn => {
    btn.addEventListener("click", () => startGame(Number(btn.dataset.level)));
  });

  els.btnPlayAgain.addEventListener("click", () => startGame(st.level));
  els.btnMenu.addEventListener("click", () => showScreen("start"));

  showScreen("start");
});
