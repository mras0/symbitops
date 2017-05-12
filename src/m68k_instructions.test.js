const assert = require('assert');
const m68k_instructions = require('./m68k_instructions');
for (key in m68k_instructions) {
    if (key.startsWith('_')) {
        global[key.slice(1)] = m68k_instructions[key];
    } else {
        global[key] = m68k_instructions[key];
    }
}

assert.deepEqual(['', '* Hello world!'], try_parse('  \t* Hello world!', re_comment));
assert(!try_parse(' lab: inst.l', re_comment)[1]);

assert.deepEqual(['', 'exit:'], try_parse('exit:', re_label));
assert.deepEqual(['qsdosad', '.test123'], try_parse('.test123 qsdosad', re_label));
assert.deepEqual(['blah', 'label$23_:'], try_parse(' label$23_: blah', re_label));
assert(!try_parse(' blah blah2', re_label)[1]);

assert.deepEqual(['\t #42, d0', 'moveq.L'], try_parse('  moveq.L\t #42, d0', re_operation));
assert.deepEqual([' #$42, d7', 'add.b'], try_parse('add.b #$42, d7', re_operation));
assert.deepEqual([' #100, d0', 'MOVEQ'], try_parse('  MOVEQ #100, d0', re_operation));

assert.deepEqual([', d0', '#42'], try_parse('#42, d0', re_immediate));
assert.deepEqual([', d0', '#-42'], try_parse('#-42, d0', re_immediate));
assert.deepEqual([', d6', '#$abcd0123'], try_parse('#$abcd0123, d6', re_immediate));
assert.deepEqual([',d6 ', '#-$abcd0123'], try_parse('#-$abcd0123,d6 ', re_immediate));

assert.deepEqual([', (a0)+', '12(a0, d0.l)'], try_parse('12(a0, d0.l), (a0)+', re_index));
assert.deepEqual([', (a0)+', '-42(a0)'], try_parse('-42(a0), (a0)+', re_disp16));


assert.deepEqual(['', 'd2'], try_parse('d2', re_reglist));
assert.deepEqual(['', 'd2-d3'], try_parse('d2-d3', re_reglist));
assert.deepEqual(['', 'd2/d3'], try_parse('d2/d3', re_reglist));
assert.deepEqual(['', 'd0-d4/d5'], try_parse('d0-d4/d5', re_reglist));
assert.deepEqual(['', 'd0-d4/d5/a0-a3/a5'], try_parse('d0-d4/d5/a0-a3/a5', re_reglist));

assert.deepEqual(['D2'], parse_reglist('d2'));
assert.deepEqual(['D2','D3'], parse_reglist('d2-d3'));
assert.deepEqual(['D2','D3'], parse_reglist('d2/d3'));
assert.deepEqual(['D0','D1','D2','D3','D4','D5'], parse_reglist('d0-d4/d5'));
assert.deepEqual(['D0','D1','D2','D3','D4','D5','A0','A1','A2','A3','A5'], parse_reglist('d0-d4/d5/a0-a3/a5'));

assert.deepEqual(new Line(
    undefined,
    undefined,
    undefined
), Line.parse('      '));
assert.deepEqual(new Line(
    undefined,
    undefined,
    '; a0: even lines destination a5: odd lines destination'
), Line.parse('       ; a0: even lines destination a5: odd lines destination'));
assert.deepEqual(new Line(
    'foo',
    undefined,
    undefined
), Line.parse('foo '));
assert.deepEqual(new Line(
    undefined,
    undefined,
    '* a comment'
), Line.parse('\t* a comment'));
assert.deepEqual(new Line(
    'foo',
    undefined,
    '*comment'
), Line.parse('foo *comment'));
assert.deepEqual(new Line(
    'label',
    new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, '#42'), new Operand(OP_DREG, 'd0')]),
    'this is a comment'
), Line.parse('label moveq #42, d0 this is a comment'));
assert.deepEqual(new Line(
    'label$32_.',
    new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, '#42'), new Operand(OP_DREG, 'd0')]),
    'this is a comment'
), Line.parse('label$32_.: MOveq.l #42, d0 this is a comment'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, '#-$7f'), new Operand(OP_DREG, 'D0')]),
    'this is a comment'
), Line.parse(' moveq #-$7f, D0 this is a comment'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('NEG', 'W', [new Operand(OP_DREG, 'd0')]),
    undefined
), Line.parse('\tneg d0'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('NEG', 'W', [new Operand(OP_PREINCR, '-(a0)')]),
    undefined
), Line.parse('\tneg -(a0)'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('NOT', 'B', [new Operand(OP_ABSL, 'addr')]),
    undefined
), Line.parse('\tnot.b addr'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('MOVE', 'W', [new Operand(OP_INDIRECT, '(a0)'), new Operand(OP_DREG, "d0")]),
    undefined
), Line.parse(' move.w (a0),d0'));

let testIParse = function(text, inst, size, ops) {
    let [unparsed, i] = Instruction.parse(text);
    assert.equal('', unparsed);
    assert.equal(i.name, inst);
    assert.equal(i.size, size);
    assert.deepEqual(ops.map(function ([a,b]){return new Operand(a,b); }), i.operands, text);
};

testIParse('addq.l #4,d2', 'ADDQ', 'L', [[OP_IMMEDIATE,'#4'],[OP_DREG,'d2']]);
testIParse('ext d0', 'EXT', 'W', [[OP_DREG,'d0']]);
testIParse('ext.l d0', 'EXT', 'L', [[OP_DREG,'d0']]);
testIParse('exg d0, d1', 'EXG', 'L', [[OP_DREG,'d0'],[OP_DREG,'d1']]);
testIParse('tst d0', 'TST', 'W', [[OP_DREG,'d0']]);
testIParse('tst.l (a0)+', 'TST', 'L', [[OP_POSTINCR,'(a0)+']]);
testIParse('bchg d0,(a0)', 'BCHG', 'B', [[OP_DREG,'d0'],[OP_INDIRECT,'(a0)']]);
testIParse('bchg d0,d1', 'BCHG', 'L', [[OP_DREG,'d0'],[OP_DREG,'d1']]);
testIParse('bset #5,(a0)', 'BSET', 'B', [[OP_IMMEDIATE,'#5'],[OP_INDIRECT,'(a0)']]);
testIParse('bset #14,d1', 'BSET', 'L', [[OP_IMMEDIATE,'#14'],[OP_DREG,'d1']]);
testIParse('divs.l #4,d2', 'DIVS', 'L', [[OP_IMMEDIATE,'#4'],[OP_DREG,'d2']]);

let testICost = function(text, expectedCost) {
    let i = Instruction.parse(text);
    assert.equal(i[0], '', text);
    assert.equal(i[1].cost(), expectedCost, text + ': estimated cost ' + i[1].cost() + ' expected ' + expectedCost);
};

testICost('movem.w (a1)+, a2-a4', 24);
testICost('move.w -(a7),d0'     , 10);
testICost('move.l -(a7),d0'     , 14);
testICost('move.w d0,-(a7)'     , 8);
testICost('move.l d0,-(a7)'     , 12);
testICost('add.w d0,-(a7)'      , 10);
testICost('add.l d0,-(a7)'      , 16);
testICost('exg d0,d1'           , 6);
testICost('ext.l d0'            , 4);
testICost('tst.b d0'            , 4);
testICost('tst.w 22(a0,d0)'     , 14);
testICost('tst.l absaddr'       , 20);
testICost('not.b (a0)'          , 12);
testICost('neg.l -(a7)'         , 22);
testICost('bchg d0,42(a0)'      , 16);
testICost('bset d0,d1'          , 8);
testICost('bchg #3,(a0)'        , 16);
testICost('bset #17,d1'         , 12);
testICost('bclr d7,-(a2)'       , 14);
testICost('bclr d2,d3'          , 10);
testICost('bclr #19,absaddr'    , 24);
testICost('bclr #19,d2'         , 14);
testICost('btst d0,(a0)'        , 8);
testICost('btst d1,d2'          , 6);
testICost('btst #3,(a0)+'       , 12);
testICost('btst #17,d0'         , 10);

// A bunch of code fragments, some from amycoders
let code0=`
	move.b d0,   d1    ; make a copy of that row
	move.b d0,   d1    ; make a copy of that row
	move.b d4,   d5    ; copy that row too
	and.b  #$f0, d0    ; those bits should remain in d0
	and.b  #$0f, d4    ; those bits should remain in d4
	and.b  #$0f, d1    ; those are the ones which should move
	and.b  #$f0, d5    ;  ditto
	lsl.b  #4,   d1    ; you figure this one out on your own. :)
	lsr.b  #4,   d5    ;  ditto
	lsl.b  #4,   d1    ; you figure this one out on your own. :)
	lsr.b  #4,   d5    ; ditto
	or.b   d1,   d4    ; put in the bits
	or.b   d5,   d0


	move.l  #$f0f0f0f0,d4
	move.l  d0,d6       		; d6 = a7a6a5a4a3a2a1a0 b7b6b5b4b3b2b1b0 c7c6c5c4c3c2c1c0 d7d6d5d4d3d2d1d0
	move.l  d1,d7		; d7 = e7e6e5e4e3e2e1e0 f7f6f5f4f3f2f1f0 g7g6g5g4g3g2g1g0 h7h6h5h4h3h2h1h0
	and.l   d4,d0		; d0 = a7a6a5a4........ b7b6b5b4........ c7c6c5c4........ d7d6d5d4........
	and.l   d4,d7		; d7 = e7e6e5e4........ f7f6f5f4........ g7g6g5g4........ h7h6h5h4........
	eor.l   d0,d6		; d6 = ........a3a2a1a0 ........b3b2b1b0 ........c3c2c1c0 ........d3d2d1d0
	eor.l   d7,d1		; d1 = ........e3e2e1e0 ........f3f2f1f0 ........g3g2g1g0 ........h3h2h1h0
	lsl.l   #4,d6		; d6 = a3a2a1a0........ b3b2b1b0........ c3c2c1c0........ d3d2d1d0........
	lsr.l   #4,d7		; d7 = ........e7e6e5e4 ........f7f6f5f4 ........g7g6g5g4 ........h7h6h5h4
	eor.l   d6,d1		; d1 = a3a2a1a0e3e2e1e0 b3b2b1b0f3f2f1f0 c3c2c1c0g3g2g1g0 d3d2d1d0h3h2h1h0
	eor.l   d7,d0		; d0 = a7a6a5a4e7e6e5e4 b7b6b5b4f7f6f5f4 c7c6c5c4g7g6g5g4 d7d6d5d4h7h6h5h4

    ror.l #4,d1
	move.l d0,d7
	eor.l d1,d7
	and.l #$0f0f0f0f,d7	; there we have a simple "vertical" mask
	eor.l d7,d0
	eor.l d7,d1
	rol.l #4,d1	


	move.w	d1,d4		; d4 (offset reg) = VVxx
	move.w	d0,d5		; Temporarily...
	lsr.w	#8,d5		; ...to get UU in lower byte of a reg
	move.b	d5,d4		; d4 = VVUU = correct offset
	move.b	(a0,d4.w),(a1)+
	add.w	d2,d0
	add.w	d3,d1
*	dbf	d7,.pixel
    move.w	d1,d6                   ;get v 
    ror.l	#8,d0			;and
    move.b	d0,d6			;u integer part
    rol.l	#8,d0			;re-adjust u 
    move.l	-1(a0,d6.w),d5		;get (u,v) and (u+1,v) and store like (xxC1C3xx)
    move.l	d1,d2			;get v
    and.l	d3,d2			;decimal part
    move.l	-1(a6,d6.w),d6		;get (u,v+1) and (u+1,v+1) and store like (xxC2C4xx)
    lsr.w	#8,d5			;(xxC100C3)
    and.l	d4,d5			;(00C100C3)
    lsr.w	#8,d6			;the same thing for C2 and C4
    and.l	d4,d6			;(00C200C4)
    sub.l	d5,d6			;(C4-C1,C3-C2)
    muls.l	d2,d6			;((C4-C1)*dv,(C3-C2)*dv)
    lsr.l	#8,d6			;remember, we work with fixed 8 bits math :-)
    add.l	d5,d6			;((C4-C1)*dv+C1,(C3-C2)*dv+C2) = (LS,RS)
    and.l	d4,d6			;clean values
    move.w	d6,d5			;now we have to
    swap	d6			;interpolate SIDE values along u-direction
    sub.w	d6,d5			;RS-LS
    move.l	d0,d2			;get u
    and.l	d4,d2			;decimal part
    muls.w	d5,d2			;(RS-LS)*du
    lsr.w	#8,d2			;fixed math adjustament
    add.w	d6,d2			;C = (RS-LS)*dv
    move.b	d2,(a1)+		;ta daaa! just write bilerped texel on chunky!


    ; D0 = a3a2a1a0b3b2b1b0 c3c2c1c0d3d2d1d0 e3e2e1e0f3f2f1f0 g3g2g1g0h3h2h1h0
	; D1 = i3i2i1i0j3j2j1j0 k3k2k1k0l3l2l1l0 m3m2m1m0n3n2n1n0 o3o2o1o0p3p2p1p0
	; D2 = q3q2q1q0r3r2r1r0 s3s2s1s0t3t2t1t0 u3u2u1u0v3v2v1v0 w3w2w1w0x3x2x1x0
	; D3 = y3y2y1y0z3z2z1z0 A3A2A1A0B3B2B1B0 C3C2C1C0D3D2D1D0 E3E2E1E0F3F2F1F0

	; 8x1
	MOVE.L	D1, D4          	; D4 = i3i2i1i0j3j2j1j0 k3k2k1k0l3l2l1l0 m3m2m1m0n3n2n1n0 o3o2o1o0p3p2p1p0
	LSR.L	#$8, D4         	; D4 = ................ i3i2i1i0j3j2j1j0 k3k2k1k0l3l2l1l0 m3m2m1m0n3n2n1n0
	EOR.L	D0, D4          	; D4 = a3a2a1a0b3b2b1b0 ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$ff00ff, D4    	; D4 = ................ ^^^^^^^^^^^^^^^^ ................ ^^^^^^^^^^^^^^^^
	EOR.L	D4, D0          	; D0 = a3a2a1a0b3b2b1b0 i3i2i1i0j3j2j1j0 e3e2e1e0f3f2f1f0 m3m2m1m0n3n2n1n0
	LSL.L	#$8, D4         	; D4 = ^^^^^^^^^^^^^^^^ ................ ^^^^^^^^^^^^^^^^ ................
	EOR.L	D4, D1          	; D1 = c3c2c1c0d3d2d1d0 k3k2k1k0l3l2l1l0 g3g2g1g0h3h2h1h0 o3o2o1o0p3p2p1p0
	MOVE.L	D3, D4          	; D4 = y3y2y1y0z3z2z1z0 A3A2A1A0B3B2B1B0 C3C2C1C0D3D2D1D0 E3E2E1E0F3F2F1F0
	LSR.L	#$8, D4         	; D4 = ................ y3y2y1y0z3z2z1z0 A3A2A1A0B3B2B1B0 C3C2C1C0D3D2D1D0
	EOR.L	D2, D4          	; D4 = q3q2q1q0r3r2r1r0 ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$ff00ff, D4    	; D4 = ................ ^^^^^^^^^^^^^^^^ ................ ^^^^^^^^^^^^^^^^
	EOR.L	D4, D2          	; D2 = q3q2q1q0r3r2r1r0 y3y2y1y0z3z2z1z0 u3u2u1u0v3v2v1v0 C3C2C1C0D3D2D1D0
	LSL.L	#$8, D4         	; D4 = ^^^^^^^^^^^^^^^^ ................ ^^^^^^^^^^^^^^^^ ................
	EOR.L	D4, D3          	; D3 = s3s2s1s0t3t2t1t0 A3A2A1A0B3B2B1B0 w3w2w1w0x3x2x1x0 E3E2E1E0F3F2F1F0

	; 2x1
	MOVE.L	D1, D4          	; D4 = c3c2c1c0d3d2d1d0 k3k2k1k0l3l2l1l0 g3g2g1g0h3h2h1h0 o3o2o1o0p3p2p1p0
	LSR.L	#$2, D4         	; D4 = ....c3c2c1c0d3d2 d1d0k3k2k1k0l3l2 l1l0g3g2g1g0h3h2 h1h0o3o2o1o0p3p2
	EOR.L	D0, D4          	; D4 = a3a2^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$33333333, D4  	; D4 = ....^^^^....^^^^ ....^^^^....^^^^ ....^^^^....^^^^ ....^^^^....^^^^
	EOR.L	D4, D0          	; D0 = a3a2c3c2b3b2d3d2 i3i2k3k2j3j2l3l2 e3e2g3g2f3f2h3h2 m3m2o3o2n3n2p3p2
	LSL.L	#$2, D4         	; D4 = ^^^^....^^^^.... ^^^^....^^^^.... ^^^^....^^^^.... ^^^^....^^^^....
	EOR.L	D4, D1          	; D1 = a1a0c1c0b1b0d1d0 i1i0k1k0j1j0l1l0 e1e0g1g0f1f0h1h0 m1m0o1o0n1n0p1p0
	MOVE.L	D3, D4          	; D4 = s3s2s1s0t3t2t1t0 A3A2A1A0B3B2B1B0 w3w2w1w0x3x2x1x0 E3E2E1E0F3F2F1F0
	LSR.L	#$2, D4         	; D4 = ....s3s2s1s0t3t2 t1t0A3A2A1A0B3B2 B1B0w3w2w1w0x3x2 x1x0E3E2E1E0F3F2
	EOR.L	D2, D4          	; D4 = q3q2^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$33333333, D4  	; D4 = ....^^^^....^^^^ ....^^^^....^^^^ ....^^^^....^^^^ ....^^^^....^^^^
	EOR.L	D4, D2          	; D2 = q3q2s3s2r3r2t3t2 y3y2A3A2z3z2B3B2 u3u2w3w2v3v2x3x2 C3C2E3E2D3D2F3F2
	LSL.L	#$2, D4         	; D4 = ^^^^....^^^^.... ^^^^....^^^^.... ^^^^....^^^^.... ^^^^....^^^^....
	EOR.L	D4, D3          	; D3 = q1q0s1s0r1r0t1t0 y1y0A1A0z1z0B1B0 u1u0w1w0v1v0x1x0 C1C0E1E0D1D0F1F0

	; 16x2
	SWAP	D2              	; D2 = u3u2w3w2v3v2x3x2 C3C2E3E2D3D2F3F2 q3q2s3s2r3r2t3t2 y3y2A3A2z3z2B3B2
	EOR.W	D0, D2          	; D2 = u3u2w3w2v3v2x3x2 C3C2E3E2D3D2F3F2 ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	EOR.W	D2, D0          	; D0 = a3a2c3c2b3b2d3d2 i3i2k3k2j3j2l3l2 q3q2s3s2r3r2t3t2 y3y2A3A2z3z2B3B2
	EOR.W	D0, D2          	; D2 = u3u2w3w2v3v2x3x2 C3C2E3E2D3D2F3F2 e3e2g3g2f3f2h3h2 m3m2o3o2n3n2p3p2
	SWAP	D2              	; D2 = e3e2g3g2f3f2h3h2 m3m2o3o2n3n2p3p2 u3u2w3w2v3v2x3x2 C3C2E3E2D3D2F3F2
	SWAP	D3              	; D3 = u1u0w1w0v1v0x1x0 C1C0E1E0D1D0F1F0 q1q0s1s0r1r0t1t0 y1y0A1A0z1z0B1B0
	EOR.W	D1, D3          	; D3 = u1u0w1w0v1v0x1x0 C1C0E1E0D1D0F1F0 ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	EOR.W	D3, D1          	; D1 = a1a0c1c0b1b0d1d0 i1i0k1k0j1j0l1l0 q1q0s1s0r1r0t1t0 y1y0A1A0z1z0B1B0
	EOR.W	D1, D3          	; D3 = u1u0w1w0v1v0x1x0 C1C0E1E0D1D0F1F0 e1e0g1g0f1f0h1h0 m1m0o1o0n1n0p1p0
	SWAP	D3              	; D3 = e1e0g1g0f1f0h1h0 m1m0o1o0n1n0p1p0 u1u0w1w0v1v0x1x0 C1C0E1E0D1D0F1F0

	; 4x2
	MOVE.L	D2, D4          	; D4 = e3e2g3g2f3f2h3h2 m3m2o3o2n3n2p3p2 u3u2w3w2v3v2x3x2 C3C2E3E2D3D2F3F2
	LSR.L	#$4, D4         	; D4 = ........e3e2g3g2 f3f2h3h2m3m2o3o2 n3n2p3p2u3u2w3w2 v3v2x3x2C3C2E3E2
	EOR.L	D0, D4          	; D4 = a3a2c3c2^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$f0f0f0f, D4   	; D4 = ........^^^^^^^^ ........^^^^^^^^ ........^^^^^^^^ ........^^^^^^^^
	EOR.L	D4, D0          	; D0 = a3a2c3c2e3e2g3g2 i3i2k3k2m3m2o3o2 q3q2s3s2u3u2w3w2 y3y2A3A2C3C2E3E2
	LSL.L	#$4, D4         	; D4 = ^^^^^^^^........ ^^^^^^^^........ ^^^^^^^^........ ^^^^^^^^........
	EOR.L	D4, D2          	; D2 = b3b2d3d2f3f2h3h2 j3j2l3l2n3n2p3p2 r3r2t3t2v3v2x3x2 z3z2B3B2D3D2F3F2
	MOVE.L	D3, D4          	; D4 = e1e0g1g0f1f0h1h0 m1m0o1o0n1n0p1p0 u1u0w1w0v1v0x1x0 C1C0E1E0D1D0F1F0
	LSR.L	#$4, D4         	; D4 = ........e1e0g1g0 f1f0h1h0m1m0o1o0 n1n0p1p0u1u0w1w0 v1v0x1x0C1C0E1E0
	EOR.L	D1, D4          	; D4 = a1a0c1c0^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$f0f0f0f, D4   	; D4 = ........^^^^^^^^ ........^^^^^^^^ ........^^^^^^^^ ........^^^^^^^^
	EOR.L	D4, D1          	; D1 = a1a0c1c0e1e0g1g0 i1i0k1k0m1m0o1o0 q1q0s1s0u1u0w1w0 y1y0A1A0C1C0E1E0
	LSL.L	#$4, D4         	; D4 = ^^^^^^^^........ ^^^^^^^^........ ^^^^^^^^........ ^^^^^^^^........
	EOR.L	D4, D3          	; D3 = b1b0d1d0f1f0h1h0 j1j0l1l0n1n0p1p0 r1r0t1t0v1v0x1x0 z1z0B1B0D1D0F1F0

	; 1x2
	MOVE.L	D2, D4          	; D4 = b3b2d3d2f3f2h3h2 j3j2l3l2n3n2p3p2 r3r2t3t2v3v2x3x2 z3z2B3B2D3D2F3F2
	LSR.L	#$1, D4         	; D4 = ..b3b2d3d2f3f2h3 h2j3j2l3l2n3n2p3 p2r3r2t3t2v3v2x3 x2z3z2B3B2D3D2F3
	EOR.L	D0, D4          	; D4 = a3^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$55555555, D4  	; D4 = ..^^..^^..^^..^^ ..^^..^^..^^..^^ ..^^..^^..^^..^^ ..^^..^^..^^..^^
	EOR.L	D4, D0          	; D0 = a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3
	ADD.L	D4, D4          	; D4 = ^^..^^..^^..^^.. ^^..^^..^^..^^.. ^^..^^..^^..^^.. ^^..^^..^^..^^..
	EOR.L	D4, D2          	; D2 = a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2
	MOVE.L	D3, D4          	; D4 = b1b0d1d0f1f0h1h0 j1j0l1l0n1n0p1p0 r1r0t1t0v1v0x1x0 z1z0B1B0D1D0F1F0
	LSR.L	#$1, D4         	; D4 = ..b1b0d1d0f1f0h1 h0j1j0l1l0n1n0p1 p0r1r0t1t0v1v0x1 x0z1z0B1B0D1D0F1
	EOR.L	D1, D4          	; D4 = a1^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
	AND.L	#$55555555, D4  	; D4 = ..^^..^^..^^..^^ ..^^..^^..^^..^^ ..^^..^^..^^..^^ ..^^..^^..^^..^^
	EOR.L	D4, D1          	; D1 = a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1
	ADD.L	D4, D4          	; D4 = ^^..^^..^^..^^.. ^^..^^..^^..^^.. ^^..^^..^^..^^.. ^^..^^..^^..^^..
	EOR.L	D4, D3          	; D3 = a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0


	; D0 = a3b3c3d3e3f3g3h3 i3j3k3l3m3n3o3p3 q3r3s3t3u3v3w3x3 y3z3A3B3C3D3E3F3
	; D1 = a1b1c1d1e1f1g1h1 i1j1k1l1m1n1o1p1 q1r1s1t1u1v1w1x1 y1z1A1B1C1D1E1F1
	; D2 = a2b2c2d2e2f2g2h2 i2j2k2l2m2n2o2p2 q2r2s2t2u2v2w2x2 y2z2A2B2C2D2E2F2
	; D3 = a0b0c0d0e0f0g0h0 i0j0k0l0m0n0o0p0 q0r0s0t0u0v0w0x0 y0z0A0B0C0D0E0F0

`.split('\n');

code1=`
unpack:
        movem.l d2-d3/a2, -(a7)
.refill:
        moveq   #8, d0          ; make sure upper bits of d0 are clear
.getcontrolbits:
        move.w  d0, d1          ; d1 = number of control bits (8 normally, less on short run)
        move.b  (a1)+, d0       ; d0 = control bits
        bne.s   .mainloop       ; special case?
        move.b  (a1)+, d0       ; yes load another byte
        beq.s   .mainloop       ; the control bits just happened to be 0
        cmp.b   d0, d1          ; See if this is a short run/the end or a literal run
        beq.s   .quit		; =8 -> quit
        bcc.s	.getcontrolbits	; <8 -> the byte specified the number of control bits, d0 is copied to d1 and refilled (with a value guaranteed not to be 0)
        addq.w  #6, d0          ; >8 -> literal run length - 7, add 6 (for dbf)
.litcopy:
	    move.b	(a1)+, (a0)+
	    dbf	d0, .litcopy
        bra.s	.refill
.mainloop:
        ; d0.b = control bits
        ; d1.b = num control bits
        subq.b  #1, d1          ; we consume one control bit
        bmi.s   .refill         ; are we out of bits?
        add.b   d0, d0          ; get control bit
        bcc.s   .match          ; clear -> match
        move.b  (a1)+, (a0)+    ; copy literal
        bra.s   .mainloop       ; and continue loop
.match:
        moveq   #-1, d2         ; d2 = !!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!!
        move.b  (a1)+, d2       ; d2 = !!!!!!!!!!!!!!!! ObOaO9O8L3L2L1L0
        move.b  d2, d3          ; d3 = ???????????????? ObOaO9O8L3L2L1L0
        lsl.w   #4, d2          ; d2 = !!!!!!!!ObOaO9O8 L3L2L1L0........
        move.b  (a1)+, d2       ; d2 = !!!!!!!!ObOaO9O8 O7O6O5O4O3O2O1O0
        lea     (a0,d2.w), a2   ; a2 = &out[-1-offset]
        move.b  (a2)+, (a0)+    ; copy first byte
        moveq   #$f, d2         ; d2 = ................ ........!!!!!!!!
        and.w   d2, d3          ; d3 = ................ ........L3L2L1L0
        bne.s   .copyloop
        move.b  (a2)+, (a0)+    ; copy another byte
        move.b  (a1)+, d3       ; get extra length
        add.w   d2, d3          ; + $f (and with one extra iteration from dbf and the above copies we get +$12 (18))
.copyloop:
        move.b  (a2)+, (a0)+    ; copy the rest of the match
        dbf     d3, .copyloop
        bra.s   .mainloop       ; handle next lz value
.quit:
        movem.l (a7)+, d2-d3/a2
        rts
`.split('\n');

code1.forEach(function (text) {
    let line = Line.parse(text);
    if (line.instruction) {
        let s = (line.instruction+'                        ').substring(0,24);
        try {
            var cost = line.instruction.cost();
            //console.log('\t'+s+'\t'+cost);
        } catch (e) {
            console.log('Failed to determine cost for ' + s);
            throw e;
        }
    }
});

let ls = parse_lines('\tMOVE.b #42,D0\n\tSub.w #66,d0\n\tMOVE.L A0,A1\n\tMOVE.W d0,(a0)\n\tMOVEQ #-8,d0');
assert.equal(ls.length, 5);
assert.deepEqual(ls[0].instruction, new Instruction('MOVE', 'B', [new Operand(OP_IMMEDIATE, '#42'), new Operand(OP_DREG, 'D0')]));
assert.deepEqual(ls[1].instruction, new Instruction('SUB', 'W', [new Operand(OP_IMMEDIATE, '#66'), new Operand(OP_DREG, 'd0')]));
assert.deepEqual(ls[2].instruction, new Instruction('MOVE', 'L', [new Operand(OP_AREG, 'A0'), new Operand(OP_AREG, 'A1')]));
assert.deepEqual(ls[3].instruction, new Instruction('MOVE', 'W', [new Operand(OP_DREG, 'd0'), new Operand(OP_INDIRECT, '(a0)')]));
assert.deepEqual(ls[4].instruction, new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, '#-8'), new Operand(OP_DREG, 'd0')]));
let f = to_code(ls);
D0 = 'D0';
A0 = 'A0';
A1 = 'A1';
called = 0;
MOVE = {
    B : function (src, dst) { ++called; assert.equal(src, 42); assert.equal(dst, D0); },
    W : function (src, dst) { ++called; assert.equal(src, D0); assert.deepEqual(dst, [A0]); },
    L : function (src, dst) { ++called; assert.equal(src, A0); assert.equal(dst, A1); },
};
MOVEQ = {
    L : function (src, dst) { ++called; assert.equal(src, -8); assert.equal(dst, D0); },
};
SUB = { W : function (src, dst) { ++called; assert.equal(src, 66); assert.equal(dst, D0); } };
state = { writeline : function (msg) {} };
f();
assert.equal(5, called);

//console.log(to_code(parse_lines('\tMOVE.L D0, 22 ( A0 )\n\tMOVE.B D1,12( A0, D0.w)\n\tMOVE.L D0,(a0,d0)')).toString());
