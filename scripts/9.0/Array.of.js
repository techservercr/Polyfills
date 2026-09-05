(function () {
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
if (!Array.of) {
    Array.of = function () {
        var i = 0;
        var len = arguments.length;
        var arr = new Array(len);
        while (i < len) {
            arr[i] = arguments[i];
            i++;
        }
        arr.length = len;
        return arr;
    };
}
})();
