const { performance } = require('perf_hooks');

const testSplice = (size) => {
    const arr = new Array(size).fill(0).map((_, i) => i);
    const start = performance.now();
    for (let i = arr.length - 1; i >= 0; i--) {
        if (i % 2 === 0) { // remove half the elements
            arr.splice(i, 1);
        }
    }
    const end = performance.now();
    return end - start;
};

const testSwapPop = (size) => {
    const arr = new Array(size).fill(0).map((_, i) => i);
    const start = performance.now();
    for (let i = arr.length - 1; i >= 0; i--) {
        if (i % 2 === 0) {
            arr[i] = arr[arr.length - 1];
            arr.pop();
        }
    }
    const end = performance.now();
    return end - start;
};

const runBenchmark = (size) => {
    console.log(`Testing with size ${size}...`);
    // Warmup
    testSplice(1000);
    testSwapPop(1000);

    let spliceTotal = 0;
    let swapPopTotal = 0;
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
        spliceTotal += testSplice(size);
        swapPopTotal += testSwapPop(size);
    }

    console.log(`Splice average: ${spliceTotal / iterations} ms`);
    console.log(`Swap-and-pop average: ${swapPopTotal / iterations} ms`);
    console.log(`Improvement: ${(spliceTotal / swapPopTotal).toFixed(2)}x faster`);
    console.log('---');
};

runBenchmark(10000);
runBenchmark(50000);
runBenchmark(100000);
