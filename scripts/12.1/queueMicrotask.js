// https://github.com/feross/queue-microtask
// Native queueMicrotask is Safari 12.1 / iOS 12.1.
(function (global) {
    if (typeof global.queueMicrotask === 'function') return;

    var pending;
    global.queueMicrotask = function queueMicrotask(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError("Failed to execute 'queueMicrotask' on 'Window': parameter 1 is not of type 'Function'.");
        }
        (pending || (pending = Promise.resolve()))
            .then(callback)
            .catch(function (err) {
                setTimeout(function () {
                    throw err;
                }, 0);
            });
    };
})(typeof window !== 'undefined' ? window : self);
