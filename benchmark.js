import { performance } from 'node:perf_hooks';

global.window = { localStorage: { getItem: () => null, setItem: () => {} } };
global.THREE = {
  Group: class {
    constructor() {
      this.position = { set: () => {}, x: 0, y: 0, z: 0 };
      this.rotation = { y: 0 };
    }
    traverse() {}
    add() {}
  },
  Vector2: class {},
  Vector3: class {
    constructor(x=0, y=0, z=0) {
      this.x = x; this.y = y; this.z = z;
    }
    set(x, y, z) {
      this.x = x; this.y = y; this.z = z;
    }
  },
  MathUtils: {
    lerp: (a, b, t) => a + (b - a) * t
  },
  MeshBasicMaterial: class {
    constructor(opts) { this.color = opts?.color; }
  },
  MeshLambertMaterial: class {},
  BoxGeometry: class {},
  Mesh: class {
    constructor() {
      this.isMesh = true;
      this.position = { set: () => {} };
    }
  }
};

const { EntityManager } = await import('./entities.js');

const mockScene = { add: () => {}, remove: () => {} };
const mockWorld = { getBlock: () => null };

function runBenchmark(numItems, numFrames) {
  const manager = new EntityManager(mockScene);

  for (let i = 0; i < numItems; i++) {
    const c = manager.spawnCollectible('meat', 100, 100, 100);
    c.time = Math.random() * 30;
  }

  const playerPos = { x: 0, y: 0, z: 0 };
  const dt = 1.0;

  const start = performance.now();
  for (let i = 0; i < numFrames; i++) {
    for(let j = 0; j < 100; j++) {
       const c = manager.spawnCollectible('meat', 100, 100, 100);
    }
    manager.update(dt, mockWorld, playerPos);
  }
  const end = performance.now();
  return end - start;
}

// Warm up
runBenchmark(1000, 10);

const numRuns = 5;
let totalTime = 0;
for(let i=0; i<numRuns; i++) {
  const t = runBenchmark(20000, 100);
  console.log(`Run ${i+1}: ${t.toFixed(2)}ms`);
  totalTime += t;
}

console.log(`Average Baseline Benchmark time: ${(totalTime / numRuns).toFixed(2)}ms`);
