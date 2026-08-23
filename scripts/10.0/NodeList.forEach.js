// https://gist.github.com/developit/e96097d9b657f2a2f3e588ffde433437
// Old WebKit querySelectorAll returns StaticNodeList, which does not inherit
// from NodeList.prototype (iOS 8 / Safari 6-9).
(function () {
    var forEach = Array.prototype.forEach;
    if (!forEach) {
        return;
    }

    function patch(proto) {
        if (!proto || proto === Object.prototype || proto === Array.prototype) {
            return;
        }
        if (typeof proto.forEach !== 'function') {
            proto.forEach = forEach;
        }
    }

    if (typeof NodeList !== 'undefined') {
        patch(NodeList.prototype);
    }
    if (typeof HTMLCollection !== 'undefined') {
        patch(HTMLCollection.prototype);
    }

    try {
        if (document.querySelectorAll) {
            patch(Object.getPrototypeOf(document.querySelectorAll('*')));
        }
    } catch (e) {}
})();
