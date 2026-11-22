// VAULTBREAK — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to fit
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One map tile, in pixels. Walls, loot and patrols are laid out on this grid. */
export const TILE = 40;

export const PLAYER = {
  radius: 13,
  speed: 175,
  /** Seconds the thief stays hidden inside a smoke cloud. */
  smokeTime: 4,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 68,
  chaseSpeed: 132,
  /** How far a guard can see, in pixels. */
  sight: 205,
  /** Half of a guard's vision cone, in radians. */
  halfAngle: 0.62,
  /** Seconds a guard keeps chasing after losing sight of the thief. */
  memory: 1.6,
};

export const CAMERA = {
  /** How far a camera can see, in pixels. */
  sight: 185,
  halfAngle: 0.55,
  /** Seconds for one full sweep back and forth. */
  sweepPeriod: 5.2,
  /** How wide the sweep swings, in radians each side of the base angle. */
  sweepSwing: 0.85,
};

export const ALARM = {
  /** Alarm points gained per second while a guard stares at the thief. */
  guardRate: 42,
  /** Alarm points gained per second while a camera stares at the thief. */
  cameraRate: 32,
  /** Alarm points lost per second while nobody sees the thief. */
  decay: 12,
  /** Alarm value that ends the run of a level: the thief is caught. */
  caughtAt: 100,
};

export const TOOLS = {
  /** Coins an EMP burst costs; it switches every camera off for empTime seconds. */
  empCost: 60,
  empTime: 6,
  /** Coins a smoke bomb costs; it hides the thief for smokeTime seconds. */
  smokeCost: 40,
  coinValue: 25,
};

export const LIVES = 3;

export const PALETTE = {
  backdrop: '#0b0d12',
  floorA: '#1d212b',
  floorB: '#191d26',
  floorTrim: '#232836',
  wall: '#3a4152',
  wallTop: '#4d5568',
  wallEdge: '#232836',
  player: '#7fe7c4',
  playerRing: '#d8fff1',
  guard: '#ff5d5d',
  guardCalm: '#ffb454',
  camera: '#ff9f43',
  coneCalm: 'rgba(255, 180, 84, 0.20)',
  coneAlert: 'rgba(255, 70, 70, 0.34)',
  coneCamera: 'rgba(255, 159, 67, 0.20)',
  loot: '#ffd94d',
  lootMain: '#ff5db1',
  coin: '#f2c94c',
  exit: '#58d68d',
  exitLocked: '#5a6274',
  smoke: 'rgba(200, 210, 225, 0.30)',
  panel: '#141821',
  panelEdge: '#2c3342',
  text: '#eef1f5',
  muted: '#9aa3b5',
  alarm: '#ff4d4d',
  alarmTrack: '#2a2f3c',
  danger: '#ff5d5d',
  good: '#58d68d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'vaultbreak.best';
