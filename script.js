const muteBtn = document.getElementById("mute-btn");
const pauseBtn = document.getElementById("pause-btn");
const audio = document.getElementById("birthday-audio");
const funlineEl = document.getElementById("funline");
const celebrationYearEl = document.getElementById("celebration-year");
const turningAgeEl = document.getElementById("turning-age");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
const confetti = [];

let awaitingUserUnlock = false;
let lastCelebrationAt = 0;
let isMuted = false;

const BIRTH_MONTH_INDEX = 3; // April
const BIRTH_DAY = 22;
const BIRTH_YEAR = 2010;
const CELEBRATION_YEAR = new Date().getFullYear();
const targetDate = getNextBirthday();

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createConfettiBurst(count = 140, centerX = null, centerY = null) {
  const burstX = centerX ?? randomRange(canvas.width * 0.2, canvas.width * 0.8);
  const burstY = centerY ?? randomRange(canvas.height * 0.08, canvas.height * 0.28);

  for (let i = 0; i < count; i += 1) {
    confetti.push({
      x: burstX + randomRange(-70, 70),
      y: burstY + randomRange(-30, 30),
      r: randomRange(3, 8),
      color: `hsl(${Math.floor(randomRange(0, 360))}, 90%, 65%)`,
      vx: randomRange(-3.2, 3.2),
      vy: randomRange(1.6, 4.6),
      rotation: randomRange(0, Math.PI * 2)
    });
  }
}

function drawConfettiPiece(piece) {
  ctx.save();
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.rotation);
  ctx.fillStyle = piece.color;
  ctx.fillRect(-piece.r / 2, -piece.r / 2, piece.r, piece.r * 1.4);
  ctx.restore();
}

function updateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = confetti.length - 1; i >= 0; i -= 1) {
    const piece = confetti[i];
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += 0.08;
    if (piece.y > canvas.height + 40) {
      confetti.splice(i, 1);
      continue;
    }
    drawConfettiPiece(piece);
  }
  requestAnimationFrame(updateConfetti);
}

function getNextBirthday() {
  const now = new Date();
  const next = new Date(now.getFullYear(), BIRTH_MONTH_INDEX, BIRTH_DAY);
  if (next <= now) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

function getTurningAgeForYear(year) {
  return year - BIRTH_YEAR;
}

function updateCelebrationBadges() {
  celebrationYearEl.textContent = String(CELEBRATION_YEAR);
  turningAgeEl.textContent = String(getTurningAgeForYear(CELEBRATION_YEAR));
}

function updateFunline() {
  const turningAge = getTurningAgeForYear(CELEBRATION_YEAR);
  const lines = [
    `Breaking news: Roli is turning ${turningAge} and the cake is nervous.`,
    `Roli turns ${turningAge} this year. Everyone act cool. (Impossible.)`,
    `Level up unlocked: Roli ${turningAge}. New powers: extra sparkle.`,
    "May your snacks be endless and your homework be tiny.",
    "May your selfies be flawless and your vibes be unstoppable.",
    "May your birthday be louder than your alarm clock.",
    "May you always find money in old pockets. (Manifesting.)",
    "May your Wi‑Fi be strong and your problems be weak.",
    "May your day be 99% fun and 1% cake crumbs."
  ];
  funlineEl.textContent = lines[Math.floor(Math.random() * lines.length)];
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
}

function setPauseButtonLabel(isPlaying) {
  pauseBtn.textContent = isPlaying ? "Pause Music" : "Unpause Music";
  pauseBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
}

function setMuteButtonLabel() {
  muteBtn.textContent = isMuted ? "Unmute Music" : "Mute Music";
  muteBtn.setAttribute("aria-pressed", isMuted ? "true" : "false");
}

function showAutoplayBlockedHint() {
  awaitingUserUnlock = true;
  pauseBtn.textContent = "Tap to start music";
  pauseBtn.setAttribute("aria-pressed", "false");
}

function toggleMute() {
  isMuted = !isMuted;
  audio.muted = isMuted;
  setMuteButtonLabel();
}

async function togglePause() {
  if (!audio.paused) {
    audio.pause();
    awaitingUserUnlock = false;
    setPauseButtonLabel(false);
    return;
  }
  const started = await startAudioPlayback();
  if (started) {
    awaitingUserUnlock = false;
    setPauseButtonLabel(true);
  } else {
    showAutoplayBlockedHint();
  }
}

async function startAudioPlayback() {
  try {
    audio.muted = isMuted;
    await audio.play();
    return true;
  } catch (error) {
    return false;
  }
}

async function tryUnlockMusic() {
  if (!awaitingUserUnlock || !audio.paused) {
    return;
  }
  const started = await startAudioPlayback();
  if (started) {
    awaitingUserUnlock = false;
    setPauseButtonLabel(true);
  }
}

function attachUnlockListeners() {
  document.addEventListener("pointerdown", tryUnlockMusic);
  document.addEventListener("keydown", tryUnlockMusic);
  document.addEventListener("touchstart", tryUnlockMusic, { passive: true });
}

async function autoStartMusic() {
  const started = await startAudioPlayback();
  if (started) {
    setPauseButtonLabel(true);
  } else {
    showAutoplayBlockedHint();
  }
}

function launchCelebration() {
  const now = Date.now();
  if (now - lastCelebrationAt < 1200) {
    return;
  }
  lastCelebrationAt = now;
  const centerX = canvas.width / 2;
  createConfettiBurst(220, centerX, canvas.height * 0.16);
  setTimeout(() => createConfettiBurst(160, canvas.width * 0.2, canvas.height * 0.22), 180);
  setTimeout(() => createConfettiBurst(160, canvas.width * 0.8, canvas.height * 0.22), 340);
}

muteBtn.addEventListener("click", toggleMute);
pauseBtn.addEventListener("click", togglePause);
window.addEventListener("resize", setCanvasSize);
window.addEventListener("focus", launchCelebration);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    launchCelebration();
  }
});

audio.addEventListener("pause", () => setPauseButtonLabel(false));
audio.addEventListener("play", () => setPauseButtonLabel(true));

attachUnlockListeners();
setMuteButtonLabel();
setCanvasSize();
createConfettiBurst(120);
updateConfetti();
updateCelebrationBadges();
updateFunline();
updateCountdown();
setInterval(updateCountdown, 1000);
setInterval(updateFunline, 5000);
launchCelebration();
autoStartMusic();
