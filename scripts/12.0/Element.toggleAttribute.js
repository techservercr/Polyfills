(function () {
// https://developer.mozilla.org/en-US/docs/Web/API/Element/toggleAttribute
if (window.Element && !Element.prototype.toggleAttribute) {
    Object.defineProperty(Element.prototype, 'toggleAttribute', {
        value: function (name, force) {
            'use strict';
            if (force !== undefined) force = !!force;
            if (this.hasAttribute(name)) {
                if (force) return true;
                this.removeAttribute(name);
                return false;
            }
            if (force === false) return false;
            this.setAttribute(name, '');
            return true;
        },
        writable: true,
        configurable: true
    });
}
})();
