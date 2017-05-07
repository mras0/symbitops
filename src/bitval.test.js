var assert = require('assert');

//
// Test Bitval
//

const { Bitval, _BITVAL_KNOWN0, _BITVAL_KNOWN1, _BITVAL_UNDEFINED, _XorOfKnowValues } = require('./bitval')

// Constructor

let bv_undef = new Bitval();
assert.equal(bv_undef.val, _BITVAL_UNDEFINED);
assert.equal(''+bv_undef, '??');

let bv_0 = new Bitval(0);
assert.equal(bv_0.val, _BITVAL_KNOWN0);
assert.equal(''+bv_0, '..');

let bv_1 = new Bitval(1);
assert.equal(bv_1.val, _BITVAL_KNOWN1);
assert.equal(''+bv_1, '!!');

let bv_xy = new Bitval('xy');
assert.equal(bv_xy.val, 'xy');
assert.equal(''+bv_xy, 'xy');

let bv_R0 = new Bitval('R0');
assert.equal(bv_R0.val, 'R0');
assert.equal(''+bv_R0, 'R0');

// Equals

assert(bv_0.equals(bv_0));
assert(!bv_0.equals(bv_1));
assert(!bv_1.equals(bv_0));
assert(bv_1.equals(bv_1));

// Value

assert.equal(bv_0.real_value(), 0);
assert.equal(bv_1.real_value(), 1);
assert(typeof bv_undef.real_value() === 'undefined');

// And

assert.deepEqual(bv_0, bv_0.and(bv_0));
assert.deepEqual(bv_0, bv_1.and(bv_0));
assert.deepEqual(bv_0, bv_0.and(bv_1));
assert.deepEqual(bv_1, bv_1.and(bv_1));
assert.deepEqual(bv_0, bv_xy.and(bv_0));

assert.deepEqual(bv_1, bv_1.and(bv_1));
assert.deepEqual(bv_xy, bv_xy.and(bv_1));
assert.deepEqual(bv_xy, bv_1.and(bv_xy));
assert.deepEqual(bv_xy, bv_xy.and(bv_1));
assert.deepEqual(bv_xy, bv_xy.and(bv_xy));
assert.deepEqual(bv_R0, bv_R0.and(bv_1));
assert.notDeepEqual(bv_xy, bv_R0.and(bv_1));

// Or
assert.deepEqual(bv_0, bv_0.or(bv_0));
assert.deepEqual(bv_1, bv_1.or(bv_0));
assert.deepEqual(bv_1, bv_0.or(bv_1));
assert.deepEqual(bv_1, bv_1.or(bv_1));

assert.deepEqual(bv_xy, bv_xy.or(bv_0));
assert.deepEqual(bv_xy, bv_0.or(bv_xy));
assert.deepEqual(bv_1, bv_xy.or(bv_1));
assert.deepEqual(bv_1, bv_1.or(bv_xy));
assert.notDeepEqual(bv_xy, bv_R0.or(bv_0));

// Xor
assert.deepEqual(bv_0, bv_0.xor(bv_0));
assert.deepEqual(bv_1, bv_1.xor(bv_0));
assert.deepEqual(bv_1, bv_0.xor(bv_1));
assert.deepEqual(bv_0, bv_1.xor(bv_1));
assert.deepEqual(bv_xy, bv_xy.xor(bv_0));
assert.deepEqual(bv_xy, bv_0.xor(bv_xy));
assert.deepEqual(new Bitval(_XorOfKnowValues.calc(bv_R0.val, bv_xy.val)), bv_R0.xor(bv_xy));
assert.deepEqual(bv_xy, bv_R0.xor(bv_xy).xor(bv_R0));
assert.deepEqual(bv_R0, bv_R0.xor(bv_xy).xor(bv_xy));
assert.deepEqual(bv_xy, bv_xy.xor(bv_R0).xor(bv_R0));
assert.deepEqual(bv_R0, bv_xy.xor(bv_R0).xor(bv_xy));

// Half-adder
assert.deepEqual([bv_0, bv_0], bv_0.half_add(bv_0));
assert.deepEqual([bv_0, bv_1], bv_1.half_add(bv_0));
assert.deepEqual([bv_0, bv_1], bv_0.half_add(bv_1));
assert.deepEqual([bv_1, bv_0], bv_1.half_add(bv_1));
assert.deepEqual([bv_xy, bv_0], bv_xy.half_add(bv_xy));

// Not
assert.deepEqual(bv_1, bv_0.not());
assert.deepEqual(bv_0, bv_1.not());
