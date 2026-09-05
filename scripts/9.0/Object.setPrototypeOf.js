(function () {
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
if (typeof Object.setPrototypeOf !== 'function') {
    Object.defineProperty(Object, 'setPrototypeOf', {
        value: function (obj, proto) {
            if (obj == null) {
                throw new TypeError('Object.setPrototypeOf called on null or undefined');
            }
            if (proto !== null && typeof proto !== 'object' && typeof proto !== 'function') {
                throw new TypeError('Object prototype may only be an Object or null');
            }
            if (typeof obj !== 'object' && typeof obj !== 'function') {
                return obj;
            }
            obj.__proto__ = proto;
            if (Object.getPrototypeOf(obj) !== proto) {
                throw new TypeError('Object.setPrototypeOf: unable to set prototype');
            }
            return obj;
        },
        writable: true,
        configurable: true
    });
}
})();
