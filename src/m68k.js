const { BitvalN, constN } = require('./bitvaln')

//
// Utils
//

const MAX_INSTRUCTION_LENGTH = 16;

function rightpad(str, len) {
    return (str + new Array(len).join(' ')).substring(0, len);
};

function nth_name(l) {
    if (l >= 26) return String.fromCharCode(65 + (l-26));
    return String.fromCharCode(97 + l);
};

function defaultbits(l) {
    let n = '';
    for (i = 31; i >= 0; --i) {
        n += nth_name(l+3-Math.floor(i/8))+(i%8).toString(10);
    }
    return BitvalN.named(n);
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
    this.all_registers.forEach(function(reg) {
        if (reg[0] == 'D') {
            this[reg] = defaultbits(parseInt(reg[1],10)*4);
        } else {
            this[reg] = new BitvalN(32);
        }
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

state.log_instruction = function(name, sizestr, operands, result) {
    if (typeof result === 'undefined') {
        result = '';
    } else {
        result = '\t; ' + result;
    }
    this.log('\t' + name + sizestr + '\t' + rightpad(operands, MAX_INSTRUCTION_LENGTH) + result);
};

state.do_unary_op = function(name, size, dst, f) {
    let sizestr = '';
    if (typeof size === 'undefined') {
        state[dst] = f(state[dst]);
    } else {
        sizestr = get_size_postfix(size);
        state[dst] = state[dst].set(f(state[dst].get(size)));
    }
    this.log_instruction(name, sizestr, dst, dst + ' = ' + state[dst]);
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
    this.log_instruction(name, sizestr, srctext + ', ' + dst, dst + ' = ' + state[dst]);
};

function make_normal_unary_op(name, f) {
    var func = function(dst) { state.do_unary_op(name, 16, dst, f); };
    func.B = function(dst) { state.do_unary_op(name, 8, dst, f); };
    func.W = func;
    func.L = function(dst) { state.do_unary_op(name, 32, dst, f); };
    exports[name] = func;
    return func;
}

function make_normal_binary_op(name, f, src_check) {
    var func = function(src, dst) {
        if (src_check) src_check(name, src);
        state.do_binary_op(name, 16, src, dst, f);
    };
    func.B = function(src, dst) {
        if (src_check) src_check(name, src);
        state.do_binary_op(name, 8, src, dst, f);
    };
    func.W = func;
    func.L = function(src, dst) {
        if (src_check) src_check(name, src);
        state.do_binary_op(name, 32, src, dst, f);
    };
    exports[name] = func;
    return func;
};

function check_immediate(name, val, min_allowed, max_allowed) {
    if (typeof val !== 'number' || val < min_allowed || val > max_allowed) {
        throw new Error('Immediate out of range (' + min_allowed + ' - ' + max_allowed + ') for '+ name + ': ' + val);
    }
};

function check_small_arg(name, val) {
    if (typeof val === 'number') {
        // immediate
        check_immediate(name, val, 1, 8);
    } else if (state.all_registers.indexOf(val) !== -1) {
        // register OK
    } else {
        throw new Error('Invalid argument to ' + name + ': ' + val);
    }
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
make_normal_binary_op('MOVE', function(src, dst){ return src; });
make_normal_binary_op('OR',   function(src, dst){ return dst.or(src); });
make_normal_binary_op('AND',  function(src, dst){ return dst.and(src); });
make_normal_binary_op('EOR',  function(src, dst){ return dst.xor(src); });
make_normal_binary_op('ADD',  function(src, dst){ return dst.add(src); });
make_normal_binary_op('SUB',  function(src, dst){ return dst.sub(src); });
make_normal_binary_op('ADDQ', function(src, dst){ return dst.add(src); }, check_small_arg);
make_normal_binary_op('SUBQ', function(src, dst){ return dst.sub(src); }, check_small_arg);
make_normal_binary_op('LSR',  function(src, dst){ return dst.lsr(src.get(6)); }, check_small_arg);
make_normal_binary_op('LSL',  function(src, dst){ return dst.lsl(src.get(6)); }, check_small_arg);
make_normal_binary_op('ASR',  function(src, dst){ return dst.asr(src.get(6)); }, check_small_arg);
make_normal_binary_op('ASL',  function(src, dst){ return dst.asl(src.get(6)); }, check_small_arg);
make_normal_binary_op('ROR',  function(src, dst){ return dst.ror(src.get(6)); }, check_small_arg);
make_normal_binary_op('ROL',  function(src, dst){ return dst.rol(src.get(6)); }, check_small_arg);
make_normal_unary_op('NOT', function(dst) { return dst.not(); });
make_normal_unary_op('NEG', function(dst) { return dst.neg(); });
make_normal_unary_op('CLR', function(dst) { return BitvalN.constN(dst.nbits(), 0); });
make_normal_unary_op('EXT', function(dst) { return dst.get(dst.nbits()/2).sign_extend(dst.nbits()); });
delete exports.EXT.B; // EXT.B is not legal

// Instructions that require special handling

exports.MOVEQ = function(src, dst) {
    check_immediate('MOVEQ', src, -128, 127);
    state.do_binary_op('MOVEQ', undefined, src, dst, function (s, d) { return BitvalN.constN(8, src).sign_extend(32); });
};
exports.MOVEQ.L = exports.MOVEQ;

exports.SWAP  = function(dst) { return state.do_unary_op('SWAP', undefined, dst, function(dst) { return dst.rotate(16); }); };
exports.SWAP.W = exports.SWAP;

exports.EXG = function(src, dst) {
    let a = state[src];
    if (!(a instanceof BitvalN)) throw new Error('Invalid operand to EXG: ' + src);
    let b = state[dst];
    if (!(b instanceof BitvalN)) throw new Error('Invalid operand to EXG: ' + dst);
    state[src] = b;
    state[dst] = a;
    state.log_instruction('EXG', '', src + ', ' + dst);
};
exports.EXG.L = exports.EXG;

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
state.reset();
