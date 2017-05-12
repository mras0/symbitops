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
    mem             : new Array(),
};
state.find_register = function(name) {
    return this.all_registers.indexOf(''+name);
};
state.make_register = function(name) {
    if (this.find_register(name) === -1) {
        state[name] = new BitvalN(32);
        this.all_registers.push(name);
    }
    if (name[0] === 'D') {
        return {
            toString: function() { return name; },
            W:        name,
            L:        name + '.L',
        };
    } else {
        return name;
    }
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
        } else if (reg[0] == 'A') {
            this[reg] = BitvalN.constN(32, 0);
        } else {
            this[reg] = new BitvalN(32);
        }
    }, this);
    this.mem = new Array();
};

function get_size_postfix(size) {
    if (size === 32) {
        return'.L';
    } else if (size == 16) {
        return '.W';
    } else if (size == 8) {
        return '.B';
    } else if (typeof size === 'undefined') {
        return '';
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

state.access_mem = function(size, addr, val) {
    let a  = addr.real_value();
    let as = typeof a === 'undefined' ? addr.toString() : '$' + a.toString(16);

    if (size > 8 && addr.get(1).real_value() == 1) {
        throw new Error((typeof val === 'undefined' ? 'Read' : 'Write') + ' of size ' + size + ' to known odd address ' + as);
    }

    if (typeof val === 'undefined') {
        if (typeof a !== 'undefined') {
            let s = this;
            let warned = false;
            function readmem(a) {
                if (typeof s.mem[a] === 'undefined') {
                    if (!warned) {
                        s.log('Read of size ' + size + ' from unintialized memory at ' + a);
                        warned = true;
                    }
                    return new BitvalN(8);
                } else {
                    return s.mem[a];
                }
            };
            if (size === 32) {
                return const32(0).set(readmem(a)).lsl(8).set(readmem(a+1)).lsl(8).set(readmem(a+2)).lsl(8).set(readmem(a+3));
            } else if (size == 16) {
                return const16(0).set(readmem(a)).lsl(8).set(readmem(a+1));
            } else {
                return readmem(a);
            }
        }
        this.log('Read of size '+size+' from ' + as + ' returning undefined');
        return new BitvalN(size);
    } else if (val instanceof BitvalN) {
        if (typeof a !== 'undefined') {
            if (size === 32) {
                this.mem[a]   = val.lsr(24).get(8);
                this.mem[a+1] = val.lsr(16).get(8);
                this.mem[a+2] = val.lsr(8).get(8);
                this.mem[a+3] = val.get(8);
                return;
            } else if (size === 16) {
                this.mem[a] = val.lsr(8).get(8);
                this.mem[a+1] = val.get(8);
            } else {
                this.mem[a] = val;
            }
            return;
        }
        this.log('Ignoring write of size '+size+' to ' + as + ' (value: ' + val + ')');
    } else {
        throw new Error('Invalid argument to mem: ' + val);
    }
};

state.calc_ea = function(name, size) {
    if (name[0][0] !== 'A') throw new Error('Invalid address: [' + name.join() + ']');
    let addr   = this[name[0]];
    if (name.length >= 2) {
        if (name[1][0] === '+') {
            if (typeof size !== 'number') throw new Error('Invalid size in calc_ea([' + name.join() + ']: ' + size);
            this[name[0]] = this[name[0]].add(const32(size/8));
        } else if (name[1][0] === '-') {
            if (typeof size !== 'number') throw new Error('Invalid size in calc_ea([' + name.join() + ']: ' + size);
            this[name[0]] = this[name[0]].sub(const32(size/8));
            addr = this[name[0]];
        } else if (typeof name[1] === 'number') {
            addr = addr.add(BitvalN.constN(32, name[1]));
        } else {
            let o = name[1]+'';
            if (o.slice(-2) === '.L') {
                addr = addr.add(this[o.slice(0,2)]);
            } else {
                addr = addr.add(this[o].get(16).sign_extend(32));
            }
            if (typeof(name[2]) === 'number') {
                addr = addr.add(BitvalN.constN(32, name[2]));
            }
        }
    }
    return addr;
};

state.do_ea = function(size, name) {
    let s = this;
    if (name.constructor === Array && name.length >= 1 && name.length <= 3) {
        let addr = this.calc_ea(name, size);
        return function(val) { return s.access_mem(size, addr, val); };
    }

    if (typeof name !== 'string' && typeof name.W !== 'string') {
        throw new Error('Not implemented: get_ea('+JSON.stringify(name)+')');
    }
    return function(val) {
        if (typeof val === 'undefined') {
            return s[name].get(size);
        } else if (val instanceof BitvalN) {
            if (size != val.nbits()) throw new Error('Internal error: ' + size + ' != ' + val.nbits());
            s[name] = s[name].set(val);
        } else {
            throw new Error('Invalid argument to ea(' + name + '): ' + val);
        }
    };
};

function format_ea(ea) {
    if (ea.constructor !== Array) return ea;
    if (ea.length === 1) return '(' + ea[0] + ')';
    if (ea[1] === '+') return '(' + ea[0] + ')+';
    if (ea[1] === '-') return '-(' + ea[0] + ')';
    return '(' + ea[0] + ',' + ea[1] + ')';
};

function format_res(dst, res) {
    return typeof(dst)==='string' ? state[dst] : res;
};

state.do_unary_op = function(name, size, dst, f) {
    let sizestr = '';
    if (typeof size === 'undefined') {
       size = 32;
    } else {
       sizestr = get_size_postfix(size);
    }
    let dst_ea  = this.do_ea(size, dst);
    let dst_str = format_ea(dst);
    let res     = f(dst_ea);
    if (!(res instanceof BitvalN)) {
        throw new Error('Internal error: ' + name + sizestr + ' ' + dst_str + ' returned undefined!');
    }
    dst_ea(res);
    this.log_instruction(name, sizestr, dst_str, dst_str + ' = ' + format_res(dst, res));
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
    } else if (this.find_register(src) !== -1 || src.constructor === Array) {
        srctext = format_ea(src);
        src     = this.do_ea(size, src)();
    } else {
        srctext = '#magic';
        src     = BitvalN.constN(size, 0).set(BitvalN.named(src));
    }
    let dst_ea  = this.do_ea(size, dst);
    let dst_str = format_ea(dst);
    let res = f(src, dst_ea);
    if (!(res instanceof BitvalN)) {
        throw new Error('Internal error: ' + name + sizestr + ' ' + srctext + ', ' + dst_str + ' returned undefined!');
    }
    dst_ea(res);
    this.log_instruction(name, sizestr, srctext + ', ' + dst_str, dst_str + ' = ' + format_res(dst, res));
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
    } else if (state.find_register(val) !== -1) {
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
make_normal_binary_op('OR',   function(src, dst){ return dst().or(src); });
make_normal_binary_op('AND',  function(src, dst){ return dst().and(src); });
make_normal_binary_op('EOR',  function(src, dst){ return dst().xor(src); });
make_normal_binary_op('ADD',  function(src, dst){ return dst().add(src); });
make_normal_binary_op('SUB',  function(src, dst){ return dst().sub(src); });
make_normal_binary_op('ADDQ', function(src, dst){ return dst().add(src); }, check_small_arg);
make_normal_binary_op('SUBQ', function(src, dst){ return dst().sub(src); }, check_small_arg);
make_normal_binary_op('LSR',  function(src, dst){ return dst().lsr(src.get(6)); }, check_small_arg);
make_normal_binary_op('LSL',  function(src, dst){ return dst().lsl(src.get(6)); }, check_small_arg);
make_normal_binary_op('ASR',  function(src, dst){ return dst().asr(src.get(6)); }, check_small_arg);
make_normal_binary_op('ASL',  function(src, dst){ return dst().asl(src.get(6)); }, check_small_arg);
make_normal_binary_op('ROR',  function(src, dst){ return dst().ror(src.get(6)); }, check_small_arg);
make_normal_binary_op('ROL',  function(src, dst){ return dst().rol(src.get(6)); }, check_small_arg);
make_normal_unary_op('NOT', function(dst) { return dst().not(); });
make_normal_unary_op('NEG', function(dst) { return dst().neg(); });
make_normal_unary_op('CLR', function(dst) { dst = dst(); return BitvalN.constN(dst.nbits(), 0); });
make_normal_unary_op('EXT', function(dst) { dst = dst(); return dst.get(dst.nbits()/2).sign_extend(dst.nbits()); });
delete exports.EXT.B; // EXT.B is not legal

// Instructions that require special handling

exports.MOVEQ = function(src, dst) {
    check_immediate('MOVEQ', src, -128, 127);
    state.do_binary_op('MOVEQ', undefined, src, dst, function (s, d) { return BitvalN.constN(8, src).sign_extend(32); });
};
exports.MOVEQ.L = exports.MOVEQ;

exports.SWAP  = function(dst) { return state.do_unary_op('SWAP', undefined, dst, function(dst) { return dst().rotate(16); }); };
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

exports.LEA = function(src, dst) {
    state[dst] = state.calc_ea(src);
    state.log_instruction('LEA', '', format_ea(src) + ', ' + dst, dst + ' = ' + state[dst]);
};
exports.LEA.L = exports.LEA;

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
exports.A0 = state.make_register('A0');
exports.A1 = state.make_register('A1');
exports.A2 = state.make_register('A2');
exports.A3 = state.make_register('A3');
exports.A4 = state.make_register('A4');
exports.A5 = state.make_register('A5');
exports.A6 = state.make_register('A6');
exports.A7 = state.make_register('A7');
state.reset();
