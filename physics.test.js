import { test } from 'node:test';
import assert from 'node:assert';

// Mock window for audio.js
global.window = { localStorage: { getItem: () => null, setItem: () => {} } };

// Mock THREE
global.THREE = {
  Vector3: class {
    constructor(x=0, y=0, z=0) {
      this.x = x; this.y = y; this.z = z;
    }
    set(x, y, z) {
      this.x = x; this.y = y; this.z = z;
      return this;
    }
    normalize() {
      const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (length > 0) {
        this.x /= length;
        this.y /= length;
        this.z /= length;
      }
      return this;
    }
    crossVectors(a, b) {
      this.x = a.y * b.z - a.z * b.y;
      this.y = a.z * b.x - a.x * b.z;
      this.z = a.x * b.y - a.y * b.x;
      return this;
    }
    copy(v) {
      this.x = v.x; this.y = v.y; this.z = v.z;
      return this;
    }
    multiplyScalar(s) {
      this.x *= s; this.y *= s; this.z *= s;
      return this;
    }
    addScaledVector(v, s) {
      this.x += v.x * s; this.y += v.y * s; this.z += v.z * s;
      return this;
    }
  },
  MathUtils: {
    lerp: (a, b, t) => a + (b - a) * t
  }
};

// Import and stub gameAudio methods
const { gameAudio } = await import('./audio.js');
gameAudio.playJumpSound = () => {};
gameAudio.playLandSound = () => {};
gameAudio.playFootstepSound = () => {};

const { PhysicsEngine } = await import('./physics.js');

function createMockWorld(blocks = {}) {
  return {
    getBlock: (x, y, z) => {
      const key = `${x},${y},${z}`;
      if (blocks[key]) {
        return { type: blocks[key].type, solid: blocks[key].solid !== false };
      }
      return { type: 0, solid: false }; // Default to air
    }
  };
}

test('PhysicsEngine gravity pulls player down', () => {
  const engine = new PhysicsEngine();
  engine.position.set(0, 10, 0); // Start high
  engine.velocity.set(0, 0, 0);
  engine.onGround = false;

  const world = createMockWorld(); // Empty world (air)

  engine.update(0.1, {}, { x: 0, y: 0, z: -1 }, world);

  assert.ok(engine.velocity.y < 0, `Velocity Y should be negative (falling), got ${engine.velocity.y}`);
  assert.ok(engine.position.y < 10, `Position Y should have decreased, got ${engine.position.y}`);
});

test('PhysicsEngine jumping', () => {
  const engine = new PhysicsEngine();
  engine.position.set(0, 1, 0);
  engine.velocity.set(0, 0, 0);
  engine.onGround = true; // Pretend we are on the ground

  const world = createMockWorld();

  // Provide Space key
  engine.update(0.1, { 'Space': true }, { x: 0, y: 0, z: -1 }, world);

  assert.strictEqual(engine.velocity.y, engine.jumpForce, 'Velocity Y should equal jumpForce');
  assert.strictEqual(engine.onGround, false, 'Should not be on ground after jumping');
});

test('PhysicsEngine horizontal movement forward', () => {
  const engine = new PhysicsEngine();
  engine.position.set(0, 1, 0);
  engine.velocity.set(0, 0, 0);
  engine.onGround = true;

  const world = createMockWorld();

  // Face negative Z direction
  const cameraDirection = { x: 0, y: 0, z: -1 };

  engine.update(0.1, { 'KeyW': true }, cameraDirection, world);

  assert.ok(engine.velocity.z < 0, 'Should move forward (negative Z)');
});

test('PhysicsEngine collision with ground stops falling', () => {
  const engine = new PhysicsEngine();
  engine.position.set(0, 1.5, 0); // Right above ground
  engine.velocity.set(0, -5, 0); // Falling fast
  engine.onGround = false;

  // Solid block at y=0 (bounds 0 to 1)
  const world = createMockWorld({
    '0,0,0': { type: 1, solid: true } // Grass
  });

  engine.update(0.1, {}, { x: 0, y: 0, z: -1 }, world);

  assert.strictEqual(engine.velocity.y, 0, 'Velocity Y should be reset to 0 upon ground collision');
  assert.strictEqual(engine.onGround, true, 'Should be on ground after collision');
  assert.ok(engine.position.y >= 1.0, 'Position Y should be placed on top of the block');
});

test('PhysicsEngine horizontal collision with wall', () => {
  const engine = new PhysicsEngine();
  engine.position.set(0, 1, 0);
  engine.velocity.set(0, 0, 0);
  engine.onGround = true;

  // Face positive X direction
  const cameraDirection = { x: 1, y: 0, z: 0 };

  // Solid block at x=1
  const world = createMockWorld({
    '1,1,0': { type: 1, solid: true }
  });

  // Keep trying to move forward into the wall
  engine.update(0.1, { 'KeyW': true }, cameraDirection, world);

  // Because of collision, X velocity should be resolved to 0, or position bounded
  assert.strictEqual(engine.velocity.x, 0, 'Velocity X should be 0 upon wall collision');
  assert.ok(engine.position.x < 1, 'Position X should not cross into the block');
});
