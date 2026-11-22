[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/arestafirman/heist-game/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/arestafirman/heist-game/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

# VAULTBREAK — a quiet heist in three rooms

A top-down 2D stealth heist game, played in a desktop browser with keyboard
and mouse, no network, no downloaded assets — every pixel and sound is drawn
and synthesised by the game's own code.

You are the thief. Three rooms, three targets, one alarm meter that decides
whether you walk out rich or get dragged back to the door.

## The three heists

| Level | Room | Target | Guards | Cameras | Loot |
|---|---|---|---|---|---|
| 1 | Galerie Lumen | Sunset Canvas ($500) | 2 | 2 | 4 pieces, $1,050 |
| 2 | Vault of Aurelia | Aurelia Diamond ($800) | 3 | 3 | 5 pieces, $1,800 |
| 3 | Rooftop Getaway | Aurelia Crown ($1,000) | 3 | 2 | 4 pieces, $1,800 |

**Headline numbers:** 3 levels, 8 guards on patrol, 7 sweeping cameras,
13 loot pieces worth $4,650, 18 coins to fund your tools, 3 lives, and a
final rating — **GHOST / SHADOW / LOUD / CAUGHT** — graded on your loudest
alarm moment across the whole run.

## How it plays

- **Read before you move.** Every guard walks a dotted patrol route with a
  vision cone; every camera sweeps its cone on a fixed rhythm. Walls break
  line of sight, so cover always works — a cone you can see is a cone you
  can beat.
- **Several routes per room.** Long walls with gaps at both ends, vaults
  with two doors, roof blocks to slip behind. The fast route is never the
  safe one.
- **Tools at a cost.** Coins scattered through the rooms buy an **EMP burst
  (key 1, $60)** that switches every camera off for 6 seconds, or a **smoke
  bomb (key 2, $40)** that hides you for 4 seconds. Spend them or save them
  — the choice is the plan.
- **A fair caught moment.** Being watched fills the alarm fast; hiding drains
  it slowly. At 100% you lose a life and restart the level from its door,
  loot and score from that level gone. Three lives, then the crew leaves
  you behind.
- **A getaway that pays.** Grab the main target to unlock the exit, then
  reach it: a time bonus rewards a quick, quiet run, and the final screen
  rates the whole job.

## Controls

- **Move:** WASD / arrow keys, or click the floor to walk there
- **1:** EMP burst — all cameras dark 6 s ($60)
- **2:** Smoke bomb — hidden 4 s ($40)
- **P / Esc:** pause · **M:** mute · **Space / click:** start, restart

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots: `shots.json` lists the four staged scenes
(`?shot=start|play|end|caught&seed=1`), each played forward from a fresh
world by the game's own autopilot. The game is static files under `game/`
with no build step.

## Source layout

- `game/src/config.js` — every tuning number and colour
- `game/src/levels.js` — the three rooms: walls, patrols, cameras, loot
- `game/src/world.js` — rules and state: movement, collisions, scoring
- `game/src/guards.js` — patrols, vision cones, chase and alert
- `game/src/cameras.js` — sweeping cones and EMP shutdown
- `game/src/loot.js` — loot, coins, EMP and smoke purchases
- `game/src/alarm.js` — the alarm meter and the final GHOST–CAUGHT rating
- `game/src/pathfind.js` — grid pathfinding that steers around live cones
- `game/src/render.js` — all drawing: rooms, cones, HUD, panels
- `game/src/input.js` — keyboard and click-to-move input
- `game/src/audio.js` — WebAudio synth: blips, alarm pulse, caught sting
- `game/src/shots.js` — the staged screenshot scenes and their autopilot
- `game/src/random.js` — seeded random for repeatable scenes
- `game/src/main.js` — boot, fixed-step loop, screens
