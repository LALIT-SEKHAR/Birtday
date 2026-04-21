const celebrateBtn = document.getElementById("celebrate-btn");
const musicBtn = document.getElementById("music-btn");
const audio = document.getElementById("birthday-audio");
const funlineEl = document.getElementById("funline");
const wishBtn = document.getElementById("wish-btn");
const celebrationYearEl = document.getElementById("celebration-year");
const turningAgeEl = document.getElementById("turning-age");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
const confetti = [];
let confettiRunning = true;
let synthContext = null;
let synthIntervals = [];
let synthTimeouts = [];
let synthPlaying = false;

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
      d: randomRange(1, 2.8),
      tilt: randomRange(-12, 12),
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

  if (confettiRunning) {
    requestAnimationFrame(updateConfetti);
  }
}

const BIRTH_MONTH_INDEX = 3; // April
const BIRTH_DAY = 22;
const BIRTH_YEAR = 2010;
const CELEBRATION_YEAR = new Date().getFullYear();

function getNextBirthday() {
  const now = new Date();
  const next = new Date(now.getFullYear(), BIRTH_MONTH_INDEX, BIRTH_DAY);
  if (next <= now) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

const targetDate = getNextBirthday();

function getTurningAgeForYear(year) {
  return year - BIRTH_YEAR;
}

function updateCelebrationBadges() {
  if (celebrationYearEl) {
    celebrationYearEl.textContent = String(CELEBRATION_YEAR);
  }
  if (turningAgeEl) {
    turningAgeEl.textContent = String(getTurningAgeForYear(CELEBRATION_YEAR));
  }
}

function updateFunline() {
  if (!funlineEl) {
    return;
  }

  const turningAge = getTurningAgeForYear(CELEBRATION_YEAR);
  const lines = [
    `Breaking news: Roli is turning ${turningAge} and the cake is nervous.`,
    `Roli turns ${turningAge} this year. Everyone act cool. (Impossible.)`,
    `Level up unlocked: Roli ${turningAge}. New powers: extra sparkle.`,
    `Today’s agenda: Celebrate Roli. Repeat. Add more confetti.`
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

async function toggleMusic() {
  try {
    if (audio.paused) {
      stopSynthTune();
      await audio.play();
      musicBtn.textContent = "Pause Music";
      musicBtn.setAttribute("aria-pressed", "true");
    } else {
      audio.pause();
      stopSynthTune();
      musicBtn.textContent = "Play Music";
      musicBtn.setAttribute("aria-pressed", "false");
    }
  } catch (error) {
    if (!synthPlaying) {
      startSynthTune();
      musicBtn.textContent = "Pause Music";
      musicBtn.setAttribute("aria-pressed", "true");
    } else {
      stopSynthTune();
      musicBtn.textContent = "Play Music";
      musicBtn.setAttribute("aria-pressed", "false");
    }
  }
}

function playSynthNote(frequency, durationMs) {
  if (!synthContext) {
    return;
  }

  const osc = synthContext.createOscillator();
  const gain = synthContext.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, synthContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.11, synthContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, synthContext.currentTime + durationMs / 1000);

  osc.connect(gain);
  gain.connect(synthContext.destination);
  osc.start();
  osc.stop(synthContext.currentTime + durationMs / 1000 + 0.03);
}

function clearSynthTimers() {
  synthIntervals.forEach((id) => clearInterval(id));
  synthTimeouts.forEach((id) => clearTimeout(id));
  synthIntervals = [];
  synthTimeouts = [];
}

function stopSynthTune() {
  synthPlaying = false;
  clearSynthTimers();
  if (synthContext && synthContext.state !== "closed") {
    synthContext.close();
  }
  synthContext = null;
}

function scheduleHappyBirthdayLoop() {
  const notes = [
    { f: 392, d: 320, p: 0 }, { f: 392, d: 220, p: 360 }, { f: 440, d: 520, p: 620 },
    { f: 392, d: 520, p: 1180 }, { f: 523, d: 520, p: 1760 }, { f: 494, d: 840, p: 2340 },
    { f: 392, d: 320, p: 3340 }, { f: 392, d: 220, p: 3700 }, { f: 440, d: 520, p: 3960 },
    { f: 392, d: 520, p: 4520 }, { f: 587, d: 520, p: 5100 }, { f: 523, d: 840, p: 5680 },
    { f: 392, d: 320, p: 6680 }, { f: 392, d: 220, p: 7040 }, { f: 784, d: 520, p: 7300 },
    { f: 659, d: 520, p: 7860 }, { f: 523, d: 520, p: 8440 }, { f: 494, d: 520, p: 9020 },
    { f: 440, d: 840, p: 9600 }
  ];
  const loopLength = 10600;

  const playSequence = () => {
    notes.forEach((note) => {
      const t = setTimeout(() => {
        if (synthPlaying) {
          playSynthNote(note.f, note.d);
        }
      }, note.p);
      synthTimeouts.push(t);
    });
  };

  playSequence();
  const loopId = setInterval(playSequence, loopLength);
  synthIntervals.push(loopId);
}

function startSynthTune() {
  if (synthPlaying) {
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    musicBtn.textContent = "Music Unsupported";
    return;
  }

  synthContext = new AudioContextClass();
  synthPlaying = true;
  scheduleHappyBirthdayLoop();
}

function setWish() {
  if (!funlineEl) return;
  const wishes = [
    "May your snacks be endless and your homework be tiny.",
    "May your selfies be flawless and your vibes be unstoppable.",
    "May your birthday be louder than your alarm clock.",
    "May you always find money in old pockets. (Manifesting.)",
    "May your Wi‑Fi be strong and your problems be weak.",
    "May your day be 99% fun and 1% cake crumbs."
  ];
  funlineEl.textContent = wishes[Math.floor(Math.random() * wishes.length)];
  createConfettiBurst(120);
}

function launchCelebration() {
  const centerX = canvas.width / 2;
  createConfettiBurst(220, centerX, canvas.height * 0.16);
  setTimeout(() => createConfettiBurst(160, canvas.width * 0.2, canvas.height * 0.22), 180);
  setTimeout(() => createConfettiBurst(160, canvas.width * 0.8, canvas.height * 0.22), 340);

  celebrateBtn.textContent = "Celebrating!";
  celebrateBtn.disabled = true;
  setTimeout(() => {
    celebrateBtn.textContent = "Launch Celebration";
    celebrateBtn.disabled = false;
  }, 900);
}

celebrateBtn.addEventListener("click", launchCelebration);

musicBtn.addEventListener("click", toggleMusic);
if (wishBtn) {
  wishBtn.addEventListener("click", setWish);
}
window.addEventListener("resize", setCanvasSize);

setCanvasSize();
createConfettiBurst(120);
updateConfetti();
updateCelebrationBadges();
updateFunline();
updateCountdown();
setInterval(updateCountdown, 1000);
