//
// Bitval
//

const BITVAL_KNOWN0    = 0;
const BITVAL_KNOWN1    = 1;
const BITVAL_UNDEFINED = 2;

const BITVAL_STR_KNOWN0    = '..';
const BITVAL_STR_KNOWN1    = '!!';
const BITVAL_STR_UNDEFINED = '??';

class XorOfKnowValues {
    constructor(lhs, rhs) {
        // Force order
        if (lhs <= rhs) {
            this.lhs = lhs;
            this.rhs = rhs;
        } else {
            this.lhs = rhs;
            this.rhs = lhs;
        }
    }

    toString() {
        return '^^';
    }

    static calc(lhs, rhs) {
        if (typeof lhs === 'string' && typeof rhs == 'string') {
            return new XorOfKnowValues(lhs, rhs);
        }

        if (lhs instanceof XorOfKnowValues) {
            if (typeof rhs !== 'string') {
                throw new Error('Not implemeneted');
            } else if (lhs.lhs === rhs) {
                return lhs.rhs;
            } else if (lhs.rhs === rhs) {
                return lhs.lhs;
            }
        } else if (rhs instanceof XorOfKnowValues) {
            if (typeof lhs !== 'string') {
                throw new Error('Not implemeneted');
            } else if (rhs.lhs === lhs) {
                return rhs.rhs;
            } else if (rhs.rhs === lhs) {
                return rhs.lhs;
            }
        }
        return undefined;
        //throw new Error('Not handled: lhs="' + lhs + '" rhs="' + rhs + '"');
    }
}

class Bitval {
    constructor(val) {
        if (val instanceof Bitval) {
            this.val = val.val;
        } else if (val instanceof XorOfKnowValues) {
            this.val = val;
        } else if (val === 0 || val === BITVAL_STR_KNOWN0) {
            this.val = BITVAL_KNOWN0;
        } else if (val === 1 || val === BITVAL_STR_KNOWN1) {
            this.val = BITVAL_KNOWN1;
        } else if (typeof val === 'undefined') {
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
        if (this.val === BITVAL_KNOWN0 || rhs.val === BITVAL_KNOWN0) {
            return new Bitval(0);
        } else if (this.val === BITVAL_KNOWN1) {
            return new Bitval(rhs);
        } else if (rhs.val === BITVAL_KNOWN1) {
            return new Bitval(this);
        } else if (this.val === rhs.val) {
            return new Bitval(this);
        }
        return new Bitval();
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
        return new Bitval();
    }

    xor(rhs) {
        if (this.val === BITVAL_UNDEFINED || rhs.val === BITVAL_UNDEFINED) {
            return new Bitval();
        } else if (this.val === BITVAL_KNOWN0) {
            return new Bitval(rhs);
        } else if (rhs.val === BITVAL_KNOWN0) {
            return new Bitval(this);
        } else if (this.val === rhs.val) {
            return new Bitval(0);
        }

        return new Bitval(XorOfKnowValues.calc(this.val, rhs.val));
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
exports._XorOfKnowValues  = XorOfKnowValues;
