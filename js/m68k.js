(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/":5}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":2,"inherits":3}],6:[function(require,module,exports){
//
// Bitval
//

const BITVAL_KNOWN0 = 0;
const BITVAL_KNOWN1 = 1;
const BITVAL_UNDEFINED = 2;

const BITVAL_STR_KNOWN0 = '..';
const BITVAL_STR_KNOWN1 = '!!';
const BITVAL_STR_UNDEFINED = '??';

const EXPR_MAX_VALS = 4;

class BitExpr {
    constructor(vals) {
        if (vals.length <= 1) {
            throw new Error('Internal error. BitExpr(' + vals + ')');
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
        } else if (typeof rhs !== 'string') {
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
        }if (typeof lhs === 'string' && typeof rhs == 'string') {
            return new AndExpr([lhs, rhs]);
        }
        throw new Error('Not implemented: AndExpr.calc(' + lhs + ', ' + rhs + ')');
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
            if (vs.length === 2 && vs[0] instanceof AndExpr && vs[0].vals.length === 2) {
                // X&Y^X
                if (vs[0].vals[0] === vs[1]) {
                    return n + '(' + vs[1] + '&~' + vs[0].vals[1] + ')';
                } else if (vs[0].vals[1] === vs[1]) {
                    return n + '(' + vs[1] + '&~' + vs[0].vals[0] + ')';
                }
            }
            // OR?
            if (vs.length === 3 && vs[0] instanceof AndExpr && vs[0].vals.length === 2 && vs[0].vals[0] === vs[1] && vs[0].vals[1] === vs[2]) {
                return n + '(' + vs[1] + '|' + vs[2] + ')';
            }
            return n + '(' + vs.join('^') + ')';
        }
    }

    and(rhs) {
        let vs = [];
        if (rhs === BITVAL_UNDEFINED) {
            return BITVAL_UNDEFINED;
        } else if (typeof rhs === 'string') {
            vs = this.vals.map(function (v) {
                return AndExpr.calc(v, rhs);
            });
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
        let res = vs.reduce(function (l, r) {
            return typeof l !== 'undefined' ? XorExpr.calc(l, r) : l;
        });
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
        return this.not().and(rhs.not()).not();
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
exports._BITVAL_KNOWN0 = BITVAL_KNOWN0;
exports._BITVAL_KNOWN1 = BITVAL_KNOWN1;
exports._BITVAL_UNDEFINED = BITVAL_UNDEFINED;

},{}],7:[function(require,module,exports){
const { Bitval } = require('./bitval');

//
// BitvalN
//

class BitvalN {
    constructor(nbits) {
        this.bit = new Array(nbits);
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
                v.bit[i] = new Bitval(val >>> i & 1);
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
        let v = new BitvalN(val.length / 2);
        for (let i = 0; i < v.nbits(); ++i) {
            v.bit[v.nbits() - 1 - i] = new Bitval(val.substr(i * 2, 2));
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
        for (let i = this.nbits() - 1; i >= 0; i--) {
            s += this.bit[i];
            if (i !== 0 && i % 8 === 0) s += ' ';
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
                res = (res | val << i) >>> 0;
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
            res.bit[i] = i < this.nbits() ? this.bit[i] : this.bit[this.nbits() - 1];
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
        let res = new BitvalN(this.nbits());
        let carry = new Bitval(0);
        for (let i = 0; i < this.nbits(); ++i) {
            let [carry1, sum1] = this.bit[i].half_add(rhs.bit[i]);
            let [carry2, sum2] = carry.half_add(sum1);
            res.bit[i] = sum2;
            carry = carry1.xor(carry2);
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
                res.bit[i] = this.bit[this.nbits() - 1];
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
            res.bit[i] = this.bit[(i + rhs + this.nbits()) % this.nbits()];
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

},{"./bitval":6}],8:[function(require,module,exports){
const { BitvalN, constN } = require('./bitvaln');

//
// Utils
//

const MAX_INSTRUCTION_LENGTH = 16;

function rightpad(str, len) {
    return (str + new Array(len).join(' ')).substring(0, len);
};

function nth_name(l) {
    if (l >= 26) return String.fromCharCode(65 + (l - 26));
    return String.fromCharCode(97 + l);
};

function defaultbits(l) {
    let n = '';
    for (i = 31; i >= 0; --i) {
        n += nth_name(l + 3 - Math.floor(i / 8)) + (i % 8).toString(10);
    }
    return BitvalN.named(n);
};

//
// State
//

let state = {
    quiet: true,
    all_registers: new Array(),
    writeline: console.log,
    mem: new Array()
};
state.find_register = function (name) {
    return this.all_registers.indexOf('' + name);
};
state.make_register = function (name) {
    if (this.find_register(name) === -1) {
        state[name] = new BitvalN(32);
        this.all_registers.push(name);
    }
    if (name[0] === 'D') {
        return {
            toString: function () {
                return name;
            },
            W: name,
            L: name + '.L'
        };
    } else {
        return name;
    }
};
state.log = function (msg) {
    if (this.quiet) return;
    this.writeline(msg);
};
state.print = function (regs) {
    if (typeof regs === 'undefined') {
        regs = this.all_registers;
    }
    regs.forEach(function (key) {
        this.log('\t; ' + key + ' = ' + this[key]);
    }, this);
};
state.reset = function () {
    this.all_registers.forEach(function (reg) {
        if (reg[0] == 'D') {
            this[reg] = defaultbits(parseInt(reg[1], 10) * 4);
        } else if (reg[0] == 'A') {
            this[reg] = BitvalN.constN(32, 0);
        } else {
            this[reg] = new BitvalN(32);
        }
    }, this);
    this.mem = new Array();
};

function get_size_postfix(size) {
    if (size === 32) {
        return '.L';
    } else if (size == 16) {
        return '.W';
    } else if (size == 8) {
        return '.B';
    } else if (typeof size === 'undefined') {
        return '';
    } else {
        throw new Error('Invalid operation size ' + size);
    }
}

state.log_instruction = function (name, sizestr, operands, result) {
    if (typeof result === 'undefined') {
        result = '';
    } else {
        result = '\t; ' + result;
    }
    this.log('\t' + name + sizestr + '\t' + rightpad(operands, MAX_INSTRUCTION_LENGTH) + result);
};

state.access_mem = function (size, addr, val) {
    let a = addr.real_value();
    let as = typeof a === 'undefined' ? addr.toString() : '$' + a.toString(16);

    if (size > 8 && addr.get(1).real_value() == 1) {
        throw new Error((typeof val === 'undefined' ? 'Read' : 'Write') + ' of size ' + size + ' to known odd address ' + as);
    }

    if (typeof val === 'undefined') {
        if (typeof a !== 'undefined') {
            let s = this;
            let warned = false;
            function readmem(a) {
                if (typeof s.mem[a] === 'undefined') {
                    if (!warned) {
                        s.log('Read of size ' + size + ' from unintialized memory at ' + a);
                        warned = true;
                    }
                    return new BitvalN(8);
                } else {
                    return s.mem[a];
                }
            };
            if (size === 32) {
                return const32(0).set(readmem(a)).lsl(8).set(readmem(a + 1)).lsl(8).set(readmem(a + 2)).lsl(8).set(readmem(a + 3));
            } else if (size == 16) {
                return const16(0).set(readmem(a)).lsl(8).set(readmem(a + 1));
            } else {
                return readmem(a);
            }
        }
        this.log('Read of size ' + size + ' from ' + as + ' returning undefined');
        return new BitvalN(size);
    } else if (val instanceof BitvalN) {
        if (typeof a !== 'undefined') {
            if (size === 32) {
                this.mem[a] = val.lsr(24).get(8);
                this.mem[a + 1] = val.lsr(16).get(8);
                this.mem[a + 2] = val.lsr(8).get(8);
                this.mem[a + 3] = val.get(8);
                return;
            } else if (size === 16) {
                this.mem[a] = val.lsr(8).get(8);
                this.mem[a + 1] = val.get(8);
            } else {
                this.mem[a] = val;
            }
            return;
        }
        this.log('Ignoring write of size ' + size + ' to ' + as + ' (value: ' + val + ')');
    } else {
        throw new Error('Invalid argument to mem: ' + val);
    }
};

state.calc_ea = function (name, size) {
    if (name[0][0] !== 'A') throw new Error('Invalid address: [' + name.join() + ']');
    let addr = this[name[0]];
    if (name.length >= 2) {
        if (name[1][0] === '+') {
            if (typeof size !== 'number') throw new Error('Invalid size in calc_ea([' + name.join() + ']: ' + size);
            this[name[0]] = this[name[0]].add(const32(size / 8));
        } else if (name[1][0] === '-') {
            if (typeof size !== 'number') throw new Error('Invalid size in calc_ea([' + name.join() + ']: ' + size);
            this[name[0]] = this[name[0]].sub(const32(size / 8));
            addr = this[name[0]];
        } else if (typeof name[1] === 'number') {
            addr = addr.add(BitvalN.constN(32, name[1]));
        } else {
            let o = name[1] + '';
            if (o.slice(-2) === '.L') {
                addr = addr.add(this[o.slice(0, 2)]);
            } else {
                addr = addr.add(this[o].get(16).sign_extend(32));
            }
            if (typeof name[2] === 'number') {
                addr = addr.add(BitvalN.constN(32, name[2]));
            }
        }
    }
    return addr;
};

state.do_ea = function (size, name) {
    let s = this;
    if (name.constructor === Array && name.length >= 1 && name.length <= 3) {
        let addr = this.calc_ea(name, size);
        return function (val) {
            return s.access_mem(size, addr, val);
        };
    }

    if (typeof name !== 'string' && typeof name.W !== 'string') {
        throw new Error('Not implemented: get_ea(' + JSON.stringify(name) + ')');
    }
    return function (val) {
        if (typeof val === 'undefined') {
            return s[name].get(size);
        } else if (val instanceof BitvalN) {
            if (size != val.nbits()) throw new Error('Internal error: ' + size + ' != ' + val.nbits());
            s[name] = s[name].set(val);
        } else {
            throw new Error('Invalid argument to ea(' + name + '): ' + val);
        }
    };
};

function format_ea(ea) {
    if (ea.constructor !== Array) return ea;
    if (ea.length === 1) return '(' + ea[0] + ')';
    if (ea[1] === '+') return '(' + ea[0] + ')+';
    if (ea[1] === '-') return '-(' + ea[0] + ')';
    return '(' + ea[0] + ',' + ea[1] + ')';
};

function format_res(dst, res) {
    return typeof dst === 'string' ? state[dst] : res;
};

state.do_unary_op = function (name, size, dst, f) {
    let sizestr = '';
    if (typeof size === 'undefined') {
        size = 32;
    } else {
        sizestr = get_size_postfix(size);
    }
    let dst_ea = this.do_ea(size, dst);
    let dst_str = format_ea(dst);
    let res = f(dst_ea);
    if (!(res instanceof BitvalN)) {
        throw new Error('Internal error: ' + name + sizestr + ' ' + dst_str + ' returned undefined!');
    }
    dst_ea(res);
    this.log_instruction(name, sizestr, dst_str, dst_str + ' = ' + format_res(dst, res));
};

state.do_binary_op = function (name, size, src, dst, f) {
    let srctext = '';
    let sizestr = '';
    if (typeof size === 'undefined') {
        size = 32;
    } else {
        sizestr = get_size_postfix(size);
    }

    if (typeof src === 'number') {
        srctext = '#$' + src.toString(16);
        src = BitvalN.constN(size, src);
    } else if (this.find_register(src) !== -1 || src.constructor === Array) {
        srctext = format_ea(src);
        src = this.do_ea(size, src)();
    } else {
        srctext = '#magic';
        src = BitvalN.constN(size, 0).set(BitvalN.named(src));
    }
    let dst_ea = this.do_ea(size, dst);
    let dst_str = format_ea(dst);
    let res = f(src, dst_ea);
    if (!(res instanceof BitvalN)) {
        throw new Error('Internal error: ' + name + sizestr + ' ' + srctext + ', ' + dst_str + ' returned undefined!');
    }
    dst_ea(res);
    this.log_instruction(name, sizestr, srctext + ', ' + dst_str, dst_str + ' = ' + format_res(dst, res));
};

function make_normal_unary_op(name, f) {
    var func = function (dst) {
        state.do_unary_op(name, 16, dst, f);
    };
    func.B = function (dst) {
        state.do_unary_op(name, 8, dst, f);
    };
    func.W = func;
    func.L = function (dst) {
        state.do_unary_op(name, 32, dst, f);
    };
    exports[name] = func;
    return func;
}

function make_normal_binary_op(name, f, src_check) {
    var func = function (src, dst) {
        if (src_check) src_check(name, src);
        state.do_binary_op(name, 16, src, dst, f);
    };
    func.B = function (src, dst) {
        if (src_check) src_check(name, src);
        state.do_binary_op(name, 8, src, dst, f);
    };
    func.W = func;
    func.L = function (src, dst) {
        if (src_check) src_check(name, src);
        state.do_binary_op(name, 32, src, dst, f);
    };
    exports[name] = func;
    return func;
};

function check_immediate(name, val, min_allowed, max_allowed) {
    if (typeof val !== 'number' || val < min_allowed || val > max_allowed) {
        throw new Error('Immediate out of range (' + min_allowed + ' - ' + max_allowed + ') for ' + name + ': ' + val);
    }
};

function check_small_arg(name, val) {
    if (typeof val === 'number') {
        // immediate
        check_immediate(name, val, 1, 8);
    } else if (state.find_register(val) !== -1) {
        // register OK
    } else {
        throw new Error('Invalid argument to ' + name + ': ' + val);
    }
};

//
// State and helpers
//

exports.state = state;

exports.const8 = function (val) {
    return BitvalN.constN(8, val);
};
exports.const16 = function (val) {
    return BitvalN.constN(16, val);
};
exports.const32 = function (val) {
    return BitvalN.constN(32, val);
};

//
// Instructions
//
make_normal_binary_op('MOVE', function (src, dst) {
    return src;
});
make_normal_binary_op('OR', function (src, dst) {
    return dst().or(src);
});
make_normal_binary_op('AND', function (src, dst) {
    return dst().and(src);
});
make_normal_binary_op('EOR', function (src, dst) {
    return dst().xor(src);
});
make_normal_binary_op('ADD', function (src, dst) {
    return dst().add(src);
});
make_normal_binary_op('SUB', function (src, dst) {
    return dst().sub(src);
});
make_normal_binary_op('ADDQ', function (src, dst) {
    return dst().add(src);
}, check_small_arg);
make_normal_binary_op('SUBQ', function (src, dst) {
    return dst().sub(src);
}, check_small_arg);
make_normal_binary_op('LSR', function (src, dst) {
    return dst().lsr(src.get(6));
}, check_small_arg);
make_normal_binary_op('LSL', function (src, dst) {
    return dst().lsl(src.get(6));
}, check_small_arg);
make_normal_binary_op('ASR', function (src, dst) {
    return dst().asr(src.get(6));
}, check_small_arg);
make_normal_binary_op('ASL', function (src, dst) {
    return dst().asl(src.get(6));
}, check_small_arg);
make_normal_binary_op('ROR', function (src, dst) {
    return dst().ror(src.get(6));
}, check_small_arg);
make_normal_binary_op('ROL', function (src, dst) {
    return dst().rol(src.get(6));
}, check_small_arg);
make_normal_unary_op('NOT', function (dst) {
    return dst().not();
});
make_normal_unary_op('NEG', function (dst) {
    return dst().neg();
});
make_normal_unary_op('CLR', function (dst) {
    dst = dst();return BitvalN.constN(dst.nbits(), 0);
});
make_normal_unary_op('EXT', function (dst) {
    dst = dst();return dst.get(dst.nbits() / 2).sign_extend(dst.nbits());
});
delete exports.EXT.B; // EXT.B is not legal

// Instructions that require special handling

exports.MOVEQ = function (src, dst) {
    check_immediate('MOVEQ', src, -128, 127);
    state.do_binary_op('MOVEQ', undefined, src, dst, function (s, d) {
        return BitvalN.constN(8, src).sign_extend(32);
    });
};
exports.MOVEQ.L = exports.MOVEQ;

exports.SWAP = function (dst) {
    return state.do_unary_op('SWAP', undefined, dst, function (dst) {
        return dst().rotate(16);
    });
};
exports.SWAP.W = exports.SWAP;

exports.EXG = function (src, dst) {
    let a = state[src];
    if (!(a instanceof BitvalN)) throw new Error('Invalid operand to EXG: ' + src);
    let b = state[dst];
    if (!(b instanceof BitvalN)) throw new Error('Invalid operand to EXG: ' + dst);
    state[src] = b;
    state[dst] = a;
    state.log_instruction('EXG', '', src + ', ' + dst);
};
exports.EXG.L = exports.EXG;

exports.LEA = function (src, dst) {
    state[dst] = state.calc_ea(src);
    state.log_instruction('LEA', '', format_ea(src) + ', ' + dst, dst + ' = ' + state[dst]);
};
exports.LEA.L = exports.LEA;

//
// Registers
//
exports.D0 = state.make_register('D0');
exports.D1 = state.make_register('D1');
exports.D2 = state.make_register('D2');
exports.D3 = state.make_register('D3');
exports.D4 = state.make_register('D4');
exports.D5 = state.make_register('D5');
exports.D6 = state.make_register('D6');
exports.D7 = state.make_register('D7');
exports.A0 = state.make_register('A0');
exports.A1 = state.make_register('A1');
exports.A2 = state.make_register('A2');
exports.A3 = state.make_register('A3');
exports.A4 = state.make_register('A4');
exports.A5 = state.make_register('A5');
exports.A6 = state.make_register('A6');
exports.A7 = state.make_register('A7');
state.reset();

},{"./bitvaln":7}],9:[function(require,module,exports){
window.onload = function () {
    require('./m68k_global');
    const { parse_lines, to_code } = require('./m68k_instructions');
    assert = require('assert');
    assert(true);
    state.quiet = false;

    print_cost = function (lines) {
        let total_cost = 0;
        let inst_words = 0;
        lines.forEach(function (line) {
            let i = line.instruction;
            if (i) {
                let cost = i.cost();
                let iwords = i.encode();
                let h = x => ('0000' + x.toString(16)).slice(-4).toUpperCase();
                state.log('\t' + (i + '                  ').substring(0, 24) + '\t' + cost + '\t' + iwords.map(h).join(' '));
                total_cost += cost;
                inst_words += iwords.length;
            }
        });
        state.log('\tTotal (estimated) cost:\t' + total_cost + '\tInstruction words: ' + inst_words);
    };

    let preElem = document.createElement('pre');
    let text = document.createTextNode('Ready.');
    preElem.appendChild(text);
    document.body.appendChild(preElem);
    state.writeline = function (msg) {
        text.textContent += msg || '';
        text.textContent += '\n';
    };
    document.getElementById('run').onclick = function () {
        let code = document.getElementById('code').value;
        text.textContent = 'Running...\n';
        window.setTimeout(function () {
            text.textContent = '';
            try {
                state.reset();
                eval(code);
            } catch (e) {
                text.textContent += '\nFailed\n' + e + '\n';
            }
        }, 0);
    };
};

},{"./m68k_global":10,"./m68k_instructions":11,"assert":1}],10:[function(require,module,exports){
(function (global){
const m68k = require('./m68k.js');
const assert = require('assert');

//
// Move all m68k exports to global scope
//
for (let key in m68k) {
    assert.equal(typeof global[key], 'undefined');
    global[key] = m68k[key];
}

//
// Add temp register(s)
//
global.T0 = state.make_register('T0');
global.T1 = state.make_register('T1');

//
// Convenience C2P functions
//
global.swap_and_merge = function (a, b, n, t) {
    if (n == 16) {
        SWAP(b);
        EOR.W(a, b);
        EOR.W(b, a);
        EOR.W(a, b);
        SWAP(b);
        return;
    }

    let mask = 0;
    if (n === 1) mask = 0x55555555;else if (n === 2) mask = 0x33333333;else if (n === 4) mask = 0x0F0F0F0F;else if (n === 8) mask = 0x00FF00FF;
    //else if (n === 16) mask = 0x0000FFFF;
    else throw new Error("Invalid swap valud " + n);
    if (typeof t === 'undefined') t = T0;
    MOVE.L(b, t);
    LSR.L(n, t);
    EOR.L(a, t);
    AND.L(mask, t);
    EOR.L(t, a);
    if (n == 1) {
        ADD.L(t, t);
    } else {
        LSL.L(n, t);
    }
    EOR.L(t, b);
};

global.c2p_step8 = function (n, m) {
    state.log('\n\t; ' + n + 'x' + m);
    if (m === 1) {
        swap_and_merge(D0, D1, n);
        swap_and_merge(D2, D3, n);
        swap_and_merge(D4, D5, n);
        swap_and_merge(D6, D7, n);
    } else if (m == 2) {
        swap_and_merge(D0, D2, n);
        swap_and_merge(D1, D3, n);
        swap_and_merge(D4, D6, n);
        swap_and_merge(D5, D7, n);
    } else if (m == 4) {
        swap_and_merge(D0, D4, n);
        swap_and_merge(D1, D5, n);
        swap_and_merge(D2, D6, n);
        swap_and_merge(D3, D7, n);
    } else {
        throw new Error('Invalid m value (must be 1, 2 or 4): ' + m);
    }
};

global.c2p_step4 = function (n, m) {
    state.log('\n\t; ' + n + 'x' + m);
    if (m === 1) {
        swap_and_merge(D0, D1, n, D4);
        swap_and_merge(D2, D3, n, D4);
    } else if (m === 2) {
        swap_and_merge(D0, D2, n, D4);
        swap_and_merge(D1, D3, n, D4);
    } else {
        throw new Error('Invalid m value (must be 1 or 2): ' + m);
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./m68k.js":8,"assert":1}],11:[function(require,module,exports){
// TODO:
//          Labels (to allow real instruction encoding)
//          Code for register lists

const assert = require('assert');

const re_comment_str = '^\\s*([*;].*)$';
const re_symbol_str = '[A-Za-z.][0-9A-Za-z.$_]*';
const re_label_str = '^(' + re_symbol_str + '(?::)?)\\s*|^\\s*(' + re_symbol_str + ':)\\s*';
const re_size_postfix = '(?:\\.[bBwWlLsS])?';
const re_operation_str = '^\\s*([A-Za-z][0-9A-Za-z]*' + re_size_postfix + ')';
const re_operand_sep_str = '^(\\s*,\\s*)';
const re_anyreg_str = '(?:[dD][0-7]|[aA][0-7])';
const re_reginterval_str = '(?:' + re_anyreg_str + '-' + re_anyreg_str + ')';
const re_reglist_atom_str = '(?:' + re_reginterval_str + '|' + re_anyreg_str + ')';
const re_reglist_str = re_reglist_atom_str + '(?:/' + re_reglist_atom_str + ')*';
const re_comment = new RegExp(re_comment_str);
const re_label = new RegExp(re_label_str);
const re_operation = new RegExp(re_operation_str);
const re_operand_sep = new RegExp(re_operand_sep_str);
const re_reglist = new RegExp('^(' + re_reglist_str + ')');

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
        return [line.slice(m.index + m[0].length), matched_val];
    }
    return [line, undefined];
};

function must_parse(line, re) {
    let res = try_parse(line, re);
    if (!res[1]) throw new Error('Could not match "' + re + '" with "' + line + '"');
    return res;
};

const condition_codes = ['T', // %0000 True                1
'F', // %0001 False               0
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
'LE'];

function op_size_bits(size) {
    if (size === 'L') return 0b10;
    if (size === 'W') return 0b01;
    if (size === 'B') return 0b00;
    throw new Error('Invalid operand size ' + size);
}

const OP_DREG = 0x0001; // Dn
const OP_AREG = 0x0002; // An
const OP_INDIRECT = 0x0004; // (An)
const OP_POSTINCR = 0x0008; // (An)+
const OP_PREINCR = 0x0010; // -(An)
const OP_DISP16 = 0x0020; // d16(An)
const OP_INDEX = 0x0040; // d8(An,ix)
const OP_ABSW = 0x0080; // xxx.W
const OP_ABSL = 0x0100; // xxx.L
const OP_DISP16PC = 0x0200; // d16(PC)
const OP_INDEXPC = 0x0400; // d8(PC,ix)
const OP_IMMEDIATE = 0x0800; // #immediate
const OP_REGLIST = 0x1000; // register list (for MOVEM)
const OP_EA = 0x07FC; // All except immediate/areg/dreg

function op_type_str(type) {
    let s = [];
    if (type & OP_DREG) s.push('DREG');
    if (type & OP_AREG) s.push('AREG');
    if (type & OP_INDIRECT) s.push('INDIRECT');
    if (type & OP_POSTINCR) s.push('POSTINCR');
    if (type & OP_PREINCR) s.push('PREINCR');
    if (type & OP_DISP16) s.push('DISP16');
    if (type & OP_INDEX) s.push('INDEX');
    if (type & OP_ABSW) s.push('ABSW');
    if (type & OP_ABSL) s.push('ABSL');
    if (type & OP_DISP16PC) s.push('DISP16PC');
    if (type & OP_INDEXPC) s.push('INDEXPC');
    if (type & OP_IMMEDIATE) s.push('IMMEDIATE');
    if (type & OP_REGLIST) s.push('REGLIST');
    if (s.length == 0) {
        return 'Unknown<' + type + '>';
    }
    return s.join('|');
};

function parse_reglist(reglist) {
    let regs = [];
    reglist.toUpperCase().split('/').forEach(function (r) {
        let split = r.indexOf('-');
        if (split === -1) {
            regs.push(r);
        } else {
            let f = r.substring(0, split);
            let fi = f[1] - '0';
            let l = r.substring(split + 1);
            let li = l[1] - '0';
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
        if (typeof val !== 'number') throw new Error('Invalid literal "' + val + '"');
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
        if (typeof val !== 'string') throw new Error('Invalid symbol "' + val + '"');
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
        return '-' + this.e.toString();
    }

    value() {
        return -this.e.value();
    }
};

operator_finished = {
    precedence: 1000,
    calc: undefined
};

operators = {
    // 5
    '*': {
        precedence: 5,
        calc: function (l, r) {
            return l * r;
        }
    },
    '/': {
        precedence: 5,
        calc: function (l, r) {
            return l / r;
        }
    },
    // 6
    '+': {
        precedence: 6,
        calc: function (l, r) {
            return l + r;
        }
    },
    '-': {
        precedence: 6,
        calc: function (l, r) {
            return l - r;
        }
    }
};

class BinExpr extends Expr {
    constructor(op, l, r) {
        super();
        this.op = op;
        this.l = l;
        this.r = r;
    }

    precedence() {
        return operators[this.op].precedence;
    }

    toString() {
        let l = this.l.toString();
        let r = this.r.toString();
        if (this.l.precedence() > this.precedence()) l = '(' + l + ')';
        if (this.r.precedence() > this.precedence()) r = '(' + r + ')';
        return l + this.op + r;
    }

    value() {
        return operators[this.op].calc(this.l.value(), this.r.value());
    }
};

function skip_leading_space(line) {
    return line.replace(/^\s+/, '');
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
    throw new Error('Not implemented parse_expr("' + line + '"');
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
            mask |= 1 << i + 8;
        }
    });
    return mask;
};

function count_set_bits(mask) {
    let c = 0;
    for (; mask; mask >>= 1) {
        c += mask & 1;
    }
    return c;
};

function reverse_mask(mask) {
    let r = 0;
    for (let i = 0; i < 16; ++i) {
        if (mask >> i & 1) {
            r |= 1 << 15 - i;
        }
    }
    return r;
};

function reglist_string(m) {
    const names = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];
    let last = -1;
    let r = '';
    for (let b = 0; b < 15; ++b) {
        if (m & 1 << b) {
            if (last === -1) {
                last = b;
            }
        } else if (last !== -1) {
            if (r.length) r += '/';
            r += names[last];
            if (b - last > 1) {
                r += '-' + names[b - 1];
            }
            last = -1;
        }
    }
    assert.equal(last, -1); // handle a7 being part of run some day
    return r;
};

BASE_COST = 4;

class Operand {
    constructor(type, val) {
        if (typeof type !== 'number' || type === 0 || (type & type - 1) !== 0) {
            throw new Error('Invalid operand type ' + op_type_str(type));
        }
        this.type = type;
        this.val = val;
    }

    toString() {
        switch (this.type) {
            case OP_DREG:
                return 'D' + this.val;
            case OP_AREG:
                return 'A' + this.val;
            case OP_INDIRECT:
                return '(A' + this.val + ')';
            case OP_POSTINCR:
                return '(A' + this.val + ')+';
            case OP_PREINCR:
                return '-(A' + this.val + ')';
            case OP_DISP16:
                return this.val[0] + '(A' + this.val[1] + ')';
            case OP_INDEX:
                return this.val[0] + '(A' + this.val[1] + ',D' + this.val[2] + ')';
            case OP_ABSW:
            case OP_ABSL:
                return this.val.toString();
            case OP_DISP16PC:
                return this.val[0] + '(PC)';
            case OP_INDEXPC:
                return this.val[0] + '(PC,D' + this.val[1] + ')';
            case OP_IMMEDIATE:
                return '#' + this.val.toString();
            case OP_REGLIST:
                return reglist_string(this.val);
        }
        throw new Error('Operand.toString not implemented for ' + op_type_str(this.type));
    }

    cost(size) {
        switch (this.type) {
            case OP_DREG:
            case OP_AREG:
                return 0;
            case OP_INDIRECT:
            case OP_POSTINCR:
                return size === 'L' ? 8 : 4;
            case OP_PREINCR:
                return size === 'L' ? 10 : 6;
            case OP_DISP16PC:
            case OP_DISP16:
                return size === 'L' ? 12 : 8;
            case OP_INDEXPC:
            case OP_INDEX:
                return size === 'L' ? 14 : 10;
            case OP_ABSW:
                return size === 'L' ? 12 : 8;
            case OP_ABSL:
                return size === 'L' ? 16 : 12;
            case OP_IMMEDIATE:
                return size === 'L' ? 2 * BASE_COST : BASE_COST;
        }
        throw new Error('Operand.cost not implemented for ' + op_type_str(this.type) + ' size ' + size);
    }

    // returns [mode, reg, extra words...]
    encoding(size) {
        assert(size === 'L' || size === 'W' || size === 'B', 'size="' + size + '"');
        // Extension word 15:D/A | 12:REGISTER{2..0} | 11:W/L | 8:0{2..0} | 0:Displacement{7..0}
        switch (this.type) {
            case OP_DREG:
                return [0b000, this.val];
            case OP_AREG:
                return [0b001, this.val];
            case OP_INDIRECT:
                return [0b010, this.val];
            case OP_POSTINCR:
                return [0b011, this.val];
            case OP_PREINCR:
                return [0b100, this.val];
            case OP_DISP16:
                return [0b101, this.val[1], this.val[0].value() & 0xffff];
            case OP_INDEX:
                return [0b110, this.val[1], this.val[2] << 12 | this.val[0].value() & 0xff];
            case OP_ABSW:
                break;
            case OP_ABSL:
                {
                    let val = this.val.value();
                    return [0b111, 0b001, val >> 16 & 0xfffff, val & 0xffff];
                }
            case OP_DISP16PC:
                return [0b111, 0b010, this.val[0].value() - 2 & 0xffff];
            case OP_INDEXPC:
                return [0b111, 0b011, this.val[1] << 12 | this.val[0].value() - 2 & 0xff];
            case OP_IMMEDIATE:
                {
                    let val = this.val.value();
                    if (size === 'L') {
                        val = [val >> 16 & 0xfffff, val & 0xffff];
                    } else if (size === 'W') {
                        val = [val & 0xffff];
                    } else {
                        val = [val & 0xff];
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
            return typeof l === 'undefined' || l.match(/^(\s|[,*;]|$)/);
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
        let offset = new LitExpr(0);
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
        let indir = line.substring(1, end_pos);
        let args = indir.replace(/\s/g, '').toUpperCase().split(',');
        // Hack: handle PC as A8 here...
        let pcidx = args.indexOf('PC');
        if (pcidx !== -1) {
            args[pcidx] = 'A8';
        }
        args = args.sort();
        if (args.length < 1 || args.length > 2 || args[0].length !== 2 || args[0][0] !== 'A' || args.length > 2 && (args[1].length !== 2 || args[1].length !== 4) && args[1][0] !== 'D') {
            console.log(offset);
            console.log(args);
            throw new Error('Invalid operand ' + origline);
        }
        line = line.substring(end_pos + 1);
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
    }
};

function arit_cost(size, ops) {
    let cost = ops[0].cost(size) + ops[1].cost(size);
    if (size === 'L') {
        if ((ops[1].type === OP_DREG || ops[1].type === OP_AREG) && ops[0].type & (OP_DREG | OP_AREG | OP_IMMEDIATE)) {
            cost += 8;
        } else {
            cost += 6;
        }
        return cost;
    } else {
        assert(size === 'W' || size === 'B');
        return cost + BASE_COST;
    }
    throw new Error('Not implemented. Size ' + size + ' ' + ops.join(' ,'));
}

let standard_sizes = ['W', 'L', 'B'];

function default_un_encoding(size, ops, opcode) {
    let ea = ops[0].encoding(size);
    return [opcode | op_size_bits(size) << 6 | ea[0] << 3 | ea[1]].concat(ea.slice(2));
};

function default_un_op(opcode) {
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_EA | OP_DREG],
        cost: function (size, ops) {
            if (ops[0].type === OP_DREG || ops[0].type === OP_AREG) {
                return size === 'L' ? 6 : 4;
            } else {
                return (size === 'L' ? 12 : 8) + ops[0].cost(size);
            }
        },
        encode: function (size, ops) {
            return default_un_encoding(size, ops, opcode);
        }
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
        if (size === 'L') ea.splice(2, 0, imm >> 16 & 0xffff, imm & 0xffff);else if (size === 'W') ea.splice(2, 0, imm & 0xffff);else ea.splice(2, 0, imm & 0xff);
    } else if (ops[1].type === OP_AREG) {
        mode = size === 'L' ? 0b111 : 0b011;
        op |= ops[1].val << 9;
        ea = ops[0].encoding(size);
    } else if (ops[1].type === OP_DREG && immediate_op !== 0x0a00) {
        // Special case for EOR...
        op |= ops[1].val << 9;
        ea = ops[0].encoding(size);
    } else {
        assert(ops[0].type === OP_DREG);
        op |= ops[0].val << 9;
        mode |= 0b100;
        ea = ops[1].encoding(size);
    }
    return [op | mode << 6 | ea[0] << 3 | ea[1]].concat(ea.slice(2));
};

function default_bin_op(normal_op, immediate_op) {
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_IMMEDIATE | OP_EA | OP_DREG, OP_EA | OP_DREG],
        cost: arit_cost,
        encode: function (size, ops) {
            return default_bin_encoding(size, ops, normal_op, immediate_op);
        }
    };
};

function add_sub_op(normal_op, immediate_op) {
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_IMMEDIATE | OP_EA | OP_DREG | OP_AREG, OP_EA | OP_DREG | OP_AREG],
        cost: function (size, ops) {
            var cost = arit_cost(size, ops);
            return size !== 'L' && ops[1].type === OP_AREG ? BASE_COST + cost : cost;
        },
        encode: function (size, ops) {
            return default_bin_encoding(size, ops, normal_op, immediate_op);
        }
    };
};

function add_sub_x_op(base_op) {
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_DREG, OP_DREG],
        cost: function (size, ops) {
            return size === 'L' ? 2 * BASE_COST : BASE_COST;
        },
        encode: function (size, ops) {
            const rm = 0; // rm: 0=register/1=memory
            assert.equal(ops[0].type, OP_DREG);
            assert.equal(ops[1].type, OP_DREG);
            return [base_op | ops[1].val << 9 | op_size_bits(size) << 6 | ops[0].val];
        }
    };
};

function add_sub_q_op(is_sub) {
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_IMMEDIATE, OP_EA | OP_DREG | OP_AREG],
        cost: function (size, ops) {
            var cost = ops[1].cost(size);
            if (size === 'L') {
                if (ops[1].type == OP_DREG || ops[1].type == OP_AREG) return 2 * BASE_COST;
                return 3 * BASE_COST + cost;
            } else {
                return ops[1].type == OP_DREG ? BASE_COST : 2 * BASE_COST + cost;
            }
        },
        encode: function (size, ops) {
            let dst = ops[1].encoding(size);
            return [0x5000 | (ops[0].val & 7) << 9 | is_sub << 8 | op_size_bits(size) << 6 | dst[0] << 3 | dst[1]].concat(dst.slice(2));
        }
    };
};

function default_rot_op(base_op, dr) {
    // dr: 0=right/1=left
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_IMMEDIATE | OP_DREG, OP_EA | OP_DREG],
        cost: function (size, ops) {
            let n = 1; // Assume shift of 1
            if (ops[0].type === OP_IMMEDIATE) {
                n = ops[0].immediate_value();
            }
            if (ops[1].type !== OP_DREG) {
                throw new Error('Not implemented ' + ops[1]);
            }
            return size === 'L' ? 8 + 2 * n : 6 + 2 * n;
        },
        encode: function (size, ops) {
            const ir = ops[0].type !== OP_IMMEDIATE;
            assert.equal(ops[1].type, OP_DREG);
            return [base_op | ((ir ? ops[0].val : ops[0].immediate_value()) & 0x7) << 9 | dr << 8 | op_size_bits(size) << 6 | ir << 5 | ops[1].val];
        }
    };
};

function default_bit_op(opbits, bcost, lcost) {
    return {
        allowed_sizes: ['L', 'B'],
        operands: [OP_DREG | OP_IMMEDIATE, OP_EA | OP_DREG],
        cost: function (size, ops) {
            var dyn = ops[0].type === OP_IMMEDIATE;
            return ops[1].cost(size) + BASE_COST * dyn + (size === 'L' ? lcost : bcost);
        },
        handle_size: function (ops) {
            return ops[1].type == OP_DREG ? 'L' : 'B';
        },
        encode: function (size, ops) {
            let ea = ops[1].encoding(size);
            if (ops[0].type === OP_IMMEDIATE) {
                return [opbits | 1 << 11 | ea[0] << 3 | ea[1], ops[0].immediate_value()].concat(ea.slice(2));
            } else {
                assert(ops[0].type === OP_DREG);
                return [opbits | ops[0].val << 9 | 1 << 8 | ea[0] << 3 | ea[1]].concat(ea.slice(2));
            }
        }
    };
};

function mul_div_op(baseop, maxcost) {
    return {
        allowed_sizes: standard_sizes,
        operands: [OP_IMMEDIATE | OP_EA | OP_DREG, OP_DREG],
        cost: function (size, ops) {
            return maxcost + ops[0].cost(size) + ops[1].cost(size);
        },
        encode: function (size, ops) {
            assert.equal(size, 'W');
            assert.equal(ops[1].type, OP_DREG);
            let ea = ops[0].encoding(size);
            return [baseop | ops[1].val << 9 | ea[0] << 3 | ea[1]].concat(ea.slice(2));
        }
    };
};

function branch_op(cc_index) {
    return {
        allowed_sizes: ['W', 'B'], // Bcc.L is 020+ only
        operands: [OP_ABSW | OP_ABSL],
        cost: function (size, ops) {
            // .B -> 10 taken, 8 not taken
            // .W -> 10 taken, 12 not taken
            return 10;
        },
        encode: function (size, ops) {
            let op = 0x6000 | cc_index << 8;
            let disp = -2;
            return size === 'B' ? [op | disp & 0xff] : [op, disp & 0xffff];
        }
    };
};

let instruction_info = {
    // Data movement instructions
    'EXG': {
        allowed_sizes: ['L'],
        operands: [OP_DREG | OP_AREG, OP_DREG | OP_AREG],
        cost: function (size, ops) {
            return 6;
        },
        encode: function (size, ops) {
            return [0xc140 | ops[0].val << 9 | ops[1].val];
        }
    },
    'MOVE': {
        allowed_sizes: standard_sizes,
        operands: [OP_IMMEDIATE | OP_EA | OP_DREG | OP_AREG, OP_DREG | OP_AREG | OP_EA],
        cost: function (size, ops) {
            if (ops[1].type === OP_PREINCR) {
                // HACK
                return (size === 'L' ? 12 : 8) + ops[0].cost(size);
            }
            return BASE_COST + ops[0].cost(size) + ops[1].cost(size);
        },
        encode: function (size, ops) {
            let src = ops[0].encoding(size);
            let dst = ops[1].encoding(size);
            let op = size === 'L' ? 0x2000 : size === 'B' ? 0x1000 : 0x3000;
            return [op | dst[1] << 9 | dst[0] << 6 | src[0] << 3 | src[1]].concat(src.slice(2)).concat(dst.slice(2));
        }
    },
    'MOVEQ': {
        allowed_sizes: ['L'],
        operands: [OP_IMMEDIATE, OP_DREG],
        cost: function (size, ops) {
            return BASE_COST;
        },
        encode: function (size, ops) {
            return [0x7000 | ops[1].val << 9 | ops[0].immediate_value() & 0xff];
        }
    },
    'MOVEM': {
        allowed_sizes: ['W', 'L'],
        operands: [OP_EA | OP_REGLIST, OP_EA | OP_REGLIST],
        cost: function (size, ops) {
            let basecost = undefined;
            let nregs = undefined;
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
        encode: function (size, ops) {
            let op = 0x4880 | (size === 'L') << 6;
            let ea = undefined;
            let mask = undefined;
            if (ops[0].type == OP_REGLIST) {
                // R --> M
                mask = reverse_mask(ops[0].val);
                ea = ops[1].encoding(size);
            } else {
                // M --> R
                assert.equal(ops[1].type, OP_REGLIST);
                mask = ops[1].val;
                ea = ops[0].encoding(size);
                op |= 1 << 10; // set dr
            }
            return [op | ea[0] << 3 | ea[1], mask].concat(ea.slice(2));
        }
    },
    'LEA': {
        allowed_sizes: ['L'],
        operands: [OP_EA, OP_AREG],
        cost: function (size, ops) {
            let t = ops[0].type;
            switch (t) {
                case OP_INDIRECT:
                    return 4;
                case OP_DISP16PC:
                case OP_DISP16:
                    return 8;
                case OP_INDEXPC:
                case OP_INDEX:
                    return 12;
                case OP_ABSW:
                    return 8;
                case OP_ABSL:
                    return 12;
            }
            throw new Error('cost for LEA not implemented for address mode ' + ops[0]);
        },
        encode: function (size, ops) {
            let ea = ops[0].encoding(size);
            assert(ops[1].type === OP_AREG);
            return [0x41c0 | ops[1].val << 9 | ea[0] << 3 | ea[1]].concat(ea.slice(2));
        }
    },

    // Integer arithmetic instructions
    'ADD': add_sub_op(0xD000, 0x0600),
    'SUB': add_sub_op(0x9000, 0x0400),
    'CLR': default_un_op(0x4200),
    'NEG': default_un_op(0x4400),
    'MULS': mul_div_op(0xc1c0, 70),
    'MULU': mul_div_op(0xc0c0, 70),
    'DIVS': mul_div_op(0x81c0, 120),
    'DIVU': mul_div_op(0x80c0, 120),
    'ADDX': add_sub_x_op(0xd100),
    'SUBX': add_sub_x_op(0x9100),
    'ADDQ': add_sub_q_op(0),
    'SUBQ': add_sub_q_op(1),
    'CMP': {
        allowed_sizes: standard_sizes,
        operands: [OP_EA | OP_DREG | OP_AREG | OP_IMMEDIATE, OP_DREG | OP_AREG],
        cost: function (size, ops) {
            var cost = ops[0].cost(size) + ops[1].cost(size);
            if (ops[1].type == OP_DREG && size !== 'L') return BASE_COST + cost;
            return 6 + cost;
        },
        encode: function (size, ops) {
            return default_bin_encoding(size, ops, 0xb000, 0x0c00);
        }
    },
    'EXT': {
        allowed_sizes: ['W', 'L'],
        operands: [OP_DREG],
        cost: function (size, ops) {
            return 4;
        }
    },

    // Logical instructions
    'AND': default_bin_op(0xC000, 0x0200),
    'EOR': default_bin_op(0xB000, 0x0A00),
    'OR': default_bin_op(0x8000, 0x0000),
    'NOT': default_un_op(0x4600),

    // Shift and rotate instructions
    'ASL': default_rot_op(0xe000, 1),
    'ASR': default_rot_op(0xe000, 0),
    'LSL': default_rot_op(0xe008, 1),
    'LSR': default_rot_op(0xe008, 0),
    'ROL': default_rot_op(0xe018, 1),
    'ROR': default_rot_op(0xe018, 0),
    'SWAP': {
        allowed_sizes: ['W'],
        operands: [OP_DREG],
        cost: function (size, ops) {
            return BASE_COST;
        }
    },

    // Bit manipulation instructions
    'BTST': default_bit_op(0b00 << 6, 4, 6),
    'BCHG': default_bit_op(0b01 << 6, 8, 8),
    'BCLR': default_bit_op(0b10 << 6, 8, 10),
    'BSET': default_bit_op(0b11 << 6, 8, 8),

    // Program control instructions
    // Bcc added below
    'BRA': branch_op(0),
    'RTS': {
        allowed_sizes: [],
        operands: [],
        cost: function (size, ops) {
            return 16;
        },
        encode: function (size, ops) {
            return [0x4e75];
        }
    },
    'TST': {
        allowed_sizes: standard_sizes,
        operands: default_un_op().operands,
        cost: function (size, ops) {
            return BASE_COST + ops[0].cost(size);
        },
        encode: function (size, ops) {
            return default_un_encoding(size, ops, 0x4a00);
        }
    }
};

condition_codes.forEach(function (cc, index) {
    this['B' + cc] = branch_op(index);
    this['DB' + cc] = {
        allowed_sizes: ['W'],
        operands: [OP_DREG, OP_ABSW | OP_ABSL],
        cost: function (size, ops) {
            return 10; // Branch taken (cc false). Otherwise cost is 12 (cc true)/14(cc false)
        },
        encode: function (size, ops) {
            assert(ops[0].type === OP_DREG);
            return [0x50C8 | index << 8 | ops[0].val, 0xffff];
        }
    };
}, instruction_info);

class Instruction {
    constructor(name, size, operands) {
        this.info = instruction_info[name];
        if (!this.info) {
            throw new Error('Unknown instruction "' + name + '"');
        }
        if (size && this.info.allowed_sizes.indexOf(size) === -1) {
            throw new Error('Invalid instruction size for "' + name + '": ' + size);
        }
        if (this.info.operands.length != operands.length) {
            throw new Error('Invalid number of operands for "' + name + '": ' + operands.join(', '));
        }
        this.name = name;
        this.size = size;
        this.operands = operands;
    }

    toString() {
        return this.name + (this.info.allowed_sizes.length > 1 ? '.' + this.size : '') + '\t' + this.operands.join(', ');
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
        let op = operation;
        let dotpos = op.indexOf('.');
        if (dotpos !== -1) {
            opsize = op[dotpos + 1].toUpperCase();
            if (opsize == 'S') opsize = 'B';
            op = op.slice(0, dotpos);
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
                if (i) [line, ignored] = must_parse(line, re_operand_sep);
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
        this.label = label;
        this.instruction = instruction;
        this.comment = comment;
    }

    toString() {
        let str = this.label ? this.label : '';
        if (this.instruction) {
            str += '\t' + (this.instruction + '                        ').substring(0, 24);
        }
        if (this.comment && this.comment.length) {
            str += '\t' + this.comment;
        }
        return str;
    }

    static parse(line) {
        // LABEL   OPERATION    OPERAND,OPERAND,...   COMMENT

        // Remove trailing whitespace
        line = line.replace(/\s+$/, '');

        //
        // Parse optional label at start of line
        //
        let label = undefined;
        [line, label] = try_parse(line, re_label);
        if (label && label.slice(-1) === ':') {
            label = label.slice(0, -1);
        }

        //
        // Comment?
        //
        let comment = undefined;
        [line, comment] = try_parse(line, re_comment);
        let instruction = undefined;
        if (!comment && line.length) {
            //
            // Parse instruction and operand(s)
            //
            [line, instruction] = Instruction.parse(line);

            //
            // Rest of line is comment
            //
            if (line.length) {
                comment = line.replace(/^\s+/, '');
            }
        }

        return new Line(label, instruction, comment);
    }
}

function parse_lines(text) {
    return text.split('\n').map(function (l) {
        return Line.parse(l);
    });
};

function operand_to_code(op) {
    function expr_to_code(e) {
        return e.toString().substring(1);
    };
    switch (op.type) {
        case OP_DREG:
        case OP_AREG:
            return op.toString();
        case OP_INDIRECT:
            return '[A' + op.val + ']';
        case OP_POSTINCR:
            return '[A' + op.val + ', \'+\']';
        case OP_PREINCR:
            return '[A' + op.val + ', \'-\']';
        case OP_DISP16:
            return '[A' + op.val[1] + ', ' + op.val[0] + ']';
        case OP_INDEX:
            return '[A' + op.val[1] + ', D' + op.val[2] + ', ' + op.val[0] + ']';
        case OP_ABSW:
        case OP_ABSL:
            return '[' + op.val + ']';
        case OP_DISP16PC:
            return '[PC, ' + op.val[0] + ']';
        case OP_INDEXPC:
            return '[PC, D' + op.val[1] + ', ' + op.val[0] + ']';
        case OP_IMMEDIATE:
            return expr_to_code(op);
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
            } catch (e) {
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
    'Operand': Operand,
    'Instruction': Instruction,
    'Line': Line,
    'parse_lines': parse_lines,
    'to_code': to_code,
    'OP_DREG': OP_DREG,
    'OP_AREG': OP_AREG,
    'OP_INDIRECT': OP_INDIRECT,
    'OP_POSTINCR': OP_POSTINCR,
    'OP_PREINCR': OP_PREINCR,
    'OP_DISP16': OP_DISP16,
    'OP_INDEX': OP_INDEX,
    'OP_ABSW': OP_ABSW,
    'OP_ABSL': OP_ABSL,
    'OP_DISP16PC': OP_DISP16PC,
    'OP_INDEXPC': OP_INDEXPC,
    'OP_IMMEDIATE': OP_IMMEDIATE,
    'OP_REGLIST': OP_REGLIST,

    // For testing
    '_try_parse': try_parse,
    '_re_comment': re_comment,
    '_re_label': re_label,
    '_re_operation': re_operation,
    '_re_reglist': re_reglist,
    '_parse_reglist': parse_reglist,
    '_LitExpr': LitExpr,
    '_SymExpr': SymExpr,
    '_NegExpr': NegExpr,
    '_BinExpr': BinExpr
};

},{"assert":1}]},{},[9]);
