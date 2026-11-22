// The three heists. Each level is a room the thief crosses: walls that make two
// or three routes, guards walking patrols, sweeping cameras, loot to grab and a
// locked exit that only opens once the main target is taken. Coordinates are in
// the 1280x720 playfield; every patrol line and loot spot was placed clear of
// the walls, so a careful thief can always slip through.

function border() {
  return [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
  ];
}

export const LEVELS = [
  {
    id: 1,
    name: 'GALERIE LUMEN',
    sub: 'Level 1 — steal the Sunset Canvas',
    hint: 'Two routes around the long wall. Wait for the camera sweep, then move.',
    par: 75,
    spawn: { x: 110, y: 620 },
    exit: { x: 1185, y: 85 },
    walls: [
      ...border(),
      { x: 420, y: 96, w: 28, h: 300 },
      { x: 640, y: 360, w: 400, h: 28 },
      { x: 760, y: 140, w: 90, h: 90 },
      { x: 980, y: 96, w: 28, h: 180 },
    ],
    guards: [
      { waypoints: [{ x: 120, y: 180 }, { x: 380, y: 180 }], pause: 1.4 },
      { waypoints: [{ x: 520, y: 520 }, { x: 1120, y: 520 }], pause: 1.1 },
    ],
    cameras: [
      // Mounted just under the top wall, so the body shows below the HUD bar.
      { x: 640, y: 72, angle: Math.PI / 2 },
      { x: 1244, y: 360, angle: Math.PI },
    ],
    loot: [
      { x: 620, y: 150, kind: 'painting', name: 'Sunset Canvas', value: 500, main: true },
      { x: 180, y: 140, kind: 'painting', name: 'Blue Study', value: 200 },
      { x: 1100, y: 220, kind: 'painting', name: 'Red Hour', value: 200 },
      { x: 320, y: 560, kind: 'painting', name: 'Quiet Field', value: 150 },
    ],
    coins: [
      { x: 200, y: 360 }, { x: 560, y: 600 }, { x: 880, y: 480 },
      { x: 1120, y: 620 }, { x: 700, y: 260 }, { x: 1020, y: 120 },
    ],
  },
  {
    id: 2,
    name: 'VAULT OF AURELIA',
    sub: 'Level 2 — crack the vault, take the diamond',
    hint: 'The vault has two doors, top and bottom. Three guards, three cameras — spend coins on EMP.',
    par: 95,
    spawn: { x: 110, y: 620 },
    exit: { x: 1185, y: 85 },
    walls: [
      ...border(),
      { x: 520, y: 200, w: 120, h: 24 },
      { x: 720, y: 200, w: 120, h: 24 },
      { x: 520, y: 376, w: 120, h: 24 },
      { x: 720, y: 376, w: 120, h: 24 },
      { x: 520, y: 200, w: 24, h: 200 },
      { x: 816, y: 200, w: 24, h: 200 },
      { x: 300, y: 96, w: 28, h: 260 },
      { x: 880, y: 480, w: 300, h: 28 },
    ],
    guards: [
      { waypoints: [{ x: 140, y: 500 }, { x: 460, y: 500 }], pause: 1.2 },
      { waypoints: [{ x: 900, y: 160 }, { x: 1150, y: 160 }], pause: 1.0 },
      { waypoints: [{ x: 880, y: 290 }, { x: 1150, y: 290 }], pause: 1.5 },
    ],
    cameras: [
      // Mounted just under the top wall, so the body shows below the HUD bar.
      { x: 640, y: 72, angle: Math.PI / 2 },
      { x: 1244, y: 200, angle: Math.PI },
      { x: 300, y: 684, angle: -Math.PI / 2 },
    ],
    loot: [
      { x: 680, y: 290, kind: 'diamond', name: 'Aurelia Diamond', value: 800, main: true },
      { x: 580, y: 250, kind: 'gold', name: 'Gold Bar', value: 300 },
      { x: 780, y: 330, kind: 'gold', name: 'Gold Bar', value: 300 },
      { x: 180, y: 500, kind: 'painting', name: 'Night Watch', value: 200 },
      { x: 1120, y: 420, kind: 'painting', name: 'Silver Lake', value: 200 },
    ],
    coins: [
      { x: 140, y: 140 }, { x: 420, y: 140 }, { x: 980, y: 560 },
      { x: 1120, y: 640 }, { x: 680, y: 560 }, { x: 240, y: 640 },
    ],
  },
  {
    id: 3,
    name: 'ROOFTOP GETAWAY',
    sub: 'Level 3 — grab the crown, reach the helicopter',
    hint: 'Open roof, little cover. Use the AC units, smoke the last stretch to the pad.',
    par: 90,
    spawn: { x: 110, y: 620 },
    exit: { x: 1185, y: 85 },
    walls: [
      ...border(),
      { x: 300, y: 140, w: 120, h: 80 },
      { x: 640, y: 300, w: 140, h: 90 },
      { x: 950, y: 140, w: 110, h: 80 },
      { x: 420, y: 520, w: 120, h: 80 },
      { x: 900, y: 480, w: 130, h: 80 },
    ],
    guards: [
      { waypoints: [{ x: 150, y: 300 }, { x: 560, y: 300 }], pause: 1.0 },
      { waypoints: [{ x: 1150, y: 100 }, { x: 1150, y: 560 }], pause: 1.3 },
      { waypoints: [{ x: 200, y: 620 }, { x: 800, y: 620 }], pause: 1.1 },
    ],
    cameras: [
      // Mounted just under the top wall, so the body shows below the HUD bar.
      { x: 640, y: 72, angle: Math.PI / 2 },
      { x: 1244, y: 360, angle: Math.PI },
    ],
    loot: [
      { x: 680, y: 240, kind: 'crown', name: 'Aurelia Crown', value: 1000, main: true },
      { x: 250, y: 450, kind: 'gold', name: 'Gold Bar', value: 300 },
      { x: 1050, y: 300, kind: 'gold', name: 'Gold Bar', value: 300 },
      { x: 500, y: 120, kind: 'painting', name: 'First Light', value: 200 },
    ],
    coins: [
      { x: 150, y: 120 }, { x: 1150, y: 620 }, { x: 850, y: 220 },
      { x: 350, y: 300 }, { x: 1000, y: 620 }, { x: 600, y: 560 },
    ],
  },
];
