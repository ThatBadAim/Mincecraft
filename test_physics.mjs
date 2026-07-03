import * as THREE from 'three';
global.THREE = THREE;

import { assert } from 'chai';
import { PhysicsEngine } from './physics.js';

class MockWorld {
    constructor() {
        this.blocks = new Map();
        this.defaultBlock = { solid: false };
    }
    setBlock(x, y, z, block) {
        if (block === undefined) {
            this.blocks.delete(`${x},${y},${z}`);
        } else if (block === null) {
            this.blocks.set(`${x},${y},${z}`, null);
        } else {
            this.blocks.set(`${x},${y},${z}`, block);
        }
    }
    getBlock(x, y, z) {
        if (this.blocks.has(`${x},${y},${z}`)) {
            return this.blocks.get(`${x},${y},${z}`);
        }
        return this.defaultBlock;
    }
}

describe('PhysicsEngine.getBlocksIntersecting', function() {
    let physics;
    let world;

    beforeEach(() => {
        physics = new PhysicsEngine();
        world = new MockWorld();
    });

    it('should return empty array when surrounded by non-solid blocks', function() {
        const pos = new THREE.Vector3(0, 0, 0);
        const collisions = physics.getBlocksIntersecting(world, pos, 0.6, 1.8);
        assert.isArray(collisions);
        assert.lengthOf(collisions, 0);
    });

    it('should detect a solid block within the search bounds', function() {
        world.setBlock(0, -1, 0, { solid: true });
        const pos = new THREE.Vector3(0, 0, 0);
        const collisions = physics.getBlocksIntersecting(world, pos, 0.6, 1.8);
        assert.lengthOf(collisions, 1);
        assert.equal(collisions[0].x, 0);
        assert.equal(collisions[0].y, -1);
        assert.equal(collisions[0].z, 0);

        // Assert correct bounding box properties are added
        assert.equal(collisions[0].minX, 0);
        assert.equal(collisions[0].maxX, 1);
        assert.equal(collisions[0].minY, -1);
        assert.equal(collisions[0].maxY, 0);
        assert.equal(collisions[0].minZ, 0);
        assert.equal(collisions[0].maxZ, 1);
    });

    it('should treat null blocks as solid (out of bounds/unloaded chunk)', function() {
        world.setBlock(0, 0, 0, null);
        const pos = new THREE.Vector3(0, 0, 0);
        const collisions = physics.getBlocksIntersecting(world, pos, 0.6, 1.8);
        assert.lengthOf(collisions, 1);
        assert.equal(collisions[0].x, 0);
        assert.equal(collisions[0].y, 0);
        assert.equal(collisions[0].z, 0);
    });

    it('should correctly calculate the bounding box for block retrieval', function() {
        const pos = new THREE.Vector3(0.5, 0.5, 0.5);
        world.setBlock(-1, 0, -1, { solid: true });
        world.setBlock(1, 3, 1, { solid: true });
        world.setBlock(-2, 0, -1, { solid: true });

        const collisions = physics.getBlocksIntersecting(world, pos, 1.0, 2.0);
        assert.lengthOf(collisions, 2);

        const collisionCoordinates = collisions.map(c => `${c.x},${c.y},${c.z}`);
        assert.include(collisionCoordinates, '-1,0,-1');
        assert.include(collisionCoordinates, '1,3,1');
        assert.notInclude(collisionCoordinates, '-2,0,-1');
    });

    it('should not detect a block with solid: false', function() {
        world.setBlock(0, -1, 0, { solid: false });
        const pos = new THREE.Vector3(0, 0, 0);
        const collisions = physics.getBlocksIntersecting(world, pos, 0.6, 1.8);
        assert.lengthOf(collisions, 0);
    });

    it('should handle fractional positions correctly', function() {
        const pos = new THREE.Vector3(1.9, 0.1, 1.9);
        world.setBlock(2, 0, 2, { solid: true });

        const collisions = physics.getBlocksIntersecting(world, pos, 0.6, 1.8);

        const collisionCoordinates = collisions.map(c => `${c.x},${c.y},${c.z}`);
        assert.include(collisionCoordinates, '2,0,2');
    });
});
