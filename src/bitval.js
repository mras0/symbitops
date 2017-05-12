//
// Bitval
//

const BITVAL_KNOWN0    = 0;
const BITVAL_KNOWN1    = 1;
const BITVAL_UNDEFINED = 2;

const BITVAL_STR_KNOWN0    = '..';
const BITVAL_STR_KNOWN1    = '!!';
const BITVAL_STR_UNDEFINED = '??';

const EXPR_MAX_VALS = 4;

class BitExpr {
    constructor(vals) {
        if (vals.length <= 1) {
            throw new Error('Internal error. BitExpr('+vals+')');
        }
        this.vals = vals;
        this.vals.sort(); // Force order
    }
};

class AndExpr extends BitExpr {
    constructor(vals) {
        super(vals);
        this.vals.forEach(function (v) {
            if (typeof v !== 'string') {
                throw new Error('Invalid value in AndExpr: ' + v);
            }
        });
    }

    toString() {
        return '(' + this.vals.join('&') + ')';
    }

    equals(rhs) {
        if (!(rhs instanceof AndExpr) || this.vals.length != rhs.vals.length) {
            return false;
        }
        for (let i = 0; i < this.vals.length; ++i) {
            if (this.vals[i] != rhs.vals[i]) {
                return false;
            }
        }
        return true;
    }

    and(rhs) {
        if (rhs instanceof AndExpr) {
            let vs = this.vals.slice();
            for (let v of rhs.vals) {
                if (vs.indexOf(v) === -1) {
                    vs.push(v);
                }
            }
            if (vs.length > EXPR_MAX_VALS) {
                return undefined;
            }
            return new AndExpr(vs);
        } else if (rhs instanceof BitExpr) {
            return rhs.and(this);
        } else if (typeof(rhs) !== 'string') {
            throw new Error('Not implemented: ' + this + ' and ' + rhs);
        }
        if (this.vals.indexOf(rhs) !== -1) {
            return this;
        }
        let vs = this.vals.slice();
        vs.push(rhs);
        return new AndExpr(vs);
    }

    static calc(lhs, rhs) {
        if (lhs === BITVAL_KNOWN0 || rhs === BITVAL_KNOWN0) {
            return BITVAL_KNOWN0;
        } else if (lhs === BITVAL_KNOWN1) {
            return rhs;
        } else if (rhs === BITVAL_KNOWN1) {
            return lhs;
        } else if (lhs === rhs) {
            return lhs;
        } else if (lhs === BITVAL_UNDEFINED || rhs === BITVAL_UNDEFINED) {
            return BITVAL_UNDEFINED;
        } else if (lhs instanceof BitExpr) {
            return lhs.and(rhs);
        } else if (rhs instanceof BitExpr) {
            return rhs.and(lhs);
        } if (typeof lhs === 'string' && typeof rhs == 'string') {
            return new AndExpr([lhs, rhs]);
        }
        throw new Error('Not implemented: AndExpr.calc('+lhs+', '+rhs+')');
    }
};

class XorExpr extends BitExpr {
    constructor(vals) {
        super(vals);
        this.vals.forEach(function (v) {
            if (v !== BITVAL_KNOWN1 && typeof v !== 'string' && !(v instanceof AndExpr)) {
                throw new Error('Invalid value in XorExpr: ' + v + ' [' + vals + ']');
            }
        });
    }

    toString() {
        let vs = this.vals.slice();
        let p = vs.indexOf(BITVAL_KNOWN1);
        let n = '';
        // NOT?
        if (p !== -1) {
            n = '~';
            vs.splice(p, 1);
        }
        if (vs.length === 1) {
            return n + vs[0];
        } else {
            // X&~Y?
            if (vs.length === 2 && (vs[0] instanceof AndExpr) && vs[0].vals.length === 2) {
                // X&Y^X
                if (vs[0].vals[0] === vs[1]) {
                    return n + '(' + vs[1] + '&~' + vs[0].vals[1] + ')';
                } else if (vs[0].vals[1] === vs[1]) {
                    return n + '(' + vs[1] + '&~' + vs[0].vals[0] + ')';
                }
            }
            // OR?
            if (vs.length === 3
                && (vs[0] instanceof AndExpr)
                && vs[0].vals.length === 2
                && vs[0].vals[0] === vs[1]
                && vs[0].vals[1] === vs[2]
            ) {
                return n + '(' + vs[1] + '|' + vs[2] + ')';
            }
            return n + '(' + vs.join('^') + ')';
        }
    }

    and(rhs) {
        let vs=[];
        if (rhs === BITVAL_UNDEFINED) {
            return BITVAL_UNDEFINED;
        } else if (typeof rhs === 'string') {
            vs = this.vals.map(function (v) { return AndExpr.calc(v, rhs); });
        } else if (rhs instanceof BitExpr) {
            // (A^B^...) & (X^Y^...) -> (A&X)^(A&Y)^...^(B&X)^(B&Y)^...
            this.vals.forEach(function (l) {
                rhs.vals.forEach(function (r) {
                    vs.push(AndExpr.calc(l, r));
                });
            });
        } else {
            throw new Error('Invalid rhs ' + rhs + ' in XorExpr.and');
        }
        let res = vs.reduce(function (l,r) { return typeof l !== 'undefined' ? XorExpr.calc(l,r) : l; });
        if (!res || res.length > EXPR_MAX_VALS) {
            return undefined;
        }
        return res;
    }

    xor(rhs) {
        if (rhs instanceof XorExpr) {
            let res = this;
            for (let v of rhs.vals) {
                res = XorExpr.calc(res, v);
            }
            return res;
        }
        let vs = this.vals.slice();
        let pos = -1;
        if (rhs instanceof AndExpr) {
            pos = vs.findIndex(function (v) {
                return rhs.equals(v);
            });
        } else if (typeof rhs === 'string' || rhs === BITVAL_KNOWN1) {
            pos = vs.indexOf(rhs);
        } else {
            throw new Error('Not implemented: ' + this + ' xor ' + rhs);
        }
        if (pos !== -1) {
            vs.splice(pos, 1);
            if (vs.length === 1) {
                return vs[0];
            }
        } else {
            vs.push(rhs);
        }
        if (vs.length > EXPR_MAX_VALS) {
            return undefined;
        }
        return new XorExpr(vs);
    }


    static calc(lhs, rhs) {
        if (lhs === BITVAL_UNDEFINED || rhs === BITVAL_UNDEFINED) {
            return BITVAL_UNDEFINED;
        } else if (lhs === BITVAL_KNOWN0) {
            return rhs;
        } else if (rhs === BITVAL_KNOWN0) {
            return lhs;
        } else if (lhs === rhs) {
            return BITVAL_KNOWN0;
        } else if (lhs instanceof XorExpr) {
            return lhs.xor(rhs);
        } else if (rhs instanceof XorExpr) {
            return rhs.xor(lhs);
        }
        return new XorExpr([lhs, rhs]);
    }
};

class Bitval {
    constructor(val) {
        if (val instanceof Bitval) {
            this.val = val.val;
        } else if (val instanceof XorExpr || val instanceof AndExpr) {
            this.val = val;
        } else if (val === 0 || val === BITVAL_STR_KNOWN0) {
            this.val = BITVAL_KNOWN0;
        } else if (val === 1 || val === BITVAL_STR_KNOWN1) {
            this.val = BITVAL_KNOWN1;
        } else if (val === BITVAL_UNDEFINED || val === BITVAL_STR_UNDEFINED || typeof val === 'undefined') {
            this.val = BITVAL_UNDEFINED;
        } else if (typeof val === 'string') {
            if (val.length != 2) {
                throw new Error('Invalid length for string "' + val + '"');
            }
            this.val = val;
        } else {
            throw new Error('Unsupported bitval of type ' + typeof val + ' = ' + val);
        }
    }

    toString() {
        if (typeof this.val !== 'number') {
            return this.val.toString();
        } else if (this.val === BITVAL_UNDEFINED) {
            return BITVAL_STR_UNDEFINED;
        } else if (this.val === BITVAL_KNOWN0) {
            return BITVAL_STR_KNOWN0;
        } else if (this.val === BITVAL_KNOWN1) {
            return BITVAL_STR_KNOWN1;
        }
        throw new Error('Unsupported bitval ' + val);
    }

    not() {
        return this.xor(new Bitval(BITVAL_KNOWN1));
    }

    and(rhs) {
        return new Bitval(AndExpr.calc(this.val, rhs.val));
    }

    or(rhs) {
        if (this.val === BITVAL_KNOWN1 || rhs.val === BITVAL_KNOWN1) {
            return new Bitval(1);
        } else if (this.val === BITVAL_KNOWN0) {
            return new Bitval(rhs);
        } else if (rhs.val === BITVAL_KNOWN0) {
            return new Bitval(this);
        } else if (this.val === rhs.val) {
            return new Bitval(this);
        }
        return (this.not().and(rhs.not())).not();
    }

    xor(rhs) {
        return new Bitval(XorExpr.calc(this.val, rhs.val));
    }

    half_add(rhs) {
        return [this.and(rhs), this.xor(rhs)];
    }

    equals(rhs) {
        if (typeof this.val !== 'number') {
            throw new Error('Not support for ' + this.val);
        }
        if (typeof rhs.val !== 'number') {
            throw new Error('Not support for ' + rhs + ' ' + typeof rhs.val);
        }
        return this.val === rhs.val;
    }

    real_value() {
        if (this.val === BITVAL_KNOWN0) {
            return 0;
        } else if (this.val === BITVAL_KNOWN1) {
            return 1;
        } else {
            return undefined;
        }
    }
};

// Public exports
exports.Bitval = Bitval;

// For test only
exports._BITVAL_KNOWN0    = BITVAL_KNOWN0;
exports._BITVAL_KNOWN1    = BITVAL_KNOWN1;
exports._BITVAL_UNDEFINED = BITVAL_UNDEFINED;
