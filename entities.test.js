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

test('Animal flashRed saves original materials and sets red flash material', () => {
  const mockScene = { add: () => {}, remove: () => {} };
  const sheep = new Sheep(0, 0, 0, mockScene);

  const mockMesh = new global.THREE.Mesh();
  const originalMaterial = { color: 'white' };
  mockMesh.material = originalMaterial;
  sheep.group.add(mockMesh);

  const mockNonMesh = { isMesh: false, material: { color: 'blue' } };
  sheep.group.add(mockNonMesh);

  sheep.flashRed();

  assert.strictEqual(sheep.hurtTimer, 0.2);
  assert.ok(Sheep.redFlashMat, 'redFlashMat should be initialized');
  assert.strictEqual(mockMesh.material, Sheep.redFlashMat, 'mesh material should be changed to redFlashMat');
  assert.strictEqual(mockNonMesh.material.color, 'blue', 'non-mesh material should not be changed');
  assert.strictEqual(sheep.originalMaterials.get(mockMesh), originalMaterial, 'original material should be saved');
  assert.ok(!sheep.originalMaterials.has(mockNonMesh), 'non-mesh should not be in originalMaterials');
});

test('Animal flashRed called multiple times preserves the first original material', () => {
  const mockScene = { add: () => {}, remove: () => {} };
  const sheep = new Sheep(0, 0, 0, mockScene);

  const mockMesh = new global.THREE.Mesh();
  const originalMaterial = { color: 'white' };
  mockMesh.material = originalMaterial;
  sheep.group.add(mockMesh);

  sheep.flashRed();

  // Change the flash material or simulate a state where it's modified
  mockMesh.material = { color: 'yellow' };

  sheep.flashRed();

  assert.strictEqual(sheep.originalMaterials.get(mockMesh), originalMaterial, 'original material should not be overwritten on subsequent calls');
});

test('Animal resetMaterials restores original materials correctly', () => {
  const mockScene = { add: () => {}, remove: () => {} };
  const sheep = new Sheep(0, 0, 0, mockScene);

  const mockMesh = new global.THREE.Mesh();
  const originalMaterial = { color: 'white' };
  mockMesh.material = originalMaterial;
  sheep.group.add(mockMesh);

  // Mesh 2 that is not tracked in originalMaterials
  const mockMesh2 = new global.THREE.Mesh();
  const otherMaterial = { color: 'gray' };
  mockMesh2.material = otherMaterial;
  sheep.group.add(mockMesh2);

  const mockNonMesh = { isMesh: false, material: { color: 'blue' } };
  sheep.group.add(mockNonMesh);

  // Only track the first mesh
  sheep.originalMaterials.set(mockMesh, originalMaterial);

  // Alter materials as if they had been flashed
  mockMesh.material = { color: 'red' };
  mockMesh2.material = { color: 'red' };
  mockNonMesh.material = { color: 'red' };

  sheep.resetMaterials();

  assert.strictEqual(mockMesh.material, originalMaterial, 'tracked mesh material should be restored');
  assert.strictEqual(mockMesh2.material.color, 'red', 'untracked mesh should not be restored');
  assert.strictEqual(mockNonMesh.material.color, 'red', 'non-mesh should not be restored');
});
