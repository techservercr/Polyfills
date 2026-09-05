(function () {
// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.webkitMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.mozMatchesSelector;
}
})();
