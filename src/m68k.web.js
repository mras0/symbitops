window.onload = function() {
    require('./m68k_global');
    const { parse_lines, to_code } = require('./m68k_instructions');
    assert = require('assert');
    assert(true);
    state.quiet = false;

    print_cost = function(lines) {
        let total_cost = 0;
        let inst_words = 0;
        lines.forEach(function (line) {
            let i = line.instruction;
            if (i) {
                let cost = i.cost();
                let iwords = i.encode();
                let h = x => ('0000'+x.toString(16)).slice(-4).toUpperCase();
                state.log('\t'+(i+'                  ').substring(0,24)+'\t'+cost+'\t'+iwords.map(h).join(' '));
                total_cost += cost;
                inst_words += iwords.length;
            }
        });
        state.log('\tTotal (estimated) cost:\t' + total_cost + '\tInstruction words: ' + inst_words);
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
