const { Bitval } = require('./bitval')

//
// BitvalN
//

class BitvalN {
    constructor(nbits) {
        this.bit   = new Array(nbits);
        for (let i = 0; i < this.nbits(); ++i) {
            this.bit[i] = new Bitval();
        }
    }

    static constN(n, val) {
        let v = undefined;
        if (val instanceof BitvalN) {
            v = new BitvalN(n).set(val);
        } else if (typeof val === 'number') {
            v = new BitvalN(n);
            for (let i = 0; i < n; ++i) {
                v.bit[i] = new Bitval((val >>> i) & 1);
            }
        } else if (typeof val == 'string') {
            v = new BitvalN(n).set(BitvalN.named(val));
        } else {
            throw new Error('Unsupported value: ' + val);
        }
        return v;
    }

    static named(val_in) {
        let val = val_in.replace(/ /g, '');
        let v = new BitvalN(val.length/2);
        for (let i = 0; i < v.nbits(); ++i) {
            v.bit[v.nbits()-1-i] = new Bitval(val.substr(i*2,2));
        }
        return v;
    }

    equals(rhs) {
        if (!(rhs instanceof BitvalN) || this.nbits() != rhs.nbits()) {
            return false;
        }
        for (let i = 0; i < this.nbits(); ++i) {
            if (!this.bit[i].equals(rhs.bit[i])) {
                return false;
            }
        }
        return true;
    }

    toString() {
        let s = '';
        for (let i = this.nbits()-1; i >= 0; i--) {
            s += this.bit[i];
            if (i !== 0 && i%8 === 0) s += ' ';
        }
        return s;
    }

    nbits() {
        return this.bit.length;
    }

    real_value() {
        let res = 0;
        for (let i = 0; i < this.nbits(); ++i) {
            let val = this.bit[i].real_value();
            if (typeof val !== 'undefined') {
                res = (res | (val << i)) >>> 0;
            } else {
                console.log('Warning: returning undefined in real_value() for ' + this);
                return undefined;
            }
        }
        return res;
    }

    get(nbits) {
        if (nbits > this.nbits()) throw new Error('Too many bits requested: ' + nbits);
        let res = new BitvalN(nbits);
        for (let i = 0; i < nbits; ++i) {
            res.bit[i] = this.bit[i];
        }
        return res;
    }

    set(val) {
        if (val.nbits() > this.nbits()) throw new Error('Too many bits set: ' + val.nbits());
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < res.nbits(); ++i) {
            res.bit[i] = i < val.nbits() ? val.bit[i] : this.bit[i];
        }
        return res;
    }

    sign_extend(nbits) {
        if (nbits < this.nbits()) throw new Error('Truncating in sign_extend');
        let res = new BitvalN(nbits);
        for (let i = 0; i < res.nbits(); ++i) {
            res.bit[i] = i < this.nbits() ? this.bit[i] : this.bit[this.nbits()-1];
        }
        return res;

    }

    not() {
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            res.bit[i] = this.bit[i].not();
        }
        return res;
    }

    // TODO: Refactor and/or/xor ...
    and(rhs) {
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            res.bit[i] = this.bit[i].and(rhs.bit[i]);
        }
        return res;
    }

    or(rhs) {
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            res.bit[i] = this.bit[i].or(rhs.bit[i]);
        }
        return res;
    }

    xor(rhs) {
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            res.bit[i] = this.bit[i].xor(rhs.bit[i]);
        }
        return res;
    }

    add(rhs) {
        let res   = new BitvalN(this.nbits());
        let carry = new Bitval(0);
        for (let i = 0; i < this.nbits(); ++i) {
            let [carry1, sum1] = this.bit[i].half_add(rhs.bit[i]);
            let [carry2, sum2] = carry.half_add(sum1);
            res.bit[i] = sum2;
            carry      = carry1.xor(carry2);
        }
        return res;
    }

    neg() {
        return this.not().add(BitvalN.constN(this.nbits(), 1));
    }

    sub(rhs) {
        return this.add(rhs.neg());
    }

    // Positive shift is to the right here, negative to the left

    logical_shift(rhs) {
        if (typeof rhs !== 'number') {
            throw new Error('Invalid rhs in logical_shift: ' + rhs);
        }
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            let src = i + rhs;
            res.bit[i] = src < 0 || src >= this.nbits() ? new Bitval(0) : this.bit[src];
        }
        return res;
    }

    arithmetic_shift(rhs) {
        if (typeof rhs !== 'number') {
            throw new Error('Invalid rhs in arithmetic_shift: ' + rhs);
        }
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            let src = i + rhs;
            if (src < 0) {
                res.bit[i] = new Bitval(0);
            } else if (src >= this.nbits()) {
                res.bit[i] = this.bit[this.nbits()-1];
            } else {
                res.bit[i] = this.bit[src];
            }
        }
        return res;
    }

    rotate(rhs) {
        if (typeof rhs !== 'number') {
            throw new Error('Invalid rhs in logical_shift: ' + rhs);
        }
        let res = new BitvalN(this.nbits());
        for (let i = 0; i < this.nbits(); ++i) {
            res.bit[i] = this.bit[(i+rhs+this.nbits())%this.nbits()];
        }
        return res;
    }

    lsr(rhs) {
        if (rhs instanceof BitvalN) {
            rhs = rhs.real_value();
        }
        return this.logical_shift(rhs);
    }

    lsl(rhs) {
        if (rhs instanceof BitvalN) {
            rhs = rhs.real_value();
        }
        return this.logical_shift(-rhs);
    }

    asr(rhs) {
        if (rhs instanceof BitvalN) {
            rhs = rhs.real_value();
        }
        return this.arithmetic_shift(rhs);
    }

    asl(rhs) {
        if (rhs instanceof BitvalN) {
            rhs = rhs.real_value();
        }
        return this.arithmetic_shift(-rhs);
    }

    ror(rhs) {
        if (rhs instanceof BitvalN) {
            rhs = rhs.real_value();
        }
        return this.rotate(rhs);
    }

    rol(rhs) {
        if (rhs instanceof BitvalN) {
            rhs = rhs.real_value();
        }
        return this.rotate(-rhs);
    }
}

// Public functions

exports.BitvalN = BitvalN;
