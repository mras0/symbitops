var assert = require('assert');

const { BitvalN } = require('./bitvaln')

//
// Test BitvalN
//

let bvn32_undef = new BitvalN(32);
let bvn32_r4    = BitvalN.named('R3R2R1R0');
assert.equal(''+bvn32_undef, '???????????????? ???????????????? ???????????????? ????????????????');
assert.equal(''+BitvalN.constN(4, 7), '..!!!!!!');
assert.equal(''+bvn32_r4, 'R3R2R1R0');
assert.equal(''+bvn32_r4.and(BitvalN.constN(4,0xaa)), 'R3..R1..');
assert.deepEqual(BitvalN.named('....R3R2'), bvn32_r4.lsr(2));
assert.deepEqual(BitvalN.named('R1R0....'), bvn32_r4.lsl(2));
assert.equal(''+bvn32_r4.rol(1), 'R2R1R0R3');
assert.equal(''+bvn32_r4.ror(3), 'R2R1R0R3');
assert.equal(''+bvn32_r4.get(2), 'R1R0');
assert.equal(''+bvn32_r4.set(BitvalN.named('!!..')), 'R3R2!!..');
assert.deepEqual(BitvalN.named('R2R1R0..'), bvn32_r4.add(bvn32_r4));
assert(BitvalN.constN(4, 3).equals(BitvalN.named('....!!!!')));
assert.deepEqual(BitvalN.constN(4, 15), BitvalN.constN(4, 3).add(BitvalN.constN(4, 12)));
assert.equal('!!!!!!....!!', ''+BitvalN.constN(4, 9).sign_extend(6));

let bvn8_123 = BitvalN.constN(8, 123);

assert.equal(bvn8_123.not().real_value(), 132);

assert.equal(bvn8_123.neg().sign_extend(32).real_value()>>0, -123);

assert.equal(bvn8_123.add(BitvalN.constN(8, 2)).real_value(), 125);
assert.equal(bvn8_123.add(BitvalN.constN(8, -2)).real_value(), 121);

assert.equal(bvn8_123.sub(BitvalN.constN(8, 4)).real_value(), 119);
assert.equal(bvn8_123.sub(BitvalN.constN(8, -4)).real_value(), 127);

let bvn8_m33 = BitvalN.constN(8, -33);
assert.equal(bvn8_m33.asr(2).sign_extend(32).real_value()>>0, -9);
assert.equal(bvn8_m33.asl(1).sign_extend(32).real_value()>>0, -33*2);
