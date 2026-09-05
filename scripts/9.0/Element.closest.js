(function () {
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = function (selectors) {
        var el = this;
        var matches;
        do {
            matches = el.matches || el.webkitMatchesSelector || el.msMatchesSelector;
            if (matches && matches.call(el, selectors)) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
})();
