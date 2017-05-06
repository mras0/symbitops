const m68k   = require('./m68k.js');
const assert = require('assert')

//
// Move all m68k exports to global scope
//
for (let key in m68k) {
    assert.equal(typeof global[key], 'undefined');
    global[key] = m68k[key];
}

//
// Add temp register(s)
//
global.T0 = state.make_register('T0');
global.T1 = state.make_register('T1');

//
// Convenience C2P functions
//
global.swap_and_merge = function(a,b,n) {
    if (n == 16) {
        SWAP(b);
        EOR.W(a, b);
        EOR.W(b, a);
        EOR.W(a, b);
        SWAP(b);
        return;
    }

    let mask = 0;
    if (n === 1 ) mask = 0x55555555;
    else if (n === 2 ) mask = 0x33333333;
    else if (n === 4 ) mask = 0x0F0F0F0F;
    else if (n === 8 ) mask = 0x00FF00FF;
    //else if (n === 16) mask = 0x0000FFFF;
    else throw new Error("Invalid swap valud " + n);
    MOVE.L(b, T0)
    LSR.L(n, T0)
    EOR.L(a, T0)
    AND.L(mask, T0)
    EOR.L(T0, a)
    if (n == 1) {
        ADD.L(T0, T0);
    } else {
        LSL.L(n, T0)
    }
    EOR.L(T0, b)
};

global.c2p_step8 = function(n, m) {
    state.log('\n\t; ' + n + 'x' + m);
    if (m === 1) {
        swap_and_merge(D0, D1, n);
        swap_and_merge(D2, D3, n);
        swap_and_merge(D4, D5, n);
        swap_and_merge(D6, D7, n);
    } else if (m == 2) {
        swap_and_merge(D0, D2, n);
        swap_and_merge(D1, D3, n);
        swap_and_merge(D4, D6, n);
        swap_and_merge(D5, D7, n);
    } else if (m == 4) {
        swap_and_merge(D0, D4, n);
        swap_and_merge(D1, D5, n);
        swap_and_merge(D2, D6, n);
        swap_and_merge(D3, D7, n);
    } else {
        throw new Error('Invalid m value (must be 1, 2 or 4): ' + m);
    }
};

global.c2p_step4 = function(n, m) {
    state.log('\n\t; ' + n + 'x' + m);
    if (m === 1) {
        swap_and_merge(D0, D1, n);
        swap_and_merge(D2, D3, n);
    } else if (m === 2) {
        swap_and_merge(D0, D2, n);
        swap_and_merge(D1, D3, n);
    } else {
        throw new Error('Invalid m value (must be 1 or 2): ' + m);
    }
};
