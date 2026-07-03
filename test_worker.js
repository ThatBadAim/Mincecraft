const fs = require('fs');
const vm = require('vm');

const noiseCode = fs.readFileSync('noise.js', 'utf8');
const workerCode = fs.readFileSync('worker.js', 'utf8');

const sandbox = {
  self: {},
  Math: Math,
  Float32Array: Float32Array,
  Uint8Array: Uint8Array,
  Array: Array,
  Object: Object,
  console: console,
};

vm.createContext(sandbox);

// Remove all ES module syntax to run in VM
const cleanNoise = noiseCode
  .replace(/export const /g, 'const ')
  .replace(/export function /g, 'function ')
  .replace(/export default \w+;?/g, '')
  .replace(/export \{[^}]+\};?/g, '');

const cleanWorker = workerCode
  .replace(/import \{[^}]+\} from '\.\/noise\.js';/g, '') + `
  self.getBlock = getBlock;
  self.chunks = chunks;
  self.BLOCKS = BLOCKS;
  self.BLOCK_INFO = BLOCK_INFO;
  `;

try {
  vm.runInContext(cleanNoise, sandbox);
  vm.runInContext(cleanWorker, sandbox);
} catch (e) {
  console.error("VM Error:", e);
  process.exit(1);
}

const { getBlock, chunks, BLOCKS, BLOCK_INFO } = sandbox.self;

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.error(`❌ ${testName}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
    failed++;
  }
}

function assertDeepEqual(actual, expected, testName) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.error(`❌ ${testName}`);
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function runTests() {
  console.log("--- Running worker.js getBlock tests ---");

  // Clear cache before starting
  for (const key of Object.keys(chunks)) {
    delete chunks[key];
  }

  // Test 1: y < 0 returns BEDROCK
  assertDeepEqual(getBlock(0, -1, 0), { type: BLOCKS.BEDROCK, solid: true, transparent: false }, "y < 0 returns BEDROCK");

  // Test 2: y >= CHUNK_HEIGHT returns AIR
  assertDeepEqual(getBlock(0, 64, 0), { type: BLOCKS.AIR, solid: false, transparent: true }, "y >= 64 returns AIR");
  assertDeepEqual(getBlock(0, 100, 0), { type: BLOCKS.AIR, solid: false, transparent: true }, "y = 100 returns AIR");

  // Test 3: Accessing an uncached chunk caches it
  assertEqual(Object.keys(chunks).length, 0, "Cache is initially empty");

  const block1 = getBlock(5, 5, 5); // Some valid coordinate inside chunk 0,0
  assertEqual(Object.keys(chunks).length, 1, "Cache has 1 entry after generating a block");
  assertEqual(Object.keys(chunks).includes("0,0"), true, "Chunk 0,0 is cached");

  // Test 4: Accessing a cached chunk retrieves from cache
  chunks["0,0"][5][5][5] = BLOCKS.TNT;

  const modifiedBlock = getBlock(5, 5, 5);
  assertDeepEqual(modifiedBlock, {
    type: BLOCKS.TNT,
    solid: BLOCK_INFO[BLOCKS.TNT].solid,
    transparent: BLOCK_INFO[BLOCKS.TNT].transparent
  }, "Retrieves modified block from cache (proves cache is used)");

  // Test 5: Negative coordinates correctly map to chunks
  // Coordinate x=-1, z=-1 should be in chunk -1, -1
  const blockNegative = getBlock(-1, 0, -1);
  assertEqual(Object.keys(chunks).length, 2, "Cache has 2 entries after generating a negative coordinate block");
  assertEqual(Object.keys(chunks).includes("-1,-1"), true, "Chunk -1,-1 is cached");

  // Check that the returned block matches BEDROCK (y=0 is BEDROCK)
  assertDeepEqual(blockNegative, { type: BLOCKS.BEDROCK, solid: true, transparent: false }, "y = 0 returns BEDROCK in chunk -1,-1");

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
