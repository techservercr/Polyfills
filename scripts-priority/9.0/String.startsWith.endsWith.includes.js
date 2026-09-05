(function () {
var $toString = Object.prototype.toString;
var $indexOf = String.prototype.indexOf;
var $lastIndexOf = String.prototype.lastIndexOf;

if (!String.prototype.startsWith) {
    // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-string.prototype.startswith
    function startsWith(search) {
        /*! http://mths.be/startswith v0.1.0 by @mathias */
        var string = String(this);
        if (this == null || $toString.call(search) == '[object RegExp]') {
            throw TypeError();
        }
        var stringLength = string.length;
        var searchString = String(search);
        var searchLength = searchString.length;
        var position = arguments.length > 1 ? arguments[1] : undefined;
        // `ToInteger`
        var pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
            pos = 0;
        }
        var start = Math.min(Math.max(pos, 0), stringLength);
        return $indexOf.call(string, searchString, pos) == start;
    }
    String.prototype.startsWith = startsWith;
}

if (!String.prototype.endsWith) {
    // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-string.prototype.endswith
    function endsWith(search) {
        /*! http://mths.be/endswith v0.1.0 by @mathias */
        var string = String(this);
        if (this == null || $toString.call(search) == '[object RegExp]') {
            throw TypeError();
        }
        var stringLength = string.length;
        var searchString = String(search);
        var searchLength = searchString.length;
        var pos = stringLength;
        if (arguments.length > 1) {
            var position = arguments[1];
            if (position !== undefined) {
                // `ToInteger`
                pos = position ? Number(position) : 0;
                if (isNaN(pos)) {
                    pos = 0;
                }
            }
        }
        var end = Math.min(Math.max(pos, 0), stringLength);
        var start = end - searchLength;
        if (start < 0) {
            return false;
        }
        return $lastIndexOf.call(string, searchString, start) == start;
    }
    String.prototype.endsWith = endsWith;
}

// https://github.com/alfaslash/string-includes-polyfill/blob/master/string-includes-polyfill.js
if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}
})();
