const fs = require('fs');

class WorldSetFast {
    constructor() {
        this.meshSet = new Set();
    }

    add(mesh) {
        this.meshSet.add(mesh);
    }

    remove(mesh) {
        this.meshSet.delete(mesh);
    }
}

// Generate some dummy meshes
const meshes = [];
for (let i = 0; i < 20000; i++) {
    meshes.push({ id: i });
}

function runBenchmark() {
    const initSize = 20000;
    const unloadCount = 5000;

    console.log(`--- ARRAY (Baseline) with ${initSize} chunks, unloading ${unloadCount} ---`);
    let wList = {
        meshList: [],
        add(mesh) { this.meshList.push(mesh); },
        remove(mesh) {
            const idx = this.meshList.indexOf(mesh);
            if (idx !== -1) this.meshList.splice(idx, 1);
        }
    };

    const startList = performance.now();
    for (let i = 0; i < initSize; i++) wList.add(meshes[i]);

    for (let i = 0; i < unloadCount; i++) {
        const meshToRemove = meshes[i];
        wList.remove(meshToRemove);
    }
    const endList = performance.now();
    console.log(`Array Add/Remove chunking: ${endList - startList} ms`);

    console.log(`\n--- SET (Proposed) with ${initSize} chunks, unloading ${unloadCount} ---`);
    let wSet = new WorldSetFast();

    const startSet = performance.now();
    for (let i = 0; i < initSize; i++) wSet.add(meshes[i]);

    for (let i = 0; i < unloadCount; i++) {
        const meshToRemove = meshes[i];
        wSet.remove(meshToRemove);
    }

    // Convert to array once for raycasting
    const arr = Array.from(wSet.meshSet);

    const endSet = performance.now();
    console.log(`Set Add/Remove chunking: ${endSet - startSet} ms`);

    console.log(`\nImprovement: ${((endList - startList) / (endSet - startSet)).toFixed(2)}x faster`);
}

runBenchmark();
