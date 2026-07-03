// Block definition mappings
export const BLOCKS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  GLASS: 7,
  BRICK: 8,
  PLANKS: 9,
  BEDROCK: 10,
  PINE_WOOD: 11,
  PINE_LEAVES: 12,
  BIRCH_WOOD: 13,
  BIRCH_LEAVES: 14,
  WATER: 15,
  STICK: 16,
  STONE_PICKAXE: 17,
  CRAFTING_TABLE: 18,
  MEAT: 19,
  WOOL: 20,
  TORCH: 21,
  TNT: 22,
  COAL: 23
};

// Metadata for blocks
export const BLOCK_INFO = {
  [BLOCKS.AIR]: { name: 'Air', solid: false, transparent: true },
  [BLOCKS.GRASS]: { name: 'Grass Block', solid: true, transparent: false, uvs: { top: [0, 0], side: [1, 0], bottom: [2, 0] } },
  [BLOCKS.DIRT]: { name: 'Dirt', solid: true, transparent: false, uvs: { top: [2, 0], side: [2, 0], bottom: [2, 0] } },
  [BLOCKS.STONE]: { name: 'Stone', solid: true, transparent: false, uvs: { top: [3, 0], side: [3, 0], bottom: [3, 0] } },
  [BLOCKS.WOOD]: { name: 'Oak Log', solid: true, transparent: false, uvs: { top: [4, 0], side: [5, 0], bottom: [4, 0] } },
  [BLOCKS.LEAVES]: { name: 'Oak Leaves', solid: true, transparent: true, uvs: { top: [6, 0], side: [6, 0], bottom: [6, 0] } },
  [BLOCKS.SAND]: { name: 'Sand', solid: true, transparent: false, uvs: { top: [7, 0], side: [7, 0], bottom: [7, 0] } },
  [BLOCKS.GLASS]: { name: 'Glass', solid: true, transparent: true, uvs: { top: [0, 1], side: [0, 1], bottom: [0, 1] } },
  [BLOCKS.BRICK]: { name: 'Brick', solid: true, transparent: false, uvs: { top: [1, 1], side: [1, 1], bottom: [1, 1] } },
  [BLOCKS.PLANKS]: { name: 'Oak Planks', solid: true, transparent: false, uvs: { top: [2, 1], side: [2, 1], bottom: [2, 1] } },
  [BLOCKS.BEDROCK]: { name: 'Bedrock', solid: true, transparent: false, uvs: { top: [3, 1], side: [3, 1], bottom: [3, 1] } },
  [BLOCKS.PINE_WOOD]: { name: 'Pine Log', solid: true, transparent: false, uvs: { top: [4, 1], side: [5, 1], bottom: [4, 1] } },
  [BLOCKS.PINE_LEAVES]: { name: 'Pine Leaves', solid: true, transparent: true, uvs: { top: [6, 1], side: [6, 1], bottom: [6, 1] } },
  [BLOCKS.BIRCH_WOOD]: { name: 'Birch Log', solid: true, transparent: false, uvs: { top: [7, 1], side: [0, 2], bottom: [7, 1] } },
  [BLOCKS.BIRCH_LEAVES]: { name: 'Birch Leaves', solid: true, transparent: true, uvs: { top: [1, 2], side: [1, 2], bottom: [1, 2] } },
  [BLOCKS.WATER]: { name: 'Water', solid: false, transparent: true, alphaTest: 0.1, uvs: { top: [2, 2], side: [2, 2], bottom: [2, 2] } },
  [BLOCKS.STICK]: { name: 'Stick', solid: false, transparent: true, uvs: { top: [3, 2], side: [3, 2], bottom: [3, 2] } },
  [BLOCKS.STONE_PICKAXE]: { name: 'Stone Pickaxe', solid: false, transparent: true, uvs: { top: [4, 2], side: [4, 2], bottom: [4, 2] } },
  [BLOCKS.CRAFTING_TABLE]: { name: 'Crafting Table', solid: true, transparent: false, uvs: { top: [5, 2], side: [6, 2], bottom: [2, 1] } },
  [BLOCKS.MEAT]: { name: 'Meat', solid: false, transparent: true, uvs: { top: [7, 2], side: [7, 2], bottom: [7, 2] } },
  [BLOCKS.WOOL]: { name: 'Wool', solid: false, transparent: true, uvs: { top: [0, 3], side: [0, 3], bottom: [0, 3] } },
  [BLOCKS.TORCH]: { name: 'Torch', solid: false, transparent: true, uvs: { top: [1, 3], side: [1, 3], bottom: [1, 3] } },
  [BLOCKS.TNT]: { name: 'TNT', solid: true, transparent: false, uvs: { top: [2, 3], side: [3, 3], bottom: [2, 3] } },
  [BLOCKS.COAL]: { name: 'Coal Ore', solid: true, transparent: false, uvs: { top: [4, 3], side: [4, 3], bottom: [4, 3] } }
};

// Add type explicitly to BLOCK_INFO objects
for (const key in BLOCK_INFO) {
  BLOCK_INFO[key].type = parseInt(key, 10);
}
