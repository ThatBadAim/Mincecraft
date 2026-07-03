// Mock global variables that the game uses
global.THREE = {
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    fog: {},
  })),
  FogExp2: jest.fn(),
  PerspectiveCamera: jest.fn(() => ({
    updateProjectionMatrix: jest.fn(),
    position: { set: jest.fn(), addScaledVector: jest.fn() },
    lookAt: jest.fn(),
    getWorldDirection: jest.fn(),
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    shadowMap: { enabled: false },
    domElement: document.createElement('canvas'),
    render: jest.fn(),
    setClearColor: jest.fn(),
  })),
  PCFSoftShadowMap: {},
  PointerLockControls: jest.fn(() => ({
    addEventListener: jest.fn(),
    isLocked: false,
    lock: jest.fn(),
    unlock: jest.fn(),
  })),
  Clock: jest.fn(() => ({
    getDelta: jest.fn(() => 0.016),
  })),
  Raycaster: jest.fn(() => ({
    setFromCamera: jest.fn(),
    intersectObjects: jest.fn(() => []),
  })),
  Vector2: jest.fn(),
  Vector3: jest.fn(() => ({
    set: jest.fn(),
    addScaledVector: jest.fn(),
  })),
  Color: jest.fn(() => ({
    copy: jest.fn(),
    lerpColors: jest.fn(),
  })),
  AmbientLight: jest.fn(),
  DirectionalLight: jest.fn(() => ({
    shadow: {
      mapSize: { width: 0, height: 0 },
      camera: { near: 0, far: 0, left: 0, right: 0, top: 0, bottom: 0 },
      bias: 0,
    },
    position: { set: jest.fn() },
  })),
  PointLight: jest.fn(() => ({
    position: { set: jest.fn() },
  })),
  BoxGeometry: jest.fn(),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
  })),
  Float32BufferAttribute: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  MeshLambertMaterial: jest.fn(() => ({
    color: { copy: jest.fn() },
    opacity: 1
  })),
  PointsMaterial: jest.fn(),
  LineBasicMaterial: jest.fn(),
  CanvasTexture: jest.fn(),
  Mesh: jest.fn(() => ({
    position: { set: jest.fn(), addScaledVector: jest.fn() },
    lookAt: jest.fn(),
  })),
  Points: jest.fn(() => ({
    material: { opacity: 1 },
  })),
  Group: jest.fn(() => ({
    position: { set: jest.fn() },
    add: jest.fn(),
  })),
  EdgesGeometry: jest.fn(),
  LineSegments: jest.fn(() => ({
    position: { set: jest.fn() },
  })),
  NearestFilter: {},
  DoubleSide: {},
};
