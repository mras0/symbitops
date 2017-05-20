// TODO:
//          Labels (to allow real instruction encoding)
//          Code for register lists

const assert = require('assert');

const re_comment_str      = '^\\s*([*;].*)$';
const re_symbol_str       = '[A-Za-z.][0-9A-Za-z.$_]*';
const re_label_str        = '^(' + re_symbol_str + '(?::)?)\\s*|^\\s*(' + re_symbol_str + ':)\\s*';
const re_size_postfix     = '(?:\\.[bBwWlLsS])?';
const re_operation_str    = '^\\s*([A-Za-z][0-9A-Za-z]*'+re_size_postfix+')';
const re_operand_sep_str  = '^(\\s*,\\s*)';
const re_anyreg_str       = '(?:[dD][0-7]|[aA][0-7])';
const re_reginterval_str  = '(?:' + re_anyreg_str + '-' + re_anyreg_str + ')';
const re_reglist_atom_str = '(?:' + re_reginterval_str + '|' + re_anyreg_str + ')';
const re_reglist_str      = re_reglist_atom_str + '(?:/'+re_reglist_atom_str+')*';
const re_comment          = new RegExp(re_comment_str);
const re_label            = new RegExp(re_label_str);
const re_operation        = new RegExp(re_operation_str);
const re_operand_sep      = new RegExp(re_operand_sep_str);
const re_reglist          = new RegExp('^('+re_reglist_str+')');

function try_parse(line, re) {
    let m = re.exec(line);
    if (m) {
        // Hack... find matching group
        var matched_val = undefined;
        for (let i = 1; i < m.length; ++i) {
            if (typeof m[i] === 'undefined') continue;
            if (typeof matched_val !== 'undefined') throw new Error('Internal error with match object ' + m);
            matched_val = m[i];
        }
        if (typeof matched_val === 'undefined') throw new Error('Internal error with match object ' + m);
        return [line.slice(m.index+m[0].length), matched_val];
    }
    return [line, undefined];
};

function must_parse(line, re) {
    let res = try_parse(line, re);
    if (!res[1]) throw new Error('Could not match "' + re + '" with "' + line + '"');
    return res;
};

const condition_codes = [
   'T',  // %0000 True                1
   'F',  // %0001 False               0
   'HI', // %0010 High                (not C) and (not Z)
   'LS', // %0011 Low or Same         C or V
   'CC', // %0100 Carray Clear (HI)   not C
   'CS', // %0101 Carry Set (LO)      C
   'NE', // %0110 Not Equal           not Z
   'EQ', // %0111 Equal               Z
   'VC', // %1000 Overflow Clear      not V
   'VS', // %1001 Overflow Set        V
   'PL', // %1010 Plus                not N
   'MI', // %1011 Minus               N
   'GE', // %1100 Greater or Equal    (N and V) or ((not N) and (not V))
   'LT', // %1101 Less Than           (N and (not V)) or ((not N) and V))
   'GT', // %1110 Greater Than        (N and V and (not Z)) or ((not N) and (not V) and (not Z))
   'LE', // %1111 Less or Equal       Z or (N and (not V)) or ((not N) and V)
];

function op_size_bits(size) {
    if (size === 'L') return 0b10;
    if (size === 'W') return 0b01;
    if (size === 'B') return 0b00;
    throw new Error('Invalid operand size ' + size);
}

const OP_DREG      = 0x0001; // Dn
const OP_AREG      = 0x0002; // An
const OP_INDIRECT  = 0x0004; // (An)
const OP_POSTINCR  = 0x0008; // (An)+
const OP_PREINCR   = 0x0010; // -(An)
const OP_DISP16    = 0x0020; // d16(An)
const OP_INDEX     = 0x0040; // d8(An,ix)
const OP_ABSW      = 0x0080; // xxx.W
const OP_ABSL      = 0x0100; // xxx.L
const OP_DISP16PC  = 0x0200; // d16(PC)
const OP_INDEXPC   = 0x0400; // d8(PC,ix)
const OP_IMMEDIATE = 0x0800; // #immediate
const OP_REGLIST   = 0x1000; // register list (for MOVEM)
const OP_EA        = 0x07FC; // All except immediate/areg/dreg

function op_type_str(type) {
    let s = [];
    if (type & OP_DREG      ) s.push('DREG');
    if (type & OP_AREG      ) s.push('AREG');
    if (type & OP_INDIRECT  ) s.push('INDIRECT');
    if (type & OP_POSTINCR  ) s.push('POSTINCR');
    if (type & OP_PREINCR   ) s.push('PREINCR');
    if (type & OP_DISP16    ) s.push('DISP16');
    if (type & OP_INDEX     ) s.push('INDEX');
    if (type & OP_ABSW      ) s.push('ABSW');
    if (type & OP_ABSL      ) s.push('ABSL');
    if (type & OP_DISP16PC  ) s.push('DISP16PC');
    if (type & OP_INDEXPC   ) s.push('INDEXPC');
    if (type & OP_IMMEDIATE ) s.push('IMMEDIATE');
    if (type & OP_REGLIST   ) s.push('REGLIST');
    if (s.length == 0) { return 'Unknown<'+type+'>'; }
    return s.join('|');
};

function parse_reglist(reglist) {
    let regs = [];
    reglist.toUpperCase().split('/').forEach(function (r) {
        let split = r.indexOf('-');
        if (split === -1) {
            regs.push(r);
        } else {
            let f  = r.substring(0, split);
            let fi = f[1]-'0';
            let l  = r.substring(split+1);
            let li = l[1]-'0';
            if (f[0] === l[0] && fi < li) {
                for (let i = fi; i <= li; ++i) {
                    regs.push(l[0] + i.toString());
                }
            } else if (f[0] === 'D' && l[0] === 'A') {
                for (let i = fi; i <= 7; ++i) {
                    regs.push('D' + i.toString());
                }
                for (let i = 0; i <= li; ++i) {
                    regs.push('A' + i.toString());
                }
            } else {
                throw new Error('Unsupport register range "' + f + '" to "' + l + '"');
            }
        }
    });
    return regs;
}

class Expr {
    precedence() {
        return -1;
    }
};

class LitExpr extends Expr {
    constructor(val) {
        if (typeof(val) !== 'number') throw new Error('Invalid literal "' + val + '"');
        super();
        this.val = val;
    }

    toString() {
        return this.val.toString(10);
    }

    value() {
        return this.val;
    }
};

class SymExpr extends Expr {
    constructor(val) {
        if (typeof(val) !== 'string') throw new Error('Invalid symbol "' + val + '"');
        super();
        this.val = val;
    }

    toString() {
        return this.val;
    }

    value() {
        return this.val;
    }
};

class NegExpr extends Expr {
    constructor(e) {
        super();
        this.e = e;
    }

    toString() {
        return '-'+this.e.toString();
    }

    value() {
        return -this.e.value();
    }
};

operator_finished = {
    precedence: 1000,
    calc:       undefined,
};

operators = {
    // 5
    '*': {
        precedence: 5,
        calc:       function(l,r) { return l * r; },
    },
    '/': {
        precedence: 5,
        calc:       function(l,r) { return l / r; },
    },
    // 6
    '+': {
        precedence: 6,
        calc:       function(l,r) { return l + r; },
    },
    '-': {
        precedence: 6,
        calc:       function(l,r) { return l - r; },
    },
    //  7: <<, >>
    //  8: <, <=, >=, >
    //  9: =, <>
    // 10: &
    // 11: ^
    // 12: | / !
    // 13: &&
    // 14: ||
};


class BinExpr extends Expr {
    constructor(op, l, r) {
        super();
        this.op = op;
        this.l  = l;
        this.r  = r;
    }

    precedence() {
        return operators[this.op].precedence;
    }

    toString() {
        let l = this.l.toString();
        let r = this.r.toString();
        if (this.l.precedence() > this.precedence()) l = '('+l+')';
        if (this.r.precedence() > this.precedence()) r = '('+r+')';
        return l+this.op+r;
    }

    value() {
        return operators[this.op].calc(this.l.value(), this.r.value());
    }
};

function skip_leading_space(line) {
    return line.replace(/^\s+/,'');
};

function parse_primary(line) {
    let l, e;
    if (line[0] === '-') {
        [l, e] = parse_primary(line.substring(1));
        return [l, new NegExpr(e)];
    } else if (line[0] === '(') {
        [l, e] = parse_expr(line.substring(1));
        l = skip_leading_space(l);
        if (l[0] !== ')') {
            throw new Error('Missing ")" in "' + line + '"');
        }
        return [l.substring(1), e];
    }

    [l, e] = try_parse(line, new RegExp('^\\$([0-9a-fA-F]+)'));
    if (e) {
        return [l, new LitExpr(parseInt(e, 16))];
    }
    [l, e] = try_parse(line, new RegExp('^([0-9]+)'));
    if (e) {
        return [l, new LitExpr(parseInt(e, 10))];
    }
    [l, e] = try_parse(line, new RegExp('^(' + re_symbol_str + ')'));
    if (e) {
        return [l, new SymExpr(e)];
    }
    throw new Error('Not implemented parse_expr("'+ line + '"');
}

function parse_expr1(line, lhs, max_precedence) {
    const origline = line;

    function is_end_of_expr(l) {
        return !l.length || '();,'.indexOf(l[0]) !== -1;
    };

    for (;;) {
        line = skip_leading_space(line);
        if (is_end_of_expr(line)) break;
        const op = line[0];
        if (!operators[op]) {
            throw new Error('Invalid operator "' + op + '" in "' + origline + '"');
        }
        if (operators[op].precedence > max_precedence) {
            break;
        }
        line = skip_leading_space(line.substring(1));
        let rhs;
        [line, rhs] = parse_primary(line);
        for (;;) {
            line = skip_leading_space(line);
            if (is_end_of_expr(line)) {
                break;
            }
            const lookahead_op = line[0];
            if (!operators[lookahead_op]) {
                throw new Error('Invalid operator "' + lookahead_op + '" in "' + origline + '"');
            }
            if (operators[lookahead_op].precedence >= operators[op].precedence) break;
            [line, rhs] = parse_expr1(line, rhs, operators[lookahead_op].precedence);
        }
        lhs = new BinExpr(op, lhs, rhs);
    }
    return [line, lhs];
};

function parse_expr(line) {
    let lhs;
    line = skip_leading_space(line);
    [line, lhs] = parse_primary(line);
    return parse_expr1(line, lhs, 255);
};

function reglist_to_mask(l) {
    let mask = 0;
    parse_reglist(l).forEach(function (r) {
        let i = parseInt(r[1]);
        if (r[0] === 'D') {
            mask |= 1 << i;
        } else {
            assert.equal(r[0], 'A');
            mask |= 1 << (i+8);
        }
    });
    return mask;
};

function count_set_bits(mask) {
    let c = 0;
    for (; mask; mask>>=1) {
        c += mask&1;
    }
    return c;
};

function reverse_mask(mask) {
    let r = 0;
    for (let i = 0; i < 16; ++i) {
        if ((mask>>i)&1) {
            r |= 1<<(15-i);
        }
    }
    return r;
};

function reglist_string(m) {
    const names = ['D0','D1','D2','D3','D4','D5','D6','D7','A0','A1','A2','A3','A4','A5','A6','A7'];
    let last = -1;
    let r = '';
    for (let b = 0; b < 15; ++b) {
        if (m & (1<<b)) {
            if (last === -1) {
                last = b;
            }
        } else if (last !== -1) {
            if (r.length) r += '/';
            r += names[last];
            if (b-last>1) {
                r += '-' + names[b-1];
            }
            last = - 1;
        }
    }
    assert.equal(last, -1); // handle a7 being part of run some day
    return r;
};

BASE_COST=4

class Operand {
    constructor(type, val) {
        if (typeof(type) !== 'number' || type === 0 || (type&(type-1)) !== 0) {
            throw new Error('Invalid operand type ' + op_type_str(type));
        }
        this.type = type;
        this.val  = val;
    }

    toString() {
        switch (this.type) {
            case OP_DREG:       return 'D'+this.val;
            case OP_AREG:       return 'A'+this.val;
            case OP_INDIRECT:   return '(A'+this.val+')';
            case OP_POSTINCR:   return '(A'+this.val+')+';
            case OP_PREINCR:    return '-(A'+this.val+')';
            case OP_DISP16:     return this.val[0]+'(A'+this.val[1]+')';
            case OP_INDEX:      return this.val[0]+'(A'+this.val[1]+',D'+this.val[2]+')';
            case OP_ABSW:
            case OP_ABSL:       return this.val.toString();
            case OP_DISP16PC:   return this.val[0]+'(PC)';
            case OP_INDEXPC:    return this.val[0]+'(PC,D'+this.val[1]+')';
            case OP_IMMEDIATE:  return '#'+this.val.toString();
            case OP_REGLIST:    return reglist_string(this.val);
        }
        throw new Error('Operand.toString not implemented for ' + op_type_str(this.type));
    }

    cost(size) {
        switch (this.type) {
        case OP_DREG:
        case OP_AREG:       return 0;
        case OP_INDIRECT:
        case OP_POSTINCR:   return size === 'L' ? 8 : 4;
        case OP_PREINCR:    return size === 'L' ? 10 : 6;
        case OP_DISP16PC:
        case OP_DISP16:     return size === 'L' ? 12 : 8;
        case OP_INDEXPC:
        case OP_INDEX:      return size === 'L' ? 14 : 10;
        case OP_ABSW:       return size === 'L' ? 12 : 8;
        case OP_ABSL:       return size === 'L' ? 16 : 12;
        case OP_IMMEDIATE:  return size === 'L' ? 2*BASE_COST : BASE_COST;
        }
        throw new Error('Operand.cost not implemented for ' + op_type_str(this.type) + ' size ' + size);
    }

    // returns [mode, reg, extra words...]
    encoding(size) {
        assert(size==='L'||size==='W'||size==='B','size="'+size+'"');
        // Extension word 15:D/A | 12:REGISTER{2..0} | 11:W/L | 8:0{2..0} | 0:Displacement{7..0}
        switch (this.type) {
            case OP_DREG:       return [0b000, this.val];
            case OP_AREG:       return [0b001, this.val];
            case OP_INDIRECT:   return [0b010, this.val];
            case OP_POSTINCR:   return [0b011, this.val];
            case OP_PREINCR:    return [0b100, this.val];
            case OP_DISP16:     return [0b101, this.val[1], this.val[0].value()&0xffff];
            case OP_INDEX:      return [0b110, this.val[1], this.val[2]<<12|(this.val[0].value()&0xff)];
            case OP_ABSW:       break;
            case OP_ABSL:       {
                let val = this.val.value();
                return [0b111, 0b001, (val>>16)&0xfffff, val&0xffff];
            }
            case OP_DISP16PC:   return [0b111, 0b010, (this.val[0].value()-2)&0xffff];
            case OP_INDEXPC:    return [0b111, 0b011, this.val[1]<<12|((this.val[0].value()-2)&0xff)];
            case OP_IMMEDIATE:  {
                let val = this.val.value();
                if (size === 'L') {
                    val = [(val>>16)&0xfffff, val&0xffff];
                } else if (size === 'W') {
                    val = [val&0xffff];
                } else {
                    val = [val&0xff];
                }
                return [0b111, 0b100].concat(val);
            }
            case OP_REGLIST:
                break;
        }
        throw new Error('Operand.encoding not implemented for ' + op_type_str(this.type));
    }

    immediate_value() {
        if (this.type !== OP_IMMEDIATE) {
            throw new Error('Operand.immediate_value not implemented for ' + op_type_str(this.type) + ' size ' + this.size);
        }
        return this.val.value();
    }

    static parse(line) {
        const origline = line;
        let l, p;
        function is_at_end(l) {
            return typeof (l) === 'undefined' || l.match(/^(\s|[,*;]|$)/);
        };

        // OP_IMMEDIATE
        if (line[0] === '#') {
            [l, p] = parse_expr(line.substring(1));
            return [l, new Operand(OP_IMMEDIATE, p)];
        }
        // OP_DREG
        if (is_at_end(line[2]) && (line[0] === 'd' || line[0] === 'D')) {
            return [line.substring(2), new Operand(OP_DREG, parseInt(line[1]))];
        }
        // OP_AREG
        if (is_at_end(line[2]) && (line[0] === 'a' || line[0] === 'A')) {
            return [line.substring(2), new Operand(OP_AREG, parseInt(line[1]))];
        }
        // OP_PREINCR
        [l, p] = try_parse(line, new RegExp('^-\\([aA]([0-7])\\)'));
        if (p) {
            return [l, new Operand(OP_PREINCR, parseInt(p))];
        }
        // OP_POSTINCR
        [l, p] = try_parse(line, new RegExp('^\\([aA]([0-7])\\)\\+'));
        if (p) {
            return [l, new Operand(OP_POSTINCR, parseInt(p))];
        }
        // OP_INDIRECT
        [l, p] = try_parse(line, new RegExp('^\\([aA]([0-7])\\)'));
        if (p) {
            return [l, new Operand(OP_INDIRECT, parseInt(p))];
        }
        // OP_REGLIST
        [l, p] = try_parse(line, re_reglist);
        if (p) {
            return [l, new Operand(OP_REGLIST, reglist_to_mask(p.toUpperCase()))];
        }

        // line should now match either offset-expr(aN,dN), offset-expr(aN) or (aN,dN)
        // in all cases parse_expr shouldn't be stop before reaching the (aN[,dN) part
        let offset=new LitExpr(0);
        try {
            [line, offset] = parse_expr(line);
            [line, p] = try_parse(line, /^(\s+)/);
            if (is_at_end(line)) {
                return [line, new Operand(OP_ABSL, offset)];
            }
        } catch (e) {
            // in the (aN,dN) case
        }
        let end_pos = line.indexOf(')');
        if (line[0] !== '(' || end_pos === -1) {
            throw new Error('Invalid operand ' + origline);
        }
        let indir = line.substring(1,end_pos);
        let args = indir.replace(/\s/g, '').toUpperCase().split(',');
        // Hack: handle PC as A8 here...
        let pcidx = args.indexOf('PC');
        if (pcidx !== -1) {
            args[pcidx] = 'A8';
        }
        args = args.sort();
        if (args.length < 1
            || args.length > 2
            || args[0].length !== 2
            || args[0][0] !== 'A'
            || (args.length > 2 && (args[1].length !== 2 || args[1].length !== 4) && args[1][0] !== 'D')) {
            console.log(offset);
            console.log(args);
            throw new Error('Invalid operand ' + origline);
        }
        line = line.substring(end_pos+1);
        let basereg = parseInt(args[0][1]);
        if (args.length === 1) {
            if (basereg === 8) {
                return [line, new Operand(OP_DISP16PC, [offset])];
            } else {
                return [line, new Operand(OP_DISP16, [offset, basereg])];
            }
        }
        assert.equal(args.length, 2);
        assert.equal(args[1][0], 'D');
        // TODO: Handle dN.w/dN.l - as optional arg in list (if .l)? Could be handled same as scale..
        let indexreg = parseInt(args[1][1]);
        if (basereg === 8) {
            return [line, new Operand(OP_INDEXPC, [offset, indexreg])];
        } else {
            return [line, new Operand(OP_INDEX, [offset, basereg, indexreg])];
        }
    };
};

function arit_cost(size, ops) {
    let cost = ops[0].cost(size) + ops[1].cost(size);
    if (size === 'L') {
        if ((ops[1].type === OP_DREG || ops[1].type === OP_AREG) && (ops[0].type & (OP_DREG|OP_AREG|OP_IMMEDIATE))) {
            cost += 8;
        } else {
            cost += 6;
        }
        return cost;
    } else {
        assert(size === 'W' || size === 'B');
        return cost + BASE_COST;
    }
    throw new Error('Not implemented. Size '+size+' '+ops.join(' ,'));
}

let standard_sizes = [ 'W', 'L', 'B' ];

function default_un_encoding(size, ops, opcode) {
    let ea = ops[0].encoding(size);
    return [opcode|op_size_bits(size)<<6|ea[0]<<3|ea[1]].concat(ea.slice(2));
};

function default_un_op(opcode) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_EA | OP_DREG ],
        cost: function (size, ops) {
            if (ops[0].type === OP_DREG || ops[0].type === OP_AREG) {
                return size === 'L' ? 6 : 4;
            } else {
                return (size === 'L' ? 12 : 8) + ops[0].cost(size);
            }
        },
        encode: function(size, ops) {
            return default_un_encoding(size, ops, opcode);
        },
    };
};

function default_bin_encoding(size, ops, normal_op, immediate_op) {
    let op = normal_op;
    let ea;
    let mode = op_size_bits(size);
    if (ops[0].type === OP_IMMEDIATE) {
        op = immediate_op;
        ea = ops[1].encoding(size);
        let imm = ops[0].immediate_value();
        if (size === 'L') ea.splice(2, 0, (imm>>16)&0xffff, imm&0xffff);
        else if (size === 'W') ea.splice(2, 0, imm&0xffff);
        else ea.splice(2, 0, imm&0xff);
    } else if (ops[1].type === OP_AREG) {
        mode = size === 'L' ? 0b111 : 0b011;
        op |= ops[1].val<<9;
        ea = ops[0].encoding(size);
    } else if (ops[1].type === OP_DREG && immediate_op !== 0x0a00) { // Special case for EOR...
        op |= ops[1].val<<9;
        ea = ops[0].encoding(size);
    } else {
        assert(ops[0].type === OP_DREG);
        op   |= ops[0].val<<9;
        mode |= 0b100;
        ea  = ops[1].encoding(size);
    }
    return [op|mode<<6|ea[0]<<3|ea[1]].concat(ea.slice(2));
};

function default_bin_op(normal_op, immediate_op) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG, OP_EA | OP_DREG ],
        cost: arit_cost,
        encode: function(size, ops) { return default_bin_encoding(size, ops, normal_op, immediate_op); },
    };
};

function add_sub_op(normal_op, immediate_op) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG | OP_AREG, OP_EA | OP_DREG | OP_AREG ],
        cost: function (size, ops) {
            var cost = arit_cost(size, ops);
            return (size !== 'L' && ops[1].type === OP_AREG) ? BASE_COST + cost : cost;
        },
        encode: function (size, ops) {
            return default_bin_encoding(size, ops, normal_op, immediate_op);
        },
    };
};

function add_sub_x_op(base_op) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_DREG, OP_DREG ],
        cost: function(size, ops) { return size === 'L' ? 2*BASE_COST : BASE_COST; },
        encode: function(size, ops) {
            const rm=0; // rm: 0=register/1=memory
            assert.equal(ops[0].type, OP_DREG);
            assert.equal(ops[1].type, OP_DREG);
            return [base_op|ops[1].val<<9|op_size_bits(size)<<6|ops[0].val];
        },
    };
};

function add_sub_q_op(is_sub) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE, OP_EA | OP_DREG | OP_AREG ],
        cost: function(size, ops) {
            var cost = ops[1].cost(size);
            if (size === 'L') {
                if (ops[1].type == OP_DREG || ops[1].type == OP_AREG) return 2*BASE_COST;
                return 3*BASE_COST + cost;
            } else {
                return ops[1].type == OP_DREG ? BASE_COST : 2*BASE_COST + cost;
            }
        },
        encode: function(size, ops) {
            let dst = ops[1].encoding(size);
            return [0x5000|(ops[0].val&7)<<9|is_sub<<8|op_size_bits(size)<<6|dst[0]<<3|dst[1]].concat(dst.slice(2));
        },
    };
};

function default_rot_op(base_op, dr) { // dr: 0=right/1=left
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_DREG, OP_EA | OP_DREG ],
        cost: function(size, ops) {
            let n = 1; // Assume shift of 1
            if (ops[0].type === OP_IMMEDIATE) {
                n = ops[0].immediate_value();
            }
            if (ops[1].type !== OP_DREG) {
                throw new Error('Not implemented ' + ops[1]);
            }
            return (size === 'L' ? 8 + 2 * n : 6 + 2 * n);
        },
        encode: function(size, ops) {
            const ir = ops[0].type !== OP_IMMEDIATE;
            assert.equal(ops[1].type, OP_DREG);
            return [base_op|((ir?ops[0].val:ops[0].immediate_value())&0x7)<<9|dr<<8|op_size_bits(size)<<6|ir<<5|ops[1].val];
        },
    };
};

function default_bit_op(opbits, bcost, lcost) {
    return {
        allowed_sizes: ['L','B'],
        operands: [OP_DREG|OP_IMMEDIATE, OP_EA|OP_DREG],
        cost: function(size, ops) {
            var dyn = ops[0].type === OP_IMMEDIATE;
            return ops[1].cost(size) + BASE_COST*dyn + (size === 'L' ? lcost : bcost);
        },
        handle_size: function(ops) {
            return (ops[1].type == OP_DREG) ? 'L' : 'B';
        },
        encode: function(size, ops) {
            let ea = ops[1].encoding(size);
            if (ops[0].type === OP_IMMEDIATE) {
                return [opbits|1<<11|ea[0]<<3|ea[1], ops[0].immediate_value()].concat(ea.slice(2));
            } else {
                assert(ops[0].type === OP_DREG);
                return [opbits|ops[0].val<<9|1<<8|ea[0]<<3|ea[1]].concat(ea.slice(2));
            }
        },
    };
};

function mul_div_op(baseop, maxcost) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG, OP_DREG ],
        cost: function(size, ops) {
            return maxcost + ops[0].cost(size) + ops[1].cost(size);
        },
        encode: function(size, ops) {
            assert.equal(size, 'W');
            assert.equal(ops[1].type, OP_DREG);
            let ea = ops[0].encoding(size);
            return [baseop|ops[1].val<<9|ea[0]<<3|ea[1]].concat(ea.slice(2));
        }
    };
};

function branch_op(cc_index) {
    return {
        allowed_sizes: ['W', 'B'], // Bcc.L is 020+ only
        operands: [ OP_ABSW | OP_ABSL ],
        cost: function(size, ops) {
            // .B -> 10 taken, 8 not taken
            // .W -> 10 taken, 12 not taken
            return 10;
        },
        encode: function(size, ops) {
            let op    = 0x6000 | cc_index<<8;
            let disp  = -2;
            return size === 'B' ? [op|(disp&0xff)] : [op, disp&0xffff];
        }
    };
};

let instruction_info = {
    // Data movement instructions
    'EXG' : {
        allowed_sizes: ['L'],
        operands: [ OP_DREG|OP_AREG, OP_DREG|OP_AREG],
        cost : function(size, ops) { return 6; },
        encode : function(size, ops) { return [0xc140|ops[0].val<<9|ops[1].val]; }
    },
    'MOVE'  : {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG | OP_AREG, OP_DREG | OP_AREG | OP_EA ],
        cost : function(size, ops) {
            if (ops[1].type === OP_PREINCR) { // HACK
                return (size === 'L' ? 12 : 8) + ops[0].cost(size);
            }
            return BASE_COST + ops[0].cost(size) + ops[1].cost(size);
        },
        encode: function(size, ops) {
            let src = ops[0].encoding(size);
            let dst = ops[1].encoding(size);
            let op = (size === 'L' ? 0x2000 : size === 'B' ? 0x1000 : 0x3000);
            return [op|dst[1]<<9|dst[0]<<6|src[0]<<3|src[1]].concat(src.slice(2)).concat(dst.slice(2));
        },
    },
    'MOVEQ' : {
        allowed_sizes: [ 'L' ],
        operands: [ OP_IMMEDIATE, OP_DREG ],
        cost: function(size, ops) { return BASE_COST; },
        encode: function(size, ops) { return [0x7000 | (ops[1].val<<9) | (ops[0].immediate_value()&0xff)]; },
    },
    'MOVEM' : {
        allowed_sizes: [ 'W', 'L' ],
        operands: [ OP_EA | OP_REGLIST, OP_EA | OP_REGLIST ],
        cost: function(size, ops) {
            let basecost = undefined;
            let nregs    = undefined;
            if (ops[0].type === OP_REGLIST) {
                // R --> M
                nregs = count_set_bits(ops[0].val);
                switch (ops[1].type) {
                    case OP_INDIRECT:
                    case OP_PREINCR:
                        basecost = 8;
                        break;
                }
            } else {
                // M --> R
                assert.equal(ops[1].type, OP_REGLIST);
                nregs = count_set_bits(ops[1].val);
                switch (ops[0].type) {
                    case OP_INDIRECT:
                    case OP_POSTINCR:
                        basecost = 12;
                        break;
                }
            }
            if (!basecost) throw new Error('cost not implemented for MOVEM.' + size + ' ' + ops[0] + ', ' + ops[1]);
            return basecost + nregs * (size === 'L' ? 8 : 4);
        },
        encode: function(size, ops) {
            let op   = 0x4880 | (size === 'L')<<6;
            let ea   = undefined;
            let mask = undefined;
            if (ops[0].type == OP_REGLIST) {
                // R --> M
                mask = reverse_mask(ops[0].val);
                ea   = ops[1].encoding(size);
            } else {
                // M --> R
                assert.equal(ops[1].type, OP_REGLIST);
                mask = ops[1].val;
                ea   = ops[0].encoding(size);
                op  |= 1<<10; // set dr
            }
            return [op|ea[0]<<3|ea[1], mask].concat(ea.slice(2));
        },
    },
    'LEA' : {
        allowed_sizes: [ 'L' ],
        operands: [ OP_EA, OP_AREG ],
        cost : function(size, ops) {
            let t = ops[0].type;
            switch (t) {
                case OP_INDIRECT: return 4;
                case OP_DISP16PC:
                case OP_DISP16:   return 8;
                case OP_INDEXPC:
                case OP_INDEX:    return 12;
                case OP_ABSW:     return 8;
                case OP_ABSL:     return 12;
            }
            throw new Error('cost for LEA not implemented for address mode ' + ops[0]);
        },
        encode: function(size, ops) {
            let ea = ops[0].encoding(size);
            assert(ops[1].type === OP_AREG);
            return [0x41c0|ops[1].val<<9|ea[0]<<3|ea[1]].concat(ea.slice(2));
        },
    },

    // Integer arithmetic instructions
    'ADD'   : add_sub_op(0xD000, 0x0600),
    'SUB'   : add_sub_op(0x9000, 0x0400),
    'CLR'   : default_un_op(0x4200),
    'NEG'   : default_un_op(0x4400),
    'MULS'  : mul_div_op(0xc1c0, 70),
    'MULU'  : mul_div_op(0xc0c0, 70),
    'DIVS'  : mul_div_op(0x81c0, 120),
    'DIVU'  : mul_div_op(0x80c0, 120),
    'ADDX'  : add_sub_x_op(0xd100),
    'SUBX'  : add_sub_x_op(0x9100),
    'ADDQ'  : add_sub_q_op(0),
    'SUBQ'  : add_sub_q_op(1),
    'CMP'   : {
        allowed_sizes: standard_sizes,
        operands: [ OP_EA|OP_DREG|OP_AREG|OP_IMMEDIATE, OP_DREG|OP_AREG],
        cost: function(size, ops) {
            var cost = ops[0].cost(size) + ops[1].cost(size);
            if (ops[1].type == OP_DREG && size !== 'L') return BASE_COST + cost;
            return 6 + cost;
        },
        encode: function(size, ops) {
            return default_bin_encoding(size, ops, 0xb000, 0x0c00);
        }
    },
    'EXT'   : {
        allowed_sizes: ['W', 'L' ],
        operands: [ OP_DREG ],
        cost: function(size, ops) { return 4; }
    },

    // Logical instructions
    'AND'   : default_bin_op(0xC000, 0x0200),
    'EOR'   : default_bin_op(0xB000, 0x0A00),
    'OR'    : default_bin_op(0x8000, 0x0000),
    'NOT'   : default_un_op(0x4600),

    // Shift and rotate instructions
    'ASL'   : default_rot_op(0xe000, 1),
    'ASR'   : default_rot_op(0xe000, 0),
    'LSL'   : default_rot_op(0xe008, 1),
    'LSR'   : default_rot_op(0xe008, 0),
    'ROL'   : default_rot_op(0xe018, 1),
    'ROR'   : default_rot_op(0xe018, 0),
    'SWAP'  : {
        allowed_sizes: [ 'W' ],
        operands: [ OP_DREG ],
        cost: function(size, ops) { return BASE_COST; }
    },

    // Bit manipulation instructions
    'BTST'  : default_bit_op(0b00<<6, 4, 6),
    'BCHG'  : default_bit_op(0b01<<6, 8, 8),
    'BCLR'  : default_bit_op(0b10<<6, 8, 10),
    'BSET'  : default_bit_op(0b11<<6, 8, 8),

    // Program control instructions
    // Bcc added below
    'BRA'   : branch_op(0),
    'RTS'   : {
        allowed_sizes: [],
        operands: [],
        cost: function(size, ops) { return 16; },
        encode: function(size, ops) { return [0x4e75]; },
    },
    'TST'   : {
        allowed_sizes: standard_sizes,
        operands: default_un_op().operands,
        cost: function(size, ops) { return BASE_COST + ops[0].cost(size); },
        encode: function(size, ops) { return default_un_encoding(size, ops, 0x4a00); },
    },
};

condition_codes.forEach(function (cc, index) {
    this['B'+cc] = branch_op(index);
    this['DB'+cc] = {
        allowed_sizes: ['W'],
        operands: [ OP_DREG, OP_ABSW|OP_ABSL ],
        cost: function (size, ops) {
            return 10; // Branch taken (cc false). Otherwise cost is 12 (cc true)/14(cc false)
        },
        encode: function(size, ops) {
            assert(ops[0].type === OP_DREG);
            return [0x50C8|index<<8|ops[0].val, 0xffff];
        },
    };
}, instruction_info);

class Instruction {
    constructor(name, size, operands) {
        this.info     = instruction_info[name];
        if (!this.info) {
            throw new Error('Unknown instruction "' + name + '"');
        }
        if (size && this.info.allowed_sizes.indexOf(size) === -1) {
            throw new Error('Invalid instruction size for "' + name + '": ' + size);
        }
        if (this.info.operands.length != operands.length) {
            throw new Error('Invalid number of operands for "' + name + '": ' + operands.join(', '));
        }
        this.name     = name;
        this.size     = size;
        this.operands = operands;
    }

    toString() {
        return this.name + (this.info.allowed_sizes.length > 1 ? '.'+this.size : '') + '\t' + this.operands.join(', ')
    }

    cost() {
        return this.info.cost(this.size, this.operands);
    }

    encode() {
        if (typeof this.info.encode === 'undefined') {
            throw new Error('Instruction.encode() not implemented for ' + this);
        }
        return this.info.encode(this.size, this.operands);
    }

    static parse(line) {
        //
        // Parse operation
        //
        let operation = undefined;
        [line, operation] = try_parse(line, re_operation);
        if (!operation) {
            throw new Error('Could not parse operation in "' + line + '"');
        }

        //
        // Split into operation and optional size
        // And see if it's a known instruction
        //
        let opsize = undefined;
        let op     = operation;
        let dotpos = op.indexOf('.');
        if (dotpos !== -1) {
            opsize = op[dotpos+1].toUpperCase();
            if (opsize == 'S') opsize = 'B';
            op     = op.slice(0, dotpos);
        }
        op = op.toUpperCase();
        let instinfo = instruction_info[op];
        if (!instinfo) {
            throw new Error('Unknown instruction "' + operation + '"');
        }

        //
        // Parse operands
        //
        let operands = [];
        if (instinfo.operands.length) {
            let ignored = undefined;
            [line, ignored] = must_parse(line, /^(\s+)/);
            for (let i = 0; i < instinfo.operands.length; ++i) {
                let operand = undefined;
                if (i)[line, ignored] = must_parse(line, re_operand_sep);
                [line, operand] = Operand.parse(line);
                if ((instinfo.operands[i] & operand.type) === 0) {
                    throw new Error('Invalid operand ' + operand + ' for ' + op);
                }
                operands.push(operand);
            }
        }

        if (typeof opsize !== 'undefined') {
            if (instinfo.allowed_sizes.indexOf(opsize) === -1) {
                throw new Error('Invalid operation size for "' + operation + '"');
            }
        } else if (instinfo.handle_size) {
            opsize = instinfo.handle_size(operands);
        } else if (instinfo.allowed_sizes.length) {
            opsize = instinfo.allowed_sizes[0];
        }
        return [line, new Instruction(op, opsize, operands)];
    }
};

class Line {
    constructor(label, instruction, comment) {
        this.label       = label;
        this.instruction = instruction;
        this.comment     = comment;
    }

    toString() {
        let str = (this.label ? this.label : '');
        if (this.instruction) {
            str += '\t' + (this.instruction+'                        ').substring(0,24);
        }
        if (this.comment && this.comment.length) {
            str += '\t' + this.comment;
        }
        return str;
    }

    static parse(line) {
        // LABEL   OPERATION    OPERAND,OPERAND,...   COMMENT

        // Remove trailing whitespace
        line = line.replace(/\s+$/,'');

        //
        // Parse optional label at start of line
        //
        let label     = undefined;
        [line, label] = try_parse(line, re_label);
        if (label && label.slice(-1) === ':') {
            label = label.slice(0, -1);
        }

        //
        // Comment?
        //
        let comment     = undefined;
        [line, comment] = try_parse(line, re_comment);
        let instruction = undefined;
        if (!comment && line.length) {
            //
            // Parse instruction and operand(s)
            //
            [line, instruction] = Instruction.parse(line)

            //
            // Rest of line is comment
            //
            if (line.length) {
                comment = line.replace(/^\s+/,'');
            }
        }

        return new Line(label, instruction, comment);
    }
}

function parse_lines(text) {
    return text.split('\n').map(function (l) { return Line.parse(l); });
};

function operand_to_code(op) {
    function expr_to_code(e) { return e.toString().substring(1); };
    switch (op.type) {
        case OP_DREG:
        case OP_AREG:       return op.toString();
        case OP_INDIRECT:   return '[A' + op.val + ']';
        case OP_POSTINCR:   return '[A' + op.val + ', \'+\']';
        case OP_PREINCR:    return '[A' + op.val + ', \'-\']';
        case OP_DISP16:     return '[A' + op.val[1] + ', ' + op.val[0] + ']';
        case OP_INDEX:      return '[A' + op.val[1] + ', D' + op.val[2] + ', ' + op.val[0] + ']';
        case OP_ABSW:
        case OP_ABSL:       return '[' + op.val + ']';
        case OP_DISP16PC:   return '[PC, ' + op.val[0] + ']';
        case OP_INDEXPC:    return '[PC, D' + op.val[1] + ', ' + op.val[0] + ']';
        case OP_IMMEDIATE:  return expr_to_code(op);
        //case OP_REGLIST:    return ;
    }
    throw new Error('operand_to_code: Not implemented for "' + op + '" ' + op_type_str(op.type));
};

function to_code(lines) {
    let code = '';
    lines.forEach(function (line) {
        let i = line.instruction;
        if (i) {
            try {
                code += i.name + '.' + i.size + '(' + i.operands.map(operand_to_code).join(', ') + ')\n';
            } catch(e) {
                code += 'state.writeline(\'Codegen not implemented for "' + i + '" - "' + e + '"\')\n';
            }
        }
    });
    try {
        var f = new Function(code);
        return f;
    } catch (e) {
        console.log(e);
        console.log(code);
        throw e;
    }
};

module.exports = {
    // Public exports
    'Operand'           : Operand,
    'Instruction'       : Instruction,
    'Line'              : Line,
    'parse_lines'       : parse_lines,
    'to_code'           : to_code,
    'OP_DREG'           : OP_DREG,
    'OP_AREG'           : OP_AREG,
    'OP_INDIRECT'       : OP_INDIRECT,
    'OP_POSTINCR'       : OP_POSTINCR,
    'OP_PREINCR'        : OP_PREINCR,
    'OP_DISP16'         : OP_DISP16,
    'OP_INDEX'          : OP_INDEX,
    'OP_ABSW'           : OP_ABSW,
    'OP_ABSL'           : OP_ABSL,
    'OP_DISP16PC'       : OP_DISP16PC,
    'OP_INDEXPC'        : OP_INDEXPC,
    'OP_IMMEDIATE'      : OP_IMMEDIATE,
    'OP_REGLIST'        : OP_REGLIST,

    // For testing
    '_try_parse'        : try_parse,
    '_re_comment'       : re_comment,
    '_re_label'         : re_label,
    '_re_operation'     : re_operation,
    '_re_reglist'       : re_reglist,
    '_parse_reglist'    : parse_reglist,
    '_LitExpr'          : LitExpr,
    '_SymExpr'          : SymExpr,
    '_NegExpr'          : NegExpr,
    '_BinExpr'          : BinExpr,
};
