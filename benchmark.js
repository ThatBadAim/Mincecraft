const { performance } = require('perf_hooks');

function testSplice(size, removes) {
    let arr = Array.from({length: size}, (_, i) => i);
    const start = performance.now();
    for(let i=0; i<removes; i++) {
        let idx = Math.floor(Math.random() * arr.length);
        arr.splice(idx, 1);
    }
    return performance.now() - start;
}

function testSwapPop(size, removes) {
    let arr = Array.from({length: size}, (_, i) => i);
    const start = performance.now();
    for(let i=0; i<removes; i++) {
        let idx = Math.floor(Math.random() * arr.length);
        let last = arr.pop();
        if (idx < arr.length) {
            arr[idx] = last;
        }
    }
    return performance.now() - start;
}

const N = 100000;
const REMOVES = 50000;

console.log("Splice:", testSplice(N, REMOVES));
console.log("SwapPop:", testSwapPop(N, REMOVES));
