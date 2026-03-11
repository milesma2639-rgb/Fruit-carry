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
const finishDistance = 2200;
const gravity = 0.7;

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
  return {
    distance: 0,
    speed: 4,
    time: 0,
    running: true,
    blackoutTimer: 0,
    message: '',
    player: {
      x: 140,
      y: 0,
      w: 48,
      h: 58,
      vy: 0,
      onGround: true,
      fruits: 4
    },
    stats: {
      fruitsCollected: 0,
      checkpointVisits: 0
    },
    obstacles: [],
    fruits: [],
    checkpointDistance: 0,
    rng: Math.random
  };
}

function groundY() {
  return canvas.height - 84;
}

function jump() {
  if (!game.running || game.blackoutTimer > 0) return;
  if (game.player.onGround) {
    game.player.vy = -13.8;
    game.player.onGround = false;
  }
}

function restart() {
  game = createGameState();
  game.player.y = groundY() - game.player.h;
}

function scheduleSpawns() {
  const lastObstacleX = game.obstacles.length ? game.obstacles[game.obstacles.length - 1].x : 0;
  while (lastObstacleX + 280 > game.distance + canvas.width) break;

  if (!game._nextObstacleAt) game._nextObstacleAt = 260;
  if (!game._nextFruitAt) game._nextFruitAt = 150;

  if (game.distance + canvas.width > game._nextObstacleAt && game._nextObstacleAt < finishDistance) {
    const height = 35 + Math.floor(game.rng() * 44);
    const width = 24 + Math.floor(game.rng() * 24);
    game.obstacles.push({ x: game._nextObstacleAt, y: groundY() - height, w: width, h: height });
    game._nextObstacleAt += 170 + Math.floor(game.rng() * 170);
  }

  if (game.distance + canvas.width > game._nextFruitAt && game._nextFruitAt < finishDistance - 80) {
    const yOffset = 18 + Math.floor(game.rng() * 65);
    game.fruits.push({ x: game._nextFruitAt, y: groundY() - yOffset, r: 11 });
    game._nextFruitAt += 130 + Math.floor(game.rng() * 140);
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (!game.running) return;

  game.time += 1;
  if (game.blackoutTimer > 0) {
    game.blackoutTimer -= 1;
    if (game.blackoutTimer === 0) {
      game.message = 'Back at checkpoint! Keep going.';
    }
    return;
  }

  updatePlayerPhysics();

  const playerRect = game.player;
  for (const hazard of game.hazards) {
    if (rectsOverlap(playerRect, hazard)) {
      resetToCheckpoint();
  game.distance += game.speed;
  if (game.time % 240 === 0) {
    game.speed = Math.min(7.2, game.speed + 0.2);
  }

  const player = game.player;
  player.vy += gravity;
  player.y += player.vy;
  const floor = groundY() - player.h;
  if (player.y >= floor) {
    player.y = floor;
    player.vy = 0;
    player.onGround = true;
  }

  scheduleSpawns();

  game.obstacles = game.obstacles.filter((o) => o.x + o.w > game.distance - 30);
  game.fruits = game.fruits.filter((f) => f.x + f.r > game.distance - 30);

  const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };

  for (const obs of game.obstacles) {
    const o = { x: obs.x - game.distance + player.x, y: obs.y, w: obs.w, h: obs.h };
    if (rectsOverlap(playerRect, o)) {
      player.fruits = Math.max(0, player.fruits - 1);
      game.distance = game.checkpointDistance;
      game.blackoutTimer = 70;
      game.message = 'You spilled fruit! Everything blacks out...';
      if (player.fruits === 0) {
        player.fruits = 1;
        game.message = 'You dropped almost everything, but kept 1 fruit.';
      }
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
  for (let i = game.fruits.length - 1; i >= 0; i--) {
    const fruit = game.fruits[i];
    const dx = fruit.x - game.distance + player.x + player.w / 2;
    const dy = fruit.y - (player.y + player.h / 2);
    if (Math.hypot(dx - player.w / 2, dy) < fruit.r + player.w * 0.36) {
      game.fruits.splice(i, 1);
      player.fruits += 1;
      game.stats.fruitsCollected += 1;
    }
  }

  const checkpointEvery = 500;
  const reachedCheckpoint = Math.floor(game.distance / checkpointEvery);
  const currentCheckpoint = Math.floor(game.checkpointDistance / checkpointEvery);
  if (reachedCheckpoint > currentCheckpoint) {
    game.checkpointDistance = reachedCheckpoint * checkpointEvery;
    game.stats.checkpointVisits += 1;
    game.message = `Checkpoint reached at ${game.checkpointDistance} m!`;
  }

  if (game.distance >= finishDistance) {
    game.distance = finishDistance;
    game.running = false;
    game.message = 'You reached grandparents\' house!';
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawGroundDecor();
  drawFinishHouse();

  const player = game.player;

  for (const fruit of game.fruits) {
    const x = fruit.x - game.distance + player.x;
    if (x < -40 || x > canvas.width + 40) continue;
    drawFruit(x, fruit.y, fruit.r);
  }

  for (const obs of game.obstacles) {
    const x = obs.x - game.distance + player.x;
    if (x < -80 || x > canvas.width + 80) continue;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, obs.y, obs.w, obs.h);
    ctx.fillStyle = '#a16207';
    ctx.fillRect(x + 4, obs.y + 6, obs.w - 8, obs.h - 12);
  }

  drawPlayer(player);

  if (game.blackoutTimer > 0) {
    const alpha = Math.min(0.92, 0.35 + game.blackoutTimer / 90);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    centeredText('Blackout... returning to checkpoint', canvas.height / 2, '#e5e7eb', 28);
  } else if (!game.running) {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    centeredText('Grandparents welcome you home!', canvas.height / 2 - 20, '#fef08a', 34);
    centeredText('Press R or Restart Journey', canvas.height / 2 + 24, '#e2e8f0', 20);
  }

  if (game.message) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    ctx.fillRect(14, 14, 420, 34);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui';
    ctx.fillText(game.message, 24, 37);
  }
}

function centeredText(text, y, color, size) {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui`;
  const w = ctx.measureText(text).width;
  ctx.fillText(text, (canvas.width - w) / 2, y);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#93c5fd');
  sky.addColorStop(0.65, '#67e8f9');
  sky.addColorStop(0.66, '#4d7c0f');
  sky.addColorStop(0.56, '#67e8f9');
  sky.addColorStop(0.57, '#4d7c0f');
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
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 4; i++) {
    const cx = ((game.distance * 0.13 + i * 240) % (canvas.width + 180)) - 80;
    const y = 50 + (i % 2) * 30;
    ctx.beginPath();
    ctx.arc(cx, y, 24, 0, Math.PI * 2);
    ctx.arc(cx + 20, y + 6, 18, 0, Math.PI * 2);
    ctx.arc(cx - 20, y + 6, 18, 0, Math.PI * 2);
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
function drawGroundDecor() {
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, groundY(), canvas.width, canvas.height - groundY());

  for (let i = 0; i < canvas.width; i += 42) {
    const sway = Math.sin((game.distance + i) * 0.02) * 2;
    ctx.strokeStyle = '#84cc16';
    ctx.beginPath();
    ctx.moveTo(i, groundY());
    ctx.lineTo(i + sway, groundY() - 10 - (i % 5));
    ctx.stroke();
  }
}

function drawFinishHouse() {
  const x = finishDistance - game.distance + game.player.x;
  if (x < -180 || x > canvas.width + 180) return;

  const y = groundY() - 110;
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(x, y + 26, 130, 84);
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 28);
  ctx.lineTo(x + 66, y - 20);
  ctx.lineTo(x + 138, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(x + 50, y + 70, 32, 40);
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(x + 14, y + 52, 24, 20);
  ctx.fillRect(x + 94, y + 52, 24, 20);
}

function drawPlayer(player) {
  const x = player.x;
  const y = player.y;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 8, y + 18, 32, 36);
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(x + 6, y + 10, 36, 16);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 6, y + 10, 36, 16);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 21, y, 8, 14);
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(x + 18, y + 2, 14, 10);

  const fruitDots = Math.min(7, player.fruits);
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
function updateHud() {
  ui.basketCount.textContent = game.player.fruits;
  ui.collectedCount.textContent = game.stats.fruitsCollected;
  ui.checkpointCount.textContent = `${game.stats.checkpointVisits} (${game.checkpointDistance} m)`;
  ui.distance.textContent = `${Math.floor(game.distance)} m / ${finishDistance} m`;
  ui.state.textContent = game.blackoutTimer > 0
    ? 'Blackout'
    : game.running ? 'Running' : 'Finished';
  ui.state.style.color = game.blackoutTimer > 0 ? 'var(--warn)' : game.running ? 'var(--good)' : '#fef08a';
}

function loop() {
  updateGame();
  update();
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
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    jump();
  }
  if (event.code === 'KeyR') {
    restart();
  }
});

document.getElementById('restartBtn').addEventListener('click', restart);

restart();
loop();
