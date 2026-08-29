// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/values
if (!Array.prototype.values) {
    Object.defineProperty(Array.prototype, 'values', {
        value: function () {
            'use strict';
            if (this == null) {
                throw new TypeError('Array.prototype.values called on null or undefined');
            }
            var array = Object(this);
            var index = 0;
            return {
                next: function () {
                    var length = array.length >>> 0;
                    if (index >= length) {
                        return { done: true, value: undefined };
                    }
                    return { done: false, value: array[index++] };
                }
            };
        },
        writable: true,
        configurable: true
    });
}
