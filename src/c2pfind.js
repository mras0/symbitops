const assert = require('assert');
require('./m68k_global')

global.canonical_representation = function(a) {
    return a.map(function(x){return ''+x;}).sort().join('');
}

global.find_4bit_c2p = function(input, output) {
    input = input.map(const32);
    output = output.map(const32);

    const max_steps       = 5;
    const expected_output = canonical_representation(output);

    let saved_states = new Array();

    function push_state() {
        saved_states.push([ state[D0], state[D1], state[D2], state[D3] ]);
    }

    function pop_state() {
        [ state[D0], state[D1], state[D2], state[D3] ] = saved_states.pop()
    }

    function try_ns(n, m, step, f) {
        for (let candidate = 1; candidate <= 16; candidate <<= 1) {
            let index = n.indexOf(candidate);
            if (index !== -1 && index < step) {
                continue; // An optimal C2P will never have to do the same step twice
            }

            n[step] = candidate;

            m[step] = 1;
            push_state();
            c2p_step4(n[step], m[step]);
            let x = f(n, m, step+1);
            if (x >= 0) return x;
            pop_state();

            m[step] = 2;
            push_state();
            c2p_step4(n[step], m[step]);
            x = f(n, m, step+1);
            if (x >= 0) return x;
            pop_state();
        }
        return -1;
    };

    function do_try(n, m, step) {
        if (canonical_representation([state[D0], state[D1], state[D2], state[D3]]) === expected_output) {
            return step;
        }
        if (step === max_steps) return -1;
        //if (step === 1) console.log('Still alive!');
        return try_ns(n, m, step, do_try);
    }

    n = new Array(max_steps);
    m = new Array(max_steps);
    state.reset();
    state[D0] = input[0];
    state[D1] = input[1];
    state[D2] = input[2];
    state[D3] = input[3];
    let res = try_ns(n, m, 0, do_try);
    if (res >= 0 && res <= max_steps) {
        return [n.slice(0, res), m.slice(0, res)];
    }
    throw new Error('Could not determine suitable C2P');
};

global.find_and_print_c2p = function(input, output) {
    input = input.map(const32);
    output = output.map(const32);
    let [n, m]    = find_4bit_c2p(input, output);
    let was_quiet = state.quiet;
    state.reset();
    state[D0] = input[0];
    state[D1] = input[1];
    state[D2] = input[2];
    state[D3] = input[3];
    state.quiet = false;
    state.print([D0,D1,D2,D3]);
    for (let step = 0; step < n.length; ++step) {
        c2p_step4(n[step], m[step]);
    }
    state.log('\n');
    state.print([D0,D1,D2,D3]);
    assert.equal(canonical_representation([state[D0],state[D1],state[D2],state[D3]]), canonical_representation(output));
    state.quiet = was_quiet;
    return [n, m];
};
