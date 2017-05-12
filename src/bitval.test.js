var assert = require('assert');

//
// Test Bitval
//

const { Bitval, _BITVAL_KNOWN0, _BITVAL_KNOWN1, _BITVAL_UNDEFINED } = require('./bitval')

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

assert.deepEqual(bv_0, bv_0.and(bv_undef));
assert.deepEqual(bv_0, bv_undef.and(bv_0));
assert.deepEqual(bv_undef, bv_1.and(bv_undef));
assert.deepEqual(bv_undef, bv_undef.and(bv_1));

assert.deepEqual(bv_1, bv_1.and(bv_1));
assert.deepEqual(bv_xy, bv_xy.and(bv_1));
assert.deepEqual(bv_xy, bv_1.and(bv_xy));
assert.deepEqual(bv_xy, bv_xy.and(bv_1));
assert.deepEqual(bv_xy, bv_xy.and(bv_xy));
assert.deepEqual(bv_R0, bv_R0.and(bv_1));
assert.notDeepEqual(bv_xy, bv_R0.and(bv_1));
assert.deepEqual(bv_xy.and(bv_R0), bv_xy.and(bv_R0).and(bv_xy).and(bv_R0).and(bv_xy));
assert.deepEqual(bv_xy.and(bv_R0), (bv_xy.and(bv_R0).and(bv_xy)).and((bv_R0).and(bv_xy)));

// Xor
assert.deepEqual(bv_0, bv_0.xor(bv_0));
assert.deepEqual(bv_1, bv_1.xor(bv_0));
assert.deepEqual(bv_1, bv_0.xor(bv_1));
assert.deepEqual(bv_0, bv_1.xor(bv_1));
assert.deepEqual(bv_xy, bv_xy.xor(bv_0));
assert.deepEqual(bv_xy, bv_0.xor(bv_xy));
assert.deepEqual(bv_xy, bv_R0.xor(bv_xy).xor(bv_R0));
assert.deepEqual(bv_R0, bv_R0.xor(bv_xy).xor(bv_xy));
assert.deepEqual(bv_xy, bv_xy.xor(bv_R0).xor(bv_R0));
assert.deepEqual(bv_R0, bv_xy.xor(bv_R0).xor(bv_xy));
assert.deepEqual(bv_xy, bv_xy.xor(bv_1).xor(bv_1));
assert.deepEqual(bv_R0.xor(bv_1), bv_xy.xor(bv_R0).xor(bv_1).xor(bv_xy));
assert.deepEqual((bv_xy.and(bv_R0)).xor(bv_R0), bv_xy.xor(bv_1).and(bv_R0));

assert.deepEqual(bv_undef, bv_0.xor(bv_undef));
assert.deepEqual(bv_undef, bv_undef.xor(bv_0));
assert.deepEqual(bv_undef, bv_1.xor(bv_undef));
assert.deepEqual(bv_undef, bv_undef.xor(bv_1));

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
assert.deepEqual((bv_xy.and(bv_R0)).xor(bv_xy).xor(bv_R0), bv_xy.or(bv_R0));

assert.deepEqual(bv_undef, bv_0.or(bv_undef));
assert.deepEqual(bv_undef, bv_undef.or(bv_0));
assert.deepEqual(bv_1, bv_1.or(bv_undef));
assert.deepEqual(bv_1, bv_undef.or(bv_1));

// Half-adder
assert.deepEqual([bv_0, bv_0], bv_0.half_add(bv_0));
assert.deepEqual([bv_0, bv_1], bv_1.half_add(bv_0));
assert.deepEqual([bv_0, bv_1], bv_0.half_add(bv_1));
assert.deepEqual([bv_1, bv_0], bv_1.half_add(bv_1));
assert.deepEqual([bv_xy, bv_0], bv_xy.half_add(bv_xy));

assert.deepEqual([bv_0, bv_undef], bv_0.half_add(bv_undef));
assert.deepEqual([bv_0, bv_undef], bv_undef.half_add(bv_0));
assert.deepEqual([bv_undef, bv_undef], bv_1.half_add(bv_undef));
assert.deepEqual([bv_undef, bv_undef], bv_undef.half_add(bv_1));

// Not
assert.deepEqual(bv_1, bv_0.not());
assert.deepEqual(bv_0, bv_1.not());
assert.deepEqual(bv_undef, bv_undef.not());

// toString
assert.equal('..', ''+bv_0);
assert.equal('!!', ''+bv_1);
assert.equal('??', ''+bv_undef);
assert.equal('xy', ''+bv_xy);
assert.equal('R0', ''+bv_R0);

assert.equal('~xy', ''+bv_xy.xor(bv_1));
assert.equal('~(R0^xy)', ''+bv_xy.xor(bv_1).xor(bv_R0));

assert.equal('(R0|xy)', ''+bv_xy.or(bv_R0));
assert.equal('~(R0|xy)', ''+bv_xy.or(bv_R0).not());

assert.equal('(R0&xy)', ''+bv_xy.and(bv_R0));
assert.equal('(xy&~R0)', ''+bv_xy.and(bv_R0.not()));
assert.equal('(R0&~xy)', ''+bv_R0.and(bv_xy.not()));
