const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ui = {
  basketCount: document.getElementById('basketCount'),
  collectedCount: document.getElementById('collectedCount'),
  checkpointCount: document.getElementById('checkpointCount'),
  distance: document.getElementById('distance'),
  state: document.getElementById('state')
};

const finishDistance = 2200;
const gravity = 0.7;

let game;

function createGameState() {
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
  sky.addColorStop(0.56, '#67e8f9');
  sky.addColorStop(0.57, '#4d7c0f');
  sky.addColorStop(1, '#166534');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  update();
  drawScene();
  updateHud();
  requestAnimationFrame(loop);
}

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
