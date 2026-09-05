(function () {
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
if (!Object.is) {
    Object.is = function (x, y) {
        if (x === y) {
            return x !== 0 || 1 / x === 1 / y;
        }
        return x !== x && y !== y;
    };
}
})();
