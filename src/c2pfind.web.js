window.onload = function() {
    require('./c2pfind');
    var preElem = document.createElement('pre');
    var text    = document.createTextNode('Ready.');
    preElem.appendChild(text);
    document.body.appendChild(preElem);
    state.writeline = function(msg) {
        text.textContent += msg;
        text.textContent += '\n';
    };
    document.getElementById('run').onclick = function() {
        function getvals(id) {
            var vals = document.getElementById(id).value.split('\n').filter(function(t) { return t.replace(/ /g, '').length>0; });
            if (vals.length !== 4) {
                console.log(vals);
                text.textContent = 'Invalid ' + id + ' (length=' + vals.length + '):\n' + vals.join('\n');
                return undefined;
            }
            return vals;
        };
        var input = getvals('input');
        var output = getvals('output');
        if (!input || !output) return;
        text.textContent = 'Running...\n';
        window.setTimeout(function () {
            text.textContent = '';
            try {
                find_and_print_c2p(input, output);
            } catch (e) {
                text.textContent += '\nFailed\n'+e+'\n';
            }
        }, 0);
    };
};
