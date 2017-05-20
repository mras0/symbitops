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

assert.equal('(1+2)*3', (new BinExpr('*', new BinExpr('+', new LitExpr(1), new LitExpr(2)), new LitExpr(3))).toString());

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
    new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, new LitExpr(42)), new Operand(OP_DREG, 0)]),
    'this is a comment'
), Line.parse('label moveq #42, d0 this is a comment'));
assert.deepEqual(new Line(
    'label$32_.',
    new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, new LitExpr(42)), new Operand(OP_DREG, 0)]),
    'this is a comment'
), Line.parse('label$32_.: MOveq.l #42, d0 this is a comment'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, new NegExpr(new LitExpr(127))), new Operand(OP_DREG, 0)]),
    'this is a comment'
), Line.parse(' moveq #-$7f, D0 this is a comment'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('NEG', 'W', [new Operand(OP_DREG, 0)]),
    undefined
), Line.parse('\tneg d0'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('NEG', 'W', [new Operand(OP_PREINCR, 0)]),
    undefined
), Line.parse('\tneg -(a0)'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('NOT', 'B', [new Operand(OP_ABSL, new SymExpr('addr'))]),
    undefined
), Line.parse('\tnot.b addr'));
assert.deepEqual(new Line(
    undefined,
    new Instruction('MOVE', 'W', [new Operand(OP_INDIRECT, 0), new Operand(OP_DREG, 0)]),
    undefined
), Line.parse(' move.w (a0),d0'));

let testIParse = function(text, inst, size, ops) {
    let [unparsed, i] = Instruction.parse(text);
    assert.equal('', unparsed);
    assert.equal(i.name, inst);
    assert.equal(i.size, size);
    assert.deepEqual(ops.map(function ([a,b]){return new Operand(a,b); }), i.operands);//, text);
};

testIParse('addq.l #4,d2', 'ADDQ', 'L', [[OP_IMMEDIATE,new LitExpr(4)],[OP_DREG,2]]);
testIParse('ext d0', 'EXT', 'W', [[OP_DREG,0]]);
testIParse('ext.l d0', 'EXT', 'L', [[OP_DREG,0]]);
testIParse('exg d0, d1', 'EXG', 'L', [[OP_DREG,0],[OP_DREG,1]]);
testIParse('tst d0', 'TST', 'W', [[OP_DREG,0]]);
testIParse('tst.l (a0)+', 'TST', 'L', [[OP_POSTINCR,0]]);
testIParse('bchg d0,(a0)', 'BCHG', 'B', [[OP_DREG,0],[OP_INDIRECT,0]]);
testIParse('bchg d0,d1', 'BCHG', 'L', [[OP_DREG,0],[OP_DREG,1]]);
testIParse('bset #5,(a0)', 'BSET', 'B', [[OP_IMMEDIATE,new LitExpr(5)],[OP_INDIRECT,0]]);
testIParse('bset #14,d1', 'BSET', 'L', [[OP_IMMEDIATE,new LitExpr(14)],[OP_DREG,1]]);
testIParse('divs.l #4,d2', 'DIVS', 'L', [[OP_IMMEDIATE,new LitExpr(4)],[OP_DREG,2]]);
testIParse('move.b d3,-(a3)', 'MOVE', 'B', [[OP_DREG,3],[OP_PREINCR,3]]);
testIParse('move.b d3,(a3)+', 'MOVE', 'B', [[OP_DREG,3],[OP_POSTINCR,3]]);
testIParse('add.w 22(a0),d4', 'ADD', 'W', [[OP_DISP16,[new LitExpr(22), 0]],[OP_DREG,4]]);
testIParse('add.w 42(a2,d3),d4', 'ADD', 'W', [[OP_INDEX,[new LitExpr(42), 2, 3]],[OP_DREG,4]]);
testIParse('move  10(pc), d0', 'MOVE', 'W', [[OP_DISP16PC,[new LitExpr(10)]],[OP_DREG,0]]);
testIParse('move.l 2(pc,d2), d0', 'MOVE', 'L', [[OP_INDEXPC,[new LitExpr(2), 2]],[OP_DREG,0]]);
testIParse('movem.l d0-d2/a0-a2,-(a7)', 'MOVEM', 'L', [[OP_REGLIST, 0x0707],[OP_PREINCR,7]]);

testIParse('move    #( 42 ) ,d0', 'MOVE', 'W', [[OP_IMMEDIATE, new LitExpr(42)],[OP_DREG,0]]);
testIParse('moveq   #2+3, d0', 'MOVEQ', 'L', [[OP_IMMEDIATE, new BinExpr('+', new LitExpr(2), new LitExpr(3))],[OP_DREG,0]]);
testIParse('moveq   #5-4+1, d0', 'MOVEQ', 'L', [[OP_IMMEDIATE, new BinExpr('+', new BinExpr('-', new LitExpr(5), new LitExpr(4)), new LitExpr(1))],[OP_DREG,0]]);
testIParse('lsr     #1+2*3, d0', 'LSR', 'W', [[OP_IMMEDIATE, new BinExpr('+', new LitExpr(1), new BinExpr('*', new LitExpr(2), new LitExpr(3)))],[OP_DREG,0]]);

assert.equal('MOVEM.L\tD0-D2/D4/D6-A3, -(A7)', Instruction.parse('movem.l d0-d2/d4/d6-d7/a0-a3,-(a7)')[1].toString());

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
testICost('neg  10(pc)'         , 16);
testICost('lea  2(pc,d0),a2'    , 12);

let testEncode = function(text, expectedEncoding) {
    let i = Instruction.parse(text);
    assert.equal(i[0], '', text);
    let h = x => '$'+('0000'+x.toString(16)).slice(-4);
    assert.deepEqual(i[1].encode(), expectedEncoding, text + ': encdoded ' + i[1].encode().map(h) + ' expected ' + expectedEncoding.map(h));
};

// MOVEQ
testEncode('MOVEQ   #0, d0',                [0x7000]);
testEncode('MOVEQ   #-2, d3',               [0x76fe]);
testEncode('MOVEQ   #15, d7',               [0x7e0F]);
// EXG
testEncode('EXG     d0,d0',                 [0xc140]);
testEncode('EXG     d2,d3',                 [0xc543]);
// RTS
testEncode('rts',                           [0x4e75]);
// MOVE
testEncode('move    d0, d1',                [0x3200]);
testEncode('move    d1, d0',                [0x3001]);
testEncode('move.l  d2, d3',                [0x2602]);
testEncode('move.b  d4, d5',                [0x1a04]);
testEncode('move.w  d0, (a0)',              [0x3080]);
testEncode('move.w  d0, (a0)+',             [0x30C0]);
testEncode('move.w  d0, -(a0)',             [0x3100]);
testEncode('move.b  $1234(a4), d5',         [0x1a2c, 0x1234]);
testEncode('move.w  $45(a0,d2), d1',        [0x3230, 0x2045]);
testEncode('move.b  #$81, d4',              [0x183c, 0x0081]);
testEncode('move.w  #$4321, d5',            [0x3a3c, 0x4321]);
testEncode('move.l  #$1234abcd, d6',        [0x2c3c, 0x1234, 0xabcd]);
testEncode('move.w  #$0aaa, $dff180',       [0x33fc, 0x0aaa, 0x00df, 0xf180]);
// MOVEA
testEncode('move.w  d0, a0',                [0x3040]);
testEncode('move.l  a0, d7',                [0x2e08]);
testEncode('move.l  (a2)+, a4',             [0x285a]);
// Bcc
testEncode('bra.s   blah',                  [0x60fe]);
testEncode('bra.w   blah',                  [0x6000, 0xfffe]);
testEncode('bcs.s   blah',                  [0x65fe]);
// DBcc
testEncode('dbf     d0, .blah',             [0x51c8, 0xffff])
testEncode('dbcc    d7, .blah',             [0x54cf, 0xffff])
// ADDQ/SUBQ
testEncode('addq.b  #4, d5',                [0x5805]);
testEncode('addq.w  #1, a0',                [0x5248]);
testEncode('addq.l  #2, a3',                [0x548B]);
testEncode('addq.l  #4, d7',                [0x5887]);
testEncode('subq    #1, d0',                [0x5340]);
testEncode('subq    #8, $1234(a2)',         [0x516a, 0x1234]);
// ADD
testEncode('add.w   d1, d0',                [0xd041]);
testEncode('add.l   d0, $1234(a3)',         [0xd1ab, 0x1234]);
testEncode('add.l   (a3)+, d2',             [0xd49b]);
// ADDI
testEncode('add.b   #42, d0',               [0x0600, 0x002A]);
testEncode('add.b   #12, $1234(a0)',        [0x0628, 0x000C, 0x1234]);
// ADDA
testEncode('add.w   d0, a0',                [0xd0c0]);
testEncode('add.w   a0, d0',                [0xd048]);
testEncode('add.l   d1, a2',                [0xd5c1]);
testEncode('add.l   (a0), a2',              [0xd5d0]);
// SUB
testEncode('sub.l   d2, d3',                [0x9682]);
// SUBI
testEncode('sub.w   #42, d4',               [0x0444, 0x002A]);
// SUBA
testEncode('sub.w   d0, a0',                [0x90c0]);
testEncode('sub.l   a3, d7',                [0x9e8b]);
// LEA
testEncode('lea     $1234(a1), a2',         [0x45e9, 0x1234]);
testEncode('lea     $10(pc), a0',           [0x41fa, 0x000e]);
testEncode('lea     $0(pc,d0), a1',         [0x43fb, 0x00fe]);
// AND
testEncode('and     d1, d2',                [0xc441]);
testEncode('and.l   d2, d3',                [0xc682]);
testEncode('and.b   (a1), d4',              [0xc811]);
testEncode('and.b   d5, $1234(a7)',         [0xcb2f, 0x1234]);
testEncode('and.w   #$ff01, d5',            [0x0245, 0xff01]);
// EOR
testEncode('eor     d1, d2',                [0xb342]);
testEncode('eor.b   #10, d2',               [0x0a02, 0x000a]);
// OR
testEncode('or     d1, d2',                 [0x8441]);
testEncode('or.b   #10, d2',                [0x0002, 0x000a]);
// CMP
testEncode('cmp    d1, d2',                 [0xb441]);
testEncode('cmp.b  #10, d2',                [0x0c02, 0x000a]);
// LSL/LSR
testEncode('lsl    #4, d0',                 [0xe948]);
testEncode('lsl.b  d1, d2',                 [0xe32a]);
testEncode('lsr.l  #4, d0',                 [0xe888]);
// ROL/ROR
testEncode('rol    #7, d1',                 [0xef59]);
testEncode('ror.b  d3, d4',                 [0xe63c]);
// ASL/ASR
testEncode('asl    #7, d1',                 [0xef41]);
testEncode('asr.b  d3, d4',                 [0xe624]);
// MOVEM
testEncode('movem.w d0-d7/a0/a2, -(a7)',    [0x48a7, 0xffa0]);
testEncode('movem.l (a7)+, d2-d3/a2-a4',    [0x4cdf, 0x1c0c]);
testEncode('movem   d0-a6, -(a7)',          [0x48a7, 0xfffe]);
// BSET/BCLR/BCHG/BTST
testEncode('bset    d3, d6',                [0x07c6]);
testEncode('bset    d3, (a0)',              [0x07d0]);
testEncode('bset    #4, d2',                [0x08c2, 0x0004]);
testEncode('bclr    #2, (a1)+',             [0x0899, 0x0002]);
testEncode('bchg    #1, $12(a1,d1)',        [0x0871, 0x0001, 0x1012]);
testEncode('btst    d0, d1',                [0x0101]);
// MULS/MULU
testEncode('muls.w  d0, d1',                [0xc3c0]);
testEncode('mulu.w  (a1), d2',              [0xc4d1]);
// DIVS/DIVU
testEncode('divs.w  d2, d3',                [0x87c2]);
testEncode('divu.w  -(a2), d3',             [0x86e2]);
// NOT, NEG, CLR
testEncode('not.b   d0',                    [0x4600]);
testEncode('not     (a0)+',                 [0x4658]);
testEncode('not.l   d7',                    [0x4687]);
testEncode('neg.l   d2',                    [0x4482]);
testEncode('clr.b   -(a2)',                 [0x4222]);
// ADDX, SUBX
testEncode('addx.b  d0, d1',                [0xd300]);
testEncode('subx.l  d2, d3',                [0x9782]);
// TST
testEncode('tst     d0',                    [0x4a40]);
testEncode('tst.b   $1234(a2)',             [0x4a2a, 0x1234]);



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

        move.l  $1234(a0), d0
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
        try {
            line.instruction.encode();
        } catch (e) {
            console.log('Failed to encode ' + s);
        }
    }
});

let ls = parse_lines('\tMOVE.b #42,D0\n\tSub.w #66,d0\n\tMOVE.L A0,A1\n\tMOVE.W d0,(a0)\n\tMOVEQ #-8,d0');
assert.equal(ls.length, 5);
assert.deepEqual(ls[0].instruction, new Instruction('MOVE', 'B', [new Operand(OP_IMMEDIATE, new LitExpr(42)), new Operand(OP_DREG, 0)]));
assert.deepEqual(ls[1].instruction, new Instruction('SUB', 'W', [new Operand(OP_IMMEDIATE, new LitExpr(66)), new Operand(OP_DREG, 0)]));
assert.deepEqual(ls[2].instruction, new Instruction('MOVE', 'L', [new Operand(OP_AREG, 0), new Operand(OP_AREG, 1)]));
assert.deepEqual(ls[3].instruction, new Instruction('MOVE', 'W', [new Operand(OP_DREG, 0), new Operand(OP_INDIRECT, 0)]));
assert.deepEqual(ls[4].instruction, new Instruction('MOVEQ', 'L', [new Operand(OP_IMMEDIATE, new NegExpr(new LitExpr(8))), new Operand(OP_DREG, 0)]));
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

//console.log(to_code(parse_lines('\tMOVE.L D0, 22 ( A0 )\n\tMOVE.B D1,12( A0, D0.w)\n\tMOVE.L D0,1234(a0,d0)')).toString());

function testCodegen(itext, expected_code) {
    const code = to_code(parse_lines('\t'+itext)).toString().split('\n');
    assert(code.length>2);
    if (expected_code!=code[1]) {
        console.log('Instruction: ' + itext);
        console.log('Expecting: ' + expected_code);
        console.log('Actual: ' + code[1]);
    }
    assert.equal(expected_code, code[1]);
};
testCodegen('moveq  #42+2, d0'                  , 'MOVEQ.L(42+2, D0)');
testCodegen('move.b (a0), d0'                   , 'MOVE.B([A0], D0)');
testCodegen('move   $1234(a1,d2), d0'           , 'MOVE.W([A1, D2, 4660], D0)');
testCodegen('add.b  (offset+2)*s(a4,d1), d2'    , 'ADD.B([A4, D1, (offset+2)*s], D2)');
testCodegen('move.l $10(pc), d0'                , 'MOVE.L([PC, 16], D0)');
testCodegen('move.b 1(pc,d0), d1'               , 'MOVE.B([PC, D0, 1], D1)');
testCodegen('move.w #blah, addr'                , 'MOVE.W(blah, [addr])');
