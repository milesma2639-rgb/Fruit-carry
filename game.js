const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ui = {
  basketCount: document.getElementById('basketCount'),
  collectedCount: document.getElementById('collectedCount'),
  checkpointCount: document.getElementById('checkpointCount'),
  distance: document.getElementById('distance'),
  state: document.getElementById('state')
};

const worldWidth = 2600;
const gravity = 0.72;
const moveSpeed = 4.2;
const jumpPower = -14;

const keys = {
  left: false,
  right: false,
  jump: false
};

let game;

function createGameState() {
  const platforms = [
    { x: 0, y: 350, w: 620, h: 70 },
    { x: 700, y: 315, w: 170, h: 20 },
    { x: 930, y: 280, w: 160, h: 20 },
    { x: 1150, y: 335, w: 190, h: 20 },
    { x: 1430, y: 300, w: 190, h: 20 },
    { x: 1700, y: 260, w: 170, h: 20 },
    { x: 1940, y: 315, w: 180, h: 20 },
    { x: 2210, y: 340, w: 270, h: 20 }
  ];

  const hazards = [
    { x: 650, y: 332, w: 30, h: 18 },
    { x: 1095, y: 262, w: 30, h: 18 },
    { x: 1380, y: 332, w: 30, h: 18 },
    { x: 1882, y: 332, w: 30, h: 18 },
    { x: 2140, y: 332, w: 30, h: 18 }
  ];

  const fruits = [
    { x: 760, y: 280, r: 11, taken: false },
    { x: 1010, y: 245, r: 11, taken: false },
    { x: 1210, y: 300, r: 11, taken: false },
    { x: 1480, y: 265, r: 11, taken: false },
    { x: 1780, y: 225, r: 11, taken: false },
    { x: 2010, y: 280, r: 11, taken: false },
    { x: 2360, y: 305, r: 11, taken: false }
  ];

  const checkpoints = [450, 1030, 1650, 2200];

  return {
    running: true,
    blackoutTimer: 0,
    message: 'Reach grandparents\' house without touching hazards!',
    cameraX: 0,
    checkpointX: 70,
    checkpointIndex: -1,
    stats: {
      fruitsCollected: 0,
      checkpointVisits: 0
    },
    player: {
      x: 70,
      y: 290,
      w: 44,
      h: 58,
      vx: 0,
      vy: 0,
      onGround: false,
      fruits: 4
    },
    platforms,
    hazards,
    fruits,
    checkpoints,
    finishHouse: { x: worldWidth - 180, y: 238, w: 150, h: 110 }
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleHitsRect(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function resetToCheckpoint() {
  const player = game.player;
  player.x = game.checkpointX;
  player.y = 260;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  game.blackoutTimer = 65;
  game.message = 'You touched a hazard. Blackout... back to checkpoint.';
}

function updatePlayerPhysics() {
  const player = game.player;

  player.vx = 0;
  if (keys.left) player.vx = -moveSpeed;
  if (keys.right) player.vx = moveSpeed;

  if (keys.jump && player.onGround) {
    player.vy = jumpPower;
    player.onGround = false;
  }

  player.x += player.vx;
  player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));

  player.vy += gravity;
  player.y += player.vy;

  player.onGround = false;

  for (const p of game.platforms) {
    const wasAbove = player.y + player.h - player.vy <= p.y;
    const horizontalHit = player.x + player.w > p.x && player.x < p.x + p.w;
    const landing = player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + 20;

    if (player.vy >= 0 && wasAbove && horizontalHit && landing) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.y > canvas.height + 100) {
    resetToCheckpoint();
  }
}

function updateGame() {
  if (!game.running) return;

  if (game.blackoutTimer > 0) {
    game.blackoutTimer -= 1;
    if (game.blackoutTimer === 0) {
      game.message = 'Try again from your checkpoint.';
    }
    return;
  }

  updatePlayerPhysics();

  const playerRect = game.player;
  for (const hazard of game.hazards) {
    if (rectsOverlap(playerRect, hazard)) {
      resetToCheckpoint();
      return;
    }
  }

  for (const fruit of game.fruits) {
    if (fruit.taken) continue;
    const hit = circleHitsRect({ x: fruit.x, y: fruit.y, r: fruit.r }, game.player);
    if (hit) {
      fruit.taken = true;
      game.player.fruits += 1;
      game.stats.fruitsCollected += 1;
      game.message = 'Nice! You picked up another fruit.';
    }
  }

  for (let i = game.checkpointIndex + 1; i < game.checkpoints.length; i++) {
    if (game.player.x >= game.checkpoints[i]) {
      game.checkpointIndex = i;
      game.checkpointX = game.checkpoints[i];
      game.stats.checkpointVisits += 1;
      game.message = `Checkpoint reached at ${game.checkpointX} m.`;
    }
  }

  if (game.player.x + game.player.w >= game.finishHouse.x + 20) {
    game.running = false;
    game.message = 'You made it to grandparents\' house with your basket safe!';
  }

  game.cameraX = Math.max(0, Math.min(worldWidth - canvas.width, game.player.x - 240));
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#93c5fd');
  sky.addColorStop(0.65, '#67e8f9');
  sky.addColorStop(0.66, '#4d7c0f');
  sky.addColorStop(1, '#166534');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  for (let i = 0; i < 5; i++) {
    const cx = ((game.cameraX * 0.15 + i * 250) % (canvas.width + 200)) - 100;
    const y = 50 + (i % 2) * 26;
    ctx.beginPath();
    ctx.arc(cx, y, 22, 0, Math.PI * 2);
    ctx.arc(cx + 20, y + 5, 16, 0, Math.PI * 2);
    ctx.arc(cx - 18, y + 5, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  const camera = game.cameraX;

  for (const p of game.platforms) {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(p.x - camera, p.y, p.w, p.h);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(p.x - camera, p.y, p.w, 7);
  }

  for (const checkpointX of game.checkpoints) {
    const x = checkpointX - camera;
    if (x < -20 || x > canvas.width + 20) continue;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 240);
    ctx.lineTo(x, 344);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, 240, 28, 20);
  }

  for (const hazard of game.hazards) {
    const x = hazard.x - camera;
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(x, hazard.y + hazard.h);
    ctx.lineTo(x + hazard.w / 2, hazard.y);
    ctx.lineTo(x + hazard.w, hazard.y + hazard.h);
    ctx.closePath();
    ctx.fill();
  }

  for (const fruit of game.fruits) {
    if (fruit.taken) continue;
    drawFruit(fruit.x - camera, fruit.y, fruit.r);
  }

  drawFinishHouse(game.finishHouse.x - camera, game.finishHouse.y);
}

function drawFinishHouse(x, y) {
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(x, y + 24, 150, 86);
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 25);
  ctx.lineTo(x + 76, y - 22);
  ctx.lineTo(x + 158, y + 25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(x + 58, y + 68, 36, 42);
}

function drawPlayer() {
  const x = game.player.x - game.cameraX;
  const y = game.player.y;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 8, y + 18, 30, 36);
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(x + 6, y + 10, 34, 16);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 6, y + 10, 34, 16);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 20, y, 8, 14);
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(x + 17, y + 2, 14, 10);

  const fruitDots = Math.min(7, game.player.fruits);
  for (let i = 0; i < fruitDots; i++) {
    ctx.fillStyle = ['#ef4444', '#22c55e', '#eab308', '#f97316'][i % 4];
    ctx.beginPath();
    ctx.arc(x + 10 + i * 4.5, y + 16 - (i % 2) * 2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFruit(x, y, r) {
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#166534';
  ctx.fillRect(x - 1, y - r - 3, 2, 8);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawWorld();
  drawPlayer();

  if (game.blackoutTimer > 0) {
    const alpha = Math.min(0.9, 0.35 + game.blackoutTimer / 85);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCenteredText('Blackout... touched a hazard', canvas.height / 2, '#e5e7eb', 30);
  } else if (!game.running) {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCenteredText('Grandparents welcome you home!', canvas.height / 2 - 20, '#fef08a', 34);
    drawCenteredText('Press R or Restart Journey', canvas.height / 2 + 24, '#e2e8f0', 20);
  }

  if (game.message) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    ctx.fillRect(14, 14, 510, 34);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui';
    ctx.fillText(game.message, 24, 37);
  }
}

function drawCenteredText(text, y, color, size) {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui`;
  const w = ctx.measureText(text).width;
  ctx.fillText(text, (canvas.width - w) / 2, y);
}

function updateHud() {
  ui.basketCount.textContent = game.player.fruits;
  ui.collectedCount.textContent = game.stats.fruitsCollected;
  ui.checkpointCount.textContent = `${game.stats.checkpointVisits} (${game.checkpointX} m)`;
  ui.distance.textContent = `${Math.floor(game.player.x)} m / ${worldWidth} m`;
  ui.state.textContent = game.blackoutTimer > 0 ? 'Blackout' : game.running ? 'Running' : 'Finished';
  ui.state.style.color = game.blackoutTimer > 0 ? 'var(--warn)' : game.running ? 'var(--good)' : '#fef08a';
}

function loop() {
  updateGame();
  drawScene();
  updateHud();
  requestAnimationFrame(loop);
}

function handleKeyDown(event) {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = true;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = true;
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    keys.jump = true;
    event.preventDefault();
  }
  if (event.code === 'KeyR') restart();
}

function handleKeyUp(event) {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = false;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = false;
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') keys.jump = false;
}

function restart() {
  game = createGameState();
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
document.getElementById('restartBtn').addEventListener('click', restart);

restart();
loop();
