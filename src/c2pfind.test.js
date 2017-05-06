const assert  = require('assert');
require('./c2pfind.js')

state.log('Normal 4-bit');
[n, m] = find_4bit_c2p(
    [
        "a3a2a1a0b3b2b1b0 c3c2c1c0d3d2d1d0 e3e2e1e0f3f2f1f0 g3g2g1g0h3h2h1h0",
        "i3i2i1i0j3j2j1j0 k3k2k1k0l3l2l1l0 m3m2m1m0n3n2n1n0 o3o2o1o0p3p2p1p0",
        "q3q2q1q0r3r2r1r0 s3s2s1s0t3t2t1t0 u3u2u1u0v3v2v1v0 w3w2w1w0x3x2x1x0",
        "y3y2y1y0z3z2z1z0 A3A2A1A0B3B2B1B0 C3C2C1C0D3D2D1D0 E3E2E1E0F3F2F1F0",
    ],
    [
        'a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3',
        'a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2',
        'a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1',
        'a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0',
    ]
);
state.log(n);
state.log(m);
assert.equal(''+n, ''+[8, 2, 16, 4, 1]);
assert.equal(''+m, ''+[1, 1, 2, 2, 2]);

state.log('Scrambled 4-bit');
[n, m] = find_4bit_c2p(
    [
        "a3b3c3d3a2b2c2d2 a1b1c1d1a0b0c0d0 e3f3g3h3e2f2g2h2 e1f1g1h1e0f0g0h0",
        "i3j3k3l3i2j2k2l2 i1j1k1l1i0j0k0l0 m3n3o3p3m2n2o2p2 m1n1o1p1m0n0o0p0",
        "q3r3s3t3q2r2s2t2 q1r1s1t1q0r0s0t0 u3v3w3x3u2v2w2x2 u1v1w1x1u0v0w0x0",
        "y3z3A3B3y2z2A2B2 y1z1A1B1y0z0A0B0 C3D3E3F3C2D2E2F2 C1D1E1F1C0D0E0F0",
    ],
    [
        'a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3',
        'a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1',
        'a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2',
        'a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0',
    ]
);
state.log(n);
state.log(m);
assert.equal(''+n, ''+[ 8, 16, 4 ]);
assert.equal(''+m, ''+[ 1, 2, 2 ]);
