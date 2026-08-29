// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
if (!Array.prototype.copyWithin) {
    Object.defineProperty(Array.prototype, 'copyWithin', {
        value: function (target, start) {
            if (this == null) {
                throw new TypeError('Array.prototype.copyWithin called on null or undefined');
            }
            var O = Object(this);
            var len = O.length >>> 0;
            var relativeTarget = target >> 0;
            var to = relativeTarget < 0 ? Math.max(len + relativeTarget, 0) : Math.min(relativeTarget, len);
            var relativeStart = start >> 0;
            var from = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
            var end = arguments.length > 2 ? arguments[2] : undefined;
            var relativeEnd = end === undefined ? len : end >> 0;
            var last = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
            var count = Math.min(last - from, len - to);
            var direction = 1;
            if (from < to && to < from + count) {
                direction = -1;
                from += count - 1;
                to += count - 1;
            }
            while (count > 0) {
                if (from in O) {
                    O[to] = O[from];
                } else {
                    delete O[to];
                }
                from += direction;
                to += direction;
                count--;
            }
            return O;
        },
        writable: true,
        configurable: true
    });
}
