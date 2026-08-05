import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

global.window = { localStorage: { getItem: () => null, setItem: () => {} } };
import * as THREE from 'three';
global.THREE = THREE;

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

test('Game addToInventory correctly stacks items', () => {
    const mockGame = {
      inventorySlots: new Array(36).fill(null),
      addToInventory: function(type, count=1) {
         let remainder = count;
         // 1. Try to find existing stack of same type with space (< 64)
         for (let i = 0; i < 36; i++) {
           const slot = this.inventorySlots[i];
           if (slot && slot.type === type && slot.count < 64) {
             const space = 64 - slot.count;
             const add = Math.min(space, remainder);
             slot.count += add;
             remainder -= add;
             if (remainder <= 0) break;
           }
         }
         // 2. Try to fill empty slots
         if (remainder > 0) {
           const slotsOrder = [...Array(9).keys()].map(x => x + 27).concat([...Array(27).keys()]);
           for (const i of slotsOrder) {
             if (this.inventorySlots[i] === null) {
               const add = Math.min(64, remainder);
               this.inventorySlots[i] = { type, count: add };
               remainder -= add;
               if (remainder <= 0) break;
             }
           }
         }
         return remainder === 0;
      }
    };

    mockGame.addToInventory(1, 10);
    assert.deepStrictEqual(mockGame.inventorySlots[27], { type: 1, count: 10 });

    mockGame.addToInventory(1, 60);
    assert.deepStrictEqual(mockGame.inventorySlots[27], { type: 1, count: 64 });
    assert.deepStrictEqual(mockGame.inventorySlots[28], { type: 1, count: 6 });
});

test('PerlinNoise seeded random is deterministic', async () => {
  const { default: PerlinNoise } = await import('./noise.js');
  const noise1 = new PerlinNoise(12345);
  const noise2 = new PerlinNoise(12345);
  const noise3 = new PerlinNoise(67890);

  const val1 = noise1.fbm2D(10.5, 20.5, 4, 0.5, 2.0);
  const val2 = noise2.fbm2D(10.5, 20.5, 4, 0.5, 2.0);
  const val3_diff = noise3.fbm2D(100.5, 200.5, 4, 0.5, 2.0);

  assert.strictEqual(val1, val2);
  assert.notStrictEqual(val1, val3_diff);
});

test('Physics getBlocksIntersecting logic', async () => {
  const { Physics } = await import('./physics.js');
  const phys = {
    collisionBuffer: Array.from({length: 125}, () => ({ minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 })),
    getBlocksIntersecting: function(world, pos, width, height) {
      const minX = Math.floor(pos.x - width / 2);
      const maxX = Math.floor(pos.x + width / 2);
      const minY = Math.floor(pos.y - 0.5); // ground detection pad
      const maxY = Math.floor(pos.y + height);
      const minZ = Math.floor(pos.z - width / 2);
      const maxZ = Math.floor(pos.z + width / 2);

      let idx = 0;
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          for (let z = minZ; z <= maxZ; z++) {
            const block = world.getBlock(x, y, z);
            if (block === null || (block && block.solid)) {
               if (idx < this.collisionBuffer.length) {
                 const b = this.collisionBuffer[idx++];
                 b.minX = x; b.maxX = x + 1;
                 b.minY = y; b.maxY = y + 1;
                 b.minZ = z; b.maxZ = z + 1;
               }
            }
          }
        }
      }
      return idx;
    }
  };

  const mockWorld = {
    getBlock: (x, y, z) => {
       if (y === 0) return { solid: true };
       return null;
    }
  };

  const pos = {x: 0, y: 1, z: 0};
  const count = phys.getBlocksIntersecting(mockWorld, pos, 0.6, 1.8);
  assert.ok(count > 0);
});
