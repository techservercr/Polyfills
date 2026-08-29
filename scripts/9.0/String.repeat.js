// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
if (!String.prototype.repeat) {
    Object.defineProperty(String.prototype, 'repeat', {
        value: function (count) {
            if (this == null) {
                throw new TypeError('String.prototype.repeat called on null or undefined');
            }
            var str = String(this);
            count = +count;
            if (count != count) {
                count = 0;
            }
            if (count < 0) {
                throw new RangeError('repeat count must be non-negative');
            }
            if (count === Infinity) {
                throw new RangeError('repeat count must be less than infinity');
            }
            count = Math.floor(count);
            if (str.length === 0 || count === 0) {
                return '';
            }
            if (str.length * count >= 1 << 28) {
                throw new RangeError('repeat count must not overflow maximum string size');
            }
            var result = '';
            for (;;) {
                if (count & 1) {
                    result += str;
                }
                count >>>= 1;
                if (count === 0) {
                    break;
                }
                str += str;
            }
            return result;
        },
        writable: true,
        configurable: true
    });
}
