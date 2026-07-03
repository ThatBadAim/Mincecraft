import { test } from 'node:test';
import assert from 'node:assert';

global.window = { localStorage: { getItem: () => null, setItem: () => {} } };
global.THREE = {
  Group: class {
    constructor() {
      this.position = { set: () => {}, x: 0, y: 0, z: 0 };
    }
    traverse(callback) {
      if (this.children) {
        this.children.forEach(c => callback(c));
      }
    }
    add(child) {
      if (!this.children) this.children = [];
      this.children.push(child);
    }
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
    constructor(opts) {
      this.color = opts.color;
    }
  },
  MeshLambertMaterial: class {},
  BoxGeometry: class {},
  Mesh: class {
    constructor() {
      this.isMesh = true;
      this.position = { set: () => {} };
      this.material = {};
    }
  }
};

const { Sheep, Animal } = await import('./entities.js');

test('Animal takeDamage updates health, velocity, and state', () => {
  const mockScene = { add: () => {}, remove: () => {} };
  const sheep = new Sheep(0, 0, 0, mockScene);

  const initialHealth = sheep.health;

  sheep.takeDamage(1);

  assert.strictEqual(sheep.health, initialHealth - 1);
  assert.strictEqual(sheep.velocity.y, 3.5);
  assert.strictEqual(sheep.speed, 2.5);
  assert.strictEqual(sheep.state, 'wander');
  assert.strictEqual(sheep.stateTimer, 1.5);
  assert.strictEqual(sheep.hurtTimer, 0.2);
});

test('Animal takeDamage does nothing if already dead', () => {
  const mockScene = { add: () => {}, remove: () => {} };
  const sheep = new Sheep(0, 0, 0, mockScene);

  sheep.health = 0;

  sheep.takeDamage(1);

  assert.strictEqual(sheep.health, 0);
  assert.strictEqual(sheep.velocity.y, 0); // should not jump
});

test('Animal takeDamage triggers flashRed', () => {
  const mockScene = { add: () => {}, remove: () => {} };
  const sheep = new Sheep(0, 0, 0, mockScene);

  const mockChild = new global.THREE.Mesh();
  sheep.group.add(mockChild);

  sheep.takeDamage(1);

  assert.strictEqual(sheep.hurtTimer, 0.2);
  assert.strictEqual(mockChild.material, Sheep.redFlashMat);
});
