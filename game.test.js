import { GameController } from './game.js';

// Mock dependencies
jest.mock('./physics.js', () => ({
  PhysicsEngine: jest.fn(() => ({
    update: jest.fn(),
    velocity: { set: jest.fn(), x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    playerWidth: 0.6,
    getCurrentHeight: jest.fn(() => 1.6),
  })),
}));

jest.mock('./world.js', () => ({
  WorldManager: jest.fn(() => ({
    generateWorldAroundPlayer: jest.fn(),
    saveWorld: jest.fn(),
    getBlock: jest.fn(),
    setBlock: jest.fn(),
    chunkHeight: 64,
  })),
  BLOCKS: {
    GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, SAND: 6, GLASS: 7, BRICK: 8, PLANKS: 9
  },
  BLOCK_INFO: {},
}));

jest.mock('./audio.js', () => ({
  gameAudio: {
    playHurtSound: jest.fn(),
    playPlaceSound: jest.fn(),
    playBreakSound: jest.fn(),
    setVolume: jest.fn(),
    resume: jest.fn(),
  },
}));

jest.mock('./entities.js', () => ({
  EntityManager: jest.fn(() => ({
    spawnAnimalInChunk: jest.fn(),
    checkHit: jest.fn(),
    update: jest.fn(),
    spawnCollectible: jest.fn(),
    counts: {},
  })),
}));

describe('GameController', () => {
  beforeEach(() => {
    // Set up DOM elements required by the constructor
    document.body.innerHTML = `
      <div id="canvas-container"></div>
      <div id="damage-flash"></div>
      <div id="loading-screen"></div>
      <div id="loading-bar"></div>
      <div id="loading-text"></div>
      <div id="hearts-row"></div>
      <div id="hunger-row"></div>
      <div id="btn-play"></div>
      <div id="screen-menu"></div>
      <div id="inventory-screen"></div>
      <div id="crafting-screen"></div>
      <div id="slider-volume"></div>
      <div id="slider-fov"></div>
      <div id="slider-render-dist"></div>
      <div id="slider-sensitivity"></div>
      <div id="val-volume"></div>
      <div id="val-fov"></div>
      <div id="val-render-dist"></div>
      <div id="val-sensitivity"></div>
      <div id="btn-respawn"></div>
      <div id="craft-in-0"></div>
      <div id="craft-in-1"></div>
      <div id="craft-in-2"></div>
      <div id="craft-in-3"></div>
      <div id="craft-out"></div>
      <div id="hotbar"></div>
      <div id="inv-grid"></div>
      <div id="inv-hotbar-grid"></div>
      <div id="craft-list"></div>
      <div id="active-item-name"></div>
      <div id="screen-gameover"></div>
      <div id="player-pos"></div>
      <div id="oxygen-bar-container"></div>
      <div id="oxygen-bar-fill"></div>
      <div id="fps-counter"></div>
      <div id="game-time"></div>
    `;

    // Mock local storage
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      ellipse: jest.fn(),
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor initializes core components', () => {
    const game = new GameController();

    // Check Three.js setup
    expect(game.scene).toBeDefined();
    expect(game.camera).toBeDefined();
    expect(game.renderer).toBeDefined();

    // Check managers
    expect(game.physics).toBeDefined();
    expect(game.entityManager).toBeDefined();
    expect(game.world).toBeDefined();
    expect(game.controls).toBeDefined();

    // Check state initialization
    expect(game.playerHealth).toBe(20);
    expect(game.playerHunger).toBe(20);
    expect(game.activeSlotIndex).toBe(0);
    expect(game.inventorySlots).toHaveLength(36);
  });

  test('constructor sets up initial inventory and recipes', () => {
    const game = new GameController();

    // Check starter inventory hotbar
    expect(game.inventorySlots[27]).toBeDefined();
    expect(game.inventorySlots[27].type).toBeDefined();
    expect(game.inventorySlots[27].count).toBe(64);

    // Check recipes are loaded
    expect(game.recipes).toBeDefined();
    expect(game.recipes.length).toBeGreaterThan(0);

    // Check crafting states
    expect(game.inventoryCraftGrid).toHaveLength(4);
    expect(game.inventoryCraftOutput).toBeNull();
  });

  test('initializes HTML DOM elements correctly', () => {
    const game = new GameController();

    // Check basic DOM assignments
    expect(game.container).not.toBeNull();
    expect(game.damageFlashEl).not.toBeNull();
    expect(game.loadingScreen).not.toBeNull();
  });

  test('starts animate loop automatically', () => {
    // We can spy on requestAnimationFrame
    const originalRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = jest.fn();

    const game = new GameController();
    expect(global.requestAnimationFrame).toHaveBeenCalled();

    global.requestAnimationFrame = originalRAF;
  });
});
