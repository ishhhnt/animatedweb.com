const root = document.documentElement;
const stage = document.querySelector(".stage");
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const pointer = {
  targetX: 0,
  targetY: 0,
  x: 0,
  y: 0,
  px: 0,
  py: 0,
  targetPx: 0,
  targetPy: 0,
  prevX: 0,
  prevY: 0,
  speed: 0,
  active: false,
  lastMove: 0
};

const motion = {
  offsetX: 0,
  offsetY: 0,
  angle: 0,
  angleVelocity: 0,
  rotateX: 0,
  rotateY: 0,
  depth: 0,
  energy: 0
};

let particles = [];
let trails = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (from, to, amount) => from + (to - from) * amount;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = Math.floor(clamp(width * height / 18000, 34, 82));
  particles = Array.from({ length: count }, createParticle);
}

function createParticle() {
  const ember = Math.random() > 0.42;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random() * 0.75 + 0.25,
    size: ember ? Math.random() * 2.6 + 0.6 : Math.random() * 1.5 + 0.35,
    speed: ember ? Math.random() * 0.38 + 0.08 : Math.random() * 0.18 + 0.04,
    drift: (Math.random() - 0.5) * (ember ? 0.36 : 0.18),
    alpha: Math.random() * (ember ? 0.6 : 0.34) + 0.12,
    hue: ember ? 32 + Math.random() * 18 : 172 + Math.random() * 22
  };
}

function setPointer(clientX, clientY) {
  pointer.targetX = clamp((clientX / width - 0.5) * 2, -1, 1);
  pointer.targetY = clamp((clientY / height - 0.5) * 2, -1, 1);
  pointer.targetPx = clientX;
  pointer.targetPy = clientY;
  pointer.active = true;
  pointer.lastMove = performance.now();
}

function releasePointer() {
  pointer.active = false;
}

function updateFromEvent(event) {
  setPointer(event.clientX, event.clientY);
}

function updateFromTouch(event) {
  if (!event.touches.length) return;
  const touch = event.touches[0];
  setPointer(touch.clientX, touch.clientY);
}

function drawParticles() {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  particles.forEach((particle) => {
    particle.y -= particle.speed * particle.z;
    particle.x += particle.drift + pointer.x * 0.14 * particle.z;

    if (particle.y < -12) {
      particle.y = height + 12;
      particle.x = Math.random() * width;
    }

    if (particle.x < -12) particle.x = width + 12;
    if (particle.x > width + 12) particle.x = -12;

    const glow = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.size * 7 * particle.z
    );
    glow.addColorStop(0, `hsla(${particle.hue}, 96%, 68%, ${particle.alpha})`);
    glow.addColorStop(1, `hsla(${particle.hue}, 96%, 58%, 0)`);

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 7 * particle.z, 0, Math.PI * 2);
    ctx.fill();
  });

  trails.forEach((trail) => {
    trail.life -= 0.022;
    trail.x += trail.vx;
    trail.y += trail.vy;

    const radius = trail.size * (1 + (1 - trail.life) * 1.8);
    const glow = ctx.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, radius);
    glow.addColorStop(0, `rgba(255, 239, 168, ${trail.life * 0.74})`);
    glow.addColorStop(0.38, `rgba(255, 141, 38, ${trail.life * 0.34})`);
    glow.addColorStop(1, "rgba(255, 89, 20, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  trails = trails.filter((trail) => trail.life > 0);
}

function addTipTrail() {
  const sceneW = Math.min(width, height * 0.5627);
  const sceneH = Math.min(height, width * 1.7772);
  const sceneLeft = (width - sceneW) / 2;
  const sceneTop = (height - sceneH) / 2;
  const tipX = sceneLeft + sceneW * 0.508 + motion.offsetX * 1.7;
  const tipY = sceneTop + sceneH * 0.875 + motion.offsetY * 1.7;

  if (trails.length > 42) trails.shift();
  trails.push({
    x: tipX + (Math.random() - 0.5) * 10,
    y: tipY + (Math.random() - 0.5) * 10,
    vx: (Math.random() - 0.5) * 0.36 - pointer.x * 0.22,
    vy: -Math.random() * 0.34 - 0.06,
    size: Math.random() * 18 + 18,
    life: 1
  });
}

function animate(time) {
  const idleDelay = time - pointer.lastMove > 1600;
  const targetX = pointer.active || !idleDelay ? pointer.targetX : 0;
  const targetY = pointer.active || !idleDelay ? pointer.targetY : 0;
  const idle = time * 0.001;

  pointer.x = lerp(pointer.x, targetX, 0.075);
  pointer.y = lerp(pointer.y, targetY, 0.075);
  pointer.px = lerp(pointer.px || width / 2, pointer.targetPx || width / 2, 0.12);
  pointer.py = lerp(pointer.py || height / 2, pointer.targetPy || height / 2, 0.12);
  pointer.speed = lerp(
    pointer.speed,
    Math.hypot(pointer.x - pointer.prevX, pointer.y - pointer.prevY) * 18,
    0.12
  );
  pointer.prevX = pointer.x;
  pointer.prevY = pointer.y;

  const idleX = Math.sin(idle * 0.5) * 1.4;
  const idleY = Math.cos(idle * 0.46) * 1.7;
  const maxShift = Math.min(width, height) < 640 ? 7 : 10;
  const targetAngle = pointer.x * 1.7 + pointer.y * -0.35;
  motion.angleVelocity = lerp(motion.angleVelocity, targetAngle - motion.angle, 0.025);

  motion.offsetX = lerp(motion.offsetX, pointer.x * maxShift + idleX, 0.045);
  motion.offsetY = lerp(motion.offsetY, pointer.y * maxShift * 0.62 + idleY, 0.045);
  motion.angle = lerp(motion.angle, targetAngle + motion.angleVelocity * 0.45, 0.042);
  motion.rotateX = lerp(motion.rotateX, pointer.x * 1.55, 0.04);
  motion.rotateY = lerp(motion.rotateY, pointer.y * -1.25, 0.04);
  motion.depth = lerp(motion.depth, Math.abs(pointer.x) * 4.5 + Math.abs(pointer.y) * 3, 0.035);
  motion.energy = lerp(motion.energy, clamp(pointer.speed, 0, 1), 0.07);

  if (pointer.speed > 0.32 && Math.random() < pointer.speed * 0.28) {
    addTipTrail();
  }

  root.style.setProperty("--mx", `${motion.offsetX.toFixed(2)}px`);
  root.style.setProperty("--my", `${motion.offsetY.toFixed(2)}px`);
  root.style.setProperty("--tilt", `${motion.angle.toFixed(2)}deg`);
  root.style.setProperty("--tilt-x", `${motion.rotateX.toFixed(2)}deg`);
  root.style.setProperty("--tilt-y", `${motion.rotateY.toFixed(2)}deg`);
  root.style.setProperty("--depth", `${motion.depth.toFixed(2)}px`);
  root.style.setProperty("--energy", motion.energy.toFixed(3));
  root.style.setProperty("--cursor-x", `${pointer.px.toFixed(1)}px`);
  root.style.setProperty("--cursor-y", `${pointer.py.toFixed(1)}px`);
  root.style.setProperty("--light-x", `${(50 + pointer.x * 9).toFixed(2)}%`);
  root.style.setProperty("--light-y", `${(46 + pointer.y * 7).toFixed(2)}%`);

  drawParticles();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener("pointermove", updateFromEvent, { passive: true });
window.addEventListener("pointerleave", releasePointer, { passive: true });
window.addEventListener("touchmove", updateFromTouch, { passive: true });
window.addEventListener("touchend", releasePointer, { passive: true });

stage.addEventListener("contextmenu", (event) => event.preventDefault());

resizeCanvas();
requestAnimationFrame(animate);
