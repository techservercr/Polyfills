// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError
(function (global) {
    if (typeof global.AggregateError === 'function') return;

    function AggregateError(errors, message) {
        if (!(this instanceof AggregateError)) {
            return new AggregateError(errors, message);
        }
        var msg = message === undefined ? '' : String(message);
        this.name = 'AggregateError';
        this.message = msg;
        this.errors = errors != null ? Array.prototype.slice.call(errors) : [];
        this.stack = new Error(msg).stack;
    }
    AggregateError.prototype = Object.create(Error.prototype);
    AggregateError.prototype.constructor = AggregateError;
    global.AggregateError = AggregateError;
})(typeof window !== 'undefined' ? window : self);
