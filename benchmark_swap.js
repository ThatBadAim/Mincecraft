const { performance } = require('perf_hooks');

const testVariation1 = (size) => {
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

const testVariation2 = (size) => {
    const arr = new Array(size).fill(0).map((_, i) => i);
    const start = performance.now();
    for (let i = arr.length - 1; i >= 0; i--) {
        if (i % 2 === 0) {
            const last = arr.pop();
            if (i < arr.length) {
                arr[i] = last;
            }
        }
    }
    const end = performance.now();
    return end - start;
};

const runBenchmark = (size) => {
    console.log(`Testing with size ${size}...`);
    // Warmup
    testVariation1(1000);
    testVariation2(1000);

    let var1Total = 0;
    let var2Total = 0;
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
        var1Total += testVariation1(size);
        var2Total += testVariation2(size);
    }

    console.log(`Variation 1 average: ${var1Total / iterations} ms`);
    console.log(`Variation 2 average: ${var2Total / iterations} ms`);
};

runBenchmark(100000);
runBenchmark(500000);
