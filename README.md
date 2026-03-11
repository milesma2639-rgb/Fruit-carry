# Fruit Carry

A platformer browser game: carry a basket of fruit, avoid touching hazards, collect fruit on platforms, and make it to your grandparents' house.
A simple browser game: carry a basket of fruit, jump over obstacles, collect fruit on the ground, and make it to your grandparents' house.

Project files:

- `index.html` for structure/styling
- `game.js` for all game logic

## Gameplay

- **Move** with `←/→` or `A/D`.
- **Jump** with `Space`, `↑`, or `W`.
- Don't touch hazards/spikes. If you do, the screen blacks out briefly and you restart from your latest checkpoint.
- Collect fruit pickups along platforms to increase your basket count.
- **Jump** with `Space` or `↑`.
- If you collide with an obstacle, fruit spills, the screen blacks out briefly, and you restart from the **most recent checkpoint**.
- Collect fruit pickups along the way to increase your basket count.
- Reach the finish line (grandparents' house) to win.

## Run locally

Open `index.html` directly in your browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
