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
global.swap_and_merge = function(a,b,n,t) {
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
    if (typeof t === 'undefined') t = T0;
    MOVE.L(b, t)
    LSR.L(n, t)
    EOR.L(a, t)
    AND.L(mask, t)
    EOR.L(t, a)
    if (n == 1) {
        ADD.L(t, t);
    } else {
        LSL.L(n, t)
    }
    EOR.L(t, b)
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
        swap_and_merge(D0, D1, n, D4);
        swap_and_merge(D2, D3, n, D4);
    } else if (m === 2) {
        swap_and_merge(D0, D2, n, D4);
        swap_and_merge(D1, D3, n, D4);
    } else {
        throw new Error('Invalid m value (must be 1 or 2): ' + m);
    }
};
