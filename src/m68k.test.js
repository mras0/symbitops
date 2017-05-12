const assert = require('assert');
require('./m68k_global')

// MOVE
state.reset();
assert.equal(''+state[D0], 'a7a6a5a4a3a2a1a0 b7b6b5b4b3b2b1b0 c7c6c5c4c3c2c1c0 d7d6d5d4d3d2d1d0');
assert.equal(''+state[D7], 'C7C6C5C4C3C2C1C0 D7D6D5D4D3D2D1D0 E7E6E5E4E3E2E1E0 F7F6F5F4F3F2F1F0');
MOVE(42, D0);
assert.equal(''+state[D0], 'a7a6a5a4a3a2a1a0 b7b6b5b4b3b2b1b0 ................ ....!!..!!..!!..');

// NOT
state.reset();
MOVE.L(0, D0);
NOT.W(D0);
assert.equal(''+state[D0], '................ ................ !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!!');
NOT.L(D0);
assert.equal(''+state[D0], '!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! ................ ................');
NOT.B(D0);
assert.equal(''+state[D0], '!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! ................ !!!!!!!!!!!!!!!!');

// NEG/ADD
state.reset();
MOVE.L(0, D0);
NEG.L(D0);
assert.equal(''+state[D0], '................ ................ ................ ................');
ADD.L(1, D0);
assert.equal(''+state[D0], '................ ................ ................ ..............!!');
NEG.L(D0);
assert.equal(''+state[D0], '!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!!');

// SUB
state.reset();
MOVE.L(42, D0);
SUB.W(60, D0);
assert.equal(state[D0].get(16).real_value(), 0xFFEE);
assert.equal(state[D0].real_value(), 0xFFEE);

// ADDQ/SUBQ
state.reset();
assert.throws(() => { ADDQ(0, D0); }, /range/);
assert.throws(() => { SUBQ(9, D0); }, /range/);
MOVEQ(42, D0);
ADDQ.L(1, D0);
assert.equal(state[D0].real_value(), 43);
MOVEQ(5, D0);
SUBQ.B(7, D0);
assert.equal(''+state[D0], '................ ................ ................ !!!!!!!!!!!!!!..'); // -2.b

// MOVEQ
state.reset();
MOVEQ(127, D0);
MOVEQ(-8, D1);
assert.equal(state[D0].real_value(), 127);
assert.equal(state[D1].real_value(), 0xFFFFFFF8);
assert.throws(() => { MOVEQ(128, D0); }, /range/);
assert.throws(() => { MOVEQ(-129, D0); }, /range/);

// CLR
state.reset();
MOVEQ(-1, D0);
CLR.B(D0);
assert.equal(''+state[D0], '!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! ................');
MOVEQ(-1, D0);
CLR.W(D0);
assert.equal(''+state[D0], '!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! ................ ................');
MOVEQ(-1, D0);
CLR.L(D0);
assert.equal(''+state[D0], '................ ................ ................ ................');

// Shift/rotate
state.reset();
MOVEQ(2, D0);
LSL.L(2, D0);
assert.equal(state[D0].real_value(), 8);
ROR.L(4, D0);
assert.equal(state[D0].real_value(), 0x80000000);

MOVEQ(-4, D0);
LSR.L(1, D0);
assert.equal(state[D0].real_value(), 0x7ffffffe);

MOVEQ(-15, D0);
ASR.L(2, D0);
assert.equal(state[D0].real_value()>>0, -4);

ASL.L(8, D0);
assert.equal(state[D0].real_value()>>0, -1024);

assert.throws(() => { LSL(0, D0); }, /range/);
assert.throws(() => { LSL(9, D0); }, /range/);

state.reset();
state.quiet = false;
MOVE.B(2, D0);
MOVEQ(60, D1);
LSR.L(D0, D1);
assert.equal(''+state[D1], '................ ................ ................ ........!!!!!!!!');
MOVE.B(128+4, D2);
ASL.L(D2, D1);
assert.equal(''+state[D1], '................ ................ ................ !!!!!!!!........');


// EXG
state.reset();
MOVEQ(42, D0);
MOVEQ(60, D1);
EXG(D0, D1);
assert.equal(state[D0].real_value(), 60);
assert.equal(state[D1].real_value(), 42);

// EXT
state.reset();
MOVE.B(17, D0);
assert.equal(state[D0]+'', 'a7a6a5a4a3a2a1a0 b7b6b5b4b3b2b1b0 c7c6c5c4c3c2c1c0 ......!!......!!');
EXT(D0);
assert.equal(state[D0]+'', 'a7a6a5a4a3a2a1a0 b7b6b5b4b3b2b1b0 ................ ......!!......!!');
EXT.L(D0);
assert.equal(state[D0]+'', '................ ................ ................ ......!!......!!');

MOVE.B(-2, D1);
assert.equal(state[D1]+'', 'e7e6e5e4e3e2e1e0 f7f6f5f4f3f2f1f0 g7g6g5g4g3g2g1g0 !!!!!!!!!!!!!!..');
EXT(D1);
assert.equal(state[D1]+'', 'e7e6e5e4e3e2e1e0 f7f6f5f4f3f2f1f0 !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!..');
EXT.L(D1);
assert.equal(state[D1]+'', '!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!..');

//
// 8-bit C2P
//

state.reset();
state.print();
c2p_step8(8, 2);
c2p_step8(4, 1);
c2p_step8(16, 4);
c2p_step8(2, 4);
c2p_step8(1, 2);
state.print();
assert.deepEqual(state[D0], const32('a7b7c7d7e7f7g7h7 i7j7k7l7m7n7o7p7 q7r7s7t7u7v7w7x7 y7z7A7B7C7D7E7F7'));
assert.deepEqual(state[D1], const32('a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3'));
assert.deepEqual(state[D2], const32('a6b6c6d6e6f6g6h6 i6j6k6l6m6n6o6p6 q6r6s6t6u6v6w6x6 y6z6A6B6C6D6E6F6'));
assert.deepEqual(state[D3], const32('a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2'));
assert.deepEqual(state[D4], const32('a5b5c5d5e5f5g5h5 i5j5k5l5m5n5o5p5 q5r5s5t5u5v5w5x5 y5z5A5B5C5D5E5F5'));
assert.deepEqual(state[D5], const32('a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1'));
assert.deepEqual(state[D6], const32('a4b4c4d4e4f4g4h4 i4j4k4l4m4n4o4p4 q4r4s4t4u4v4w4x4 y4z4A4B4C4D4E4F4'));
assert.deepEqual(state[D7], const32('a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0'));

//
// LE RGB8 -> RGB4
//
state.reset();
state[D0] = const32('B7B6B5B4B3B2B1B0 G7G6G5G4G3G2G1G0 R7R6R5R4R3R2R1R0 ????????????????');
state.print([D0]);
LSR.W(4, D0)
MOVE.L(D0, D1)
SWAP(D0)
AND.W(0xF0F0, D0)
MOVE.W(D0, D2)
ROL.W(4, D2)
OR.B(D2, D0)
MOVE.B(D0, D1)
state.print([D1]);
assert.deepEqual(state[D1].get(16), const16('........R7R6R5R4 G7G6G5G4B7B6B5B4'));

//
// 4-bit scrambled C2P
//

state[D0] = const32("a3b3c3d3a2b2c2d2 a1b1c1d1a0b0c0d0 e3f3g3h3e2f2g2h2 e1f1g1h1e0f0g0h0");
state[D1] = const32("i3j3k3l3i2j2k2l2 i1j1k1l1i0j0k0l0 m3n3o3p3m2n2o2p2 m1n1o1p1m0n0o0p0");
state[D2] = const32("q3r3s3t3q2r2s2t2 q1r1s1t1q0r0s0t0 u3v3w3x3u2v2w2x2 u1v1w1x1u0v0w0x0");
state[D3] = const32("y3z3A3B3y2z2A2B2 y1z1A1B1y0z0A0B0 C3D3E3F3C2D2E2F2 C1D1E1F1C0D0E0F0");
state.print([D0,D1,D2,D3]);
c2p_step4(8, 1);
state.print([D0,D1,D2,D3]);
c2p_step4(16, 2);
state.print([D0,D1,D2,D3]);
c2p_step4(4, 2);
state.print([D0,D1,D2,D3]);
assert.deepEqual(state[D0], const32('a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3'));
assert.deepEqual(state[D1], const32('a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1'));
assert.deepEqual(state[D2], const32('a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2'));
assert.deepEqual(state[D3], const32('a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0'));

//
// 4-bit normal C2P
//


state.reset();
state[D0] = const32("a3a2a1a0b3b2b1b0 c3c2c1c0d3d2d1d0 e3e2e1e0f3f2f1f0 g3g2g1g0h3h2h1h0");
state[D1] = const32("i3i2i1i0j3j2j1j0 k3k2k1k0l3l2l1l0 m3m2m1m0n3n2n1n0 o3o2o1o0p3p2p1p0");
state[D2] = const32("q3q2q1q0r3r2r1r0 s3s2s1s0t3t2t1t0 u3u2u1u0v3v2v1v0 w3w2w1w0x3x2x1x0");
state[D3] = const32("y3y2y1y0z3z2z1z0 A3A2A1A0B3B2B1B0 C3C2C1C0D3D2D1D0 E3E2E1E0F3F2F1F0");
state.print([D0,D1,D2,D3]);
c2p_step4(8, 1);
state.print([D0,D1,D2,D3]);
c2p_step4(2, 1);
state.print([D0,D1,D2,D3]);
c2p_step4(16, 2);
state.print([D0,D1,D2,D3]);
c2p_step4(4, 2);
state.print([D0,D1,D2,D3]);
c2p_step4(1, 2);
state.print([D0,D1,D2,D3]);
assert.deepEqual(state[D0], const32('a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3'));
assert.deepEqual(state[D1], const32('a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1'));
assert.deepEqual(state[D2], const32('a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2'));
assert.deepEqual(state[D3], const32('a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0'));
