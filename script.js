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

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createConfettiBurst(count = 140) {
  for (let i = 0; i < count; i += 1) {
    confetti.push({
      x: randomRange(0, canvas.width),
      y: randomRange(-100, canvas.height * 0.25),
      r: randomRange(3, 8),
      d: randomRange(1, 2.8),
      tilt: randomRange(-12, 12),
      color: `hsl(${Math.floor(randomRange(0, 360))}, 90%, 65%)`,
      vx: randomRange(-1.8, 1.8),
      vy: randomRange(1.8, 3.6),
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

function getNextBirthday() {
  const now = new Date();
  const next = new Date(now.getFullYear(), BIRTH_MONTH_INDEX, BIRTH_DAY);
  if (next <= now) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

const targetDate = getNextBirthday();

function getCurrentAge() {
  const now = new Date();
  let age = now.getFullYear() - BIRTH_YEAR;
  const hasHadBirthdayThisYear =
    now.getMonth() > BIRTH_MONTH_INDEX ||
    (now.getMonth() === BIRTH_MONTH_INDEX && now.getDate() >= BIRTH_DAY);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

function getTurningAge() {
  return targetDate.getFullYear() - BIRTH_YEAR;
}

function updateCelebrationBadges() {
  if (celebrationYearEl) {
    celebrationYearEl.textContent = String(targetDate.getFullYear());
  }
  if (turningAgeEl) {
    turningAgeEl.textContent = String(getTurningAge());
  }
}

function updateFunline() {
  if (!funlineEl) {
    return;
  }

  const turningAge = getTurningAge();
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
      await audio.play();
      musicBtn.textContent = "Pause Music";
      musicBtn.setAttribute("aria-pressed", "true");
    } else {
      audio.pause();
      musicBtn.textContent = "Play Music";
      musicBtn.setAttribute("aria-pressed", "false");
    }
  } catch (error) {
    musicBtn.textContent = "Music Unavailable";
  }
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

celebrateBtn.addEventListener("click", () => {
  createConfettiBurst(220);
});

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
