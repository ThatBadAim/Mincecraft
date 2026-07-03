// Web Worker for offloading chunk terrain generation and geometry construction.
// This runs on a separate CPU core to prevent main thread stutters.

import { noiseGen, getTerrainHeight, getTerrainHeightAndWater } from './noise.js';
import { BLOCKS, BLOCK_INFO } from './constants.js';

const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;

// Cache of chunk blocks on the worker
const chunks = {};

function getChunkKey(cx, cz) {
  return `${cx},${cz}`;
}

// Get block from cached chunks or generate deterministically on the fly
function getBlock(x, y, z) {
  if (y < 0) return { type: BLOCKS.BEDROCK, solid: true, transparent: false };
  if (y >= CHUNK_HEIGHT) return { type: BLOCKS.AIR, solid: false, transparent: true };

  const cx = Math.floor(x / CHUNK_SIZE);
  const cz = Math.floor(z / CHUNK_SIZE);
  const key = getChunkKey(cx, cz);

  let chunk = chunks[key];
  if (!chunk) {
    // Generate just block data on the fly (no mesh)
    chunk = generateChunkData(cx, cz);
    chunks[key] = chunk;
  }

  const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

  const type = chunk[lx][y][lz];
  return {
    type: type,
    solid: BLOCK_INFO[type].solid,
    transparent: BLOCK_INFO[type].transparent
  };
}

function generateChunkData(cx, cz, savedBlocks = null) {
  const blocks = Array(CHUNK_SIZE).fill(null).map(() =>
    Array(CHUNK_HEIGHT).fill(null).map(() =>
      new Uint8Array(CHUNK_SIZE)
    )
  );

    const chunkWorldX = cx * CHUNK_SIZE;
    const chunkWorldZ = cz * CHUNK_SIZE;

    // Pass 1: Base Terrain
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const worldX = chunkWorldX + lx;
        const worldZ = chunkWorldZ + lz;

        const info = getTerrainHeightAndWater(worldX, worldZ);
        const height = info.height;
        const waterLevel = info.waterLevel;
        const isPool = info.isPool;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            blocks[lx][y][lz] = BLOCKS.BEDROCK;
          } else if (y < height - 4) {
            blocks[lx][y][lz] = BLOCKS.STONE;
            // Coal ore generation
            if (y > 2 && y < 25 && Math.random() < 0.03) {
              blocks[lx][y][lz] = BLOCKS.COAL;
            }
          } else if (y < height) {
            blocks[lx][y][lz] = BLOCKS.DIRT;
          } else if (y === height) {
            if (isPool) {
              blocks[lx][y][lz] = BLOCKS.SAND;
            } else {
              blocks[lx][y][lz] = BLOCKS.GRASS;
            }
          } else if (y > height && y <= waterLevel) {
            blocks[lx][y][lz] = BLOCKS.WATER;
          } else {
            blocks[lx][y][lz] = BLOCKS.AIR;
          }
        }
      }
    }

    // Pass 2: Tree generation (after all base terrain columns are defined to prevent leaf overwrites)
    for (let lx = 3; lx < CHUNK_SIZE - 3; lx++) {
      for (let lz = 3; lz < CHUNK_SIZE - 3; lz++) {
        const worldX = chunkWorldX + lx;
        const worldZ = chunkWorldZ + lz;
        const height = getTerrainHeight(worldX, worldZ);

        // Only grow trees on Grass blocks (not sand, water or stone)
        if (blocks[lx][height][lz] === BLOCKS.GRASS) {
          const treeNoise = noiseGen.noise(worldX * 0.5, worldZ * 0.5);
          if (treeNoise > 0.42 && Math.random() > 0.78) {
            const r = Math.random();
            if (r < 0.4) {
              // Classic Minecraft Oak Tree (5x5 bottom layers, 3x3 top layer, cross on top)
              const treeHeight = 5 + Math.floor(Math.random() * 2);
              for (let ty = 1; ty <= treeHeight; ty++) {
                blocks[lx][height + ty][lz] = BLOCKS.WOOD;
              }
              const trunkY = height + treeHeight;

              // Bottom foliage layer (y = trunkY - 2 and trunkY - 1)
              for (let oy = -2; oy <= -1; oy++) {
                for (let ox = -2; ox <= 2; ox++) {
                  for (let oz = -2; oz <= 2; oz++) {
                    // Skip corners for rounder canopy
                    if (Math.abs(ox) === 2 && Math.abs(oz) === 2) continue;
                    blocks[lx + ox][trunkY + oy][lz + oz] = BLOCKS.LEAVES;
                  }
                }
              }
              // Middle foliage layer (y = trunkY)
              for (let ox = -1; ox <= 1; ox++) {
                for (let oz = -1; oz <= 1; oz++) {
                  blocks[lx + ox][trunkY][lz + oz] = BLOCKS.LEAVES;
                }
              }
              // Top foliage layer (y = trunkY + 1)
              blocks[lx][trunkY + 1][lz] = BLOCKS.LEAVES;
              blocks[lx + 1][trunkY + 1][lz] = BLOCKS.LEAVES;
              blocks[lx - 1][trunkY + 1][lz] = BLOCKS.LEAVES;
              blocks[lx][trunkY + 1][lz + 1] = BLOCKS.LEAVES;
              blocks[lx][trunkY + 1][lz - 1] = BLOCKS.LEAVES;

            } else if (r < 0.7) {
              // Classic Minecraft Pine/Spruce Tree (Conical segmented layers)
              const treeHeight = 7 + Math.floor(Math.random() * 3);
              for (let ty = 1; ty <= treeHeight; ty++) {
                blocks[lx][height + ty][lz] = BLOCKS.PINE_WOOD;
              }
              const trunkY = height + treeHeight;

              // Cone foliage generation
              for (let oy = -4; oy <= 1; oy++) {
                const currentY = trunkY + oy;
                const distFromTop = 1 - oy;
                let radius = 0;

                if (distFromTop === 0) {
                  radius = 0; // Single block top
                } else if (distFromTop === 1 || distFromTop === 3) {
                  radius = 1; // 3x3 cross
                } else {
                  radius = 2; // 5x5 cross
                }

                for (let ox = -radius; ox <= radius; ox++) {
                  for (let oz = -radius; oz <= radius; oz++) {
                    if (radius === 2 && Math.abs(ox) === 2 && Math.abs(oz) === 2) continue; // Cut corners
                    if (radius === 1 && Math.abs(ox) === 1 && Math.abs(oz) === 1 && distFromTop === 1) continue; // Taper top
                    blocks[lx + ox][currentY][lz + oz] = BLOCKS.PINE_LEAVES;
                  }
                }
              }
            } else {
              // Classic Minecraft Birch Tree (Tall trunk, light green dense canopy)
              const treeHeight = 6 + Math.floor(Math.random() * 2);
              for (let ty = 1; ty <= treeHeight; ty++) {
                blocks[lx][height + ty][lz] = BLOCKS.BIRCH_WOOD;
              }
              const trunkY = height + treeHeight;

              // Birch foliage is standard but slightly more vertical
              for (let oy = -2; oy <= 0; oy++) {
                for (let ox = -2; ox <= 2; ox++) {
                  for (let oz = -2; oz <= 2; oz++) {
                    if (Math.abs(ox) === 2 && Math.abs(oz) === 2 && oy === 0) continue;
                    blocks[lx + ox][trunkY + oy][lz + oz] = BLOCKS.BIRCH_LEAVES;
                  }
                }
              }
              // Top cap
              for (let ox = -1; ox <= 1; ox++) {
                for (let oz = -1; oz <= 1; oz++) {
                  if (Math.abs(ox) === 1 && Math.abs(oz) === 1) continue;
                  blocks[lx + ox][trunkY + 1][lz + oz] = BLOCKS.BIRCH_LEAVES;
                }
              }
              blocks[lx][trunkY + 2][lz] = BLOCKS.BIRCH_LEAVES;
            }
          }
        }
      }
    }
  if (savedBlocks) {
    savedBlocks.forEach(b => {
      blocks[b.x][b.y][b.z] = b.type;
    });
  }

  return blocks;
}

function buildChunkGeometry(cx, cz) {
  const key = getChunkKey(cx, cz);
  const chunk = chunks[key];
  if (!chunk) return null;

  const positionsSolid = [];
  const normalsSolid = [];
  const uvsSolid = [];

  const positionsTrans = [];
  const normalsTrans = [];
  const uvsTrans = [];

  const faces = [
    { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1]], uvKey: 'side' },
    { dir: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 1], [0, 1, 0], [0, 0, 0]], uvKey: 'side' },
    { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 1], [1, 1, 0], [0, 1, 0]], uvKey: 'top' },
    { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 0], [1, 0, 1], [0, 0, 1]], uvKey: 'bottom' },
    { dir: [0, 0, 1], corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 1, 1], [0, 0, 1]], uvKey: 'side' },
    { dir: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 0], [1, 1, 0], [1, 0, 0]], uvKey: 'side' }
  ];

  const ATLAS_COLS = 8;
  const ATLAS_ROWS = 8;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const blockType = chunk[lx][y][lz];
        if (blockType === BLOCKS.AIR) continue;

        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const isTransparentBlock = BLOCK_INFO[blockType].transparent;

        for (const face of faces) {
          const nx = wx + face.dir[0];
          const ny = y + face.dir[1];
          const nz = wz + face.dir[2];

          const neighbor = getBlock(nx, ny, nz);

          let drawFace = !neighbor || neighbor.transparent;
          if (drawFace && isTransparentBlock && neighbor) {
            if (neighbor.type === blockType) {
              drawFace = false;
            }
          }

          if (drawFace) {
            const targetPos = isTransparentBlock ? positionsTrans : positionsSolid;
            const targetNorm = isTransparentBlock ? normalsTrans : normalsSolid;
            const targetUv = isTransparentBlock ? uvsTrans : uvsSolid;

            for (const c of face.corners) {
              targetPos.push(wx + c[0], y + c[1], wz + c[2]);
              targetNorm.push(face.dir[0], face.dir[1], face.dir[2]);
            }

            const uvCoord = BLOCK_INFO[blockType].uvs[face.uvKey] || BLOCK_INFO[blockType].uvs['side'];
            const eps = 0.008; // 1-pixel safety margin (1/128) to prevent texture atlas bleeding at flat camera angles
            const uMin = uvCoord[0] / ATLAS_COLS + eps;
            const uMax = (uvCoord[0] + 1) / ATLAS_COLS - eps;
            const vMin = (ATLAS_ROWS - 1 - uvCoord[1]) / ATLAS_ROWS + eps;
            const vMax = (ATLAS_ROWS - uvCoord[1]) / ATLAS_ROWS - eps;

            targetUv.push(
              uMin, vMax,
              uMin, vMin,
              uMax, vMin,
              uMin, vMax,
              uMax, vMin,
              uMax, vMax
            );
          }
        }
      }
    }
  }

  return {
    solid: {
      position: new Float32Array(positionsSolid),
      normal: new Float32Array(normalsSolid),
      uv: new Float32Array(uvsSolid)
    },
    transparent: {
      position: new Float32Array(positionsTrans),
      normal: new Float32Array(normalsTrans),
      uv: new Float32Array(uvsTrans)
    }
  };
}

// Listen to requests from the main game thread
self.onmessage = function(e) {
  const data = e.data;

  if (data.type === 'initChunk') {
    const { cx, cz, savedBlocks } = data;
    const key = getChunkKey(cx, cz);

    // Generate block array in worker thread
    const blocks = generateChunkData(cx, cz, savedBlocks);
    chunks[key] = blocks;

    // Build meshes and return them
    const geometry = buildChunkGeometry(cx, cz);

    // Transfer typed array buffers back with zero overhead serialization (transferables)
    const transfers = [];
    if (geometry) {
      if (geometry.solid.position.length > 0) {
        transfers.push(geometry.solid.position.buffer, geometry.solid.normal.buffer, geometry.solid.uv.buffer);
      }
      if (geometry.transparent.position.length > 0) {
        transfers.push(geometry.transparent.position.buffer, geometry.transparent.normal.buffer, geometry.transparent.uv.buffer);
      }
    }

    self.postMessage({
      type: 'chunkBuilt',
      cx, cz,
      geometry,
      blocks // Return blocks array to let main thread update local cache
    }, transfers);
  }

  else if (data.type === 'rebuildGeometry') {
    const { cx, cz } = data;
    const geometry = buildChunkGeometry(cx, cz);
    const transfers = [];
    if (geometry) {
      if (geometry.solid.position.length > 0) {
        transfers.push(geometry.solid.position.buffer, geometry.solid.normal.buffer, geometry.solid.uv.buffer);
      }
      if (geometry.transparent.position.length > 0) {
        transfers.push(geometry.transparent.position.buffer, geometry.transparent.normal.buffer, geometry.transparent.uv.buffer);
      }
    }
    self.postMessage({
      type: 'geometryRebuilt',
      cx, cz,
      geometry
    }, transfers);
  }

  else if (data.type === 'setBlock') {
    const { x, y, z, blockType } = data;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = getChunkKey(cx, cz);

    let chunk = chunks[key];
    if (chunk) {
      const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      chunk[lx][y][lz] = blockType;
    }
  }

  else if (data.type === 'setSeed') {
    noiseGen.seed(data.seed);
  }
};
