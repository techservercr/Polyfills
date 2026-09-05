(function () {
// Claude
if (!Number.EPSILON) {
    Number.EPSILON = Math.pow(2, -52);
}

if (!Number.MAX_SAFE_INTEGER) {
    Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1; // 9007199254740991
}

if (!Number.MIN_SAFE_INTEGER) {
    Number.MIN_SAFE_INTEGER = -(Math.pow(2, 53) - 1); // -9007199254740991
}

if (!Number.NEGATIVE_INFINITY) {
    Number.NEGATIVE_INFINITY = -Infinity;
}

if (!Number.POSITIVE_INFINITY) {
    Number.POSITIVE_INFINITY = Infinity;
}

if (!Number.isFinite) {
    Number.isFinite = function (value) {
        return typeof value === 'number' && isFinite(value);
    };
}

if (!Number.isInteger) {
    Number.isInteger = function (value) {
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
    };
}

if (!Number.isSafeInteger) {
    Number.isSafeInteger = function (value) {
        return Number.isInteger(value) &&
            Math.abs(value) <= Number.MAX_SAFE_INTEGER;
    };
}
})();
