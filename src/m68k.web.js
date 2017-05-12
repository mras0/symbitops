window.onload = function() {
    require('./m68k_global');
    const { parse_lines, to_code } = require('./m68k_instructions');
    assert = require('assert');
    assert(true);
    state.quiet = false;

    print_cost = function(lines) {
        let total_cost = 0;
        lines.forEach(function (line) {
            let i = line.instruction;
            if (i) {
                let cost = i.cost();
                state.log('\t'+(i+'                  ').substring(0,24)+'\t'+cost);
                total_cost += cost;
            }
        });
        state.log('\tTotal (estimated) cost: ' + total_cost);
    };


    let preElem = document.createElement('pre');
    let text    = document.createTextNode('Ready.');
    preElem.appendChild(text);
    document.body.appendChild(preElem);
    state.writeline = function(msg) {
        text.textContent += msg || '';
        text.textContent += '\n';
    };
    document.getElementById('run').onclick = function() {
        let code = document.getElementById('code').value;
        text.textContent = 'Running...\n';
        window.setTimeout(function () {
            text.textContent = '';
            try {
                state.reset();
                eval(code);
            } catch (e) {
                text.textContent += '\nFailed\n'+e+'\n';
            }
        }, 0);
    };
};
