window.onload = function() {
    require('./m68k_global');
    assert = require('assert');
    assert(true);
    state.quiet = false;

    let preElem = document.createElement('pre');
    let text    = document.createTextNode('Ready.');
    preElem.appendChild(text);
    document.body.appendChild(preElem);
    state.writeline = function(msg) {
        text.textContent += msg;
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
