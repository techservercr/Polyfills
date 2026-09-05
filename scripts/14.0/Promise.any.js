(function () {
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any
if (typeof Promise !== 'undefined' && typeof Promise.any !== 'function') {
    Promise.any = function (iterable) {
        var C = this;
        return new C(function (resolve, reject) {
            var items = Array.from(iterable);
            var remaining = items.length;
            var errors = new Array(remaining);
            if (remaining === 0) {
                reject(new AggregateError([], 'All promises were rejected'));
                return;
            }
            items.forEach(function (item, index) {
                C.resolve(item).then(resolve, function (reason) {
                    errors[index] = reason;
                    remaining -= 1;
                    if (remaining === 0) {
                        reject(new AggregateError(errors, 'All promises were rejected'));
                    }
                });
            });
        });
    };
}
})();
