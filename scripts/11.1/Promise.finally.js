(function () {
// https://gist.github.com/developit/e96097d9b657f2a2f3e588ffde433437
if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
    Promise.prototype.finally = function (callback) {
        var C = this.constructor || Promise;
        if (typeof callback !== 'function') {
            return this.then(callback, callback);
        }
        return this.then(
            function (value) {
                return C.resolve(callback()).then(function () {
                    return value;
                });
            },
            function (err) {
                return C.resolve(callback()).then(function () {
                    throw err;
                });
            }
        );
    };
}
})();
