(function () {
// https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/abort_static
if (
    typeof AbortController !== 'undefined' &&
    typeof AbortSignal !== 'undefined' &&
    typeof AbortSignal.abort !== 'function'
) {
    AbortSignal.abort = function abort(reason) {
        var controller = new AbortController();
        if (arguments.length > 0) controller.abort(reason);
        else controller.abort();
        return controller.signal;
    };
}
})();
