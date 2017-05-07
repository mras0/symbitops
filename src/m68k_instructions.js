const assert = require('assert');

const re_comment_str      = '^\\s*([*;].*)$';
const re_symbol_str       = '[A-Za-z.][0-9A-Za-z.$_]*';
const re_label_str        = '^(' + re_symbol_str + '(?::)?)\\s*|\\s*(' + re_symbol_str + ':)\\s*';
const re_size_postfix     = '(?:\\.[bBwWlLsS])?';
const re_operation_str    = '^\\s*([A-Za-z][0-9A-Za-z]*'+re_size_postfix+')';
const re_numconst_str     = '(?:-)?(?:[0-9]+|\\$[0-9A-Fa-f]+)' // TODO: binary, octal and ascii, expression
const re_immediate_str    = '#(?:' + re_numconst_str + ')';
const re_operand_sep_str  = '^(\\s*,\\s*)';
const re_dreg_str         = '[dD][0-7]';
const re_areg_str         = '[aA][0-7]';
const re_indirect_str     = '\\(\\s*'+re_areg_str+'\\s*\\)';
const re_postincr_str     = re_indirect_str+'\\+';
const re_preincr_str      = '-'+re_indirect_str;
const re_disp16_str       = '(?:'+re_numconst_str+')?\\s*\\(\\s*'+re_areg_str+'\\s*\\)';
const re_index_str        = '(?:'+re_numconst_str+')?\\s*\\(\\s*'+re_areg_str+'\\s*,\\s*'+re_dreg_str+re_size_postfix+'\\s*\\)';
const re_anyreg_str       = '(?:' + re_dreg_str + '|' + re_areg_str + ')';
const re_reginterval_str  = '(?:' + re_anyreg_str + '-' + re_anyreg_str + ')';
const re_reglist_atom_str = '(?:' + re_reginterval_str + '|' + re_anyreg_str + ')';
const re_reglist_str      = re_reglist_atom_str + '(?:/'+re_reglist_atom_str+')*';
const re_comment          = new RegExp(re_comment_str);
const re_label            = new RegExp(re_label_str);
const re_operation        = new RegExp(re_operation_str);
const re_operand_sep      = new RegExp(re_operand_sep_str);
const re_dreg             = new RegExp('(^'+re_dreg_str+')');
const re_areg             = new RegExp('(^'+re_areg_str+')');
const re_indirect         = new RegExp('(^'+re_indirect_str+')(?:[^+])'); // Make sure we don't match (aN)+
const re_postincr         = new RegExp('(^'+re_postincr_str+')');
const re_preincr          = new RegExp('(^'+re_preincr_str+')');
const re_disp16           = new RegExp('(^'+re_disp16_str+')');
const re_index            = new RegExp('(^'+re_index_str+')');
const re_immediate        = new RegExp('^('+re_immediate_str+')');
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

function op_type_re(type) {
    switch (type) {
        case OP_DREG:       return re_dreg;
        case OP_AREG:       return re_areg;
        case OP_INDIRECT:   return re_indirect;
        case OP_POSTINCR:   return re_postincr;
        case OP_PREINCR:    return re_preincr;
        case OP_DISP16:     return re_disp16;
        case OP_INDEX:      return re_index;
        case OP_IMMEDIATE:  return re_immediate;
        case OP_REGLIST:    return re_reglist;
    }
    throw new Error('Unhandled operand type ' + op_type_str(type));
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
            } else {
                throw new Error('Unsupport register range "' + f + '" to "' + l + '"');
            }
        }
    });
    return regs;
}

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
        return this.val;
    }

    cost(size) {
        switch (this.type) {
        case OP_DREG:
        case OP_AREG:       return 0;
        case OP_INDIRECT:
        case OP_POSTINCR:   return size === 'L' ? 8 : 4;
        //case OP_PREINCR:    return ;
        case OP_DISP16:     return size === 'L' ? 12 : 8;
        case OP_INDEX:      return size === 'L' ? 14 : 10;
        //case OP_ABSL:       return ;
        case OP_IMMEDIATE:  return size === 'L' ? 2*BASE_COST : BASE_COST;
        }
        throw new Error('Operand.cost not implemented for ' + op_type_str(this.type) + ' size ' + size);
    }

    immediate_value() {
        if (this.type !== OP_IMMEDIATE) {
            throw new Error('Operand.immediate_value not implemented for ' + op_type_str(this.type) + ' size ' + size);
        }
        assert.equal(this.val[0], '#');
        let v = this.val.slice(1);
        let b = 10;
        let s = 1;
        if (v[0] === '-') {
            s = -1;
            v = v.slice(1);
        }
        if (v[0] === '$') {
            b = 16;
            v = v.slice(1);
        }
        return s * parseInt(v, b);
    }

    static parse(line, types) {
        let orig_types = types;
        types &= ~(OP_ABSL|OP_ABSW|OP_DISP16PC|OP_INDEXPC); // TODO: handle these unsupported operand types...
        while (types != 0) {
            let type    = types & -types;
            let [l, op] = try_parse(line, op_type_re(type));
            if (op) {
                return [l, new Operand(type, op)];
            }
            types &= ~type;
        }
        if (orig_types & (OP_ABSL|OP_ABSW)) {
            let [l, op] = try_parse(line, new RegExp('^(' + re_numconst_str + '|' + re_symbol_str + ')'));
            if (op) {
                return [l, new Operand(OP_ABSL, op)];
            }
        }
        throw new Error('Could not match operand "' + line + '" with type(s) ' + op_type_str(orig_types));
    };
};

function arit_cost(size, ops) {
    assert.equal(ops.length, 2);
    assert(ops[1].type === OP_DREG || ops[1].type === OP_AREG);
    let cost = ops[0].cost(size) + ops[1].cost(size);
    if (size === 'L') {
        if (ops[0].type & (OP_DREG|OP_AREG|OP_IMMEDIATE)) {
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

function default_un_op() {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_EA | OP_DREG ],
        cost: function (size, ops) {
            if (ops[0].type === OP_DREG || ops[0].type === OP_AREG) {
                return size === 'L' ? 6 : 4;
            } else {
                return size === 'L' ? 12 : 8;
            }
        },
    };
};

function default_bin_op(cost) {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG, OP_EA | OP_DREG ],
        cost: cost || arit_cost,
    };
};

function add_sub_op() {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG | OP_AREG, OP_EA | OP_DREG | OP_AREG ],
        cost: function (size, ops) {
            var cost = arit_cost(size, ops);
            return (size !== 'L' && ops[1].type === OP_AREG) ? BASE_COST + cost : cost;
        },
    };
};

function add_sub_x_op() {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_DREG, OP_DREG ],
        cost: function(size, ops) { return size === 'L' ? 2*BASE_COST : BASE_COST; },
    };
};

function add_sub_q_op() {
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
    };
};

function default_rot_op() {
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
        }
    };
};

function mul_op() {
    return {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG, OP_DREG ],
        cost: function(size, ops) {
            return 70 + ops[0].cost(size) + ops[1].cost(size);
        }
    };
};

function branch_op() {
    return {
        allowed_sizes: ['W', 'B'], // Bcc.L is 020+ only
        operands: [ OP_ABSW | OP_ABSL ],
        cost: function(size, ops) {
            // .B -> 10 taken, 8 not taken
            // .W -> 10 taken, 12 not taken
            return 10;
        }
    };
};

let instruction_info = {
    // Data movement instructions
    'MOVE'  : {
        allowed_sizes: standard_sizes,
        operands: [ OP_IMMEDIATE | OP_EA | OP_DREG | OP_AREG, OP_DREG | OP_AREG | OP_EA ],
        cost : function(size, ops) {
            return BASE_COST + ops[0].cost(size) + ops[1].cost(size);
        },
    },
    'MOVEQ' : {
        allowed_sizes: [ 'L' ],
        operands: [ OP_IMMEDIATE, OP_DREG ],
        cost: function(size, ops) { return BASE_COST; },
    },
    'MOVEM' : {
        allowed_sizes: [ 'L', 'W' ],
        operands: [ OP_EA | OP_REGLIST, OP_EA | OP_REGLIST ],
        cost: function(size, ops) {
            let basecost = undefined;
            let nregs    = undefined;
            if (ops[0].type === OP_REGLIST) {
                // R --> M
                nregs = parse_reglist(ops[0].val).length;
                switch (ops[1].type) {
                    case OP_INDIRECT:
                    case OP_PREINCR:
                        basecost = 8;
                        break;
                }
            } else {
                // M --> R
                assert.equal(ops[1].type, OP_REGLIST);
                nregs = parse_reglist(ops[1].val).length;
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
    },
    'LEA' : {
        allowed_sizes: [ 'L' ],
        operands: [ OP_EA, OP_AREG ],
        cost : function(size, ops) {
            let t = ops[0].type;
            switch (t) {
                case OP_INDIRECT: return 4;
                case OP_DISP16:   return 8;
                case OP_INDEX:    return 12;
                case OP_ABSW:     return 8;
                case OP_ABSL:     return 12;
            }
            throw new Error('cost for LEA not implemented for address mode ' + ops[0]);
        },
    },

    // Integer arithmetic instructions
    'ADD'   : add_sub_op(),
    'SUB'   : add_sub_op(),
    'CLR'   : default_un_op(),
    'NEG'   : default_un_op(),
    'MULS'  : mul_op(),
    'MULU'  : mul_op(),
    'ADDX'  : add_sub_x_op(),
    'SUBX'  : add_sub_x_op(),
    'ADDQ'  : add_sub_q_op(),
    'SUBQ'  : add_sub_q_op(),
    'CMP'   : {
        allowed_sizes: standard_sizes,
        operands: [ OP_EA|OP_DREG|OP_AREG|OP_IMMEDIATE, OP_DREG|OP_AREG],
        cost: function(size, ops) {
            var cost = ops[0].cost(size) + ops[1].cost(size);
            if (ops[1].type == OP_DREG && size !== 'L') return BASE_COST + cost;
            return 6 + cost;
        }
    },

    // Logical instructions
    'AND'   : default_bin_op(),
    'EOR'   : default_bin_op(),
    'OR'    : default_bin_op(),
    'NOT'   : default_un_op(),

    // Shift and rotate instructions
    'ASL'   : default_rot_op(),
    'ASR'   : default_rot_op(),
    'LSL'   : default_rot_op(),
    'LSR'   : default_rot_op(),
    'ROL'   : default_rot_op(),
    'ROR'   : default_rot_op(),
    'SWAP'  : {
        allowed_sizes: [ 'W' ],
        operands: [ OP_DREG ],
        cost: function(size, ops) { return BASE_COST; }
    },

    // Program control instructions
    // Bcc added below
    'BRA'   : branch_op(),
    'RTS'   : {
        allowed_sizes: [],
        operands: [],
        cost: function(size, ops) { return 16; }
    },
};

condition_codes.forEach(function (cc) {
    this['B'+cc] = branch_op();
    this['DB'+cc] = {
        allowed_sizes: ['W'],
        operands: [ OP_DREG, OP_ABSW|OP_ABSL ],
        cost: function (size, ops) {
            return 10; // Branch taken (cc false). Otherwise cost is 12 (cc true)/14(cc false)
        }
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
        if (typeof opsize !== 'undefined') {
            if (instinfo.allowed_sizes.indexOf(opsize) === -1) {
                throw new Error('Invalid operation size for "' + operation + '"');
            }
        } else if (instinfo.allowed_sizes.length) {
            opsize = instinfo.allowed_sizes[0];
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
                if (i) [line, ignored] = must_parse(line, re_operand_sep);
                [line, operand] = Operand.parse(line, instinfo.operands[i]);
                operands.push(operand);
            }
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

        let label       = undefined;
        let instruction = undefined;
        let comment     = undefined;

        //
        // Parse optional label at start of line
        //
        [line, label] = try_parse(line, re_label);
        if (label && label.slice(-1) === ':') {
            label = label.slice(0, -1);
        }

        //
        // Comment?
        //
        [line, comment] = try_parse(line, re_comment);
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
    switch (op.type) {
        case OP_DREG:       return op.val.toUpperCase();
        case OP_IMMEDIATE:  return op.immediate_value().toString(10);
    }
    throw new Error('operand_to_code: Not implemented for "' + op + '"');
};

function to_code(lines) {
    let code = '';
    lines.forEach(function (line) {
        let i = line.instruction;
        if (i) {
            try {
                code += i.name + '.' + i.size + '(' + i.operands.map(operand_to_code).join(', ') + ')\n';
            } catch(e) {
                code += 'state.writeline(\'Codegen not implemented for "' + i + '"\')\n';
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

    // For testing
    '_try_parse'        : try_parse,
    '_re_comment'       : re_comment,
    '_re_label'         : re_label,
    '_re_operation'     : re_operation,
    '_re_dreg'          : re_dreg,
    '_re_areg'          : re_areg,
    '_re_indirect'      : re_indirect,
    '_re_postincr'      : re_postincr,
    '_re_preincr'       : re_preincr,
    '_re_disp16'        : re_disp16,
    '_re_index'         : re_index,
    '_re_immediate'     : re_immediate,
    '_re_reglist'       : re_reglist,
    '_parse_reglist'    : parse_reglist,
};
