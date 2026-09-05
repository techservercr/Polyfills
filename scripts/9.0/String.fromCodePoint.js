(function () {
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint
if (!String.fromCodePoint) {
    String.fromCodePoint = function () {
        var units = [];
        var result = '';
        var i;
        var code;
        var fromCharCode = String.fromCharCode;
        for (i = 0; i < arguments.length; i++) {
            code = Number(arguments[i]);
            if (!isFinite(code) || code < 0 || code > 0x10FFFF || Math.floor(code) !== code) {
                throw new RangeError('Invalid code point ' + arguments[i]);
            }
            if (code <= 0xFFFF) {
                units.push(code);
            } else {
                code -= 0x10000;
                units.push((code >> 10) + 0xD800, (code % 0x400) + 0xDC00);
            }
            if (units.length > 0x4000) {
                result += fromCharCode.apply(null, units);
                units.length = 0;
            }
        }
        return result + fromCharCode.apply(null, units);
    };
}
})();
