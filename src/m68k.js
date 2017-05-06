const { BitvalN, constN } = require('./bitvaln')

//
// Utils
//

const MAX_INSTRUCTION_LENGTH = 16;

function rightpad(str, len) {
    return (str + new Array(len).join(' ')).substring(0, len);
};

//
// State
//

let state = {
    quiet           : true,
    all_registers   : new Array(),
    writeline       : console.log,
};
state.make_register = function(name) {
    if (this.all_registers.indexOf(name) === -1) {
        state[name] = new BitvalN(32);
        this.all_registers.push(name);
    }
    return name;
};
state.log = function(msg) {
    if (this.quiet) return;
    this.writeline(msg);
};
state.print = function(regs) {
    if (typeof regs === 'undefined') {
        regs = this.all_registers;
    }
    regs.forEach(function(key) {
        this.log('\t; ' + key + ' = ' + this[key]);
    }, this);
};
state.reset = function() {
    this.log('\n\n');
    this.all_registers.forEach(function(reg) {
        this[reg] = new BitvalN(32);
    }, this);
};

function get_size_postfix(size) {
    if (size === 32) {
        return'.L';
    } else if (size == 16) {
        return '.W';
    } else if (size == 8) {
        return '.B';
    } else {
        throw new Error('Invalid operation size ' + size);
    }
}

state.do_unary_op = function(name, size, dst, f) {
    let sizestr = '';
    if (typeof size === 'undefined') {
        state[dst] = f(state[dst]);
    } else {
        sizestr = get_size_postfix(size);
        state[dst] = state[dst].set(f(state[dst].get(size)));
    }
    this.log('\t' + name + sizestr + '\t' + rightpad(dst, MAX_INSTRUCTION_LENGTH) + '\t; ' + dst + ' = ' + state[dst]);
};

state.do_binary_op = function(name, size, src, dst, f) {
    let srctext = '';
    let sizestr = '';
    if (typeof size === 'undefined') {
       size = 32;
    } else {
       sizestr = get_size_postfix(size);
    }

    if (typeof src === 'number') {
        srctext = '#$'+ src.toString(16);
        src     = BitvalN.constN(size, src);
    } else if (state.all_registers.indexOf(src) !== -1) {
        srctext = src;
        src     = state[src].get(size);
    } else {
        srctext = '#magic';
        src     = BitvalN.constN(size, 0).set(BitvalN.named(src));
    }

    state[dst] = state[dst].set(f(src, state[dst].get(size)));
    this.log('\t' + name + sizestr + '\t' + rightpad(srctext + ', ' + dst, MAX_INSTRUCTION_LENGTH) + '\t; ' + dst + ' = ' + state[dst]);
};

function make_normal_unary_op(name, f) {
    var func = function(dst) { state.do_unary_op(name, 16, dst, f); };
    func.B = function(dst) { state.do_unary_op(name, 8, dst, f); };
    func.W = func;
    func.L = function(dst) { state.do_unary_op(name, 32, dst, f); };
    return func;
}

function make_normal_binary_op(name, f) {
    var func = function(src, dst) { state.do_binary_op(name, 16, src, dst, f); };
    func.B = function(src, dst) { state.do_binary_op(name, 8, src, dst, f); };
    func.W = func;
    func.L = function(src, dst) { state.do_binary_op(name, 32, src, dst, f); };
    return func;
};

//
// State and helpers
//

exports.state   = state;

exports.const8  = function(val) { return BitvalN.constN(8, val); };
exports.const16 = function(val) { return BitvalN.constN(16, val); };
exports.const32 = function(val) { return BitvalN.constN(32, val); };

//
// Instructions
//
exports.MOVE  = make_normal_binary_op('MOVE', function(src, dst){ return src; });
exports.MOVEQ = function(src, dst) {
    if (typeof src !== 'number' || src < -128 || src > 127) {
        throw new Error('Invalid source operand for MOVEQ: ' + src);
    }
    state.do_binary_op('MOVEQ', undefined, src, dst, function (s, d) { return BitvalN.constN(8, src).sign_extend(32); });
};
exports.OR    = make_normal_binary_op('OR',   function(src, dst){ return dst.or(src); });
exports.AND   = make_normal_binary_op('AND',  function(src, dst){ return dst.and(src); });
exports.EOR   = make_normal_binary_op('EOR',  function(src, dst){ return dst.xor(src); });
exports.ADD   = make_normal_binary_op('ADD',  function(src, dst){ return dst.add(src); });
exports.SUB   = make_normal_binary_op('SUB',  function(src, dst){ return dst.add(src.xor(BitvalN.constN(src.nbits(),0xFFFFFFFF)).add(BitvalN.constN(src.nbits(),1))); });
exports.LSR   = make_normal_binary_op('LSR',  function(src, dst){ return dst.lsr(src); });
exports.LSL   = make_normal_binary_op('LSL',  function(src, dst){ return dst.lsl(src); });
exports.ROR   = make_normal_binary_op('ROR',  function(src, dst){ return dst.ror(src); });
exports.ROL   = make_normal_binary_op('ROL',  function(src, dst){ return dst.rol(src); });
exports.SWAP  = function(dst) { return state.do_unary_op('SWAP', undefined, dst, function(dst) { return dst.rotate(16); }); };
exports.NOT   = make_normal_unary_op('NOT', function(dst) { return dst.xor(BitvalN.constN(dst.nbits(),0xFFFFFFFF)); });
exports.NEG   = make_normal_unary_op('NEG', function(dst) { return dst.xor(BitvalN.constN(dst.nbits(),0xFFFFFFFF)).add(BitvalN.constN(dst.nbits(),1)); });

//
// Registers
//
exports.D0 = state.make_register('D0');
exports.D1 = state.make_register('D1');
exports.D2 = state.make_register('D2');
exports.D3 = state.make_register('D3');
exports.D4 = state.make_register('D4');
exports.D5 = state.make_register('D5');
exports.D6 = state.make_register('D6');
exports.D7 = state.make_register('D7');
