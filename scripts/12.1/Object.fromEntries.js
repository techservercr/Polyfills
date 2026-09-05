(function () {
// https://github.com/feross/fromentries
if (!Object.fromEntries) {
    Object.fromEntries = function (iterable) {
        return Array.prototype.reduce.call(iterable, function (obj, entry) {
            if (Object(entry) !== entry) {
                throw new TypeError('Iterator value ' + entry + ' is not an entry object');
            }
            var key = entry[0];
            var val = entry[1];
            obj[key] = val;
            return obj;
        }, {});
    };
}
})();
